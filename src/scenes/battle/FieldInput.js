import { clickField, cancelOrder } from '../../logic/battles/orderSelection.js';
import { CELL_SIZE, factionColor } from '../../renderConstants.js';

// Clics sur le terrain pendant la sélection d'un ordre. Clic droit : annule.
export default class FieldInput {
  constructor(scene, battle, units, playerFaction) {
    this.battle = battle;
    this.units = units;
    scene.input.mouse.disableContextMenu();
    scene.input.on('pointerdown', (pointer) => this.handlePointerDown(pointer));

    const color = factionColor(playerFaction);
    this.selectionIndicator = scene.add.rectangle(0, 0, CELL_SIZE, CELL_SIZE, color, 0.2)
      .setOrigin(0, 0)
      .setStrokeStyle(3, color)
      .setVisible(false);
  }

  handlePointerDown(pointer) {
    if (this.battle.outcome !== 'ongoing') return;
    if (pointer.rightButtonDown()) {
      cancelOrder(this.battle);
      return;
    }
    // Vise la case logique : pendant une pause, le sprite peut être figé entre deux cases.
    const unit = this.units.unitAt(this.battle.units, pointer.x, pointer.y);
    const x = unit ? unit.x : Math.floor(pointer.x / CELL_SIZE);
    const y = unit ? unit.y : Math.floor(pointer.y / CELL_SIZE);
    clickField(this.battle, x, y);
  }

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
