import { FACTIONS } from '../data/factions/index.js';
import { spritePath } from '../data/sprites.js';
import SpeechBubble from './SpeechBubble.jsx';

export const SOVEREIGN_SLIDE_MS = 1000;

// `side` : 'left' ou 'right' ; pas de bulle si `line` est vide.
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
        // Clé = la réplique : fondu à chaque nouvelle réplique.
        <SpeechBubble key={line} action={action} className="animate-in fade-in">
          {line}
        </SpeechBubble>
      )}
    </div>
  );
}
