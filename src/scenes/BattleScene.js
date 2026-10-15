import Phaser from 'phaser';
import Grid from '../logic/grid.js';
import { createBattle, tickBattle } from '../logic/battle.js';
import { createDeploymentState } from '../logic/deployment.js';
import { isBattleTimeRunning } from '../logic/pause.js';
import { startTutorial } from '../logic/tutorial.js';
import { setUpcomingPhases, phaseTransitionProgress } from '../logic/phases.js';
import { clickField, cancelCommand, getClickableHighlights } from '../logic/commandSelection.js';
import { ROSTERS } from '../data/rosters.js';
import { BATTLES } from '../data/battles.js';
import { SPECIES_SPRITES, spritePath } from '../data/sprites.js';
import {
  CELL_SIZE, GRID_WIDTH, GRID_HEIGHT, FACTION_COLORS, cellCenter,
} from '../renderConstants.js';
import { interactionState } from '../state/interactionState.js';

// Quadrillage de debug : repère de case utile en dev, pas pour le joueur. Passer à true pour
// le réafficher pendant qu'on travaille sur le placement des obstacles/scripts par exemple.
const DEBUG_SHOW_GRID = false;

// Signaux de pause (ui-battle-screen-decisions.md 3) : saturation appliquée au terrain via un
// FX ColorMatrix (-1 = niveaux de gris). Complète pendant la pause principale, partielle
// pendant une pause d'interaction ; ce qui est cliquable garde toujours ses couleurs.
const FULL_DESATURATION = -1;
const PARTIAL_DESATURATION = -0.7;

// Durée de l'arrivée d'une unité IA depuis l'extérieur de l'écran jusqu'au bord droit.
const ENEMY_ENTRY_MS = 600;

// Couleur de l'impact d'un missile d'attaque à distance, par faction (voir fireProjectile).
const PROJECTILE_COLORS = {
  wyrms: 0xff8c1a, // orange
  undead: 0x7dffc8, // vert menthe
};

// GRAPHICS.md « Projectiles » : missile animé de chaque faction, tiré d'une planche d'effets
// (assets/effect/) — images de 64 × 64, une ligne par couleur (9 couleurs), une colonne par
// étape de l'animation. `row` : ligne de la couleur de la faction.
const PROJECTILE_EFFECTS = {
  wyrms: { key: 'missile-burst', path: 'effect/missile-burst.png', frames: 15, row: 0 }, // orange
  undead: { key: 'missile-streak', path: 'effect/missile-streak.png', frames: 8, row: 3 }, // vert
};
const PROJECTILE_FLIGHT_MS = 220;

// GRAPHICS.md « Corps-à-corps » : entaille blanche (6e ligne de assets/effect/hit-slash.png, 8 étapes)
// jouée une fois sur la victime à chaque coup au corps-à-corps, à la taille de son emprise.
const MELEE_EFFECT = {
  key: 'hit-slash', path: 'effect/hit-slash.png', frames: 8, row: 5, scale: 1,
};
const MELEE_EFFECT_MS = 300;

// GRAPHICS.md « Aptitudes » : animation jouée sur l'unité touchée par une aptitude, tirée des
// mêmes planches d'effets (64 × 64, une ligne par couleur). `scale` : taille par rapport à
// l'emprise de l'unité ; `repeat` : -1 = en boucle.
const ABILITY_EFFECTS = {
  // Vert, Frappe paralysante (Athos) : en boucle sur la victime tant qu'elle est paralysée.
  paralyze: {
    key: 'hit-swirl', path: 'effect/hit-swirl.png', frames: 12, row: 3, scale: 1, repeat: -1,
  },
  // Orange, Attaque dévastatrice (Fafnir) : une fois, sur la victime.
  bonusDamage: {
    key: 'hit-spikes', path: 'effect/hit-spikes.png', frames: 13, row: 0, scale: 2, repeat: 0,
  },
};
const ABILITY_EFFECT_MS = 1500;

// GRAPHICS.md « Aptitudes » : compteur d'une aptitude périodique (units.md 6.1, « toutes les N
// attaques »), sous la barre de vie : une rangée de N cases (ValueSlots/<couleur>/StepSlotA du
// pack, 32 × 3 px), une case remplie par attaque portée depuis le dernier déclenchement. Les cases
// vides sont les attaques restantes, celle qui déclenche l'aptitude comprise. Clé = type d'aptitude.
const ABILITY_COUNTER_COLORS = {
  paralyze: 'green', // Frappe paralysante (Athos)
  bonusDamage: 'red', // Attaque dévastatrice (Fafnir)
};
const COUNTER_SLOT_HEIGHT = 4;
const COUNTER_SLOT_GAP = 2;

// Cette Scene gère exclusivement le champ de bataille (technical.md 2.2) : grille, sprites,
// animations, clics sur le terrain pendant la sélection d'une commande, signaux visuels de
// pause. Le déploiement (glisser-déposer) et les ordres (rangée « Ordres ») vivent dans la tour de
// commandement React (src/ui/) ; le choix de faction et l'écran de résultat vivent dans des écrans React
// séparés (src/screens/, technical.md 5) — cette Scene est recréée par BattleScreen.jsx à
// chaque entrée dans l'écran de bataille, faction déjà connue (voir `init`). Les deux couches
// ne communiquent qu'à travers `interactionState` et l'objet `battle` qu'il expose.
export default class BattleScene extends Phaser.Scene {
  constructor() {
    super('BattleScene');
    this.unitViews = new Map(); // unit.id -> { container, barFill, barWidth, stunEffect, ... }
  }

  init(data) {
    this.playerFaction = data.playerFaction;
    this.enemyFaction = data.playerFaction === 'wyrms' ? 'undead' : 'wyrms';
    this.battleDefinition = BATTLES[data.battleId]; // src/data/battles.js
    this.playerUnits = data.playerUnits; // individus du joueur engagés (rules.md 2)
    // rules.md 7.3 : phases de la bataille (zones), résolues pour la faction jouée par l'IA.
    this.phases = this.battleDefinition.phases.map(({ enemyScripts, obstacles, flippedBackground }) => ({
      enemyScript: enemyScripts[this.enemyFaction], obstacles, flippedBackground,
    }));
  }

  preload() {
    this.load.image('battlefield', 'backgrounds/battlefield-01.png');
    for (const { key } of Object.values(SPECIES_SPRITES)) this.load.image(key, spritePath(key));
    this.load.image('rocks', 'sprites/rocks.png');
    for (const color of Object.values(ABILITY_COUNTER_COLORS)) {
      for (const part of ['background', 'fill']) this.load.image(`step-slot-${color}-${part}`, `ui/step-slot-${color}-${part}.png`);
    }
    for (const { key, path } of [
      ...Object.values(PROJECTILE_EFFECTS), ...Object.values(ABILITY_EFFECTS), MELEE_EFFECT,
    ]) {
      this.load.spritesheet(key, path, { frameWidth: CELL_SIZE, frameHeight: CELL_SIZE });
    }
  }

  create() {
    // Animation de vol de chaque missile : la ligne de couleur de la faction, jouée en entier
    // pendant le trajet (les animations sont globales au Game, recréé à chaque bataille).
    for (const { key, frames, row } of Object.values(PROJECTILE_EFFECTS)) {
      if (this.anims.exists(`${key}-flight`)) continue;
      this.anims.create({
        key: `${key}-flight`,
        frames: this.anims.generateFrameNumbers(key, { start: row * frames, end: row * frames + frames - 1 }),
        duration: PROJECTILE_FLIGHT_MS,
      });
    }
    for (const {
      key, frames, row, repeat,
    } of Object.values(ABILITY_EFFECTS)) {
      if (this.anims.exists(key)) continue;
      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers(key, { start: row * frames, end: row * frames + frames - 1 }),
        duration: ABILITY_EFFECT_MS,
        repeat,
      });
    }
    if (!this.anims.exists(MELEE_EFFECT.key)) {
      const { key, frames, row } = MELEE_EFFECT;
      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers(key, { start: row * frames, end: row * frames + frames - 1 }),
        duration: MELEE_EFFECT_MS,
      });
    }
    // Cases du compteur d'aptitude : pixel art agrandi, sans lissage.
    for (const color of Object.values(ABILITY_COUNTER_COLORS)) {
      for (const part of ['background', 'fill']) {
        this.textures.get(`step-slot-${color}-${part}`).setFilter(Phaser.Textures.FilterMode.NEAREST);
      }
    }
    const grid = new Grid(GRID_WIDTH, GRID_HEIGHT, this.phases[0].obstacles); // rules.md 1
    this.grid = grid;
    this.width = grid.width * CELL_SIZE;
    this.height = grid.height * CELL_SIZE;

    // Profondeurs négatives : fond et rochers restent sous les unités, même redessinés au
    // changement de phase (voir showPhase).
    this.background = this.add.image(0, 0, 'battlefield').setOrigin(0, 0)
      .setDisplaySize(this.width, this.height).setDepth(-3);
    this.backgroundFx = this.background.preFX?.addColorMatrix();
    // Copie non filtrée du background, masquée sur la zone cliquable pendant une interaction
    // (voir applyPauseColors) : c'est elle qui "reste en couleur" au-dessus du terrain désaturé.
    // Masque en coordonnées écran plutôt qu'un crop : un crop se calcule dans la texture et se
    // décale quand le fond est retourné (phase 2).
    this.colorZoneMask = this.make.graphics({}, false);
    this.colorBackground = this.add.image(0, 0, 'battlefield').setOrigin(0, 0)
      .setDisplaySize(this.width, this.height).setDepth(-2).setVisible(false)
      .setMask(this.colorZoneMask.createGeometryMask());
    this.drawGridLines(grid);
    this.deploymentZone = this.add.graphics().setVisible(false);
    this.showPhase(0);

    this.startBattle(this.playerFaction);
  }

  drawGridLines(grid) {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0xffffff, 0.15);
    for (let x = 0; x <= grid.width; x++) {
      graphics.lineBetween(x * CELL_SIZE, 0, x * CELL_SIZE, grid.height * CELL_SIZE);
    }
    for (let y = 0; y <= grid.height; y++) {
      graphics.lineBetween(0, y * CELL_SIZE, grid.width * CELL_SIZE, y * CELL_SIZE);
    }
    graphics.setVisible(DEBUG_SHOW_GRID); // invisible pour le joueur (voir DEBUG_SHOW_GRID)
  }

  // rules.md 1 : obstacles infranchissables — un bloc 2x2 est dessiné comme un seul gros rocher.
  drawObstacles(obstacles) {
    this.obstacleViews = obstacles.map(({ x, y, size = 1 }) => {
      const center = cellCenter(x, y, size);
      const image = this.add.image(center.x, center.y, 'rocks')
        .setDisplaySize(CELL_SIZE * size * 0.95, CELL_SIZE * size * 0.95).setDepth(-1);
      return {
        x, y, image, fx: image.preFX?.addColorMatrix(),
      };
    });
  }

  // rules.md 7.3 : affiche la zone de la phase `index` (fond dans le bon sens, rochers).
  showPhase(index) {
    const { obstacles, flippedBackground } = this.phases[index];
    for (const { image } of this.obstacleViews ?? []) image.destroy();
    this.drawObstacles(obstacles);
    this.drawDeploymentZone(obstacles);
    this.background.setFlipX(flippedBackground);
    this.colorBackground.setFlipX(flippedBackground);
    this.shownPhaseIndex = index;
  }

  // rules.md 7.3 : pendant un changement de phase, l'armée du joueur sort par la droite, puis
  // entre par la gauche de la nouvelle zone. Purement visuel : la logique a déjà placé les
  // unités sur leurs cases d'arrivée (phases.js), on ne fait que décaler leur affichage.
  applyPhaseTransition() {
    const transition = phaseTransitionProgress(this.battle);
    if (!transition && !this.transitionShown) return;
    this.transitionShown = !!transition;

    for (const unit of this.battle.units) {
      const view = this.unitViews.get(unit.id);
      if (!view || unit.faction !== 'player') continue;
      if (view.moveTween) view.moveTween.stop();
      view.lastCellX = unit.x;
      view.lastCellY = unit.y;
      const center = cellCenter(unit.x, unit.y, unit.size);
      let offsetX = 0; // transition finie : l'unité se pose sur sa case
      if (transition?.stage === 'exit') offsetX = transition.progress * (this.width - center.x + unit.size * CELL_SIZE);
      if (transition?.stage === 'enter') offsetX = -(1 - transition.progress) * (center.x + unit.size * CELL_SIZE);
      view.container.setPosition(center.x + offsetX, center.y);
    }
  }

  // rules.md 9 : le choix de faction lui-même vit maintenant dans FactionChoiceScreen (React,
  // technical.md 5) — cette Scene reçoit `playerFaction` déjà tranché via `init(data)`.
  startBattle(playerFaction) {
    const playerRoster = ROSTERS[playerFaction];
    const enemyRoster = ROSTERS[playerFaction === 'wyrms' ? 'undead' : 'wyrms'];

    this.battle = createBattle(this.grid, playerRoster, enemyRoster, this.phases[0].enemyScript);
    // rules.md 2 et 11.6 : la réserve du joueur est faite de ses individus, chacun avec son niveau.
    this.battle.playerDeployment = createDeploymentState(playerRoster, this.playerUnits);
    setUpcomingPhases(this.battle, this.phases.slice(1));
    const { tutorial } = this.battleDefinition;
    if (tutorial) startTutorial(this.battle, tutorial); // technical.md 5.5

    // Publie l'état pour la tour de commandement React (technical.md 2.2) : c'est le seul canal de
    // communication entre les deux couches, aucune ne référence les objets de l'autre.
    interactionState.battle = this.battle;
    interactionState.unitDisplayCenter = (unit) => {
      const view = this.unitViews.get(unit.id);
      return view ? { x: view.container.x, y: view.container.y } : null;
    };

    this.input.mouse.disableContextMenu();
    this.input.on('pointerdown', (pointer) => this.handlePointerDown(pointer));

    this.createSelectionIndicator();
  }

  // rules.md 2 : halo sur la moitié gauche du terrain (zone de déploiement du joueur, voir
  // isValidDeploymentPosition), visible uniquement pendant un glisser depuis la tour. Les cases
  // de rochers en sont exclues : on n'y déploie pas. Couleur de la faction du joueur ; le liseré
  // suit le contour de la zone, rochers compris, tracé à l'intérieur des cases de la zone.
  drawDeploymentZone(obstacles) {
    const grid = new Grid(GRID_WIDTH, GRID_HEIGHT, obstacles);
    const zoneColumns = Math.floor(grid.width / 2);
    const inZone = (x, y) => x < zoneColumns && grid.isFree(x, y);
    const color = FACTION_COLORS[this.playerFaction];
    const border = 3;
    const far = CELL_SIZE - border;
    const zone = this.deploymentZone.clear();
    for (let x = 0; x < zoneColumns; x++) {
      for (let y = 0; y < grid.height; y++) {
        if (!inZone(x, y)) continue;
        const px = x * CELL_SIZE;
        const py = y * CELL_SIZE;
        zone.fillStyle(color, 0.15).fillRect(px, py, CELL_SIZE, CELL_SIZE);
        zone.fillStyle(color, 0.9);
        if (!inZone(x, y - 1)) zone.fillRect(px, py, CELL_SIZE, border);
        if (!inZone(x, y + 1)) zone.fillRect(px, py + far, CELL_SIZE, border);
        if (!inZone(x - 1, y)) zone.fillRect(px, py, border, CELL_SIZE);
        if (!inZone(x + 1, y)) zone.fillRect(px + far, py, border, CELL_SIZE);
        // Coins rentrants (case en diagonale hors zone, ses deux voisines dedans) : sans ce
        // carré, le liseré aurait un trou à l'angle d'un rocher.
        for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
          if (inZone(x + dx, y) && inZone(x, y + dy) && !inZone(x + dx, y + dy)) {
            zone.fillRect(dx < 0 ? px : px + far, dy < 0 ? py : py + far, border, border);
          }
        }
      }
    }
  }

  // -- Fin de bataille (rules.md 8) --------------------------------------------------------
  // L'abandon est dans la tour React, l'écran de résultat final dans des écrans React.

  // Cache le HUD encore présent côté Phaser une fois la bataille terminée (rules.md 8 : plus
  // aucune interaction possible). L'écran de résultat lui-même est maintenant VictoryScreen/
  // DefeatScreen (React, technical.md 5) — BattleScreen.jsx navigue vers l'un ou l'autre dès
  // que `battle.outcome` change, cette Scene n'a donc plus qu'à figer son propre affichage.
  hideBattleUi() {
    this.selectionIndicator.setVisible(false);
  }

  // -- Feedback visuel des aptitudes (units.md, section 6) --------------------------------

  processAbilityEvents() {
    const events = this.battle.abilityEvents;
    // À distance, l'effet sur la victime attend l'arrivée du missile tiré au même tick (fireProjectile).
    const impactDelay = (victim) => (events.some((e) => e.type === 'rangedAttack' && e.target === victim)
      ? PROJECTILE_FLIGHT_MS : 0);
    for (const event of events) {
      if (event.type === 'paralyze') {
        // Une victime vivante montre la paralysie en continu (stunEffect, updateUnitView). Tuée par
        // le coup même (fréquent : 50 dégâts), elle n'a plus d'attaque à rater : l'animation est
        // jouée une fois là où elle est morte, pour que l'aptitude reste visible.
        if (!event.unit.isAlive) this.playAbilityEffect(event.unit, ABILITY_EFFECTS.paralyze, impactDelay(event.unit));
      } else if (event.type === 'bonusDamage') {
        this.playAbilityEffect(event.target, ABILITY_EFFECTS.bonusDamage, impactDelay(event.target));
        this.flashUnit(event.target, 0xffff00);
        this.cameras.main.shake(120, 0.006);
        this.spawnFloatingText(event.target, 'COUP CRITIQUE !', '#ffcc00');
      } else if (event.type === 'missed') {
        this.spawnFloatingText(event.unit, 'Raté !', '#cccccc');
      } else if (event.type === 'heal') {
        this.spawnFloatingText(event.unit, `+${event.amount}`, '#2ecc71');
        this.pulseHealthBar(event.unit);
      } else if (event.type === 'rangedAttack') {
        this.fireProjectile(event.unit, event.target);
      } else if (event.type === 'meleeAttack') {
        this.playAbilityEffect(event.target, MELEE_EFFECT, 0);
      }
    }
  }

  // rules.md 4.5 : missile purement visuel — les dégâts ont déjà été appliqués par combat.js
  // à ce tick, ce tween ne fait que les illustrer. Couleur selon la faction réelle du tireur
  // (orange Wyrms, vert menthe Morts-Vivants), déduite de son camp player/enemy.
  fireProjectile(shooter, target) {
    const from = this.unitViews.get(shooter.id)?.container;
    const to = this.unitViews.get(target.id)?.container;
    if (!from || !to) return;

    const shooterFaction = shooter.faction === 'player'
      ? this.playerFaction
      : (this.playerFaction === 'wyrms' ? 'undead' : 'wyrms');
    const color = PROJECTILE_COLORS[shooterFaction];

    // Le missile joue toute son animation pendant le vol, orienté vers la cible.
    const effect = PROJECTILE_EFFECTS[shooterFaction];
    const missile = this.add.sprite(from.x, from.y, effect.key)
      .setRotation(Phaser.Math.Angle.Between(from.x, from.y, to.x, to.y))
      .setDepth(10)
      .play(`${effect.key}-flight`);
    const impactX = to.x;
    const impactY = to.y;
    this.tweens.add({
      targets: missile,
      x: impactX,
      y: impactY,
      duration: PROJECTILE_FLIGHT_MS,
      onComplete: () => {
        missile.destroy();
        const impact = this.add.circle(impactX, impactY, 8, color, 0.9).setDepth(10);
        this.tweens.add({
          targets: impact, scale: 3, alpha: 0, duration: 180, onComplete: () => impact.destroy(),
        });
      },
    });
  }

  // Animation d'aptitude jouée une fois sur `unit` : elle la suit tant qu'elle est sur le
  // terrain ; si l'unité est morte (sa vue disparaît, voir syncViews) — avant le début de
  // l'animation (victime tuée par le coup, missile encore en vol) ou pendant —, elle se joue là
  // où elle est morte.
  playAbilityEffect(unit, effect, delayMs) {
    this.time.delayedCall(delayMs, () => {
      const container = this.unitViews.get(unit.id)?.container;
      const { x, y } = container ?? cellCenter(unit.x, unit.y, unit.size);
      const size = unit.size * CELL_SIZE * effect.scale;
      const sprite = this.add.sprite(x, y, effect.key)
        .setDisplaySize(size, size)
        .setDepth(10)
        .play({ key: effect.key, repeat: 0 }); // une fois, même pour une animation en boucle
      const follow = () => {
        const view = this.unitViews.get(unit.id);
        if (view) sprite.setPosition(view.container.x, view.container.y);
      };
      this.events.on('update', follow);
      sprite.once('animationcomplete', () => {
        this.events.off('update', follow);
        sprite.destroy();
      });
    });
  }

  flashUnit(unit, color) {
    const view = this.unitViews.get(unit.id);
    if (!view) return;
    const { visual } = view;
    visual.setTint(color);

    this.tweens.add({
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

  spawnFloatingText(unit, message, color) {
    const view = this.unitViews.get(unit.id);
    if (!view) return;
    const label = this.add.text(0, -unit.size * CELL_SIZE / 2 - 16, message, {
      fontSize: '13px', color, fontStyle: 'bold',
    }).setOrigin(0.5, 1);
    view.container.add(label);
    this.tweens.add({
      targets: label, y: label.y - 26, alpha: 0, duration: 900, onComplete: () => label.destroy(),
    });
  }

  pulseHealthBar(unit) {
    const view = this.unitViews.get(unit.id);
    if (!view) return;
    this.tweens.add({
      targets: view.barFill, scaleY: 2, duration: 150, yoyo: true,
    });
  }

  // -- Sélection et input sur le terrain (rules.md 5) --------------------------------------
  // L'ordre est choisi dans la tour React ; tant qu'une commande est en cours de sélection,
  // chaque clic sur le terrain est transmis à commandSelection.js, qui décide de l'étape
  // (unité, puis cible). Clic droit : annule la commande en cours.

  createSelectionIndicator() {
    const color = FACTION_COLORS[this.playerFaction]; // seules les unités du joueur sont sélectionnables
    this.selectionIndicator = this.add.rectangle(0, 0, CELL_SIZE, CELL_SIZE, color, 0.2)
      .setOrigin(0, 0)
      .setStrokeStyle(3, color)
      .setVisible(false);
  }

  updateSelectionIndicator() {
    const unit = this.battle.commandSelection?.unit;
    if (!unit?.isOnField) {
      this.selectionIndicator.setVisible(false);
      return;
    }
    const size = unit.size * CELL_SIZE;
    this.selectionIndicator.setSize(size, size);
    this.selectionIndicator.setPosition(unit.x * CELL_SIZE, unit.y * CELL_SIZE);
    this.selectionIndicator.setVisible(true);
  }

  handlePointerDown(pointer) {
    if (this.battle.outcome !== 'ongoing') return; // bataille terminée : plus aucune interaction
    if (pointer.rightButtonDown()) {
      cancelCommand(this.battle);
      return;
    }
    // Un clic sur le sprite d'une unité vise sa case logique : pendant une pause, le sprite peut
    // être figé à mi-chemin de la case suivante (déplacement animé gelé).
    const unit = this.unitUnderPointer(pointer);
    const x = unit ? unit.x : Math.floor(pointer.x / CELL_SIZE);
    const y = unit ? unit.y : Math.floor(pointer.y / CELL_SIZE);
    clickField(this.battle, x, y);
  }

  // Unité sur le terrain dont le sprite affiché (son bloc de cases) est sous le pointeur, ou null.
  unitUnderPointer(pointer) {
    return this.battle.units.find((unit) => {
      const view = unit.isOnField && this.unitViews.get(unit.id);
      const half = (unit.size * CELL_SIZE) / 2;
      return view && Math.abs(pointer.x - view.container.x) < half && Math.abs(pointer.y - view.container.y) < half;
    }) ?? null;
  }

  // -- Signaux visuels de pause (ui-battle-screen-decisions.md 3) ---------------------------
  // Chaque élément du terrain porte son propre FX ColorMatrix : terrain désaturé, sauf ce qui
  // est cliquable (getClickableHighlights). Pas de calque opaque : tout reste visible et
  // cliquable. Sans WebGL (fallback Canvas), preFX n'existe pas et le signal est absent.

  applyPauseColors() {
    const { main, interaction } = this.battle.pause;
    let level = 0;
    if (main) level = FULL_DESATURATION;
    else if (interaction || this.battle.pause.tutorial) level = PARTIAL_DESATURATION;

    const { zone, unitIds } = getClickableHighlights(this.battle);
    const inZone = (x, y) => zone !== null
      && x >= zone.x && y >= zone.y && x < zone.x + zone.width && y < zone.y + zone.height;

    this.backgroundFx?.saturate(level);
    this.colorBackground.setVisible(level !== 0 && zone !== null);
    if (zone) {
      this.colorZoneMask.clear().fillStyle(0xffffff)
        .fillRect(zone.x * CELL_SIZE, zone.y * CELL_SIZE, zone.width * CELL_SIZE, zone.height * CELL_SIZE);
    }
    for (const obstacle of this.obstacleViews) obstacle.fx?.saturate(inZone(obstacle.x, obstacle.y) ? 0 : level);
    for (const [id, view] of this.unitViews) view.fx?.saturate(unitIds.has(id) ? 0 : level);
  }

  // -- Boucle par frame ---------------------------------------------------------------------

  update(time, deltaMs) {
    // Pendant toute pause (rules.md 5.2), la logique ne tick plus et les animations (tweens
    // de déplacement, missiles, textes flottants) sont gelées avec elle.
    // tickBattle est appelé même en pause : le tutoriel peut y changer d'étape.
    tickBattle(this.battle, deltaMs / 1000);
    this.processAbilityEvents(); // vide si la bataille n'a pas avancé
    this.tweens.paused = !isBattleTimeRunning(this.battle.pause) || this.battle.outcome !== 'ongoing';

    if (this.shownPhaseIndex !== this.battle.phaseIndex) this.showPhase(this.battle.phaseIndex);
    this.syncViews();
    this.applyPhaseTransition();
    this.updateSelectionIndicator();
    this.applyPauseColors();
    this.deploymentZone.setVisible(this.battle.pause.interaction === 'deploy');

    if (this.battle.outcome !== 'ongoing') this.hideBattleUi();
  }

  syncViews() {
    for (const unit of this.battle.units) {
      const view = this.unitViews.get(unit.id);

      if (!unit.isOnField) {
        if (view) {
          if (view.moveTween) view.moveTween.stop();
          view.container.destroy();
          this.unitViews.delete(unit.id);
        }
        continue;
      }

      if (view) {
        this.updateUnitView(view, unit);
      } else {
        this.unitViews.set(unit.id, this.createUnitView(unit));
      }
    }
  }

  createUnitView(unit) {
    const container = this.add.container(0, 0);
    const footprintSize = unit.size * CELL_SIZE;

    // Le joueur attaque vers la droite, l'IA vers la gauche : on retourne le dessin si besoin.
    const { key, facing } = SPECIES_SPRITES[unit.species.name];
    const attackDirection = unit.faction === 'player' ? 'right' : 'left';
    const visual = this.add.image(0, 0, key)
      .setDisplaySize(footprintSize * 0.9, footprintSize * 0.9)
      .setFlipX(facing !== null && facing !== attackDirection);
    container.add(visual);

    const barWidth = footprintSize * 0.8;
    const barY = -footprintSize / 2 - 10;
    const barBackground = this.add.rectangle(0, barY, barWidth, 6, 0x000000).setOrigin(0.5);
    // Barre de vie dans la couleur principale de la faction de l'unité.
    const barColor = FACTION_COLORS[unit.faction === 'player' ? this.playerFaction : this.enemyFaction];
    const barFill = this.add.rectangle(-barWidth / 2, barY, barWidth, 6, barColor).setOrigin(0, 0.5);
    container.add(barBackground);
    container.add(barFill);
    const abilityCounter = this.createAbilityCounter(unit, container, barWidth, barY + 3 + 2);

    // units.md 6 — Frappe paralysante d'Athos : animation en boucle sur l'unité tant que des
    // prochaines attaques sont neutralisées (s'arrête avec la dernière attaque ratée, voir
    // updateUnitView et le texte flottant "Raté !").
    const { paralyze } = ABILITY_EFFECTS;
    const stunEffect = this.add.sprite(0, 0, paralyze.key)
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
      container.x = this.width + unit.size * CELL_SIZE / 2;
      view.moveTween = this.tweens.add({
        targets: container, x: center.x, duration: ENEMY_ENTRY_MS, ease: 'Linear',
      });
    }
    this.updateUnitView(view, unit);
    return view;
  }

  // rules.md 4.1 : la logique avance en continu (delta-time), mais ne "commet" une case qu'une
  // fois celle-ci pleinement franchie (voir moveToward/stepAwayFrom dans combat.js) — la Scene
  // ne connaît donc jamais de position fractionnaire à lire directement. On obtient un rendu
  // continu en douceur en animant (tween) le passage d'une case à l'autre plutôt qu'en
  // "sautant" instantanément, sur la durée réelle qu'aurait dû prendre ce trajet à la vitesse
  // de déplacement de l'unité (species.moveSpeed, en cases/s).
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
      return this.add.nineslice(x, top, `step-slot-${color}-${part}`, undefined, slotWidth, COUNTER_SLOT_HEIGHT, 2, 2, 0, 0)
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

  updateUnitView(view, unit) {
    if (unit.x !== view.lastCellX || unit.y !== view.lastCellY) {
      const cellsMoved = Math.max(Math.abs(unit.x - view.lastCellX), Math.abs(unit.y - view.lastCellY));
      view.lastCellX = unit.x;
      view.lastCellY = unit.y;
      if (view.moveTween) view.moveTween.stop();
      const center = cellCenter(unit.x, unit.y, unit.size);
      view.moveTween = this.tweens.add({
        targets: view.container,
        x: center.x,
        y: center.y,
        duration: (cellsMoved / unit.species.moveSpeed) * 1000,
        ease: 'Linear',
      });
    }

    const ratio = Math.max(0, unit.hp / unit.maxHp);
    view.barFill.setSize(view.barWidth * ratio, 6);

    const stunned = unit.paralyzedAttacks > 0;
    if (stunned && !view.stunEffect.visible) view.stunEffect.setVisible(true).play(ABILITY_EFFECTS.paralyze.key);
    if (!stunned && view.stunEffect.visible) view.stunEffect.stop().setVisible(false);
    if (view.abilityCounter) {
      const charged = unit.attacksLanded % view.abilityCounter.every;
      view.abilityCounter.fills.forEach((fill, i) => fill.setVisible(i < charged));
    }
  }
}
