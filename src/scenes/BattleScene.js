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

// Émis après chaque frame jouée ; BattleScreen.jsx s'y abonne.
export const BATTLE_FRAME_EVENT = 'battleFrame';

// Scene du champ de bataille : fait avancer la bataille et l'affiche via les vues de src/scenes/battle/.
export default class BattleScene extends Phaser.Scene {
  constructor() {
    super('BattleScene');
  }

  // `data` : { battle, playerFaction, battleId }
  init(data) {
    this.battle = data.battle;
    this.factions = { playerFaction: data.playerFaction, enemyFaction: opposingFaction(data.playerFaction) };
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

  showPhase(index) {
    this.battlefield.show(index);
    this.deploymentZone.draw(this.battle.grid);
  }

  update(time, deltaMs) {
    const { battle } = this;
    // Appelé même en pause : le tutoriel peut changer d'étape.
    tickBattle(battle, deltaMs / 1000);
    this.effects.play(battle.abilityEvents);
    // Animations gelées pendant les pauses et après la fin.
    this.tweens.paused = !isBattleTimeRunning(battle.pause) || battle.outcome !== 'ongoing';

    if (this.battlefield.shownPhaseIndex !== battle.phaseIndex) this.showPhase(battle.phaseIndex);
    this.units.sync(battle.units);
    this.units.applyPhaseTransition(battle);
    this.fieldInput.update();
    applyPauseTint(battle, this.battlefield, this.units);
    this.deploymentZone.setVisible(battle.pause.interaction === 'deploy');

    this.game.events.emit(BATTLE_FRAME_EVENT);
  }

  unitDisplayCenter(unit) {
    return this.units.displayCenter(unit);
  }
}
