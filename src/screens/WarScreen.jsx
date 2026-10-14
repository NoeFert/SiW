import { useLayoutEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/8bit/badge.jsx';
import { Button } from '@/components/ui/8bit/button.jsx';
import { BATTLES, WAR_BATTLE_IDS } from '../data/battles.js';
import { WAR_MAP_1 } from '../data/warMaps.js';
import { armyUnits } from '../logic/army.js';
import { victoryPlayerXp } from '../logic/levels.js';
import { ROSTERS } from '../data/rosters.js';
import { SPECIES_SPRITES } from '../data/sprites.js';
import {
  invaderSpecies, invadersRepelled, isWarCompleted, victoryReward, warBattleState,
} from '../logic/war.js';
import { getArmy, getOwnedUnits, getWonWarBattles } from '../persistence.js';
import RewardRow from '../ui/RewardRow.jsx';
import ScreenLayout from '../ui/ScreenLayout.jsx';
import SpeciesSprite from '../ui/SpeciesSprite.jsx';
import { TEXT } from '../ui/strings.js';

const T = TEXT.war;

// GRAPHICS.md « Partir en guerre » : map en arbre de compétences (sprites SkillTree du pack, à
// 2×), dans la couleur du souverain du joueur — jaune (doré) pour les Wyrms, violet pour les
// Morts-Vivants, comme les accents de l'interface.
const PLAYER_COLOR = { wyrms: 'yellow', undead: 'purple' };
const SLOT = 42; // losange 21×21 à 2×, pointes au milieu des côtés
const BOSS_SLOT = 56; // losange du boss, plus grand : SkillSlotLarge 28×28 à 2×
const HALF = SLOT / 2;
const PANEL_WIDTH = 320; // panneau de l'emplacement sélectionné, à droite de la map
const PANEL_GAP = 64; // entre la map et le panneau
const STEP = 80; // distance entre deux cases de la grille de la map

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

// Envahisseur posé au-dessus de son emplacement : le sprite de l'espèce ennemie, tourné vers la
// gauche comme l'IA en bataille (rules.md 2), plus grand pour le [Légendaire], à INVADER_GAP de la
// pointe haute du losange. Assombri, il s'éclaire quand son losange est sélectionné, pour montrer
// qu'ils vont ensemble.
const INVADER_SIZE = { basic: 40, flying: 40, legendary: 64 };
const INVADER_GAP = 5;
function Invader({ node, enemyRoster, selected }) {
  const species = invaderSpecies(enemyRoster, node.invader);
  const size = INVADER_SIZE[node.invader];
  const { x, y } = slotCenter(node);
  const flip = SPECIES_SPRITES[species.name].facing === 'right' ? '-scale-x-100' : '';
  return (
    <SpeciesSprite
      species={species}
      className={`pointer-events-none absolute ${flip} ${selected ? 'brightness-125' : 'brightness-75'}`}
      style={{
        left: x - size / 2, top: y - slotSize(node) / 2 - INVADER_GAP - size, width: size, height: size,
      }}
    />
  );
}

// Connecteur droit entre deux emplacements liés (même ligne ou même colonne), de pointe à pointe.
// Gris dès qu'un des deux bouts est verrouillé.
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

// technical.md 5.1 / rules.md 11.7 : écran « Partir en guerre ». La map 1 en réseau
// (src/data/warMaps.js) : trois chemins du départ au boss, des passerelles et des impasses, sur
// le fond de la map en plein écran. Les emplacements qui portent une bataille définie prennent
// son état ; les autres sont verrouillés (« À venir »). Un clic sur un losange l'affiche dans le
// panneau : nom, état, récompense de la prochaine victoire (pleine ou réduite au rejeu) et
// « Combattre », désactivé si verrouillée ou si l'armée est vide.
export default function WarScreen({ playerFaction, onFight, onBack }) {
  const units = getOwnedUnits() ?? [];
  const wonIds = getWonWarBattles();
  const armyIsEmpty = armyUnits(getArmy(), units).length === 0;
  const color = PLAYER_COLOR[playerFaction];
  const nodes = WAR_MAP_1.nodes.map((node) => ({
    ...node,
    state: node.battle ? warBattleState(WAR_BATTLE_IDS, wonIds, node.battle) : 'locked',
  }));
  const byId = new Map(nodes.map((node) => [node.id, node]));
  // Sélection par défaut : la dernière bataille débloquée, là où en est le joueur.
  const [selectedId, setSelectedId] = useState(
    () => nodes.findLast((node) => node.battle && node.state !== 'locked')?.id ?? nodes[0].id,
  );
  const current = byId.get(selectedId);
  const replay = current.state === 'won'; // rules.md 11.7 : rejeu d'une bataille déjà gagnée
  const enemyRoster = ROSTERS[playerFaction === 'wyrms' ? 'undead' : 'wyrms'];
  const invaders = invadersRepelled(nodes, wonIds);
  // Marges de la map, pour que rien ne dépasse et que la mise en page ne bouge pas avec la
  // sélection : en haut, les envahisseurs de la ligne du haut ; en bas, le sélecteur (une fois et
  // demie le losange) d'un emplacement de la ligne du bas.
  const mapMarginTop = Math.max(0, ...nodes.filter((node) => node.invader).map(
    (node) => INVADER_SIZE[node.invader] + INVADER_GAP + slotSize(node) / 2 - slotCenter(node).y,
  ));
  const mapMarginBottom = SLOT / 4;
  const mapWidth = SLOT + (WAR_MAP_1.cols - 1) * STEP;
  const mapHeight = SLOT + (WAR_MAP_1.rows - 1) * STEP;
  // Map réduite (jamais agrandie) pour tenir, avec le panneau, dans la place laissée par la
  // fenêtre : aucune barre de défilement, quelle que soit la taille de l'écran.
  const rowRef = useRef(null);
  const [rowSize, setRowSize] = useState(null);
  useLayoutEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      setRowSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(rowRef.current);
    return () => observer.disconnect();
  }, []);
  const mapScale = rowSize ? Math.max(0, Math.min(
    1,
    (rowSize.width - PANEL_WIDTH - PANEL_GAP) / mapWidth,
    rowSize.height / (mapMarginTop + mapHeight + mapMarginBottom),
  )) : 1;

  return (
    <ScreenLayout
      title={T.title}
      onBack={onBack}
      // Fond de la map sur tout l'écran, en monochrome contrasté et assombri.
      background={(
        <div
          className="size-full bg-cover bg-center brightness-50 grayscale contrast-150"
          style={{ backgroundImage: `url(${WAR_MAP_1.background})` }}
        />
      )}
    >
      <div className="flex h-full flex-col gap-2">
        {armyIsEmpty && <p className="text-xs text-red-400">{T.emptyArmy}</p>}
        <p className="retro text-sm">{T.invaders(invaders.repelled, invaders.total)}</p>
        <div ref={rowRef} className="flex min-h-0 flex-1 items-center justify-center" style={{ gap: PANEL_GAP }}>
          <div
            className="shrink-0"
            style={{ width: mapWidth * mapScale, height: (mapMarginTop + mapHeight + mapMarginBottom) * mapScale }}
          >
            <div
              className="relative origin-top-left"
              style={{
                width: mapWidth, height: mapHeight, top: mapMarginTop * mapScale, transform: `scale(${mapScale})`,
              }}
            >
              {WAR_MAP_1.links.map(([a, b]) => {
                const from = byId.get(a);
                const to = byId.get(b);
                const linkColor = from.state === 'locked' || to.state === 'locked' ? 'grey' : color;
                return <Connector key={`${a}-${b}`} from={from} to={to} color={linkColor} />;
              })}
              {nodes.map((node) => (
                <Slot
                  key={node.id}
                  node={node}
                  color={color}
                  selected={node.id === selectedId}
                  onSelect={() => setSelectedId(node.id)}
                />
              ))}
              {nodes.filter((node) => node.invader).map((node) => (
                <Invader
                  key={`invader-${node.id}`}
                  node={node}
                  enemyRoster={enemyRoster}
                  selected={node.id === selectedId}
                />
              ))}
            </div>
          </div>
          <div style={{ width: PANEL_WIDTH }} className={`flex shrink-0 flex-col items-center gap-3 text-center text-xs ${current.state === 'locked' ? 'opacity-50' : ''}`}>
            <div className="flex items-center gap-3">
              <span className="retro text-sm whitespace-nowrap">{current.battle ? T.battleNames[current.battle] : T.upcoming}</span>
              <Badge variant="secondary" font="normal" className="text-[10px]">{T.states[current.state]}</Badge>
            </div>
            <Button size="sm" disabled={current.state === 'locked' || armyIsEmpty} onClick={() => onFight(current.battle)}>
              {T.fight}
            </Button>
            {/* Récompenses de la prochaine victoire : Spirit Stones (0 au rejeu, rules.md 11.7) et
                XP du joueur (100 + jusqu'à 100 selon les PP survivants, 25 % au rejeu, 11.5). */}
            {current.state !== 'locked' && (
              <RewardRow
                spiritStones={victoryReward(BATTLES[current.battle].reward, replay)}
                xp={T.xpRange(
                  victoryPlayerXp(1, 0, replay),
                  victoryPlayerXp(1, 1, replay),
                )}
              />
            )}
          </div>
        </div>
        {isWarCompleted(WAR_BATTLE_IDS, wonIds) && <p className="retro text-xs text-center">{T.completed}</p>}
      </div>
    </ScreenLayout>
  );
}
