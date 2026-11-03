// Spirit Fountain (rules.md 11.8).

export const FOUNTAIN_MINUTE_MS = 60 * 1000;
export const FOUNTAIN_STONES_PER_MINUTE = 3;
export const FOUNTAIN_BASE_CAPACITY = 80;
export const FOUNTAIN_CAPACITY_PER_LEVEL = 10;

export function fountainCapacity(playerLevel) {
  return FOUNTAIN_BASE_CAPACITY + FOUNTAIN_CAPACITY_PER_LEVEL * playerLevel;
}

export function fountainContent(lastHarvestMs, nowMs, capacity) {
  const minutes = Math.floor((nowMs - lastHarvestMs) / FOUNTAIN_MINUTE_MS);
  return Math.min(capacity, Math.max(0, FOUNTAIN_STONES_PER_MINUTE * minutes));
}

// La minute entamée est conservée, sauf si la fontaine était pleine.
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
