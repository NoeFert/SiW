import Phaser from 'phaser';
import { ABILITY_EFFECTS, MELEE_EFFECT, PROJECTILE_FLIGHT_MS } from '../../data/effects.js';
import { FACTIONS } from '../../data/factions/index.js';
import { CELL_SIZE, cellCenter, factionColor } from '../../renderConstants.js';
import { TEXT } from '../../ui/strings.js';

const EFFECT_DEPTH = 10; // au-dessus des unités

// Images [premier, dernier] de la ligne `row` d'une planche d'effets (src/data/effects.js).
const rowFrames = (scene, { key, frames, row }) => scene.anims.generateFrameNumbers(
  key, { start: row * frames, end: row * frames + frames - 1 },
);

// Feedback visuel du combat (units.md 6, rules.md 4.5) : missiles, entailles, animations
// d'aptitude, textes flottants, flash et secousse. Purement visuel : les dégâts ont déjà été
// appliqués par la logique (unitBehavior.js) au tick qui produit les évènements
// (`battle.abilityEvents`) ; ces effets ne font que les illustrer.
export default class CombatEffects {
  static preload(scene) {
    const projectiles = Object.values(FACTIONS).map((faction) => faction.projectile);
    for (const { key, path } of [...projectiles, ...Object.values(ABILITY_EFFECTS), MELEE_EFFECT]) {
      scene.load.spritesheet(key, path, { frameWidth: CELL_SIZE, frameHeight: CELL_SIZE });
    }
  }

  // `units` : UnitViews, pour placer les effets sur les sprites affichés.
  constructor(scene, units, { playerFaction, enemyFaction }) {
    this.scene = scene;
    this.units = units;
    this.factions = { player: playerFaction, enemy: enemyFaction };
    this.createAnimations();
  }

  // Les animations sont globales au Game (recréé à chaque bataille) : créées une seule fois.
  createAnimations() {
    const { anims } = this.scene;
    // Vol de chaque missile : la ligne de couleur de la faction, jouée en entier pendant le trajet.
    for (const { projectile } of Object.values(FACTIONS)) {
      if (!anims.exists(`${projectile.key}-flight`)) {
        anims.create({ key: `${projectile.key}-flight`, frames: rowFrames(this.scene, projectile), duration: PROJECTILE_FLIGHT_MS });
      }
    }
    for (const effect of [...Object.values(ABILITY_EFFECTS), MELEE_EFFECT]) {
      if (!anims.exists(effect.key)) {
        anims.create({
          key: effect.key, frames: rowFrames(this.scene, effect), duration: effect.durationMs, repeat: effect.repeat ?? 0,
        });
      }
    }
  }

  // Joue les effets des évènements du dernier tick.
  play(events) {
    // À distance, l'effet sur la victime attend l'arrivée du missile tiré au même tick.
    const impactDelay = (victim) => (events.some((e) => e.type === 'rangedAttack' && e.target === victim)
      ? PROJECTILE_FLIGHT_MS : 0);
    for (const event of events) {
      if (event.type === 'paralyze') {
        // Une victime vivante montre la paralysie en continu (UnitViews). Tuée par le coup même
        // (fréquent : 50 dégâts), elle n'a plus d'attaque à rater : l'animation est jouée une
        // fois là où elle est morte, pour que l'aptitude reste visible.
        if (!event.unit.isAlive) this.playOnUnit(event.unit, ABILITY_EFFECTS.paralyze, impactDelay(event.unit));
      } else if (event.type === 'bonusDamage') {
        this.playOnUnit(event.target, ABILITY_EFFECTS.bonusDamage, impactDelay(event.target));
        this.flash(event.target, 0xffff00);
        this.scene.cameras.main.shake(120, 0.006);
        this.floatingText(event.target, TEXT.fieldTexts.criticalHit, '#ffcc00');
      } else if (event.type === 'zoneHit') {
        // rules.md 4.6 / GRAPHICS.md : clignotement dans la couleur principale de la faction du
        // [Légendaire] (doré pour Fafnir, menthe pour Athos), à l'arrivée du missile s'il a tiré.
        const shot = events.some((e) => e.type === 'rangedAttack' && e.unit === event.unit);
        const color = factionColor(this.factions[event.unit.faction]);
        this.scene.time.delayedCall(shot ? PROJECTILE_FLIGHT_MS : 0, () => this.flashSilhouette(event.target, color));
      } else if (event.type === 'missed') {
        this.floatingText(event.unit, TEXT.fieldTexts.missed, '#cccccc');
      } else if (event.type === 'heal') {
        this.floatingText(event.unit, TEXT.fieldTexts.heal(event.amount), '#2ecc71');
        this.pulseHealthBar(event.unit);
      } else if (event.type === 'rangedAttack') {
        this.fireProjectile(event.unit, event.target);
      } else if (event.type === 'meleeAttack') {
        this.playOnUnit(event.target, MELEE_EFFECT, 0);
      }
    }
  }

  // rules.md 4.5 : missile du tireur vers sa cible, aux couleurs de la faction réelle du tireur.
  fireProjectile(shooter, target) {
    const from = this.units.get(shooter.id)?.container;
    const to = this.units.get(target.id)?.container;
    if (!from || !to) return;

    const { scene } = this;
    const { projectile } = FACTIONS[this.factions[shooter.faction]];
    // Le missile joue toute son animation pendant le vol, orienté vers la cible.
    const missile = scene.add.sprite(from.x, from.y, projectile.key)
      .setRotation(Phaser.Math.Angle.Between(from.x, from.y, to.x, to.y))
      .setDepth(EFFECT_DEPTH)
      .play(`${projectile.key}-flight`);
    const impactX = to.x;
    const impactY = to.y;
    scene.tweens.add({
      targets: missile,
      x: impactX,
      y: impactY,
      duration: PROJECTILE_FLIGHT_MS,
      onComplete: () => {
        missile.destroy();
        const impact = scene.add.circle(impactX, impactY, 8, projectile.impactColor, 0.9).setDepth(EFFECT_DEPTH);
        scene.tweens.add({
          targets: impact, scale: 3, alpha: 0, duration: 180, onComplete: () => impact.destroy(),
        });
      },
    });
  }

  // Animation jouée une fois sur `unit` après `delayMs` : elle la suit tant qu'elle est sur le
  // terrain ; si l'unité est morte (sa vue disparaît) — avant le début de l'animation (victime
  // tuée par le coup, missile encore en vol) ou pendant —, elle se joue là où elle est morte.
  playOnUnit(unit, effect, delayMs) {
    const { scene } = this;
    scene.time.delayedCall(delayMs, () => {
      const container = this.units.get(unit.id)?.container;
      const { x, y } = container ?? cellCenter(unit.x, unit.y, unit.size);
      const size = unit.size * CELL_SIZE * effect.scale;
      const sprite = scene.add.sprite(x, y, effect.key)
        .setDisplaySize(size, size)
        .setDepth(EFFECT_DEPTH)
        .play({ key: effect.key, repeat: 0 }); // une fois, même pour une animation en boucle
      const follow = () => {
        const view = this.units.get(unit.id);
        if (view) sprite.setPosition(view.container.x, view.container.y);
      };
      scene.events.on('update', follow);
      sprite.once('animationcomplete', () => {
        scene.events.off('update', follow);
        sprite.destroy();
      });
    });
  }

  // rules.md 4.6 / GRAPHICS.md : silhouette de la couleur pleine `color` posée sur le sprite de
  // `unit`, qui clignote 3 fois puis disparaît. Une copie à part plutôt qu'une teinte du sprite :
  // celui-ci porte le preFX de la désaturation (UnitViews), qui ne rend pas la teinte de façon
  // fiable, et une teinte multipliée se voit à peine sur des sprites sombres.
  flashSilhouette(unit, color) {
    const view = this.units.get(unit.id);
    if (!view) return;
    const { visual, container } = view;
    const silhouette = this.scene.add.image(visual.x, visual.y, visual.texture.key)
      .setDisplaySize(visual.displayWidth, visual.displayHeight)
      .setFlipX(visual.flipX)
      .setTintFill(color)
      .setAlpha(0);
    container.add(silhouette);
    this.scene.tweens.add({
      targets: silhouette,
      alpha: 0.9,
      duration: 70,
      yoyo: true,
      repeat: 2,
      onComplete: () => silhouette.destroy(),
    });
  }

  flash(unit, color) {
    const view = this.units.get(unit.id);
    if (!view) return;
    const { visual } = view;
    visual.setTint(color);
    this.scene.tweens.add({
      targets: visual,
      alpha: 0.3,
      duration: 70,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        visual.setAlpha(1);
        visual.clearTint();
      },
    });
  }

  floatingText(unit, message, color) {
    const view = this.units.get(unit.id);
    if (!view) return;
    const label = this.scene.add.text(0, -unit.size * CELL_SIZE / 2 - 16, message, {
      fontSize: '13px', color, fontStyle: 'bold',
    }).setOrigin(0.5, 1);
    view.container.add(label);
    this.scene.tweens.add({
      targets: label, y: label.y - 26, alpha: 0, duration: 900, onComplete: () => label.destroy(),
    });
  }

  pulseHealthBar(unit) {
    const view = this.units.get(unit.id);
    if (!view) return;
    this.scene.tweens.add({
      targets: view.barFill, scaleY: 2, duration: 150, yoyo: true,
    });
  }
}
