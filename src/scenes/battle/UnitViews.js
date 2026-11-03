import Phaser from 'phaser';
import { phaseTransitionProgress } from '../../logic/battles/phases.js';
import { ABILITY_COUNTER_COLORS, ABILITY_EFFECTS } from '../../data/effects.js';
import { SPECIES_SPRITES, spritePath } from '../../data/sprites.js';
import { CELL_SIZE, cellCenter, factionColor } from '../../renderConstants.js';

const ENEMY_ENTRY_MS = 600;
const HEALTH_BAR_HEIGHT = 6;
const COUNTER_SLOT_HEIGHT = 4;
const COUNTER_SLOT_GAP = 2;

// Une vue par unité sur le terrain, recalée à chaque frame (`sync`).
export default class UnitViews {
  static preload(scene) {
    for (const { key } of Object.values(SPECIES_SPRITES)) scene.load.image(key, spritePath(key));
    for (const color of Object.values(ABILITY_COUNTER_COLORS)) {
      for (const part of ['background', 'fill']) scene.load.image(`step-slot-${color}-${part}`, `ui/${color}/step-slot-${part}.png`);
    }
  }

  constructor(scene, { playerFaction, enemyFaction, fieldWidth }) {
    this.scene = scene;
    this.factions = { player: playerFaction, enemy: enemyFaction };
    this.fieldWidth = fieldWidth;
    this.views = new Map();
    this.transitionShown = false;
    // Pixel art, sans lissage.
    for (const color of Object.values(ABILITY_COUNTER_COLORS)) {
      for (const part of ['background', 'fill']) {
        scene.textures.get(`step-slot-${color}-${part}`).setFilter(Phaser.Textures.FilterMode.NEAREST);
      }
    }
  }

  get(unitId) {
    return this.views.get(unitId);
  }

  sync(units) {
    for (const unit of units) {
      const view = this.views.get(unit.id);
      if (!unit.isOnField) {
        if (view) {
          if (view.moveTween) view.moveTween.stop();
          view.container.destroy();
          this.views.delete(unit.id);
        }
      } else if (view) {
        this.update(view, unit);
      } else {
        this.views.set(unit.id, this.create(unit));
      }
    }
  }

  create(unit) {
    const { scene } = this;
    const container = scene.add.container(0, 0);
    const footprintSize = unit.size * CELL_SIZE;

    const { key, facing } = SPECIES_SPRITES[unit.species.name];
    const attackDirection = unit.faction === 'player' ? 'right' : 'left';
    const visual = scene.add.image(0, 0, key)
      .setDisplaySize(footprintSize * 0.9, footprintSize * 0.9)
      .setFlipX(facing !== null && facing !== attackDirection);
    container.add(visual);

    const barWidth = footprintSize * 0.8;
    const barY = -footprintSize / 2 - 10;
    const barBackground = scene.add.rectangle(0, barY, barWidth, HEALTH_BAR_HEIGHT, 0x000000).setOrigin(0.5);
    const barFill = scene.add.rectangle(-barWidth / 2, barY, barWidth, HEALTH_BAR_HEIGHT, factionColor(this.factions[unit.faction]))
      .setOrigin(0, 0.5);
    container.add(barBackground);
    container.add(barFill);
    const abilityCounter = this.createAbilityCounter(unit, container, barWidth, barY + HEALTH_BAR_HEIGHT / 2 + 2);

    // Frappe paralysante d'Athos : en boucle tant que l'unité est paralysée.
    const { paralyze } = ABILITY_EFFECTS;
    const stunEffect = scene.add.sprite(0, 0, paralyze.key)
      .setDisplaySize(footprintSize * paralyze.scale, footprintSize * paralyze.scale)
      .setVisible(false);
    container.add(stunEffect);

    const view = {
      container, barFill, barWidth, stunEffect, abilityCounter, visual, fx: visual.preFX?.addColorMatrix(),
      lastCellX: unit.x, lastCellY: unit.y, moveTween: null,
    };
    const center = cellCenter(unit.x, unit.y, unit.size);
    container.setPosition(center.x, center.y);
    // Une unité IA arrive depuis l'extérieur de l'écran.
    if (unit.faction === 'enemy') {
      container.x = this.fieldWidth + footprintSize / 2;
      view.moveTween = scene.tweens.add({
        targets: container, x: center.x, duration: ENEMY_ENTRY_MS, ease: 'Linear',
      });
    }
    this.update(view, unit);
    return view;
  }

  // Compteur d'aptitude périodique, null sans aptitude.
  createAbilityCounter(unit, container, width, top) {
    const ability = (unit.species.abilities ?? [])
      .find((a) => a.trigger === 'periodic' && ABILITY_COUNTER_COLORS[a.type]);
    if (!ability) return null;
    const color = ABILITY_COUNTER_COLORS[ability.type];
    const slotWidth = (width - COUNTER_SLOT_GAP * (ability.every - 1)) / ability.every;
    const slot = (part, index) => {
      const x = -width / 2 + index * (slotWidth + COUNTER_SLOT_GAP);
      return this.scene.add.nineslice(x, top, `step-slot-${color}-${part}`, undefined, slotWidth, COUNTER_SLOT_HEIGHT, 2, 2, 0, 0)
        .setOrigin(0, 0);
    };
    const fills = [];
    for (let i = 0; i < ability.every; i++) {
      container.add(slot('background', i));
      const fill = slot('fill', i);
      container.add(fill);
      fills.push(fill);
    }
    return { every: ability.every, fills };
  }

  // Déplacement d'une case à l'autre animé à la vitesse de l'unité.
  update(view, unit) {
    if (unit.x !== view.lastCellX || unit.y !== view.lastCellY) {
      const cellsMoved = Math.max(Math.abs(unit.x - view.lastCellX), Math.abs(unit.y - view.lastCellY));
      view.lastCellX = unit.x;
      view.lastCellY = unit.y;
      if (view.moveTween) view.moveTween.stop();
      const center = cellCenter(unit.x, unit.y, unit.size);
      view.moveTween = this.scene.tweens.add({
        targets: view.container,
        x: center.x,
        y: center.y,
        duration: (cellsMoved / unit.species.moveSpeed) * 1000,
        ease: 'Linear',
      });
    }

    const ratio = Math.max(0, unit.hp / unit.maxHp);
    view.barFill.setSize(view.barWidth * ratio, HEALTH_BAR_HEIGHT);

    const stunned = unit.paralyzedAttacks > 0;
    if (stunned && !view.stunEffect.visible) view.stunEffect.setVisible(true).play(ABILITY_EFFECTS.paralyze.key);
    if (!stunned && view.stunEffect.visible) view.stunEffect.stop().setVisible(false);
    if (view.abilityCounter) {
      const charged = unit.attacksLanded % view.abilityCounter.every;
      view.abilityCounter.fills.forEach((fill, i) => fill.setVisible(i < charged));
    }
  }

  // Changement de phase : purement visuel, la logique a déjà placé les unités.
  applyPhaseTransition(battle) {
    const transition = phaseTransitionProgress(battle);
    if (!transition && !this.transitionShown) return;
    this.transitionShown = !!transition;

    for (const unit of battle.units) {
      const view = this.views.get(unit.id);
      if (!view || unit.faction !== 'player') continue;
      if (view.moveTween) view.moveTween.stop();
      view.lastCellX = unit.x;
      view.lastCellY = unit.y;
      const center = cellCenter(unit.x, unit.y, unit.size);
      let offsetX = 0;
      if (transition?.stage === 'exit') offsetX = transition.progress * (this.fieldWidth - center.x + unit.size * CELL_SIZE);
      if (transition?.stage === 'enter') offsetX = -(1 - transition.progress) * (center.x + unit.size * CELL_SIZE);
      view.container.setPosition(center.x + offsetX, center.y);
    }
  }

  displayCenter(unit) {
    const view = this.views.get(unit.id);
    return view ? { x: view.container.x, y: view.container.y } : null;
  }

  unitAt(units, x, y) {
    return units.find((unit) => {
      const view = unit.isOnField && this.views.get(unit.id);
      const half = (unit.size * CELL_SIZE) / 2;
      return view && Math.abs(x - view.container.x) < half && Math.abs(y - view.container.y) < half;
    }) ?? null;
  }

  tint(level, keepColorIds) {
    for (const [id, view] of this.views) view.fx?.saturate(keepColorIds.has(id) ? 0 : level);
  }
}
