import { WAR_MAP_01 } from '../../src/data/battles/war01/warMap01.js';
import { WAR_BATTLE_IDS } from '../../src/data/battles/index.js';

// rules.md 11.7 / GRAPHICS.md « Partir en guerre » : le réseau de la map doit pouvoir se dessiner
// avec des connecteurs droits, sans ambiguïté.
describe('map 1 de « Partir en guerre » (rules.md 11.7)', () => {
  const byId = new Map(WAR_MAP_01.nodes.map((node) => [node.id, node]));
  // Cases traversées par un lien, extrémités exclues.
  const cellsBetween = ([a, b]) => {
    const from = byId.get(a);
    const to = byId.get(b);
    const cells = [];
    if (from.col === to.col) {
      for (let row = Math.min(from.row, to.row) + 1; row < Math.max(from.row, to.row); row += 1) {
        cells.push(`${from.col},${row}`);
      }
    } else {
      for (let col = Math.min(from.col, to.col) + 1; col < Math.max(from.col, to.col); col += 1) {
        cells.push(`${col},${from.row}`);
      }
    }
    return cells;
  };

  test('chaque lien relie deux emplacements existants, sur la même ligne ou la même colonne', () => {
    for (const [a, b] of WAR_MAP_01.links) {
      expect(byId.has(a) && byId.has(b)).toBe(true);
      const from = byId.get(a);
      const to = byId.get(b);
      expect(from.col === to.col || from.row === to.row).toBe(true);
    }
  });

  test('un lien ne traverse aucun emplacement, ni un autre lien', () => {
    const nodeCells = new Set(WAR_MAP_01.nodes.map((node) => `${node.col},${node.row}`));
    const seen = new Set();
    for (const link of WAR_MAP_01.links) {
      for (const cell of cellsBetween(link)) {
        expect(nodeCells.has(cell)).toBe(false);
        expect(seen.has(cell)).toBe(false);
        seen.add(cell);
      }
    }
  });

  test('les emplacements tiennent dans la grille, un par case', () => {
    const cells = WAR_MAP_01.nodes.map((node) => `${node.col},${node.row}`);
    expect(new Set(cells).size).toBe(cells.length);
    for (const node of WAR_MAP_01.nodes) {
      expect(node.col).toBeGreaterThanOrEqual(0);
      expect(node.col).toBeLessThan(WAR_MAP_01.cols);
      expect(node.row).toBeGreaterThanOrEqual(0);
      expect(node.row).toBeLessThan(WAR_MAP_01.rows);
    }
  });

  test('chaque bataille définie est portée par un emplacement, et un seul boss', () => {
    const battles = WAR_MAP_01.nodes.filter((node) => node.battle).map((node) => node.battle);
    expect(battles.sort()).toEqual([...WAR_BATTLE_IDS].sort());
    expect(WAR_MAP_01.nodes.filter((node) => node.boss)).toHaveLength(1);
  });
});
