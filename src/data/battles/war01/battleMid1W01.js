import { FACTIONS } from '../../factions/index.js';
import { waves } from '../waves.js';

const W = FACTIONS.wyrms.roster;
const U = FACTIONS.undead.roster;

// Guerre 01, bataille de l'emplacement « mid1 » de la map (rules.md 11.7) : « Le labyrinthe »,
// deux labyrinthes différents. Dans les deux, un demi-cercle libre devant chaque bord (zones de
// déploiement), puis un dédale de chemins qui s'entrecroisent, avec des impasses : 3 chemins
// partent du côté du joueur, 4 du côté de l'IA. La moitié d'entre eux passe par un goulot d'une
// case entre deux rochers 2x2, où un [Légendaire] (2x2, même en volant) ne passe pas.
// Scripts calibrés pour la difficulté selon la distance au boss (vérifiés avec `npm run balance`).
export default {
  reward: 60, // Spirit Stones de la première victoire (provisoire)
  tutorial: null,
  phases: [
    {
      // Labyrinthe 1 : un couloir vertical central (colonnes 10-11), coupé en deux (rangées 7-8).
      // Côté joueur : goulots rangées 2 et 9, couloir large rangées 5-6, reliés par un goulot
      // vertical (colonne 8). Côté IA : goulots rangées 0 et 7, couloirs larges rangées 3-4 et
      // 10-11. Impasses en bas du couloir central et en bas à droite (colonnes 14-15).
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
      // Labyrinthe 2 : deux couloirs verticaux (colonnes 10-11 et 14-15), reliés par un passage
      // large (rangées 4-5) et un goulot (rangée 8). Côté joueur : couloirs larges rangées 2-3 et
      // 9-10, goulot rangée 6. Côté IA : goulots rangées 0, 3 et 10, couloir large rangées 6-7.
      // Impasses en haut du premier couloir et en bas du second.
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
