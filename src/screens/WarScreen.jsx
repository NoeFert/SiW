import { useState } from 'react';
import { Badge } from '@/components/ui/8bit/badge.jsx';
import { Button } from '@/components/ui/8bit/button.jsx';
import { BATTLES, WAR_BATTLE_IDS } from '../data/battles.js';
import { ROSTERS } from '../data/rosters.js';
import { WAR_MAP_1 } from '../data/warMaps.js';
import { ARMY_PP_CAP, armyCost, armyUnits } from '../logic/army.js';
import { isWarCompleted, victoryReward, warBattleState } from '../logic/war.js';
import { getArmy, getOwnedUnits, getWonWarBattles } from '../persistence.js';
import ScreenLayout from '../ui/ScreenLayout.jsx';
import { SpiritStonesAmount } from '../ui/SpiritStonesBalance.jsx';
import { TEXT } from '../ui/strings.js';

const T = TEXT.war;

// GRAPHICS.md « Partir en guerre » : map en arbre de compétences (sprites SkillTree du pack, à
// 2×), dans la couleur du souverain adverse — violet face aux Morts-Vivants, jaune face aux Wyrms.
const ENEMY_COLOR = { wyrms: 'purple', undead: 'yellow' };
const SLOT = 42; // losange 21×21 à 2×, pointes au milieu des côtés
const BOSS_SLOT = 56; // losange du boss, plus grand : SkillSlotLarge 28×28 à 2×
const HALF = SLOT / 2;
const STEP = 96; // distance entre deux cases de la grille de la map

const uiSprite = (name) => `url(/ui/${name}.png)`;
const slotCenter = ({ col, row }) => ({ x: HALF + col * STEP, y: HALF + row * STEP });
const slotSize = (node) => (node.boss ? BOSS_SLOT : SLOT);

// Losange d'un emplacement : vide si disponible, plein si gagné, gris si verrouillé ; plus grand
// pour le boss. Le sélecteur (à 3×, une fois et demie le losange) entoure l'emplacement choisi.
function Slot({ node, color, selected, onSelect }) {
  const { x, y } = slotCenter(node);
  const size = slotSize(node);
  const prefix = node.boss ? 'war-boss' : 'war';
  let sprite = `${prefix}-slot-${color}`;
  if (node.state === 'won') sprite = `${prefix}-slot-won-${color}`;
  if (node.state === 'locked') sprite = `${prefix}-slot-grey`;
  const selector = size * 1.5;
  return (
    <button
      type="button"
      onClick={onSelect}
      className="absolute cursor-pointer hover:brightness-125"
      style={{ left: x - size / 2, top: y - size / 2, width: size, height: size }}
    >
      {/* Intérieur noir du losange, pour qu'il se détache du fond de la map. */}
      <span className="absolute rotate-45 bg-black/80" style={{ inset: size / 7 }} />
      <span className="pixelated absolute inset-0 bg-size-[100%_100%]" style={{ backgroundImage: uiSprite(sprite) }} />
      {selected && (
        <span
          className="pixelated absolute bg-size-[100%_100%]"
          style={{
            left: (size - selector) / 2,
            top: (size - selector) / 2,
            width: selector,
            height: selector,
            backgroundImage: uiSprite(`${prefix}-selector-${node.state === 'locked' ? 'grey' : color}`),
          }}
        />
      )}
    </button>
  );
}

// Connecteur droit entre deux emplacements qui se suivent (même ligne ou même colonne), de
// pointe à pointe. Gris vers un emplacement verrouillé.
function Connector({ from, to, color }) {
  const a = slotCenter(from);
  const b = slotCenter(to);
  const vertical = a.x === b.x;
  // Demi-tailles des losanges aux deux bouts : `first` est celui du haut (ou de gauche).
  const [first, last] = (vertical ? a.y < b.y : a.x < b.x) ? [from, to] : [to, from];
  const start = slotSize(first) / 2;
  const gap = start + slotSize(last) / 2;
  const style = vertical
    ? { left: a.x - 16, top: Math.min(a.y, b.y) + start, width: 32, height: Math.abs(a.y - b.y) - gap }
    : { left: Math.min(a.x, b.x) + start, top: a.y - 16, width: Math.abs(a.x - b.x) - gap, height: 32 };
  return (
    <div
      className={`pixelated absolute bg-size-[32px_32px] ${vertical ? 'bg-repeat-y' : 'bg-repeat-x'}`}
      style={{ ...style, backgroundImage: uiSprite(`war-connector-${vertical ? 'vertical' : 'horizontal'}-${color}`) }}
    />
  );
}

// technical.md 5.1 / rules.md 11.7 : écran « Partir en guerre ». L'armée qui partira, puis la
// map 1 : un losange par emplacement, sur le tracé en lacets (src/data/warMaps.js). Les premiers
// portent les batailles définies, les suivants sont verrouillés (« À venir »). Un clic sur un
// losange l'affiche dans le panneau : nom, état, récompense de la prochaine victoire (pleine ou
// réduite au rejeu) et « Combattre », désactivé si verrouillée ou si l'armée est vide.
export default function WarScreen({ playerFaction, onFight, onBack }) {
  const roster = ROSTERS[playerFaction];
  const units = getOwnedUnits() ?? [];
  const army = getArmy();
  const wonIds = getWonWarBattles();
  const armyIsEmpty = armyUnits(army, units).length === 0;
  const color = ENEMY_COLOR[playerFaction];
  const nodes = WAR_MAP_1.slots.map((slot, i) => {
    const id = WAR_BATTLE_IDS[i] ?? null;
    return { ...slot, id, state: id ? warBattleState(WAR_BATTLE_IDS, wonIds, id) : 'locked' };
  });
  // Sélection par défaut : la dernière bataille débloquée, là où en est le joueur.
  const [selected, setSelected] = useState(() => nodes.findLastIndex((node) => node.state !== 'locked'));
  const current = nodes[selected];

  return (
    <ScreenLayout title={T.title} onBack={onBack}>
      <div className="flex min-h-full flex-col gap-6">
        <p className="retro text-xs">{T.armyLine(army.name, armyCost(army, units, roster), ARMY_PP_CAP)}</p>
        {armyIsEmpty && <p className="text-xs text-red-400">{T.emptyArmy}</p>}
        <div className="flex flex-1 items-center justify-center gap-16">
          {/* Fond de la map en monochrome contrasté et assombri, sur son propre calque (le filtre ne
              touche pas le tracé), avec une marge autour des losanges. */}
          <div className="relative shrink-0 p-10">
            <div
              className="absolute inset-0 bg-cover bg-center brightness-50 grayscale contrast-150"
              style={{ backgroundImage: `url(${WAR_MAP_1.background})` }}
            />
            <div
              className="relative"
              style={{ width: SLOT + (WAR_MAP_1.cols - 1) * STEP, height: SLOT + (WAR_MAP_1.rows - 1) * STEP }}
            >
              {nodes.slice(1).map((node, i) => (
                <Connector key={i} from={nodes[i]} to={node} color={node.state === 'locked' ? 'grey' : color} />
              ))}
              {nodes.map((node, i) => (
                <Slot key={i} node={node} color={color} selected={i === selected} onSelect={() => setSelected(i)} />
              ))}
            </div>
          </div>
          <div className={`flex w-80 flex-col items-center gap-3 text-center text-xs ${current.state === 'locked' ? 'opacity-50' : ''}`}>
            <div className="flex items-center gap-3">
              <span className="retro text-sm whitespace-nowrap">{current.id ? T.battleNames[current.id] : T.upcoming}</span>
              <Badge variant="secondary" font="normal" className="text-[10px]">{T.states[current.state]}</Badge>
            </div>
            {current.state !== 'locked' && (
              <SpiritStonesAmount amount={victoryReward(BATTLES[current.id].reward, current.state === 'won')} />
            )}
            <Button size="sm" disabled={current.state === 'locked' || armyIsEmpty} onClick={() => onFight(current.id)}>
              {T.fight}
            </Button>
          </div>
        </div>
        {isWarCompleted(WAR_BATTLE_IDS, wonIds) && <p className="retro text-xs text-center">{T.completed}</p>}
      </div>
    </ScreenLayout>
  );
}
