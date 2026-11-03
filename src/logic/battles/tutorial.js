import { canFlee } from './fleeCooldown.js';

// Moteur de tutoriel (technical.md 5.5). Le contenu est dans src/data/tutorials.js.

const CONDITIONS = {
  playerUnitOnField: (battle) => battle.units.some((u) => u.faction === 'player' && u.isOnField),
  elapsed: (battle, { seconds }) => battle.tutorial.stepSeconds >= seconds,
  continueClicked: (battle) => battle.tutorial.continued,
 // 1 = dernière vague du script IA
  enemyWaveDeployed: (battle, { fromEnd }) => battle.aiScriptState.nextIndex >= battle.enemyScript.length - fromEnd + 1,
  fleeAvailable: (battle) => canFlee(battle.playerFleeState, battle.elapsedSeconds),
  fleeIssued: (battle) => !canFlee(battle.playerFleeState, battle.elapsedSeconds),
  noGestureInProgress: (battle) => battle.pause.interaction === null && battle.orderSelection === null,
  fleeOrderChosen: (battle) => battle.orderSelection?.order === 'flee',
  noOrderChosen: (battle) => battle.orderSelection === null,
};

export function weakestPlayerUnit(battle) {
  let weakest = null;
  for (const unit of battle.units) {
    if (unit.faction === 'player' && unit.isOnField && (!weakest || unit.hp < weakest.hp)) weakest = unit;
  }
  return weakest;
}

export const TUTORIAL_CONDITION_TYPES = Object.keys(CONDITIONS);

function holds(battle, condition) {
  return CONDITIONS[condition.type](battle, condition);
}

function currentStep(battle) {
  const { tutorial } = battle;
  return tutorial.steps[tutorial.index];
}

function goTo(battle, index) {
  const { steps } = battle.tutorial;
  if (index >= steps.length) {
    battle.tutorial = null;
    battle.pause.tutorial = false;
    return;
  }
  Object.assign(battle.tutorial, {
    index, step: steps[index].id, stepSeconds: 0, messageDismissed: false, continued: false,
  });
  battle.pause.tutorial = steps[index].frozen;
}

export function startTutorial(battle, steps) {
  battle.tutorial = { steps };
  goTo(battle, 0);
}

export function tutorialAllows(battle, action) {
  const allows = battle.tutorial ? currentStep(battle).allows : null;
  return allows === null || allows.includes(action);
}

export function continueTutorial(battle) {
  if (!battle.tutorial || !currentStep(battle).continueButton) return;
  battle.tutorial.messageDismissed = true;
  battle.tutorial.continued = true;
  updateTutorial(battle, 0);
}

export function visibleTutorialStep(battle) {
  const { tutorial } = battle;
  if (!tutorial) return null;
  const step = currentStep(battle);
  if (!step.message || tutorial.messageDismissed) return null;
  if (step.messageSeconds !== undefined && tutorial.stepSeconds >= step.messageSeconds) return null;
  return step;
}

export function updateTutorial(battle, deltaSeconds) {
  const { tutorial } = battle;
  if (!tutorial) return;
  tutorial.stepSeconds += deltaSeconds;
  const step = currentStep(battle);

  const nextStep = tutorial.steps[tutorial.index + 1];
  const nextReady = (nextStep?.requires ?? []).every((condition) => holds(battle, condition));
  if (step.next.some((condition) => holds(battle, condition)) && nextReady) {
    goTo(battle, tutorial.index + 1);
    return;
  }
  if (step.back && holds(battle, step.back.when)) {
    goTo(battle, tutorial.steps.findIndex((s) => s.id === step.back.to));
  }
}
