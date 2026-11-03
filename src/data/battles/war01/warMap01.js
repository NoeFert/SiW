// Map 1 : trois chemins du départ au boss, deux passerelles, trois impasses.
// Deux emplacements liés sont sur la même ligne ou la même colonne.
export const WAR_MAP_01 = {
  background: 'backgrounds/temporary-map1.png', // provisoire
  cols: 10,
  rows: 7,
  nodes: [
    { id: 'start', col: 0, row: 6, battle: 'battleStartW01' },
    // Chemin du bas, puis de droite.
    { id: 'low1', col: 2, row: 6, battle: 'battleLow1W01' },
    { id: 'low2', col: 4, row: 6, battle: 'battleLow2W01' },
    { id: 'low3', col: 7, row: 6 },
    { id: 'low4', col: 7, row: 4, invader: 'basic' },
    { id: 'low5', col: 9, row: 4 },
    // Chemin du milieu.
    { id: 'mid1', col: 2, row: 4, battle: 'battleMid1W01' },
    { id: 'mid2', col: 4, row: 4 },
    { id: 'mid3', col: 4, row: 2 },
    { id: 'mid4', col: 7, row: 2 },
    // Chemin de gauche, puis du haut.
    { id: 'top1', col: 0, row: 2, battle: 'battleTop1W01' },
    { id: 'top2', col: 3, row: 2 },
    { id: 'top3', col: 3, row: 0, invader: 'flying' },
    { id: 'top4', col: 6, row: 0 },
    { id: 'top5', col: 6, row: 1 },
    { id: 'boss', col: 9, row: 1, boss: true, invader: 'legendary' },
    // Impasses.
    { id: 'deadA', col: 2, row: 3 },
    { id: 'deadB', col: 9, row: 6 },
    { id: 'deadC', col: 1, row: 0 },
  ],
  links: [
    // Chemin du bas, puis de droite.
    ['start', 'low1'], ['low1', 'low2'], ['low2', 'low3'], ['low3', 'low4'], ['low4', 'low5'],
    ['low5', 'boss'],
    // Chemin du milieu.
    ['low1', 'mid1'], ['mid1', 'mid2'], ['mid2', 'mid3'], ['mid3', 'mid4'], ['mid4', 'low4'],
    // Chemin de gauche, puis du haut.
    ['start', 'top1'], ['top1', 'top2'], ['top2', 'top3'], ['top3', 'top4'], ['top4', 'top5'],
    ['top5', 'boss'],
    // Passerelles entre les chemins.
    ['low2', 'mid2'], ['top2', 'mid3'],
    // Impasses.
    ['mid1', 'deadA'], ['low3', 'deadB'], ['top3', 'deadC'],
  ],
};
