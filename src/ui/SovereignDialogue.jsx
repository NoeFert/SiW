import { FACTIONS } from '../data/factions/index.js';
import { spritePath } from '../data/sprites.js';
import SpeechBubble from './SpeechBubble.jsx';

// Durée du glissement d'un souverain depuis son bord de l'écran (ms).
export const SOVEREIGN_SLIDE_MS = 1000;

// Un souverain qui arrive en glissant depuis son bord (`side` : 'left' ou 'right'), avec sa
// réplique `line` dans une bulle tournée vers le centre (aucune bulle si `line` est vide) ;
// `action` : bouton éventuel de la bulle. L'écran qui l'utilise décide de l'enchaînement des
// répliques.
export default function SovereignDialogue({
  faction, side, line = null, action = null,
}) {
  const fromLeft = side === 'left';
  return (
    <div className={`flex flex-1 items-center gap-6 ${fromLeft ? '' : 'flex-row-reverse'}`}>
      <img
        src={spritePath(FACTIONS[faction].sovereignSprite)}
        alt=""
        className={`pixelated h-[60vh] w-auto shrink-0 object-contain animate-in ${fromLeft ? 'slide-in-from-left-[100vw]' : 'slide-in-from-right-[100vw]'}`}
        style={{ '--tw-animation-duration': `${SOVEREIGN_SLIDE_MS}ms` }}
      />
      {line && (
        // Clé = la réplique : la bulle réapparaît en fondu à chaque nouvelle réplique.
        <SpeechBubble key={line} action={action} className="animate-in fade-in">
          {line}
        </SpeechBubble>
      )}
    </div>
  );
}
