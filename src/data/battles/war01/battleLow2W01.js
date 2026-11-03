import { FACTIONS } from '../../factions/index.js';
import { waves } from '../waves.js';

const W = FACTIONS.wyrms.roster;
const U = FACTIONS.undead.roster;

// « Les trois couloirs », puis « Le fort ».
export default {
  reward: 100, // provisoire
  tutorial: null,
  phases: [
    {
      // « Les trois couloirs »
      background: { image: 'battlefield-01', flipped: false },
      obstacles: [
        '........................',
        '.....................#..',
        '........................',
        '.......@@......##@@.....',
        '.....##@@##.@@##.@@#....',
        '......#...##@@..........',
        '........................',
        '........................',
        '.........###..@@........',
        '.....##@@#.###@@#..#....',
        '.......@@.......####....',
        '........................',
        '...#....................',
        '........................',
      ],
      enemyScripts: {
        wyrms: waves([0, W.lambtonWorm, 3], [5, W.amphiptere, 1], [12, W.lambtonWorm, 2]),
        undead: waves(
          [0, U.newRebornSkeleton, 3], [5, U.necromantInitiate, 1], [12, U.newRebornSkeleton, 3],
          [18, U.newRebornSkeleton, 3],
        ),
      },
    },
    {
      // « Le fort » : cul-de-sac assumé.
      background: { image: 'battlefield-01', flipped: false },
      obstacles: [
        '........................',
        '........................',
        '.................#......',
        '.....###@@..............',
        '....##..@@..............',
        '....#....#..........@@..',
        '...@@...............@@..',
        '...@@...................',
        '....#....#..............',
        '....##@@##..............',
        '......@@................',
        '................#.......',
        '.#......................',
        '........................',
      ],
      enemyScripts: {
        wyrms: waves([0, W.lambtonWorm, 4], [10, W.fafnir, 1]),
        undead: waves(
          [0, U.newRebornSkeleton, 6], [10, U.necromantInitiate, 3], [15, U.newRebornSkeleton, 3],
          [20, U.athos, 1],
        ),
      },
    },
  ],
};
