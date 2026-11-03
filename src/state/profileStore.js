import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { BATTLES, TUTO_BATTLE_ID } from '../data/battles/index.js';
import { FACTIONS } from '../data/factions/index.js';
import { harvestFountain } from '../logic/fountain.js';
import { markTipSeen } from '../logic/homeTips.js';
import { createStartingUnits } from '../logic/ownedUnits.js';
import { STARTING_SPIRIT_STONES, summon, summonMany } from '../logic/summon.js';
import { resolveVictory } from '../logic/victory.js';
import { resolveWarDefeat, victoryReward } from '../logic/war.js';
import { TEXT } from '../ui/strings.js';

// Profil du joueur, seul état sauvegardé (technical.md 5.4).
export const EMPTY_PROFILE = {
  faction: null, // 'wyrms' | 'undead'
  tutoBattleWon: false,
  units: [], // { id, species, xp }
  army: null, // { name, unitIds }
  spiritStones: 0,
  playerXp: 0,
  fallenLegendaryLevel: null, // niveau du [Légendaire] à sa dernière mort
  wonWarBattles: [],
  fountainLastHarvest: null, // heure (ms) de la dernière récolte
  homeTipsSeen: [],
};

export const useProfileStore = create(persist(() => EMPTY_PROFILE, {
  name: 'siw.save',
  version: 1,
  storage: createJSONStorage(() => localStorage),
}));

const getProfile = useProfileStore.getState;
const updateProfile = useProfileStore.setState;

// -- Actions --

export function chooseFaction(faction) {
  updateProfile({
    faction,
    units: createStartingUnits(FACTIONS[faction].startingArmy),
    spiritStones: STARTING_SPIRIT_STONES,
  });
}

// Renvoie le bilan de l'écran de victoire.
export function applyVictory(battleId, battleUnits) {
  const profile = getProfile();
  const tutoBattle = battleId === TUTO_BATTLE_ID;
  const replay = profile.wonWarBattles.includes(battleId);
  const { save, report } = resolveVictory(profile, battleUnits, FACTIONS[profile.faction].roster, {
    tutoBattle,
    armyName: TEXT.defaultArmyName,
    reward: victoryReward(BATTLES[battleId].reward, replay),
    replay,
  });
  updateProfile({
    ...save,
    tutoBattleWon: profile.tutoBattleWon || tutoBattle,
    wonWarBattles: tutoBattle || replay ? profile.wonWarBattles : [...profile.wonWarBattles, battleId],
  });
  return report;
}

// Renvoie les pertes de l'écran de défaite.
export function applyWarDefeat(battleUnits) {
  const profile = getProfile();
  const { save, lost } = resolveWarDefeat(profile, battleUnits, FACTIONS[profile.faction].roster);
  updateProfile(save);
  return lost;
}

export function summonUnits(speciesKey, count) {
  const { faction, units, spiritStones } = getProfile();
  return applySummon(summonMany(FACTIONS[faction].roster, units, spiritStones, speciesKey, count));
}

export function resummonLegendary(speciesKey, level) {
  const {
    faction, units, spiritStones, fallenLegendaryLevel,
  } = getProfile();
  return applySummon(summon(FACTIONS[faction].roster, units, spiritStones, speciesKey, level, fallenLegendaryLevel ?? 1));
}

function applySummon(result) {
  if (!result) return false;
  updateProfile({
    units: result.units,
    spiritStones: result.spiritStones,
    homeTipsSeen: markTipSeen(getProfile().homeTipsSeen, 'summon'),
  });
  return true;
}

export function setArmy(army) {
  updateProfile({ army });
}

export function startFountain(nowMs = Date.now()) {
  if (getProfile().fountainLastHarvest === null) updateProfile({ fountainLastHarvest: nowMs });
}

export function harvestSpiritFountain(capacity, nowMs = Date.now()) {
  const profile = getProfile();
  const { collected, lastHarvestMs } = harvestFountain(profile.fountainLastHarvest, nowMs, capacity);
  if (collected > 0) {
    updateProfile({ fountainLastHarvest: lastHarvestMs, spiritStones: profile.spiritStones + collected });
  }
  return collected;
}

export function markHomeTipSeen(tip) {
  updateProfile({ homeTipsSeen: markTipSeen(getProfile().homeTipsSeen, tip) });
}

export function resetProfile() {
  updateProfile(EMPTY_PROFILE);
}

export function replaceProfile(profile) {
  updateProfile({ ...EMPTY_PROFILE, ...profile });
}
