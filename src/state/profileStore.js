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

// Profil du joueur : tout ce qui survit d'une session à l'autre (technical.md 5.4). C'est le seul
// état sauvegardé du jeu, sous une seule clé du localStorage. L'état d'une bataille en cours, lui,
// n'est jamais sauvegardé.
export const EMPTY_PROFILE = {
  faction: null, // 'wyrms' | 'undead', null avant le choix de faction
  tutoBattleWon: false, // la bataille tutoriel a été gagnée : l'accueil est débloqué
  units: [], // individus possédés, chacun { id, species, xp } (rules.md 11.1)
  army: null, // { name, unitIds } (rules.md 11.2), null avant la victoire de la bataille tutoriel
  spiritStones: 0, // solde (rules.md 11.3)
  playerXp: 0, // XP du joueur (rules.md 11.5)
  fallenLegendaryLevel: null, // niveau du [Légendaire] à sa dernière mort (rules.md 11.4), null s'il n'est jamais mort
  wonWarBattles: [], // identifiants des batailles de « Partir en guerre » gagnées (rules.md 11.7)
  fountainLastHarvest: null, // heure (ms) de la dernière récolte de la Spirit Fountain (rules.md 11.8), null tant qu'elle n'est pas en route
  homeTipsSeen: [], // conseils du tutoriel de l'accueil déjà vus (technical.md 5.5)
};

// Les composants React lisent le profil avec ce hook, par exemple
// `useProfileStore((profile) => profile.spiritStones)`, et se redessinent quand la valeur change.
// Le middleware `persist` sauvegarde automatiquement chaque changement dans le localStorage.
export const useProfileStore = create(persist(() => EMPTY_PROFILE, {
  name: 'siw.save',
  version: 1,
  storage: createJSONStorage(() => localStorage),
}));

const getProfile = useProfileStore.getState;
const updateProfile = useProfileStore.setState;

// -- Actions ----------------------------------------------------------------------------------
// Seules ces fonctions modifient le profil. Les règles elles-mêmes vivent dans src/logic/ ; les
// actions ne font que lire le profil, appeler ces règles et enregistrer le résultat.

// rules.md 11.1/11.3 : au choix de la faction, dotation de départ et somme de départ.
export function chooseFaction(faction) {
  updateProfile({
    faction,
    units: createStartingUnits(FACTIONS[faction].startingArmy),
    spiritStones: STARTING_SPIRIT_STONES,
  });
}

// rules.md 11 : conséquences d'une victoire — morts retirés, XP, récompense (réduite au rejeu,
// 11.7), armée de départ créée après la bataille tutoriel, batailles de guerre gagnées retenues.
// `battleUnits` : unités de la bataille (battle.units), vide si la bataille tutoriel est passée depuis
// le menu devs. Renvoie le bilan affiché sur l'écran de victoire.
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

// rules.md 11.7 : défaite, abandon ou match nul d'une bataille de « Partir en guerre » — les
// individus tués sont perdus quand même. Renvoie les pertes affichées sur l'écran de défaite.
export function applyWarDefeat(battleUnits) {
  const profile = getProfile();
  const { save, lost } = resolveWarDefeat(profile, battleUnits, FACTIONS[profile.faction].roster);
  updateProfile(save);
  return lost;
}

// rules.md 11.4 : invoque `count` individus d'une espèce qui n'est pas [Légendaire]. Renvoie
// false si c'est impossible (solde insuffisant…).
export function summonUnits(speciesKey, count) {
  const { faction, units, spiritStones } = getProfile();
  return applySummon(summonMany(FACTIONS[faction].roster, units, spiritStones, speciesKey, count));
}

// rules.md 11.4 : réinvoque le [Légendaire] mort, au niveau gardé `level` (de 1 à son niveau à
// sa mort). Renvoie false si c'est impossible.
export function resummonLegendary(speciesKey, level) {
  const {
    faction, units, spiritStones, fallenLegendaryLevel,
  } = getProfile();
  return applySummon(summon(FACTIONS[faction].roster, units, spiritStones, speciesKey, level, fallenLegendaryLevel ?? 1));
}

// Enregistre le résultat d'une invocation (`null` : impossible). technical.md 5.5 : invoquer de
// soi-même rend le conseil d'invocation inutile.
function applySummon(result) {
  if (!result) return false;
  updateProfile({
    units: result.units,
    spiritStones: result.spiritStones,
    homeTipsSeen: markTipSeen(getProfile().homeTipsSeen, 'summon'),
  });
  return true;
}

// rules.md 11.2 : nouvelle composition ou nouveau nom de l'armée (calculés par src/logic/army.js).
export function setArmy(army) {
  updateProfile({ army });
}

// rules.md 11.8 : la Spirit Fountain se met en route, vide, à la première arrivée sur l'accueil.
export function startFountain(nowMs = Date.now()) {
  if (getProfile().fountainLastHarvest === null) updateProfile({ fountainLastHarvest: nowMs });
}

// rules.md 11.8 : récolte tout le contenu de la fontaine et l'ajoute au solde. Renvoie le nombre
// de Spirit Stones récoltées (0 si elle était vide).
export function harvestSpiritFountain(capacity, nowMs = Date.now()) {
  const profile = getProfile();
  const { collected, lastHarvestMs } = harvestFountain(profile.fountainLastHarvest, nowMs, capacity);
  if (collected > 0) {
    updateProfile({ fountainLastHarvest: lastHarvestMs, spiritStones: profile.spiritStones + collected });
  }
  return collected;
}

// technical.md 5.5 : un conseil de l'accueil n'apparaît qu'une fois.
export function markHomeTipSeen(tip) {
  updateProfile({ homeTipsSeen: markTipSeen(getProfile().homeTipsSeen, tip) });
}

// Repart comme au tout premier lancement (menu des paramètres de l'accueil, menu devs).
export function resetProfile() {
  updateProfile(EMPTY_PROFILE);
}

// Menu devs : remplace tout le profil par un profil de test (src/dev/testProfiles.js).
export function replaceProfile(profile) {
  updateProfile({ ...EMPTY_PROFILE, ...profile });
}
