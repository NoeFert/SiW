import { PRESENCE_CAP } from '../logic/battles/deployment.js';

// Fiole du pack à 8× ; le remplissage est découpé à sa forme ronde.
const SCALE = 8;
const INNER_CLIP = 'polygon('
  + [[2, 0], [7, 0], [7, 1], [8, 1], [8, 2], [9, 2], [9, 7], [8, 7], [8, 8], [7, 8], [7, 9], [2, 9],
    [2, 8], [1, 8], [1, 7], [0, 7], [0, 2], [1, 2], [1, 1], [2, 1]]
    .map(([x, y]) => `${(x / 9) * 100}% ${(y / 9) * 100}%`).join(', ')
  + ')';

export default function PresenceGauge({ used }) {
  const ratio = Math.min(1, used / PRESENCE_CAP);
  return (
    <div className="flex justify-center">
      <div data-tutorial="presence-gauge" className="relative" style={{ width: 13 * SCALE, height: 13 * SCALE }}>
        <img src="/ui/flask-background.png" alt="" draggable={false} className="pixelated absolute inset-0 size-full" />
        <div
          className="absolute overflow-hidden"
          style={{
            inset: 2 * SCALE, clipPath: INNER_CLIP,
          }}
        >
          <div
            className="absolute inset-x-0 bottom-0 transition-[height] duration-300 bg-faction"
            style={{ height: `${ratio * 100}%` }}
          />
        </div>
        <img src="/ui/flask-foreground.png" alt="" draggable={false} className="pixelated absolute inset-0 size-full" />
        <span className="retro absolute inset-0 flex items-center justify-center text-[11px] text-white [text-shadow:0_0_3px_#000,0_0_3px_#000]">
          {used}/{PRESENCE_CAP}
        </span>
      </div>
    </div>
  );
}
