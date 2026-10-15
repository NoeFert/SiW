import { CELL_SIZE, factionColor } from '../../renderConstants.js';

const BORDER = 3; // épaisseur du liseré, en px

// rules.md 2 : halo sur la moitié gauche du terrain (zone de déploiement du joueur, voir
// isValidDeploymentPosition), visible uniquement pendant un glisser depuis la tour. Les cases de
// rochers en sont exclues : on n'y déploie pas. Couleur de la faction du joueur ; le liseré suit
// le contour de la zone, rochers compris, tracé à l'intérieur des cases de la zone.
export default class DeploymentZoneView {
  constructor(scene, playerFaction) {
    this.color = factionColor(playerFaction);
    this.graphics = scene.add.graphics().setVisible(false);
  }

  // Redessine la zone pour la grille `grid` (celle de la phase affichée).
  draw(grid) {
    const zoneColumns = Math.floor(grid.width / 2);
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
        // Coins rentrants (case en diagonale hors zone, ses deux voisines dedans) : sans ce
        // carré, le liseré aurait un trou à l'angle d'un rocher.
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
