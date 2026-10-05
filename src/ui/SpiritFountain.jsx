import { useEffect, useState } from 'react';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/8bit/tooltip.jsx';
import {
  FOUNTAIN_MINUTE_MS, fountainCapacity, fountainContent, harvestFountain,
} from '../logic/fountain.js';
import { getFountainLastHarvest, saveFountainLastHarvest } from '../persistence.js';
import { spritePath } from '../data/sprites.js';
import { SpiritStoneIcon } from './SpiritStonesBalance.jsx';
import { TEXT } from './strings.js';

// rules.md 11.8 / GRAPHICS.md : Spirit Fountain de l'accueil, cliquable mais sans cadre de bouton —
// statue de pierre (stone-statue, 2×) et contenu actuel avec l'icône des Spirit Stones, recalculé
// chaque seconde depuis l'heure de la dernière récolte. Un clic récolte :
// `onHarvest(collected)` crédite le solde. Au survol, un tooltip provisoire (sous la fontaine)
// explique ce qu'elle produit ; le déclencheur est un <span> autour du bouton pour qu'il
// s'affiche aussi quand la fontaine est vide (bouton désactivé). Radix exige un TooltipProvider.
export default function SpiritFountain({ playerLevel, onHarvest }) {
  const [now, setNow] = useState(Date.now);
  const [lastHarvest, setLastHarvest] = useState(getFountainLastHarvest);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (lastHarvest === null) return null; // pas encore en route
  const capacity = fountainCapacity(playerLevel);
  const content = fountainContent(lastHarvest, now, capacity);

  const harvest = () => {
    const result = harvestFountain(lastHarvest, Date.now(), capacity);
    if (result.collected === 0) return;
    saveFountainLastHarvest(result.lastHarvestMs);
    setLastHarvest(result.lastHarvestMs);
    onHarvest(result.collected);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <span className="inline-block">
            <button type="button" onClick={harvest} disabled={content === 0} className="retro text-white enabled:cursor-pointer enabled:hover:brightness-125 disabled:opacity-50">
              <span className="flex w-52 flex-col gap-2">
                <img src={spritePath('stone-statue')} alt="" className="pixelated mx-auto h-57.5 w-36" />
                <span className="flex items-center justify-center gap-2 text-xs">
                  <SpiritStoneIcon />
                  {content}
                </span>
              </span>
            </button>
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" font="normal" className="max-w-64 text-center">
          {TEXT.fountainTooltip(FOUNTAIN_MINUTE_MS / 1000)}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
