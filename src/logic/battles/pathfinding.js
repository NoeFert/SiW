export const DIRECTIONS = [
  { dx: -1, dy: -1 }, { dx: 0, dy: -1 }, { dx: 1, dy: -1 },
  { dx: -1, dy: 0 }, { dx: 1, dy: 0 },
  { dx: -1, dy: 1 }, { dx: 0, dy: 1 }, { dx: 1, dy: 1 },
];

export function chebyshevDistance(x1, y1, x2, y2) {
  return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2));
}

// Ennemi le plus proche, puis moins de PV, puis `id` (rules.md 3).
export function compareTargets(unit, a, b) {
  return minDistanceBetweenFootprints(unit, a) - minDistanceBetweenFootprints(unit, b)
    || a.hp - b.hp
    || a.id - b.id;
}

export function footprint(x, y, size) {
  const cells = [];
  for (let dx = 0; dx < size; dx++) {
    for (let dy = 0; dy < size; dy++) {
      cells.push({ x: x + dx, y: y + dy });
    }
  }
  return cells;
}

export function minDistanceBetweenFootprints(a, b) {
  let min = Infinity;
  for (const cellA of footprint(a.x, a.y, a.size)) {
    for (const cellB of footprint(b.x, b.y, b.size)) {
      const dist = chebyshevDistance(cellA.x, cellA.y, cellB.x, cellB.y);
      if (dist < min) min = dist;
    }
  }
  return min;
}

export function occupiedCells(units, excludeUnit) {
  const occupied = new Set();
  for (const other of units) {
    if (other === excludeUnit || !other.isAlive) continue;
    for (const { x, y } of footprint(other.x, other.y, other.size)) {
      occupied.add(`${x},${y}`);
    }
  }
  return occupied;
}

export function isPositionFree(x, y, size, grid, occupied, flying) {
  for (const cell of footprint(x, y, size)) {
    if (!grid.isInBounds(cell.x, cell.y)) return false;
    if (grid.blocks(cell.x, cell.y, flying)) return false;
    if (occupied.has(`${cell.x},${cell.y}`)) return false;
  }
  return true;
}

// Pas de coin d'obstacle coupé en diagonale (rules.md 3).
export function canStep(x, y, dx, dy, size, grid, occupied, flying) {
  if (!isPositionFree(x + dx, y + dy, size, grid, occupied, flying)) return false;
  if (dx === 0 || dy === 0) return true;
  return ![...footprint(x + dx, y, size), ...footprint(x, y + dy, size)]
    .some((cell) => grid.blocks(cell.x, cell.y, flying));
}

// Parcours en largeur vers la case la plus proche qui satisfait `isGoal`.
export function findPathToNearest(unit, grid, units, isGoal) {
  if (isGoal(unit.x, unit.y)) return [];
  const occupied = occupiedCells(units, unit);
  const startKey = `${unit.x},${unit.y}`;
  const cameFrom = new Map([[startKey, null]]);
  const queue = [{ x: unit.x, y: unit.y }];

  for (let i = 0; i < queue.length; i++) {
    const current = queue[i];
    for (const { dx, dy } of DIRECTIONS) {
      const nx = current.x + dx;
      const ny = current.y + dy;
      const key = `${nx},${ny}`;
      if (cameFrom.has(key)) continue;
      if (!canStep(current.x, current.y, dx, dy, unit.size, grid, occupied, unit.isFlying)) continue;
      cameFrom.set(key, `${current.x},${current.y}`);
      if (isGoal(nx, ny)) {
        const path = [];
        for (let k = key; k !== startKey; k = cameFrom.get(k)) path.unshift(parseKey(k));
        return path;
      }
      queue.push({ x: nx, y: ny });
    }
  }
  return [];
}

function parseKey(key) {
  const [x, y] = key.split(',').map(Number);
  return { x, y };
}

// A* vers la case libre la plus proche de (targetX, targetY).
export function findPath(unit, targetX, targetY, grid, units) {
  const occupied = occupiedCells(units, unit);
  const size = unit.size;
  const startX = unit.x;
  const startY = unit.y;

  // Départage les égalités en faveur de la ligne droite.
  const dxLine = targetX - startX;
  const dyLine = targetY - startY;
  const lineBias = (x, y) => Math.abs(dxLine * (y - startY) - dyLine * (x - startX)) * 0.001;

  const startKey = `${startX},${startY}`;
  const gScore = new Map([[startKey, 0]]);
  const cameFrom = new Map();
  const openF = new Map([[startKey, chebyshevDistance(startX, startY, targetX, targetY)]]);
  const closed = new Set();

  let bestKey = startKey;
  let bestDist = chebyshevDistance(startX, startY, targetX, targetY);
  let bestG = 0;

  while (openF.size > 0) {
    let currentKey = null;
    let currentF = Infinity;
    for (const [key, f] of openF) {
      if (f < currentF) {
        currentF = f;
        currentKey = key;
      }
    }
    openF.delete(currentKey);
    closed.add(currentKey);

    const { x: cx, y: cy } = parseKey(currentKey);
    const g = gScore.get(currentKey);
    const dist = chebyshevDistance(cx, cy, targetX, targetY);

    if (dist < bestDist || (dist === bestDist && g < bestG)) {
      bestKey = currentKey;
      bestDist = dist;
      bestG = g;
      if (dist === 0) break;
    }

    for (const { dx, dy } of DIRECTIONS) {
      const nx = cx + dx;
      const ny = cy + dy;
      const key = `${nx},${ny}`;
      if (closed.has(key)) continue;
      if (!canStep(cx, cy, dx, dy, size, grid, occupied, unit.isFlying)) continue;

      const tentativeG = g + 1;
      if (gScore.has(key) && tentativeG >= gScore.get(key)) continue;

      gScore.set(key, tentativeG);
      cameFrom.set(key, currentKey);
      openF.set(key, tentativeG + chebyshevDistance(nx, ny, targetX, targetY) + lineBias(nx, ny));
    }
  }

  if (bestKey === startKey) return [];

  const path = [];
  let key = bestKey;
  while (cameFrom.has(key)) {
    path.unshift(parseKey(key));
    key = cameFrom.get(key);
  }
  return path;
}
