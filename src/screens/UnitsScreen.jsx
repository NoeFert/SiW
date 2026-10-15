import { useState } from 'react';
import { Button } from '@/components/ui/8bit/button.jsx';
import { FACTIONS } from '../data/factions/index.js';
import { levelGroups, speciesTiles } from '../logic/army.js';
import { sortByLevel } from '../logic/levels.js';
import { isLegendary } from '../logic/ownedUnits.js';
import { summonAction } from '../logic/summon.js';
import { useProfileStore } from '../state/profileStore.js';
import CornerDecor from '../ui/CornerDecor.jsx';
import IndividualDetail from '../ui/IndividualDetail.jsx';
import ScreenLayout from '../ui/ScreenLayout.jsx';
import SpeciesSprite from '../ui/SpeciesSprite.jsx';
import { CountSquare, GroupArrow } from '../ui/TileGroupBadges.jsx';
import { TEXT, unitName } from '../ui/strings.js';

// GRAPHICS.md « Interface » : la case d'une espèce [Légendaire] a un panneau doré
// (Gold/PanelLarge) et des coins dorés (Decorators/Gold/BorderC).
const legendaryClass = (species) => (isLegendary(species) ? 'pixel-card-gold' : '');

function LegendaryCorners({ species }) {
  return isLegendary(species) ? <CornerDecor color="gold" /> : null;
}

// Case carrée d'une espèce regroupée, ou d'un groupe d'individus strictement identiques si
// l'espèce est dégroupée (même espèce, même niveau ; voir speciesTiles et la tour de
// commandement ; panneau PanelLarge) : sprite, puis nom et niveau (tranche « niv 1-5 » pour une
// case qui regroupe plusieurs niveaux). Nombre d'individus dans un carré en haut à gauche (à
// partir de 2). `grouping` ({ grouped, onToggle }, première case d'une espèce à plusieurs niveaux
// seulement) : flèche en haut à droite qui regroupe / sépare l'espèce — hors du <button> de la
// case (pas de bouton dans un bouton). Clic -> page de détail du premier individu de la case
// (le plus avancé).
function UnitTile({
  tile, species, grouping, onSelect,
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onSelect}
        className={`pixel-card relative flex aspect-square w-full flex-col items-center justify-center gap-2 text-[10px] hover:brightness-125 ${legendaryClass(species)}`}
      >
        <CountSquare count={tile.unitIds.length} />
        <LegendaryCorners species={species} />
        <SpeciesSprite species={species} className="size-14" />
        <span className="flex flex-col items-center gap-1 text-center leading-tight">
          <span>{unitName(species)}</span>
          <span className="retro text-faction">{TEXT.levels.range(tile.minLevel, tile.maxLevel)}</span>
        </span>
      </button>
      {grouping && <GroupArrow grouped={grouping.grouped} onToggle={grouping.onToggle} className="top-1 right-1" />}
    </div>
  );
}

// Case d'une espèce sans individu (ex : [Légendaire] mort) : grisée, avec son bouton Invoquer /
// Réinvoquer (rules.md 11.4).
function EmptySpeciesTile({ species, onSummon }) {
  return (
    <div className={`pixel-card relative flex aspect-square flex-col items-center justify-center gap-2 text-[10px] ${legendaryClass(species)}`}>
      <LegendaryCorners species={species} />
      <SpeciesSprite species={species} className="size-14 opacity-50 grayscale" />
      <span className="text-center leading-tight text-white/50">{unitName(species)}</span>
      <Button size="sm" onClick={onSummon} className="px-1 text-[10px]">
        {TEXT.summonActions[summonAction(species, 0)]}
      </Button>
    </div>
  );
}

// technical.md 5.1 : les unités de la civilisation (écran titré du nom de la faction), ouvert
// depuis l'accueil. Grille de cases carrées, une par groupe d'individus strictement identiques,
// individus triés par niveau puis XP décroissants ; clic -> page de détail de son premier
// individu, puis flèches d'un individu à l'autre. Une espèce à 0 garde une case grisée avec son
// bouton Invoquer / Réinvoquer (`onOpenSummon`).
export default function UnitsScreen({ playerFaction, onBack, onOpenSummon }) {
  const [selectedId, setSelectedId] = useState(null); // individu affiché en détail
  // Espèces dégroupées dans la grille (toutes regroupées par défaut, rien n'est sauvegardé),
  // comme dans la tour de commandement.
  const [ungroupedSpecies, setUngroupedSpecies] = useState(() => new Set());
  const units = useProfileStore((profile) => profile.units);
  const { roster } = FACTIONS[playerFaction];
  const speciesUnits = (key) => sortByLevel(units.filter((unit) => unit.species === key));

  const selected = units.find((unit) => unit.id === selectedId);
  // Tous les individus, dans l'ordre de la grille (roster, puis niveaux décroissants, puis XP
  // décroissante dans un groupe) : ordre de navigation de la page de détail.
  const gridOrder = Object.keys(roster)
    .flatMap((key) => levelGroups(speciesUnits(key)).flatMap((group) => group.unitIds));
  const selectedIndex = gridOrder.indexOf(selectedId);
  const goTo = (index) => (gridOrder[index] ? () => setSelectedId(gridOrder[index]) : null);

  const toggleGrouping = (key) => setUngroupedSpecies((previous) => {
    const next = new Set(previous);
    if (!next.delete(key)) next.add(key);
    return next;
  });

  // Sur la page de détail, « Retour » ramène à la grille.
  return (
    <ScreenLayout title={TEXT.factions[playerFaction]} onBack={selected ? () => setSelectedId(null) : onBack}>
      {selected ? (
        <IndividualDetail
          unit={selected}
          species={roster[selected.species]}
          onPrevious={goTo(selectedIndex - 1)}
          onNext={goTo(selectedIndex + 1)}
        />
      ) : (
        <section className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-3">
          {Object.entries(roster).flatMap(([key, species]) => {
            const members = speciesUnits(key);
            if (members.length === 0) {
              return [<EmptySpeciesTile key={key} species={species} onSummon={onOpenSummon} />];
            }
            const groups = levelGroups(members);
            const grouped = !ungroupedSpecies.has(key);
            return speciesTiles(groups, grouped).map((tile, index) => (
              <UnitTile
                key={`${key}-${tile.minLevel}-${tile.maxLevel}`}
                tile={tile}
                species={species}
                grouping={index === 0 && groups.length > 1 ? { grouped, onToggle: () => toggleGrouping(key) } : null}
                onSelect={() => setSelectedId(tile.unitIds[0])}
              />
            ));
          })}
        </section>
      )}
    </ScreenLayout>
  );
}
