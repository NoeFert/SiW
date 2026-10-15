// Outil d'équilibrage (skill /balancer) : joue des batailles sans Phaser avec le moteur de
// src/logic/ et le bot de bot.js, puis mesure leur issue avec la logique méta du jeu
// (resolveVictory, résolution des pertes). Ne lit ni n'écrit aucune sauvegarde.
import { tickBattle } from '../../logic/battle.js';
import { createBattleFromDefinition } from '../../logic/battleSetup.js';
import { individualXpForLevel, individualXpGains } from '../../logic/levels.js';
import { createArmy } from '../../logic/army.js';
import { resolveVictory } from '../../logic/victory.js';
import { victoryReward } from '../../logic/war.js';
import { summonPrice } from '../../logic/summon.js';
import { BATTLES } from '../../data/battles/index.js';
import { ROSTERS } from '../../data/rosters.js';
import { botDeploy } from './bot.js';

export const TICK_SECONDS = 0.05;
// Au-delà, la bataille est comptée « bloquée » (IA ou bot coincés) plutôt que d'attendre.
export const MAX_BATTLE_SECONDS = 900;

// Générateur pseudo-aléatoire déterministe (mulberry32), pour des chiffres comparables d'une
// session à l'autre : la bataille i d'une configuration utilise le seed `seed + i`.
export function seededRng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Armée d'individus { id, species, xp } à partir de [{ species, count, level }].
export function buildArmy(groups) {
  return groups.flatMap(({ species, count, level }) => Array.from({ length: count }, (_, i) => ({
    id: `${species}-L${level}-${i}`, species, xp: individualXpForLevel(level),
  })));
}

// Dotation de départ de la faction (units.md), toute au même niveau.
export function starterArmy(faction, level) {
  return Object.entries(ROSTERS[faction]).map(([species, def]) => ({ species, count: def.copies, level }));
}

// Une bataille complète. `config` : { faction, battleId, strategy, individuals, seed, replay,
// playerXp }. Renvoie l'issue et ses mesures.
export function runBattle({ faction, battleId, strategy, individuals, seed, replay = false, playerXp = 0 }) {
  const roster = ROSTERS[faction];
  const definition = BATTLES[battleId];
  // Pas de tutoriel : le bot ne cliquerait jamais sur « Continuer ».
  const battle = createBattleFromDefinition(definition, faction, individuals, {
    rng: seededRng(seed), withTutorial: false,
  });

  const bot = { strategy, deployedCount: 0 };
  while (battle.outcome === 'ongoing' && battle.elapsedSeconds < MAX_BATTLE_SECONDS) {
    if (!battle.phaseTransition) botDeploy(battle, bot);
    tickBattle(battle, TICK_SECONDS);
  }
  const outcome = battle.outcome === 'ongoing' ? 'stuck' : battle.outcome;

  const { gains, dead } = individualXpGains(battle.units, replay);
  const deadUnits = individuals.filter((unit) => dead.has(unit.id));
  const ppLost = deadUnits.reduce((sum, unit) => sum + roster[unit.species].cost, 0);
  // Prix pour remplacer les pertes par des individus niveau 1 (le niveau des morts est perdu).
  const rebuyCost = deadUnits.reduce((sum, unit) => sum + summonPrice(roster[unit.species]), 0);

  const result = {
    outcome,
    seconds: battle.elapsedSeconds,
    phasesReached: battle.phaseIndex + 1,
    deployed: new Set(battle.units.filter((u) => u.faction === 'player').map((u) => u.individualId)).size,
    dead: deadUnits.length,
    ppLost,
    rebuyCost,
    survivorXp: 0,
    survivors: 0,
    levelUps: 0,
    playerXp: 0,
    spiritStones: 0,
  };
  if (outcome !== 'playerVictory') return result;

  const save = {
    units: individuals, army: createArmy('Balance', individuals), playerXp, spiritStones: 0, fallenLegendaryLevel: 1,
  };
  const { report } = resolveVictory(save, battle.units, roster, {
    tutoBattle: battleId === 'battleTuto', reward: victoryReward(definition.reward, replay), replay,
  });
  // XP des survivants déployés, par espèce : { species: { xp, survivors } }.
  const xpBySpecies = {};
  for (const unit of individuals) {
    if (!gains.has(unit.id)) continue;
    const entry = xpBySpecies[unit.species] ?? { xp: 0, survivors: 0 };
    entry.xp += gains.get(unit.id);
    entry.survivors += 1;
    xpBySpecies[unit.species] = entry;
  }
  return {
    ...result,
    xpBySpecies,
    survivorXp: [...gains.values()].reduce((sum, xp) => sum + xp, 0),
    survivors: gains.size,
    levelUps: report.levelUps.reduce((sum, group) => sum + group.count, 0),
    playerXp: report.xpGained,
    spiritStones: report.spiritStonesGained,
  };
}

// N batailles d'une configuration (seeds `seed` à `seed + n - 1`), moyennées.
export function runConfig(config, n, seed) {
  const runs = Array.from({ length: n }, (_, i) => runBattle({ ...config, seed: seed + i }));
  const rate = (outcome) => runs.filter((run) => run.outcome === outcome).length / n;
  const mean = (list, key) => (list.length ? list.reduce((sum, run) => sum + run[key], 0) / list.length : 0);
  const wins = runs.filter((run) => run.outcome === 'playerVictory');
  return {
    win: rate('playerVictory'),
    loss: rate('enemyVictory'),
    draw: rate('draw'),
    stuck: rate('stuck'),
    seconds: mean(runs, 'seconds'),
    phasesReached: mean(runs, 'phasesReached'),
    deployed: mean(runs, 'deployed'),
    dead: mean(runs, 'dead'),
    ppLost: mean(runs, 'ppLost'),
    rebuyCost: mean(runs, 'rebuyCost'),
    // Mesures de victoire : moyennes sur les victoires seulement.
    xpPerSurvivor: wins.length ? wins.reduce((s, r) => s + r.survivorXp, 0) / Math.max(1, wins.reduce((s, r) => s + r.survivors, 0)) : 0,
    // XP moyenne par survivant déployé de chaque espèce, sur les victoires.
    xpPerSurvivorBySpecies: Object.fromEntries(Object.keys(ROSTERS[config.faction]).map((species) => {
      const entries = wins.map((run) => run.xpBySpecies[species]).filter(Boolean);
      const survivors = entries.reduce((s, e) => s + e.survivors, 0);
      return [species, survivors ? entries.reduce((s, e) => s + e.xp, 0) / survivors : 0];
    })),
    // rules.md 11.7 (difficulté selon la distance au boss) : pertes mesurées en victoire seulement.
    ppLostWins: mean(wins, 'ppLost'),
    levelUps: mean(wins, 'levelUps'),
    playerXp: mean(wins, 'playerXp'),
    spiritStones: mean(wins, 'spiritStones'),
    // Solde net moyen d'une tentative : Spirit Stones gagnées − prix de remplacement des pertes.
    netStones: mean(runs, 'spiritStones') - mean(runs, 'rebuyCost'),
  };
}
