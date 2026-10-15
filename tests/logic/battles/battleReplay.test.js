// Filet de sécurité du refactor : chaque bataille du jeu, jouée sans navigateur par le bot de
// l'outil d'équilibrage avec un aléa fixé, doit donner exactement le même résultat (issue,
// durée, pertes, XP…) qu'au moment où l'instantané a été enregistré. Un écart signale un
// changement de comportement du moteur. Si ce changement est voulu, régénérer l'instantané
// avec `npx jest battleReplay -u`.
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
