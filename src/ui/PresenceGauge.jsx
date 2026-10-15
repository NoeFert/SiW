import { PRESENCE_CAP } from '../logic/battles/deployment.js';

// Classes littérales (Tailwind ne détecte pas les noms construits dynamiquement).
const FILL_CLASS = {
  wyrms: 'bg-faction-wyrms',
  undead: 'bg-faction-undead',
};

// Fiole du pack (ValueBars/White : FlaskBackground et FlaskForeground, 13 × 13 px) affichée à 8×.
// Son intérieur fait 9 × 9 px à 2 px du bord ; le remplissage (couleur de la faction, pas les
// FlaskFill du pack) y est découpé à la forme ronde de l'intérieur, pixel par pixel.
const SCALE = 8;
const INNER_CLIP = 'polygon('
  + [[2, 0], [7, 0], [7, 1], [8, 1], [8, 2], [9, 2], [9, 7], [8, 7], [8, 8], [7, 8], [7, 9], [2, 9],
    [2, 8], [1, 8], [1, 7], [0, 7], [0, 2], [1, 2], [1, 1], [2, 1]]
    .map(([x, y]) => `${(x / 9) * 100}% ${(y / 9) * 100}%`).join(', ')
  + ')';

// ui-battle-screen-decisions.md 2.1 : fiole qui se remplit de bas en haut, comme un liquide,
// selon les points de présence sur le terrain, avec le ratio par-dessus.
export default function PresenceGauge({ used, playerFaction }) {
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
            className={`absolute inset-x-0 bottom-0 transition-[height] duration-300 ${FILL_CLASS[playerFaction]}`}
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
