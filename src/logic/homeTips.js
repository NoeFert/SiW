// Conseils de l'accueil, un seul affiché à la fois (technical.md 5.5).

import { countUnitsBySpecies } from './ownedUnits.js';
import { summonPrice } from './summon.js';

// Ordre de priorité.
export const HOME_TIPS = ['welcome', 'summon', 'armyRecruit'];

const READY = {
  welcome: () => true,
  summon: ({
    roster, startingArmy, units, spiritStones,
  }) => {
    const counts = countUnitsBySpecies(roster, units);
    return Object.entries(roster)
      .some(([key, species]) => counts[key] < startingArmy[key] && spiritStones >= summonPrice(species));
  },
  armyRecruit: ({ justSummoned, units, army }) => {
    const inArmy = new Set(army?.unitIds ?? []);
    return justSummoned && units.some((unit) => !inArmy.has(unit.id));
  },
};

export function homeTipToShow(context) {
  return HOME_TIPS.find((tip) => !context.seen.includes(tip) && READY[tip](context)) ?? null;
}

export function markTipSeen(seen, tip) {
  return seen.includes(tip) ? seen : [...seen, tip];
}
