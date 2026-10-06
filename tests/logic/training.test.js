import Grid from '../../src/logic/grid.js';
import {
  createBattle, deployPlayerUnit, issuePlayerFlee, setupTraining, tickBattle,
} from '../../src/logic/battle.js';
import { getReserve } from '../../src/logic/deployment.js';
import { TRAINING_DUMMY, TRAINING_ROSTER, TRAINING_COPIES } from '../../src/data/training.js';

// Bataille d'entraînement du menu devs (src/data/training.js) : outil de test, hors specs.
function trainingBattle() {
  const battle = createBattle(new Grid(24, 14), TRAINING_ROSTER, TRAINING_ROSTER, []);
  setupTraining(battle, TRAINING_DUMMY, TRAINING_COPIES);
  return battle;
}

const dummyOf = (battle) => battle.units.find((u) => u.faction === 'enemy');

describe('bataille d\'entraînement (menu devs)', () => {
  test('un seul ennemi, le mannequin, au centre du terrain', () => {
    const battle = trainingBattle();

    expect(battle.units).toHaveLength(1);
    expect(dummyOf(battle)).toMatchObject({ species: TRAINING_DUMMY, x: 11, y: 6 });
  });

  test('toutes les espèces des deux factions sont déployables, en nombreuses copies', () => {
    const battle = trainingBattle();

    for (const species of Object.values(TRAINING_ROSTER)) {
      expect(getReserve(battle.playerDeployment, species).fresh).toBe(TRAINING_COPIES);
    }
  });

  test('le mannequin ne bouge pas, n\'attaque pas et ne meurt pas', () => {
    const battle = trainingBattle();
    const { unit } = deployPlayerUnit(battle, TRAINING_ROSTER.lambtonWorm, 9, 6); // au contact

    for (let i = 0; i < 600; i++) tickBattle(battle, 0.1);

    const dummy = dummyOf(battle);
    expect({ x: dummy.x, y: dummy.y, isAlive: dummy.isAlive }).toEqual({ x: 11, y: 6, isAlive: true });
    expect(dummy.hp).toBeLessThan(TRAINING_DUMMY.maxHp); // il encaisse bien les coups
    expect(unit.hp).toBe(unit.maxHp);
  });

  test('la bataille ne se termine jamais, même sans unité du joueur sur le terrain', () => {
    const battle = trainingBattle();
    const { unit } = deployPlayerUnit(battle, TRAINING_ROSTER.lambtonWorm, 0, 0);
    issuePlayerFlee(battle, unit);

    for (let i = 0; i < 600; i++) tickBattle(battle, 0.1); // bien au-delà des 15 s de rules.md 8.2

    expect(unit.hasFled).toBe(true);
    expect(battle.outcome).toBe('ongoing');
  });
});
