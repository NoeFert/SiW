// Armée du joueur (rules.md 11.2).
import { individualLevel, sortByLevel } from './levels.js';

// Plafond de coût d'une armée (≠ 150 du terrain).
export const ARMY_PP_CAP = 500;
export const ARMY_NAME_MAX_LENGTH = 20;

export function createArmy(name, units) {
  return { name, unitIds: units.map((unit) => unit.id) };
}

export function armyUnits(army, units) {
  const ids = new Set(army?.unitIds ?? []);
  return units.filter((unit) => ids.has(unit.id));
}

export function armyCost(army, units, roster) {
  return armyUnits(army, units).reduce((sum, unit) => sum + roster[unit.species].cost, 0);
}

export function canAddToArmy(army, units, roster, unitId) {
  const unit = units.find((u) => u.id === unitId);
  return unit !== undefined && !army.unitIds.includes(unitId)
    && armyCost(army, units, roster) + roster[unit.species].cost <= ARMY_PP_CAP;
}

export function addToArmy(army, units, roster, unitId) {
  if (!canAddToArmy(army, units, roster, unitId)) return army;
  return { ...army, unitIds: [...army.unitIds, unitId] };
}

// Impossible pour le dernier individu de l'armée.
export function canRemoveFromArmy(army, units, unitId) {
  const members = armyUnits(army, units);
  return members.length > 1 && members.some((unit) => unit.id === unitId);
}

export function removeFromArmy(army, units, unitId) {
  if (!canRemoveFromArmy(army, units, unitId)) return army;
  return { ...army, unitIds: army.unitIds.filter((id) => id !== unitId) };
}

// Groupes d'individus de même niveau, niveaux décroissants.
export function levelGroups(units) {
  const groups = new Map();
  for (const unit of sortByLevel(units)) {
    const level = individualLevel(unit.xp);
    if (!groups.has(level)) groups.set(level, { level, unitIds: [] });
    groups.get(level).unitIds.push(unit.id);
  }
  return [...groups.values()];
}

// Cases d'une espèce : une seule si `grouped`, sinon une par groupe.
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

// « + » ajoute le plus avancé hors armée, « − » retire le moins avancé.
export function nextToAdd(army, group) {
  return group.unitIds.find((id) => !army.unitIds.includes(id)) ?? null;
}

export function nextToRemove(army, group) {
  return group.unitIds.findLast((id) => army.unitIds.includes(id)) ?? null;
}

export function removeDeadFromArmy(army, units) {
  const owned = new Set(units.map((unit) => unit.id));
  return { ...army, unitIds: army.unitIds.filter((id) => owned.has(id)) };
}

// 1 à 20 caractères affichés ; un nom vide garde l'ancien.
export function renameArmy(army, name) {
  const trimmed = name.trim();
  const length = [...trimmed].length;
  if (length === 0 || length > ARMY_NAME_MAX_LENGTH) return army;
  return { ...army, name: trimmed };
}
