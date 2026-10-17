import { Button } from '@/components/ui/8bit/button.jsx';
import { continueTutorial, visibleTutorialStep, weakestPlayerUnit } from '../logic/battles/tutorial.js';
import { playerDeploymentColumns } from '../logic/battles/deployment.js';
import { canvasToScreen, getCanvasRect, gridToScreen } from '../renderConstants.js';
import {
  TutorialBubble, TutorialHand, elementCenter, handPosition,
} from './TutorialParts.jsx';
import { TEXT } from './strings.js';

// Cibles possibles de la main, par nom (champ `hand` des étapes, src/data/tutorials.js) :
// position à l'écran, ou null si la cible n'existe pas en ce moment (la main l'ignore).
// `context` : { battle, canvasRect, unitDisplayCenter }.
const HAND_TARGETS = {
  basicUnitRow: () => elementCenter('[data-tutorial="basic-unit"]'),
  basicUnitPresenceTag: () => elementCenter('[data-tutorial="basic-unit"] [data-tutorial="presence-tag"]'),
  presenceGauge: () => elementCenter('[data-tutorial="presence-gauge"]'),
  fleeOrder: () => elementCenter('[data-tutorial="order-flee"]'),
  // Centre de la zone de déploiement du joueur (premier quart du terrain, rules.md 2).
  deploymentZone: ({ battle, canvasRect }) => canvasRect
    && gridToScreen(canvasRect, Math.floor(playerDeploymentColumns(battle.grid) / 2), Math.floor(battle.grid.height / 2)),
  weakestPlayerUnit: (context) => unitOnScreen(context, weakestPlayerUnit(context.battle)),
};

// Centre à l'écran du sprite affiché de `unit` (position demandée à la Scene), sinon de sa case.
function unitOnScreen({ canvasRect, unitDisplayCenter }, unit) {
  if (!canvasRect || !unit) return null;
  const shown = unitDisplayCenter(unit);
  return shown ? canvasToScreen(canvasRect, shown.x, shown.y) : gridToScreen(canvasRect, unit.x, unit.y, unit.size);
}

// technical.md 5.5 : overlay du tutoriel, seul élément (avec les tooltips) autorisé par-dessus
// le terrain. Il ne fait qu'afficher l'étape en cours (src/logic/battles/tutorial.js, contenu dans
// src/data/tutorials.js) : message en
// haut du terrain, main qui montre l'action attendue. Il ne capte aucun clic hors du message.
// `battle` : la bataille en cours ; BattleScreen.jsx redessine l'overlay à chaque frame, ce qui
// anime la main. `unitDisplayCenter(unit)` : position affichée du sprite d'une unité (Scene).
export default function TutorialOverlay({ battle, unitDisplayCenter }) {
  const step = battle.outcome === 'ongoing' ? visibleTutorialStep(battle) : null;
  if (!step) return null;

  const canvasRect = getCanvasRect();
  const context = { battle, canvasRect, unitDisplayCenter };
  const targets = (step.hand ?? []).map((name) => HAND_TARGETS[name](context)).filter(Boolean);
  const hand = targets.length > 0 ? handPosition(targets, performance.now()) : null;

  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      {canvasRect && (
        <div
          className="absolute flex justify-center px-4"
          style={{ left: canvasRect.left, width: canvasRect.width, top: canvasRect.top + 16 }}
        >
          <TutorialBubble
            action={step.continueButton && (
              <Button size="sm" onClick={() => continueTutorial(battle)}>{TEXT.tutorial.continue}</Button>
            )}
          >
            {TEXT.tutorial[step.message]}
          </TutorialBubble>
        </div>
      )}

      {hand && <TutorialHand position={hand} />}
    </div>
  );
}
