import {
  warBattleState, isWarCompleted, victoryReward, resolveWarDefeat, invaderSpecies,
  invadersRepelled,
} from '../../src/logic/war.js';
import { WAR_MAP_01 } from '../../src/data/battles/war01/warMap01.js';
import { createArmy } from '../../src/logic/army.js';
import { BATTLES, WAR_BATTLE_IDS } from '../../src/data/battles/index.js';
import { FACTIONS } from '../../src/data/factions/index.js';

const UNDEAD_ROSTER = FACTIONS.undead.roster;
const WYRMS_ROSTER = FACTIONS.wyrms.roster;

const IDS = ['battleStartW01', 'battleLow1W01', 'battleLow2W01'];

describe('batailles de « Partir en guerre » (rules.md 11.7)', () => {
  test('trois batailles de deux zones, victoire à la fin du script de la dernière zone, sans tutoriel', () => {
    expect(WAR_BATTLE_IDS).toEqual(IDS);
    for (const id of IDS) {
      expect(BATTLES[id].phases).toHaveLength(2);
      expect(BATTLES[id].tutorial).toBeNull();
    }
  });

  test('scripts propres à « Partir en guerre » (11.7), coût en PP par zone selon la faction de l\'IA', () => {
    const cost = (script) => script.reduce((sum, { species }) => sum + species.cost, 0);
    const costs = (faction) => IDS.map((id) => BATTLES[id].phases.map((p) => cost(p.enemyScripts[faction])));
    expect(costs('wyrms')).toEqual([[75, 65], [75, 75], [75, 150]]);
    expect(costs('undead')).toEqual([[67, 67], [79, 79], [79, 239]]);
  });

  test('scripts : triés par instant, légendaire seulement au Fort, copies de units.md suffisantes par bataille', () => {
    for (const id of IDS) {
      for (const faction of ['wyrms', 'undead']) {
        const scripts = BATTLES[id].phases.map((p) => p.enemyScripts[faction]);
        for (const script of scripts) {
          expect(script.map((e) => e.time)).toEqual([...script.map((e) => e.time)].sort((a, b) => a - b));
        }
        const all = scripts.flat();
        const { roster, startingArmy } = FACTIONS[faction];
        for (const [key, species] of Object.entries(roster)) {
          expect(all.filter((e) => e.species === species).length).toBeLessThanOrEqual(startingArmy[key]);
        }
        const legendaries = all.filter((e) => e.species.keywords.includes('legendary'));
        expect(legendaries).toHaveLength(id === 'battleLow2W01' ? 1 : 0);
      }
    }
  });

  test('récompenses provisoires : 50 pour la bataille tutoriel, 60 / 80 / 100 ensuite', () => {
    expect(BATTLES.battleTuto.reward).toBe(50);
    expect(IDS.map((id) => BATTLES[id].reward)).toEqual([60, 80, 100]);
  });
});

describe('déblocage en séquence (rules.md 11.7)', () => {
  test('au départ, seule la première bataille de la guerre est disponible', () => {
    expect(IDS.map((id) => warBattleState(IDS, [], id))).toEqual(['available', 'locked', 'locked']);
  });

  test('gagner une bataille débloque la suivante ; une bataille gagnée reste marquée « gagnée »', () => {
    expect(IDS.map((id) => warBattleState(IDS, ['battleStartW01'], id))).toEqual(['won', 'available', 'locked']);
  });

  test('contenu terminé une fois les trois gagnées', () => {
    expect(isWarCompleted(IDS, ['battleStartW01', 'battleLow1W01'])).toBe(false);
    expect(isWarCompleted(IDS, ['battleStartW01', 'battleLow1W01', 'battleLow2W01'])).toBe(true);
  });
});

describe('récompense de victoire (rules.md 11.7)', () => {
  test('pleine la première fois, rien au rejeu', () => {
    expect(victoryReward(60, false)).toBe(60);
    expect([60, 80, 100].map((r) => victoryReward(r, true))).toEqual([0, 0, 0]);
  });
});

// Unité de bataille minimale (voir src/logic/battles/battleUnit.js).
const deployed = (individualId, { alive = true, level = 1 } = {}) => ({
  individualId, faction: 'player', level, killXp: 0, isAlive: alive,
});

describe('défaite dans « Partir en guerre » (rules.md 11.7)', () => {
  const units = [
    { id: 'w1', species: 'lambtonWorm', xp: 40 },
    { id: 'w2', species: 'lambtonWorm', xp: 0 },
    { id: 'f', species: 'fafnir', xp: 350 },
  ];
  const save = { units, army: createArmy('A', units), fallenLegendaryLevel: null };
  const { save: after, lost } = resolveWarDefeat(
    save, [deployed('w1', { alive: false }), deployed('w2'), deployed('f', { alive: false, level: 4 })], WYRMS_ROSTER,
  );

  test('les tués sont perdus quand même, retirés de la liste et de l\'armée', () => {
    expect(after.units).toEqual([{ id: 'w2', species: 'lambtonWorm', xp: 0 }]);
    expect(after.army.unitIds).toEqual(['w2']);
  });

  test('aucune XP pour les survivants', () => {
    expect(after.units[0].xp).toBe(0);
  });

  test('niveau du Légendaire mort mémorisé', () => {
    expect(after.fallenLegendaryLevel).toBe(4);
  });

  test('bilan des pertes par espèce', () => {
    expect(lost).toEqual([{ species: WYRMS_ROSTER.lambtonWorm, lost: 1 }, { species: WYRMS_ROSTER.fafnir, lost: 1 }]);
  });

  test('armée entièrement tuée : armée vide', () => {
    const { save: wiped } = resolveWarDefeat(save, units.map((u) => deployed(u.id, { alive: false })), WYRMS_ROSTER);
    expect(wiped.army.unitIds).toEqual([]);
  });
});

describe('envahisseurs de la map 1 (rules.md 11.7)', () => {
  test('trois emplacements d\'envahisseur : intersection du haut, intersection de droite, boss', () => {
    const invaders = WAR_MAP_01.nodes.filter((node) => node.invader);
    expect(invaders.map(({ id, invader }) => [id, invader])).toEqual([
      ['low4', 'basic'], ['top3', 'flying'], ['boss', 'legendary'],
    ]);
  });

  test('chaque rôle désigne l\'espèce ennemie correspondante', () => {
    expect(['basic', 'flying', 'legendary'].map((role) => invaderSpecies(WYRMS_ROSTER, role).name))
      .toEqual(['Lambton Worm', 'Amphiptère', 'Fafnir the Cursed One']);
    expect(['basic', 'flying', 'legendary'].map((role) => invaderSpecies(UNDEAD_ROSTER, role).name))
      .toEqual(['New-reborn Skeleton', 'Necromant Initiate', 'Athos the Lord of Pain']);
  });

  test('compte les envahisseurs repoussés : emplacements d\'envahisseur dont la bataille est gagnée', () => {
    expect(invadersRepelled(WAR_MAP_01.nodes, IDS)).toEqual({ repelled: 0, total: 3 });
    const nodes = [{ invader: 'basic', battle: 'b1' }, { invader: 'flying', battle: 'b2' }, { battle: 'b3' }];
    expect(invadersRepelled(nodes, ['b1', 'b3'])).toEqual({ repelled: 1, total: 2 });
  });
});
