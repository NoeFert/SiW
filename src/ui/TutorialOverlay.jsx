import { Button } from '@/components/ui/8bit/button.jsx';
import {
  Item, ItemActions, ItemContent, ItemDescription,
} from '@/components/ui/8bit/item.jsx';
import { continueTutorial, visibleTutorialStep, weakestPlayerUnit } from '../logic/tutorial.js';
import { canvasToScreen, getCanvasRect, gridToScreen } from '../renderConstants.js';
import { interactionState } from '../state/interactionState.js';
import { useBattle } from './useBattle.js';
import { TEXT } from './strings.js';

// Main blanche des curseurs (assets/ui, 18×24 déjà agrandie ×2), affichée encore ×2 ; le bout
// de l'index est au même point chaud que le curseur CSS (7, 1), ×2.
const HAND_SCALE = 2;
const HAND_TIP = { x: 7 * HAND_SCALE, y: 1 * HAND_SCALE };
const HAND_PERIOD_MS = 6500; // durée d'un aller-retour de la main

// Centre à l'écran d'un élément de la tour repéré par `data-tutorial`.
function elementCenter(selector) {
  const rect = document.querySelector(selector)?.getBoundingClientRect();
  return rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : null;
}

// Cibles possibles de la main, par nom (champ `hand` des étapes, src/data/tutorials.js) :
// position à l'écran, ou null si la cible n'existe pas en ce moment (la main l'ignore).
const HAND_TARGETS = {
  basicUnitRow: () => elementCenter('[data-tutorial="basic-unit"]'),
  basicUnitPresenceTag: () => elementCenter('[data-tutorial="basic-unit"] [data-tutorial="presence-tag"]'),
  presenceGauge: () => elementCenter('[data-tutorial="presence-gauge"]'),
  fleeOrder: () => elementCenter('[data-tutorial="order-flee"]'),
  // Centre de la zone de déploiement du joueur (moitié gauche du terrain).
  deploymentZone: (battle, canvasRect) => canvasRect
    && gridToScreen(canvasRect, Math.floor(battle.grid.width / 4), Math.floor(battle.grid.height / 2)),
  playerUnit: (battle, canvasRect) => unitOnScreen(
    canvasRect, battle.units.find((u) => u.faction === 'player' && u.isOnField),
  ),
  weakestPlayerUnit: (battle, canvasRect) => unitOnScreen(canvasRect, weakestPlayerUnit(battle)),
};

// Centre à l'écran du sprite affiché de `unit` (publié par la Scene), sinon de sa case.
function unitOnScreen(canvasRect, unit) {
  if (!canvasRect || !unit) return null;
  const shown = interactionState.unitDisplayCenter?.(unit);
  return shown ? canvasToScreen(canvasRect, shown.x, shown.y) : gridToScreen(canvasRect, unit.x, unit.y, unit.size);
}

// Position de la main à l'instant `now` : aller-retour doux entre deux points, ou petit
// tapotement vertical sur un point unique.
function handPosition(targets, now) {
  const phase = (1 - Math.cos((now / HAND_PERIOD_MS) * 2 * Math.PI)) / 2; // 0 -> 1 -> 0
  const [from, to] = targets;
  if (!to) return { x: from.x, y: from.y + phase * 12 };
  return { x: from.x + (to.x - from.x) * phase, y: from.y + (to.y - from.y) * phase };
}

// technical.md 5.5 : overlay du tutoriel, seul élément (avec les tooltips) autorisé par-dessus
// le terrain. Il ne fait qu'afficher l'étape en cours (src/logic/tutorial.js, contenu dans
// src/data/tutorials.js) : message en
// haut du terrain, main qui montre l'action attendue. Il ne capte aucun clic hors du message.
export default function TutorialOverlay() {
  const battle = useBattle(); // re-rendu à chaque frame : la main s'anime avec
  const step = battle && battle.outcome === 'ongoing' ? visibleTutorialStep(battle) : null;
  if (!step) return null;

  const canvasRect = getCanvasRect();
  const targets = (step.hand ?? []).map((name) => HAND_TARGETS[name](battle, canvasRect)).filter(Boolean);
  const hand = targets.length > 0 ? handPosition(targets, performance.now()) : null;

  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      {canvasRect && (
        <div
          className="absolute flex justify-center px-4"
          style={{ left: canvasRect.left, width: canvasRect.width, top: canvasRect.top + 16 }}
        >
          <Item
            variant="outline"
            className="pointer-events-auto max-w-2xl rounded-none border-4 border-white bg-neutral-950 text-white shadow-[6px_6px_0_#000]"
          >
            <ItemContent>
              <ItemDescription className="line-clamp-none text-xs leading-relaxed text-white">
                {TEXT.tutorial[step.message]}
              </ItemDescription>
            </ItemContent>
            {step.continueButton && (
              <ItemActions>
                <Button size="sm" onClick={() => continueTutorial(battle)}>{TEXT.tutorial.continue}</Button>
              </ItemActions>
            )}
          </Item>
        </div>
      )}

      {hand && (
        <img
          src="/ui/cursor-hand-white.png"
          alt=""
          draggable={false}
          className="pixelated absolute"
          style={{ left: hand.x - HAND_TIP.x, top: hand.y - HAND_TIP.y, width: 18 * HAND_SCALE, height: 24 * HAND_SCALE }}
        />
      )}
    </div>
  );
}
