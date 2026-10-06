import { footprint } from './pathfinding.js';
import { canFlee } from './commands.js';
import { issuePlayerAttack, issuePlayerMoveTo, issuePlayerFlee } from './battle.js';
import { startInteraction, endInteraction, recordPlayerAction } from './pause.js';
import { tutorialAllows } from './tutorial.js';

// rules.md 5 : déroulé d'une commande depuis la rangée « Ordres » de la tour de commandement.
// L'état vit dans `battle.commandSelection` : `null` hors commande, sinon `{ order, unit }`.
// Ordre (met en pause) -> unité du joueur -> cible (ennemi pour `attack`, case pour `move`,
// aucune pour `flee`). Annuler à n'importe quel stade n'émet rien et ne consomme pas le
// cooldown de la fuite.
export const ORDERS = ['move', 'attack', 'flee'];

// Ordres proposés dans cette bataille (`battle.orders`, tous par défaut).
export function availableOrders(battle) {
  return battle.orders ?? ORDERS;
}

function isOpen(battle) {
  return battle.commandSelection !== null;
}

// Un ordre peut être choisi hors drag, hors changement de phase, si le tutoriel le permet et,
// pour Fuir, hors cooldown (rules.md 5.1). Choisir un autre ordre en cours de sélection le
// remplace.
export function canChooseOrder(battle, order) {
  return battle.outcome === 'ongoing'
    && availableOrders(battle).includes(order)
    && battle.pause.interaction !== 'deploy'
    && !battle.phaseTransition
    && tutorialAllows(battle, `order:${order}`)
    && (order !== 'flee' || canFlee(battle.playerFleeState, battle.elapsedSeconds));
}

// Clic sur un ordre : démarre la sélection (pause d'interaction), ou change d'ordre (l'unité
// déjà sélectionnée est oubliée). Re-cliquer l'ordre en cours annule la commande.
export function chooseOrder(battle, order) {
  if (battle.commandSelection?.order === order) {
    cancelCommand(battle);
    return false;
  }
  if (!canChooseOrder(battle, order)) return false;
  startInteraction(battle.pause, 'command');
  battle.commandSelection = { order, unit: null };
  return true;
}

function close(battle) {
  battle.commandSelection = null;
  if (battle.pause.interaction === 'command') endInteraction(battle.pause);
}

export function cancelCommand(battle) {
  if (isOpen(battle)) close(battle);
}

function complete(battle, issued) {
  if (!issued) return false;
  close(battle);
  recordPlayerAction(battle.pause, 'command');
  return true;
}

export function selectUnit(battle, unit) {
  if (!isOpen(battle) || unit.faction !== 'player' || !unit.isOnField) return false;
  const { order } = battle.commandSelection;
  if (!tutorialAllows(battle, `selectUnit:${order}`)) return false;
  battle.commandSelection.unit = unit;
  if (order === 'flee') return complete(battle, issuePlayerFlee(battle, unit));
  return true;
}

function selectedActor(battle) {
  const unit = battle.commandSelection?.unit;
  return unit?.isOnField ? unit : null;
}

export function selectEnemy(battle, enemy) {
  const unit = selectedActor(battle);
  if (!unit || battle.commandSelection.order !== 'attack' || enemy.faction !== 'enemy' || !enemy.isOnField) return false;
  if (!tutorialAllows(battle, 'selectTarget')) return false;
  return complete(battle, issuePlayerAttack(battle, unit, enemy));
}

export function selectCell(battle, x, y) {
  const unit = selectedActor(battle);
  if (!unit || battle.commandSelection.order !== 'move' || !isInsideGrid(battle.grid, x, y)) return false;
  if (!tutorialAllows(battle, 'selectTarget')) return false;
  return complete(battle, issuePlayerMoveTo(battle, unit, x, y));
}

function isInsideGrid(grid, x, y) {
  return x >= 0 && y >= 0 && x < grid.width && y < grid.height;
}

export function unitAt(battle, x, y) {
  return battle.units.find(
    (unit) => unit.isOnField && footprint(unit.x, unit.y, unit.size).some((c) => c.x === x && c.y === y),
  ) ?? null;
}

// Clic sur la case (x, y) du terrain pendant la sélection : aiguille vers la bonne étape.
// Une unité du joueur (re)devient l'unité sélectionnée ; un ennemi ou une case vide sert de
// cible. Un clic invalide pour l'étape en cours est ignoré (la sélection continue).
export function clickField(battle, x, y) {
  if (!isOpen(battle)) return false;
  const clicked = unitAt(battle, x, y);
  if (clicked?.faction === 'player') return selectUnit(battle, clicked);
  if (clicked) return selectEnemy(battle, clicked);
  return selectCell(battle, x, y);
}

// Ce qui est cliquable à l'instant, pour la mise en couleur du terrain (ui-battle-screen-
// decisions.md 3) : `zone` = rectangle de cases valides (ou null), `unitIds` = unités valides.
export function getClickableHighlights(battle) {
  const wholeField = { x: 0, y: 0, width: battle.grid.width, height: battle.grid.height };
  const onField = battle.units.filter((u) => u.isOnField);
  const idsOf = (faction) => new Set(onField.filter((u) => u.faction === faction).map((u) => u.id));

  if (battle.pause.interaction === 'deploy') {
    return { zone: { ...wholeField, width: Math.floor(battle.grid.width / 2) }, unitIds: new Set() };
  }
  if (!isOpen(battle)) return { zone: null, unitIds: new Set() };
  if (!selectedActor(battle)) return { zone: null, unitIds: idsOf('player') };
  return battle.commandSelection.order === 'attack'
    ? { zone: null, unitIds: idsOf('enemy') }
    : { zone: wholeField, unitIds: new Set() };
}
