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

// Moteur de bataille — chef d'orchestre. Ce fichier crée la bataille et la fait avancer tick
// par tick ; chaque règle vit dans le module de son rôle :
//
// 1. Déroulé de la bataille
//    - battleSetup.js : préparer une bataille à partir de sa définition (src/data/battles/)
//    - battle.js (ici) : l'objet bataille et la boucle `tickBattle`
//    - phases.js : passage d'une zone à la suivante (nouvelle grille, nouveau script de l'IA)
//    - pause.js : les pauses (joueur, tutoriel, changement de phase)
//    - tutorial.js : déroulé du tutoriel
// 2. Unités sur le terrain, identiques pour les deux camps
//    - unit.js, unitBehavior.js, pathfinding.js : états, PV, déplacements, attaques, aptitudes
//    - deployment.js : réserves des deux camps et règles de déploiement
// 3. Les deux commandants
//    - playerActions.js (+ orderSelection.js, fleeCooldown.js) : ce que fait le joueur —
//      déployer, donner des ordres, mettre en pause, abandonner
//    - aiScript.js : l'IA, qui déploie selon le script de la phase
// 4. Fin de bataille
//    - battleEnd.js : victoire, défaite, match nul, abandon

// L'objet bataille : un seul objet modifié en place, lu par la Scene Phaser et la tour React.
// `rng` : source d'aléa du choix de case de l'IA (rules.md 7.2), injectable en test.
// `playerUnits` : individus du joueur engagés (rules.md 2 et 11.6), qui forment sa réserve avec
// leur niveau ; sans eux, la réserve est faite des copies de units.md, niveau 1.
// Pour une bataille du jeu, passer plutôt par createBattleFromDefinition (battleSetup.js).
export function createBattle(grid, playerRoster, enemyRoster, enemyScript, rng = Math.random, playerUnits = null) {
  return {
    grid,
    rng,
    units: [],
    elapsedSeconds: 0,
    outcome: 'ongoing',
    pause: createPauseState(), // rules.md 5.2, voir pause.js
    orderSelection: null, // ordre en cours de sélection, voir orderSelection.js
    tutorial: null, // étape du tutoriel en cours (bataille tutoriel seulement), voir tutorial.js
    // Phases (rules.md 7.3, phases.js) : une seule par défaut. `enemyScript` est celui de la
    // phase en cours, compté depuis `phaseStartSeconds`.
    phaseIndex: 0,
    phaseStartSeconds: 0,
    upcomingPhases: [],
    phaseTransition: null,
    // rules.md 8.1 : temps restant avant que la victoire acquise ne devienne `outcome`, ou null.
    victoryDelayRemaining: null,
    playerFleeState: createFleeState(),
    aiScriptState: createAiScriptState(),
    enemyScript,
    playerDeployment: createDeploymentState(playerRoster, playerUnits),
    enemyDeployment: createDeploymentState(enemyRoster),
    playerEndState: createFactionState(),
    enemyEndState: createFactionState(),
    onFieldById: new Map(), // détecte les fuites qui viennent d'aboutir (transition on-field -> off-field)
    abilityEvents: [], // aptitudes déclenchées au dernier tick (rules.md 6), pour feedback visuel
  };
}

// rules.md 2 : une unité qui fuit et atteint le bord retourne en réserve (PV réduits conservés).
// Détecté par transition (elle était sur le terrain au tick précédent, ne l'est plus) plutôt
// que par un évènement explicite de unitBehavior.js, pour ne pas coupler ces deux modules.
// Une unité tuée au tick même où elle atteint le bord est morte, pas en fuite (rules.md 4.4) :
// sa copie est perdue, elle ne revient jamais en réserve.
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

// Fait avancer la bataille de `deltaSeconds` et renvoie le verdict à jour
// ('ongoing' | 'playerVictory' | 'enemyVictory' | 'draw'). À appeler à chaque frame, même en
// pause : le tutoriel doit pouvoir avancer d'étape pendant un gel. Pendant une pause
// (rules.md 5.2), rien d'autre n'avance : tous les compteurs restent gelés.
export function tickBattle(battle, deltaSeconds) {
  if (battle.outcome !== 'ongoing') return battle.outcome;
  battle.abilityEvents = [];

  // Changement de phase en cours (rules.md 7.3) : seul lui avance, en temps réel.
  if (battle.phaseTransition) {
    updatePhaseTransition(battle, deltaSeconds);
    return battle.outcome;
  }

  // Une étape figée du tutoriel peut se terminer (action faite) : la bataille repart dès ce tick.
  if (!isBattleTimeRunning(battle.pause)) updateTutorial(battle, 0);
  if (!isBattleTimeRunning(battle.pause)) return battle.outcome;

  // Le temps avance : l'IA déploie, les unités se battent, les fuites abouties rentrent en réserve.
  battle.elapsedSeconds += deltaSeconds;
  deployDueEnemies(battle);
  battle.abilityEvents = updateUnitBehaviors(battle.units, battle.grid, deltaSeconds);
  returnFledUnitsToReserve(battle);

  // rules.md 7.3 : fin d'une phase (pas de la bataille) -> l'armée passe dans la zone suivante.
  // Joueur éliminé au même instant : défaite immédiate, sans transition.
  if (isPhaseOver(battle)) {
    if (isPlayerEliminated(battle)) battle.outcome = 'enemyVictory';
    else startPhaseTransition(battle);
    return battle.outcome;
  }

  // rules.md 8 : la bataille est-elle finie ?
  updateOutcome(battle, deltaSeconds);

  // Les délais du tutoriel se comptent une fois le temps de ce tick écoulé. Victoire acquise :
  // le tutoriel n'avance plus (une étape figée bloquerait l'écran de victoire).
  if (!isVictoryAcquired(battle)) updateTutorial(battle, deltaSeconds);
  return battle.outcome;
}
