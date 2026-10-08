import {
  warBattleState, isWarCompleted, victoryReward, lossReport, resolveWarDefeat,
} from '../../src/logic/war.js';
import { createArmy } from '../../src/logic/army.js';
import { BATTLES, WAR_BATTLE_IDS } from '../../src/data/battles.js';
import { WYRMS_ROSTER } from '../../src/data/wyrmsRoster.js';

const IDS = ['war1', 'war2', 'war3'];

describe('batailles de « Partir en guerre » (rules.md 11.7)', () => {
  test('trois batailles de deux zones, victoire à la fin du script de la dernière zone, sans tutoriel', () => {
    expect(WAR_BATTLE_IDS).toEqual(IDS);
    expect(IDS.map((id) => BATTLES[id].zones)).toEqual([['field', 'wall'], ['wall', 'lanes'], ['lanes', 'fort']]);
    for (const id of IDS) {
      expect(BATTLES[id].phases).toHaveLength(2);
      expect(BATTLES[id].tutorial).toBeNull();
      expect(BATTLES[id].orders).toBeUndefined(); // les trois ordres
      expect(BATTLES[id].surrenderAllowed).toBeUndefined(); // abandon possible
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
        for (const species of new Set(all.map((e) => e.species))) {
          expect(all.filter((e) => e.species === species).length).toBeLessThanOrEqual(species.copies);
        }
        const legendaries = all.filter((e) => e.species.keywords.includes('legendary'));
        expect(legendaries).toHaveLength(id === 'war3' ? 1 : 0);
      }
    }
  });

  test('le clickbait garde ses propres scripts', () => {
    expect(BATTLES.clickbaitBattle.phases[1].enemyScripts.wyrms).toHaveLength(3);
    expect(BATTLES.war1.phases[1].enemyScripts.wyrms).not.toBe(BATTLES.clickbaitBattle.phases[1].enemyScripts.wyrms);
  });

  test('récompenses provisoires : 50 pour la bataille 01, 60 / 80 / 100 ensuite', () => {
    expect(BATTLES.firstBattle.reward).toBe(50);
    expect(IDS.map((id) => BATTLES[id].reward)).toEqual([60, 80, 100]);
  });
});

describe('déblocage en séquence (rules.md 11.7)', () => {
  test('au départ, seule la bataille 1 est disponible', () => {
    expect(IDS.map((id) => warBattleState(IDS, [], id))).toEqual(['available', 'locked', 'locked']);
  });

  test('gagner une bataille débloque la suivante ; une bataille gagnée reste marquée « gagnée »', () => {
    expect(IDS.map((id) => warBattleState(IDS, ['war1'], id))).toEqual(['won', 'available', 'locked']);
  });

  test('contenu terminé une fois les trois gagnées', () => {
    expect(isWarCompleted(IDS, ['war1', 'war2'])).toBe(false);
    expect(isWarCompleted(IDS, ['war1', 'war2', 'war3'])).toBe(true);
  });
});

describe('récompense de victoire (rules.md 11.7)', () => {
  test('pleine la première fois, rien au rejeu', () => {
    expect(victoryReward(60, false)).toBe(60);
    expect([60, 80, 100].map((r) => victoryReward(r, true))).toEqual([0, 0, 0]);
  });
});

// Unité de bataille minimale (voir src/logic/unit.js).
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
