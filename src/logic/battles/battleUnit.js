import { levelDamage, levelStat } from '../levels.js';

let nextId = 1;

// Unité de bataille : une unité sur le terrain, le temps d'une bataille. À ne pas confondre avec
// les individus possédés du profil ({ id, species, xp }, voir ownedUnits.js), qui survivent
// d'une bataille à l'autre : côté joueur, chaque unité de bataille représente un individu
// (`individualId`) avec son niveau (`level`, rules.md 11.6) ; les unités de l'IA restent
// niveau 1, sans individu. PV max et dégâts sont ceux du niveau, figés pour toute la bataille.
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
    this.killXp = 0; // coût en PP des ennemis achevés (XP de l'individu à la victoire, rules.md 11.6)
    this.status = 'idle'; // idle | moving | attacking | engaged | fleeing
    this.target = null;
    this.attackTimer = 0;
    this.attacksLanded = 0;
    this.paralyzedAttacks = 0; // prochaines attaques annulées (Frappe paralysante d'Athos)
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

  // Vivante et toujours sur le terrain (pas retirée par une fuite réussie, rules.md 2/5).
  get isOnField() {
    return this.isAlive && !this.hasFled;
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
  }
}
