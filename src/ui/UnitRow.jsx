import { forwardRef } from 'react';
import { Badge } from '@/components/ui/8bit/badge.jsx';
import { cn } from '@/lib/utils';
import { isLegendary } from '../logic/ownedUnits.js';
import {
  FACTION_COLORS, woundedHpColor, cssColor,
} from '../renderConstants.js';
import CornerDecor from './CornerDecor.jsx';
import SpeciesSprite from './SpeciesSprite.jsx';
import { CountSquare, GroupArrow } from './TileGroupBadges.jsx';
import { TEXT } from './strings.js';

// Niveau dans la couleur de la faction du joueur (classes littérales pour Tailwind).
const LEVEL_TEXT_CLASS = {
  wyrms: 'text-faction-wyrms',
  undead: 'text-faction-undead',
};

// ui-battle-screen-decisions.md 2.2 : case d'une ligne de la tour, deux par rangée. Même
// panneau que les cases de CivilizationScreen (PanelLarge, doré avec coins pour un
// [Légendaire]) ; le nombre de copies dans un carré en haut à gauche (« 8x »), seulement à partir de 2. Puis : sprite (+ mini
// barre de vie si blessé), PV et niveau (jeu normal seulement, rien en clickbait), tag de
// présence ; ni nom ni keywords (consultables dans l'écran de civilisation). Sur la première
// case d'une espèce à plusieurs lignes, une flèche en haut à droite la regroupe / dégroupe
// (`onToggleGroup`, voir groupTowerRows). forwardRef : sert de déclencheur au tooltip "budget insuffisant"
// (DeploymentList).
const UnitRow = forwardRef(({
  row, playerFaction, onToggleGroup, className, ...props
}, ref) => {
  const ratio = row.hp / row.maxHp;
  const legendary = isLegendary(row.species);
  return (
    <div
      ref={ref}
      // Repère de la main du tutoriel : l'unité basique de la faction (Lambton / Skeleton).
      data-tutorial={row.keywords.length === 0 ? 'basic-unit' : undefined}
      {...props}
      className={cn(
        'pixel-card relative flex flex-col items-center gap-1.5 pt-3 text-center text-[10px] select-none touch-none',
        legendary && 'pixel-card-gold',
        row.deployable ? 'cursor-grab hover:brightness-125' : 'opacity-40 grayscale cursor-not-allowed',
        className,
      )}
    >
      <CountSquare count={row.count} />
      {legendary && <CornerDecor color="gold" />}
      {row.speciesHead && row.groupable && (
        <GroupArrow grouped={row.grouped} onToggle={onToggleGroup} className="-top-1 -right-1" />
      )}

      <SpeciesSprite species={row.species} className="size-12" />
      {row.wounded && (
        <div className="w-10 h-1.5 bg-black">
          <div className="h-full" style={{ width: `${ratio * 100}%`, background: cssColor(FACTION_COLORS[playerFaction]) }} />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
        <span>
          ♥ <span style={row.wounded ? { color: cssColor(woundedHpColor(ratio)) } : undefined}>{row.hp}</span>/{row.maxHp}
        </span>
        {row.showLevel && <span className={LEVEL_TEXT_CLASS[playerFaction]}>{TEXT.levels.range(row.minLevel, row.maxLevel)}</span>}
      </div>
      <Badge data-tutorial="presence-tag" className="text-[10px] mx-1.5">{TEXT.presenceTag(row.cost)}</Badge>
    </div>
  );
});

export default UnitRow;
