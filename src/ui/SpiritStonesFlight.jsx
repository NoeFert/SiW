import { useEffect, useRef } from 'react';
import { SpiritStoneIcon } from './SpiritStonesBalance.jsx';

const FLIGHT_MS = 700;
const STAGGER_MS = 90;
const ICON_HALF = 11;

// Gemmes qui volent de `from` à `to` (px écran) ; `onDone` à l'arrivée de la dernière.
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
