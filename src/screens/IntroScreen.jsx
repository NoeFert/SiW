import { Button } from '@/components/ui/8bit/button.jsx';
import { TEXT } from '../ui/strings.js';

export default function IntroScreen({ onContinue }) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-12 text-white">
      <h1 className="retro flex items-baseline gap-3 text-4xl">
        <span>{TEXT.title.first}</span>
        <span className="text-lg">{TEXT.title.middle}</span>
        <span>{TEXT.title.last}</span>
      </h1>
      <div className="retro flex flex-col gap-4 max-w-3xl px-8 text-center text-sm leading-loose">
        {TEXT.introLines.map((line) => <p key={line}>{line}</p>)}
      </div>
      <Button onClick={onContinue}>{TEXT.start}</Button>
    </div>
  );
}
