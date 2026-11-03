// Comportement des unités à chaque tick (rules.md 3 à 6), identique pour les deux camps.
import {
  compareTargets, findPath, findPathToNearest, footprint, minDistanceBetweenFootprints, occupiedCells, isPositionFree, DIRECTIONS,
} from './pathfinding.js';

export function isAdjacent(a, b) {
  return minDistanceBetweenFootprints(a, b) === 1;
}

// Portée minimale de 2 cases (rules.md 4.5).
export function isInRange(attacker, target) {
  if (!attacker.species.range) return false;
  const dist = minDistanceBetweenFootprints(attacker, target);
  return dist > 1 && dist <= attacker.species.range;
}

// Au moins une case libre pour `mover` autour de la cible (rules.md 4.2).
function hasFreeAdjacentSlot(target, aliveUnits, mover, grid) {
  const occupied = occupiedCells(aliveUnits, mover);
  const targetCells = new Set(footprint(target.x, target.y, target.size).map(({ x, y }) => `${x},${y}`));
  const candidates = new Set();
  for (const cell of footprint(target.x, target.y, target.size)) {
    for (const { dx, dy } of DIRECTIONS) {
      candidates.add(`${cell.x + dx},${cell.y + dy}`);
    }
  }
  for (const key of candidates) {
    if (targetCells.has(key)) continue;
    const [x, y] = key.split(',').map(Number);
    if (isPositionFree(x, y, mover.size, grid, occupied, mover.isFlying)) return true;
  }
  return false;
}

// Ennemi le plus proche, ou le suivant si aucune case libre autour (rules.md 4.2).
export function chooseTarget(unit, aliveUnits, grid) {
  if (unit.target && unit.target.isOnField && unit.status === 'engaged') {
    return unit.target;
  }

  const enemies = aliveUnits.filter((u) => u.isOnField && u.faction !== unit.faction);
  if (enemies.length === 0) return null;

  const sorted = [...enemies].sort((a, b) => compareTargets(unit, a, b));

  if (unit.species.attackType !== 'melee') return sorted[0];

  const alreadyAdjacent = sorted.find((enemy) => isAdjacent(unit, enemy));
  if (alreadyAdjacent) return alreadyAdjacent;

  const reachable = sorted.find((enemy) => hasFreeAdjacentSlot(enemy, aliveUnits, unit, grid));
  return reachable ?? sorted[0];
}

function attackModeFor(unit, target) {
  const type = unit.species.attackType;
  if (type === 'hybrid') return isAdjacent(unit, target) ? 'melee' : 'ranged';
  return type;
}

function damageFor(unit, mode) {
  const { damage } = unit;
  return typeof damage === 'object' ? damage[mode] : damage;
}

function queueAttack(unit, target, mode, deltaSeconds, pendingAttacks) {
  unit.attackTimer += deltaSeconds;
  while (unit.attackTimer >= unit.species.attackSpeed) {
    unit.attackTimer -= unit.species.attackSpeed;
    pendingAttacks.push({ attacker: unit, target, mode });
  }
}

// Renvoie false si l'unité ne peut plus progresser.
function advance(unit, deltaSeconds, nextPath) {
  unit.moveProgress += unit.species.moveSpeed * deltaSeconds;
  while (unit.moveProgress >= 1) {
    const path = nextPath();
    if (path.length === 0) {
      unit.moveProgress = 0;
      return false;
    }
    unit.x = path[0].x;
    unit.y = path[0].y;
    unit.moveProgress -= 1;
  }
  return true;
}

function moveToward(unit, targetX, targetY, grid, aliveUnits, deltaSeconds) {
  return advance(unit, deltaSeconds, () => findPath(unit, targetX, targetY, grid, aliveUnits));
}

// Tir en avançant (Athos) : s'arrête à 2 cases (rules.md 4.5).
function advanceToMinRange(unit, target, grid, aliveUnits, deltaSeconds) {
  advance(unit, deltaSeconds, () => (
    minDistanceBetweenFootprints(unit, target) <= 2 ? [] : findPath(unit, target.x, target.y, grid, aliveUnits)
  ));
}

// Recul vers la case hors contact la plus proche (rules.md 4.5).
function stepAwayFrom(unit, target, grid, aliveUnits, deltaSeconds) {
  const isOutOfContact = (x, y) => minDistanceBetweenFootprints({ x, y, size: unit.size }, target) > 1;
  advance(unit, deltaSeconds, () => findPathToNearest(unit, grid, aliveUnits, isOutOfContact));
}

// Aptitudes périodiques (rules.md 6.1). La paralysie est posée plus tard par applyAttacks.
function applyPeriodicAbilities(attacker, target, baseDamage) {
  let damage = baseDamage;
  let paralyzes = 0;
  const triggered = [];
  for (const ability of attacker.species.abilities ?? []) {
    if (ability.trigger !== 'periodic' || attacker.attacksLanded % ability.every !== 0) continue;
    if (ability.type === 'bonusDamage') {
      damage *= ability.multiplier;
      triggered.push({ type: 'bonusDamage', unit: attacker, target, damage });
    }
    if (ability.type === 'paralyze') {
      paralyzes = ability.attacks;
      triggered.push({ type: 'paralyze', unit: target });
    }
  }
  return { damage, paralyzes, triggered };
}

function applyOnKillAbilities(attacker) {
  let healed = 0;
  for (const ability of attacker.species.abilities ?? []) {
    if (ability.trigger === 'onKill' && ability.type === 'heal') {
      const before = attacker.hp;
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + ability.amount);
      healed += attacker.hp - before;
    }
  }
  return healed;
}

// Dégâts de zone des [Légendaire] (rules.md 4.6).
export const ZONE_DAMAGE_PERCENT = 50;

function zoneDamage(damage) {
  return Math.floor((damage * ZONE_DAMAGE_PERCENT + 50) / 100);
}

function zoneVictims(attacker, target, units) {
  return units.filter((u) => u.isOnField && u.faction !== attacker.faction && u !== target
    && minDistanceBetweenFootprints(u, target) === 1);
}

function isOnEdge(x, y, size, grid) {
  return footprint(x, y, size).some(
    ({ x: cx, y: cy }) => cx === 0 || cy === 0 || cx === grid.width - 1 || cy === grid.height - 1,
  );
}

// Fuite vers le bord le plus proche (rules.md 5).
function processFlee(unit, grid, aliveUnits, deltaSeconds, pendingAttacks) {
  if (unit.status !== 'fleeing') {
    for (const enemy of aliveUnits) {
      if (enemy.faction !== unit.faction && enemy.status === 'engaged' && enemy.target === unit) {
        pendingAttacks.push({ attacker: enemy, target: unit, mode: 'melee', free: true });
      }
    }
  }

  unit.status = 'fleeing';
  const onEdge = (x, y) => isOnEdge(x, y, unit.size, grid);
  if (!onEdge(unit.x, unit.y) && findPathToNearest(unit, grid, aliveUnits, onEdge).length === 0) {
    const adjacentEnemies = aliveUnits.filter((e) => e.faction !== unit.faction && isAdjacent(unit, e));
    unit.target = unit.species.attackType === 'ranged'
      ? null
      : adjacentEnemies.sort((a, b) => compareTargets(unit, a, b))[0] ?? null;
    if (unit.target) queueAttack(unit, unit.target, 'melee', deltaSeconds, pendingAttacks);
    return;
  }

  unit.target = null;
  advance(unit, deltaSeconds, () => findPathToNearest(unit, grid, aliveUnits, onEdge));

  if (onEdge(unit.x, unit.y)) {
    unit.hasFled = true;
    unit.command = null;
  }
}

// Ordre « se déplacer » (rules.md 5).
function processMoveCommand(unit, grid, aliveUnits, deltaSeconds) {
  const { x, y } = unit.command;
  if (unit.x === x && unit.y === y) {
    unit.command = null;
    unit.status = 'idle';
    return;
  }
  unit.status = 'moving';
  const canProgress = moveToward(unit, x, y, grid, aliveUnits, deltaSeconds);
  if (!canProgress || (unit.x === x && unit.y === y)) unit.command = null;
}

// Applique toutes les attaques du tick en même temps (rules.md 4.1). Renvoie les évènements.
function applyAttacks(pendingAttacks, units) {
  const events = [];
  const landed = [];
  const toParalyze = [];

  for (const { attacker, target, mode, free } of pendingAttacks) {
    if (attacker.paralyzedAttacks > 0) {
      attacker.paralyzedAttacks -= 1;
      events.push({ type: 'missed', unit: attacker });
      continue;
    }

    events.push({ type: mode === 'ranged' ? 'rangedAttack' : 'meleeAttack', unit: attacker, target });
    const baseDamage = damageFor(attacker, mode);
    if (!free) attacker.attacksLanded += 1;
    const { damage, paralyzes, triggered } = free
      ? { damage: baseDamage, paralyzes: 0, triggered: [] }
      : applyPeriodicAbilities(attacker, target, baseDamage);
    events.push(...triggered);
    if (paralyzes > 0) toParalyze.push({ target, attacks: paralyzes });
    landed.push({ attacker, target, damage, targetWasAlive: target.isAlive });

    if (attacker.isLegendary && !free) {
      for (const victim of zoneVictims(attacker, target, units)) {
        events.push({ type: 'zoneHit', unit: attacker, target: victim });
        landed.push({ attacker, target: victim, damage: zoneDamage(damage), targetWasAlive: victim.isAlive });
      }
    }
  }

  for (const { target, damage } of landed) target.takeDamage(damage);
  for (const { target, attacks } of toParalyze) target.paralyzedAttacks = attacks; // sans cumul

  const killers = new Map(); // cible -> Map(attaquant -> dégâts)
  for (const { attacker, target, damage, targetWasAlive } of landed) {
    if (!targetWasAlive || target.isAlive || !attacker.isAlive) continue;
    if (!killers.has(target)) killers.set(target, new Map());
    const byAttacker = killers.get(target);
    byAttacker.set(attacker, (byAttacker.get(attacker) ?? 0) + damage);
  }

  for (const [target, byAttacker] of killers) {
    for (const attacker of byAttacker.keys()) {
      const healed = applyOnKillAbilities(attacker);
      if (healed > 0) events.push({ type: 'heal', unit: attacker, amount: healed });
    }
    // Un seul tueur gagne l'XP (rules.md 11.6).
    const [xpKiller] = [...byAttacker].sort(([a, da], [b, db]) => db - da || a.id - b.id)[0];
    xpKiller.killXp += target.species.cost;
  }

  return events;
}

export function updateUnitBehaviors(units, grid, deltaSeconds) {
  const aliveUnits = units.filter((u) => u.isOnField);
  const pendingAttacks = [];

  // Les unités en fuite bougent en dernier (rules.md 4.1).
  const isFleeing = (u) => u.command?.type === 'flee';
  const processingOrder = [...aliveUnits.filter((u) => !isFleeing(u)), ...aliveUnits.filter(isFleeing)];

  for (const unit of processingOrder) {
    // Le timer d'attaque ne court que pendant un échange de coups.
    const isTrading = unit.status === 'engaged' || unit.status === 'attacking'
      || (unit.status === 'fleeing' && unit.target);
    if (!isTrading) unit.attackTimer = 0;

    if (unit.command?.type === 'flee') {
      processFlee(unit, grid, aliveUnits, deltaSeconds, pendingAttacks);
      continue;
    }

    if (unit.command?.type === 'moveTo') {
      processMoveCommand(unit, grid, aliveUnits, deltaSeconds);
      continue;
    }

    if (unit.command?.type === 'attack' && !unit.command.target.isOnField) {
      unit.command = null; // cible morte ou enfuie
    }

    const target = unit.command?.type === 'attack' ? unit.command.target : chooseTarget(unit, aliveUnits, grid);
    unit.target = target;

    if (!target) {
      unit.status = 'idle';
      continue;
    }

    const mode = attackModeFor(unit, target);

    if (mode === 'melee') {
      if (isAdjacent(unit, target)) {
        unit.status = 'engaged';
        queueAttack(unit, target, 'melee', deltaSeconds, pendingAttacks);
      } else {
        unit.status = 'moving';
        moveToward(unit, target.x, target.y, grid, aliveUnits, deltaSeconds);
      }
      continue;
    }

    if (isAdjacent(unit, target)) {
      unit.status = 'moving';
      stepAwayFrom(unit, target, grid, aliveUnits, deltaSeconds);
    } else if (isInRange(unit, target)) {
      unit.status = 'attacking';
      queueAttack(unit, target, 'ranged', deltaSeconds, pendingAttacks);
      if (unit.species.attackType === 'hybrid') {
        moveToward(unit, target.x, target.y, grid, aliveUnits, deltaSeconds);
      } else if (unit.species.firesWhileMoving) {
        advanceToMinRange(unit, target, grid, aliveUnits, deltaSeconds);
      }
    } else {
      unit.status = 'moving';
      moveToward(unit, target.x, target.y, grid, aliveUnits, deltaSeconds);
    }
  }

  return applyAttacks(pendingAttacks, aliveUnits);
}
