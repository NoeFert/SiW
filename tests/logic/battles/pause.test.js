import Grid from '../../../src/logic/battles/grid.js';
import BattleUnit from '../../../src/logic/battles/battleUnit.js';
import { createBattle, tickBattle } from '../../../src/logic/battles/battle.js';
import {
  deployPlayerUnit, startDeploymentDrag, endDeploymentDrag, surrenderPlayer, startSurrenderConfirm, endSurrenderConfirm,
} from '../../../src/logic/battles/playerActions.js';
import { toggleMainPause, isBattleTimeRunning, PAUSE_DEFAULTS } from '../../../src/logic/battles/pause.js';
import {
  cancelOrder, chooseOrder, selectUnit, selectCell, canChooseOrder,
} from '../../../src/logic/battles/orderSelection.js';
import { canFlee, getFleeCooldownRemaining } from '../../../src/logic/battles/fleeCooldown.js';
import { testFaction } from './testFaction.js';

const PLAYER_ROSTER = {
  fighter: {
    name: 'Fighter', keywords: [], attackType: 'melee', size: 1,
    cost: 10, maxHp: 100, damage: 5, moveSpeed: 2, attackSpeed: 1, range: null, copies: 5,
  },
};

const ENEMY_ROSTER = {
  grunt: {
    name: 'Grunt', keywords: [], attackType: 'melee', size: 1,
    cost: 10, maxHp: 100, damage: 5, moveSpeed: 2, attackSpeed: 1, range: null, copies: 3,
  },
};

function newBattle(script = []) {
  return createBattle(new Grid(10, 10), testFaction(PLAYER_ROSTER), testFaction(ENEMY_ROSTER), script);
}

// Les trois façons de mettre la bataille en pause, pour vérifier chaque compteur sous chacune.
const PAUSES = {
  'pause principale': (battle) => toggleMainPause(battle.pause),
  'pause d\'interaction (drag de déploiement)': (battle) => startDeploymentDrag(battle),
  'pause d\'interaction (sélection d\'une commande)': (battle) => chooseOrder(battle, 'attack'),
  'pause d\'interaction (confirmation d\'abandon)': (battle) => startSurrenderConfirm(battle),
};

describe.each(Object.entries(PAUSES))('gel de tous les compteurs — %s (rules.md 5.2)', (_, pause) => {
  test('le temps de bataille et le script de l\'IA ne progressent pas', () => {
    const battle = newBattle([{ time: 1, species: ENEMY_ROSTER.grunt }]);
    pause(battle);

    tickBattle(battle, 5);

    expect(battle.elapsedSeconds).toBe(0);
    expect(battle.units).toHaveLength(0); // le grunt prévu à t=1 n'est pas apparu
  });

  test('les mouvements et les timers d\'attaque sont gelés', () => {
    const battle = newBattle();
    const { unit: walker } = deployPlayerUnit(battle, PLAYER_ROSTER.fighter, 0, 0);
    const { unit: fighter } = deployPlayerUnit(battle, PLAYER_ROSTER.fighter, 0, 5);
    const farEnemy = new BattleUnit(ENEMY_ROSTER.grunt, 'enemy', 9, 0);
    const closeEnemy = new BattleUnit(ENEMY_ROSTER.grunt, 'enemy', 1, 5); // au contact de `fighter`
    battle.units.push(farEnemy, closeEnemy);
    tickBattle(battle, 0.5); // engagement lancé, timer d'attaque à mi-course
    const walkerX = walker.x;
    const timer = fighter.attackTimer;
    pause(battle);

    tickBattle(battle, 10);

    expect(walker.x).toBe(walkerX);
    expect(fighter.attackTimer).toBe(timer);
    expect(closeEnemy.hp).toBe(closeEnemy.species.maxHp);
  });

  test('le délai de 2 s avant l\'écran de victoire est gelé (rules.md 8.1)', () => {
    const battle = newBattle([{ time: 0, species: ENEMY_ROSTER.grunt }]);
    deployPlayerUnit(battle, PLAYER_ROSTER.fighter, 0, 0);
    tickBattle(battle, 0.1);
    for (const u of battle.units) if (u.faction === 'enemy') u.hp = 0;
    tickBattle(battle, 0.1); // victoire acquise
    pause(battle);

    tickBattle(battle, 30);

    expect(battle.outcome).toBe('ongoing');
  });
});

// La barre de commandes ne s'ouvre pas pendant le cooldown : seules les deux autres pauses
// peuvent coexister avec un cooldown en cours.
describe.each([
  ['pause principale', PAUSES['pause principale']],
  ['drag de déploiement', PAUSES["pause d'interaction (drag de déploiement)"]],
  ['confirmation d\'abandon', PAUSES["pause d'interaction (confirmation d'abandon)"]],
])('gel du cooldown de la fuite — %s (rules.md 5.1)', (_, pause) => {
  test('le cooldown ne s\'écoule pas', () => {
    const battle = newBattle();
    battle.playerFleeState.lastFleeTime = 0; // fuite ordonnée à t=0
    tickBattle(battle, 2);
    pause(battle);

    tickBattle(battle, 10);

    expect(getFleeCooldownRemaining(battle.playerFleeState, battle.elapsedSeconds)).toBe(3);
  });
});

describe('combinaison des deux pauses (rules.md 5.2)', () => {
  test('le temps ne reprend que lorsque les deux pauses sont levées', () => {
    const battle = newBattle();
    toggleMainPause(battle.pause);
    chooseOrder(battle, 'attack');

    cancelOrder(battle); // fin de l'interaction, la pause principale reste
    expect(isBattleTimeRunning(battle.pause)).toBe(false);
    tickBattle(battle, 1);
    expect(battle.elapsedSeconds).toBe(0);

    toggleMainPause(battle.pause);
    tickBattle(battle, 1);
    expect(battle.elapsedSeconds).toBe(1);
  });

  test('une interaction terminée relance le temps s\'il n\'y a pas de pause principale', () => {
    const battle = newBattle();
    startDeploymentDrag(battle);
    endDeploymentDrag(battle);

    tickBattle(battle, 1);

    expect(battle.elapsedSeconds).toBe(1);
  });
});

describe('actions pendant la pause principale (rules.md 5.2)', () => {
  test('plusieurs déploiements possibles, et le jeu reste en pause après', () => {
    const battle = newBattle();
    toggleMainPause(battle.pause);

    for (let y = 0; y < 3; y++) {
      expect(startDeploymentDrag(battle)).toBe(true);
      expect(deployPlayerUnit(battle, PLAYER_ROSTER.fighter, 0, y).success).toBe(true);
      endDeploymentDrag(battle);
    }

    expect(battle.pause.main).toBe(true);
    expect(PAUSE_DEFAULTS.multipleDeploymentsPerMainPause).toBe(true);
  });

  test('une seule fuite par pause principale : le cooldown gelé empêche la deuxième', () => {
    const battle = newBattle();
    const { unit } = deployPlayerUnit(battle, PLAYER_ROSTER.fighter, 0, 0);
    toggleMainPause(battle.pause);

    chooseOrder(battle, 'flee');
    expect(selectUnit(battle, unit)).toBe(true);

    expect(battle.pause.main).toBe(true); // reste en pause après la commande
    expect(canFlee(battle.playerFleeState, battle.elapsedSeconds)).toBe(false);
    expect(chooseOrder(battle, 'flee')).toBe(false);
  });

  test('Aller et Attaquer n\'ont pas de cooldown : plusieurs commandes par pause principale', () => {
    const battle = newBattle();
    const { unit } = deployPlayerUnit(battle, PLAYER_ROSTER.fighter, 0, 0);
    toggleMainPause(battle.pause);

    for (const x of [2, 3, 4]) {
      chooseOrder(battle, 'move');
      selectUnit(battle, unit);
      expect(selectCell(battle, x, 0)).toBe(true);
    }

    expect(unit.command).toEqual({ type: 'moveTo', x: 4, y: 0 });
    expect(canChooseOrder(battle, 'attack')).toBe(true);
  });

  test('le déploiement reste limité par le budget de présence pendant la pause', () => {
    const battle = newBattle();
    battle.playerDeployment.bySpecies.get(PLAYER_ROSTER.fighter).freshRemaining = 20;
    toggleMainPause(battle.pause);
    for (let y = 0; y < 10; y++) deployPlayerUnit(battle, PLAYER_ROSTER.fighter, 0, y);
    for (let y = 0; y < 5; y++) deployPlayerUnit(battle, PLAYER_ROSTER.fighter, 1, y); // 150 points

    const result = deployPlayerUnit(battle, PLAYER_ROSTER.fighter, 1, 6); // case libre de la zone

    expect(result.success).toBe(false);
    expect(result.reason).toBe('presenceCapExceeded');
  });
});

describe('abandon (rules.md 8.2)', () => {
  test('défaite immédiate, même en pause, sans exterminer les réserves', () => {
    const battle = newBattle();
    deployPlayerUnit(battle, PLAYER_ROSTER.fighter, 0, 0);
    toggleMainPause(battle.pause);

    surrenderPlayer(battle);

    expect(battle.outcome).toBe('enemyVictory');
    expect(battle.playerDeployment.bySpecies.get(PLAYER_ROSTER.fighter).freshRemaining).toBe(4);
  });
});

describe('confirmation d\'abandon (rules.md 5.2 / 8.2)', () => {
  test('renoncer à abandonner relance le temps, sauf pendant la pause principale', () => {
    const battle = newBattle();
    startSurrenderConfirm(battle);
    endSurrenderConfirm(battle);
    tickBattle(battle, 1);
    expect(battle.elapsedSeconds).toBe(1);

    toggleMainPause(battle.pause);
    startSurrenderConfirm(battle);
    endSurrenderConfirm(battle);
    expect(isBattleTimeRunning(battle.pause)).toBe(false);
  });

  test('ouvrir la confirmation annule la commande en cours, sans consommer le cooldown', () => {
    const battle = newBattle();
    chooseOrder(battle, 'flee');

    startSurrenderConfirm(battle);
    endSurrenderConfirm(battle);

    expect(battle.orderSelection).toBeNull();
    expect(isBattleTimeRunning(battle.pause)).toBe(true);
    expect(canFlee(battle.playerFleeState, battle.elapsedSeconds)).toBe(true);
  });
});
