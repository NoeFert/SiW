// Morts-Vivants (units.md).
export default {
  id: 'undead',
  sovereignSprite: 'undead_sovereign',
  color: '#73ecbc',
  // Dossier assets/ui/<uiColor>/
  uiColor: 'purple',
  // Missile des attaques à distance.
  projectile: {
    key: 'missile-streak', path: 'effect/missile-streak.png', frames: 8, row: 3, impactColor: 0x7dffc8, // vert menthe
  },
  // `size` : 1, ou 2 pour un bloc 2x2.
  roster: {
    newRebornSkeleton: {
      name: 'New-reborn Skeleton',
      keywords: [],
      attackType: 'melee',
      size: 1,
      cost: 6,
      maxHp: 28,
      damage: 5,
      moveSpeed: 1.25,
      attackSpeed: 1.0,
      range: null,
    },
    necromantInitiate: {
      name: 'Necromant Initiate',
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
    athos: {
      name: 'Athos the Lord of Pain',
      keywords: ['legendary', 'flying'],
      attackType: 'ranged',
      size: 2,
      cost: 110,
      maxHp: 145,
      damage: 50,
      moveSpeed: 0.6,
      attackSpeed: 2.0,
      range: 5,
      firesWhileMoving: true, // s'arrête à 2 cases de sa cible (rules.md 4.5)
      abilities: [
        { trigger: 'periodic', every: 4, type: 'paralyze', attacks: 2, name: 'Frappe paralysante' },
        { trigger: 'onKill', type: 'heal', amount: 40, name: 'Soif de sang' },
      ],
    },
  },
  // Dotation de départ du joueur et réserve de l'IA.
  startingArmy: { newRebornSkeleton: 18, necromantInitiate: 8, athos: 1 },
};
