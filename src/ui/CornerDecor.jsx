import { uiAsset } from './factionTheme.js';

// Coins décoratifs ; le parent doit être en position relative.
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
