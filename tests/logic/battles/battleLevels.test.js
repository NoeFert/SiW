// Niveaux en bataille (rules.md 2, 11.6).
import Grid from '../../../src/logic/battles/grid.js';
import BattleUnit from '../../../src/logic/battles/battleUnit.js';
import { updateUnitBehaviors } from '../../../src/logic/battles/unitBehavior.js';
import {
  createDeploymentState, deployUnit, getTowerRows, groupTowerRows, recordReturn,
} from '../../../src/logic/battles/deployment.js';
import { FACTIONS } from '../../../src/data/factions/index.js';

const WYRMS_ROSTER = FACTIONS.wyrms.roster;
const UNDEAD_ROSTER = FACTIONS.undead.roster;

describe('BattleUnit — stats du niveau (rules.md 11.6)', () => {
  test('niveau 1 par défaut : stats de units.md, sans individu', () => {
    const unit = new BattleUnit(WYRMS_ROSTER.lambtonWorm, 'enemy', 0, 0);
    expect(unit).toMatchObject({ level: 1, individualId: null, maxHp: 50, hp: 50, damage: 8, killXp: 0 });
  });

  test('PV max et dégâts augmentés selon le niveau, arrondis au plus proche', () => {
    const unit = new BattleUnit(WYRMS_ROSTER.lambtonWorm, 'player', 0, 0, 4, 'u1');
    expect(unit).toMatchObject({ level: 4, individualId: 'u1', maxHp: 65, hp: 65, damage: 10 });
  });

  test('hybride : les deux dégâts augmentent ; coût et vitesses inchangés', () => {
    const fafnir = new BattleUnit(WYRMS_ROSTER.fafnir, 'player', 0, 0, 5);
    expect(fafnir.damage).toEqual({ ranged: 42, melee: 63 });
    expect(fafnir.maxHp).toBe(308);
    expect(fafnir.species.cost).toBe(110);
  });
});

describe('réserve du joueur par individu et niveau (rules.md 2, ui-battle-screen-decisions.md 2.2)', () => {
  const individuals = [
    { id: 'a', species: 'lambtonWorm', xp: 0 },
    { id: 'b', species: 'lambtonWorm', xp: 160 }, // niveau 3
    { id: 'c', species: 'lambtonWorm', xp: 10 },
    { id: 'd', species: 'fafnir', xp: 350 }, // niveau 4
  ];

  test('une copie par individu possédé (pas les copies de units.md)', () => {
    const state = createDeploymentState(WYRMS_ROSTER, FACTIONS.wyrms.startingArmy, individuals);
    expect(state.bySpecies.get(WYRMS_ROSTER.lambtonWorm).freshRemaining).toBe(3);
    expect(state.bySpecies.get(WYRMS_ROSTER.amphiptere).freshRemaining).toBe(0);
  });

  test('tour : une ligne par espèce et niveau, niveaux décroissants, stats du niveau', () => {
    const state = createDeploymentState(WYRMS_ROSTER, FACTIONS.wyrms.startingArmy, individuals);
    const rows = getTowerRows(state, 'player', []);
    expect(rows.map((r) => [r.species.name, r.level, r.count, r.hp])).toEqual([
      ['Lambton Worm', 3, 1, 60],
      ['Lambton Worm', 1, 2, 50],
      ['Fafnir the Cursed One', 4, 1, 286],
    ]);
    expect(rows[0]).toMatchObject({ maxHp: 60, damage: 10, wounded: false });
  });

  test('sans individus (IA) : copies de niveau 1', () => {
    const rows = getTowerRows(createDeploymentState(WYRMS_ROSTER, FACTIONS.wyrms.startingArmy), 'player', []);
    expect(rows.every((r) => r.level === 1)).toBe(true);
  });

  test('regroupée, l\'espèce déploie ses individus par niveau décroissant', () => {
    const state = createDeploymentState(WYRMS_ROSTER, FACTIONS.wyrms.startingArmy, individuals);
    const [lambtons] = groupTowerRows(getTowerRows(state, 'player', []), new Set());
    expect(lambtons).toMatchObject({ count: 3, minLevel: 1, maxLevel: 3 }); // affiché « niv 1-3 »
    const deployLambton = () => {
      const [tile] = groupTowerRows(getTowerRows(state, 'player', []), new Set());
      return deployUnit(state, 'player', tile.species, 0, 0, [], tile.copyChoice).unit.level;
    };

    expect([deployLambton(), deployLambton(), deployLambton()]).toEqual([3, 1, 1]);
  });

  test('regroupée, l\'espèce déploie les intacts d\'abord, les blessés en dernier (même de plus haut niveau)', () => {
    const state = createDeploymentState(WYRMS_ROSTER, FACTIONS.wyrms.startingArmy, individuals);
    const veteran = deployUnit(state, 'player', WYRMS_ROSTER.lambtonWorm, 0, 0, [], { level: 3, hp: 60 }).unit;
    veteran.hp = 30;
    recordReturn(state, veteran); // le niveau 3 revient blessé de fuite
    const deployLambton = () => {
      const [tile] = groupTowerRows(getTowerRows(state, 'player', []), new Set());
      const { unit } = deployUnit(state, 'player', tile.species, 0, 0, [], tile.copyChoice);
      return [unit.level, unit.hp];
    };

    expect([deployLambton(), deployLambton(), deployLambton()]).toEqual([[1, 50], [1, 50], [3, 30]]);
  });

  test('regroupée : la case affiche le prochain individu déployé (intact) et le total de l\'espèce', () => {
    const state = createDeploymentState(WYRMS_ROSTER, FACTIONS.wyrms.startingArmy, individuals);
    const veteran = deployUnit(state, 'player', WYRMS_ROSTER.lambtonWorm, 0, 0, [], { level: 3, hp: 60 }).unit;
    veteran.hp = 30;
    recordReturn(state, veteran);

    const [lambtons] = groupTowerRows(getTowerRows(state, 'player', []), new Set());

    expect(lambtons).toMatchObject({ count: 3, level: 1, hp: 50, wounded: false, minLevel: 1, maxLevel: 3 });
  });

  test('déployer une ligne déploie un individu de ce niveau, avec ses stats', () => {
    const state = createDeploymentState(WYRMS_ROSTER, FACTIONS.wyrms.startingArmy, individuals);
    const [row] = getTowerRows(state, 'player', []);
    const { unit } = deployUnit(state, 'player', row.species, 0, 0, [], row.copyChoice);
    expect(unit).toMatchObject({ individualId: 'b', level: 3, hp: 60, maxHp: 60 });
    expect(getTowerRows(state, 'player', []).map((r) => r.level)).toEqual([1, 4]);
  });

  test('une unité revenue de fuite garde son niveau et son individu, sur sa propre ligne si blessée', () => {
    const state = createDeploymentState(WYRMS_ROSTER, FACTIONS.wyrms.startingArmy, individuals);
    const [row] = getTowerRows(state, 'player', []);
    const { unit } = deployUnit(state, 'player', row.species, 0, 0, [], row.copyChoice);
    unit.hp = 20;
    recordReturn(state, unit);
    const lambtonRows = getTowerRows(state, 'player', []).filter((r) => r.species === WYRMS_ROSTER.lambtonWorm);
    expect(lambtonRows.map((r) => [r.level, r.hp, r.wounded])).toEqual([[3, 20, true], [1, 50, false]]);

    const again = deployUnit(state, 'player', WYRMS_ROSTER.lambtonWorm, 0, 0, [], lambtonRows[0].copyChoice);
    expect(again.unit).toMatchObject({ individualId: 'b', level: 3, hp: 20, maxHp: 60 });
  });

  test('un niveau absent de la réserve est refusé', () => {
    const state = createDeploymentState(WYRMS_ROSTER, FACTIONS.wyrms.startingArmy, individuals);
    const result = deployUnit(state, 'player', WYRMS_ROSTER.lambtonWorm, 0, 0, [], { level: 2, hp: 44 });
    expect(result).toMatchObject({ success: false, reason: 'noCopiesLeft' });
  });
});

describe('XP des coups fatals (rules.md 11.6)', () => {
  // Un attaquant du joueur prêt à frapper au prochain tick, collé à sa victime.
  const striker = (x) => {
    const unit = new BattleUnit(WYRMS_ROSTER.lambtonWorm, 'player', x, 0);
    unit.status = 'engaged';
    unit.attackTimer = unit.species.attackSpeed - 0.01;
    return unit;
  };

  test('achever un ennemi rapporte son coût en PP', () => {
    const grid = new Grid(10, 10);
    const worm = striker(0);
    const skeleton = new BattleUnit(UNDEAD_ROSTER.newRebornSkeleton, 'enemy', 1, 0);
    skeleton.hp = 1;

    updateUnitBehaviors([worm, skeleton], grid, 0.02);

    expect(skeleton.isAlive).toBe(false);
    expect(worm.killXp).toBe(6);
  });

  test('coup fatal simultané, mêmes dégâts : seul le premier déployé gagne le coût', () => {
    const grid = new Grid(10, 10);
    const left = striker(0);
    const right = striker(2);
    const skeleton = new BattleUnit(UNDEAD_ROSTER.newRebornSkeleton, 'enemy', 1, 0);
    skeleton.hp = 1;

    updateUnitBehaviors([right, left, skeleton], grid, 0.02); // l'ordre de la liste ne compte pas

    expect(left.killXp).toBe(6);
    expect(right.killXp).toBe(0);
  });

  test('coup fatal simultané : le tueur qui inflige le plus de dégâts gagne le coût', () => {
    const grid = new Grid(10, 10);
    const left = striker(0);
    const right = new BattleUnit(WYRMS_ROSTER.lambtonWorm, 'player', 2, 0, 5); // niveau 5 : 11 dégâts
    right.status = 'engaged';
    right.attackTimer = right.species.attackSpeed - 0.01;
    const skeleton = new BattleUnit(UNDEAD_ROSTER.newRebornSkeleton, 'enemy', 1, 0);
    skeleton.hp = 1;

    updateUnitBehaviors([left, right, skeleton], grid, 0.02);

    expect(left.killXp).toBe(0);
    expect(right.killXp).toBe(6);
  });

  test('coup fatal simultané : un tueur qui meurt au même instant est écarté', () => {
    const grid = new Grid(10, 10);
    const left = striker(0);
    left.hp = 1;
    const right = striker(2);
    const skeleton = new BattleUnit(UNDEAD_ROSTER.newRebornSkeleton, 'enemy', 1, 0);
    skeleton.hp = 1;
    skeleton.status = 'engaged';
    skeleton.target = left;
    skeleton.attackTimer = skeleton.species.attackSpeed - 0.01;

    updateUnitBehaviors([left, right, skeleton], grid, 0.02);

    expect(left.isAlive).toBe(false);
    expect(right.killXp).toBe(6);
  });

  test('blesser sans achever ne rapporte rien', () => {
    const grid = new Grid(10, 10);
    const worm = striker(0);
    const skeleton = new BattleUnit(UNDEAD_ROSTER.newRebornSkeleton, 'enemy', 1, 0);

    updateUnitBehaviors([worm, skeleton], grid, 0.02);

    expect(skeleton.isAlive).toBe(true);
    expect(worm.killXp).toBe(0);
  });
});
