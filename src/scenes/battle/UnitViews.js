import Phaser from 'phaser';
import { phaseTransitionProgress } from '../../logic/battles/phases.js';
import { ABILITY_COUNTER_COLORS, ABILITY_EFFECTS } from '../../data/effects.js';
import { SPECIES_SPRITES, spritePath } from '../../data/sprites.js';
import { CELL_SIZE, cellCenter, factionColor } from '../../renderConstants.js';

// Durée de l'arrivée d'une unité IA depuis l'extérieur de l'écran jusqu'au bord droit.
const ENEMY_ENTRY_MS = 600;
const HEALTH_BAR_HEIGHT = 6;
const COUNTER_SLOT_HEIGHT = 4;
const COUNTER_SLOT_GAP = 2;

// L'affichage des unités sur le terrain, une vue par unité : sprite, barre de vie, compteur
// d'aptitude et animation de paralysie. Recalé à chaque frame sur l'état de la bataille
// (`sync`) : une vue apparaît quand l'unité entre sur le terrain, disparaît quand elle meurt ou
// fuit. Chaque vue : { container, visual, fx, barFill, barWidth, abilityCounter, stunEffect,
// lastCellX, lastCellY, moveTween }.
export default class UnitViews {
  static preload(scene) {
    for (const { key } of Object.values(SPECIES_SPRITES)) scene.load.image(key, spritePath(key));
    for (const color of Object.values(ABILITY_COUNTER_COLORS)) {
      for (const part of ['background', 'fill']) scene.load.image(`step-slot-${color}-${part}`, `ui/${color}/step-slot-${part}.png`);
    }
  }

  // `fieldWidth` : largeur du terrain en px (entrée des unités IA, changement de phase).
  constructor(scene, { playerFaction, enemyFaction, fieldWidth }) {
    this.scene = scene;
    this.factions = { player: playerFaction, enemy: enemyFaction };
    this.fieldWidth = fieldWidth;
    this.views = new Map(); // unit.id -> vue
    this.transitionShown = false;
    // Cases du compteur d'aptitude : pixel art agrandi, sans lissage.
    for (const color of Object.values(ABILITY_COUNTER_COLORS)) {
      for (const part of ['background', 'fill']) {
        scene.textures.get(`step-slot-${color}-${part}`).setFilter(Phaser.Textures.FilterMode.NEAREST);
      }
    }
  }

  get(unitId) {
    return this.views.get(unitId);
  }

  // Crée, met à jour ou supprime la vue de chaque unité selon qu'elle est sur le terrain.
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

    // Le joueur attaque vers la droite, l'IA vers la gauche : on retourne le dessin si besoin.
    const { key, facing } = SPECIES_SPRITES[unit.species.name];
    const attackDirection = unit.faction === 'player' ? 'right' : 'left';
    const visual = scene.add.image(0, 0, key)
      .setDisplaySize(footprintSize * 0.9, footprintSize * 0.9)
      .setFlipX(facing !== null && facing !== attackDirection);
    container.add(visual);

    // Barre de vie dans la couleur principale de la faction de l'unité.
    const barWidth = footprintSize * 0.8;
    const barY = -footprintSize / 2 - 10;
    const barBackground = scene.add.rectangle(0, barY, barWidth, HEALTH_BAR_HEIGHT, 0x000000).setOrigin(0.5);
    const barFill = scene.add.rectangle(-barWidth / 2, barY, barWidth, HEALTH_BAR_HEIGHT, factionColor(this.factions[unit.faction]))
      .setOrigin(0, 0.5);
    container.add(barBackground);
    container.add(barFill);
    const abilityCounter = this.createAbilityCounter(unit, container, barWidth, barY + HEALTH_BAR_HEIGHT / 2 + 2);

    // units.md 6 — Frappe paralysante d'Athos : animation en boucle sur l'unité tant que des
    // prochaines attaques sont neutralisées (s'arrête avec la dernière attaque ratée, voir update
    // et le texte flottant « Raté ! » de CombatEffects).
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
    // rules.md 7.2 : une unité IA entre par le bord droit — elle arrive depuis l'extérieur de
    // l'écran plutôt que d'apparaître d'un coup sur sa case (purement visuel).
    if (unit.faction === 'enemy') {
      container.x = this.fieldWidth + footprintSize / 2;
      view.moveTween = scene.tweens.add({
        targets: container, x: center.x, duration: ENEMY_ENTRY_MS, ease: 'Linear',
      });
    }
    this.update(view, unit);
    return view;
  }

  // Rangée de cases du compteur d'aptitude périodique de `unit` (voir ABILITY_COUNTER_COLORS),
  // en haut à `top` dans son conteneur, sur la largeur de la barre de vie. null sans aptitude.
  createAbilityCounter(unit, container, width, top) {
    const ability = (unit.species.abilities ?? [])
      .find((a) => a.trigger === 'periodic' && ABILITY_COUNTER_COLORS[a.type]);
    if (!ability) return null;
    const color = ABILITY_COUNTER_COLORS[ability.type];
    const slotWidth = (width - COUNTER_SLOT_GAP * (ability.every - 1)) / ability.every;
    // Extrémités arrondies de 2 px gardées, milieu étiré (NineSlice horizontal).
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

  // rules.md 4.1 : la logique avance en continu, mais ne « commet » une case qu'une fois celle-ci
  // pleinement franchie (voir unitBehavior.js) — on ne connaît donc jamais de position
  // fractionnaire. Le passage d'une case à l'autre est animé (tween) sur la durée réelle qu'aurait
  // dû prendre ce trajet à la vitesse de l'unité (species.moveSpeed, en cases/s), plutôt que de
  // « sauter » d'un coup.
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

  // rules.md 7.3 : pendant un changement de phase, l'armée du joueur sort par la droite, puis
  // entre par la gauche de la nouvelle zone. Purement visuel : la logique a déjà placé les
  // unités sur leurs cases d'arrivée (phases.js), on ne fait que décaler leur affichage.
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
      let offsetX = 0; // transition finie : l'unité se pose sur sa case
      if (transition?.stage === 'exit') offsetX = transition.progress * (this.fieldWidth - center.x + unit.size * CELL_SIZE);
      if (transition?.stage === 'enter') offsetX = -(1 - transition.progress) * (center.x + unit.size * CELL_SIZE);
      view.container.setPosition(center.x + offsetX, center.y);
    }
  }

  // Position affichée (px du canevas) du sprite d'une unité, ou null s'il n'est pas sur le
  // terrain. Pendant une pause, un sprite peut rester figé à mi-chemin entre deux cases
  // (déplacement animé gelé), loin de sa case logique.
  displayCenter(unit) {
    const view = this.views.get(unit.id);
    return view ? { x: view.container.x, y: view.container.y } : null;
  }

  // Unité sur le terrain dont le sprite affiché (son bloc de cases) est sous le point (x, y) du
  // canevas, ou null.
  unitAt(units, x, y) {
    return units.find((unit) => {
      const view = unit.isOnField && this.views.get(unit.id);
      const half = (unit.size * CELL_SIZE) / 2;
      return view && Math.abs(x - view.container.x) < half && Math.abs(y - view.container.y) < half;
    }) ?? null;
  }

  // Signal de pause (voir PauseTint.js) : désature les unités au niveau `level`, sauf celles de
  // `keepColorIds` (cliquables), qui restent en couleur.
  tint(level, keepColorIds) {
    for (const [id, view] of this.views) view.fx?.saturate(keepColorIds.has(id) ? 0 : level);
  }
}
