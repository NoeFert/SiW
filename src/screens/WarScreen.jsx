import { useLayoutEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/8bit/badge.jsx';
import { Button } from '@/components/ui/8bit/button.jsx';
import { BATTLES, WAR_BATTLE_IDS } from '../data/battles/index.js';
import { WAR_MAP_01 } from '../data/battles/war01/warMap01.js';
import { FACTIONS } from '../data/factions/index.js';
import { armyUnits } from '../logic/army.js';
import { opposingFaction } from '../logic/battles/battleSetup.js';
import { victoryPlayerXp } from '../logic/levels.js';
import {
  invadersRepelled, isWarCompleted, victoryReward, warBattleState,
} from '../logic/war.js';
import { useProfileStore } from '../state/profileStore.js';
import RewardRow from '../ui/RewardRow.jsx';
import ScreenLayout from '../ui/ScreenLayout.jsx';
import WarMap, { warMapSize } from '../ui/WarMap.jsx';
import { TEXT } from '../ui/strings.js';

const T = TEXT.war;
const PANEL_WIDTH = 320; // panneau de l'emplacement sélectionné, à droite de la map
const PANEL_GAP = 64; // entre la map et le panneau

// Panneau de l'emplacement sélectionné : nom, état, « Combattre » (désactivé si verrouillé ou si
// l'armée est vide) et récompenses de la prochaine victoire.
function BattlePanel({ node, armyIsEmpty, onFight }) {
  const replay = node.state === 'won'; // rules.md 11.7 : rejeu d'une bataille déjà gagnée
  return (
    <div style={{ width: PANEL_WIDTH }} className={`flex shrink-0 flex-col items-center gap-3 text-center text-xs ${node.state === 'locked' ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-3">
        <span className="retro text-sm whitespace-nowrap">{node.battle ? T.battleNames[node.battle] : T.upcoming}</span>
        <Badge variant="secondary" font="normal" className="text-[10px]">{T.states[node.state]}</Badge>
      </div>
      <Button size="sm" disabled={node.state === 'locked' || armyIsEmpty} onClick={() => onFight(node.battle)}>
        {T.fight}
      </Button>
      {/* Récompenses de la prochaine victoire : Spirit Stones (0 au rejeu, rules.md 11.7) et
          XP du joueur (100 + jusqu'à 100 selon les PP survivants, 25 % au rejeu, 11.5). */}
      {node.state !== 'locked' && (
        <RewardRow
          spiritStones={victoryReward(BATTLES[node.battle].reward, replay)}
          xp={T.xpRange(victoryPlayerXp(1, 0, replay), victoryPlayerXp(1, 1, replay))}
        />
      )}
    </div>
  );
}

// Taille disponible (px) d'un élément, suivie quand la fenêtre change ; null avant la mesure.
function useElementSize(ref) {
  const [size, setSize] = useState(null);
  useLayoutEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}

// technical.md 5.1 / rules.md 11.7 : écran « Partir en guerre ». La map de la guerre 01 en réseau
// (src/data/battles/war01/warMap01.js, affichée par WarMap) : trois chemins du départ au boss,
// des passerelles et des impasses, sur le fond de la map en plein écran. Les emplacements qui
// portent une bataille prennent son état ; les autres sont verrouillés (« À venir »). Un clic sur
// un losange l'affiche dans le panneau de droite.
export default function WarScreen({ playerFaction, onFight, onBack }) {
  const units = useProfileStore((profile) => profile.units);
  const army = useProfileStore((profile) => profile.army);
  const wonIds = useProfileStore((profile) => profile.wonWarBattles);
  const armyIsEmpty = armyUnits(army, units).length === 0;
  const nodes = WAR_MAP_01.nodes.map((node) => ({
    ...node,
    state: node.battle ? warBattleState(WAR_BATTLE_IDS, wonIds, node.battle) : 'locked',
  }));
  // Sélection par défaut : la dernière bataille débloquée, là où en est le joueur.
  const [selectedId, setSelectedId] = useState(
    () => nodes.findLast((node) => node.battle && node.state !== 'locked')?.id ?? nodes[0].id,
  );
  const invaders = invadersRepelled(nodes, wonIds);

  // Map réduite (jamais agrandie) pour tenir, avec le panneau, dans la place laissée par la
  // fenêtre : aucune barre de défilement, quelle que soit la taille de l'écran.
  const rowRef = useRef(null);
  const rowSize = useElementSize(rowRef);
  const mapSize = warMapSize(WAR_MAP_01, nodes);
  const mapScale = rowSize ? Math.max(0, Math.min(
    1,
    (rowSize.width - PANEL_WIDTH - PANEL_GAP) / mapSize.width,
    rowSize.height / mapSize.totalHeight,
  )) : 1;

  return (
    <ScreenLayout
      title={T.title}
      onBack={onBack}
      // Fond de la map sur tout l'écran, en monochrome contrasté et assombri.
      background={(
        <div
          className="size-full bg-cover bg-center brightness-50 grayscale contrast-150"
          style={{ backgroundImage: `url(${WAR_MAP_01.background})` }}
        />
      )}
    >
      <div className="flex h-full flex-col gap-2">
        {armyIsEmpty && <p className="text-xs text-red-400">{T.emptyArmy}</p>}
        <p className="retro text-sm">{T.invaders(invaders.repelled, invaders.total)}</p>
        <div ref={rowRef} className="flex min-h-0 flex-1 items-center justify-center" style={{ gap: PANEL_GAP }}>
          <WarMap
            map={WAR_MAP_01}
            nodes={nodes}
            color={FACTIONS[playerFaction].uiColor}
            enemyRoster={FACTIONS[opposingFaction(playerFaction)].roster}
            selectedId={selectedId}
            onSelect={setSelectedId}
            scale={mapScale}
          />
          <BattlePanel
            node={nodes.find((node) => node.id === selectedId)}
            armyIsEmpty={armyIsEmpty}
            onFight={onFight}
          />
        </div>
        {isWarCompleted(WAR_BATTLE_IDS, wonIds) && <p className="retro text-xs text-center">{T.completed}</p>}
      </div>
    </ScreenLayout>
  );
}
