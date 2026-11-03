import { levelDamage, levelStat } from '../levels.js';

let nextId = 1;

// Unité sur le terrain le temps d'une bataille (≠ individu possédé, ownedUnits.js).
export default class BattleUnit {
  constructor(species, faction, x, y, level = 1, individualId = null) {
    this.id = nextId++;
    this.species = species;
    this.faction = faction;
    this.x = x;
    this.y = y;
    this.level = level;
    this.individualId = individualId;
    this.maxHp = levelStat(species.maxHp, level);
    this.damage = levelDamage(species.damage, level);
    this.hp = this.maxHp;
    this.killXp = 0; // XP gagnée (rules.md 11.6)
    this.status = 'idle'; // idle | moving | attacking | engaged | fleeing
    this.target = null;
    this.attackTimer = 0;
    this.attacksLanded = 0;
    this.paralyzedAttacks = 0;
    this.moveProgress = 0;
    this.command = null; // { type: 'attack', target } | { type: 'moveTo', x, y } | { type: 'flee' }
    this.hasFled = false;
  }

  get size() {
    return this.species.size;
  }

  get isFlying() {
    return this.species.keywords.includes('flying');
  }

  get isLegendary() {
    return this.species.keywords.includes('legendary');
  }

  get isAlive() {
    return this.hp > 0;
  }

  get isOnField() {
    return this.isAlive && !this.hasFled;
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
  }
}
