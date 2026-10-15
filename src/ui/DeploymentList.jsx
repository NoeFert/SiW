import { useEffect, useRef, useState } from 'react';
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/8bit/tooltip.jsx';
import { deployPlayerUnit, startDeploymentDrag, endDeploymentDrag } from '../logic/battles/playerActions.js';
import { getTowerRows, groupTowerRows } from '../logic/battles/deployment.js';
import { SPECIES_SPRITES, spritePath } from '../data/sprites.js';
import {
  CELL_SIZE, GAME_WIDTH, getCanvasRect, screenToGrid,
} from '../renderConstants.js';
import UnitRow from './UnitRow.jsx';
import { TEXT } from './strings.js';

const MESSAGE_DURATION_MS = 2500;

const rowKey = (row) => `${row.species.name}-${row.level}-${row.hp}`;

// Fantôme tenu pendant le drag : à la taille réelle de l'unité sur le terrain affiché (taille
// d'une case à l'écran x `size`, sprite à 90 % comme dans UnitViews.create), tourné
// vers la droite comme les unités du joueur. Le curseur est au centre de la case haut-gauche du
// bloc : c'est elle que screenToGrid vise au relâché, donc le fantôme couvre exactement les
// cases où l'unité sera déployée.
function DragGhost({ drag }) {
  const rect = getCanvasRect();
  const cell = rect ? (CELL_SIZE * rect.width) / GAME_WIDTH : 48;
  const footprint = cell * drag.row.species.size;
  const { key, facing } = SPECIES_SPRITES[drag.row.species.name];
  return (
    <div
      className="pointer-events-none fixed z-50 flex items-center justify-center"
      style={{
        left: drag.x - cell / 2, top: drag.y - cell / 2, width: footprint, height: footprint,
      }}
    >
      <img
        src={spritePath(key)}
        alt=""
        className="pixelated opacity-80"
        style={{
          width: footprint * 0.9,
          height: footprint * 0.9,
          transform: facing !== null && facing !== 'right' ? 'scaleX(-1)' : undefined,
        }}
      />
    </div>
  );
}

// rules.md 2 : liste des unités déployables de la tour. Le drag part de n'importe où sur une
// ligne (Pointer Events suivis sur `window`) et se termine sur le canevas (repéré par son
// <canvas> DOM, pas par un objet Phaser). Toutes les règles (contenu et regroupement des
// lignes, pause, plafond, copies, zone) sont dans src/logic/.
export default function DeploymentList({ battle, unitsOnField }) {
  const [drag, setDrag] = useState(null); // { row, x, y } en coordonnées écran
  const [blockedKey, setBlockedKey] = useState(null); // ligne grisée cliquée : tooltip ouvert
  const [message, setMessage] = useState('');
  // Espèces dont les cases sont dégroupées (flèche de la première case) ; toutes regroupées par
  // défaut. État de l'écran de bataille seulement, rien n'est sauvegardé.
  const [ungroupedSpecies, setUngroupedSpecies] = useState(() => new Set());
  const timers = useRef({});
  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);

  const rows = groupTowerRows(getTowerRows(battle.playerDeployment, 'player', unitsOnField), ungroupedSpecies);

  const toggleGroup = (species) => setUngroupedSpecies((previous) => {
    const next = new Set(previous);
    if (next.has(species)) next.delete(species);
    else next.add(species);
    return next;
  });

  // Affiche une info temporaire ; une nouvelle remplace la précédente pour sa pleine durée.
  const flash = (name, setter, value) => {
    clearTimeout(timers.current[name]);
    setter(value);
    timers.current[name] = setTimeout(() => setter(name === 'message' ? '' : null), MESSAGE_DURATION_MS);
  };

  const finishDrag = (row, clientX, clientY) => {
    endDeploymentDrag(battle);
    const rect = getCanvasRect();
    if (!rect || clientX < rect.left || clientX >= rect.right || clientY < rect.top || clientY >= rect.bottom) {
      return; // relâché hors du terrain : annulation silencieuse
    }
    // technical.md 3.1 : src/logic/ raisonne dans le référentiel fixe de 1536px.
    const { x, y } = screenToGrid(rect, clientX, clientY);
    const result = deployPlayerUnit(battle, row.species, x, y, row.copyChoice);
    if (!result.success) flash('message', setMessage, TEXT.deployRefused[result.reason]);
  };

  const onPointerDown = (row, event) => {
    if (event.button !== 0) return;
    if (!row.deployable) {
      flash('blocked', setBlockedKey, rowKey(row));
      return;
    }
    if (!startDeploymentDrag(battle)) return;
    setBlockedKey(null);
    setDrag({ row, x: event.clientX, y: event.clientY });

    // La capture garantit de recevoir le relâché même hors de la fenêtre ; sinon le jeu
    // resterait en pause avec le fantôme collé au curseur.
    event.currentTarget.setPointerCapture(event.pointerId);

    const onMove = (e) => setDrag({ row, x: e.clientX, y: e.clientY });
    const end = (clientX, clientY) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
      window.removeEventListener('blur', onCancel);
      finishDrag(row, clientX, clientY);
      setDrag(null);
    };
    const onUp = (e) => end(e.clientX, e.clientY);
    // pointercancel ou perte de focus (alt-tab) : annulation, comme un relâché hors du terrain.
    const onCancel = () => end(-1, -1);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    window.addEventListener('blur', onCancel);
  };

  return (
    // Deux cases par rangée (ui-battle-screen-decisions.md 2.2).
    <div className="grid grid-cols-2 gap-2">
      {message && <p className="col-span-2 text-xs text-red-400">{message}</p>}

      {rows.map((row) => (
        // Tooltip contrôlé : ouvert uniquement par un clic sur une ligne grisée, jamais au survol.
        // Enveloppe flex-col : TooltipContent (8bitcn) rend toujours une <div> vide, qui sinon
        // prendrait sa propre case de la grille.
        <div key={rowKey(row)} className="flex flex-col">
          <Tooltip open={blockedKey === rowKey(row)}>
            <TooltipTrigger>
              <UnitRow
                row={row}
                onToggleGroup={() => toggleGroup(row.species)}
                onPointerDown={(event) => onPointerDown(row, event)}
              />
            </TooltipTrigger>
            <TooltipContent side="top" font="normal" className="max-w-64">
              {TEXT.notEnoughPresence}
            </TooltipContent>
          </Tooltip>
        </div>
      ))}

      {drag && <DragGhost drag={drag} />}
    </div>
  );
}
