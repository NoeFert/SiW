import { FACTIONS } from '../../factions/index.js';
import { waves } from '../waves.js';

const W = FACTIONS.wyrms.roster;
const U = FACTIONS.undead.roster;

const ENEMY_SCRIPTS = {
  wyrms: waves([0, W.lambtonWorm, 3], [5, W.amphiptere, 1], [12, W.lambtonWorm, 2]),
  undead: waves(
    [0, U.newRebornSkeleton, 3], [5, U.necromantInitiate, 1], [12, U.newRebornSkeleton, 3],
    [18, U.newRebornSkeleton, 3],
  ),
};

// « Le mur », puis « Les trois couloirs ».
export default {
  reward: 80, // provisoire
  tutorial: null,
  phases: [
    {
      // « Le mur »
      background: { image: 'battlefield-01', flipped: true },
      obstacles: [
        '................##......',
        '................@@..##..',
        '.........#......@@......',
        '........................',
        '................@@......',
        '...#............@@......',
        '....#..........##.......',
        '...............#...#....',
        '..............@@........',
        '..............@@....@@..',
        '....................@@..',
        '.......@@...............',
        '.......@@.....##........',
        '...............##.......',
      ],
      enemyScripts: ENEMY_SCRIPTS,
    },
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
      enemyScripts: ENEMY_SCRIPTS,
    },
  ],
};
