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

// Fantôme du drag, à la taille de l'unité ; le curseur vise la case haut-gauche.
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

// Liste des unités déployables. Les règles sont dans src/logic/.
export default function DeploymentList({ battle, unitsOnField }) {
  const [drag, setDrag] = useState(null); // coordonnées écran
  const [blockedKey, setBlockedKey] = useState(null); // ligne grisée cliquée : tooltip ouvert
  const [message, setMessage] = useState('');
  // Rien n'est sauvegardé.
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

  const flash = (name, setter, value) => {
    clearTimeout(timers.current[name]);
    setter(value);
    timers.current[name] = setTimeout(() => setter(name === 'message' ? '' : null), MESSAGE_DURATION_MS);
  };

  const finishDrag = (row, clientX, clientY) => {
    endDeploymentDrag(battle);
    const rect = getCanvasRect();
    if (!rect || clientX < rect.left || clientX >= rect.right || clientY < rect.top || clientY >= rect.bottom) {
      return; // relâché hors du terrain : annulation
    }
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

    // Capture : reçoit le relâché même hors de la fenêtre.
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
    // pointercancel ou alt-tab : annulation.
    const onCancel = () => end(-1, -1);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    window.addEventListener('blur', onCancel);
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      {message && <p className="col-span-2 text-xs text-red-400">{message}</p>}

      {rows.map((row) => (
        // Tooltip ouvert au clic seulement. flex-col : TooltipContent rend une <div> vide.
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
