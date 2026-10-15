import { clickField, cancelOrder } from '../../logic/battles/orderSelection.js';
import { CELL_SIZE, factionColor } from '../../renderConstants.js';

// Clics du joueur sur le terrain (rules.md 5). L'ordre est choisi dans la tour React ; tant qu'un
// ordre est en cours de sélection, chaque clic est transmis à orderSelection.js, qui décide de
// l'étape (unité, puis cible). Clic droit : annule l'ordre en cours. Un cadre montre l'unité
// sélectionnée pour l'ordre.
export default class FieldInput {
  // `units` : UnitViews, pour viser l'unité sous le pointeur.
  constructor(scene, battle, units, playerFaction) {
    this.battle = battle;
    this.units = units;
    scene.input.mouse.disableContextMenu();
    scene.input.on('pointerdown', (pointer) => this.handlePointerDown(pointer));

    const color = factionColor(playerFaction); // seules les unités du joueur sont sélectionnables
    this.selectionIndicator = scene.add.rectangle(0, 0, CELL_SIZE, CELL_SIZE, color, 0.2)
      .setOrigin(0, 0)
      .setStrokeStyle(3, color)
      .setVisible(false);
  }

  handlePointerDown(pointer) {
    if (this.battle.outcome !== 'ongoing') return; // bataille terminée : plus aucune interaction
    if (pointer.rightButtonDown()) {
      cancelOrder(this.battle);
      return;
    }
    // Un clic sur le sprite d'une unité vise sa case logique : pendant une pause, le sprite peut
    // être figé à mi-chemin de la case suivante (déplacement animé gelé).
    const unit = this.units.unitAt(this.battle.units, pointer.x, pointer.y);
    const x = unit ? unit.x : Math.floor(pointer.x / CELL_SIZE);
    const y = unit ? unit.y : Math.floor(pointer.y / CELL_SIZE);
    clickField(this.battle, x, y);
  }

  // Cadre sur l'unité sélectionnée pour l'ordre en cours ; caché hors sélection et une fois la
  // bataille terminée (rules.md 8 : plus aucune interaction possible).
  update() {
    const unit = this.battle.orderSelection?.unit;
    if (!unit?.isOnField || this.battle.outcome !== 'ongoing') {
      this.selectionIndicator.setVisible(false);
      return;
    }
    const size = unit.size * CELL_SIZE;
    this.selectionIndicator.setSize(size, size);
    this.selectionIndicator.setPosition(unit.x * CELL_SIZE, unit.y * CELL_SIZE);
    this.selectionIndicator.setVisible(true);
  }
}
