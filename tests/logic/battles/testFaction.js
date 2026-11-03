// Factions de test : les espèces fictives portent leur nombre de copies (`copies`).

export function startingArmyOf(roster) {
  return Object.fromEntries(Object.entries(roster).map(([key, species]) => [key, species.copies]));
}

export function testFaction(roster) {
  return { roster, startingArmy: startingArmyOf(roster) };
}
