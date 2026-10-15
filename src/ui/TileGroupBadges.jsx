import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TEXT } from './strings.js';

// Cases d'unités regroupées (tour de commandement et écran des unités,
// ui-battle-screen-decisions.md 2.2) : nombre d'individus dans un carré en haut à gauche de la
// case (GridPanelInactive du pack), seulement à partir de 2.
export function CountSquare({ count }) {
  if (count < 2) return null;
  return (
    <span className="group-band retro absolute top-0 left-0 flex h-8 min-w-8 items-center justify-center text-[9px] leading-none">
      {count}x
    </span>
  );
}

// Flèche en haut à droite de la première case d'une espèce : regroupe (‹) ou sépare (›) ses
// individus. `className` : position, selon que la flèche est dans la case ou à côté.
export function GroupArrow({ grouped, onToggle, className }) {
  const label = grouped ? TEXT.ungroupSpecies : TEXT.groupSpecies;
  const Icon = grouped ? ChevronRight : ChevronLeft;
  return (
    <button
      type="button"
      // Dans la tour, le clic sur la flèche ne doit pas lancer le drag de la case.
      onPointerDown={(event) => event.stopPropagation()}
      onClick={onToggle}
      aria-label={label}
      title={label}
      className={cn('absolute z-10 cursor-pointer text-white hover:text-yellow-300', className)}
    >
      <Icon className="size-[22.4px]" />
    </button>
  );
}
