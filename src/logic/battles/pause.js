// Pauses (rules.md 5.2). Le temps de bataille ne s'écoule que si aucune n'est active.

export const PAUSE_DEFAULTS = {
  multipleDeploymentsPerMainPause: true,
  resumeAfterActionInMainPause: false,
};

export function createPauseState() {
  return {
    main: false, interaction: null, tutorial: false, transition: false, deploymentsThisMainPause: 0,
  }; // null | 'deploy' | 'order' | 'surrender'
}

export function isBattleTimeRunning(pause) {
  return !pause.main && pause.interaction === null && !pause.tutorial && !pause.transition;
}

export function toggleMainPause(pause) {
  pause.main = !pause.main;
  pause.deploymentsThisMainPause = 0;
}

export function startInteraction(pause, kind) {
  pause.interaction = kind;
}

export function endInteraction(pause) {
  pause.interaction = null;
}

export function canStartDeploymentDuringPause(pause) {
  return !pause.main || PAUSE_DEFAULTS.multipleDeploymentsPerMainPause || pause.deploymentsThisMainPause === 0;
}

export function recordPlayerAction(pause, kind) {
  if (!pause.main) return;
  if (kind === 'deploy') pause.deploymentsThisMainPause += 1;
  if (PAUSE_DEFAULTS.resumeAfterActionInMainPause) toggleMainPause(pause);
}
