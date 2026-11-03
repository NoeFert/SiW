import '@/components/ui/8bit/styles/pixel-ui.css';
import ArrowButton from './ArrowButton.jsx';
import { TEXT } from './strings.js';

// Mise en page des écrans de la couche méta. `background` : calque de fond facultatif.
export default function ScreenLayout({
  title, onBack, background = null, children,
}) {
  return (
    <div className="relative isolate flex h-full w-full flex-col gap-6 text-white">
      {background && <div className="absolute -inset-game -z-10">{background}</div>}
      <header className="flex items-center gap-6">
        <ArrowButton direction="left" label={TEXT.back} onClick={onBack} />
        <h1 className="retro text-lg">{title}</h1>
      </header>
      <span aria-hidden className="pixel-divider -mt-3 w-full" />
      <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
