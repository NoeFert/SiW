// Constantes et conversions de rendu partagées entre la Scene Phaser (champ de bataille) et la
// couche React (glisser-déposer : pixel écran -> case de grille). Ni Phaser ni React ne
// dépendent l'un de l'autre : les deux importent seulement ce fichier neutre.
// technical.md section 3 : une case de grille fait 64x64 px à l'affichage, à la résolution de
// référence (base design resolution) — celle que le Scale Manager de Phaser utilise en interne
// et vers laquelle il traduit toujours les coordonnées de pointeur, quelle que soit la taille
// CSS réelle du canevas à l'écran (technical.md 3.1).
export const CELL_SIZE = 64;
export const GRID_WIDTH = 24;
export const GRID_HEIGHT = 14;
export const GAME_WIDTH = GRID_WIDTH * CELL_SIZE; // 1536
export const GAME_HEIGHT = GRID_HEIGHT * CELL_SIZE; // 896

// GRAPHICS.md « Palettes des factions » : couleur principale de chaque faction, celle des barres de
// vie de ses unités sur le terrain (Phaser) et dans la tour (React, voir `cssColor`). Mêmes
// teintes que --faction-wyrms / --faction-undead de index.css, converties en hexadécimal.
export const FACTION_COLORS = {
  wyrms: 0xeab532, // doré
  undead: 0x73ecbc, // menthe
};

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
  const scale = rect.width / GAME_WIDTH;
  const center = cellCenter(x, y, size);
  return { x: rect.left + center.x * scale, y: rect.top + center.y * scale };
}

export function screenToGrid(rect, clientX, clientY) {
  const scale = rect.width / GAME_WIDTH;
  return {
    x: Math.floor((clientX - rect.left) / scale / CELL_SIZE),
    y: Math.floor((clientY - rect.top) / scale / CELL_SIZE),
  };
}
