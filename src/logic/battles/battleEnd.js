import { hasAnyReserves } from './deployment.js';
import { isEnemyScriptCleared } from './phases.js';

// Fin de bataille (rules.md 8) : toutes les règles qui décident si la bataille est finie et
// comment — victoire, défaite, match nul, abandon. Symétriques joueur/IA. Les réserves réelles
// (copies disponibles) vivent dans deployment.js ; ce module ne fait que les consulter. Pas de
// compte à rebours : un terrain vide avec des réserves ne met jamais fin à la bataille.

// rules.md 8.1 : la victoire est acquise à la mort du dernier ennemi, mais la bataille tourne
// encore ce temps (de bataille) avant l'écran de victoire.
export const VICTORY_DELAY_SECONDS = 2;

// État de fin de bataille d'un camp : `defeated` passe à vrai à l'abandon du joueur, ou quand
// l'IA a joué tout le script de la dernière phase.
export function createFactionState() {
  return { defeated: false };
}

// rules.md 8.2 : abandon explicite du joueur ; côté IA, fin de son script avec un terrain vide
// (8.1, voir updateOutcome).
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

// -- Sur une bataille ---------------------------------------------------------------------------

function unitsOnFieldOf(battle, faction) {
  return battle.units.filter((u) => u.faction === faction && u.isOnField);
}

function evaluateOutcome(battle) {
  return evaluateBattleOutcome(
    { factionState: battle.playerEndState, unitsOnField: unitsOnFieldOf(battle, 'player'), deploymentState: battle.playerDeployment },
    { factionState: battle.enemyEndState, unitsOnField: unitsOnFieldOf(battle, 'enemy'), deploymentState: battle.enemyDeployment },
  );
}

// rules.md 8.1 : victoire acquise, en attente de l'écran de victoire (VICTORY_DELAY_SECONDS).
export function isVictoryAcquired(battle) {
  return battle.victoryDelayRemaining !== null;
}

// rules.md 8.1 : plus aucune unité du joueur, ni sur le terrain ni en réserve.
export function isPlayerEliminated(battle) {
  return isEliminated(unitsOnFieldOf(battle, 'player'), battle.playerDeployment);
}

// rules.md 8.2 : le joueur abandonne. Le verdict est posé tout de suite : pendant une pause,
// aucun tick ne viendrait le calculer.
export function playerSurrenders(battle) {
  surrender(battle.playerEndState);
  battle.outcome = evaluateOutcome(battle);
}

// Appelé à chaque tick où le temps de bataille avance : met à jour `battle.outcome`.
// - Victoire acquise (rules.md 8.1) : plus rien ne change le verdict ; la bataille tourne encore
//   VICTORY_DELAY_SECONDS avant de passer à 'playerVictory'.
// - Dernière phase finie (rules.md 7.3 / 8.1) : l'IA est vaincue tout de suite, réserves ou non
//   (match nul si le joueur tombe au même instant).
// - Sinon, verdict selon les deux camps ; une victoire du joueur lance le délai de victoire.
export function updateOutcome(battle, deltaSeconds) {
  if (isVictoryAcquired(battle)) {
    battle.victoryDelayRemaining -= deltaSeconds;
    if (battle.victoryDelayRemaining <= 0) battle.outcome = 'playerVictory';
    return;
  }
  if (isEnemyScriptCleared(battle)) surrender(battle.enemyEndState);
  const verdict = evaluateOutcome(battle);
  if (verdict === 'playerVictory') battle.victoryDelayRemaining = VICTORY_DELAY_SECONDS;
  else battle.outcome = verdict;
}
