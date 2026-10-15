import Grid, { parseObstacleMap } from './grid.js';
import { createBattle } from './battle.js';
import { setUpcomingPhases } from './phases.js';
import { startTutorial } from './tutorial.js';
import { ROSTERS } from '../data/rosters.js';

// rules.md 9 : l'IA joue toujours la faction que le joueur n'a pas choisie.
export function opposingFaction(faction) {
  return faction === 'wyrms' ? 'undead' : 'wyrms';
}

// Phases d'une bataille (src/data/battles/) telles que les utilisent le moteur et l'affichage :
// le plan de chaque zone converti en liste d'obstacles, et le script de l'IA de sa faction.
export function resolvePhases(definition, enemyFaction) {
  return definition.phases.map(({ background, obstacles, enemyScripts }) => ({
    background,
    obstacles: parseObstacleMap(obstacles),
    enemyScript: enemyScripts[enemyFaction],
  }));
}

// Prépare une bataille du jeu à partir de sa définition (src/data/battles/) : grille de la
// première zone, rosters des deux factions, réserve du joueur faite de ses individus
// (`playerUnits`, rules.md 2), phases suivantes (rules.md 7.3) et tutoriel (technical.md 5.5).
// `rng` : source d'aléa de l'IA ; `withTutorial` : false pour les simulations sans joueur
// humain (outil d'équilibrage), qui ne cliqueraient jamais sur « Continuer ».
export function createBattleFromDefinition(definition, playerFaction, playerUnits, {
  rng = Math.random, withTutorial = true,
} = {}) {
  const enemyFaction = opposingFaction(playerFaction);
  const [firstPhase, ...nextPhases] = resolvePhases(definition, enemyFaction);
  const map = definition.phases[0].obstacles;
  const grid = new Grid(map[0].length, map.length, firstPhase.obstacles);

  const battle = createBattle(
    grid, ROSTERS[playerFaction], ROSTERS[enemyFaction], firstPhase.enemyScript, rng, playerUnits,
  );
  setUpcomingPhases(battle, nextPhases);
  if (withTutorial && definition.tutorial) startTutorial(battle, definition.tutorial);
  return battle;
}
