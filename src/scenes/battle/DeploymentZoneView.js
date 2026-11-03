import { CELL_SIZE, factionColor } from '../../renderConstants.js';
import { playerDeploymentColumns } from '../../logic/battles/deployment.js';

const BORDER = 3; // épaisseur du liseré, en px

// Halo de la zone de déploiement pendant un glisser, rochers exclus.
export default class DeploymentZoneView {
  constructor(scene, playerFaction) {
    this.color = factionColor(playerFaction);
    this.graphics = scene.add.graphics().setVisible(false);
  }

  draw(grid) {
    const zoneColumns = playerDeploymentColumns(grid);
    const inZone = (x, y) => x < zoneColumns && grid.isFree(x, y);
    const far = CELL_SIZE - BORDER;
    const zone = this.graphics.clear();
    for (let x = 0; x < zoneColumns; x++) {
      for (let y = 0; y < grid.height; y++) {
        if (!inZone(x, y)) continue;
        const px = x * CELL_SIZE;
        const py = y * CELL_SIZE;
        zone.fillStyle(this.color, 0.15).fillRect(px, py, CELL_SIZE, CELL_SIZE);
        zone.fillStyle(this.color, 0.9);
        if (!inZone(x, y - 1)) zone.fillRect(px, py, CELL_SIZE, BORDER);
        if (!inZone(x, y + 1)) zone.fillRect(px, py + far, CELL_SIZE, BORDER);
        if (!inZone(x - 1, y)) zone.fillRect(px, py, BORDER, CELL_SIZE);
        if (!inZone(x + 1, y)) zone.fillRect(px + far, py, BORDER, CELL_SIZE);
        // Coins rentrants : comble le trou du liseré à l'angle d'un rocher.
        for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
          if (inZone(x + dx, y) && inZone(x, y + dy) && !inZone(x + dx, y + dy)) {
            zone.fillRect(dx < 0 ? px : px + far, dy < 0 ? py : py + far, BORDER, BORDER);
          }
        }
      }
    }
  }

  setVisible(visible) {
    this.graphics.setVisible(visible);
  }
}
