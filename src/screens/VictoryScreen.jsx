import { Button } from '@/components/ui/8bit/button.jsx';
import { ROSTERS } from '../data/rosters.js';
import { LevelBadge } from '../ui/LevelDisplay.jsx';
import { SpeciesCountRow } from '../ui/SpeciesSprite.jsx';
import RewardRow from '../ui/RewardRow.jsx';
import { TEXT, unitName } from '../ui/strings.js';

// Une ligne du bilan : "8x [sprite] Ver de Lambton". Les unités perdues sont grisées.
// Aussi utilisé par DefeatScreen (pertes d'une défaite de « Partir en guerre »).
// Une liste trop longue pour la fenêtre défile dans sa colonne (REPORT_COLUMN), jamais la page.
export const REPORT_COLUMN = 'pixel-scrollbar flex min-h-0 flex-col gap-2 overflow-y-auto *:shrink-0';
export function ReportList({ title, rows, count, lost }) {
  return (
    <section className={`${REPORT_COLUMN} w-80`}>
      <h2 className="retro text-xs">{title}</h2>
      {rows.map((row) => (
        <SpeciesCountRow
          key={row.species.name}
          count={count(row)}
          species={row.species}
          className={lost ? 'opacity-60 grayscale' : ''}
        >
          <span className="text-sm">{unitName(row.species)}</span>
        </SpeciesCountRow>
      ))}
    </section>
  );
}

// Bilan des pertes : « 8x [sprite] Ver de Lambton » par espèce, ou « Aucune perte ! ».
function LossReport({ rows }) {
  return rows.length > 0
    ? <ReportList title={TEXT.report.lost} rows={rows} count={(row) => row.lost} lost />
    : <p className="retro text-xs">{TEXT.report.noLosses}</p>;
}

// technical.md 5.3 : jeu normal — rangée de récompenses (Spirit Stones : victoire + niveaux du
// joueur, puis XP du joueur), individus qui ont gagné au moins un niveau, regroupés
// (« 2x [sprite] Ver de Lambton niv 1 → 2 », bloc absent s'il n'y en a aucun), puis unités perdues
// (rules.md 11.5 et 11.6). Niveaux gagnés et pertes côte à côte, pour tenir en hauteur.
function ProgressReport({ progress, playerFaction }) {
  const roster = ROSTERS[playerFaction];
  return (
    <>
      <RewardRow spiritStones={progress.spiritStonesGained} xp={progress.xpGained} />
      <div className="flex min-h-0 gap-8">
        {progress.levelUps.length > 0 && (
          <section className={`${REPORT_COLUMN} w-96`}>
            <h2 className="retro text-xs">{TEXT.levels.levelUps}</h2>
            {progress.levelUps.map(({ species, from, to, count }) => (
              <SpeciesCountRow key={`${species}-${from}-${to}`} count={count} species={roster[species]}>
                <span className="flex-1 text-sm">{unitName(roster[species])}</span>
                <LevelBadge level={to} faction={playerFaction} label={TEXT.levels.levelUp(from, to)} />
              </SpeciesCountRow>
            ))}
          </section>
        )}
        <LossReport rows={progress.lost} />
      </div>
    </>
  );
}

// technical.md 5.6 : en version clickbait, `report` (getCasualtyReport) affiche seulement les
// unités perdues, pour faire sentir le poids des pertes. Jeu normal : `progress`
// (resolveVictory) affiche récompenses, niveaux gagnés et pertes (technical.md 5.3).
export default function VictoryScreen({
  onContinue, report, progress, playerFaction,
}) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-6 text-white">
      <h1 className="text-3xl font-bold">Victoire</h1>
      {report && <LossReport rows={report.filter((row) => row.lost > 0)} />}
      {progress && <ProgressReport progress={progress} playerFaction={playerFaction} />}
      <Button onClick={onContinue}>Continuer</Button>
    </div>
  );
}
