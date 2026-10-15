import { CELL_SIZE, cellCenter } from '../../renderConstants.js';

// Quadrillage de debug : repère de case utile en dev, pas pour le joueur. Passer à true pour
// le réafficher pendant qu'on travaille sur le placement des obstacles ou des scripts.
const DEBUG_SHOW_GRID = false;

// Clé de texture Phaser de l'image de fond `image` (champ `background` des phases,
// src/data/battles/).
const backgroundKey = (image) => `background-${image}`;

// Le terrain de la bataille : image de fond et rochers de la zone affichée (rules.md 1, 7.3).
// Profondeurs négatives : ils restent sous les unités, même redessinés au changement de phase.
export default class BattlefieldView {
  // `phases` : zones de la bataille (resolvePhases, src/logic/battles/battleSetup.js).
  static preload(scene, phases) {
    for (const image of new Set(phases.map(({ background }) => background.image))) {
      scene.load.image(backgroundKey(image), `backgrounds/${image}.png`);
    }
    scene.load.image('rocks', 'sprites/rocks.png');
  }

  // `grid` : grille de la première zone, qui donne la taille du terrain.
  constructor(scene, phases, grid) {
    this.scene = scene;
    this.phases = phases;
    this.width = grid.width * CELL_SIZE;
    this.height = grid.height * CELL_SIZE;
    this.obstacles = []; // { x, y, image, fx } par rocher affiché
    this.shownPhaseIndex = null;

    const firstBackground = backgroundKey(phases[0].background.image);
    this.background = scene.add.image(0, 0, firstBackground).setOrigin(0, 0).setDepth(-3);
    this.backgroundFx = this.background.preFX?.addColorMatrix();
    // Copie non filtrée du fond, montrée seulement sur la zone cliquable pendant une pause (voir
    // tint) : c'est elle qui « reste en couleur » au-dessus du terrain désaturé. Masque en
    // coordonnées écran plutôt qu'un crop : un crop se calcule dans la texture et se décale
    // quand le fond est retourné.
    this.colorZoneMask = scene.make.graphics({}, false);
    this.colorBackground = scene.add.image(0, 0, firstBackground).setOrigin(0, 0).setDepth(-2).setVisible(false)
      .setMask(this.colorZoneMask.createGeometryMask());
    this.drawGridLines(grid);
  }

  drawGridLines(grid) {
    const graphics = this.scene.add.graphics();
    graphics.lineStyle(1, 0xffffff, 0.15);
    for (let x = 0; x <= grid.width; x++) {
      graphics.lineBetween(x * CELL_SIZE, 0, x * CELL_SIZE, grid.height * CELL_SIZE);
    }
    for (let y = 0; y <= grid.height; y++) {
      graphics.lineBetween(0, y * CELL_SIZE, grid.width * CELL_SIZE, y * CELL_SIZE);
    }
    graphics.setVisible(DEBUG_SHOW_GRID);
  }

  // rules.md 7.3 : affiche la zone de la phase `index` — son fond, dans le bon sens, et ses
  // rochers (un bloc 2x2 est dessiné comme un seul gros rocher).
  show(index) {
    const { obstacles, background } = this.phases[index];
    for (const { image } of this.obstacles) image.destroy();
    this.obstacles = obstacles.map(({ x, y, size = 1 }) => {
      const center = cellCenter(x, y, size);
      const image = this.scene.add.image(center.x, center.y, 'rocks')
        .setDisplaySize(CELL_SIZE * size * 0.95, CELL_SIZE * size * 0.95).setDepth(-1);
      return {
        x, y, image, fx: image.preFX?.addColorMatrix(),
      };
    });
    for (const image of [this.background, this.colorBackground]) {
      image.setTexture(backgroundKey(background.image)).setDisplaySize(this.width, this.height)
        .setFlipX(background.flipped);
    }
    this.shownPhaseIndex = index;
  }

  // Signal de pause (voir PauseTint.js) : désature le terrain au niveau `level` (0 = couleurs
  // normales, -1 = niveaux de gris), sauf la zone cliquable `zone` ({ x, y, width, height } en
  // cases, ou null), qui reste en couleur.
  tint(level, zone) {
    const inZone = (x, y) => zone !== null
      && x >= zone.x && y >= zone.y && x < zone.x + zone.width && y < zone.y + zone.height;
    this.backgroundFx?.saturate(level);
    this.colorBackground.setVisible(level !== 0 && zone !== null);
    if (zone) {
      this.colorZoneMask.clear().fillStyle(0xffffff)
        .fillRect(zone.x * CELL_SIZE, zone.y * CELL_SIZE, zone.width * CELL_SIZE, zone.height * CELL_SIZE);
    }
    for (const obstacle of this.obstacles) obstacle.fx?.saturate(inZone(obstacle.x, obstacle.y) ? 0 : level);
  }
}
