import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/8bit/button.jsx';
import SovereignDialogue, { SOVEREIGN_SLIDE_MS } from '../ui/SovereignDialogue.jsx';
import { TEXT } from '../ui/strings.js';

const FADE_MS = 1000;

// Durées en ms (null : le joueur avance au clic).
const STEPS = [
  { id: 'firstParagraph', ms: 4000 },
  { id: 'secondParagraph', ms: 4000 },
  { id: 'paragraphsOut', ms: FADE_MS },
  { id: 'wyrmsIn', ms: SOVEREIGN_SLIDE_MS },
  { id: 'undeadIn', ms: SOVEREIGN_SLIDE_MS },
  { id: 'dialogue', ms: null },
  { id: 'screenOut', ms: FADE_MS },
];

function stepIndex(id) {
  return STEPS.findIndex((step) => step.id === id);
}

const fade = { '--tw-animation-duration': `${FADE_MS}ms` };

export default function PrologueScreen({ onContinue }) {
  const [step, setStep] = useState(0);
  const [lineIndex, setLineIndex] = useState(0);
  const reached = (id) => step >= stepIndex(id);

  useEffect(() => {
    if (step === STEPS.length) {
      onContinue();
      return undefined;
    }
    const { ms } = STEPS[step];
    if (ms === null) return undefined;
    const timer = setTimeout(() => setStep(step + 1), ms);
    return () => clearTimeout(timer);
  }, [step, onContinue]);

  const { dialogue } = TEXT.prologue;
  const line = step === stepIndex('dialogue') ? dialogue[lineIndex] : null;
  const nextLine = () => {
    if (lineIndex + 1 < dialogue.length) setLineIndex(lineIndex + 1);
    else setStep(step + 1);
  };
  const bubbleProps = (faction) => (line?.speaker === faction
    ? { line: line.text, action: <Button onClick={nextLine}>{TEXT.tutorial.continue}</Button> }
    : {});

  return (
    <div
      className={`h-full w-full text-white ${step === stepIndex('screenOut') ? 'animate-out fade-out fill-mode-forwards' : ''}`}
      style={fade}
    >
      {!reached('wyrmsIn') && (
        <div
          className={`retro h-full flex flex-col items-center justify-center gap-8 max-w-3xl mx-auto px-8 text-center text-sm leading-loose ${step === stepIndex('paragraphsOut') ? 'animate-out fade-out fill-mode-forwards' : ''}`}
          style={fade}
        >
          {TEXT.prologue.paragraphs.slice(0, step + 1).map((paragraph) => (
            <p key={paragraph} className="animate-in fade-in" style={fade}>{paragraph}</p>
          ))}
        </div>
      )}
      {reached('wyrmsIn') && (
        <div className="h-full flex items-center">
          <SovereignDialogue faction="wyrms" side="left" {...bubbleProps('wyrms')} />
          {reached('undeadIn') && (
            <SovereignDialogue faction="undead" side="right" {...bubbleProps('undead')} />
          )}
        </div>
      )}
    </div>
  );
}
