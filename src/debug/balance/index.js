// Outil d'équilibrage (skill /balancer) — `npm run balance -- [options]`. Pas une fonctionnalité
// du jeu : simule des batailles sans Phaser ni localStorage et affiche un tableau par
// configuration (faction × bataille × stratégie × niveau de l'armée).
//
// Options (valeurs multiples séparées par des virgules, `all` pour toutes) :
//   --faction wyrms,undead     faction du joueur (défaut : all)
//   --battle battleStartW01,...  batailles de src/data/battles/ (défaut : celles de la guerre 01)
//   --strategy basics,...      basics, flyers, mixed, legendaryFirst (défaut : all)
//   --level 1,3,5              niveau de toute l'armée de départ (défaut : 1)
//   --army lambtonWorm:5@2,... armée sur mesure (espèce:nombre@niveau) au lieu de la dotation
//   --n 50                     batailles par configuration (défaut : 50)
//   --seed 1                   seed de la première bataille (défaut : 1)
//   --replay                   récompense de rejeu (25 %) au lieu de la première victoire
//   --player-xp 100            XP du joueur avant la bataille (récompenses de niveau ; déf. : 100)
//   --json                     sortie JSON
import { STRATEGIES } from './bot.js';
import { buildArmy, runConfig, starterArmy } from './simulate.js';
import { WAR_BATTLE_IDS } from '../../data/battles/index.js';
import { FACTIONS } from '../../data/factions/index.js';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i].replace(/^--/, '');
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) args[key] = true;
    else { args[key] = next; i++; }
  }
  return args;
}

function list(value, all) {
  if (value === undefined || value === 'all') return all;
  return String(value).split(',');
}

function parseArmy(spec) {
  return spec.split(',').map((part) => {
    const [, species, count, level = '1'] = part.match(/^(\w+):(\d+)(?:@(\d))?$/);
    return { species, count: Number(count), level: Number(level) };
  });
}

const args = parseArgs(process.argv.slice(2));
const n = Number(args.n ?? 50);
const seed = Number(args.seed ?? 1);
const replay = args.replay === true;
const playerXp = Number(args['player-xp'] ?? 100);
const factions = list(args.faction, ['wyrms', 'undead']);
const battles = list(args.battle, WAR_BATTLE_IDS);
const strategies = list(args.strategy, STRATEGIES);
const levels = args.army ? ['custom'] : list(args.level, ['1']).map(Number);

const rows = [];
for (const faction of factions) {
  for (const battleId of battles) {
    for (const strategy of strategies) {
      for (const level of levels) {
        const groups = args.army ? parseArmy(args.army) : starterArmy(faction, level);
        const stats = runConfig({
          faction, battleId, strategy, individuals: buildArmy(groups), replay, playerXp,
        }, n, seed);
        const armyCost = groups.reduce((sum, g) => sum + FACTIONS[faction].roster[g.species].cost * g.count, 0);
        rows.push({ faction, battleId, strategy, level, armyCost, ...stats });
      }
    }
  }
}

if (args.json) {
  console.log(JSON.stringify({ n, seed, replay, playerXp, army: args.army ?? 'starter', rows }, null, 2));
} else {
  const pct = (x) => `${Math.round(x * 100)}%`.padStart(5);
  const num = (x, w = 6, d = 1) => x.toFixed(d).padStart(w);
  console.log(`N = ${n} par configuration, seeds ${seed}..${seed + n - 1}, ${replay ? 'rejeu (25 %)' : 'première victoire'}, XP joueur avant : ${playerXp}, armée : ${args.army ?? 'dotation de départ'}`);
  console.log('faction  bataille  stratégie       niv |   vic   déf   nul  bloq | durée(s) zone | dépl.  morts  PP perdus  réinvoc. | XP/surv  niv+  XPjoueur  SS gagnées  SS nettes');
  for (const r of rows) {
    console.log(
      `${r.faction.padEnd(8)} ${r.battleId.padEnd(9)} ${r.strategy.padEnd(15)} ${String(r.level).padStart(3)} |`
      + `${pct(r.win)} ${pct(r.loss)} ${pct(r.draw)} ${pct(r.stuck)} |`
      + `${num(r.seconds, 8)} ${num(r.phasesReached, 4)} |`
      + `${num(r.deployed, 6)} ${num(r.dead, 6)} ${num(r.ppLost, 10)} ${num(r.rebuyCost, 9)} |`
      + `${num(r.xpPerSurvivor, 8)} ${num(r.levelUps, 5)} ${num(r.playerXp, 9)} ${num(r.spiritStones, 11)} ${num(r.netStones, 10)}`,
    );
  }
  // rules.md 11.7 : cible de difficulté = pertes en victoire, en % des PP de l'armée.
  console.log('\nPertes en victoire (% des PP de l\'armée) :');
  for (const r of rows) {
    console.log(`${r.faction.padEnd(8)} ${r.battleId.padEnd(9)} ${r.strategy.padEnd(15)} ${String(r.level).padStart(3)} | ${(100 * r.ppLostWins / r.armyCost).toFixed(1)} %`);
  }
  console.log('\nXP moyenne par survivant déployé, par espèce (victoires) :');
  for (const r of rows) {
    const bySpecies = Object.entries(r.xpPerSurvivorBySpecies).map(([s, xp]) => `${s} ${xp.toFixed(1)}`).join(', ');
    console.log(`${r.faction.padEnd(8)} ${r.battleId.padEnd(9)} ${r.strategy.padEnd(15)} ${String(r.level).padStart(3)} | ${bySpecies}`);
  }
}
