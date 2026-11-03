import { Button } from '@/components/ui/8bit/button.jsx';
import { FACTIONS } from '../data/factions/index.js';
import { LevelBadge } from '../ui/LevelDisplay.jsx';
import { SpeciesCountRow } from '../ui/SpeciesSprite.jsx';
import RewardRow from '../ui/RewardRow.jsx';
import { TEXT, unitName } from '../ui/strings.js';

// Ligne du bilan, aussi utilisée par DefeatScreen.
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

function LossReport({ rows }) {
  return rows.length > 0
    ? <ReportList title={TEXT.report.lost} rows={rows} count={(row) => row.lost} lost />
    : <p className="retro text-xs">{TEXT.report.noLosses}</p>;
}

function ProgressReport({ progress, playerFaction }) {
  const roster = FACTIONS[playerFaction].roster;
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
                <LevelBadge level={to} label={TEXT.levels.levelUp(from, to)} />
              </SpeciesCountRow>
            ))}
          </section>
        )}
        <LossReport rows={progress.lost} />
      </div>
    </>
  );
}

export default function VictoryScreen({ onContinue, progress, playerFaction }) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-6 text-white">
      <h1 className="text-3xl font-bold">Victoire</h1>
      <ProgressReport progress={progress} playerFaction={playerFaction} />
      <Button onClick={onContinue}>Continuer</Button>
    </div>
  );
}
