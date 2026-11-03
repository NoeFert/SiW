import { FACTIONS } from '../factions/index.js';
import { STARTER_TUTORIAL } from '../tutorials.js';
import { waves } from './waves.js';

const W = FACTIONS.wyrms.roster;
const U = FACTIONS.undead.roster;

// Bataille tutoriel.
export default {
  reward: 50, // Spirit Stones de la victoire (provisoire)
  tutorial: STARTER_TUTORIAL,
  phases: [
    {
      background: { image: 'battlefield-01', flipped: false },
      // Terrain symétrique, équitable pour les deux camps (rules.md 1).
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
        wyrms: waves(
          [0, W.lambtonWorm, 1], [8, W.amphiptere, 1], [20, W.lambtonWorm, 1], [28, W.lambtonWorm, 2],
          [35, W.fafnir, 1],
        ),
        undead: waves(
          [0, U.newRebornSkeleton, 1], [8, U.necromantInitiate, 1], [20, U.newRebornSkeleton, 1],
          [28, U.newRebornSkeleton, 2], [35, U.athos, 1],
        ),
      },
    },
  ],
};
