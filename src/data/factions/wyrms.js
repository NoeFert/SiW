// Wyrms (units.md).
export default {
  id: 'wyrms',
  sovereignSprite: 'wyrm_sovereign',
  color: '#eab532',
  // Dossier assets/ui/<uiColor>/
  uiColor: 'gold',
  // Missile des attaques à distance.
  projectile: {
    key: 'missile-burst', path: 'effect/missile-burst.png', frames: 15, row: 0, impactColor: 0xff8c1a, // orange
  },
  // `size` : 1, ou 2 pour un bloc 2x2.
  roster: {
    lambtonWorm: {
      name: 'Lambton Worm',
      keywords: [],
      attackType: 'melee',
      size: 1,
      cost: 10,
      maxHp: 50,
      damage: 8,
      moveSpeed: 1.25,
      attackSpeed: 1.0,
      range: null,
    },
    amphiptere: {
      name: 'Amphiptère',
      keywords: ['flying'],
      attackType: 'ranged',
      size: 1,
      cost: 25,
      maxHp: 14,
      damage: 10,
      moveSpeed: 2,
      attackSpeed: 1.3,
      range: 4,
    },
    fafnir: {
      name: 'Fafnir the Cursed One',
      keywords: ['legendary', 'flying'],
      attackType: 'hybrid',
      size: 2,
      cost: 110,
      maxHp: 220,
      damage: { ranged: 30, melee: 45 },
      moveSpeed: 0.75,
      attackSpeed: 1.8,
      range: 3,
      abilities: [
        { trigger: 'periodic', every: 5, type: 'bonusDamage', multiplier: 2, name: 'Attaque dévastatrice' },
      ],
    },
  },
  // Dotation de départ du joueur et réserve de l'IA.
  startingArmy: { lambtonWorm: 12, amphiptere: 8, fafnir: 1 },
};
