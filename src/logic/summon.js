// Spirit Stones et invocation (rules.md 11.3 et 11.4).
import { createUnit, isLegendary } from './ownedUnits.js';
import { individualXpForLevel } from './levels.js';

// Provisoire (rules.md 10).
export const STARTING_SPIRIT_STONES = 0;

// Provisoire (rules.md 10).
export const SUMMON_PRICE_FACTOR = 1;
export const LEGENDARY_PRICE_MULTIPLIER = 1;

// 'summon', 'resummon' ([Légendaire] mort) ou 'alreadyOwned'.
export function summonAction(species, ownedCount) {
  if (!isLegendary(species)) return 'summon';
  return ownedCount > 0 ? 'alreadyOwned' : 'resummon';
}

export function summonPrice(species) {
  const multiplier = isLegendary(species) ? LEGENDARY_PRICE_MULTIPLIER : 1;
  return species.cost * SUMMON_PRICE_FACTOR * multiplier;
}

// +25 % par niveau au-delà du 1 (rules.md 11.4).
export function resummonPrice(species, level) {
  return Math.floor((summonPrice(species) * (3 + level)) / 4);
}

export function canSummon(species, ownedCount, spiritStones, level = 1, maxLevel = 1) {
  const action = summonAction(species, ownedCount);
  if (action === 'alreadyOwned') return false;
  if (level !== 1 && (action !== 'resummon' || level < 1 || level > maxLevel)) return false;
  return spiritStones >= resummonPrice(species, level);
}

// Renvoie la nouvelle liste et le nouveau solde, ou `null`.
export function summon(roster, units, spiritStones, speciesKey, level = 1, fallenLevel = 1) {
  const species = roster[speciesKey];
  const owned = units.filter((unit) => unit.species === speciesKey).length;
  if (!canSummon(species, owned, spiritStones, level, fallenLevel)) return null;
  return {
    units: [...units, createUnit(speciesKey, individualXpForLevel(level))],
    spiritStones: spiritStones - resummonPrice(species, level),
  };
}

export function maxSummonCount(species, spiritStones) {
  const affordable = Math.floor(spiritStones / summonPrice(species));
  return isLegendary(species) ? Math.min(affordable, 1) : affordable;
}

// Tout ou rien.
export function summonMany(roster, units, spiritStones, speciesKey, count) {
  if (count < 1 || isLegendary(roster[speciesKey])) return null;
  let result = { units, spiritStones };
  for (let i = 0; i < count; i += 1) {
    result = summon(roster, result.units, result.spiritStones, speciesKey);
    if (!result) return null;
  }
  return result;
}
