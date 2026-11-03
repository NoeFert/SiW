import Grid from './grid.js';
import { createAiScriptState } from './aiScript.js';
import { isFreeBetweenColumns } from './deployment.js';

// Batailles en plusieurs phases (rules.md 7.3).

export const PHASE_TRANSITION_SECONDS = { exit: 1.5, enter: 1.5 };

export function setUpcomingPhases(battle, phases) {
  battle.upcomingPhases = [...phases];
}

export function isEnemyScriptCleared(battle) {
  return battle.aiScriptState.nextIndex >= battle.enemyScript.length
    && !battle.units.some((u) => u.faction === 'enemy' && u.isOnField);
}

export function isPhaseOver(battle) {
  return battle.upcomingPhases.length > 0 && isEnemyScriptCleared(battle);
}

export function startPhaseTransition(battle) {
  battle.phaseTransition = { stage: 'exit', seconds: 0 };
  battle.pause.transition = true;
  battle.orderSelection = null;
}

function entryPosition(grid, unit, placed) {
  const halfWidth = Math.floor(grid.width / 2);
  for (let dy = 0; dy < grid.height; dy++) {
    for (const row of dy === 0 ? [unit.y] : [unit.y - dy, unit.y + dy]) {
      for (let x = 0; x < halfWidth; x++) {
        if (isFreeBetweenColumns(grid, unit.species, x, row, placed, 0, halfWidth)) return { x, y: row };
      }
    }
  }
  return null;
}

function enterNextPhase(battle) {
  const phase = battle.upcomingPhases.shift();
  battle.grid = new Grid(battle.grid.width, battle.grid.height, phase.obstacles);
  battle.enemyScript = phase.enemyScript;
  battle.aiScriptState = createAiScriptState();
  battle.phaseStartSeconds = battle.elapsedSeconds;
  battle.phaseIndex += 1;

  const army = battle.units.filter((u) => u.faction === 'player' && u.isOnField).sort((a, b) => b.x - a.x);
  const placed = [];
  for (const unit of army) {
    const position = entryPosition(battle.grid, unit, placed);
    if (position) Object.assign(unit, position);
    Object.assign(unit, {
      status: 'idle', target: null, command: null, attackTimer: 0, moveProgress: 0,
    });
    placed.push(unit);
  }
}

export function updatePhaseTransition(battle, deltaSeconds) {
  const transition = battle.phaseTransition;
  transition.seconds += deltaSeconds;
  if (transition.seconds < PHASE_TRANSITION_SECONDS[transition.stage]) return;
  if (transition.stage === 'exit') {
    enterNextPhase(battle);
    battle.phaseTransition = { stage: 'enter', seconds: 0 };
  } else {
    battle.phaseTransition = null;
    battle.pause.transition = false;
  }
}

export function phaseTransitionProgress(battle) {
  const transition = battle.phaseTransition;
  if (!transition) return null;
  return {
    stage: transition.stage,
    progress: Math.min(1, transition.seconds / PHASE_TRANSITION_SECONDS[transition.stage]),
  };
}
