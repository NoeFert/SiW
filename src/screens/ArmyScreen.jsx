import { useState } from 'react';
import { Badge } from '@/components/ui/8bit/badge.jsx';
import { Button } from '@/components/ui/8bit/button.jsx';
import { FACTIONS } from '../data/factions/index.js';
import {
  ARMY_NAME_MAX_LENGTH, ARMY_PP_CAP, addToArmy, armyCost, canAddToArmy, canRemoveFromArmy,
  levelGroups, nextToAdd, nextToRemove, removeFromArmy, renameArmy,
} from '../logic/army.js';
import { sortByLevel } from '../logic/levels.js';
import { useProfileStore, setArmy } from '../state/profileStore.js';
import { LevelBadge } from '../ui/LevelDisplay.jsx';
import ScreenLayout from '../ui/ScreenLayout.jsx';
import SpeciesSprite from '../ui/SpeciesSprite.jsx';
import { TEXT, unitName } from '../ui/strings.js';

const T = TEXT.civilization;

// Entrée ou ✓ valide, Échap annule.
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

// `onRemove` / `onAdd` : null si impossible.
function ArmyGroupRow({
  group, inArmy, onRemove, onAdd,
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="retro w-7 shrink-0 text-right">{group.unitIds.length > 1 && `${group.unitIds.length}x`}</span>
      <LevelBadge level={group.level} />
      <span className="flex-1 text-white/70">{T.armySummary(inArmy, group.unitIds.length)}</span>
      <Button size="icon" disabled={!onRemove} onClick={onRemove} aria-label={T.removeOne}>−</Button>
      <Button size="icon" disabled={!onAdd} onClick={onAdd} aria-label={T.addOne}>+</Button>
    </div>
  );
}

// Écran « Armées » (rules.md 11.2). Chaque changement est sauvegardé tout de suite.
export default function ArmyScreen({ playerFaction, onBack }) {
  const { roster } = FACTIONS[playerFaction];
  // Tous ouverts par défaut.
  const [openKeys, setOpenKeys] = useState(() => new Set(Object.keys(roster)));
  const army = useProfileStore((profile) => profile.army);
  const units = useProfileStore((profile) => profile.units);
  const armyIds = new Set(army.unitIds);
  const speciesUnits = (key) => sortByLevel(units.filter((unit) => unit.species === key));

  const toggle = (key) => setOpenKeys((current) => {
    const next = new Set(current);
    if (!next.delete(key)) next.add(key);
    return next;
  });

  return (
    <ScreenLayout title={T.army} onBack={onBack}>
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <ArmyName name={army.name} onRename={(name) => setArmy(renameArmy(army, name))} />
          <span className="retro text-xs">{T.armyCost(armyCost(army, units, roster), ARMY_PP_CAP)}</span>
        </div>
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
                      inArmy={group.unitIds.filter((id) => armyIds.has(id)).length}
                      onAdd={addId && canAddToArmy(army, units, roster, addId)
                        ? () => setArmy(addToArmy(army, units, roster, addId)) : null}
                      onRemove={removeId && canRemoveFromArmy(army, units, removeId)
                        ? () => setArmy(removeFromArmy(army, units, removeId)) : null}
                    />
                  );
                })}
              </SpeciesAccordion>
            );
          })}
        </div>
      </section>
    </ScreenLayout>
  );
}
