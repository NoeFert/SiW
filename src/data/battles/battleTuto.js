import { WYRMS_ROSTER as W } from '../wyrmsRoster.js';
import { UNDEAD_ROSTER as U } from '../undeadRoster.js';
import { STARTER_TUTORIAL } from '../tutorials.js';
import { waves } from './waves.js';

// Bataille tutoriel (la « bataille 01 » de rules.md) : la première bataille du jeu, avec le
// tutoriel de départ. Une seule phase.
export default {
  reward: 50, // rules.md 11.7 : Spirit Stones de la victoire (provisoire)
  tutorial: STARTER_TUTORIAL,
  phases: [
    {
      background: { image: 'battlefield-01', flipped: false },
      // rules.md 1 : 16 obstacles, 12 d'une case et 4 blocs de 2x2, en 8 paires symétriques de
      // part et d'autre de la ligne médiane, pour que le terrain reste équitable quel que soit le
      // camp choisi (rules.md 9). Deux duos en diagonale ((5,8)-(6,9) et son miroir) : ils ne
      // bloquent jamais le passage à eux seuls (rules.md 3). Couloir central (colonnes 10-13) et
      // bords de fuite (rangées 0-1 et 12-13, rules.md 5) dégagés.
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
        // Coût total 175, limité par le plafond simultané de 150 (rules.md 7.1).
        wyrms: waves(
          [0, W.lambtonWorm, 1], [8, W.amphiptere, 1], [20, W.lambtonWorm, 1], [28, W.lambtonWorm, 2],
          [35, W.fafnir, 1],
        ),
        // Coût total 159, limité par le plafond simultané de 150 (rules.md 7.1).
        undead: waves(
          [0, U.newRebornSkeleton, 1], [8, U.necromantInitiate, 1], [20, U.newRebornSkeleton, 1],
          [28, U.newRebornSkeleton, 2], [35, U.athos, 1],
        ),
      },
    },
  ],
};
