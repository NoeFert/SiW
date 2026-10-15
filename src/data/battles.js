import {
  WYRMS_AI_SCRIPT, UNDEAD_AI_SCRIPT, WAR1_FIELD_SCRIPTS, WAR1_WALL_SCRIPTS, WAR2_SCRIPTS, WAR3_FORT_SCRIPTS,
} from './battleScript.js';
import {
  BATTLEFIELD_OBSTACLES, WALL_ZONE_OBSTACLES, LANES_ZONE_OBSTACLES, FORT_ZONE_OBSTACLES,
} from './battlefield.js';
import { STARTER_TUTORIAL } from './tutorials.js';

// Statique — définition de chaque bataille, repérée par son identifiant.
// - phases : une ou plusieurs zones jouées l'une après l'autre (rules.md 7.3). Chaque phase a
//   le script de l'IA selon la faction qu'elle joue (`enemyScripts`, rules.md 7.1), ses
//   obstacles (src/data/battlefield.js) et `flippedBackground` : image de fond affichée dans
//   l'autre sens (la même image sert à toutes les zones).
// - tutorial : étapes du tutoriel de cette bataille (technical.md 5.5), ou null.
// rules.md 11.7 : zones des batailles de « Partir en guerre » (obstacles et sens du fond) ; les
// scripts de l'IA sont propres à chaque bataille (src/data/battleScript.js).
const WAR_ZONES = {
  field: { obstacles: BATTLEFIELD_OBSTACLES, flippedBackground: false },
  wall: { obstacles: WALL_ZONE_OBSTACLES, flippedBackground: true },
  lanes: { obstacles: LANES_ZONE_OBSTACLES, flippedBackground: false },
  fort: { obstacles: FORT_ZONE_OBSTACLES, flippedBackground: false },
};

// rules.md 11.7 : une bataille de « Partir en guerre » — deux zones, victoire dès la fin du script
// de la dernière zone, commandes complètes et abandon, pas de tutoriel. `zones` : [clé de
// WAR_ZONES, scripts de l'IA { wyrms, undead }] par zone ; `reward` : Spirit Stones de la
// première victoire.
function warBattle(zones, reward) {
  return {
    phases: zones.map(([zone, enemyScripts]) => ({ ...WAR_ZONES[zone], enemyScripts })),
    zones: zones.map(([zone]) => zone),
    tutorial: null,
    reward,
  };
}

export const BATTLES = {
  // Bataille 01 du jeu normal, avec le tutoriel de départ.
  firstBattle: {
    phases: [
      {
        enemyScripts: { wyrms: WYRMS_AI_SCRIPT, undead: UNDEAD_AI_SCRIPT },
        obstacles: BATTLEFIELD_OBSTACLES,
        flippedBackground: false,
      },
    ],
    tutorial: STARTER_TUTORIAL,
    reward: 50, // rules.md 11.7 : Spirit Stones de la victoire (provisoire)
  },
  // rules.md 11.7 : les trois batailles de « Partir en guerre », en séquence (zones et
  // récompenses provisoires), plus dures à mesure qu'on approche du boss.
  war1: warBattle([['field', WAR1_FIELD_SCRIPTS], ['wall', WAR1_WALL_SCRIPTS]], 60),
  war2: warBattle([['wall', WAR2_SCRIPTS], ['lanes', WAR2_SCRIPTS]], 80),
  war3: warBattle([['lanes', WAR2_SCRIPTS], ['fort', WAR3_FORT_SCRIPTS]], 100),
};

export const FIRST_BATTLE_ID = 'firstBattle';
// Ordre de déblocage des batailles de « Partir en guerre » (rules.md 11.7).
export const WAR_BATTLE_IDS = ['war1', 'war2', 'war3'];
