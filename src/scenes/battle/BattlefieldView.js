import { CELL_SIZE, cellCenter } from '../../renderConstants.js';

// Quadrillage de debug.
const DEBUG_SHOW_GRID = false;

const backgroundKey = (image) => `background-${image}`;

// Fond et rochers de la zone affichée, sous les unités.
export default class BattlefieldView {
  static preload(scene, phases) {
    for (const image of new Set(phases.map(({ background }) => background.image))) {
      scene.load.image(backgroundKey(image), `backgrounds/${image}.png`);
    }
    scene.load.image('rocks', 'sprites/rocks.png');
  }

  constructor(scene, phases, grid) {
    this.scene = scene;
    this.phases = phases;
    this.width = grid.width * CELL_SIZE;
    this.height = grid.height * CELL_SIZE;
    this.obstacles = [];
    this.shownPhaseIndex = null;

    const firstBackground = backgroundKey(phases[0].background.image);
    this.background = scene.add.image(0, 0, firstBackground).setOrigin(0, 0).setDepth(-3);
    this.backgroundFx = this.background.preFX?.addColorMatrix();
    // Copie non filtrée du fond, montrée sur la zone cliquable pendant une pause.
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

  // Désature le terrain, sauf la zone cliquable `zone`.
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
