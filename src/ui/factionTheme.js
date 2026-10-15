import { FACTIONS } from '../data/factions/index.js';

// Thème d'interface de la faction du joueur, tiré de ses données (src/data/factions/) : sa
// couleur principale (`color`) et sa palette (`uiColor`, dossier assets/ui/<uiColor>/). Pour
// changer les couleurs d'une faction, il suffit de modifier ces deux champs.

// Chemin d'un asset d'interface : assets/ui/<couleur>/<nom>.png, ou assets/ui/<nom>.png pour un
// asset neutre (sans couleur).
export function uiAsset(name, color = null) {
  return color ? `/ui/${color}/${name}.png` : `/ui/${name}.png`;
}

// Fichiers que doit contenir le dossier de chaque palette utilisée par une faction (vérifié par
// tests/ui/factionTheme.test.js).
export const PALETTE_FILES = [
  'badge-faction', 'bar-fill-faction', 'button-highlighted',
  'corner-top-left', 'corner-top-right', 'corner-bottom-left', 'corner-bottom-right',
  'cursor-arrow', 'cursor-hand', 'cursor-grab', 'cursor-unavailable',
  'scrollbar-handle', 'scrollbar-handle-highlighted',
  'war-slot', 'war-slot-won', 'war-selector', 'war-boss-slot', 'war-boss-slot-won', 'war-boss-selector',
  'war-connector-horizontal', 'war-connector-vertical',
];

// Réglages de chaque palette qui ne sont pas des images : couleur de la barre de défilement sous
// Firefox (pas d'image possible), texte du badge de la faction, survol du menu de l'accueil.
const PALETTE_COLORS = {
  gold: { scrollbar: '#eeb632', badgeText: 'var(--faction-color)', menuHover: 'var(--faction-color)' },
  purple: { scrollbar: '#8061e6', badgeText: 'black', menuHover: '#c4b5fd' },
};

// Variables CSS du thème d'une faction, lues par pixel-ui.css et par les classes Tailwind
// `text-faction` / `bg-faction` (index.css).
export function themeVariables(faction) {
  const asset = (name) => `url("${uiAsset(name, faction.uiColor)}")`;
  const colors = PALETTE_COLORS[faction.uiColor];
  return {
    '--faction-color': faction.color,
    '--ui-button-highlighted': asset('button-highlighted'),
    '--ui-badge-faction': asset('badge-faction'),
    '--ui-badge-faction-text': colors.badgeText,
    '--ui-bar-fill-faction': asset('bar-fill-faction'),
    '--ui-scrollbar-handle': asset('scrollbar-handle'),
    '--ui-scrollbar-handle-highlighted': asset('scrollbar-handle-highlighted'),
    '--ui-scrollbar-color': colors.scrollbar,
    '--ui-menu-hover': colors.menuHover,
    '--cursor-arrow': asset('cursor-arrow'),
    '--cursor-hand': asset('cursor-hand'),
    '--cursor-grab': asset('cursor-grab'),
    '--cursor-unavailable': asset('cursor-unavailable'),
  };
}

// Pose le thème de la faction `factionId` sur <html> (il couvre aussi les tooltips et dialogues
// rendus hors de l'app), ou le retire sans faction (intro, choix de faction) : pixel-ui.css
// reprend alors ses valeurs par défaut (accents violets, curseurs blancs).
export function applyFactionTheme(factionId) {
  const { style } = document.documentElement;
  const variables = factionId ? themeVariables(FACTIONS[factionId]) : {};
  for (const name of Object.keys(themeVariables(FACTIONS.wyrms))) {
    if (variables[name]) style.setProperty(name, variables[name]);
    else style.removeProperty(name);
  }
}
