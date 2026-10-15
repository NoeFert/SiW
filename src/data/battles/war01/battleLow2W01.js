import { WYRMS_ROSTER as W } from '../../wyrmsRoster.js';
import { UNDEAD_ROSTER as U } from '../../undeadRoster.js';
import { waves } from '../waves.js';

// Guerre 01, bataille de l'emplacement « low2 » de la map (rules.md 11.7) : « Les trois
// couloirs », puis « Le fort ».
// Scripts calibrés pour la difficulté selon la distance au boss (vérifiés avec `npm run balance`).
export default {
  reward: 100, // Spirit Stones de la première victoire (provisoire)
  tutorial: null,
  phases: [
    {
      // « Les trois couloirs » : deux crêtes (colonnes 5-19) séparent trois couloirs ; seules les
      // unités [Vol] passent de l'un à l'autre.
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
      // Même script que battleLow1W01.
      enemyScripts: {
        wyrms: waves([0, W.lambtonWorm, 3], [5, W.amphiptere, 1], [12, W.lambtonWorm, 2]),
        undead: waves(
          [0, U.newRebornSkeleton, 3], [5, U.necromantInitiate, 1], [12, U.newRebornSkeleton, 3],
          [18, U.newRebornSkeleton, 3],
        ),
      },
    },
    {
      // « Le fort » : une ruine en fer à cheval côté joueur, salle intérieure 4x4, ouverte vers
      // l'ennemi par une entrée de 2 cases (colonne 9, rangées 6-7). Protège du corps-à-corps,
      // pas des tirs (pas de ligne de vue, rules.md 4.5). Cul-de-sac assumé, contrairement à
      // rules.md 1.
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
        // Le [Légendaire] attend sous le plafond de 150 (rules.md 7.1).
        wyrms: waves([0, W.lambtonWorm, 4], [10, W.fafnir, 1]),
        undead: waves(
          [0, U.newRebornSkeleton, 6], [10, U.necromantInitiate, 3], [15, U.newRebornSkeleton, 3],
          [20, U.athos, 1],
        ),
      },
    },
  ],
};
