import { createBattleFromDefinition, opposingFaction, resolvePhases } from '../../src/logic/battleSetup.js';
import { getReserve } from '../../src/logic/deployment.js';
import { tutorialAllows } from '../../src/logic/tutorial.js';
import { BATTLES } from '../../src/data/battles/index.js';
import { STARTER_TUTORIAL } from '../../src/data/tutorials.js';
import { WYRMS_ROSTER } from '../../src/data/wyrmsRoster.js';
import { UNDEAD_ROSTER } from '../../src/data/undeadRoster.js';

const PLAYER_UNITS = [
  { id: 'w1', species: 'lambtonWorm', xp: 0 },
  { id: 'w2', species: 'lambtonWorm', xp: 160 }, // niveau 3
];

describe('opposingFaction (rules.md 9)', () => {
  test('l\'IA joue la faction que le joueur n\'a pas choisie', () => {
    expect(opposingFaction('wyrms')).toBe('undead');
    expect(opposingFaction('undead')).toBe('wyrms');
  });
});

describe('resolvePhases (rules.md 7.3)', () => {
  test('chaque phase : obstacles lus dans le plan, script de la faction de l\'IA, fond', () => {
    const phases = resolvePhases(BATTLES.battleStartW01, 'undead');

    expect(phases).toHaveLength(2);
    expect(phases[1].enemyScript).toBe(BATTLES.battleStartW01.phases[1].enemyScripts.undead);
    expect(phases[1].background).toEqual({ image: 'battlefield-01', flipped: true });
    expect(phases[0].obstacles).toContainEqual({ x: 2, y: 2 }); // rocher '#' de la rangée 2
    expect(phases[0].obstacles).toContainEqual({ x: 7, y: 6, size: 2 }); // rocher '@@'
  });
});

describe('createBattleFromDefinition', () => {
  test('grille de la première zone, IA de la faction adverse, phases suivantes en attente', () => {
    const battle = createBattleFromDefinition(BATTLES.battleStartW01, 'wyrms', PLAYER_UNITS);

    expect(battle.grid.width).toBe(24);
    expect(battle.grid.height).toBe(14);
    expect(battle.grid.isObstacle(2, 2)).toBe(true);
    expect(battle.enemyScript).toBe(BATTLES.battleStartW01.phases[0].enemyScripts.undead);
    expect(battle.enemyDeployment.bySpecies.has(UNDEAD_ROSTER.athos)).toBe(true);
    expect(battle.upcomingPhases).toHaveLength(1);
  });

  test('réserve du joueur faite de ses individus, avec leur niveau (rules.md 2, 11.6)', () => {
    const battle = createBattleFromDefinition(BATTLES.battleStartW01, 'wyrms', PLAYER_UNITS);

    expect(getReserve(battle.playerDeployment, WYRMS_ROSTER.lambtonWorm).fresh).toBe(2);
    expect(getReserve(battle.playerDeployment, WYRMS_ROSTER.fafnir).fresh).toBe(0);
    expect(battle.playerDeployment.bySpecies.get(WYRMS_ROSTER.lambtonWorm).freshIndividuals[0].level).toBe(3);
  });

  test('démarre le tutoriel de la bataille (technical.md 5.5)', () => {
    const battle = createBattleFromDefinition(BATTLES.battleTuto, 'wyrms', PLAYER_UNITS);

    expect(battle.tutorial.steps).toBe(STARTER_TUTORIAL);
    expect(tutorialAllows(battle, 'mainPause')).toBe(false); // première étape : déployer seulement
  });

  test('sans tutoriel si demandé (simulations), ou si la bataille n\'en a pas', () => {
    expect(createBattleFromDefinition(BATTLES.battleTuto, 'wyrms', PLAYER_UNITS, { withTutorial: false }).tutorial)
      .toBeNull();
    expect(createBattleFromDefinition(BATTLES.battleStartW01, 'wyrms', PLAYER_UNITS).tutorial).toBeNull();
  });
});
