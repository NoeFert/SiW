import { FOUNTAIN_MINUTE_MS } from '../logic/fountain.js';
import { HOME_TIPS } from '../logic/homeTips.js';
import { WAR_BATTLE_IDS } from '../data/battles/index.js';

// Outil de dev — joueurs de test figés, pour tester à la main l'après-bataille tutoriel sans la
// rejouer. Le menu devs remplace le profil sauvegardé par l'un d'eux (voir replaceProfile dans
// src/state/profileStore.js). Chaque profil a la même forme que le profil sauvegardé
// (EMPTY_PROFILE), tous les champs remplis.
// XP des individus : seuils cumulés des niveaux 2 à 50, 3 à 150, 4 à 300, 5 à 500.
// Fonctions plutôt que constantes : la Spirit Fountain est pleine au moment du chargement.

// Dernière récolte il y a 24 h : la fontaine est pleine (rules.md 11.8).
const fullFountain = () => Date.now() - 24 * 60 * FOUNTAIN_MINUTE_MS;

// Joueur Wyrms après la bataille tutoriel : 3 Vers de Lambton et 1 Amphiptère perdus, restent
// 9 / 7 / 1 individus, tous dans l'armée.
const WYRM_UNITS = [
  { id: 'lambton-1', species: 'lambtonWorm', xp: 500 }, // niveau 5
  { id: 'lambton-2', species: 'lambtonWorm', xp: 320 }, // niveau 4
  { id: 'lambton-3', species: 'lambtonWorm', xp: 160 }, // niveau 3
  { id: 'lambton-4', species: 'lambtonWorm', xp: 60 }, // niveau 2
  { id: 'lambton-5', species: 'lambtonWorm', xp: 20 },
  { id: 'lambton-6', species: 'lambtonWorm', xp: 0 },
  { id: 'lambton-7', species: 'lambtonWorm', xp: 0 },
  { id: 'lambton-8', species: 'lambtonWorm', xp: 0 },
  { id: 'lambton-9', species: 'lambtonWorm', xp: 0 },
  { id: 'amphiptere-1', species: 'amphiptere', xp: 70 }, // niveau 2
  { id: 'amphiptere-2', species: 'amphiptere', xp: 30 },
  { id: 'amphiptere-3', species: 'amphiptere', xp: 0 },
  { id: 'amphiptere-4', species: 'amphiptere', xp: 0 },
  { id: 'amphiptere-5', species: 'amphiptere', xp: 0 },
  { id: 'amphiptere-6', species: 'amphiptere', xp: 0 },
  { id: 'amphiptere-7', species: 'amphiptere', xp: 0 },
  { id: 'fafnir', species: 'fafnir', xp: 350 }, // niveau 4
];

// Joueur Morts-Vivants après la bataille tutoriel : 4 New-reborn Skeletons et 1 Necromant Initiate
// perdus, restent 14 / 7 / 1 individus (369 PP), tous dans l'armée.
const UNDEAD_UNITS = [
  { id: 'skeleton-1', species: 'newRebornSkeleton', xp: 500 }, // niveau 5
  { id: 'skeleton-2', species: 'newRebornSkeleton', xp: 320 }, // niveau 4
  { id: 'skeleton-3', species: 'newRebornSkeleton', xp: 160 }, // niveau 3
  { id: 'skeleton-4', species: 'newRebornSkeleton', xp: 60 }, // niveau 2
  { id: 'skeleton-5', species: 'newRebornSkeleton', xp: 20 },
  { id: 'skeleton-6', species: 'newRebornSkeleton', xp: 0 },
  { id: 'skeleton-7', species: 'newRebornSkeleton', xp: 0 },
  { id: 'skeleton-8', species: 'newRebornSkeleton', xp: 0 },
  { id: 'skeleton-9', species: 'newRebornSkeleton', xp: 0 },
  { id: 'skeleton-10', species: 'newRebornSkeleton', xp: 0 },
  { id: 'skeleton-11', species: 'newRebornSkeleton', xp: 0 },
  { id: 'skeleton-12', species: 'newRebornSkeleton', xp: 0 },
  { id: 'skeleton-13', species: 'newRebornSkeleton', xp: 0 },
  { id: 'skeleton-14', species: 'newRebornSkeleton', xp: 0 },
  { id: 'necromant-1', species: 'necromantInitiate', xp: 70 }, // niveau 2
  { id: 'necromant-2', species: 'necromantInitiate', xp: 30 },
  { id: 'necromant-3', species: 'necromantInitiate', xp: 0 },
  { id: 'necromant-4', species: 'necromantInitiate', xp: 0 },
  { id: 'necromant-5', species: 'necromantInitiate', xp: 0 },
  { id: 'necromant-6', species: 'necromantInitiate', xp: 0 },
  { id: 'necromant-7', species: 'necromantInitiate', xp: 0 },
  { id: 'athos', species: 'athos', xp: 350 }, // niveau 4
];

export const TEST_PROFILES = {
  'test-wyrm': () => ({
    faction: 'wyrms',
    tutoBattleWon: true,
    units: WYRM_UNITS,
    army: { name: 'Armée 1', unitIds: WYRM_UNITS.map((unit) => unit.id) },
    spiritStones: 10000,
    playerXp: 1700, // niveau 3, 200 / 1 500 dans le niveau
    fallenLegendaryLevel: null, // Fafnir n'est jamais mort
    wonWarBattles: [...WAR_BATTLE_IDS], // toutes les batailles de « Partir en guerre » gagnées : toutes jouables
    fountainLastHarvest: fullFountain(),
    homeTipsSeen: HOME_TIPS, // tutoriel de l'accueil déjà passé (technical.md 5.6)
  }),
  'test-undead': () => ({
    faction: 'undead',
    tutoBattleWon: true,
    units: UNDEAD_UNITS,
    army: { name: 'Armée 1', unitIds: UNDEAD_UNITS.map((unit) => unit.id) },
    spiritStones: 10000,
    playerXp: 1700, // niveau 3, 200 / 1 500 dans le niveau
    fallenLegendaryLevel: null, // Athos n'est jamais mort
    wonWarBattles: [...WAR_BATTLE_IDS], // toutes les batailles de « Partir en guerre » gagnées : toutes jouables
    fountainLastHarvest: fullFountain(),
    homeTipsSeen: HOME_TIPS, // tutoriel de l'accueil déjà passé (technical.md 5.6)
  }),
};
