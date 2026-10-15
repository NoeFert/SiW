import { WYRMS_ROSTER } from './wyrmsRoster.js';
import { UNDEAD_ROSTER } from './undeadRoster.js';

// rules.md 7.1 — timing en temps absolu depuis le début de la bataille, une seule bataille
// scriptée en v1, script symétrique selon la faction jouée par l'IA. Pas de case ici : elle est
// choisie au moment du déploiement selon la situation du terrain (rules.md 7.2, aiScript.js).
// Une vague de plusieurs unités = plusieurs entrées au même instant.

// IA jouant les Wyrms — coût total 175, limité par le plafond simultané de 150 (rules.md 7.1).
export const WYRMS_AI_SCRIPT = [
  { time: 0, species: WYRMS_ROSTER.lambtonWorm },
  { time: 8, species: WYRMS_ROSTER.amphiptere },
  { time: 20, species: WYRMS_ROSTER.lambtonWorm },
  { time: 28, species: WYRMS_ROSTER.lambtonWorm },
  { time: 28, species: WYRMS_ROSTER.lambtonWorm },
  { time: 35, species: WYRMS_ROSTER.fafnir },
];

// rules.md 11.7 : scripts propres à « Partir en guerre » (provisoires), indépendants de celui de la
// bataille 01. Instants comptés depuis le début de chaque zone. Calibrés pour la difficulté selon
// la distance au boss (pertes visées, vérifiées avec `npm run balance`).
// `waves` : [instant, espèce, nombre] → une entrée par unité, comme les scripts ci-dessus.
function waves(...list) {
  return list.flatMap(([time, species, count]) => Array.from({ length: count }, () => ({ time, species })));
}

const W = WYRMS_ROSTER;
const U = UNDEAD_ROSTER;

// Bataille 1 — le champ, puis « Le mur ».
export const WAR1_FIELD_SCRIPTS = {
  wyrms: waves([0, W.lambtonWorm, 1], [4, W.amphiptere, 1], [10, W.lambtonWorm, 1], [14, W.lambtonWorm, 3]),
  undead: waves(
    [0, U.newRebornSkeleton, 1], [4, U.necromantInitiate, 1], [10, U.newRebornSkeleton, 1],
    [14, U.newRebornSkeleton, 3], [18, U.newRebornSkeleton, 2],
  ),
};

export const WAR1_WALL_SCRIPTS = {
  wyrms: waves([0, W.lambtonWorm, 2], [5, W.amphiptere, 1], [12, W.lambtonWorm, 2]),
  undead: waves(
    [0, U.newRebornSkeleton, 2], [5, U.necromantInitiate, 1], [12, U.newRebornSkeleton, 3],
    [18, U.newRebornSkeleton, 2],
  ),
};

// Bataille 2 — « Le mur » puis « Les trois couloirs », même script ; repris pour « Les trois
// couloirs » de la bataille 3.
export const WAR2_SCRIPTS = {
  wyrms: waves([0, W.lambtonWorm, 3], [5, W.amphiptere, 1], [12, W.lambtonWorm, 2]),
  undead: waves(
    [0, U.newRebornSkeleton, 3], [5, U.necromantInitiate, 1], [12, U.newRebornSkeleton, 3],
    [18, U.newRebornSkeleton, 3],
  ),
};

// Bataille 3 — « Le fort » (le [Légendaire] attend sous le plafond de 150, rules.md 7.1).
export const WAR3_FORT_SCRIPTS = {
  wyrms: waves([0, W.lambtonWorm, 4], [10, W.fafnir, 1]),
  undead: waves(
    [0, U.newRebornSkeleton, 6], [10, U.necromantInitiate, 3], [15, U.newRebornSkeleton, 3],
    [20, U.athos, 1],
  ),
};

// IA jouant les Morts-Vivants — coût total 159, limité par le plafond simultané de 150 (rules.md 7.1).
export const UNDEAD_AI_SCRIPT = [
  { time: 0, species: UNDEAD_ROSTER.newRebornSkeleton },
  { time: 8, species: UNDEAD_ROSTER.necromantInitiate },
  { time: 20, species: UNDEAD_ROSTER.newRebornSkeleton },
  { time: 28, species: UNDEAD_ROSTER.newRebornSkeleton },
  { time: 28, species: UNDEAD_ROSTER.newRebornSkeleton },
  { time: 35, species: UNDEAD_ROSTER.athos },
];
