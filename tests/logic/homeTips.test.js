import { createUnit, createStartingUnits } from '../../src/logic/ownedUnits.js';
import { createArmy } from '../../src/logic/army.js';
import { summonPrice } from '../../src/logic/summon.js';
import { HOME_TIPS, homeTipToShow, markTipSeen } from '../../src/logic/homeTips.js';
import { FACTIONS } from '../../src/data/factions/index.js';

const WYRMS_ROSTER = FACTIONS.wyrms.roster;

// Par défaut : dotation intacte, toute dans l'armée, aucun solde.
function context(overrides = {}) {
  const units = createStartingUnits(FACTIONS.wyrms.startingArmy);
  return {
    seen: [],
    justSummoned: false,
    units,
    army: createArmy('Armée 1', units),
    roster: WYRMS_ROSTER,
    startingArmy: FACTIONS.wyrms.startingArmy,
    spiritStones: 0,
    ...overrides,
  };
}

// Dotation de départ moins un Ver de Lambton (mort en bataille), armée à jour.
function afterLosingALambton(overrides = {}) {
  const units = createStartingUnits(FACTIONS.wyrms.startingArmy);
  units.splice(units.findIndex((u) => u.species === 'lambtonWorm'), 1);
  return context({ units, army: createArmy('Armée 1', units), ...overrides });
}

describe('homeTipToShow — conseil d\'invocation (remplacer ses morts)', () => {
  const price = summonPrice(WYRMS_ROSTER.lambtonWorm);

  test('une unité perdue et de quoi la remplacer : le conseil d\'invocation', () => {
    expect(homeTipToShow(afterLosingALambton({ seen: ['welcome'], spiritStones: price }))).toBe('summon');
  });

  test('pas de conseil sans assez de Spirit Stones pour une espèce perdue', () => {
    expect(homeTipToShow(afterLosingALambton({ seen: ['welcome'], spiritStones: price - 1 }))).toBeNull();
  });

  test('pas de conseil sans perte, même avec un gros solde', () => {
    expect(homeTipToShow(context({ seen: ['welcome'], spiritStones: 10000 }))).toBeNull();
  });

  test('après la bienvenue, avant le conseil de l\'armée', () => {
    expect(homeTipToShow(afterLosingALambton({ spiritStones: price }))).toBe('welcome');
    expect(HOME_TIPS).toEqual(['welcome', 'summon', 'armyRecruit']);
  });
});

describe('homeTipToShow — conseil à afficher en arrivant sur l\'accueil', () => {
  test('première arrivée : le conseil de bienvenue', () => {
    expect(homeTipToShow(context())).toBe('welcome');
  });

  test('bienvenue prioritaire : un seul conseil par arrivée, même si un autre est prêt', () => {
    const ctx = context({ justSummoned: true });
    ctx.units = [...ctx.units, createUnit('lambtonWorm')]; // recrue hors de l'armée
    expect(homeTipToShow(ctx)).toBe('welcome');
  });

  test('après une invocation, recrue hors de l\'armée : le conseil de l\'armée', () => {
    const ctx = context({ seen: ['welcome'], justSummoned: true });
    ctx.units = [...ctx.units, createUnit('lambtonWorm')];
    expect(homeTipToShow(ctx)).toBe('armyRecruit');
  });

  test('pas de conseil de l\'armée sans invocation (unités retirées volontairement)', () => {
    const ctx = context({ seen: ['welcome'] });
    ctx.army = createArmy('Armée 1', ctx.units.slice(0, 1));
    expect(homeTipToShow(ctx)).toBeNull();
  });

  test('pas de conseil de l\'armée si la recrue y est déjà', () => {
    expect(homeTipToShow(context({ seen: ['welcome'], justSummoned: true }))).toBeNull();
  });

  test('un conseil vu ne réapparaît jamais', () => {
    const ctx = context({ seen: [...HOME_TIPS], justSummoned: true });
    ctx.units = [...ctx.units, createUnit('lambtonWorm')];
    expect(homeTipToShow(ctx)).toBeNull();
  });
});

describe('markTipSeen', () => {
  test('ajoute le conseil une seule fois', () => {
    expect(markTipSeen([], 'welcome')).toEqual(['welcome']);
    expect(markTipSeen(['welcome'], 'welcome')).toEqual(['welcome']);
  });
});
