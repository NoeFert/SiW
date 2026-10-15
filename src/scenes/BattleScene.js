import Phaser from 'phaser';
import { tickBattle } from '../logic/battles/battle.js';
import { opposingFaction, resolvePhases } from '../logic/battles/battleSetup.js';
import { isBattleTimeRunning } from '../logic/battles/pause.js';
import { BATTLES } from '../data/battles/index.js';
import BattlefieldView from './battle/BattlefieldView.js';
import DeploymentZoneView from './battle/DeploymentZoneView.js';
import UnitViews from './battle/UnitViews.js';
import CombatEffects from './battle/CombatEffects.js';
import FieldInput from './battle/FieldInput.js';
import { applyPauseTint } from './battle/PauseTint.js';

// Événement émis sur `game.events` après chaque frame jouée (bataille avancée et terrain
// redessiné) : BattleScreen.jsx s'y abonne pour redessiner la tour et détecter la fin de bataille.
export const BATTLE_FRAME_EVENT = 'battleFrame';

// Scene Phaser du champ de bataille (technical.md 2.2). Elle fait avancer la bataille à chaque
// frame et l'affiche, en déléguant chaque sujet à une vue (src/scenes/battle/) :
// - BattlefieldView : fond et rochers de la zone affichée
// - DeploymentZoneView : halo de la zone de déploiement pendant un glisser
// - UnitViews : sprites, barres de vie, compteurs d'aptitude, déplacements animés
// - CombatEffects : missiles, entailles, aptitudes, textes flottants
// - FieldInput : clics sur le terrain pendant la sélection d'un ordre
// - PauseTint : désaturation du terrain pendant les pauses
// Le déploiement (glisser-déposer) et les ordres vivent dans la tour de commandement React
// (src/ui/). Cette Scene est recréée par BattleScreen.jsx à chaque entrée dans l'écran de
// bataille, qui lui donne la bataille à jouer (voir `init`) ; les deux couches partagent
// seulement l'objet `battle`, et la Scene signale chaque frame jouée (BATTLE_FRAME_EVENT).
export default class BattleScene extends Phaser.Scene {
  constructor() {
    super('BattleScene');
  }

  // `data` : { battle, playerFaction, battleId } — la bataille créée par BattleScreen.jsx, que la
  // Scene fait avancer et affiche ; la faction du joueur (couleurs) ; l'identifiant de la bataille
  // (src/data/battles/), pour les fonds et les rochers de ses zones.
  init(data) {
    this.battle = data.battle;
    this.factions = { playerFaction: data.playerFaction, enemyFaction: opposingFaction(data.playerFaction) };
    // rules.md 7.3 : zones de la bataille (fond, obstacles), affichées l'une après l'autre.
    this.phases = resolvePhases(BATTLES[data.battleId], this.factions.enemyFaction);
  }

  preload() {
    BattlefieldView.preload(this, this.phases);
    UnitViews.preload(this);
    CombatEffects.preload(this);
  }

  create() {
    const { battle, factions } = this;
    this.battlefield = new BattlefieldView(this, this.phases, battle.grid);
    this.deploymentZone = new DeploymentZoneView(this, factions.playerFaction);
    this.units = new UnitViews(this, { ...factions, fieldWidth: this.battlefield.width });
    this.effects = new CombatEffects(this, this.units, factions);
    this.fieldInput = new FieldInput(this, battle, this.units, factions.playerFaction);
    this.showPhase(0);
  }

  // rules.md 7.3 : zone de la phase `index` — fond, rochers et zone de déploiement de sa grille.
  showPhase(index) {
    this.battlefield.show(index);
    this.deploymentZone.draw(this.battle.grid);
  }

  update(time, deltaMs) {
    const { battle } = this;
    // tickBattle est appelé même en pause : le tutoriel peut y changer d'étape.
    tickBattle(battle, deltaMs / 1000);
    this.effects.play(battle.abilityEvents); // vide si la bataille n'a pas avancé
    // Pendant toute pause (rules.md 5.2), les animations (déplacements, missiles, textes
    // flottants) sont gelées avec la logique, et après la fin de la bataille.
    this.tweens.paused = !isBattleTimeRunning(battle.pause) || battle.outcome !== 'ongoing';

    if (this.battlefield.shownPhaseIndex !== battle.phaseIndex) this.showPhase(battle.phaseIndex);
    this.units.sync(battle.units);
    this.units.applyPhaseTransition(battle);
    this.fieldInput.update();
    applyPauseTint(battle, this.battlefield, this.units);
    this.deploymentZone.setVisible(battle.pause.interaction === 'deploy');

    this.game.events.emit(BATTLE_FRAME_EVENT);
  }

  // Position affichée (px du canevas) du sprite d'une unité, ou null : la main du tutoriel la
  // vise (voir UnitViews.displayCenter).
  unitDisplayCenter(unit) {
    return this.units.displayCenter(unit);
  }
}
