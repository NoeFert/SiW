import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/8bit/button.jsx';
import {
  TutorialBubble, TutorialHand, elementCenter, handPosition,
} from './TutorialParts.jsx';
import { TEXT } from './strings.js';

// Entrée de l'accueil que la main montre, par conseil (repérée par `data-tutorial`).
const HAND_TARGETS = {
  welcome: '[data-tutorial="home-war"]',
  summon: '[data-tutorial="home-summon"]',
  armyRecruit: '[data-tutorial="home-army"]',
};

// technical.md 5.5 : conseil du tutoriel de l'accueil — bulle en haut de l'écran et main qui
// tapote l'entrée concernée. Rien n'est figé : tout reste cliquable ; [×] ferme le conseil.
export default function HomeTip({ tip, onClose }) {
  // Re-rendu à chaque frame : la main s'anime et suit la mise en page.
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
        <TutorialBubble
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
        </TutorialBubble>
      </div>
      {target && <TutorialHand position={handPosition([target], performance.now())} />}
    </div>
  );
}
