import Grid from '../../../src/logic/battles/grid.js';
import { createBattle, tickBattle } from '../../../src/logic/battles/battle.js';
import {
  deployPlayerUnit, startDeploymentDrag, endDeploymentDrag, togglePlayerPause, surrenderPlayer,
} from '../../../src/logic/battles/playerActions.js';
import {
  cancelOrder, chooseOrder, selectUnit,
} from '../../../src/logic/battles/orderSelection.js';
import { isBattleTimeRunning } from '../../../src/logic/battles/pause.js';
import {
  startTutorial, continueTutorial, visibleTutorialStep, tutorialAllows, weakestPlayerUnit,
  TUTORIAL_CONDITION_TYPES,
} from '../../../src/logic/battles/tutorial.js';
import { STARTER_TUTORIAL } from '../../../src/data/tutorials.js';
import { BATTLES, TUTO_BATTLE_ID } from '../../../src/data/battles/index.js';
import { TEXT } from '../../../src/ui/strings.js';
import { testFaction } from './testFaction.js';

const ROSTER = {
  fighter: {
    name: 'Fighter', keywords: [], attackType: 'melee', size: 1,
    cost: 10, maxHp: 1000, damage: 1, moveSpeed: 0.1, attackSpeed: 1, range: null, copies: 5,
  },
};

// Script IA de 4 vagues : l'avant-dernière (index 2) arrive à t=20.
const SCRIPT = [0, 8, 20, 35].map((time) => ({ time, species: ROSTER.fighter }));
// Variante où l'avant-dernière vague (t=10) arrive avant la limite d'attente de 8 s.
const EARLY_WAVE_SCRIPT = [0, 5, 10, 35].map((time) => ({ time, species: ROSTER.fighter }));

function newTutorialBattle(script = SCRIPT) {
  const battle = createBattle(new Grid(10, 10), testFaction(ROSTER), testFaction(ROSTER), script, () => 0);
  startTutorial(battle, STARTER_TUTORIAL);
  return battle;
}

// Joue l'étape 1 (déploiement) puis laisse passer les 8 s de l'étape 1 (suite).
function reachPresenceStep(script) {
  const battle = newTutorialBattle(script);
  startDeploymentDrag(battle);
  const { unit } = deployPlayerUnit(battle, ROSTER.fighter, 0, 0);
  endDeploymentDrag(battle);
  // Pas de 0,5 s (exacts en binaire) pour que les délais tombent pile.
  for (let i = 0; i < 100 && battle.tutorial.step !== 'presence'; i++) tickBattle(battle, 0.5);
  return { battle, unit };
}

function reachFleeTutorial(script) {
  const { battle, unit } = reachPresenceStep(script);
  continueTutorial(battle);
  while (battle.tutorial.step === 'waitingForWave') tickBattle(battle, 0.5);
  return { battle, unit };
}

describe('tutoriel — étape 1 : déployer (technical.md 5.5)', () => {
  test('la bataille est figée, seul le déploiement est permis', () => {
    const battle = newTutorialBattle();

    tickBattle(battle, 5);

    expect(battle.elapsedSeconds).toBe(0);
    expect(battle.units).toHaveLength(0); // l'IA n'a pas encore déployé sa vague de t=0
    expect(visibleTutorialStep(battle).id).toBe('deploy');
    expect(togglePlayerPause(battle)).toBe(false);
    expect(chooseOrder(battle, 'flee')).toBe(false);
    expect(startDeploymentDrag(battle)).toBe(true);
  });

  test('le premier déploiement relance la bataille', () => {
    const battle = newTutorialBattle();
    startDeploymentDrag(battle);
    deployPlayerUnit(battle, ROSTER.fighter, 0, 0);
    endDeploymentDrag(battle);

    tickBattle(battle, 1);

    expect(battle.tutorial.step).toBe('autonomous');
    expect(battle.elapsedSeconds).toBe(1);
  });
});

describe('tutoriel — étape 1 (suite) : combat autonome', () => {
  test('le message reste affiché 5 s au plus, la bataille tourne', () => {
    const battle = newTutorialBattle();
    startDeploymentDrag(battle);
    deployPlayerUnit(battle, ROSTER.fighter, 0, 0);
    endDeploymentDrag(battle);
    tickBattle(battle, 0.1);

    tickBattle(battle, 4.5);
    expect(visibleTutorialStep(battle).id).toBe('autonomous');
    tickBattle(battle, 0.5);
    expect(visibleTutorialStep(battle)).toBeNull();
    expect(isBattleTimeRunning(battle.pause)).toBe(true);
  });

  test('[Continuer] ferme le message plus tôt, sans avancer l\'étape', () => {
    const battle = newTutorialBattle();
    startDeploymentDrag(battle);
    deployPlayerUnit(battle, ROSTER.fighter, 0, 0);
    endDeploymentDrag(battle);
    tickBattle(battle, 0.1);

    continueTutorial(battle);

    expect(visibleTutorialStep(battle)).toBeNull();
    expect(battle.tutorial.step).toBe('autonomous');
  });
});

describe('tutoriel — étape 2 : points de présence', () => {
  test('arrive 8 s après le déploiement et fige tout jusqu\'à [Continuer]', () => {
    const { battle } = reachPresenceStep();

    expect(battle.tutorial.step).toBe('presence');
    expect(battle.elapsedSeconds).toBeCloseTo(8, 5); // l'étape 1 (suite) démarre à t=0
    const elapsed = battle.elapsedSeconds;
    tickBattle(battle, 3);
    expect(battle.elapsedSeconds).toBe(elapsed);
    expect(startDeploymentDrag(battle)).toBe(false);
    expect(chooseOrder(battle, 'flee')).toBe(false);

    continueTutorial(battle);
    tickBattle(battle, 1);

    expect(battle.tutorial.step).toBe('waitingForWave');
    expect(battle.elapsedSeconds).toBe(elapsed + 1);
    expect(startDeploymentDrag(battle)).toBe(true); // retour au jeu normal
  });
});

describe('tutoriel — étape 3 : battre en retraite', () => {
  test('se déclenche à l\'avant-dernière vague de l\'IA si elle arrive avant 8 s d\'attente', () => {
    const { battle } = reachFleeTutorial(EARLY_WAVE_SCRIPT);

    expect(battle.tutorial.step).toBe('flee');
    expect(battle.aiScriptState.nextIndex).toBe(EARLY_WAVE_SCRIPT.length - 1);
    expect(battle.elapsedSeconds).toBeGreaterThanOrEqual(10);
    expect(battle.elapsedSeconds).toBeLessThan(8 + 8);
    expect(isBattleTimeRunning(battle.pause)).toBe(false);
    expect(startDeploymentDrag(battle)).toBe(false);
  });

  test('sinon, se déclenche au bout de 8 s d\'attente au plus', () => {
    const { battle } = reachFleeTutorial(); // avant-dernière vague à t=20

    expect(battle.tutorial.step).toBe('flee');
    expect(battle.aiScriptState.nextIndex).toBeLessThan(SCRIPT.length - 1);
    expect(battle.elapsedSeconds).toBeCloseTo(8 + 8, 5);
    expect(battle.elapsedSeconds).toBeLessThan(20);
  });

  test('attend qu\'une unité du joueur soit sur le terrain', () => {
    const { battle, unit } = reachPresenceStep();
    continueTutorial(battle);
    unit.hasFled = true; // plus aucune unité du joueur sur le terrain

    for (let i = 0; i < 60; i++) tickBattle(battle, 0.5);

    expect(battle.tutorial.step).toBe('waitingForWave');
  });

  test('d\'abord, seul l\'ordre Fuir est permis ; la main ne montre que le bouton Fuir', () => {
    const { battle, unit } = reachFleeTutorial();
    expect(battle.tutorial.step).toBe('flee');
    expect(visibleTutorialStep(battle).hand).toEqual(['fleeOrder']);

    expect(chooseOrder(battle, 'attack')).toBe(false);
    expect(chooseOrder(battle, 'move')).toBe(false);
    expect(selectUnit(battle, unit)).toBe(false); // aucun ordre choisi
    expect(chooseOrder(battle, 'flee')).toBe(true);
  });

  test('Fuir cliqué : étape suivante, toujours figée, la main montre l\'unité la plus blessée', () => {
    const { battle } = reachFleeTutorial();
    chooseOrder(battle, 'flee');
    tickBattle(battle, 0.1);

    expect(battle.tutorial.step).toBe('fleeUnit');
    expect(visibleTutorialStep(battle).message).toBe('fleeUnit');
    expect(visibleTutorialStep(battle).hand).toEqual(['weakestPlayerUnit']);
    expect(isBattleTimeRunning(battle.pause)).toBe(false);
  });

  test('l\'unité choisie fuit : fin du tutoriel, la bataille reprend aussitôt', () => {
    const { battle, unit } = reachFleeTutorial();
    chooseOrder(battle, 'flee');
    tickBattle(battle, 0.1);

    expect(selectUnit(battle, unit)).toBe(true);
    expect(unit.command).toEqual({ type: 'flee' });
    const elapsed = battle.elapsedSeconds;
    tickBattle(battle, 0.5);

    expect(battle.tutorial).toBeNull(); // tutoriel terminé
    expect(battle.elapsedSeconds).toBe(elapsed + 0.5); // reprise dès ce tick
    expect(togglePlayerPause(battle)).toBe(true);
  });

  test('annuler Fuir ramène à la première étape de la retraite, toujours figée', () => {
    const { battle } = reachFleeTutorial();
    chooseOrder(battle, 'flee');
    tickBattle(battle, 0.1);

    cancelOrder(battle);
    tickBattle(battle, 0.1);

    expect(battle.tutorial.step).toBe('flee');
    expect(isBattleTimeRunning(battle.pause)).toBe(false);
  });

  test('re-cliquer Fuir annule aussi et ramène à la première étape', () => {
    const { battle } = reachFleeTutorial();
    chooseOrder(battle, 'flee');
    tickBattle(battle, 0.1);

    chooseOrder(battle, 'flee');
    tickBattle(battle, 0.1);

    expect(battle.tutorial.step).toBe('flee');
  });
});

describe('tutoriel — victoire acquise (rules.md 8.1)', () => {
  test('pendant les 2 s avant l\'écran de victoire, l\'étape de retraite ne se déclenche plus', () => {
    const { battle } = reachPresenceStep();
    continueTutorial(battle);
    tickBattle(battle, 0.5); // étape d'attente : la bataille tourne
    battle.aiScriptState.nextIndex = battle.enemyScript.length; // script de l'IA fini...
    for (const u of battle.units) if (u.faction === 'enemy') u.hp = 0; // ... et terrain ennemi vide
    tickBattle(battle, 0.5); // victoire acquise

    tickBattle(battle, 1);
    tickBattle(battle, 1);

    expect(battle.tutorial.step).toBe('waitingForWave');
    expect(battle.outcome).toBe('playerVictory');
  });
});

describe('tutoriel — unité la plus blessée (cible de la main)', () => {
  test('l\'unité du joueur sur le terrain qui a le moins de PV actuels', () => {
    const battle = newTutorialBattle();
    startDeploymentDrag(battle);
    const { unit: first } = deployPlayerUnit(battle, ROSTER.fighter, 0, 0);
    const { unit: second } = deployPlayerUnit(battle, ROSTER.fighter, 0, 2);
    const { unit: third } = deployPlayerUnit(battle, ROSTER.fighter, 0, 4);
    endDeploymentDrag(battle);
    first.hp = 500;
    second.hp = 200;
    third.hp = 900;

    expect(weakestPlayerUnit(battle)).toBe(second);
  });

  test('égalité : la première déployée ; ignore les unités hors terrain et ennemies', () => {
    const battle = newTutorialBattle();
    startDeploymentDrag(battle);
    const { unit: first } = deployPlayerUnit(battle, ROSTER.fighter, 0, 0);
    const { unit: second } = deployPlayerUnit(battle, ROSTER.fighter, 0, 2);
    const { unit: gone } = deployPlayerUnit(battle, ROSTER.fighter, 0, 4);
    endDeploymentDrag(battle);
    first.hp = 300;
    second.hp = 300;
    gone.hp = 1;
    gone.hasFled = true;

    expect(weakestPlayerUnit(battle)).toBe(first);
    expect(weakestPlayerUnit(newTutorialBattle())).toBeNull();
  });
});

describe('tutoriel — abandon', () => {
  test('reste possible pendant une étape figée (rules.md 8.2)', () => {
    const battle = newTutorialBattle();

    surrenderPlayer(battle);

    expect(battle.outcome).toBe('enemyVictory');
  });
});

describe('données des tutoriels et des batailles (src/data/)', () => {
  const allTutorials = [STARTER_TUTORIAL];
  const allSteps = allTutorials.flat();

  test('la bataille tutoriel : une seule phase, tutoriel de départ, récompense de 50 (rules.md 11.7)', () => {
    const { phases, tutorial, reward } = BATTLES[TUTO_BATTLE_ID];
    expect(phases).toHaveLength(1);
    expect(tutorial).toBe(STARTER_TUTORIAL);
    expect(reward).toBe(50);
  });

  test('chaque condition utilisée existe dans le moteur', () => {
    const used = allSteps.flatMap((step) => [...step.next, ...(step.requires ?? []), ...(step.back ? [step.back.when] : [])]);
    for (const condition of used) expect(TUTORIAL_CONDITION_TYPES).toContain(condition.type);
  });

  test('chaque message a un texte, et chaque retour vise une étape existante', () => {
    for (const step of allSteps) {
      if (step.message) expect(TEXT.tutorial[step.message]).toEqual(expect.any(String));
    }
    for (const tutorial of allTutorials) {
      const ids = tutorial.map((step) => step.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const step of tutorial) if (step.back) expect(ids).toContain(step.back.to);
    }
  });
});

describe('moteur de tutoriel — réutilisable pour une autre bataille', () => {
  test('déroule n\'importe quelle liste d\'étapes, puis rend la main au jeu', () => {
    const battle = createBattle(new Grid(10, 10), testFaction(ROSTER), testFaction(ROSTER), SCRIPT, () => 0);
    startTutorial(battle, [
      { id: 'wait', frozen: false, allows: null, next: [{ type: 'elapsed', seconds: 2 }] },
      { id: 'read', frozen: true, allows: [], message: 'presence', continueButton: true, next: [{ type: 'continueClicked' }] },
    ]);

    tickBattle(battle, 2);
    expect(battle.tutorial.step).toBe('read');
    expect(tutorialAllows(battle, 'deploy')).toBe(false);

    continueTutorial(battle);
    expect(battle.tutorial).toBeNull();
    expect(tutorialAllows(battle, 'deploy')).toBe(true);
    expect(isBattleTimeRunning(battle.pause)).toBe(true);
  });

  test('sans tutoriel, aucune action n\'est bloquée', () => {
    const battle = createBattle(new Grid(10, 10), testFaction(ROSTER), testFaction(ROSTER), SCRIPT, () => 0);

    expect(battle.tutorial).toBeNull();
    expect(tutorialAllows(battle, 'deploy')).toBe(true);
    expect(chooseOrder(battle, 'attack')).toBe(true);
  });
});
