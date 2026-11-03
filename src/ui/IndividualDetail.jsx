import { Badge } from '@/components/ui/8bit/badge.jsx';
import {
  individualLevel, individualProgress, levelDamage, levelStat,
} from '../logic/levels.js';
import ArrowButton from './ArrowButton.jsx';
import { LevelBadge, XpBar } from './LevelDisplay.jsx';
import SpeciesSprite from './SpeciesSprite.jsx';
import { TEXT, keywordLabels, unitName } from './strings.js';

const T = TEXT.civilization;

function Keywords({ species }) {
  return keywordLabels(species).map((label) => (
    <Badge key={label} variant="secondary" font="normal" className="text-[10px] mx-1.5">
      {label}
    </Badge>
  ));
}

function statRows(species, level) {
  const damage = levelDamage(species.damage, level);
  return [
    [T.stats.hp, levelStat(species.maxHp, level)],
    [T.stats.damage, typeof damage === 'number' ? damage : T.hybridDamage(damage)],
    [T.stats.attackType, T.attackTypes[species.attackType]],
    [T.stats.size, T.size(species.size)],
    [T.stats.moveSpeed, T.moveSpeed(species.moveSpeed)],
    [T.stats.attackSpeed, T.attackSpeed(species.attackSpeed)],
    [T.stats.range, T.range(species.range)],
    [T.stats.cost, TEXT.presenceTag(species.cost)],
  ];
}

// Page de détail d'un individu.
export default function IndividualDetail({
  unit, species, onPrevious, onNext,
}) {
  const level = individualLevel(unit.xp);
  return (
    <div className="relative flex min-h-full items-center justify-center px-16">
      <ArrowButton
        direction="left"
        label={T.previous}
        disabled={!onPrevious}
        onClick={onPrevious}
        className="absolute top-1/2 left-0 -translate-y-1/2"
      />
      <ArrowButton
        direction="right"
        label={T.next}
        disabled={!onNext}
        onClick={onNext}
        className="absolute top-1/2 right-0 -translate-y-1/2"
      />
      <div className="flex w-full max-w-3xl flex-col gap-6 text-sm">
        <div className="flex items-center gap-6">
          <SpeciesSprite species={species} className="size-32" />
          <div className="flex flex-1 flex-col gap-3">
            <span className="retro text-sm">{unitName(species)}</span>
            <div className="flex flex-wrap items-center gap-y-1">
              <LevelBadge level={level} />
              <Keywords species={species} />
            </div>
            <XpBar progress={individualProgress(unit.xp)} />
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-1">
          {statRows(species, level).map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-white/60">{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        {species.abilities && (
          <section className="flex flex-col gap-2">
            <h3 className="retro text-xs">{T.abilities}</h3>
            {species.abilities.map((ability) => (
              <p key={ability.name}>
                <span className="font-bold">{ability.name} : </span>
                {TEXT.abilityDescriptions[ability.name]}
              </p>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
