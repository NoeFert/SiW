// Statique — réseau de la map de « Partir en guerre » (rules.md 11.7, GRAPHICS.md « Partir en
// guerre ») : des emplacements (losanges) placés sur une grille (col vers la droite, row vers le
// bas) et les liens qui les relient. Deux emplacements liés sont toujours sur la même ligne ou la
// même colonne, sans autre emplacement ni autre lien entre eux (connecteur droit). `battle` :
// bataille de WAR_BATTLE_IDS (src/data/battles/) portée par l'emplacement ; les autres sont
// affichés verrouillés, en attendant leurs batailles. `invader` : emplacement d'une bataille de boss,
// surmonté d'un envahisseur — le sprite de l'espèce ennemie de ce rôle ('basic', 'flying' ou
// 'legendary', voir invaderSpecies dans src/logic/war.js).
//
// Map 1 : trois chemins du départ (en bas à gauche) au boss (en haut à droite), de longueurs
// inégales — par la gauche puis le haut, par le milieu, par le bas puis la droite —, deux
// passerelles entre ces chemins et trois impasses.
export const WAR_MAP_01 = {
  background: 'backgrounds/temporary-map1.png', // provisoire (GRAPHICS.md)
  cols: 10,
  rows: 7,
  nodes: [
    { id: 'start', col: 0, row: 6, battle: 'battleStartW01' },
    // Chemin du bas, puis de droite : il porte les batailles 2 et 3.
    { id: 'low1', col: 2, row: 6, battle: 'battleLow1W01' },
    { id: 'low2', col: 4, row: 6, battle: 'battleLow2W01' },
    { id: 'low3', col: 7, row: 6 },
    { id: 'low4', col: 7, row: 4, invader: 'basic' },
    { id: 'low5', col: 9, row: 4 },
    // Chemin du milieu (part du chemin du bas, le rejoint avant le boss).
    { id: 'mid1', col: 2, row: 4 },
    { id: 'mid2', col: 4, row: 4 },
    { id: 'mid3', col: 4, row: 2 },
    { id: 'mid4', col: 7, row: 2 },
    // Chemin de gauche, puis du haut.
    { id: 'top1', col: 0, row: 2 },
    { id: 'top2', col: 3, row: 2 },
    { id: 'top3', col: 3, row: 0, invader: 'flying' },
    { id: 'top4', col: 6, row: 0 },
    { id: 'top5', col: 6, row: 1 },
    // Arrivée commune : la bataille de boss.
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
