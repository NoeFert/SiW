// Statique — faction des Wyrms (rules.md 9, units.md). Son nom et le titre de son souverain,
// affichés au joueur, sont dans src/ui/strings.js (`factions`, `sovereignName`).
export default {
  id: 'wyrms',
  sovereignSprite: 'wyrm_sovereign', // assets/sprites/<sovereignSprite>.png
  // Couleur principale (doré) : textes et jauges de la faction, barres de vie sur le terrain.
  color: '#eab532',
  // Palette d'interface : dossier assets/ui/<uiColor>/ (survol des boutons, curseurs, coins,
  // barre de défilement, map de guerre, badge et barre d'XP de la faction ; voir src/ui/factionTheme.js).
  uiColor: 'gold',
  // Espèces de la faction (units.md). `size` = côté du bloc carré occupé en cases (1, ou 2 pour
  // un bloc 2x2) ; `range` = null pour une unité sans attaque à distance.
  roster: {
    lambtonWorm: {
      name: 'Lambton Worm',
      keywords: [],
      attackType: 'melee',
      size: 1,
      cost: 10,
      maxHp: 40,
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
      maxHp: 18,
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
  // « Copies de départ » de units.md, par espèce : les individus donnés au joueur au choix de la
  // faction (rules.md 11.1), et la réserve de l'IA quand elle joue cette faction.
  startingArmy: { lambtonWorm: 12, amphiptere: 8, fafnir: 1 },
};
