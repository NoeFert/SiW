// rules.md 5.2 : deux familles de pause, indépendantes et combinables.
// - Pause principale : interrupteur manuel du joueur (bouton ⏸ / Espace).
// - Pause d'interaction : automatique pendant un geste (drag de déploiement, sélection d'un
//   ordre, confirmation d'abandon), levée à la fin ou à l'annulation du geste.
// S'y ajoutent le gel d'une étape du tutoriel (tutorial.js, bataille tutoriel seulement) et le
// changement de phase (phases.js). Le temps de bataille ne s'écoule que si aucune n'est active.
// Comme tous les compteurs (timers d'attaque, mouvements, cooldown de la fuite, script de l'IA)
// dépendent du temps de bataille, `tickBattle` n'a qu'à ne rien faire pour tous les geler.

// Choix par défaut encore à valider par le design (ui-battle-screen-decisions.md 2.3 / 3) :
// regroupés ici pour pouvoir les basculer sans toucher au reste du code.
export const PAUSE_DEFAULTS = {
  // true : plusieurs déploiements possibles pendant une même pause principale.
  multipleDeploymentsPerMainPause: true,
  // false : après un déploiement/un ordre pendant la pause principale, le jeu reste en pause.
  resumeAfterActionInMainPause: false,
};

// `tutorial` : gel posé par une étape du tutoriel (tutorial.js), levé quand le joueur a fait
// ce qui est demandé. `transition` : passage d'une phase de bataille à la suivante (phases.js).
export function createPauseState() {
  return {
    main: false, interaction: null, tutorial: false, transition: false, deploymentsThisMainPause: 0,
  }; // interaction : null | 'deploy' | 'order' | 'surrender'
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

// À appeler après un déploiement ou un ordre réussis.
export function recordPlayerAction(pause, kind) {
  if (!pause.main) return;
  if (kind === 'deploy') pause.deploymentsThisMainPause += 1;
  if (PAUSE_DEFAULTS.resumeAfterActionInMainPause) toggleMainPause(pause);
}
