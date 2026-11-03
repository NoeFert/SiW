import BattleUnit from './battleUnit.js';
import { isPositionFree, occupiedCells } from './pathfinding.js';
import { individualLevel, levelDamage, levelStat } from '../levels.js';

// Plafond de points de présence par camp (rules.md 2).
export const PRESENCE_CAP = 150;

// Réserve d'un camp par espèce : copies fraîches et copies revenues de fuite (rules.md 2).
// `individuals` : individus du joueur ; sans eux (IA), copies anonymes de niveau 1.
export function createDeploymentState(roster, startingArmy, individuals = null) {
  const bySpecies = new Map();
  for (const [key, species] of Object.entries(roster)) {
    const freshIndividuals = individuals && individuals
      .filter((unit) => unit.species === key)
      .map((unit) => ({ individualId: unit.id, level: individualLevel(unit.xp) }))
      .sort((a, b) => b.level - a.level);
    bySpecies.set(species, {
      freshRemaining: freshIndividuals ? freshIndividuals.length : startingArmy[key],
      returning: [],
      freshIndividuals,
    });
  }
  return { bySpecies };
}

export function getPresenceUsed(faction, unitsOnField) {
  return unitsOnField
    .filter((u) => u.faction === faction)
    .reduce((sum, u) => sum + u.species.cost, 0);
}

export function getReserve(state, species) {
  const speciesState = state.bySpecies.get(species);
  return {
    fresh: speciesState.freshRemaining,
    returningHp: speciesState.returning.map((entry) => entry.hp),
  };
}

// Lignes de la tour : une par espèce, niveau et PV identiques.
export function getTowerRows(state, faction, unitsOnField) {
  const remainingBudget = PRESENCE_CAP - getPresenceUsed(faction, unitsOnField);
  const rows = [];
  for (const [species, speciesState] of state.bySpecies) {
    const legendaryOnField = species.keywords.includes('legendary')
      && unitsOnField.some((u) => u.faction === faction && u.species === species);

    const groups = new Map();
    const add = (level, hp) => {
      const key = `${level}:${hp}`;
      const group = groups.get(key) ?? { level, hp, count: 0 };
      group.count += 1;
      groups.set(key, group);
    };
    if (speciesState.freshIndividuals) {
      for (const { level } of speciesState.freshIndividuals) add(level, levelStat(species.maxHp, level));
    } else if (speciesState.freshRemaining > 0) {
      groups.set(`1:${species.maxHp}`, { level: 1, hp: species.maxHp, count: speciesState.freshRemaining });
    }
    for (const { level, hp } of speciesState.returning) add(level, hp);

    [...groups.values()]
      .sort((a, b) => b.level - a.level || b.hp - a.hp)
      .forEach(({ level, hp, count }) => {
        const maxHp = levelStat(species.maxHp, level);
        rows.push({
          species,
          copyChoice: { level, hp },
          count,
          level,
          hp,
          maxHp,
          damage: levelDamage(species.damage, level),
          cost: species.cost,
          keywords: species.keywords,
          attackType: species.attackType,
          wounded: hp < maxHp,
          deployable: species.cost <= remainingBudget && !legendaryOnField,
        });
      });
  }
  return rows;
}

// Cases de la tour : une par espèce, sauf les espèces de `ungroupedSpecies`.
export function groupTowerRows(rows, ungroupedSpecies) {
  const rowsBySpecies = new Map();
  for (const row of rows) {
    if (!rowsBySpecies.has(row.species)) rowsBySpecies.set(row.species, []);
    rowsBySpecies.get(row.species).push(row);
  }

  const displayed = [];
  for (const [species, speciesRows] of rowsBySpecies) {
    const groupable = speciesRows.length > 1;
    if (ungroupedSpecies.has(species)) {
      speciesRows.forEach((row, index) => displayed.push({
        ...row,
        minLevel: row.level,
        maxLevel: row.level,
        ...(index === 0 && { speciesHead: true, groupable, grouped: false }),
      }));
      continue;
    }
    const levels = speciesRows.map((row) => row.level);
    displayed.push({
      ...(speciesRows.find((row) => !row.wounded) ?? speciesRows[0]),
      count: speciesRows.reduce((sum, row) => sum + row.count, 0),
      minLevel: Math.min(...levels),
      maxLevel: Math.max(...levels),
      speciesHead: true,
      groupable,
      grouped: true,
    });
  }
  return displayed;
}

// Premier quart du terrain (rules.md 2).
export function playerDeploymentColumns(grid) {
  return Math.floor(grid.width / 4);
}

export function isFreeBetweenColumns(grid, species, x, y, unitsOnField, fromX, toX) {
  if (x < fromX || x + species.size > toX) return false;
  return isPositionFree(x, y, species.size, grid, occupiedCells(unitsOnField, null), false);
}

// Zone de déploiement du camp (rules.md 2).
export function isValidDeploymentPosition(grid, faction, species, x, y, unitsOnField) {
  return faction === 'player'
    ? isFreeBetweenColumns(grid, species, x, y, unitsOnField, 0, playerDeploymentColumns(grid))
    : isFreeBetweenColumns(grid, species, x, y, unitsOnField, Math.floor(grid.width / 2), grid.width);
}

// `level` null : plus haut niveau.
function takeFresh(speciesState, species, level) {
  if (speciesState.freshRemaining <= 0) return null;
  if (!speciesState.freshIndividuals) {
    if (level !== null && level !== 1) return null;
    speciesState.freshRemaining -= 1;
    return { hp: species.maxHp, level: 1, individualId: null };
  }
  const index = level === null ? 0 : speciesState.freshIndividuals.findIndex((entry) => entry.level === level);
  if (index === -1) return null;
  const [entry] = speciesState.freshIndividuals.splice(index, 1);
  speciesState.freshRemaining -= 1;
  return { hp: levelStat(species.maxHp, entry.level), level: entry.level, individualId: entry.individualId };
}

// `copyChoice` : 'fresh', { level, hp }, PV seuls (niveau 1), ou null (revenue de fuite d'abord).
function takeCopy(speciesState, species, copyChoice) {
  if (copyChoice === 'fresh') return takeFresh(speciesState, species, null);

  if (copyChoice !== null) {
    const { level, hp } = typeof copyChoice === 'number' ? { level: 1, hp: copyChoice } : copyChoice;
    const index = speciesState.returning.findIndex((entry) => entry.level === level && entry.hp === hp);
    if (index !== -1) return speciesState.returning.splice(index, 1)[0];
    return hp === levelStat(species.maxHp, level) ? takeFresh(speciesState, species, level) : null;
  }

  if (speciesState.returning.length > 0) return speciesState.returning.shift();
  return takeFresh(speciesState, species, null);
}

// Déploiement (rules.md 2). Ne vérifie pas la position.
export function deployUnit(state, faction, species, x, y, unitsOnField, copyChoice = null) {
  if (
    species.keywords.includes('legendary')
    && unitsOnField.some((u) => u.faction === faction && u.species === species)
  ) {
    return { success: false, reason: 'legendaryAlreadyDeployed' };
  }

  if (getPresenceUsed(faction, unitsOnField) + species.cost > PRESENCE_CAP) {
    return { success: false, reason: 'presenceCapExceeded' };
  }

  const copy = takeCopy(state.bySpecies.get(species), species, copyChoice);
  if (copy === null) return { success: false, reason: 'noCopiesLeft' };

  const unit = new BattleUnit(species, faction, x, y, copy.level, copy.individualId);
  unit.hp = copy.hp;

  return { success: true, unit };
}

// Une unité enfuie retourne en réserve avec ses PV (rules.md 2).
export function recordReturn(state, unit) {
  state.bySpecies.get(unit.species).returning.push({
    hp: unit.hp, level: unit.level, individualId: unit.individualId,
  });
}

// Déploiement scripté de l'IA : sans vérification (rules.md 7).
export function consumeFreshCopy(state, species) {
  const speciesState = state.bySpecies.get(species);
  speciesState.freshRemaining = Math.max(0, speciesState.freshRemaining - 1);
}

export function hasAnyReserves(state) {
  for (const speciesState of state.bySpecies.values()) {
    if (speciesState.freshRemaining > 0 || speciesState.returning.length > 0) return true;
  }
  return false;
}
