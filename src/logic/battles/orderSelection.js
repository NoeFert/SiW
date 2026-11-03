import { footprint } from './pathfinding.js';
import { playerDeploymentColumns } from './deployment.js';
import { canFlee } from './fleeCooldown.js';
import { issuePlayerAttack, issuePlayerMoveTo, issuePlayerFlee } from './playerActions.js';
import { startInteraction, endInteraction, recordPlayerAction } from './pause.js';
import { tutorialAllows } from './tutorial.js';

// Sélection d'un ordre : ordre -> unité -> cible (rules.md 5).
export const ORDERS = ['move', 'attack', 'flee'];

function isOpen(battle) {
  return battle.orderSelection !== null;
}

export function canChooseOrder(battle, order) {
  return battle.outcome === 'ongoing'
    && battle.pause.interaction !== 'deploy'
    && !battle.phaseTransition
    && tutorialAllows(battle, `order:${order}`)
    && (order !== 'flee' || canFlee(battle.playerFleeState, battle.elapsedSeconds));
}

// Re-cliquer l'ordre en cours l'annule.
export function chooseOrder(battle, order) {
  if (battle.orderSelection?.order === order) {
    cancelOrder(battle);
    return false;
  }
  if (!canChooseOrder(battle, order)) return false;
  startInteraction(battle.pause, 'order');
  battle.orderSelection = { order, unit: null };
  return true;
}

function close(battle) {
  battle.orderSelection = null;
  if (battle.pause.interaction === 'order') endInteraction(battle.pause);
}

export function cancelOrder(battle) {
  if (isOpen(battle)) close(battle);
}

function complete(battle, issued) {
  if (!issued) return false;
  close(battle);
  recordPlayerAction(battle.pause, 'order');
  return true;
}

export function selectUnit(battle, unit) {
  if (!isOpen(battle) || unit.faction !== 'player' || !unit.isOnField) return false;
  const { order } = battle.orderSelection;
  if (!tutorialAllows(battle, `selectUnit:${order}`)) return false;
  battle.orderSelection.unit = unit;
  if (order === 'flee') return complete(battle, issuePlayerFlee(battle.playerFleeState, battle.elapsedSeconds, unit));
  return true;
}

function selectedActor(battle) {
  const unit = battle.orderSelection?.unit;
  return unit?.isOnField ? unit : null;
}

export function selectEnemy(battle, enemy) {
  const unit = selectedActor(battle);
  if (!unit || battle.orderSelection.order !== 'attack' || enemy.faction !== 'enemy' || !enemy.isOnField) return false;
  if (!tutorialAllows(battle, 'selectTarget')) return false;
  return complete(battle, issuePlayerAttack(unit, enemy));
}

export function selectCell(battle, x, y) {
  const unit = selectedActor(battle);
  if (!unit || battle.orderSelection.order !== 'move' || !isInsideGrid(battle.grid, x, y)) return false;
  if (!tutorialAllows(battle, 'selectTarget')) return false;
  return complete(battle, issuePlayerMoveTo(unit, x, y));
}

function isInsideGrid(grid, x, y) {
  return x >= 0 && y >= 0 && x < grid.width && y < grid.height;
}

export function unitAt(battle, x, y) {
  return battle.units.find(
    (unit) => unit.isOnField && footprint(unit.x, unit.y, unit.size).some((c) => c.x === x && c.y === y),
  ) ?? null;
}

export function clickField(battle, x, y) {
  if (!isOpen(battle)) return false;
  const clicked = unitAt(battle, x, y);
  if (clicked?.faction === 'player') return selectUnit(battle, clicked);
  if (clicked) return selectEnemy(battle, clicked);
  return selectCell(battle, x, y);
}

export function getClickableHighlights(battle) {
  const wholeField = { x: 0, y: 0, width: battle.grid.width, height: battle.grid.height };
  const onField = battle.units.filter((u) => u.isOnField);
  const idsOf = (faction) => new Set(onField.filter((u) => u.faction === faction).map((u) => u.id));

  if (battle.pause.interaction === 'deploy') {
    return { zone: { ...wholeField, width: playerDeploymentColumns(battle.grid) }, unitIds: new Set() };
  }
  if (!isOpen(battle)) return { zone: null, unitIds: new Set() };
  if (!selectedActor(battle)) return { zone: null, unitIds: idsOf('player') };
  return battle.orderSelection.order === 'attack'
    ? { zone: null, unitIds: idsOf('enemy') }
    : { zone: wholeField, unitIds: new Set() };
}
