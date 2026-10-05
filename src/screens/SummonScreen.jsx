import { useState } from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/8bit/alert-dialog.jsx';
import { Button } from '@/components/ui/8bit/button.jsx';
import { ROSTERS } from '../data/rosters.js';
import { countUnitsBySpecies } from '../logic/ownedUnits.js';
import {
  canSummon, resummonPrice, summon, summonAction, summonPrice,
} from '../logic/summon.js';
import {
  getFallenLegendaryLevel, getOwnedUnits, getSpiritStones, saveOwnedUnits, saveSpiritStones,
} from '../persistence.js';
import CornerDecor from '../ui/CornerDecor.jsx';
import ScreenLayout from '../ui/ScreenLayout.jsx';
import SpeciesSprite from '../ui/SpeciesSprite.jsx';
import SpiritStonesBalance, { SpiritStoneIcon, SpiritStonesAmount } from '../ui/SpiritStonesBalance.jsx';
import { TEXT, unitName } from '../ui/strings.js';

const T = TEXT.summon;

// GRAPHICS.md « Interface » : coins de l'espèce sélectionnée, dans l'accent de la faction du joueur.
const SELECTION_CORNERS = { wyrms: 'gold', undead: 'purple' };

// technical.md 5.1 / rules.md 11.4 : deux colonnes (1/3 – 2/3). À gauche, une ligne par espèce de
// la faction (sprite, nom, prix), sauf un [Légendaire] encore vivant ; un clic la met en avant à
// droite : son sprite en grand au centre et, en bas, le bouton « Invoquer (prix) » (« Réinvoquer
// (prix) » pour un [Légendaire] mort), désactivé si le solde est insuffisant.
// La réinvocation du [Légendaire] passe par une boîte de confirmation où le joueur choisit le
// niveau gardé (de 1 à son niveau à sa mort), avec le prix de chaque niveau ; l'annuler ne
// dépense rien.
export default function SummonScreen({ playerFaction, onBack }) {
  const roster = ROSTERS[playerFaction];
  const [units, setUnits] = useState(() => getOwnedUnits() ?? []);
  const [spiritStones, setSpiritStones] = useState(getSpiritStones);
  const [confirm, setConfirm] = useState(null); // { key, level } : [Légendaire] à réinvoquer
  const [selectedKey, setSelectedKey] = useState(null); // espèce en avant (null : la première)
  const fallenLevel = getFallenLegendaryLevel() ?? 1;
  const owned = countUnitsBySpecies(roster, units);
  // Espèces proposées : toutes sauf un [Légendaire] encore vivant (déjà à vos côtés).
  const available = Object.keys(roster)
    .filter((key) => summonAction(roster[key], owned[key]) !== 'alreadyOwned');

  const doSummon = (key, level = 1) => {
    const result = summon(roster, units, spiritStones, key, level, fallenLevel);
    if (!result) return;
    saveOwnedUnits(result.units);
    saveSpiritStones(result.spiritStones);
    setUnits(result.units);
    setSpiritStones(result.spiritStones);
  };

  const confirmSpecies = confirm && roster[confirm.key];
  const levels = Array.from({ length: fallenLevel }, (_, i) => i + 1);
  // Espèce mise en avant : celle choisie, ou la première proposée (aussi quand le [Légendaire]
  // choisi vient d'être réinvoqué et disparaît de la liste).
  const focusKey = available.includes(selectedKey) ? selectedKey : available[0];
  const selected = roster[focusKey];
  const action = summonAction(selected, owned[focusKey]);
  // Un [Légendaire] mort passe par la confirmation (choix du niveau gardé) ; sinon, invocation directe.
  const summonSelected = () => (action === 'resummon'
    ? setConfirm({ key: focusKey, level: 1 })
    : doSummon(focusKey));

  return (
    <ScreenLayout title={T.title} onBack={onBack}>
      <SpiritStonesBalance amount={spiritStones} />
      <div className="grid h-full grid-cols-3 gap-6">
        {/* Colonne 1 (1/3) : les espèces à invoquer. */}
        <div className="flex flex-col gap-3 overflow-y-auto">
          {available.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedKey(key)}
              className="relative flex items-center gap-4 border-2 border-white/30 bg-black/40 px-4 py-3 text-left hover:border-white/70"
            >
              {key === focusKey && <CornerDecor color={SELECTION_CORNERS[playerFaction]} />}
              <SpeciesSprite species={roster[key]} className="size-20" />
              <span className="flex flex-1 flex-col gap-2 text-sm">
                <span className="text-base font-bold">{unitName(roster[key])}</span>
                <SpiritStonesAmount amount={summonPrice(roster[key])} />
              </span>
            </button>
          ))}
        </div>
        {/* Colonne 2 (2/3) : l'espèce mise en avant, en grand, et son bouton d'invocation. */}
        <div className="col-span-2 flex flex-col items-center gap-6">
          <div className="flex flex-1 items-center justify-center">
            <SpeciesSprite species={selected} className="size-64" />
          </div>
          <Button disabled={!canSummon(selected, owned[focusKey], spiritStones)} onClick={summonSelected}>
            {TEXT.summonActions[action]}
            <span className="inline-flex items-center gap-1">
              (<SpiritStoneIcon />
              {summonPrice(selected)})
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
            <AlertDialogAction onClick={() => doSummon(confirm.key, confirm.level)}>
              {TEXT.summonActions.resummon}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ScreenLayout>
  );
}
