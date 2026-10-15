import { WYRMS_ROSTER as W } from '../../wyrmsRoster.js';
import { UNDEAD_ROSTER as U } from '../../undeadRoster.js';
import { waves } from '../waves.js';

// Guerre 01, bataille de l'emplacement « start » de la map (rules.md 11.7) : le champ de la
// bataille tutoriel, puis « Le mur ».
// Scripts calibrés pour la difficulté selon la distance au boss (vérifiés avec `npm run balance`).
export default {
  reward: 60, // Spirit Stones de la première victoire (provisoire)
  tutorial: null,
  phases: [
    {
      // Le champ : même terrain que la bataille tutoriel.
      background: { image: 'battlefield-01', flipped: false },
      obstacles: [
        '........................',
        '........................',
        '..#..................#..',
        '...#................#...',
        '........................',
        '....#..............#....',
        '.......@@......@@.......',
        '.......@@......@@.......',
        '.....#............#.....',
        '......#..........#......',
        '...@@..............@@...',
        '...@@....#....#....@@...',
        '........................',
        '........................',
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
      // « Le mur » : un mur qui serpente (colonnes 14-17), percé d'un passage étroit (rangée 3,
      // 1 case : une Légendaire 2x2 ne passe pas) et d'un passage large (rangées 10-11).
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
