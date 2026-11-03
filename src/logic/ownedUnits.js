// Individus possédés (rules.md 11.1).

// Identifiant aléatoire, jamais la taille de la liste (technical.md 5.4).
export function createUnit(species, xp = 0) {
  return { id: crypto.randomUUID(), species, xp };
}

export function createStartingUnits(startingArmy) {
  return Object.entries(startingArmy).flatMap(
    ([key, count]) => Array.from({ length: count }, () => createUnit(key)),
  );
}

export function isLegendary(species) {
  return species.keywords.includes('legendary');
}

// Niveau du [Légendaire] à sa mort (rules.md 11.4).
export function fallenLegendaryLevelAfter(roster, units, dead, previous) {
  let level = previous;
  for (const [id, deadLevel] of dead) {
    const unit = units.find((u) => u.id === id);
    if (unit && isLegendary(roster[unit.species])) level = deadLevel;
  }
  return level;
}

export function countUnitsBySpecies(roster, units) {
  const counts = Object.fromEntries(Object.keys(roster).map((key) => [key, 0]));
  for (const unit of units) counts[unit.species] += 1;
  return counts;
}
