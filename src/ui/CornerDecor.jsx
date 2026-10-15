import { uiAsset } from './factionTheme.js';

// GRAPHICS.md « Interface » : quatre coins décoratifs (Decorators/BorderC du pack, 11×11 à 2×)
// posés dans les coins de l'élément parent, qui doit être positionné (relative). `color` :
// dossier de couleur des coins (assets/ui/<color>/), 'gold' ou 'purple'.
const CORNERS = [
  ['top-left', 'top-0 left-0'],
  ['top-right', 'top-0 right-0'],
  ['bottom-left', 'bottom-0 left-0'],
  ['bottom-right', 'bottom-0 right-0'],
];

export default function CornerDecor({ color }) {
  return CORNERS.map(([corner, position]) => (
    <img
      key={corner}
      src={uiAsset(`corner-${corner}`, color)}
      alt=""
      className={`pixelated pointer-events-none absolute size-5.5 ${position}`}
    />
  ));
}
