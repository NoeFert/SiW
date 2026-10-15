// Statique — effets visuels de la bataille communs à toutes les factions (GRAPHICS.md
// « Projectiles », « Corps-à-corps », « Aptitudes »), joués par src/scenes/battle/CombatEffects.js
// et UnitViews.js ; le missile de chaque faction est dans ses données (src/data/factions/). Les
// animations viennent de planches d'effets (assets/effect/) : images de 64 × 64, une ligne par
// couleur (9 couleurs), une colonne par étape de l'animation. `row` : ligne de la couleur
// utilisée ; `frames` : nombre d'étapes.

// Durée du vol d'un missile d'attaque à distance (le missile de chaque faction est dans son
// fichier, `projectile`, src/data/factions/).
export const PROJECTILE_FLIGHT_MS = 220;

// Entaille blanche jouée une fois sur la victime de chaque coup au corps-à-corps, à la taille de
// son emprise.
export const MELEE_EFFECT = {
  key: 'hit-slash', path: 'effect/hit-slash.png', frames: 8, row: 5, scale: 1, durationMs: 300,
};

// Animation jouée sur l'unité touchée par une aptitude. `scale` : taille par rapport à l'emprise
// de l'unité ; `repeat` : -1 = en boucle.
export const ABILITY_EFFECTS = {
  // Vert, Frappe paralysante (Athos) : en boucle sur la victime tant qu'elle est paralysée.
  paralyze: {
    key: 'hit-swirl', path: 'effect/hit-swirl.png', frames: 12, row: 3, scale: 1, repeat: -1, durationMs: 1500,
  },
  // Orange, Attaque dévastatrice (Fafnir) : une fois, sur la victime.
  bonusDamage: {
    key: 'hit-spikes', path: 'effect/hit-spikes.png', frames: 13, row: 0, scale: 2, repeat: 0, durationMs: 1500,
  },
};

// Compteur d'une aptitude périodique (units.md 6.1, « toutes les N attaques »), sous la barre de
// vie : une rangée de N cases (assets/ui/<couleur>/step-slot-*.png), une case remplie par attaque
// portée depuis le dernier déclenchement. Couleur des cases, par type d'aptitude.
export const ABILITY_COUNTER_COLORS = {
  paralyze: 'green', // Frappe paralysante (Athos)
  bonusDamage: 'red', // Attaque dévastatrice (Fafnir)
};
