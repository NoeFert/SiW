import Grid from '../../../src/logic/battles/grid.js';
import BattleUnit from '../../../src/logic/battles/battleUnit.js';
import {
  createDeploymentState, deployUnit, recordReturn, isValidDeploymentPosition, getTowerRows, groupTowerRows,
  PRESENCE_CAP,
} from '../../../src/logic/battles/deployment.js';
import { startingArmyOf } from './testFaction.js';

// Roster fictif minimal, isolé de units.md, pour piloter précisément plafond/copies/légendaire.
const ROSTER = {
  grunt: {
    name: 'Grunt', keywords: [], attackType: 'melee', size: 1,
    cost: 50, maxHp: 20, damage: 1, moveSpeed: 1, attackSpeed: 1, range: null, copies: 5,
  },
  champion: {
    name: 'Champion', keywords: ['legendary'], attackType: 'melee', size: 2,
    cost: 60, maxHp: 50, damage: 5, moveSpeed: 1, attackSpeed: 1, range: null, copies: 2,
  },
  lonely: {
    name: 'Lonely', keywords: [], attackType: 'melee', size: 1,
    cost: 10, maxHp: 10, damage: 1, moveSpeed: 1, attackSpeed: 1, range: null, copies: 1,
  },
};

describe('deployUnit — plafond de points de présence (rules.md 2)', () => {
  test('accepte des déploiements tant que le total ne dépasse pas 150', () => {
    const state = createDeploymentState(ROSTER, startingArmyOf(ROSTER));
    const onField = [];

    for (let i = 0; i < 3; i++) { // 3 x 50 = 150, exactement le plafond
      const result = deployUnit(state, 'player', ROSTER.grunt, i, 0, onField);
      expect(result.success).toBe(true);
      onField.push(result.unit);
    }

    expect(onField.reduce((sum, u) => sum + u.species.cost, 0)).toBe(PRESENCE_CAP);
  });

  test('refuse un déploiement qui dépasserait le plafond', () => {
    const state = createDeploymentState(ROSTER, startingArmyOf(ROSTER));
    const onField = [];
    for (let i = 0; i < 3; i++) {
      onField.push(deployUnit(state, 'player', ROSTER.grunt, i, 0, onField).unit);
    }

    const result = deployUnit(state, 'player', ROSTER.grunt, 9, 0, onField); // 200 > 150

    expect(result.success).toBe(false);
    expect(result.reason).toBe('presenceCapExceeded');
  });

  test('les points se libèrent dès qu\'une unité meurt ou fuit (le plafond est vivant)', () => {
    const state = createDeploymentState(ROSTER, startingArmyOf(ROSTER));
    let onField = [];
    for (let i = 0; i < 3; i++) {
      onField.push(deployUnit(state, 'player', ROSTER.grunt, i, 0, onField).unit);
    }
    expect(deployUnit(state, 'player', ROSTER.grunt, 9, 0, onField).success).toBe(false);

    onField = onField.slice(1); // une unité retirée (morte ou en fuite, peu importe pour le plafond)

    const result = deployUnit(state, 'player', ROSTER.grunt, 9, 0, onField);
    expect(result.success).toBe(true);
  });
});

describe('deployUnit — copies et fuite (rules.md 2)', () => {
  test('épuise les copies disponibles d\'une espèce', () => {
    const state = createDeploymentState(ROSTER, startingArmyOf(ROSTER));
    expect(deployUnit(state, 'player', ROSTER.lonely, 0, 0, []).success).toBe(true);

    const result = deployUnit(state, 'player', ROSTER.lonely, 1, 0, []);

    expect(result.success).toBe(false);
    expect(result.reason).toBe('noCopiesLeft');
  });

  test('redéploie une copie revenue de fuite avec ses PV réduits conservés', () => {
    const state = createDeploymentState(ROSTER, startingArmyOf(ROSTER));
    const { unit } = deployUnit(state, 'player', ROSTER.lonely, 0, 0, []);
    unit.hp = 3; // dégâts subis avant la fuite

    recordReturn(state, unit);
    const result = deployUnit(state, 'player', ROSTER.lonely, 5, 5, []);

    expect(result.success).toBe(true);
    expect(result.unit.hp).toBe(3); // pas species.maxHp (10)
  });
});

describe('deployUnit — choix explicite de la copie (sidebar : lignes séparées par variante)', () => {
  function stateWithOneWoundedGrunt() {
    const state = createDeploymentState(ROSTER, startingArmyOf(ROSTER));
    const { unit } = deployUnit(state, 'player', ROSTER.grunt, 0, 0, []);
    unit.hp = 7; // dégâts subis avant la fuite
    recordReturn(state, unit);
    return state;
  }

  test('copyChoice "fresh" garantit une copie à PV max même si une copie blessée existe', () => {
    const state = stateWithOneWoundedGrunt();

    const result = deployUnit(state, 'player', ROSTER.grunt, 1, 0, [], 'fresh');

    expect(result.success).toBe(true);
    expect(result.unit.hp).toBe(ROSTER.grunt.maxHp);
    expect(state.bySpecies.get(ROSTER.grunt).returning).toEqual([{ hp: 7, level: 1, individualId: null }]); // pas consommée
  });

  test('copyChoice = PV précis déploie exactement la copie revenue de fuite correspondante', () => {
    const state = stateWithOneWoundedGrunt();

    const result = deployUnit(state, 'player', ROSTER.grunt, 1, 0, [], 7);

    expect(result.success).toBe(true);
    expect(result.unit.hp).toBe(7);
    expect(state.bySpecies.get(ROSTER.grunt).returning).toHaveLength(0);
  });

  test('copyChoice "fresh" est refusé s\'il ne reste aucune copie fraîche, sans repli automatique', () => {
    const state = createDeploymentState(ROSTER, startingArmyOf(ROSTER));
    state.bySpecies.get(ROSTER.grunt).freshRemaining = 0;
    const wounded = new BattleUnit(ROSTER.grunt, 'player', 0, 0);
    wounded.hp = 5;
    recordReturn(state, wounded);

    const result = deployUnit(state, 'player', ROSTER.grunt, 1, 0, [], 'fresh');

    expect(result.success).toBe(false);
    expect(result.reason).toBe('noCopiesLeft');
  });

  test('copyChoice avec des PV qui ne correspondent à aucune copie en réserve est refusé', () => {
    const state = stateWithOneWoundedGrunt(); // une seule copie revenue, à 7 PV

    const result = deployUnit(state, 'player', ROSTER.grunt, 1, 0, [], 12);

    expect(result.success).toBe(false);
    expect(result.reason).toBe('noCopiesLeft');
  });

  test('sans copyChoice, le comportement historique (revenue de fuite en priorité) est inchangé', () => {
    const state = stateWithOneWoundedGrunt();

    const result = deployUnit(state, 'player', ROSTER.grunt, 1, 0, []);

    expect(result.unit.hp).toBe(7);
  });
});

describe('deployUnit — limite du [Légendaire] (rules.md 2)', () => {
  test('bloque un second exemplaire simultané, indépendamment du budget disponible', () => {
    const state = createDeploymentState(ROSTER, startingArmyOf(ROSTER));
    const first = deployUnit(state, 'player', ROSTER.champion, 0, 0, []);
    expect(first.success).toBe(true);

    const result = deployUnit(state, 'player', ROSTER.champion, 5, 5, [first.unit]);

    expect(result.success).toBe(false);
    expect(result.reason).toBe('legendaryAlreadyDeployed');
  });

  test('une tentative refusée ne consomme pas de copie', () => {
    const state = createDeploymentState(ROSTER, startingArmyOf(ROSTER));
    const first = deployUnit(state, 'player', ROSTER.champion, 0, 0, []);
    deployUnit(state, 'player', ROSTER.champion, 5, 5, [first.unit]); // refusé

    expect(state.bySpecies.get(ROSTER.champion).freshRemaining).toBe(1); // 2 - 1 (seul le succès compte)
  });

  test('redevient déployable une fois le premier exemplaire retiré du terrain', () => {
    const state = createDeploymentState(ROSTER, startingArmyOf(ROSTER));
    deployUnit(state, 'player', ROSTER.champion, 0, 0, []);

    const result = deployUnit(state, 'player', ROSTER.champion, 5, 5, []); // plus personne sur le terrain

    expect(result.success).toBe(true);
  });
});

describe('isValidDeploymentPosition (rules.md 1/2)', () => {
  // Zone du joueur : premier quart, x 0-5 ; moitié IA : x 12-23.
  const grid = new Grid(24, 6, [{ x: 2, y: 2 }]);

  test('accepte une case libre dans la zone de déploiement du joueur (colonnes 0 à 5)', () => {
    expect(isValidDeploymentPosition(grid, 'player', ROSTER.grunt, 0, 3, [])).toBe(true);
    expect(isValidDeploymentPosition(grid, 'player', ROSTER.grunt, 5, 3, [])).toBe(true);
  });

  test('refuse le reste de la moitié du joueur (colonnes 6 à 11), même au contact d\'aucun ennemi', () => {
    expect(isValidDeploymentPosition(grid, 'player', ROSTER.grunt, 6, 3, [])).toBe(false);
    expect(isValidDeploymentPosition(grid, 'player', ROSTER.grunt, 11, 3, [])).toBe(false);
  });

  test('pas de distance minimale : une case libre de la zone reste valide au contact d\'un ennemi', () => {
    const enemy = new BattleUnit(ROSTER.grunt, 'enemy', 4, 3);
    expect(isValidDeploymentPosition(grid, 'player', ROSTER.grunt, 3, 3, [enemy])).toBe(true);
  });

  test('refuse une case dans la moitié adverse', () => {
    expect(isValidDeploymentPosition(grid, 'player', ROSTER.grunt, 14, 3, [])).toBe(false);
    expect(isValidDeploymentPosition(grid, 'enemy', ROSTER.grunt, 3, 3, [])).toBe(false);
    expect(isValidDeploymentPosition(grid, 'enemy', ROSTER.grunt, 12, 3, [])).toBe(true);
  });

  test('refuse une case occupée par un obstacle', () => {
    expect(isValidDeploymentPosition(grid, 'player', ROSTER.grunt, 2, 2, [])).toBe(false);
  });

  test('refuse une case déjà occupée par une autre unité', () => {
    const occupant = new BattleUnit(ROSTER.grunt, 'player', 1, 1);
    expect(isValidDeploymentPosition(grid, 'player', ROSTER.grunt, 1, 1, [occupant])).toBe(false);
  });

  test('un bloc 2x2 doit tenir entièrement dans la zone de déploiement', () => {
    // champion (taille 2) à x=5 déborderait sur la colonne 6, hors de la zone
    expect(isValidDeploymentPosition(grid, 'player', ROSTER.champion, 5, 0, [])).toBe(false);
    expect(isValidDeploymentPosition(grid, 'player', ROSTER.champion, 4, 0, [])).toBe(true);
  });
});

describe('getTowerRows — liste des unités déployables de la tour (ui-battle-screen-decisions.md 2.2)', () => {
  function returnWithHp(state, species, hp) {
    const unit = new BattleUnit(species, 'player', 0, 0);
    unit.hp = hp;
    recordReturn(state, unit);
  }

  test('une ligne par espèce en réserve, les espèces épuisées disparaissent', () => {
    const state = createDeploymentState(ROSTER, startingArmyOf(ROSTER));
    state.bySpecies.get(ROSTER.lonely).freshRemaining = 0;

    const rows = getTowerRows(state, 'player', []);

    expect(rows.map((r) => [r.species.name, r.count])).toEqual([['Grunt', 5], ['Champion', 2]]);
    expect(rows[0]).toMatchObject({
      hp: 20, maxHp: 20, damage: 1, cost: 50, keywords: [], wounded: false, deployable: true,
    });
  });

  test('les unités sur le terrain ne sont pas dans la liste', () => {
    const state = createDeploymentState(ROSTER, startingArmyOf(ROSTER));
    const { unit } = deployUnit(state, 'player', ROSTER.grunt, 0, 0, []);

    const rows = getTowerRows(state, 'player', [unit]);

    expect(rows.find((r) => r.species === ROSTER.grunt).count).toBe(4);
  });

  test('regroupement strict : même espèce et mêmes PV seulement', () => {
    const state = createDeploymentState(ROSTER, startingArmyOf(ROSTER));
    state.bySpecies.get(ROSTER.grunt).freshRemaining = 2;
    returnWithHp(state, ROSTER.grunt, 20); // fuite sans blessure : rejoint le groupe intact
    returnWithHp(state, ROSTER.grunt, 12);
    returnWithHp(state, ROSTER.grunt, 7);
    returnWithHp(state, ROSTER.grunt, 12);

    const grunts = getTowerRows(state, 'player', []).filter((r) => r.species === ROSTER.grunt);

    expect(grunts.map((r) => [r.hp, r.count, r.wounded])).toEqual([[20, 3, false], [12, 2, true], [7, 1, true]]);
  });

  test('un blessé apparaît juste sous le groupe de son espèce, avant l\'espèce suivante', () => {
    const state = createDeploymentState(ROSTER, startingArmyOf(ROSTER));
    returnWithHp(state, ROSTER.grunt, 5);

    const names = getTowerRows(state, 'player', []).map((r) => `${r.species.name}:${r.hp}`);

    expect(names).toEqual(['Grunt:20', 'Grunt:5', 'Champion:50', 'Lonely:10']);
  });

  test('la ligne intacte reste déployable même si elle ne contient que des copies revenues de fuite', () => {
    const state = createDeploymentState(ROSTER, startingArmyOf(ROSTER));
    state.bySpecies.get(ROSTER.lonely).freshRemaining = 0;
    returnWithHp(state, ROSTER.lonely, 10);
    const [row] = getTowerRows(state, 'player', []).filter((r) => r.species === ROSTER.lonely);

    const result = deployUnit(state, 'player', ROSTER.lonely, 0, 0, [], row.copyChoice);

    expect(result.success).toBe(true);
    expect(result.unit.hp).toBe(10);
  });

  test('indicateur "déployable" faux si le coût dépasse le budget de présence restant', () => {
    const state = createDeploymentState(ROSTER, startingArmyOf(ROSTER));
    const onField = [];
    for (let x = 0; x < 2; x++) onField.push(deployUnit(state, 'player', ROSTER.grunt, x, 0, onField).unit); // 100/150

    const rows = getTowerRows(state, 'player', onField);
    const deployable = Object.fromEntries(rows.map((r) => [r.species.name, r.deployable]));

    expect(deployable).toEqual({ Grunt: true, Champion: false, Lonely: true }); // 50 ok, 60 > 50
  });

  test('indicateur "déployable" faux pour un [Légendaire] déjà sur le terrain', () => {
    const state = createDeploymentState(ROSTER, startingArmyOf(ROSTER));
    const { unit } = deployUnit(state, 'player', ROSTER.champion, 0, 0, []);

    const champion = getTowerRows(state, 'player', [unit]).find((r) => r.species === ROSTER.champion);

    expect(champion.deployable).toBe(false);
  });
});

describe('groupTowerRows — cases de la tour, regroupées par espèce (ui-battle-screen-decisions.md 2.2)', () => {
  // 3 Grunts intacts, puis un blessé à 12 PV ; Champion et Lonely en une seule ligne chacun.
  function stateWithWoundedGrunt() {
    const state = createDeploymentState(ROSTER, startingArmyOf(ROSTER));
    state.bySpecies.get(ROSTER.grunt).freshRemaining = 3;
    const unit = new BattleUnit(ROSTER.grunt, 'player', 0, 0);
    unit.hp = 12;
    recordReturn(state, unit);
    return state;
  }

  test('par défaut, une case par espèce : total de l\'espèce, prochain individu déployé en tête', () => {
    const rows = getTowerRows(stateWithWoundedGrunt(), 'player', []);

    const tiles = groupTowerRows(rows, new Set());

    expect(tiles.map((t) => [t.species.name, t.count, t.hp, t.grouped, t.groupable])).toEqual([
      ['Grunt', 4, 20, true, true],
      ['Champion', 2, 50, true, false],
      ['Lonely', 1, 10, true, false],
    ]);
    expect(tiles.every((t) => t.speciesHead)).toBe(true);
  });

  test('déployer la case regroupée déploie l\'individu le plus fort, puis le suivant', () => {
    const state = stateWithWoundedGrunt();
    const deployGrunt = () => {
      const [tile] = groupTowerRows(getTowerRows(state, 'player', []), new Set());
      return deployUnit(state, 'player', tile.species, 0, 0, [], tile.copyChoice).unit.hp;
    };

    expect([deployGrunt(), deployGrunt(), deployGrunt(), deployGrunt()]).toEqual([20, 20, 20, 12]);
  });

  test('espèce dégroupée : ses lignes séparées, la première porte la flèche', () => {
    const rows = getTowerRows(stateWithWoundedGrunt(), 'player', []);

    const tiles = groupTowerRows(rows, new Set([ROSTER.grunt]));

    expect(tiles.map((t) => [t.species.name, t.count, t.hp, !!t.speciesHead])).toEqual([
      ['Grunt', 3, 20, true],
      ['Grunt', 1, 12, false],
      ['Champion', 2, 50, true],
      ['Lonely', 1, 10, true],
    ]);
    expect(tiles[0]).toMatchObject({ grouped: false, groupable: true });
  });

  test('ne modifie pas les lignes reçues', () => {
    const rows = getTowerRows(stateWithWoundedGrunt(), 'player', []);

    groupTowerRows(rows, new Set());

    expect(rows[0].count).toBe(3);
  });
});
