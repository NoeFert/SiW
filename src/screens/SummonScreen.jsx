import { useState } from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/8bit/alert-dialog.jsx';
import { Button } from '@/components/ui/8bit/button.jsx';
import { FACTIONS } from '../data/factions/index.js';
import { countUnitsBySpecies } from '../logic/ownedUnits.js';
import {
  canSummon, maxSummonCount, resummonPrice, summonAction, summonPrice,
} from '../logic/summon.js';
import { useProfileStore, summonUnits, resummonLegendary } from '../state/profileStore.js';
import CornerDecor from '../ui/CornerDecor.jsx';
import ScreenLayout from '../ui/ScreenLayout.jsx';
import SpeciesSprite from '../ui/SpeciesSprite.jsx';
import SpiritStonesBalance, { SpiritStoneIcon, SpiritStonesAmount } from '../ui/SpiritStonesBalance.jsx';
import { TEXT, unitName } from '../ui/strings.js';

const T = TEXT.summon;

// Écran d'invocation (rules.md 11.4).
export default function SummonScreen({ playerFaction, onBack, onSummoned }) {
  const roster = FACTIONS[playerFaction].roster;
  const units = useProfileStore((profile) => profile.units);
  const spiritStones = useProfileStore((profile) => profile.spiritStones);
  const [confirm, setConfirm] = useState(null); // [Légendaire] à réinvoquer
  const [selectedKey, setSelectedKey] = useState(null); // null : la première
  const [count, setCount] = useState(1);
  const fallenLevel = useProfileStore((profile) => profile.fallenLegendaryLevel) ?? 1;
  const owned = countUnitsBySpecies(roster, units);
  const available = Object.keys(roster)
    .filter((key) => summonAction(roster[key], owned[key]) !== 'alreadyOwned');

  const afterSummon = (summoned) => {
    if (!summoned) return;
    setCount(1);
    onSummoned();
  };
  const selectSpecies = (key) => {
    setSelectedKey(key);
    setCount(1);
  };

  const confirmSpecies = confirm && roster[confirm.key];
  const levels = Array.from({ length: fallenLevel }, (_, i) => i + 1);
  const focusKey = available.includes(selectedKey) ? selectedKey : available[0];
  const selected = roster[focusKey];
  const action = summonAction(selected, owned[focusKey]);
  const multiple = action === 'summon';
  const maxCount = maxSummonCount(selected, spiritStones);
  const quantity = multiple ? Math.max(1, Math.min(count, maxCount)) : 1;
  const summonSelected = () => (action === 'resummon'
    ? setConfirm({ key: focusKey, level: 1 })
    : afterSummon(summonUnits(focusKey, quantity)));

  return (
    <ScreenLayout title={T.title} onBack={onBack}>
      <div className="absolute top-0 right-0">
        <SpiritStonesBalance amount={spiritStones} />
      </div>
      <div className="grid h-full grid-cols-3 gap-6">
        <div className="flex flex-col gap-3 overflow-y-auto">
          {available.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => selectSpecies(key)}
              className="pixel-card relative flex items-center gap-4 px-4 py-3 text-left hover:brightness-125"
            >
              {key === focusKey && <CornerDecor color={FACTIONS[playerFaction].uiColor} />}
              <SpeciesSprite species={roster[key]} className="size-20" />
              <span className="flex flex-1 flex-col gap-2 text-sm">
                <span className="text-base font-bold">{unitName(roster[key])}</span>
                <SpiritStonesAmount amount={summonPrice(roster[key])} />
              </span>
            </button>
          ))}
        </div>
        <div className="col-span-2 flex flex-col items-center gap-6">
          <div className="flex flex-1 items-center justify-center">
            <SpeciesSprite species={selected} className="size-64" />
          </div>
          {multiple && (
            <div className="flex items-center gap-4">
              <Button size="icon" disabled={quantity <= 1} onClick={() => setCount(quantity - 1)} aria-label={T.less}>−</Button>
              <span className="retro w-10 text-center text-sm">{quantity}</span>
              <Button size="icon" disabled={quantity >= maxCount} onClick={() => setCount(quantity + 1)} aria-label={T.more}>+</Button>
            </div>
          )}
          <Button disabled={!canSummon(selected, owned[focusKey], spiritStones)} onClick={summonSelected}>
            {TEXT.summonActions[action]}
            <span className="inline-flex items-center gap-1">
              (<SpiritStoneIcon />
              {summonPrice(selected) * quantity})
            </span>
          </Button>
        </div>
      </div>

      <AlertDialog open={confirm !== null} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm && T.confirmResummon(
                unitName(confirmSpecies),
                confirm.level,
                resummonPrice(confirmSpecies, confirm.level),
              )}
            </AlertDialogTitle>
            {confirm && fallenLevel > 1 && (
              <AlertDialogDescription asChild>
                <div className="flex flex-col gap-3">
                  <span>{T.keptLevel}</span>
                  <div className="flex flex-wrap gap-2">
                    {levels.map((level) => (
                      <Button
                        key={level}
                        size="sm"
                        variant={confirm.level === level ? 'default' : 'secondary'}
                        disabled={!canSummon(confirmSpecies, 0, spiritStones, level, fallenLevel)}
                        onClick={() => setConfirm({ ...confirm, level })}
                      >
                        {T.levelPrice(level, resummonPrice(confirmSpecies, level))}
                      </Button>
                    ))}
                  </div>
                </div>
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{TEXT.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={() => afterSummon(resummonLegendary(confirm.key, confirm.level))}>
              {TEXT.summonActions.resummon}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ScreenLayout>
  );
}
