import Grid from '../../../src/logic/battles/grid.js';
import Unit from '../../../src/logic/battles/unit.js';
import { WYRMS_ROSTER } from '../../../src/data/wyrmsRoster.js';
import { updateUnitBehaviors } from '../../../src/logic/battles/unitBehavior.js';
import { createFleeState, FLEE_COOLDOWN_SECONDS } from '../../../src/logic/battles/fleeCooldown.js';
import { issuePlayerAttack, issuePlayerMoveTo, issuePlayerFlee } from '../../../src/logic/battles/playerActions.js';

// Ennemi inerte (ne bouge pas, n'attaque jamais dans la fenêtre d'un test, PV élevés).
const INERT = {
  keywords: [], attackType: 'melee', size: 1, maxHp: 1000, damage: 1, moveSpeed: 0, attackSpeed: 999, range: null,
};

describe('issuePlayerAttack — override du comportement autonome (rules.md 5)', () => {
  test('force le ciblage d\'un ennemi précis même si un autre est plus proche', () => {
    const grid = new Grid(20, 20);
    const unit = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 0, 0);
    const closeEnemy = new Unit(WYRMS_ROSTER.lambtonWorm, 'enemy', 1, 0); // adjacent, ciblé par défaut
    const farEnemy = new Unit(WYRMS_ROSTER.lambtonWorm, 'enemy', 10, 0);

    expect(issuePlayerAttack(unit, farEnemy)).toBe(true);
    updateUnitBehaviors([unit, closeEnemy, farEnemy], grid, 0.5);

    expect(unit.target).toBe(farEnemy);
    expect(closeEnemy.hp).toBe(closeEnemy.species.maxHp); // pas engagée malgré l'adjacence
  });

  test('l\'emporte sur un engagement en cours : l\'unité quitte son combat', () => {
    const grid = new Grid(20, 20);
    const unit = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 5, 5);
    const engagedEnemy = new Unit(INERT, 'enemy', 4, 5);
    const farEnemy = new Unit(INERT, 'enemy', 15, 5);
    updateUnitBehaviors([unit, engagedEnemy, farEnemy], grid, 0.1);
    expect(unit.status).toBe('engaged');

    issuePlayerAttack(unit, farEnemy);
    updateUnitBehaviors([unit, engagedEnemy, farEnemy], grid, 2);

    expect(unit.target).toBe(farEnemy);
    expect(unit.x).toBeGreaterThan(5);
    expect(engagedEnemy.hp).toBe(INERT.maxHp);
  });

  test('une unité à distance avance jusqu\'à avoir la cible à portée, puis tire', () => {
    const grid = new Grid(20, 20);
    const shooter = new Unit(WYRMS_ROSTER.amphiptere, 'player', 0, 5);
    const target = new Unit(INERT, 'enemy', 10, 5);

    issuePlayerAttack(shooter, target);
    for (let i = 0; i < 60; i++) updateUnitBehaviors([shooter, target], grid, 0.1);

    expect(shooter.x).toBe(10 - WYRMS_ROSTER.amphiptere.range); // s'arrête à portée
    expect(target.hp).toBeLessThan(INERT.maxHp);
  });

  test.each([
    ['meurt', (target) => target.takeDamage(target.hp)],
    ['fuit le terrain', (target) => { target.hasFled = true; }],
  ])('prend fin quand la cible %s : retour au comportement autonome', (_, removeTarget) => {
    const grid = new Grid(20, 20);
    const unit = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 0, 5);
    const target = new Unit(INERT, 'enemy', 10, 5);
    const other = new Unit(INERT, 'enemy', 0, 15);

    issuePlayerAttack(unit, target);
    updateUnitBehaviors([unit, target, other], grid, 0.1);
    removeTarget(target);
    updateUnitBehaviors([unit, target, other], grid, 0.1);

    expect(unit.command).toBeNull();
    expect(unit.target).toBe(other);
  });
});

describe('priorité à la dernière commande (rules.md 5)', () => {
  test('une commande Aller donnée pendant une fuite remplace la fuite', () => {
    const grid = new Grid(20, 20);
    const state = createFleeState();
    const unit = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 10, 10);

    issuePlayerFlee(state, 0, unit);
    updateUnitBehaviors([unit], grid, 0.1);
    expect(unit.status).toBe('fleeing');

    issuePlayerMoveTo(unit, 12, 10);
    for (let i = 0; i < 40; i++) updateUnitBehaviors([unit], grid, 0.1);

    expect({ x: unit.x, y: unit.y, hasFled: unit.hasFled }).toEqual({ x: 12, y: 10, hasFled: false });
  });

  test('une commande Fuir donnée pendant une attaque remplace l\'attaque', () => {
    const grid = new Grid(20, 20);
    const state = createFleeState();
    const unit = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 1, 10);
    const target = new Unit(INERT, 'enemy', 15, 10);

    issuePlayerAttack(unit, target);
    updateUnitBehaviors([unit, target], grid, 0.1);
    issuePlayerFlee(state, 0, unit);
    for (let i = 0; i < 20; i++) updateUnitBehaviors([unit, target], grid, 0.1);

    expect(unit.hasFled).toBe(true);
  });
});

describe('issuePlayerMoveTo (rules.md 5)', () => {
  test('déplace l\'unité vers la case désignée puis termine la commande à l\'arrivée', () => {
    const grid = new Grid(20, 20);
    const unit = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 0, 0); // vitesse 2.5 cases/s

    expect(issuePlayerMoveTo(unit, 5, 0)).toBe(true);

    updateUnitBehaviors([unit], grid, 1); // 2,5 cases : pas encore arrivé
    expect(unit.command).not.toBeNull();
    expect(unit.x).toBeGreaterThan(0);
    expect(unit.x).toBeLessThan(5);

    updateUnitBehaviors([unit], grid, 5); // largement de quoi finir le trajet
    expect(unit.x).toBe(5);
    expect(unit.y).toBe(0);
    expect(unit.command).toBeNull();
  });

  test('pendant le trajet, l\'unité ne combat pas, même frappée', () => {
    const grid = new Grid(20, 20);
    const unit = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 5, 5);
    const enemy = new Unit(WYRMS_ROSTER.lambtonWorm, 'enemy', 6, 5); // la poursuit et la frappe
    updateUnitBehaviors([unit, enemy], grid, 0.1); // engagement mutuel

    issuePlayerMoveTo(unit, 5, 15);
    for (let i = 0; i < 40 && unit.command; i++) updateUnitBehaviors([unit, enemy], grid, 0.1);

    expect(unit.hp).toBeLessThan(unit.species.maxHp);
    expect(enemy.hp).toBe(enemy.species.maxHp);
  });

  test('destination sur un obstacle : s\'arrête au plus près puis reprend le combat autonome', () => {
    const grid = new Grid(20, 20, [{ x: 5, y: 0 }]);
    const unit = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 0, 0);
    const enemy = new Unit(WYRMS_ROSTER.lambtonWorm, 'enemy', 10, 5);

    issuePlayerMoveTo(unit, 5, 0);
    for (let i = 0; i < 60; i++) updateUnitBehaviors([unit, enemy], grid, 0.1);

    expect(unit.command).toBeNull();
    expect(enemy.hp).toBeLessThan(enemy.species.maxHp); // a repris le combat
  });

  test('bloc 2x2 envoyé sur la dernière colonne (il n\'y tient pas) : la commande se termine', () => {
    const grid = new Grid(20, 20);
    const fafnir = new Unit(WYRMS_ROSTER.fafnir, 'player', 10, 5);

    issuePlayerMoveTo(fafnir, 19, 5);
    for (let i = 0; i < 150; i++) updateUnitBehaviors([fafnir], grid, 0.1);

    expect(fafnir.x).toBe(18); // au plus près possible
    expect(fafnir.command).toBeNull();
  });
});

describe('issuePlayerFlee — atteindre le bord (rules.md 5 et 2)', () => {
  test('l\'unité quitte le terrain une fois le bord atteint, PV conservés', () => {
    const grid = new Grid(10, 10);
    const state = createFleeState();
    const unit = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 1, 5); // à 1 case du bord gauche
    unit.hp = 17; // PV déjà réduits, doivent être conservés tels quels

    expect(issuePlayerFlee(state, 0, unit)).toBe(true);
    updateUnitBehaviors([unit], grid, 1);

    expect(unit.hasFled).toBe(true);
    expect(unit.isOnField).toBe(false);
    expect(unit.hp).toBe(17);
  });

  test('depuis un état engagé : désengagement immédiat mais l\'adversaire porte une dernière attaque', () => {
    const grid = new Grid(10, 10);
    const state = createFleeState();
    const a = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 5, 5);
    const b = new Unit(WYRMS_ROSTER.lambtonWorm, 'enemy', 6, 5); // adjacente à a

    // Tick d'échauffement (delta trop court pour déclencher une attaque normale) : les deux
    // s'engagent mutuellement au corps-à-corps sans encore échanger de dégâts.
    updateUnitBehaviors([a, b], grid, 0.1);
    expect(a.status).toBe('engaged');
    expect(b.status).toBe('engaged');

    expect(issuePlayerFlee(state, 0.1, a)).toBe(true);

    // Delta volontairement minuscule : si la dernière attaque n'était pas garantie,
    // le timer d'attaque normal de b (0.1 + 0.1 = 0.2s) ne suffirait pas à déclencher un coup.
    updateUnitBehaviors([a, b], grid, 0.1);

    expect(a.status).toBe('fleeing');
    expect(a.hp).toBe(a.species.maxHp - b.species.damage); // dernière attaque de b encaissée
    expect(b.hp).toBe(b.species.maxHp); // a ne riposte pas, elle fuit
  });

  test('chaque ennemi engagé sur l\'unité porte sa dernière attaque, une seule fois', () => {
    const grid = new Grid(10, 10);
    const state = createFleeState();
    const a = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 5, 5);
    const left = new Unit(WYRMS_ROSTER.lambtonWorm, 'enemy', 4, 5);
    const right = new Unit(WYRMS_ROSTER.lambtonWorm, 'enemy', 6, 5);
    updateUnitBehaviors([a, left, right], grid, 0.1); // engagement mutuel, pas encore de coup

    issuePlayerFlee(state, 0.1, a);
    updateUnitBehaviors([a, left, right], grid, 0.1);
    expect(a.hp).toBe(a.species.maxHp - 2 * left.species.damage);

    updateUnitBehaviors([a, left, right], grid, 0.1); // déjà en fuite : pas de nouvelle attaque gratuite
    expect(a.hp).toBe(a.species.maxHp - 2 * left.species.damage);
  });

  test('bord le plus proche bloqué : contourne vers une autre case de bord', () => {
    const grid = new Grid(10, 10);
    const state = createFleeState();
    const unit = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 1, 1);
    const blockers = [[0, 0], [1, 0], [2, 0], [0, 1], [0, 2]]
      .map(([x, y]) => new Unit(WYRMS_ROSTER.lambtonWorm, 'player', x, y)); // alliées, immobiles

    issuePlayerFlee(state, 0, unit);
    for (let i = 0; i < 20; i++) updateUnitBehaviors([unit, ...blockers], grid, 0.1);

    expect(unit.hasFled).toBe(true);
  });
});

describe('fuite sans aucun bord atteignable (rules.md 5)', () => {
  // Alliées inertes : seule l'unité en fuite peut blesser l'ennemi.
  function surround(fleeingSpecies) {
    const grid = new Grid(10, 10);
    const unit = new Unit(fleeingSpecies, 'player', 5, 5);
    const enemy = new Unit(WYRMS_ROSTER.lambtonWorm, 'enemy', 4, 5);
    const walls = [[4, 4], [5, 4], [6, 4], [6, 5], [4, 6], [5, 6], [6, 6]]
      .map(([x, y]) => new Unit(INERT, 'player', x, y));
    const units = [unit, enemy, ...walls];
    issuePlayerFlee(createFleeState(), 0, unit);
    return { grid, unit, enemy, walls, units };
  }

  test('stays in place, still fleeing, and strikes back in melee at its usual pace', () => {
    const { grid, unit, enemy, units } = surround(WYRMS_ROSTER.lambtonWorm);

    updateUnitBehaviors(units, grid, 0.1);
    updateUnitBehaviors(units, grid, WYRMS_ROSTER.lambtonWorm.attackSpeed);

    expect({ x: unit.x, y: unit.y, status: unit.status }).toEqual({ x: 5, y: 5, status: 'fleeing' });
    expect(enemy.hp).toBe(enemy.species.maxHp - WYRMS_ROSTER.lambtonWorm.damage);
  });

  test('a purely ranged unit does not strike back', () => {
    const { grid, enemy, units } = surround(WYRMS_ROSTER.amphiptere);

    updateUnitBehaviors(units, grid, 0.1);
    updateUnitBehaviors(units, grid, 2);

    expect(enemy.hp).toBe(enemy.species.maxHp);
  });

  test('resumes fleeing and stops striking back as soon as a path frees up', () => {
    const { grid, unit, enemy, walls, units } = surround(WYRMS_ROSTER.lambtonWorm);
    updateUnitBehaviors(units, grid, 0.1);
    updateUnitBehaviors(units, grid, 0.5); // riposte en cours, pas encore de coup
    const wall = walls.find((w) => w.x === 6 && w.y === 5);
    wall.takeDamage(wall.hp);

    updateUnitBehaviors(units, grid, 0.8); // assez pour un pas, et pour un coup si elle ripostait encore

    expect(unit.x).toBe(6);
    expect(enemy.hp).toBe(enemy.species.maxHp);
  });
});

describe('cooldown de la fuite (rules.md 5.1)', () => {
  test('bloque toute nouvelle fuite avant 5 secondes, peu importe l\'unité', () => {
    const state = createFleeState();
    const unitA = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 0, 0);
    const unitB = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 1, 1);

    expect(issuePlayerFlee(state, 0, unitA)).toBe(true);
    expect(issuePlayerFlee(state, 2, unitB)).toBe(false); // 2s < 5s, autre unité pourtant
    expect(unitB.command).toBeNull();

    expect(issuePlayerFlee(state, FLEE_COOLDOWN_SECONDS, unitB)).toBe(true);
  });

  test('Aller et Attaquer n\'ont pas de cooldown, même juste après une fuite', () => {
    const state = createFleeState();
    const unitA = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 0, 0);
    const unitB = new Unit(WYRMS_ROSTER.lambtonWorm, 'player', 1, 1);
    const target = new Unit(WYRMS_ROSTER.lambtonWorm, 'enemy', 5, 5);

    issuePlayerFlee(state, 0, unitA);
    expect(issuePlayerAttack(unitB, target)).toBe(true);
    expect(issuePlayerMoveTo(unitB, 3, 3)).toBe(true);
    expect(issuePlayerAttack(unitB, target)).toBe(true);
  });
});
