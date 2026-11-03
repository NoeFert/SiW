import { FACTIONS } from './data/factions/index.js';

// Rendu partagé entre Phaser et React. Une case = 64 px à la résolution de référence.
export const CELL_SIZE = 64;
export const GRID_WIDTH = 24;
export const GRID_HEIGHT = 14;
export const GAME_WIDTH = GRID_WIDTH * CELL_SIZE; // 1536
export const GAME_HEIGHT = GRID_HEIGHT * CELL_SIZE; // 896

// Couleur de faction en 0xRRGGBB pour Phaser.
export function factionColor(factionId) {
  return Number.parseInt(FACTIONS[factionId].color.slice(1), 16);
}

export function woundedHpColor(ratio) {
  return ratio > 0.25 ? 0xff9f1a : 0xe74c3c;
}

export function cssColor(hex) {
  return `#${hex.toString(16).padStart(6, '0')}`;
}

export function cellCenter(x, y, size = 1) {
  return { x: (x + size / 2) * CELL_SIZE, y: (y + size / 2) * CELL_SIZE };
}

// `null` tant que le canevas n'existe pas.
export function getCanvasRect() {
  return document.querySelector('#phaser-root canvas')?.getBoundingClientRect() ?? null;
}

export function gridToScreen(rect, x, y, size = 1) {
  const center = cellCenter(x, y, size);
  return canvasToScreen(rect, center.x, center.y);
}

export function canvasToScreen(rect, x, y) {
  const scale = rect.width / GAME_WIDTH;
  return { x: rect.left + x * scale, y: rect.top + y * scale };
}

export function screenToGrid(rect, clientX, clientY) {
  const scale = rect.width / GAME_WIDTH;
  return {
    x: Math.floor((clientX - rect.left) / scale / CELL_SIZE),
    y: Math.floor((clientY - rect.top) / scale / CELL_SIZE),
  };
}
