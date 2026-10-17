// Couche méta (rules.md 11.7) : « Partir en guerre ». Logique pure, sans Phaser ni
// localStorage (la sauvegarde vit dans src/state/profileStore.js).
import { removeDeadFromArmy } from './army.js';
import { individualXpGains } from './levels.js';
import { countUnitsBySpecies, fallenLegendaryLevelAfter } from './ownedUnits.js';

// rules.md 11.7 : au rejeu, aucune Spirit Stone (provisoire).
export const REPLAY_REWARD_PERCENT = 0;

// rules.md 11.7 : 'won' (déjà gagnée), 'available' ou 'locked'. Une bataille est disponible si
// elle est au départ de la map (son premier emplacement) ou si un emplacement relié par un lien
// porte une bataille gagnée. `map` : réseau de la map (warMap01.js) ; `wonIds` : batailles gagnées.
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

// rules.md 11.7 : espèce ennemie qui surmonte un emplacement d'envahisseur, selon son rôle —
// 'legendary' ([Légendaire]), 'flying' ([Vol], hors [Légendaire]) ou 'basic' (sans keyword).
export function invaderSpecies(enemyRoster, role) {
  return Object.values(enemyRoster).find(({ keywords }) => {
    if (role === 'legendary') return keywords.includes('legendary');
    if (role === 'flying') return keywords.includes('flying') && !keywords.includes('legendary');
    return keywords.length === 0;
  });
}

// rules.md 11.7 : objectif de la map, repousser ses envahisseurs — nombre d'emplacements
// d'envahisseur dont la bataille est gagnée, sur leur total.
export function invadersRepelled(nodes, wonIds) {
  const invaders = nodes.filter((node) => node.invader);
  return {
    repelled: invaders.filter((node) => wonIds.includes(node.battle)).length,
    total: invaders.length,
  };
}

// rules.md 11.7 : Spirit Stones d'une victoire — pleine la première fois, REPLAY_REWARD_PERCENT
// au rejeu (arrondi à l'entier inférieur ; 0 actuellement).
export function victoryReward(fullReward, alreadyWon) {
  return alreadyWon ? Math.floor((fullReward * REPLAY_REWARD_PERCENT) / 100) : fullReward;
}

// Unités perdues par espèce, dans l'ordre du roster, au format du bilan des pertes
// des écrans de victoire et de défaite : [{ species, lost }], espèces sans perte omises.
export function lossReport(roster, units, dead) {
  const lost = countUnitsBySpecies(roster, units.filter((unit) => dead.has(unit.id)));
  return Object.entries(roster)
    .map(([key, species]) => ({ species, lost: lost[key] }))
    .filter((row) => row.lost > 0);
}

// rules.md 11.7 : défaite, abandon ou match nul d'une bataille de « Partir en guerre » — les
// individus tués sont perdus quand même (retirés de la liste et de l'armée), le niveau du
// [Légendaire] mort est mémorisé (11.4) ; aucune XP, aucune récompense.
// `save` : { units, army, fallenLegendaryLevel }. Renvoie la nouvelle sauvegarde et le bilan.
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
