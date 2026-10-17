import { FACTIONS } from '../../src/data/factions/index.js';

const UNDEAD_ROSTER = FACTIONS.undead.roster;
// Vérifie que les données transcrites correspondent exactement à units.md.

describe('faction undead — roster (units.md)', () => {
  test('New-reborn Skeleton', () => {
    expect(UNDEAD_ROSTER.newRebornSkeleton).toMatchObject({
      size: 1,
      cost: 6,
      maxHp: 28,
      damage: 5,
      moveSpeed: 1.25,
      attackSpeed: 1.0,
      range: null,
    });
  });

  test('Necromant Initiate', () => {
    expect(UNDEAD_ROSTER.necromantInitiate).toMatchObject({
      size: 1,
      cost: 25,
      maxHp: 14,
      damage: 10,
      moveSpeed: 2,
      attackSpeed: 1.3,
      range: 4,
    });
    expect(UNDEAD_ROSTER.necromantInitiate.keywords).toContain('flying');
  });

  test('Athos the Lord of Pain', () => {
    expect(UNDEAD_ROSTER.athos).toMatchObject({
      size: 2,
      cost: 110,
      maxHp: 145,
      damage: 50,
      moveSpeed: 0.6,
      attackSpeed: 2.0,
      range: 5,
    });
    expect(UNDEAD_ROSTER.athos.keywords).toEqual(expect.arrayContaining(['legendary', 'flying']));
    expect(UNDEAD_ROSTER.athos.abilities).toEqual([
      { trigger: 'periodic', every: 4, type: 'paralyze', attacks: 2, name: 'Frappe paralysante' },
      { trigger: 'onKill', type: 'heal', amount: 40, name: 'Soif de sang' },
    ]);
  });
});

describe('faction undead — identité et armée de départ', () => {
  test('id et sprite du souverain', () => {
    expect(FACTIONS.undead.id).toBe('undead');
    expect(FACTIONS.undead.sovereignSprite).toBe('undead_sovereign');
  });

  test('armée de départ : les « Copies de départ » de units.md', () => {
    expect(FACTIONS.undead.startingArmy).toEqual({ newRebornSkeleton: 18, necromantInitiate: 8, athos: 1 });
  });
});
