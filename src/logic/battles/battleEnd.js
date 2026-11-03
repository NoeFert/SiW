import { hasAnyReserves } from './deployment.js';
import { isEnemyScriptCleared } from './phases.js';

// Fin de bataille (rules.md 8), symétrique joueur / IA.

export const VICTORY_DELAY_SECONDS = 2;

export function createFactionState() {
  return { defeated: false };
}

export function surrender(factionState) {
  factionState.defeated = true;
}

export function isEliminated(unitsOnField, deploymentState) {
  return unitsOnField.length === 0 && !hasAnyReserves(deploymentState);
}

// `side` = { factionState, unitsOnField, deploymentState }.
export function evaluateBattleOutcome(player, enemy) {
  const playerLost = player.factionState.defeated || isEliminated(player.unitsOnField, player.deploymentState);
  const enemyLost = enemy.factionState.defeated || isEliminated(enemy.unitsOnField, enemy.deploymentState);

  if (playerLost && enemyLost) return 'draw';
  if (enemyLost) return 'playerVictory';
  if (playerLost) return 'enemyVictory';
  return 'ongoing';
}

// -- Sur une bataille --

function unitsOnFieldOf(battle, faction) {
  return battle.units.filter((u) => u.faction === faction && u.isOnField);
}

function evaluateOutcome(battle) {
  return evaluateBattleOutcome(
    { factionState: battle.playerEndState, unitsOnField: unitsOnFieldOf(battle, 'player'), deploymentState: battle.playerDeployment },
    { factionState: battle.enemyEndState, unitsOnField: unitsOnFieldOf(battle, 'enemy'), deploymentState: battle.enemyDeployment },
  );
}

export function isVictoryAcquired(battle) {
  return battle.victoryDelayRemaining !== null;
}

export function isPlayerEliminated(battle) {
  return isEliminated(unitsOnFieldOf(battle, 'player'), battle.playerDeployment);
}

// Verdict immédiat : aucun tick ne passe pendant une pause.
export function playerSurrenders(battle) {
  surrender(battle.playerEndState);
  battle.outcome = evaluateOutcome(battle);
}

// Met à jour `battle.outcome`.
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
