import { FACTIONS } from '../../src/data/factions/index.js';

const WYRMS_ROSTER = FACTIONS.wyrms.roster;
// Vérifie que les données transcrites correspondent exactement à units.md,
// pour détecter toute erreur de transcription des stats.

describe('faction wyrms — roster (units.md)', () => {
  test('Lambton Worm', () => {
    expect(WYRMS_ROSTER.lambtonWorm).toMatchObject({
      size: 1,
      cost: 10,
      maxHp: 50,
      damage: 8,
      moveSpeed: 1.25,
      attackSpeed: 1.0,
      range: null,
    });
  });

  test('Amphiptère', () => {
    expect(WYRMS_ROSTER.amphiptere).toMatchObject({
      size: 1,
      cost: 25,
      maxHp: 14,
      damage: 10,
      moveSpeed: 2,
      attackSpeed: 1.3,
      range: 4,
    });
    expect(WYRMS_ROSTER.amphiptere.keywords).toContain('flying');
  });

  test('Fafnir the Cursed One', () => {
    expect(WYRMS_ROSTER.fafnir).toMatchObject({
      size: 2,
      cost: 110,
      maxHp: 220,
      damage: { ranged: 30, melee: 45 },
      moveSpeed: 0.75,
      attackSpeed: 1.8,
      range: 3,
    });
    expect(WYRMS_ROSTER.fafnir.keywords).toEqual(expect.arrayContaining(['legendary', 'flying']));
    expect(WYRMS_ROSTER.fafnir.abilities).toEqual([
      { trigger: 'periodic', every: 5, type: 'bonusDamage', multiplier: 2, name: 'Attaque dévastatrice' },
    ]);
  });
});

describe('faction wyrms — identité et armée de départ', () => {
  test('id et sprite du souverain', () => {
    expect(FACTIONS.wyrms.id).toBe('wyrms');
    expect(FACTIONS.wyrms.sovereignSprite).toBe('wyrm_sovereign');
  });

  test('armée de départ : les « Copies de départ » de units.md', () => {
    expect(FACTIONS.wyrms.startingArmy).toEqual({ lambtonWorm: 12, amphiptere: 8, fafnir: 1 });
  });
});
