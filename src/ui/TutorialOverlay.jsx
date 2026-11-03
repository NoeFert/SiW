import { Button } from '@/components/ui/8bit/button.jsx';
import { continueTutorial, visibleTutorialStep, weakestPlayerUnit } from '../logic/battles/tutorial.js';
import { playerDeploymentColumns } from '../logic/battles/deployment.js';
import { canvasToScreen, getCanvasRect, gridToScreen } from '../renderConstants.js';
import { TutorialHand, elementCenter, handPosition } from './TutorialParts.jsx';
import SpeechBubble from './SpeechBubble.jsx';
import { TEXT } from './strings.js';

// Cibles de la main : position à l'écran, ou null.
const HAND_TARGETS = {
  basicUnitRow: () => elementCenter('[data-tutorial="basic-unit"]'),
  basicUnitPresenceTag: () => elementCenter('[data-tutorial="basic-unit"] [data-tutorial="presence-tag"]'),
  presenceGauge: () => elementCenter('[data-tutorial="presence-gauge"]'),
  fleeOrder: () => elementCenter('[data-tutorial="order-flee"]'),
  deploymentZone: ({ battle, canvasRect }) => canvasRect
    && gridToScreen(canvasRect, Math.floor(playerDeploymentColumns(battle.grid) / 2), Math.floor(battle.grid.height / 2)),
  weakestPlayerUnit: (context) => unitOnScreen(context, weakestPlayerUnit(context.battle)),
};

function unitOnScreen({ canvasRect, unitDisplayCenter }, unit) {
  if (!canvasRect || !unit) return null;
  const shown = unitDisplayCenter(unit);
  return shown ? canvasToScreen(canvasRect, shown.x, shown.y) : gridToScreen(canvasRect, unit.x, unit.y, unit.size);
}

// Overlay du tutoriel : message et main, ne capte aucun clic hors du message.
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
          <SpeechBubble
            action={step.continueButton && (
              <Button size="sm" onClick={() => continueTutorial(battle)}>{TEXT.tutorial.continue}</Button>
            )}
          >
            {TEXT.tutorial[step.message]}
          </SpeechBubble>
        </div>
      )}

      {hand && <TutorialHand position={hand} />}
    </div>
  );
}
