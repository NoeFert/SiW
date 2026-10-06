import { hasAnyReserves } from './deployment.js';

// rules.md 8 : conditions de fin de bataille, symétriques joueur/IA. Les réserves réelles
// (copies disponibles par unité) vivent dans deployment.js — ce module ne fait que les
// consulter via `hasAnyReserves`. Pas de compte à rebours : un terrain vide avec des réserves
// ne met jamais fin à la bataille.

export function createFactionState() {
  return { defeated: false };
}

// rules.md 8.2 : abandon explicite du joueur ; côté IA, fin de son script avec un terrain vide
// (8.1, voir tickBattle).
export function surrender(factionState) {
  factionState.defeated = true;
}

// rules.md 8.1 : plus aucune unité sur le terrain ni en réserve — défaite permanente immédiate.
export function isEliminated(unitsOnField, deploymentState) {
  return unitsOnField.length === 0 && !hasAnyReserves(deploymentState);
}

// rules.md 8 : verdict global. `side` = { factionState, unitsOnField, deploymentState }.
// Les deux camps perdent au même tick : match nul (8.1, 7.3).
export function evaluateBattleOutcome(player, enemy) {
  const playerLost = player.factionState.defeated || isEliminated(player.unitsOnField, player.deploymentState);
  const enemyLost = enemy.factionState.defeated || isEliminated(enemy.unitsOnField, enemy.deploymentState);

  if (playerLost && enemyLost) return 'draw';
  if (enemyLost) return 'playerVictory';
  if (playerLost) return 'enemyVictory';
  return 'ongoing';
}
