import {
  createUnit, createStartingUnits, countUnitsBySpecies,
} from '../../src/logic/ownedUnits.js';
import { FACTIONS } from '../../src/data/factions/index.js';

const WYRMS_ROSTER = FACTIONS.wyrms.roster;
const UNDEAD_ROSTER = FACTIONS.undead.roster;

describe('createUnit — individu (rules.md 11.1)', () => {
  test('un individu a un identifiant, une espèce et une XP (niveau 1, 0 XP par défaut)', () => {
    const unit = createUnit('lambtonWorm');
    expect(Object.keys(unit).sort()).toEqual(['id', 'species', 'xp']);
    expect(unit.species).toBe('lambtonWorm');
    expect(unit.xp).toBe(0);
  });

  test('chaque individu a un identifiant unique', () => {
    expect(createUnit('lambtonWorm').id).not.toBe(createUnit('lambtonWorm').id);
  });
});

describe('createStartingUnits — dotation de départ (rules.md 11.1)', () => {
  test('Wyrms : 12 Vers de Lambton, 8 Amphiptères, 1 Fafnir', () => {
    const units = createStartingUnits(FACTIONS.wyrms.startingArmy);
    expect(countUnitsBySpecies(WYRMS_ROSTER, units)).toEqual({ lambtonWorm: 12, amphiptere: 8, fafnir: 1 });
  });

  test('Morts-Vivants : autant d\'individus que l\'armée de départ de la faction', () => {
    const units = createStartingUnits(FACTIONS.undead.startingArmy);
    expect(countUnitsBySpecies(UNDEAD_ROSTER, units)).toEqual(FACTIONS.undead.startingArmy);
  });

  test('tous les identifiants sont distincts', () => {
    const units = createStartingUnits(FACTIONS.wyrms.startingArmy);
    expect(new Set(units.map((u) => u.id)).size).toBe(units.length);
  });
});

describe('countUnitsBySpecies', () => {
  test('une espèce sans individu compte 0', () => {
    expect(countUnitsBySpecies(WYRMS_ROSTER, [createUnit('amphiptere')]))
      .toEqual({ lambtonWorm: 0, amphiptere: 1, fafnir: 0 });
  });
});
