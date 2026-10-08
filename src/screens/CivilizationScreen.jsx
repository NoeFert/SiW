import { useState } from 'react';
import { Badge } from '@/components/ui/8bit/badge.jsx';
import { Button } from '@/components/ui/8bit/button.jsx';
import { ROSTERS } from '../data/rosters.js';
import {
  ARMY_NAME_MAX_LENGTH, ARMY_PP_CAP, addToArmy, armyCost, canAddToArmy, canRemoveFromArmy,
  levelGroups, nextToAdd, nextToRemove, removeFromArmy, renameArmy, speciesTiles,
} from '../logic/army.js';
import {
  individualLevel, individualProgress, levelDamage, levelStat, sortByLevel,
} from '../logic/levels.js';
import { isLegendary } from '../logic/ownedUnits.js';
import { summonAction } from '../logic/summon.js';
import { getArmy, getOwnedUnits, saveArmy } from '../persistence.js';
import ArrowButton from '../ui/ArrowButton.jsx';
import CornerDecor from '../ui/CornerDecor.jsx';
import { LevelBadge, XpBar } from '../ui/LevelDisplay.jsx';
import ScreenLayout from '../ui/ScreenLayout.jsx';
import SpeciesSprite from '../ui/SpeciesSprite.jsx';
import { CountSquare, GroupArrow } from '../ui/TileGroupBadges.jsx';
import { TEXT, keywordLabels, unitName } from '../ui/strings.js';

const T = TEXT.civilization;

function Keywords({ species }) {
  return keywordLabels(species).map((label) => (
    <Badge key={label} variant="secondary" font="normal" className="text-[10px] mx-1.5">
      {label}
    </Badge>
  ));
}

// technical.md 5.1 : en-tête d'accordéon d'une espèce — clic pour ouvrir ou fermer la liste de
// ses individus. Une espèce sans individu reste affichée, grisée.
function SpeciesAccordion({
  species, owned, open, onToggle, children,
}) {
  return (
    <div className="pixel-card">
      <div className="flex items-center gap-3 px-3 py-2">
        <button
          type="button"
          onClick={onToggle}
          disabled={owned === 0}
          className={`flex flex-1 items-center gap-3 text-left ${owned === 0 ? 'opacity-50 grayscale' : 'hover:text-white/80'}`}
        >
          <span className="w-3 text-xs">{owned === 0 ? '' : (open ? '▾' : '▸')}</span>
          <span className="retro text-xs w-8 text-right">{owned}x</span>
          <SpeciesSprite species={species} className="size-12" />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <span className="font-bold">{unitName(species)}</span>
            <Badge className="text-[10px] mx-1.5">{TEXT.presenceTag(species.cost)}</Badge>
          </div>
        </button>
      </div>
      {open && owned > 0 && <div className="flex flex-col gap-1 p-2">{children}</div>}
    </div>
  );
}

// rules.md 11.2 : ligne d'un groupe d'individus strictement identiques (même niveau, comme la
// tour de commandement) : nombre, niveau, combien sont dans l'armée, et − / + pour en retirer
// ou en ajouter un. `onRemove` / `onAdd` : null si impossible.
function ArmyGroupRow({
  group, faction, inArmy, onRemove, onAdd,
}) {
  return (
    <div className="flex items-center gap-2 px-1 text-xs">
      <span className="retro w-8 text-right">{group.unitIds.length > 1 && `${group.unitIds.length}x`}</span>
      <LevelBadge level={group.level} faction={faction} />
      <span className="flex-1 text-white/70">{T.armySummary(inArmy, group.unitIds.length)}</span>
      <Button size="icon" disabled={!onRemove} onClick={onRemove} aria-label={T.removeOne}>−</Button>
      <Button size="icon" disabled={!onAdd} onClick={onAdd} aria-label={T.addOne}>+</Button>
    </div>
  );
}

// GRAPHICS.md « Niveaux » : niveau d'un individu dans la couleur de la faction du joueur.
// Classes littérales (Tailwind ne détecte pas les noms construits dynamiquement).
const LEVEL_TEXT_CLASS = {
  wyrms: 'text-faction-wyrms',
  undead: 'text-faction-undead',
};

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
  tile, species, faction, grouping, onSelect,
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
          <span className={`retro ${LEVEL_TEXT_CLASS[faction]}`}>{TEXT.levels.range(tile.minLevel, tile.maxLevel)}</span>
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

// Stats complètes de units.md, au niveau de l'individu (rules.md 11.6 : PV et dégâts).
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

// technical.md 5.1 : page de détail d'un individu (jamais d'un groupe ; vue interne à l'écran) —
// niveau, barre d'XP, stats à son niveau, aptitudes. Flèches à gauche et à droite, centrées en
// hauteur, vers l'individu précédent / suivant dans l'ordre de la grille (`onPrevious` /
// `onNext` : null au bout).
function IndividualDetail({
  unit, species, faction, onPrevious, onNext,
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
              <LevelBadge level={level} faction={faction} />
              <Keywords species={species} />
            </div>
            <XpBar progress={individualProgress(unit.xp)} faction={faction} />
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

// rules.md 11.2 : nom de l'armée, renommable. Entrée ou ✓ valide, Échap annule ; la saisie est
// bornée à 20 caractères, et un nom refusé par renameArmy (vide ou espaces) garde l'ancien.
function ArmyName({ name, onRename }) {
  const [draft, setDraft] = useState(null); // null = pas en cours d'édition

  if (draft === null) {
    return (
      <div className="flex items-center gap-3">
        <span className="retro text-sm">{name}</span>
        <button type="button" onClick={() => setDraft(name)} title={T.rename} className="hover:text-white/70">✎</button>
      </div>
    );
  }

  const confirm = () => {
    onRename(draft);
    setDraft(null);
  };
  return (
    <div className="flex items-center gap-3">
      <input
        autoFocus
        value={draft}
        onChange={(e) => {
          if ([...e.target.value].length <= ARMY_NAME_MAX_LENGTH) setDraft(e.target.value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') confirm();
          if (e.key === 'Escape') setDraft(null);
        }}
        className="pixel-panel retro text-sm px-2 outline-none"
      />
      <button type="button" onClick={confirm} title={T.confirmRename} className="hover:text-white/70">✓</button>
    </div>
  );
}

// technical.md 5.1 : gestion de civilisation, en deux écrans ouverts chacun par son bouton de
// l'accueil (`section`) :
// - 'units' (titré du nom de la faction) : grille de cases carrées, une par groupe d'individus
//   strictement identiques (clic -> page de détail de son premier individu, puis flèches d'un
//   individu à l'autre) ; une espèce à 0 garde une case grisée avec son bouton Invoquer /
//   Réinvoquer.
// - 'army' (« Armées ») : nom, compteur « X / 500 PP », un accordéon par espèce ; fermé, un
//   résumé ; ouvert, une case « dans l'armée » par individu (rules.md 11.2), sauvegardée à
//   chaque changement.
// Individus triés par niveau puis XP décroissants.
export default function CivilizationScreen({
  playerFaction, section, onBack, onOpenSummon,
}) {
  // Accordéons de l'armée ouverts : tous par défaut, pour que les boutons − / + se voient tout de
  // suite (technical.md 5.1) ; chacun se ferme et se rouvre indépendamment (rien n'est sauvegardé).
  const [openKeys, setOpenKeys] = useState(() => new Set(Object.keys(ROSTERS[playerFaction])));
  const [selectedId, setSelectedId] = useState(null); // individu affiché en détail
  // Espèces dégroupées dans la grille des unités (toutes regroupées par défaut, rien n'est
  // sauvegardé), comme dans la tour de commandement.
  const [ungroupedSpecies, setUngroupedSpecies] = useState(() => new Set());
  const [army, setArmy] = useState(getArmy);
  const roster = ROSTERS[playerFaction];
  const [units] = useState(() => getOwnedUnits() ?? []);
  const armyIds = new Set(army?.unitIds ?? []);
  const speciesUnits = (key) => sortByLevel(units.filter((unit) => unit.species === key));

  const changeArmy = (newArmy) => {
    saveArmy(newArmy);
    setArmy(newArmy);
  };
  const toggle = (key) => setOpenKeys((current) => {
    const next = new Set(current);
    if (!next.delete(key)) next.add(key);
    return next;
  });

  const selected = units.find((unit) => unit.id === selectedId);
  // Tous les individus, dans l'ordre de la grille des unités (roster, puis niveaux décroissants,
  // puis XP décroissante dans un groupe) : ordre de navigation de la page de détail.
  const gridOrder = Object.keys(roster)
    .flatMap((key) => levelGroups(speciesUnits(key)).flatMap((group) => group.unitIds));
  const selectedIndex = gridOrder.indexOf(selectedId);
  const goTo = (index) => (gridOrder[index] ? () => setSelectedId(gridOrder[index]) : null);
  let content;
  if (selected) {
    content = (
      <IndividualDetail
        unit={selected}
        species={roster[selected.species]}
        faction={playerFaction}
        onPrevious={goTo(selectedIndex - 1)}
        onNext={goTo(selectedIndex + 1)}
      />
    );
  } else if (section === 'army') {
    content = (
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <ArmyName name={army.name} onRename={(name) => changeArmy(renameArmy(army, name))} />
          <span className="retro text-xs">{T.armyCost(armyCost(army, units, roster), ARMY_PP_CAP)}</span>
        </div>
        {/* Une colonne par espèce, côte à côte. */}
        <div className="grid grid-cols-3 items-start gap-3">
          {Object.entries(roster).map(([key, species]) => {
            const members = speciesUnits(key);
            return (
              <SpeciesAccordion
                key={key}
                species={species}
                owned={members.length}
                open={openKeys.has(key)}
                onToggle={() => toggle(key)}
              >
                {openKeys.has(key) && levelGroups(members).map((group) => {
                  const addId = nextToAdd(army, group);
                  const removeId = nextToRemove(army, group);
                  return (
                    <ArmyGroupRow
                      key={group.level}
                      group={group}
                      faction={playerFaction}
                      inArmy={group.unitIds.filter((id) => armyIds.has(id)).length}
                      onAdd={addId && canAddToArmy(army, units, roster, addId)
                        ? () => changeArmy(addToArmy(army, units, roster, addId)) : null}
                      onRemove={removeId && canRemoveFromArmy(army, units, removeId)
                        ? () => changeArmy(removeFromArmy(army, units, removeId)) : null}
                    />
                  );
                })}
              </SpeciesAccordion>
            );
          })}
        </div>
      </section>
    );
  } else {
    content = (
      <section className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-3">
        {Object.entries(roster).flatMap(([key, species]) => {
          const members = speciesUnits(key);
          if (members.length === 0) {
            return [<EmptySpeciesTile key={key} species={species} onSummon={onOpenSummon} />];
          }
          const groups = levelGroups(members);
          const grouped = !ungroupedSpecies.has(key);
          const toggleGroup = () => setUngroupedSpecies((previous) => {
            const next = new Set(previous);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
          });
          return speciesTiles(groups, grouped).map((tile, index) => (
            <UnitTile
              key={`${key}-${tile.minLevel}-${tile.maxLevel}`}
              tile={tile}
              species={species}
              faction={playerFaction}
              grouping={index === 0 && groups.length > 1 ? { grouped, onToggle: toggleGroup } : null}
              onSelect={() => setSelectedId(tile.unitIds[0])}
            />
          ));
        })}
      </section>
    );
  }

  // Sur la page de détail, « Retour » ramène à la grille des unités.
  return (
    <ScreenLayout
      title={section === 'army' ? T.army : TEXT.factions[playerFaction]}
      onBack={selected ? () => setSelectedId(null) : onBack}
    >
      {content}
    </ScreenLayout>
  );
}
