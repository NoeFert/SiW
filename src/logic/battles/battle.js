import { updateUnitBehaviors } from './unitBehavior.js';
import { createFleeState } from './fleeCooldown.js';
import { createAiScriptState, deployDueEnemies } from './aiScript.js';
import { createDeploymentState, recordReturn } from './deployment.js';
import {
  createFactionState, isPlayerEliminated, isVictoryAcquired, updateOutcome,
} from './battleEnd.js';
import { createPauseState, isBattleTimeRunning } from './pause.js';
import { updateTutorial } from './tutorial.js';
import { isPhaseOver, startPhaseTransition, updatePhaseTransition } from './phases.js';

// Moteur de bataille : crée la bataille et la fait avancer tick par tick.

// Objet modifié en place. `playerUnits` : individus du joueur engagés.
export function createBattle(grid, player, enemy, enemyScript, rng = Math.random, playerUnits = null) {
  return {
    grid,
    rng,
    units: [],
    elapsedSeconds: 0,
    outcome: 'ongoing',
    pause: createPauseState(),
    orderSelection: null,
    tutorial: null,
    phaseIndex: 0,
    phaseStartSeconds: 0,
    upcomingPhases: [],
    phaseTransition: null,
    victoryDelayRemaining: null, // rules.md 8.1
    playerFleeState: createFleeState(),
    aiScriptState: createAiScriptState(),
    enemyScript,
    playerDeployment: createDeploymentState(player.roster, player.startingArmy, playerUnits),
    enemyDeployment: createDeploymentState(enemy.roster, enemy.startingArmy),
    playerEndState: createFactionState(),
    enemyEndState: createFactionState(),
    onFieldById: new Map(), // détecte les fuites qui viennent d'aboutir
    abilityEvents: [], // évènements du dernier tick, pour le rendu
  };
}

// Une unité enfuie retourne en réserve (rules.md 2).
function returnFledUnitsToReserve(battle) {
  for (const unit of battle.units) {
    const wasOnField = battle.onFieldById.get(unit.id) ?? true;
    if (wasOnField && !unit.isOnField && unit.hasFled && unit.isAlive) {
      const deployment = unit.faction === 'player' ? battle.playerDeployment : battle.enemyDeployment;
      recordReturn(deployment, unit);
    }
    battle.onFieldById.set(unit.id, unit.isOnField);
  }
}

// À appeler à chaque frame, même en pause. Renvoie `outcome`.
export function tickBattle(battle, deltaSeconds) {
  if (battle.outcome !== 'ongoing') return battle.outcome;
  battle.abilityEvents = [];

  if (battle.phaseTransition) {
    updatePhaseTransition(battle, deltaSeconds);
    return battle.outcome;
  }

  if (!isBattleTimeRunning(battle.pause)) updateTutorial(battle, 0);
  if (!isBattleTimeRunning(battle.pause)) return battle.outcome;

  battle.elapsedSeconds += deltaSeconds;
  deployDueEnemies(battle);
  battle.abilityEvents = updateUnitBehaviors(battle.units, battle.grid, deltaSeconds);
  returnFledUnitsToReserve(battle);

  // Fin de phase (rules.md 7.3).
  if (isPhaseOver(battle)) {
    if (isPlayerEliminated(battle)) battle.outcome = 'enemyVictory';
    else startPhaseTransition(battle);
    return battle.outcome;
  }

  updateOutcome(battle, deltaSeconds);

  if (!isVictoryAcquired(battle)) updateTutorial(battle, deltaSeconds);
  return battle.outcome;
}
