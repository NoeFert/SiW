import { canFlee } from './fleeCooldown.js';
import { deployUnit, isValidDeploymentPosition } from './deployment.js';
import {
  startInteraction, endInteraction, canStartDeploymentDuringPause, recordPlayerAction, toggleMainPause,
} from './pause.js';
import { tutorialAllows } from './tutorial.js';
import { isVictoryAcquired, playerSurrenders } from './battleEnd.js';

// Actions du joueur pendant une bataille.

// -- Déploiement (rules.md 2) --

// Pause d'interaction (rules.md 5.2), refusée pendant la sélection d'un ordre.
export function startDeploymentDrag(battle) {
  if (
    battle.outcome !== 'ongoing' || battle.orderSelection || !canStartDeploymentDuringPause(battle.pause)
    || battle.phaseTransition || !tutorialAllows(battle, 'deploy')
  ) {
    return false;
  }
  startInteraction(battle.pause, 'deploy');
  return true;
}

export function endDeploymentDrag(battle) {
  if (battle.pause.interaction === 'deploy') endInteraction(battle.pause);
}

export function deployPlayerUnit(battle, species, x, y, copyChoice) {
  const unitsOnField = battle.units.filter((u) => u.isOnField);
  if (!isValidDeploymentPosition(battle.grid, 'player', species, x, y, unitsOnField)) {
    return { success: false, reason: 'invalidPosition' };
  }
  const result = deployUnit(battle.playerDeployment, 'player', species, x, y, unitsOnField, copyChoice);
  if (result.success) {
    battle.units.push(result.unit);
    recordPlayerAction(battle.pause, 'deploy');
  }
  return result;
}

// -- Ordres (rules.md 5) --

export function issuePlayerAttack(unit, target) {
  unit.command = { type: 'attack', target };
  return true;
}

export function issuePlayerMoveTo(unit, x, y) {
  unit.command = { type: 'moveTo', x, y };
  return true;
}

// Refusé pendant le cooldown de la fuite (rules.md 5.1).
export function issuePlayerFlee(fleeState, currentTime, unit) {
  if (!canFlee(fleeState, currentTime)) return false;
  unit.command = { type: 'flee' };
  fleeState.lastFleeTime = currentTime;
  return true;
}

// -- Pause (rules.md 5.2) --

export function togglePlayerPause(battle) {
  if (battle.outcome !== 'ongoing' || battle.phaseTransition || !tutorialAllows(battle, 'mainPause')) return false;
  toggleMainPause(battle.pause);
  return true;
}

// -- Abandon (rules.md 8.2) --

// Pause d'interaction ; annule l'ordre en cours de sélection.
export function startSurrenderConfirm(battle) {
  battle.orderSelection = null;
  startInteraction(battle.pause, 'surrender');
}

export function endSurrenderConfirm(battle) {
  if (battle.pause.interaction === 'surrender') endInteraction(battle.pause);
}

// Impossible une fois la victoire acquise.
export function surrenderPlayer(battle) {
  if (battle.outcome !== 'ongoing' || isVictoryAcquired(battle)) return;
  endSurrenderConfirm(battle);
  playerSurrenders(battle);
}
