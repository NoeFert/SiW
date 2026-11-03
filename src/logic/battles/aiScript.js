import BattleUnit from './battleUnit.js';
import {
  isValidDeploymentPosition, getPresenceUsed, consumeFreshCopy, PRESENCE_CAP,
} from './deployment.js';

// IA : déploie selon le script de la phase (rules.md 7).
export function createAiScriptState() {
  return { nextIndex: 0 };
}

// Cibles stratégiques (rules.md 7.2).
function strategicTargets(enemies, allies) {
  const isWeak = (unit) => unit.hp <= unit.maxHp / 2;
  const reinforcement = enemies.filter((enemy) => allies.some((ally) => isWeak(ally) && (
    (enemy.status === 'engaged' && enemy.target === ally)
    || (ally.status === 'engaged' && ally.target === enemy)
  )));
  if (reinforcement.length > 0) return reinforcement;

  const maxHp = Math.max(...enemies.map((enemy) => enemy.hp));
  return enemies.filter((enemy) => enemy.hp === maxHp);
}

// Entrée par le bord droit, au plus près d'une cible stratégique (rules.md 7.2).
function chooseDeploymentPosition(species, faction, grid, unitsOnField, rng) {
  const x = faction === 'enemy' ? grid.width - species.size : 0;
  const valid = [];
  for (let y = 0; y <= grid.height - species.size; y++) {
    if (isValidDeploymentPosition(grid, faction, species, x, y, unitsOnField)) valid.push({ x, y });
  }
  if (valid.length === 0) return null;

  const pick = (positions) => positions[Math.floor(rng() * positions.length)];
  const enemies = unitsOnField.filter((u) => u.faction !== faction);
  if (enemies.length === 0) return pick(valid);

  const rowGap = ({ y }, target) => Math.max(0, target.y - (y + species.size - 1), y - (target.y + target.size - 1));
  const targets = strategicTargets(enemies, unitsOnField.filter((u) => u.faction === faction));
  const distances = valid.map((position) => Math.min(...targets.map((target) => rowGap(position, target))));
  const closest = Math.min(...distances);
  return pick(valid.filter((_, i) => distances[i] === closest));
}

// `script` trié par `time`. Une entrée bloquée attend, et les suivantes aussi.
export function deployScheduledUnits(script, state, elapsedSeconds, faction, grid, units, rng = Math.random) {
  const unitsOnField = units.filter((u) => u.isOnField);
  const deployed = [];
  while (state.nextIndex < script.length && script[state.nextIndex].time <= elapsedSeconds) {
    const { species } = script[state.nextIndex];
    if (getPresenceUsed(faction, unitsOnField) + species.cost > PRESENCE_CAP) break;
    const position = chooseDeploymentPosition(species, faction, grid, unitsOnField, rng);
    if (!position) break;
    const unit = new BattleUnit(species, faction, position.x, position.y);
    deployed.push(unit);
    unitsOnField.push(unit);
    state.nextIndex += 1;
  }
  return deployed;
}

// Pas de passage par deployUnit : le script garantit copies et [Légendaire].
export function deployDueEnemies(battle) {
  const due = deployScheduledUnits(
    battle.enemyScript, battle.aiScriptState, battle.elapsedSeconds - battle.phaseStartSeconds, 'enemy',
    battle.grid, battle.units, battle.rng,
  );
  for (const unit of due) {
    consumeFreshCopy(battle.enemyDeployment, unit.species);
    battle.units.push(unit);
  }
}
