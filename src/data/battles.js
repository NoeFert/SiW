import {
  WYRMS_AI_SCRIPT, UNDEAD_AI_SCRIPT, WYRMS_CLICKBAIT_PHASE_1_SCRIPT, UNDEAD_CLICKBAIT_PHASE_1_SCRIPT,
  WYRMS_CLICKBAIT_PHASE_2_SCRIPT, UNDEAD_CLICKBAIT_PHASE_2_SCRIPT,
  WYRMS_CLICKBAIT_PHASE_3_SCRIPT, UNDEAD_CLICKBAIT_PHASE_3_SCRIPT,
  WAR1_FIELD_SCRIPTS, WAR1_WALL_SCRIPTS, WAR2_SCRIPTS, WAR3_FORT_SCRIPTS,
} from './battleScript.js';
import {
  BATTLEFIELD_OBSTACLES, WALL_ZONE_OBSTACLES, LANES_ZONE_OBSTACLES, FORT_ZONE_OBSTACLES,
} from './battlefield.js';
import { STARTER_TUTORIAL, CLICKBAIT_TUTORIAL } from './tutorials.js';
import { TRAINING_ROSTER } from './training.js';

// Statique — définition de chaque bataille, repérée par son identifiant.
// - phases : une ou plusieurs zones jouées l'une après l'autre (rules.md 7.3). Chaque phase a
//   le script de l'IA selon la faction qu'elle joue (`enemyScripts`, rules.md 7.1), ses
//   obstacles (src/data/battlefield.js) et `flippedBackground` : image de fond affichée dans
//   l'autre sens (la même image sert à toutes les zones).
// - tutorial : étapes du tutoriel de cette bataille (technical.md 5.5), ou null.
// - orders : ordres proposés dans la rangée « Ordres » de la tour (rules.md 5), tous par défaut.
// - surrenderAllowed : bouton Abandonner disponible (rules.md 8.2), vrai par défaut.
// - playerRoster : roster déployable par le joueur, celui de sa faction par défaut.
// - training : bataille d'entraînement du menu devs (voir setupTraining, src/logic/battle.js).
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
  // Bataille de la version clickbait (technical.md 5.6), indépendante du jeu normal : phase 1
  // sur le terrain de la bataille 01 (vagues resserrées, sans légendaire), puis "Le mur" (phase 2) et "Le fort" (phase 3, provisoire).
  clickbaitBattle: {
    phases: [
      {
        enemyScripts: { wyrms: WYRMS_CLICKBAIT_PHASE_1_SCRIPT, undead: UNDEAD_CLICKBAIT_PHASE_1_SCRIPT },
        obstacles: BATTLEFIELD_OBSTACLES,
        flippedBackground: false,
      },
      {
        enemyScripts: { wyrms: WYRMS_CLICKBAIT_PHASE_2_SCRIPT, undead: UNDEAD_CLICKBAIT_PHASE_2_SCRIPT },
        obstacles: WALL_ZONE_OBSTACLES,
        flippedBackground: true,
      },
      {
        enemyScripts: { wyrms: WYRMS_CLICKBAIT_PHASE_3_SCRIPT, undead: UNDEAD_CLICKBAIT_PHASE_3_SCRIPT },
        obstacles: FORT_ZONE_OBSTACLES,
        flippedBackground: false,
      },
    ],
    tutorial: CLICKBAIT_TUTORIAL,
    // POC-SPECS.md : seul l'ordre Fuir, pas d'abandon.
    orders: ['flee'],
    surrenderAllowed: false,
  },
  // rules.md 11.7 : les trois batailles de « Partir en guerre », en séquence (zones et
  // récompenses provisoires), plus dures à mesure qu'on approche du boss.
  war1: warBattle([['field', WAR1_FIELD_SCRIPTS], ['wall', WAR1_WALL_SCRIPTS]], 60),
  war2: warBattle([['wall', WAR2_SCRIPTS], ['lanes', WAR2_SCRIPTS]], 80),
  war3: warBattle([['lanes', WAR2_SCRIPTS], ['fort', WAR3_FORT_SCRIPTS]], 100),
  // Menu devs (hors specs) : entraînement, pour tester les attaques et animations des unités.
  // Terrain sans obstacle, aucun script IA (le mannequin est posé par setupTraining), toutes les
  // espèces des deux factions déployables, pas d'abandon (on en sort par le menu devs).
  training: {
    phases: [{ enemyScripts: { wyrms: [], undead: [] }, obstacles: [], flippedBackground: false }],
    tutorial: null,
    playerRoster: TRAINING_ROSTER,
    surrenderAllowed: false,
    training: true,
  },
};

export const FIRST_BATTLE_ID = 'firstBattle';
// Ordre de déblocage des batailles de « Partir en guerre » (rules.md 11.7).
export const WAR_BATTLE_IDS = ['war1', 'war2', 'war3'];
export const CLICKBAIT_BATTLE_ID = 'clickbaitBattle';
export const TRAINING_BATTLE_ID = 'training';
