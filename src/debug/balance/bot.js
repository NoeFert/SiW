// Outil d'équilibrage (skill /balancer) : bot joueur passif. Pas une fonctionnalité du jeu.
// Il déploie dès que le plafond de 150 PP le permet (rules.md 2), selon un ordre de priorité
// d'espèces, et ne donne jamais d'ordre (ni focus, ni fuite) : une borne basse de ce qu'un
// humain obtient.
import { deployPlayerUnit } from '../../logic/battles/playerActions.js';
import {
  getPresenceUsed, isValidDeploymentPosition, playerDeploymentColumns, PRESENCE_CAP,
} from '../../logic/battles/deployment.js';

export const STRATEGIES = ['basics', 'flyers', 'mixed', 'legendaryFirst'];

// Rôles d'une espèce dans son roster : basique, [Vol] non légendaire, [Légendaire].
function roleOf(species) {
  if (species.keywords.includes('legendary')) return 'legendary';
  if (species.keywords.includes('flying')) return 'flyer';
  return 'basic';
}

// Ordre de priorité des rôles pour le prochain déploiement. `deployedCount` : déploiements
// déjà faits par le bot (alternance de `mixed`).
function priorities(strategy, deployedCount) {
  const alternate = deployedCount % 2 === 0 ? ['basic', 'flyer'] : ['flyer', 'basic'];
  switch (strategy) {
    case 'basics': return ['basic', 'flyer', 'legendary'];
    case 'flyers': return ['flyer', 'basic', 'legendary'];
    case 'mixed': return [...alternate, 'legendary'];
    case 'legendaryFirst': return ['legendary', ...alternate];
    default: throw new Error(`Stratégie inconnue : ${strategy}`);
  }
}

function hasCopy(battle, species) {
  const state = battle.playerDeployment.bySpecies.get(species);
  return state.freshRemaining > 0 || state.returning.length > 0;
}

// Case de déploiement : la colonne la plus avancée de la zone de déploiement, puis la rangée la
// plus proche du centre. Déterministe, pour que seul le seed de l'IA fasse varier les batailles.
function deploymentPosition(battle, species, unitsOnField) {
  const { grid } = battle;
  const center = (grid.height - species.size) / 2;
  const rows = Array.from({ length: grid.height - species.size + 1 }, (_, y) => y)
    .sort((a, b) => Math.abs(a - center) - Math.abs(b - center) || a - b);
  for (let x = playerDeploymentColumns(grid) - species.size; x >= 0; x--) {
    for (const y of rows) {
      if (isValidDeploymentPosition(grid, 'player', species, x, y, unitsOnField)) return { x, y };
    }
  }
  return null;
}

// Déploie autant d'unités que le plafond le permet. `bot` : { strategy, deployedCount }.
export function botDeploy(battle, bot) {
  for (;;) {
    const unitsOnField = battle.units.filter((u) => u.isOnField);
    const budget = PRESENCE_CAP - getPresenceUsed('player', unitsOnField);
    const legendaryOnField = unitsOnField.some((u) => u.faction === 'player' && u.isLegendary);
    const species = priorities(bot.strategy, bot.deployedCount)
      .flatMap((role) => [...battle.playerDeployment.bySpecies.keys()].filter((s) => roleOf(s) === role))
      .find((s) => s.cost <= budget && hasCopy(battle, s) && !(roleOf(s) === 'legendary' && legendaryOnField));
    if (!species) return;
    const position = deploymentPosition(battle, species, unitsOnField);
    if (!position) return;
    const result = deployPlayerUnit(battle, species, position.x, position.y);
    if (!result.success) return;
    bot.deployedCount += 1;
  }
}
