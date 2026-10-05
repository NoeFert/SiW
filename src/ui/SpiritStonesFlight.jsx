import { useEffect, useRef } from 'react';
import { SpiritStoneIcon } from './SpiritStonesBalance.jsx';

const FLIGHT_MS = 700;
const STAGGER_MS = 90;
const ICON_HALF = 11; // icône de 22 px

// GRAPHICS.md « Spirit Fountain » : à la récolte, `count` gemmes partent de `from` et volent
// jusqu'au solde (`to`), l'une après l'autre ; `onDone` quand la dernière est arrivée. Points en
// px écran (position fixe), centres des deux icônes.
export default function SpiritStonesFlight({
  from, to, count, onDone,
}) {
  const icons = useRef([]);

  useEffect(() => {
    const animations = icons.current.map((icon, i) => icon.animate(
      [
        { transform: 'translate(0, 0) scale(1)' },
        { transform: `translate(${to.x - from.x}px, ${to.y - from.y}px) scale(0.8)` },
      ],
      {
        duration: FLIGHT_MS, delay: i * STAGGER_MS, easing: 'cubic-bezier(0.5, 0, 0.75, 0)', fill: 'forwards',
      },
    ));
    animations.at(-1).finished.then(onDone, () => {});
    return () => animations.forEach((animation) => animation.cancel());
  }, [from, to, onDone]);

  return Array.from({ length: count }, (_, i) => (
    <span
      key={i}
      ref={(icon) => { icons.current[i] = icon; }}
      className="pointer-events-none fixed z-50 flex"
      style={{ left: from.x - ICON_HALF, top: from.y - ICON_HALF }}
    >
      <SpiritStoneIcon />
    </span>
  ));
}
