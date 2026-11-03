import fs from 'node:fs';
import Grid, { parseObstacleMap } from '../../src/logic/battles/grid.js';
import { DIRECTIONS, canStep } from '../../src/logic/battles/pathfinding.js';
import { BATTLES, TUTO_BATTLE_ID, WAR_BATTLE_IDS } from '../../src/data/battles/index.js';
import { WAR_MAP_01 } from '../../src/data/battles/war01/warMap01.js';
import { TEXT } from '../../src/ui/strings.js';

// Vérifie automatiquement chaque bataille de BATTLES et chaque phase.
const W = 24;
const H = 14;
const NO_UNITS = new Set();

// `closed` : cases infranchissables en plus ; `allowed` : cases autorisées.
function reachable(obstacles, start, size, { closed = [], allowed = () => true } = {}) {
  const grid = new Grid(W, H, [...obstacles, ...closed]);
  const fits = (from, dx, dy) => canStep(from.x, from.y, dx, dy, size, grid, NO_UNITS, false)
    && [...Array(size * size)].every((_, i) => allowed(from.x + dx + (i % size), from.y + dy + Math.floor(i / size)));
  const seen = new Set([`${start.x},${start.y}`]);
  const queue = [start];
  for (let i = 0; i < queue.length; i++) {
    for (const { dx, dy } of DIRECTIONS) {
      const next = { x: queue[i].x + dx, y: queue[i].y + dy };
      const key = `${next.x},${next.y}`;
      if (!seen.has(key) && fits(queue[i], dx, dy)) {
        seen.add(key);
        queue.push(next);
      }
    }
  }
  return seen;
}

function crossesField(obstacles, size, options) {
  const seen = reachable(obstacles, { x: 0, y: 5 }, size, options);
  return [...seen].some((key) => Number(key.split(',')[0]) === W - size);
}

const cells = (xs, ys) => xs.flatMap((x) => ys.map((y) => ({ x, y })));

describe('parseObstacleMap', () => {
  test('lit les rochers d\'une case et les rochers 2x2', () => {
    expect(parseObstacleMap(['#.@@', '..@@'])).toEqual([{ x: 0, y: 0 }, { x: 2, y: 0, size: 2 }]);
  });

  test('refuse un rocher 2x2 incomplet', () => {
    expect(() => parseObstacleMap(['@@', '@.'])).toThrow();
  });
});

const ALL_PHASES = Object.entries(BATTLES).flatMap(([id, battle]) => battle.phases.map(
  (phase, index) => [`${id}, phase ${index + 1}`, phase],
));

describe('batailles', () => {
  test('la bataille tutoriel et celles de « Partir en guerre » existent', () => {
    for (const id of [TUTO_BATTLE_ID, ...WAR_BATTLE_IDS]) expect(BATTLES[id]).toBeDefined();
  });

  test.each(Object.entries(BATTLES))('%s : récompense, au moins une phase', (_, battle) => {
    expect(Number.isInteger(battle.reward) && battle.reward > 0).toBe(true);
    expect(battle.phases.length).toBeGreaterThan(0);
  });

  test.each(WAR_BATTLE_IDS)('%s : un nom (strings.js) et un emplacement sur la map (warMaps.js)', (id) => {
    expect(TEXT.war.battleNames[id]).toEqual(expect.any(String));
    expect(WAR_MAP_01.nodes.some((node) => node.battle === id)).toBe(true);
  });
});

describe.each(ALL_PHASES)('%s', (_, phase) => {
  const map = phase.obstacles;
  const obstacles = parseObstacleMap(map);

  test('image de fond présente dans assets/backgrounds/', () => {
    expect(fs.existsSync(`assets/backgrounds/${phase.background.image}.png`)).toBe(true);
    expect(typeof phase.background.flipped).toBe('boolean');
  });

  test('scripts de l\'IA pour les deux factions, triés par instant (rules.md 7.1)', () => {
    for (const faction of ['wyrms', 'undead']) {
      const times = phase.enemyScripts[faction].map((entry) => entry.time);
      expect(times.length).toBeGreaterThan(0);
      expect(times).toEqual([...times].sort((a, b) => a - b));
    }
  });

  test('plan de 24 x 14 cases', () => {
    expect(map).toHaveLength(H);
    for (const row of map) expect(row).toHaveLength(W);
  });

  test('bord d\'entrée de l\'IA (colonne 23) entièrement libre (rules.md 7.2)', () => {
    const grid = new Grid(W, H, obstacles);
    for (let y = 0; y < H; y++) expect(grid.isObstacle(W - 1, y)).toBe(false);
  });

  test('aucune zone isolée : toute case libre est atteignable', () => {
    const grid = new Grid(W, H, obstacles);
    const free = W * H - grid.obstacles.size;
    expect(reachable(obstacles, { x: 0, y: 0 }, 1).size).toBe(free);
  });

  test('une Légendaire 2x2 peut traverser la zone', () => {
    expect(crossesField(obstacles, 2)).toBe(true);
  });
});

const WALL_ZONE_OBSTACLES = parseObstacleMap(BATTLES.battleStartW01.phases[1].obstacles);
const LANES_ZONE_OBSTACLES = parseObstacleMap(BATTLES.battleLow1W01.phases[1].obstacles);
const FORT_ZONE_OBSTACLES = parseObstacleMap(BATTLES.battleLow2W01.phases[1].obstacles);

describe('zone "Le mur" (battleStartW01, phase 2)', () => {
  const narrow = cells([13, 14, 15, 16, 17, 18], [3]);
  const wide = cells([13, 14, 15, 16, 17, 18], [10, 11]);

  test('mur étanche : les deux passages fermés, plus aucune traversée', () => {
    expect(crossesField(WALL_ZONE_OBSTACLES, 1, { closed: [...narrow, ...wide] })).toBe(false);
  });

  test('passage étroit : une unité d\'une case passe, une Légendaire 2x2 non', () => {
    expect(crossesField(WALL_ZONE_OBSTACLES, 1, { closed: wide })).toBe(true);
    expect(crossesField(WALL_ZONE_OBSTACLES, 2, { closed: wide })).toBe(false);
  });
});

describe('zone "Les trois couloirs" (battleLow1W01, phase 2)', () => {
  const betweenRidges = (x) => x >= 5 && x <= 19;

  test('entre les crêtes, aucun passage d\'un couloir à l\'autre au sol', () => {
    const top = reachable(LANES_ZONE_OBSTACLES, { x: 12, y: 1 }, 1, { allowed: betweenRidges });
    const middle = reachable(LANES_ZONE_OBSTACLES, { x: 12, y: 6 }, 1, { allowed: betweenRidges });
    expect(top.has('12,6')).toBe(false);
    expect(middle.has('12,12')).toBe(false);
  });

  test.each([['haut', 0, 0, 4], ['milieu', 6, 5, 8], ['bas', 11, 9, 13]])(
    'une Légendaire 2x2 parcourt le couloir du %s sans en sortir',
    (lane, y, minY, maxY) => {
      const inLane = (cx, cy) => cy >= minY && cy <= maxY;
      expect(reachable(LANES_ZONE_OBSTACLES, { x: 0, y }, 2, { allowed: inLane }).has(`22,${y}`)).toBe(true);
    },
  );
});

describe('zone "Le fort" (battleLow2W01, phase 2)', () => {
  const entrance = cells([9], [6, 7]);

  test('une Légendaire 2x2 peut entrer dans le fort', () => {
    expect(reachable(FORT_ZONE_OBSTACLES, { x: 12, y: 6 }, 2).has('5,6')).toBe(true);
  });

  test('fort étanche : entrée fermée, l\'intérieur est coupé du reste', () => {
    const inside = reachable(FORT_ZONE_OBSTACLES, { x: 6, y: 6 }, 1, { closed: entrance });
    expect(inside.has('12,6')).toBe(false);
  });
});
