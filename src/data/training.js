import { WYRMS_ROSTER } from './wyrmsRoster.js';
import { UNDEAD_ROSTER } from './undeadRoster.js';

// Statique — bataille d'entraînement du menu devs (outil de test des attaques et animations, pas
// une fonctionnalité joueur, hors specs). Voir setupTraining (src/logic/battle.js).

// Mannequin : immobile, n'attaque jamais (temps d'attaque infini), et assez de PV pour ne jamais
// tomber pendant une session de test.
export const TRAINING_DUMMY = {
  name: 'Training Dummy',
  keywords: [],
  attackType: 'melee',
  size: 2,
  cost: 0,
  maxHp: 1000000,
  damage: 0,
  moveSpeed: 0,
  attackSpeed: Infinity,
  range: null,
  copies: 1,
};

// Toutes les espèces des deux factions sont déployables, en copies illimitées en pratique.
export const TRAINING_ROSTER = { ...WYRMS_ROSTER, ...UNDEAD_ROSTER };
export const TRAINING_COPIES = 99;
