// technical.md 5.5 : tutoriel de l'accueil — des conseils non bloquants, un par un, au moment
// où la fonction devient utile. Chaque conseil n'apparaît qu'une fois (liste des conseils vus,
// sauvegardée dans src/state/profileStore.js). Logique pure, sans React ni localStorage.

import { countUnitsBySpecies } from './ownedUnits.js';
import { summonPrice } from './summon.js';

// Ordre de priorité si plusieurs conseils sont prêts à la même arrivée.
export const HOME_TIPS = ['welcome', 'summon', 'armyRecruit'];

// `seen` : conseils déjà vus ; `justSummoned` : au moins une invocation depuis la dernière
// arrivée sur l'accueil ; `units` / `army` : individus possédés et armée (rules.md 11.2) ;
// `roster` / `startingArmy` : roster et armée de départ de la faction ; `spiritStones` : solde
// (rules.md 11.3).
const READY = {
  welcome: () => true,
  // Une espèce compte moins d'individus que sa dotation de départ (units.md, rules.md 11.1), et
  // le solde paie l'invocation d'un individu de cette espèce (rules.md 11.4).
  summon: ({
    roster, startingArmy, units, spiritStones,
  }) => {
    const counts = countUnitsBySpecies(roster, units);
    return Object.entries(roster)
      .some(([key, species]) => counts[key] < startingArmy[key] && spiritStones >= summonPrice(species));
  },
  // rules.md 11.2 : un individu invoqué n'est pas ajouté à l'armée.
  armyRecruit: ({ justSummoned, units, army }) => {
    const inArmy = new Set(army?.unitIds ?? []);
    return justSummoned && units.some((unit) => !inArmy.has(unit.id));
  },
};

// Conseil à afficher en arrivant sur l'accueil (au plus un), ou null.
export function homeTipToShow(context) {
  return HOME_TIPS.find((tip) => !context.seen.includes(tip) && READY[tip](context)) ?? null;
}

export function markTipSeen(seen, tip) {
  return seen.includes(tip) ? seen : [...seen, tip];
}
