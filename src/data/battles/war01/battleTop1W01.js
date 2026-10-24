import { FACTIONS } from '../../factions/index.js';
import { waves } from '../waves.js';

const W = FACTIONS.wyrms.roster;
const U = FACTIONS.undead.roster;

// « L'essaim » : seulement deux rochers 2x2 juste devant l'entrée de l'IA (colonnes 20-21,
// rangées 3-4 et 9-10). Les vagues de basiques qui entrent les contournent en trois flux, qui se
// resserrent en paquets serrés : une proie pour les dégâts de zone d'un [Légendaire].
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

// Guerre 01, bataille de l'emplacement « top1 » de la map (rules.md 11.7) : « L'essaim », deux
// fois la même zone, avec seulement des vagues de basiques (au plus les copies de units.md pour
// toute la bataille : 12 Vers de Lambton, 18 New-reborn Skeletons).
// Scripts calibrés pour la difficulté selon la distance au boss (vérifiés avec `npm run balance`).
export default {
  reward: 80, // Spirit Stones de la première victoire (provisoire)
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
