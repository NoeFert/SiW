import { FACTIONS } from '../../factions/index.js';
import { waves } from '../waves.js';

const W = FACTIONS.wyrms.roster;
const U = FACTIONS.undead.roster;

// Même script pour les deux phases.
const ENEMY_SCRIPTS = {
  wyrms: waves([0, W.lambtonWorm, 3], [5, W.amphiptere, 1], [12, W.lambtonWorm, 2]),
  undead: waves(
    [0, U.newRebornSkeleton, 3], [5, U.necromantInitiate, 1], [12, U.newRebornSkeleton, 3],
    [18, U.newRebornSkeleton, 3],
  ),
};

// Guerre 01, bataille de l'emplacement « low1 » de la map (rules.md 11.7) : « Le mur », puis
// « Les trois couloirs ».
// Scripts calibrés pour la difficulté selon la distance au boss (vérifiés avec `npm run balance`).
export default {
  reward: 80, // Spirit Stones de la première victoire (provisoire)
  tutorial: null,
  phases: [
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
      enemyScripts: ENEMY_SCRIPTS,
    },
    {
      // « Les trois couloirs » : deux crêtes (colonnes 5-19) séparent trois couloirs ; seules les
      // unités [Vol] passent de l'un à l'autre, par-dessus les rochers d'une case.
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
