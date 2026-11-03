import { FACTIONS } from '../data/factions/index.js';

// Thème de la faction du joueur, tiré de `color` et `uiColor`.

export function uiAsset(name, color = null) {
  return color ? `/ui/${color}/${name}.png` : `/ui/${name}.png`;
}

// Vérifié par tests/ui/factionTheme.test.js.
export const PALETTE_FILES = [
  'badge-faction', 'bar-fill-faction', 'button-highlighted',
  'corner-top-left', 'corner-top-right', 'corner-bottom-left', 'corner-bottom-right',
  'cursor-arrow', 'cursor-hand', 'cursor-grab', 'cursor-unavailable',
  'scrollbar-handle', 'scrollbar-handle-highlighted',
  'war-slot', 'war-slot-won', 'war-selector', 'war-boss-slot', 'war-boss-slot-won', 'war-boss-selector',
  'war-connector-horizontal', 'war-connector-vertical',
];

const PALETTE_COLORS = {
  gold: { scrollbar: '#eeb632', badgeText: 'var(--faction-color)', menuHover: 'var(--faction-color)' },
  purple: { scrollbar: '#8061e6', badgeText: 'black', menuHover: '#c4b5fd' },
};

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

// Sur <html>, pour couvrir aussi les tooltips et dialogues.
export function applyFactionTheme(factionId) {
  const { style } = document.documentElement;
  const variables = factionId ? themeVariables(FACTIONS[factionId]) : {};
  for (const name of Object.keys(themeVariables(FACTIONS.wyrms))) {
    if (variables[name]) style.setProperty(name, variables[name]);
    else style.removeProperty(name);
  }
}
