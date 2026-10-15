// rules.md 5.1 : seul l'ordre Fuir a un cooldown, partagé par camp : une seule fuite toutes les
// FLEE_COOLDOWN_SECONDS secondes, peu importe l'unité. Mesuré en temps de bataille, qui ne
// s'écoule pas pendant les pauses : le cooldown est donc gelé lui aussi.
// L'ordre lui-même est donné par playerActions.js (issuePlayerFlee).
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
