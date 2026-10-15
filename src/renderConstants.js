import { FACTIONS } from './data/factions/index.js';

// Constantes et conversions de rendu partagées entre la Scene Phaser (champ de bataille) et la
// couche React (glisser-déposer, main du tutoriel : pixel écran <-> case de grille), qui ne
// manipulent pas les objets l'une de l'autre.
// technical.md section 3 : une case de grille fait 64x64 px à l'affichage, à la résolution de
// référence (base design resolution) — celle que le Scale Manager de Phaser utilise en interne
// et vers laquelle il traduit toujours les coordonnées de pointeur, quelle que soit la taille
// CSS réelle du canevas à l'écran (technical.md 3.1).
export const CELL_SIZE = 64;
export const GRID_WIDTH = 24;
export const GRID_HEIGHT = 14;
export const GAME_WIDTH = GRID_WIDTH * CELL_SIZE; // 1536
export const GAME_HEIGHT = GRID_HEIGHT * CELL_SIZE; // 896

// GRAPHICS.md « Palettes des factions » : couleur principale d'une faction (champ `color` de
// src/data/factions/), en nombre 0xRRGGBB pour Phaser : barres de vie, zone de déploiement,
// indicateur de sélection.
export function factionColor(factionId) {
  return Number.parseInt(FACTIONS[factionId].color.slice(1), 16);
}

// Couleur d'alerte des PV d'une unité blessée dans la tour : rouge au même seuil que la barre.
export function woundedHpColor(ratio) {
  return ratio > 0.25 ? 0xff9f1a : 0xe74c3c;
}

export function cssColor(hex) {
  return `#${hex.toString(16).padStart(6, '0')}`;
}

// Centre (en px, référentiel fixe GAME_WIDTH x GAME_HEIGHT) d'un bloc de `size` x `size` cases
// dont le coin haut-gauche est la case (x, y) : une seule formule case -> pixel pour la Scene.
export function cellCenter(x, y, size = 1) {
  return { x: (x + size / 2) * CELL_SIZE, y: (y + size / 2) * CELL_SIZE };
}

// technical.md 3.1 : le canevas est affiché à une taille CSS variable (Phaser.Scale.FIT). Côté
// React (glisser-déposer), on passe par son rectangle réel à l'écran pour convertir un pixel
// écran en case. `null` tant que le canevas n'existe pas encore.
export function getCanvasRect() {
  return document.querySelector('#phaser-root canvas')?.getBoundingClientRect() ?? null;
}

// Inverse de screenToGrid : centre (en px écran) d'un bloc de `size` cases, pour pointer une
// case du terrain depuis la couche React (main du tutoriel).
export function gridToScreen(rect, x, y, size = 1) {
  const center = cellCenter(x, y, size);
  return canvasToScreen(rect, center.x, center.y);
}

// Point du canevas (px du jeu) -> px écran.
export function canvasToScreen(rect, x, y) {
  const scale = rect.width / GAME_WIDTH;
  return { x: rect.left + x * scale, y: rect.top + y * scale };
}

// Point de l'écran (px) -> case de la grille sous ce point.
export function screenToGrid(rect, clientX, clientY) {
  const scale = rect.width / GAME_WIDTH;
  return {
    x: Math.floor((clientX - rect.left) / scale / CELL_SIZE),
    y: Math.floor((clientY - rect.top) / scale / CELL_SIZE),
  };
}
