// Statique — faction des Morts-Vivants (rules.md 9, units.md). Son nom et le titre de son
// souverain, affichés au joueur, sont dans src/ui/strings.js (`factions`, `sovereignName`).
export default {
  id: 'undead',
  sovereignSprite: 'undead_sovereign', // assets/sprites/<sovereignSprite>.png
  // Couleur principale (menthe) : textes et jauges de la faction, barres de vie sur le terrain.
  color: '#73ecbc',
  // Palette d'interface : dossier assets/ui/<uiColor>/ (survol des boutons, curseurs, coins, barre
  // de défilement, map de guerre, badge et barre d'XP de la faction ; voir src/ui/factionTheme.js).
  uiColor: 'purple',
  // Missile des attaques à distance des unités de la faction (GRAPHICS.md « Projectiles »), joué
  // en entier pendant son vol : planche d'effets assets/effect/ (images de 64 × 64, une ligne par
  // couleur, une colonne par étape), `row` : ligne utilisée, `frames` : nombre d'étapes ;
  // `impactColor` : cercle d'impact à l'arrivée.
  projectile: {
    key: 'missile-streak', path: 'effect/missile-streak.png', frames: 8, row: 3, impactColor: 0x7dffc8, // vert menthe
  },
  // Espèces de la faction (units.md). `size` = côté du bloc carré occupé en cases (1, ou 2 pour
  // un bloc 2x2) ; `range` = null pour une unité sans attaque à distance.
  roster: {
    newRebornSkeleton: {
      name: 'New-reborn Skeleton',
      keywords: [],
      attackType: 'melee',
      size: 1,
      cost: 6,
      maxHp: 22,
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
      maxHp: 18,
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
      firesWhileMoving: true, // rules.md 4.5 : tire en avançant, s'arrête à 2 cases de sa cible
      abilities: [
        { trigger: 'periodic', every: 4, type: 'paralyze', attacks: 2, name: 'Frappe paralysante' },
        { trigger: 'onKill', type: 'heal', amount: 40, name: 'Soif de sang' },
      ],
    },
  },
  // « Copies de départ » de units.md, par espèce : les individus donnés au joueur au choix de la
  // faction (rules.md 11.1), et la réserve de l'IA quand elle joue cette faction.
  startingArmy: { newRebornSkeleton: 18, necromantInitiate: 8, athos: 1 },
};
