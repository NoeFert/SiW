// Chaque bataille, jouée par le bot avec un aléa fixé, doit donner le même résultat que l'instantané.
// Changement voulu : `npx jest battleReplay -u`.
import { buildArmy, runBattle, starterArmy } from '../../../src/debug/balance/simulate.js';
import { STRATEGIES } from '../../../src/debug/balance/bot.js';
import { TUTO_BATTLE_ID, WAR_BATTLE_IDS } from '../../../src/data/battles/index.js';
import { FACTIONS } from '../../../src/data/factions/index.js';

const SEED = 1;
const BATTLE_IDS = [TUTO_BATTLE_ID, ...WAR_BATTLE_IDS];

function replay(faction, battleId, strategy, groups) {
  return runBattle({
    faction, battleId, strategy, individuals: buildArmy(groups), seed: SEED,
  });
}

describe('replay of every battle with a fixed seed', () => {
  for (const faction of ['wyrms', 'undead']) {
    for (const battleId of BATTLE_IDS) {
      // Dotation de départ complète : victoires, avec des pertes et de l'XP.
      for (const strategy of STRATEGIES) {
        test(`${faction} ${battleId} ${strategy} starter army`, () => {
          expect(replay(faction, battleId, strategy, starterArmy(faction, 1))).toMatchSnapshot();
        });
      }
      // Deux unités de base seulement : défaites.
      test(`${faction} ${battleId} two basic units`, () => {
        const basicSpecies = Object.keys(FACTIONS[faction].roster)[0];
        expect(replay(faction, battleId, 'basics', [{ species: basicSpecies, count: 2, level: 1 }])).toMatchSnapshot();
      });
    }
  }
});
