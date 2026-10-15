// Couche méta du jeu normal (rules.md 11.2) : l'armée du joueur. Logique pure, sans Phaser ni
// localStorage (la sauvegarde vit dans src/state/profileStore.js).
import { individualLevel, sortByLevel } from './levels.js';

// rules.md 11.2 : plafond de coût d'une armée, en points de présence (distinct des 150 du terrain).
export const ARMY_PP_CAP = 500;
export const ARMY_NAME_MAX_LENGTH = 20;

// rules.md 11.2 : une armée est un nom et une liste d'identifiants d'individus.
export function createArmy(name, units) {
  return { name, unitIds: units.map((unit) => unit.id) };
}

// Individus possédés présents dans l'armée (rules.md 11.2).
export function armyUnits(army, units) {
  const ids = new Set(army?.unitIds ?? []);
  return units.filter((unit) => ids.has(unit.id));
}

export function armyCost(army, units, roster) {
  return armyUnits(army, units).reduce((sum, unit) => sum + roster[unit.species].cost, 0);
}

// rules.md 11.2 : le joueur coche un individu précis pour l'ajouter. Impossible s'il n'est pas
// possédé, s'il est déjà dans l'armée, ou si le coût dépasserait 500 (le coût est celui de
// l'espèce, quel que soit le niveau).
export function canAddToArmy(army, units, roster, unitId) {
  const unit = units.find((u) => u.id === unitId);
  return unit !== undefined && !army.unitIds.includes(unitId)
    && armyCost(army, units, roster) + roster[unit.species].cost <= ARMY_PP_CAP;
}

export function addToArmy(army, units, roster, unitId) {
  if (!canAddToArmy(army, units, roster, unitId)) return army;
  return { ...army, unitIds: [...army.unitIds, unitId] };
}

// rules.md 11.2 : retrait d'un individu précis, impossible pour le dernier de l'armée.
export function canRemoveFromArmy(army, units, unitId) {
  const members = armyUnits(army, units);
  return members.length > 1 && members.some((unit) => unit.id === unitId);
}

export function removeFromArmy(army, units, unitId) {
  if (!canRemoveFromArmy(army, units, unitId)) return army;
  return { ...army, unitIds: army.unitIds.filter((id) => id !== unitId) };
}

// rules.md 11.2 : sur l'écran Armées, les individus d'une espèce sont regroupés comme dans la tour
// de commandement — seuls les individus strictement identiques partagent un groupe : même niveau
// (hors bataille, les PV sont toujours pleins). Groupes par niveau décroissant ; `unitIds` triés
// par XP décroissante.
export function levelGroups(units) {
  const groups = new Map();
  for (const unit of sortByLevel(units)) {
    const level = individualLevel(unit.xp);
    if (!groups.has(level)) groups.set(level, { level, unitIds: [] });
    groups.get(level).unitIds.push(unit.id);
  }
  return [...groups.values()];
}

// Cases d'une espèce dans la grille des unités (technical.md 5.1), comme dans la tour de
// commandement : regroupée (`grouped`), toute l'espèce tient dans une case, niveaux confondus
// (`unitIds` du plus haut niveau au plus bas, donc l'individu le plus avancé en premier) ; sinon
// une case par groupe de `levelGroups`. `minLevel` / `maxLevel` : tranche des niveaux de la case.
export function speciesTiles(groups, grouped) {
  if (!grouped || groups.length < 2) {
    return groups.map((group) => ({ ...group, minLevel: group.level, maxLevel: group.level }));
  }
  return [{
    level: groups[0].level,
    minLevel: groups.at(-1).level,
    maxLevel: groups[0].level,
    unitIds: groups.flatMap((group) => group.unitIds),
  }];
}

// rules.md 11.2 : « + » sur un groupe ajoute l'individu le plus avancé en XP qui n'est pas encore
// dans l'armée ; « − » retire le moins avancé qui y est. null s'il n'y en a pas.
export function nextToAdd(army, group) {
  return group.unitIds.find((id) => !army.unitIds.includes(id)) ?? null;
}

export function nextToRemove(army, group) {
  return group.unitIds.findLast((id) => army.unitIds.includes(id)) ?? null;
}

// rules.md 11.2 : un individu mort est retiré de l'armée en même temps que de la liste.
export function removeDeadFromArmy(army, units) {
  const owned = new Set(units.map((unit) => unit.id));
  return { ...army, unitIds: army.unitIds.filter((id) => owned.has(id)) };
}

// rules.md 11.2 : nom de 1 à 20 caractères (comptés en caractères affichés, emojis compris),
// espaces de début et de fin retirés. Un nom vide ou fait d'espaces est refusé : l'ancien nom
// est conservé.
export function renameArmy(army, name) {
  const trimmed = name.trim();
  const length = [...trimmed].length;
  if (length === 0 || length > ARMY_NAME_MAX_LENGTH) return army;
  return { ...army, name: trimmed };
}
