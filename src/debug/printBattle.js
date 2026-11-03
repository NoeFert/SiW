// Outil de debug : affiche une bataille en ASCII.
import Grid, { parseObstacleMap } from '../logic/battles/grid.js';
import { footprint } from '../logic/battles/pathfinding.js';
import { createBattle, tickBattle } from '../logic/battles/battle.js';
import { deployPlayerUnit, issuePlayerFlee } from '../logic/battles/playerActions.js';
import { BATTLES } from '../data/battles/index.js';
import { FACTIONS } from '../data/factions/index.js';

const WYRMS_ROSTER = FACTIONS.wyrms.roster;

const FIRST_PHASE = BATTLES.battleTuto.phases[0];
const BATTLEFIELD_OBSTACLES = parseObstacleMap(FIRST_PHASE.obstacles);
const UNDEAD_AI_SCRIPT = FIRST_PHASE.enemyScripts.undead;

const SYMBOLS = {
  'Lambton Worm': 'L',
  'Amphiptère': 'A',
  'Fafnir the Cursed One': 'F',
  'New-reborn Skeleton': 'S',
  'Necromant Initiate': 'N',
  'Athos the Lord of Pain': 'H',
};

function symbolFor(unit) {
  const base = SYMBOLS[unit.species.name] ?? '?';
  return unit.faction === 'player' ? base.toUpperCase() : base.toLowerCase();
}

export function renderGrid(grid, units) {
  const cells = Array.from({ length: grid.height }, () => Array(grid.width).fill('.'));

  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      if (grid.isObstacle(x, y)) cells[y][x] = '#';
    }
  }

  for (const unit of units) {
    if (!unit.isOnField) continue;
    const symbol = symbolFor(unit);
    for (const { x, y } of footprint(unit.x, unit.y, unit.size)) {
      if (grid.isInBounds(x, y)) cells[y][x] = symbol;
    }
  }

  return cells.map((row) => row.join(' ')).join('\n');
}

export function renderUnitList(units) {
  return units
    .filter((unit) => unit.isAlive)
    .map((unit) => {
      const symbol = symbolFor(unit);
      const where = unit.hasFled ? 'OFF FIELD (fled)' : `pos (${unit.x},${unit.y})`;
      return `[${symbol}] #${unit.id} ${unit.species.name} (${unit.faction}) — ` +
        `HP ${unit.hp}/${unit.maxHp} — ${where} — status: ${unit.status}`;
    })
    .join('\n');
}

const OUTCOME_LABELS = {
  playerVictory: 'Victoire du joueur',
  enemyVictory: "Victoire de l'IA",
  draw: 'Match nul',
};

export function renderBattleStatus(battle) {
  if (battle.outcome !== 'ongoing') return `Bataille terminée : ${OUTCOME_LABELS[battle.outcome]}`;
  return 'Bataille en cours';
}

export function printBattle(battle) {
  console.log(renderGrid(battle.grid, battle.units));
  console.log('');
  console.log(renderUnitList(battle.units));
  console.log('');
  console.log(renderBattleStatus(battle));
}

function runFullBattleDemo() {
  const grid = new Grid(24, 14, BATTLEFIELD_OBSTACLES);
  const battle = createBattle(grid, FACTIONS.wyrms, FACTIONS.undead, UNDEAD_AI_SCRIPT);

  const deployAt = (species, x, y) => {
    const result = deployPlayerUnit(battle, species, x, y);
    console.log(
      `Déploiement ${species.name} en (${x},${y}) : `
      + (result.success ? 'OK' : `refusé (${result.reason})`),
    );
    return result.unit;
  };

  console.log('=== t=0s : déploiement initial du joueur ===');
  deployAt(WYRMS_ROSTER.lambtonWorm, 5, 5);
  deployAt(WYRMS_ROSTER.amphiptere, 3, 2);
  const fafnir = deployAt(WYRMS_ROSTER.fafnir, 5, 10);
  console.log('');
  printBattle(battle);

  for (let t = 1; t <= 45 && battle.outcome === 'ongoing'; t++) {
    tickBattle(battle, 1);

    if (t === 15) {
      console.log(`\n--- t=${t}s : le joueur ordonne à Fafnir #${fafnir.id} de fuir ---`);
      issuePlayerFlee(battle.playerFleeState, battle.elapsedSeconds, fafnir);
    }

    if (t % 5 === 0 || battle.outcome !== 'ongoing') {
      console.log(`\n=== t=${t}s ===`);
      printBattle(battle);
    }
  }
}

runFullBattleDemo();
