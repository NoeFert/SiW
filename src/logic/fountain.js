// Couche méta (rules.md 11.8) : Spirit Fountain de l'accueil. Logique pure — le
// temps est passé en paramètre (horodatages en millisecondes), la sauvegarde vit dans
// src/state/profileStore.js.

// rules.md 11.8 : 3 Spirit Stones par minute entière, capacité 80 + 10 × niveau (provisoires).
export const FOUNTAIN_MINUTE_MS = 60 * 1000;
export const FOUNTAIN_STONES_PER_MINUTE = 3;
export const FOUNTAIN_BASE_CAPACITY = 80;
export const FOUNTAIN_CAPACITY_PER_LEVEL = 10;

export function fountainCapacity(playerLevel) {
  return FOUNTAIN_BASE_CAPACITY + FOUNTAIN_CAPACITY_PER_LEVEL * playerLevel;
}

// Contenu : 3 × minutes entières écoulées depuis la dernière récolte, plafonné à la capacité,
// jamais négatif (horloge reculée).
export function fountainContent(lastHarvestMs, nowMs, capacity) {
  const minutes = Math.floor((nowMs - lastHarvestMs) / FOUNTAIN_MINUTE_MS);
  return Math.min(capacity, Math.max(0, FOUNTAIN_STONES_PER_MINUTE * minutes));
}

// rules.md 11.8 : récolte tout le contenu. La minute entamée est conservée (l'heure de référence
// n'avance que des minutes récoltées) ; si la fontaine était pleine, le surplus est perdu et la
// production repart de maintenant. Hors fontaine pleine, le contenu est toujours un multiple de
// 3 : l'heure avance donc d'un nombre entier de minutes. Renvoie { collected, lastHarvestMs }.
export function harvestFountain(lastHarvestMs, nowMs, capacity) {
  const collected = fountainContent(lastHarvestMs, nowMs, capacity);
  if (collected === 0) return { collected, lastHarvestMs };
  return {
    collected,
    lastHarvestMs: collected === capacity
      ? nowMs
      : lastHarvestMs + (collected / FOUNTAIN_STONES_PER_MINUTE) * FOUNTAIN_MINUTE_MS,
  };
}
