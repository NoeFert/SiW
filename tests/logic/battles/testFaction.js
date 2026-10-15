// Factions de test. Dans les tests, les espèces fictives portent leur nombre de copies de départ
// (`copies`) directement, pour rester courtes ; ces fonctions en tirent la faction attendue par
// le moteur ({ roster, startingArmy }, comme src/data/factions/). Les objets espèce ne sont pas
// copiés : les réserves sont indexées par espèce.

export function startingArmyOf(roster) {
  return Object.fromEntries(Object.entries(roster).map(([key, species]) => [key, species.copies]));
}

export function testFaction(roster) {
  return { roster, startingArmy: startingArmyOf(roster) };
}
