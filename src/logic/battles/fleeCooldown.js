// Cooldown de la fuite, partagé par camp (rules.md 5.1).
export const FLEE_COOLDOWN_SECONDS = 5;

export function createFleeState() {
  return { lastFleeTime: -Infinity };
}

export function canFlee(fleeState, currentTime) {
  return currentTime - fleeState.lastFleeTime >= FLEE_COOLDOWN_SECONDS;
}

export function getFleeCooldownRemaining(fleeState, currentTime) {
  return Math.max(0, FLEE_COOLDOWN_SECONDS - (currentTime - fleeState.lastFleeTime));
}
