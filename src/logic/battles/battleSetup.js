import Grid, { parseObstacleMap } from './grid.js';
import { createBattle } from './battle.js';
import { setUpcomingPhases } from './phases.js';
import { startTutorial } from './tutorial.js';
import { FACTIONS } from '../../data/factions/index.js';

export function opposingFaction(faction) {
  return faction === 'wyrms' ? 'undead' : 'wyrms';
}

export function resolvePhases(definition, enemyFaction) {
  return definition.phases.map(({ background, obstacles, enemyScripts }) => ({
    background,
    obstacles: parseObstacleMap(obstacles),
    enemyScript: enemyScripts[enemyFaction],
  }));
}

// `withTutorial` : false pour les simulations.
export function createBattleFromDefinition(definition, playerFaction, playerUnits, {
  rng = Math.random, withTutorial = true,
} = {}) {
  const enemyFaction = opposingFaction(playerFaction);
  const [firstPhase, ...nextPhases] = resolvePhases(definition, enemyFaction);
  const map = definition.phases[0].obstacles;
  const grid = new Grid(map[0].length, map.length, firstPhase.obstacles);

  const battle = createBattle(
    grid, FACTIONS[playerFaction], FACTIONS[enemyFaction], firstPhase.enemyScript, rng, playerUnits,
  );
  setUpcomingPhases(battle, nextPhases);
  if (withTutorial && definition.tutorial) startTutorial(battle, definition.tutorial);
  return battle;
}
