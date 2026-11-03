import { FOUNTAIN_MINUTE_MS } from '../logic/fountain.js';
import { HOME_TIPS } from '../logic/homeTips.js';
import { WAR_BATTLE_IDS } from '../data/battles/index.js';

// Outil de dev : joueurs de test chargés par le menu devs.

const fullFountain = () => Date.now() - 24 * 60 * FOUNTAIN_MINUTE_MS;

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
];

export const TEST_PROFILES = {
  'test-wyrm': () => ({
    faction: 'wyrms',
    tutoBattleWon: true,
    units: WYRM_UNITS,
    army: { name: 'Armée 1', unitIds: WYRM_UNITS.map((unit) => unit.id) },
    spiritStones: 10000,
    playerXp: 1700, // niveau 3
    fallenLegendaryLevel: null, // Fafnir n'est jamais mort
    wonWarBattles: [...WAR_BATTLE_IDS],
    fountainLastHarvest: fullFountain(),
    homeTipsSeen: HOME_TIPS,
  }),
  'test-undead': () => ({
    faction: 'undead',
    tutoBattleWon: true,
    units: UNDEAD_UNITS,
    army: { name: 'Armée 1', unitIds: UNDEAD_UNITS.map((unit) => unit.id) },
    spiritStones: 50,
    playerXp: 1700, // niveau 3
    fallenLegendaryLevel: 2,
    wonWarBattles: ['battleStartW01', 'battleLow1W01'],
    fountainLastHarvest: fullFountain(),
    homeTipsSeen: HOME_TIPS,
  }),
};
