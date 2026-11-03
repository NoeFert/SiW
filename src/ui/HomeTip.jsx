import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/8bit/button.jsx';
import { TutorialHand, elementCenter, handPosition } from './TutorialParts.jsx';
import SpeechBubble from './SpeechBubble.jsx';
import { TEXT } from './strings.js';

const HAND_TARGETS = {
  welcome: '[data-tutorial="home-war"]',
  summon: '[data-tutorial="home-summon"]',
  armyRecruit: '[data-tutorial="home-army"]',
};

// Conseil de l'accueil : bulle et main, rien n'est figé.
export default function HomeTip({ tip, onClose }) {
  // Re-rendu à chaque frame pour animer la main.
  const [, forceRender] = useState(0);
  useEffect(() => {
    let frameId;
    const loop = () => {
      forceRender((n) => n + 1);
      frameId = requestAnimationFrame(loop);
    };
    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const target = elementCenter(HAND_TARGETS[tip]);

  return (
    <div className="pointer-events-none fixed inset-0 z-40">
      <div className="absolute inset-x-0 top-game flex justify-center px-4">
        <SpeechBubble
          action={(
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={onClose}
              aria-label={TEXT.homeTips.close}
              className="text-white hover:bg-transparent hover:text-white"
            >
              <X />
            </Button>
          )}
        >
          {TEXT.homeTips[tip]}
        </SpeechBubble>
      </div>
      {target && <TutorialHand position={handPosition([target], performance.now())} />}
    </div>
  );
}
