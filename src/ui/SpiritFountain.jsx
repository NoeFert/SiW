import { useEffect, useRef, useState } from 'react';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/8bit/tooltip.jsx';
import { FOUNTAIN_STONES_PER_MINUTE, fountainCapacity, fountainContent } from '../logic/fountain.js';
import { useProfileStore, harvestSpiritFountain } from '../state/profileStore.js';
import { spritePath } from '../data/sprites.js';
import { SpiritStoneIcon } from './SpiritStonesBalance.jsx';
import { TEXT } from './strings.js';

// Spirit Fountain (rules.md 11.8). Le <span> garde le tooltip quand le bouton est désactivé.
export default function SpiritFountain({ playerLevel, onHarvest }) {
  const [now, setNow] = useState(Date.now);
  const lastHarvest = useProfileStore((profile) => profile.fountainLastHarvest);
  const iconRef = useRef(null);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (lastHarvest === null) return null;
  const capacity = fountainCapacity(playerLevel);
  const content = fountainContent(lastHarvest, now, capacity);

  const harvest = () => {
    const collected = harvestSpiritFountain(capacity);
    if (collected > 0) onHarvest(collected, iconRef.current?.getBoundingClientRect() ?? null);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <span className="inline-block">
            <button type="button" onClick={harvest} disabled={content === 0} className="retro text-white enabled:cursor-pointer enabled:hover:brightness-125">
              <span className="flex w-52 flex-col gap-2">
                <span className="flex items-center justify-center gap-2 text-xs">
                  <span ref={iconRef} className="flex"><SpiritStoneIcon /></span>
                  {content}
                </span>
                <img src={spritePath('stone-statue')} alt="" className="pixelated mx-auto h-28.75 w-18 brightness-75" />
              </span>
            </button>
          </span>
        </TooltipTrigger>
        <TooltipContent side="bottom" font="normal" className="max-w-64 text-center">
          {TEXT.fountainTooltip(FOUNTAIN_STONES_PER_MINUTE)}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
