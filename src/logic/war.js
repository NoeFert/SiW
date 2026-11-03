// « Partir en guerre » (rules.md 11.7).
import { removeDeadFromArmy } from './army.js';
import { individualXpGains } from './levels.js';
import { countUnitsBySpecies, fallenLegendaryLevelAfter } from './ownedUnits.js';

export const REPLAY_REWARD_PERCENT = 0;

// 'won', 'available' ou 'locked'.
export function warBattleState(map, wonIds, battleId) {
  if (wonIds.includes(battleId)) return 'won';
  const node = map.nodes.find((n) => n.battle === battleId);
  if (node === map.nodes[0]) return 'available';
  const battleOf = new Map(map.nodes.map((n) => [n.id, n.battle]));
  const neighbours = map.links
    .filter((link) => link.includes(node.id))
    .map(([a, b]) => battleOf.get(a === node.id ? b : a));
  return neighbours.some((id) => wonIds.includes(id)) ? 'available' : 'locked';
}

export function isWarCompleted(battleIds, wonIds) {
  return battleIds.every((id) => wonIds.includes(id));
}

// 'legendary', 'flying' ou 'basic'.
export function invaderSpecies(enemyRoster, role) {
  return Object.values(enemyRoster).find(({ keywords }) => {
    if (role === 'legendary') return keywords.includes('legendary');
    if (role === 'flying') return keywords.includes('flying') && !keywords.includes('legendary');
    return keywords.length === 0;
  });
}

export function invadersRepelled(nodes, wonIds) {
  const invaders = nodes.filter((node) => node.invader);
  return {
    repelled: invaders.filter((node) => wonIds.includes(node.battle)).length,
    total: invaders.length,
  };
}

export function victoryReward(fullReward, alreadyWon) {
  return alreadyWon ? Math.floor((fullReward * REPLAY_REWARD_PERCENT) / 100) : fullReward;
}

// [{ species, lost }], espèces sans perte omises.
export function lossReport(roster, units, dead) {
  const lost = countUnitsBySpecies(roster, units.filter((unit) => dead.has(unit.id)));
  return Object.entries(roster)
    .map(([key, species]) => ({ species, lost: lost[key] }))
    .filter((row) => row.lost > 0);
}

// Défaite : les morts sont perdus quand même, sans XP ni récompense.
export function resolveWarDefeat(save, battleUnits, roster) {
  const { dead } = individualXpGains(battleUnits);
  const units = save.units.filter((unit) => !dead.has(unit.id));
  const fallenLegendaryLevel = fallenLegendaryLevelAfter(
    roster, save.units, dead, save.fallenLegendaryLevel,
  );
  return {
    save: { units, army: removeDeadFromArmy(save.army, units), fallenLegendaryLevel },
    lost: lossReport(roster, save.units, dead),
  };
}
