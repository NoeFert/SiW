import { FACTIONS } from '../../factions/index.js';
import { waves } from '../waves.js';

const W = FACTIONS.wyrms.roster;
const U = FACTIONS.undead.roster;

// « L'essaim » : deux rochers 2x2 devant l'entrée de l'IA.
const SWARM_FIELD = [
  '......@@...#....@@......',
  '...@@.@@......@@@@......',
  '..#@@.....#@@.@@........',
  '....#......@@.......@@..',
  '.........#......@@..@@..',
  '....@@.........#@@......',
  '....@@.......#..........',
  '.......................',
  '................@@......',
  '......#.........@@..@@..',
  '....@@..............@@..',
  '....@@....#.............',
  '........#@@...@@#.......',
  '.........@@...@@........',
];

// « L'essaim » deux fois, vagues de basiques seulement.
export default {
  reward: 80, // provisoire
  tutorial: null,
  phases: [
    {
      background: { image: 'battlefield-01', flipped: false },
      obstacles: SWARM_FIELD,
      enemyScripts: {
        wyrms: waves([0, W.lambtonWorm, 4], [3, W.lambtonWorm, 2]),
        undead: waves([0, U.newRebornSkeleton, 5], [3, U.newRebornSkeleton, 4]),
      },
    },
    {
      background: { image: 'battlefield-01', flipped: false },
      obstacles: SWARM_FIELD,
      enemyScripts: {
        wyrms: waves([0, W.lambtonWorm, 3], [4, W.lambtonWorm, 3]),
        undead: waves([0, U.newRebornSkeleton, 9]),
      },
    },
  ],
};
