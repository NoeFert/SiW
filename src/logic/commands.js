// rules.md 5 : la pause pendant la sélection d'une commande est gérée par commandSelection.js
// et pause.js — ces fonctions attachent juste une intention à l'unité
// (`unit.command`), exécutée ensuite tick par tick par resolveCombatTick (combat.js).
// Une unité sans commande garde son comportement autonome déjà codé dans combat.js.
export const FLEE_COOLDOWN_SECONDS = 5;

// rules.md 5.1 : seul Fuir a un cooldown, partagé par camp : une seule fuite toutes les
// FLEE_COOLDOWN_SECONDS secondes, peu importe l'unité. Mesuré en temps de bataille, qui ne
// s'écoule pas pendant les pauses : le cooldown est donc gelé lui aussi.
export function createFleeState() {
  return { lastFleeTime: -Infinity };
}

export function canFlee(fleeState, currentTime) {
  return currentTime - fleeState.lastFleeTime >= FLEE_COOLDOWN_SECONDS;
}

export function getFleeCooldownRemaining(fleeState, currentTime) {
  return Math.max(0, FLEE_COOLDOWN_SECONDS - (currentTime - fleeState.lastFleeTime));
}

export function commandAttack(unit, target) {
  unit.command = { type: 'attack', target };
  return true;
}

export function commandMoveTo(unit, x, y) {
  unit.command = { type: 'moveTo', x, y };
  return true;
}

export function commandFlee(fleeState, currentTime, unit) {
  if (!canFlee(fleeState, currentTime)) return false;
  unit.command = { type: 'flee' };
  fleeState.lastFleeTime = currentTime;
  return true;
}
