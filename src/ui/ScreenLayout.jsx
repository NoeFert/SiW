import '@/components/ui/8bit/styles/pixel-ui.css';
import ArrowButton from './ArrowButton.jsx';
import { TEXT } from './strings.js';

// GRAPHICS.md « Interface » : mise en page plein écran des écrans de la couche méta (Partir en
// guerre, unités, Armées, Invocation), comme l'accueil — flèche « Retour » et titre en haut à
// gauche, séparateur noir (DividerD) sur toute la largeur, puis le contenu sur toute la surface
// restante (défilant si besoin). `background` (facultatif) : calque de fond posé derrière tout
// l'écran, jusqu'au bord de la fenêtre (padding du jeu compris, -inset-12).
export default function ScreenLayout({
  title, onBack, background = null, children,
}) {
  return (
    <div className="relative isolate flex h-full w-full flex-col gap-6 text-white">
      {background && <div className="absolute -inset-12 -z-10">{background}</div>}
      <header className="flex items-center gap-6">
        <ArrowButton direction="left" label={TEXT.back} onClick={onBack} />
        <h1 className="retro text-lg">{title}</h1>
      </header>
      <span aria-hidden className="pixel-divider -mt-3 w-full" />
      <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
