import './memoryLocalStorage.js';
import {
  EMPTY_PROFILE, useProfileStore, chooseFaction, applyVictory, applyWarDefeat, summonUnits,
  resummonLegendary, setArmy, startFountain, harvestSpiritFountain, markHomeTipSeen, resetProfile,
  replaceProfile,
} from '../../src/state/profileStore.js';
import { WYRMS_ROSTER } from '../../src/data/wyrmsRoster.js';
import { BATTLES } from '../../src/data/battles.js';
import { FOUNTAIN_MINUTE_MS } from '../../src/logic/fountain.js';
import { FIRST_BATTLE_PLAYER_XP } from '../../src/logic/levels.js';
import { summonPrice } from '../../src/logic/summon.js';
import { TEST_PROFILES } from '../../src/dev/testProfiles.js';

const profile = () => useProfileStore.getState();

// Unité de bataille minimale (voir src/logic/unit.js) qui représente l'individu `individualId`.
const deployed = (individualId, { alive = true } = {}) => ({
  individualId, faction: 'player', level: 1, killXp: 0, isAlive: alive,
});

// Joueur Wyrms après la bataille 01 : deux Vers de Lambton et Fafnir, tous dans l'armée.
function wyrmsPlayer(overrides = {}) {
  replaceProfile({
    faction: 'wyrms',
    firstBattleWon: true,
    units: [
      { id: 'w1', species: 'lambtonWorm', xp: 0 },
      { id: 'w2', species: 'lambtonWorm', xp: 0 },
      { id: 'f', species: 'fafnir', xp: 0 },
    ],
    army: { name: 'Armée 1', unitIds: ['w1', 'w2', 'f'] },
    ...overrides,
  });
}

beforeEach(() => {
  resetProfile();
  localStorage.clear();
});

describe('profil du joueur — sauvegarde (technical.md 5.4)', () => {
  test('profil vide au départ', () => {
    expect(profile()).toEqual(EMPTY_PROFILE);
  });

  test('chaque changement est sauvegardé sous une seule clé du localStorage', () => {
    chooseFaction('undead');

    const saved = JSON.parse(localStorage.getItem('siw.save'));
    expect(saved.state.faction).toBe('undead');
    expect(saved.state.units).toEqual(profile().units);
  });

  test('resetProfile repart du profil vide', () => {
    wyrmsPlayer();
    resetProfile();
    expect(profile()).toEqual(EMPTY_PROFILE);
  });
});

describe('choix de la faction (rules.md 11.1/11.3)', () => {
  test('dotation de départ : les copies de units.md, niveau 1', () => {
    chooseFaction('wyrms');

    const copies = Object.values(WYRMS_ROSTER).reduce((sum, species) => sum + species.copies, 0);
    expect(profile().faction).toBe('wyrms');
    expect(profile().units).toHaveLength(copies);
    expect(profile().units.every((unit) => unit.xp === 0)).toBe(true);
  });
});

describe('victoire (rules.md 11)', () => {
  test('bataille 01 : débloque l\'accueil, crée l\'armée avec les survivants, XP fixe', () => {
    wyrmsPlayer({ firstBattleWon: false, army: null });

    const report = applyVictory('firstBattle', [deployed('w1'), deployed('w2', { alive: false })]);

    expect(profile().firstBattleWon).toBe(true);
    expect(profile().units.map((unit) => unit.id)).toEqual(['w1', 'f']);
    expect(profile().army.unitIds).toEqual(['w1', 'f']);
    expect(profile().playerXp).toBe(FIRST_BATTLE_PLAYER_XP);
    expect(profile().wonWarBattles).toEqual([]);
    expect(report.xpGained).toBe(FIRST_BATTLE_PLAYER_XP);
  });

  test('« Partir en guerre » : la première victoire est retenue et paie la récompense pleine', () => {
    wyrmsPlayer();

    const report = applyVictory('war1', [deployed('w1')]);

    expect(profile().wonWarBattles).toEqual(['war1']);
    expect(report.spiritStonesGained).toBeGreaterThanOrEqual(BATTLES.war1.reward);
  });

  test('rejeu d\'une bataille déjà gagnée : pas retenue deux fois, récompense de rejeu (11.7)', () => {
    wyrmsPlayer({ wonWarBattles: ['war1'] });

    const report = applyVictory('war1', [deployed('w1')]);

    expect(profile().wonWarBattles).toEqual(['war1']);
    expect(report.spiritStonesGained).toBe(0);
  });
});

describe('défaite dans « Partir en guerre » (rules.md 11.7)', () => {
  test('les individus tués sont perdus, retirés de la liste et de l\'armée', () => {
    wyrmsPlayer();

    const lost = applyWarDefeat([deployed('w1', { alive: false }), deployed('w2')]);

    expect(profile().units.map((unit) => unit.id)).toEqual(['w2', 'f']);
    expect(profile().army.unitIds).toEqual(['w2', 'f']);
    expect(lost).toEqual([{ species: WYRMS_ROSTER.lambtonWorm, lost: 1 }]);
  });

  test('le niveau du [Légendaire] mort est mémorisé (11.4)', () => {
    wyrmsPlayer();

    applyWarDefeat([deployed('f', { alive: false })]);

    expect(profile().fallenLegendaryLevel).toBe(1);
  });
});

describe('invocation (rules.md 11.4)', () => {
  test('paie le prix, ajoute les individus (pas à l\'armée) et rend le conseil d\'invocation inutile', () => {
    const price = summonPrice(WYRMS_ROSTER.lambtonWorm);
    wyrmsPlayer({ spiritStones: 2 * price + 1 });

    expect(summonUnits('lambtonWorm', 2)).toBe(true);

    expect(profile().units.filter((unit) => unit.species === 'lambtonWorm')).toHaveLength(4);
    expect(profile().army.unitIds).toEqual(['w1', 'w2', 'f']);
    expect(profile().spiritStones).toBe(1);
    expect(profile().homeTipsSeen).toEqual(['summon']);
  });

  test('solde insuffisant : rien ne change', () => {
    wyrmsPlayer({ spiritStones: 0 });

    expect(summonUnits('lambtonWorm', 1)).toBe(false);

    expect(profile().units).toHaveLength(3);
    expect(profile().homeTipsSeen).toEqual([]);
  });

  test('réinvoque le [Légendaire] mort au niveau gardé', () => {
    wyrmsPlayer({
      units: [{ id: 'w1', species: 'lambtonWorm', xp: 0 }],
      army: { name: 'Armée 1', unitIds: ['w1'] },
      fallenLegendaryLevel: 3,
      spiritStones: 10000,
    });

    expect(resummonLegendary('fafnir', 3)).toBe(true);

    expect(profile().units.find((unit) => unit.species === 'fafnir').xp).toBe(150); // début du niveau 3
  });
});

describe('armée (rules.md 11.2)', () => {
  test('setArmy enregistre la nouvelle armée', () => {
    wyrmsPlayer();
    setArmy({ name: 'Les Vers', unitIds: ['w1'] });
    expect(profile().army).toEqual({ name: 'Les Vers', unitIds: ['w1'] });
  });
});

describe('Spirit Fountain (rules.md 11.8)', () => {
  test('se met en route une seule fois', () => {
    startFountain(1000);
    startFountain(5000);
    expect(profile().fountainLastHarvest).toBe(1000);
  });

  test('la récolte crédite le solde et repart de la dernière minute récoltée', () => {
    wyrmsPlayer({ spiritStones: 5, fountainLastHarvest: 0 });

    const collected = harvestSpiritFountain(100, 10 * FOUNTAIN_MINUTE_MS + 30000);

    expect(collected).toBe(30);
    expect(profile().spiritStones).toBe(35);
    expect(profile().fountainLastHarvest).toBe(10 * FOUNTAIN_MINUTE_MS);
  });

  test('vide : rien n\'est récolté', () => {
    wyrmsPlayer({ spiritStones: 5, fountainLastHarvest: 0 });

    expect(harvestSpiritFountain(100, 30000)).toBe(0);
    expect(profile().spiritStones).toBe(5);
  });
});

describe('conseils de l\'accueil (technical.md 5.5)', () => {
  test('un conseil vu n\'est retenu qu\'une fois', () => {
    markHomeTipSeen('welcome');
    markHomeTipSeen('welcome');
    expect(profile().homeTipsSeen).toEqual(['welcome']);
  });
});

describe('profils de test du menu devs (src/dev/testProfiles.js)', () => {
  test.each(Object.keys(TEST_PROFILES))('%s : tous les champs du profil, individus aux identifiants uniques', (name) => {
    const testProfile = TEST_PROFILES[name]();

    expect(Object.keys(testProfile).sort()).toEqual(Object.keys(EMPTY_PROFILE).sort());
    const ids = testProfile.units.map((unit) => unit.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(testProfile.army.unitIds.every((id) => ids.includes(id))).toBe(true);
  });
});
