import { canFlee } from './fleeCooldown.js';
import { deployUnit, isValidDeploymentPosition } from './deployment.js';
import {
  startInteraction, endInteraction, canStartDeploymentDuringPause, recordPlayerAction, toggleMainPause,
} from './pause.js';
import { tutorialAllows } from './tutorial.js';
import { isVictoryAcquired, playerSurrenders } from './battleEnd.js';

// Commandant joueur : tout ce que le joueur peut faire pendant une bataille — déployer, donner
// des ordres, mettre en pause, abandonner. Appelé par la tour de commandement React et par les
// clics sur le terrain (via orderSelection.js, qui gère le déroulé d'un ordre en plusieurs
// clics). Chaque action vérifie qu'elle est permise (bataille en cours, pas de changement de
// phase, tutoriel…).

// -- Déploiement (rules.md 1, 2) ---------------------------------------------------------------

// rules.md 5.2 : un drag de déploiement déclenche la pause d'interaction. Refusé pendant la
// sélection d'un ordre (les deux gestes sont exclusifs).
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

// rules.md 1/2 : déploiement du joueur — position dans sa moitié du terrain et case libre,
// plafond de points, copies, limite du [Légendaire]. `copyChoice` ('fresh', des PV précis, ou
// omis pour le choix par défaut) laisse la tour garantir la copie exacte que le joueur a
// glissée — voir deployment.js. La pause tactique elle-même est gérée par startDeploymentDrag.
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

// -- Ordres (rules.md 5) -----------------------------------------------------------------------
// Un ordre attache une intention à l'unité (`unit.command`), exécutée ensuite tick par tick par
// unitBehavior.js ; elle remplace le comportement autonome de l'unité, et le dernier ordre donné
// remplace le précédent. Renvoie true si l'ordre est donné.

export function issuePlayerAttack(unit, target) {
  unit.command = { type: 'attack', target };
  return true;
}

export function issuePlayerMoveTo(unit, x, y) {
  unit.command = { type: 'moveTo', x, y };
  return true;
}

// rules.md 5.1 : refusé tant que le cooldown de la fuite court (fleeCooldown.js). `fleeState` :
// battle.playerFleeState ; `currentTime` : battle.elapsedSeconds.
export function issuePlayerFlee(fleeState, currentTime, unit) {
  if (!canFlee(fleeState, currentTime)) return false;
  unit.command = { type: 'flee' };
  fleeState.lastFleeTime = currentTime;
  return true;
}

// -- Pause (rules.md 5.2) ----------------------------------------------------------------------

// Bouton ⏸ / ▶ du joueur (bloqué pendant une étape figée du tutoriel et pendant un changement
// de phase).
export function togglePlayerPause(battle) {
  if (battle.outcome !== 'ongoing' || battle.phaseTransition || !tutorialAllows(battle, 'mainPause')) return false;
  toggleMainPause(battle.pause);
  return true;
}

// -- Abandon (rules.md 8.2) --------------------------------------------------------------------

// rules.md 5.2 : la boîte de confirmation d'abandon est une pause d'interaction — le joueur ne
// perd rien pendant qu'il hésite. Un ordre en cours de sélection est annulé (sans
// consommer de cooldown) : les deux interactions ne se cumulent pas.
export function startSurrenderConfirm(battle) {
  battle.orderSelection = null;
  startInteraction(battle.pause, 'surrender');
}

export function endSurrenderConfirm(battle) {
  if (battle.pause.interaction === 'surrender') endInteraction(battle.pause);
}

// rules.md 8.2, dernière clause : abandon explicite du joueur, possible à tout moment, sauf une
// fois la victoire acquise.
export function surrenderPlayer(battle) {
  if (battle.outcome !== 'ongoing' || isVictoryAcquired(battle)) return;
  endSurrenderConfirm(battle);
  playerSurrenders(battle);
}
