import {
  createFactionState, surrender, evaluateBattleOutcome, isEliminated,
} from '../../../src/logic/battles/battleEnd.js';
import { createDeploymentState, deployUnit, recordReturn } from '../../../src/logic/battles/deployment.js';

// Roster fictif minimal, isolé de units.md, pour piloter précisément les réserves.
const ROSTER = {
  grunt: {
    name: 'Grunt', keywords: [], attackType: 'melee', size: 1,
    cost: 10, maxHp: 20, damage: 1, moveSpeed: 1, attackSpeed: 1, range: null, copies: 2,
  },
};

function emptyDeployment() {
  return createDeploymentState(ROSTER);
}

function depletedDeployment() {
  const state = createDeploymentState(ROSTER);
  state.bySpecies.get(ROSTER.grunt).freshRemaining = 0;
  return state;
}

describe('victoire immédiate (rules.md 8.1)', () => {
  test('se déclenche quand l\'ennemi n\'a plus aucune unité, terrain et réserve confondus', () => {
    const player = { factionState: createFactionState(), unitsOnField: ['unite-joueur'], deploymentState: emptyDeployment() };
    const enemy = { factionState: createFactionState(), unitsOnField: [], deploymentState: depletedDeployment() };

    expect(evaluateBattleOutcome(player, enemy)).toBe('playerVictory');
  });

  test('pas de victoire tant que l\'ennemi a encore une unité sur le terrain OU en réserve', () => {
    const player = { factionState: createFactionState(), unitsOnField: [], deploymentState: emptyDeployment() };

    const stillHasReserves = { factionState: createFactionState(), unitsOnField: [], deploymentState: emptyDeployment() };
    expect(evaluateBattleOutcome(player, stillHasReserves)).toBe('ongoing');

    const stillOnField = { factionState: createFactionState(), unitsOnField: ['unite'], deploymentState: depletedDeployment() };
    expect(evaluateBattleOutcome(player, stillOnField)).toBe('ongoing');
  });
});

describe('pas de compte à rebours (rules.md 8)', () => {
  test('un terrain vide avec des réserves ne met jamais fin à la bataille', () => {
    const player = { factionState: createFactionState(), unitsOnField: [], deploymentState: emptyDeployment() };
    const enemy = { factionState: createFactionState(), unitsOnField: ['unite'], deploymentState: emptyDeployment() };

    expect(evaluateBattleOutcome(player, enemy)).toBe('ongoing');
    expect(player.factionState.defeated).toBe(false);
  });

  test('défaite du joueur seulement quand il n\'a plus aucune unité, terrain et réserve', () => {
    const player = { factionState: createFactionState(), unitsOnField: [], deploymentState: depletedDeployment() };
    const enemy = { factionState: createFactionState(), unitsOnField: ['unite'], deploymentState: emptyDeployment() };

    expect(evaluateBattleOutcome(player, enemy)).toBe('enemyVictory');
  });

  test('élimination des deux camps au même instant : match nul', () => {
    const [player, enemy] = [0, 1].map(() => ({
      factionState: createFactionState(), unitsOnField: [], deploymentState: depletedDeployment(),
    }));

    expect(evaluateBattleOutcome(player, enemy)).toBe('draw');
  });
});

describe('mort vs fuite au niveau des réserves (rules.md 2/4.4)', () => {
  test('une unité qui fuit reste disponible : son camp n\'est pas éliminé', () => {
    const deployment = depletedDeployment();
    deployment.bySpecies.get(ROSTER.grunt).freshRemaining = 1;
    const { unit } = deployUnit(deployment, 'player', ROSTER.grunt, 0, 0, []);
    unit.hp = 7; // dégâts subis avant la fuite

    recordReturn(deployment, unit);

    expect(isEliminated([], deployment)).toBe(false); // toujours une réserve
  });
});

describe('abandon explicite (rules.md 8.2)', () => {
  test('marque le camp défait immédiatement, sans toucher aux réserves', () => {
    const factionState = createFactionState();
    surrender(factionState);

    expect(factionState.defeated).toBe(true);

    const deployment = emptyDeployment();
    expect(deployUnit(deployment, 'player', ROSTER.grunt, 0, 0, []).success).toBe(true);
  });
});
