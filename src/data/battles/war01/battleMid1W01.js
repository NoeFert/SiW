import { FACTIONS } from '../../factions/index.js';
import { waves } from '../waves.js';

const W = FACTIONS.wyrms.roster;
const U = FACTIONS.undead.roster;

// « Le labyrinthe », deux variantes.
export default {
  reward: 60, // provisoire
  tutorial: null,
  phases: [
    {
      // Labyrinthe 1
      background: { image: 'battlefield-01', flipped: false },
      obstacles: [
        '##@@@@@@@@..............',
        '..@@@@@@@@..@@@@..@@##..',
        '............@@@@..@@....',
        '.....#@@@@..............',
        '.....#@@@@..............',
        '............@@..@@......',
        '............@@..@@......',
        '......@@.@@#............',
        '......@@.@@#@@@@@@......',
        '............@@@@@@#.....',
        '.....#@@@@..............',
        '....##@@@@..............',
        '..@@@@@@@@..@@..@@@@@@..',
        '##@@@@@@@@..@@..@@@@@@#.',
      ],
      enemyScripts: {
        wyrms: waves([0, W.lambtonWorm, 1], [4, W.amphiptere, 1], [10, W.lambtonWorm, 1], [14, W.lambtonWorm, 3]),
        undead: waves(
          [0, U.newRebornSkeleton, 1], [4, U.necromantInitiate, 1], [10, U.newRebornSkeleton, 1],
          [14, U.newRebornSkeleton, 3], [18, U.newRebornSkeleton, 2],
        ),
      },
    },
    {
      // Labyrinthe 2
      background: { image: 'battlefield-01', flipped: true },
      obstacles: [
        '##@@@@@@@@..@@..........',
        '..@@@@@@@@..@@..@@@@##..',
        '............@@..@@@@....',
        '............@@..........',
        '.....#@@@@......@@#.....',
        '......@@@@......@@......',
        '............@@..........',
        '......@@@@..@@..........',
        '......@@@@......@@......',
        '............@@..@@#.....',
        '............@@..........',
        '....##@@@@..@@..@@@@....',
        '..@@@@@@@@@@@@..@@@@@@..',
        '##@@@@####@@##..####@@#.',
      ],
      enemyScripts: {
        wyrms: waves([0, W.lambtonWorm, 2], [5, W.amphiptere, 1], [12, W.lambtonWorm, 2]),
        undead: waves(
          [0, U.newRebornSkeleton, 2], [5, U.necromantInitiate, 1], [12, U.newRebornSkeleton, 3],
          [18, U.newRebornSkeleton, 2],
        ),
      },
    },
  ],
};
