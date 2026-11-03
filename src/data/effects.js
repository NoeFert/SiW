// Effets visuels communs aux factions. Planches assets/effect/ : une ligne par couleur.

export const PROJECTILE_FLIGHT_MS = 220;

// Entaille sur la victime d'un coup au corps-à-corps.
export const MELEE_EFFECT = {
  key: 'hit-slash', path: 'effect/hit-slash.png', frames: 8, row: 5, scale: 1, durationMs: 300,
};

// `repeat` : -1 = en boucle.
export const ABILITY_EFFECTS = {
  // Frappe paralysante (Athos) : en boucle tant que la victime est paralysée.
  paralyze: {
    key: 'hit-swirl', path: 'effect/hit-swirl.png', frames: 12, row: 3, scale: 1, repeat: -1, durationMs: 1500,
  },
  // Attaque dévastatrice (Fafnir)
  bonusDamage: {
    key: 'hit-spikes', path: 'effect/hit-spikes.png', frames: 13, row: 0, scale: 2, repeat: 0, durationMs: 1500,
  },
};

// Compteur d'aptitude périodique sous la barre de vie.
export const ABILITY_COUNTER_COLORS = {
  paralyze: 'green', // Athos
  bonusDamage: 'red', // Fafnir
};
