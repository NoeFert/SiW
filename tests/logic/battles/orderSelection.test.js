import Grid from '../../../src/logic/battles/grid.js';
import BattleUnit from '../../../src/logic/battles/battleUnit.js';
import { createBattle, tickBattle } from '../../../src/logic/battles/battle.js';
import { deployPlayerUnit, startDeploymentDrag } from '../../../src/logic/battles/playerActions.js';
import {
  cancelOrder, chooseOrder, canChooseOrder, selectUnit, selectEnemy, selectCell, clickField,
  getClickableHighlights,
} from '../../../src/logic/battles/orderSelection.js';
import { canFlee } from '../../../src/logic/battles/fleeCooldown.js';
import { testFaction } from './testFaction.js';

const ROSTER = {
  fighter: {
    name: 'Fighter', keywords: [], attackType: 'melee', size: 1,
    cost: 10, maxHp: 100, damage: 5, moveSpeed: 2, attackSpeed: 1, range: null, copies: 5,
  },
};

// Bataille avec une unité du joueur en (1, 1) et un ennemi en (8, 8).
function setup() {
  const battle = createBattle(new Grid(10, 10), testFaction(ROSTER), testFaction(ROSTER), []);
  const { unit } = deployPlayerUnit(battle, ROSTER.fighter, 1, 1);
  const enemy = new BattleUnit(ROSTER.fighter, 'enemy', 8, 8);
  battle.units.push(enemy);
  return { battle, unit, enemy };
}

describe('choix d\'un ordre (rules.md 5)', () => {
  test('met le jeu en pause dès le clic sur l\'ordre', () => {
    const { battle } = setup();

    expect(chooseOrder(battle, 'attack')).toBe(true);

    expect(battle.pause.interaction).toBe('order');
    tickBattle(battle, 1);
    expect(battle.elapsedSeconds).toBe(0);
  });

  test('Fuir ne peut pas être choisi pendant son cooldown ; Aller et Attaquer, si', () => {
    const { battle, unit } = setup();
    chooseOrder(battle, 'flee');
    selectUnit(battle, unit);
    tickBattle(battle, 4.9);

    expect(chooseOrder(battle, 'flee')).toBe(false);
    expect(canChooseOrder(battle, 'move')).toBe(true);
    expect(canChooseOrder(battle, 'attack')).toBe(true);

    tickBattle(battle, 0.1);
    expect(chooseOrder(battle, 'flee')).toBe(true);
  });

  test('aucun ordre pendant un drag de déploiement, et pas de drag pendant une commande', () => {
    const { battle } = setup();
    startDeploymentDrag(battle);
    expect(chooseOrder(battle, 'attack')).toBe(false);

    const other = setup().battle;
    chooseOrder(other, 'attack');
    expect(startDeploymentDrag(other)).toBe(false);
  });

  test('choisir un autre ordre le remplace et oublie l\'unité sélectionnée', () => {
    const { battle, unit } = setup();
    chooseOrder(battle, 'attack');
    selectUnit(battle, unit);

    expect(chooseOrder(battle, 'move')).toBe(true);

    expect(battle.orderSelection).toEqual({ order: 'move', unit: null });
    expect(battle.pause.interaction).toBe('order');
  });
});

describe('déroulé : ordre, unité, cible (rules.md 5)', () => {
  test('attack : ordre, unité, puis ennemi', () => {
    const { battle, unit, enemy } = setup();
    chooseOrder(battle, 'attack');
    selectUnit(battle, unit);

    expect(selectEnemy(battle, enemy)).toBe(true);

    expect(unit.command).toEqual({ type: 'attack', target: enemy });
    expect(battle.orderSelection).toBeNull();
    expect(battle.pause.interaction).toBeNull();
  });

  test('move : ordre, unité, puis case', () => {
    const { battle, unit } = setup();
    chooseOrder(battle, 'move');
    selectUnit(battle, unit);

    expect(selectCell(battle, 4, 4)).toBe(true);

    expect(unit.command).toEqual({ type: 'moveTo', x: 4, y: 4 });
  });

  test('flee : émis dès la sélection de l\'unité, sans cible', () => {
    const { battle, unit } = setup();
    chooseOrder(battle, 'flee');

    expect(selectUnit(battle, unit)).toBe(true);

    expect(unit.command).toEqual({ type: 'flee' });
    expect(battle.orderSelection).toBeNull();
  });

  test('par clics sur le terrain : unité puis ennemi (attack), unité puis case (move)', () => {
    const { battle, unit, enemy } = setup();
    chooseOrder(battle, 'attack');
    clickField(battle, 1, 1);
    clickField(battle, 8, 8);
    expect(unit.command).toEqual({ type: 'attack', target: enemy });

    chooseOrder(battle, 'move');
    clickField(battle, 1, 1);
    clickField(battle, 3, 2);
    expect(unit.command).toEqual({ type: 'moveTo', x: 3, y: 2 });
  });

  test('une cible incompatible avec l\'ordre est ignorée, la sélection continue', () => {
    const { battle, unit, enemy } = setup();
    chooseOrder(battle, 'attack');
    selectUnit(battle, unit);

    expect(selectCell(battle, 4, 4)).toBe(false);
    expect(unit.command).toBeNull();
    expect(battle.orderSelection).toEqual({ order: 'attack', unit });

    chooseOrder(battle, 'move');
    selectUnit(battle, unit);
    expect(selectEnemy(battle, enemy)).toBe(false);
  });

  test('cliquer une autre unité du joueur change l\'unité sélectionnée', () => {
    const { battle, unit } = setup();
    const { unit: other } = deployPlayerUnit(battle, ROSTER.fighter, 2, 5);
    chooseOrder(battle, 'attack');

    clickField(battle, 1, 1);
    clickField(battle, 2, 5);

    expect(battle.orderSelection.unit).toBe(other);
    expect(unit.command).toBeNull();
  });

  test('sans ordre choisi, cliquer le terrain ne fait rien (pas de raccourci)', () => {
    const { battle, unit } = setup();

    expect(selectUnit(battle, unit)).toBe(false);
    expect(clickField(battle, 1, 1)).toBe(false);
    expect(clickField(battle, 8, 8)).toBe(false);
    expect(clickField(battle, 4, 4)).toBe(false);
    expect(unit.command).toBeNull();
    expect(battle.orderSelection).toBeNull();
    expect(battle.pause.interaction).toBeNull();
  });
});

describe('annulation (rules.md 5)', () => {
  test.each([
    ['ordre choisi', () => {}],
    ['unité sélectionnée', (battle, unit) => selectUnit(battle, unit)],
  ])('à l\'étape "%s" : aucune commande, jeu relancé', (_, reachStep) => {
    const { battle, unit } = setup();
    chooseOrder(battle, 'move');
    reachStep(battle, unit);

    cancelOrder(battle);

    expect(unit.command).toBeNull();
    expect(battle.orderSelection).toBeNull();
    expect(battle.pause.interaction).toBeNull();
  });

  test('re-cliquer l\'ordre en cours annule la commande', () => {
    const { battle } = setup();
    chooseOrder(battle, 'attack');

    expect(chooseOrder(battle, 'attack')).toBe(false);

    expect(battle.orderSelection).toBeNull();
    expect(battle.pause.interaction).toBeNull();
  });

  test('annuler Fuir ne consomme pas son cooldown', () => {
    const { battle } = setup();
    chooseOrder(battle, 'flee');

    cancelOrder(battle);

    expect(canFlee(battle.playerFleeState, battle.elapsedSeconds)).toBe(true);
    expect(chooseOrder(battle, 'flee')).toBe(true);
  });
});

describe('éléments cliquables mis en valeur (ui-battle-screen-decisions.md 3)', () => {
  test('choix de l\'unité : les unités du joueur', () => {
    const { battle, unit } = setup();
    chooseOrder(battle, 'attack');

    expect(getClickableHighlights(battle)).toEqual({ zone: null, unitIds: new Set([unit.id]) });
  });

  test('cible de attack : les ennemis ; de move : tout le terrain', () => {
    const { battle, unit, enemy } = setup();
    const wholeField = { x: 0, y: 0, width: 10, height: 10 };

    chooseOrder(battle, 'attack');
    selectUnit(battle, unit);
    expect(getClickableHighlights(battle)).toEqual({ zone: null, unitIds: new Set([enemy.id]) });

    chooseOrder(battle, 'move');
    selectUnit(battle, unit);
    expect(getClickableHighlights(battle)).toEqual({ zone: wholeField, unitIds: new Set() });
  });

  test('hors commande : rien', () => {
    const { battle } = setup();

    expect(getClickableHighlights(battle)).toEqual({ zone: null, unitIds: new Set() });
  });

  test('drag de déploiement : la moitié du joueur', () => {
    const { battle } = setup();
    startDeploymentDrag(battle);

    expect(getClickableHighlights(battle)).toEqual({
      zone: { x: 0, y: 0, width: 5, height: 10 }, unitIds: new Set(),
    });
  });
});
