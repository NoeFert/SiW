import { SPECIES_SPRITES } from '../data/sprites.js';
import { invaderSpecies } from '../logic/war.js';
import { uiAsset } from './factionTheme.js';
import SpeciesSprite from './SpeciesSprite.jsx';

// GRAPHICS.md « Partir en guerre » : map en arbre de compétences (sprites SkillTree du pack, à
// 2×), dans la palette de la faction du joueur (`uiColor` de src/data/factions/), comme les
// accents de l'interface ; gris pour ce qui est verrouillé.
const SLOT = 42; // losange 21×21 à 2×, pointes au milieu des côtés
const BOSS_SLOT = 56; // losange du boss, plus grand : SkillSlotLarge 28×28 à 2×
const HALF = SLOT / 2;
const STEP = 80; // distance entre deux cases de la grille de la map

const uiSprite = (name, color) => `url(${uiAsset(name, color)})`;
const slotCenter = ({ col, row }) => ({ x: HALF + col * STEP, y: HALF + row * STEP });
const slotSize = (node) => (node.boss ? BOSS_SLOT : SLOT);

// Losange d'un emplacement : vide si disponible, plein si gagné, gris si verrouillé ; plus grand
// pour le boss. Le sélecteur (à 3×, une fois et demie le losange) entoure l'emplacement choisi.
function Slot({ node, color, selected, onSelect }) {
  const { x, y } = slotCenter(node);
  const size = slotSize(node);
  const prefix = node.boss ? 'war-boss' : 'war';
  const slotColor = node.state === 'locked' ? 'grey' : color;
  const sprite = uiSprite(node.state === 'won' ? `${prefix}-slot-won` : `${prefix}-slot`, slotColor);
  const selector = size * 1.5;
  return (
    <button
      type="button"
      onClick={onSelect}
      className="absolute cursor-pointer hover:brightness-125"
      style={{ left: x - size / 2, top: y - size / 2, width: size, height: size }}
    >
      {/* Intérieur noir du losange, pour qu'il se détache du fond de la map. */}
      <span className="absolute rotate-45 bg-black/80" style={{ inset: size / 7 }} />
      <span className="pixelated absolute inset-0 bg-size-[100%_100%]" style={{ backgroundImage: sprite }} />
      {selected && (
        <span
          className="pixelated absolute bg-size-[100%_100%]"
          style={{
            left: (size - selector) / 2,
            top: (size - selector) / 2,
            width: selector,
            height: selector,
            backgroundImage: uiSprite(`${prefix}-selector`, slotColor),
          }}
        />
      )}
    </button>
  );
}

// Envahisseur posé au-dessus de son emplacement : le sprite de l'espèce ennemie, tourné vers la
// gauche comme l'IA en bataille (rules.md 2), plus grand pour le [Légendaire], à INVADER_GAP de la
// pointe haute du losange. Assombri, il s'éclaire quand son losange est sélectionné, pour montrer
// qu'ils vont ensemble.
const INVADER_SIZE = { basic: 40, flying: 40, legendary: 64 };
const INVADER_GAP = 5;
function Invader({ node, enemyRoster, selected }) {
  const species = invaderSpecies(enemyRoster, node.invader);
  const size = INVADER_SIZE[node.invader];
  const { x, y } = slotCenter(node);
  const flip = SPECIES_SPRITES[species.name].facing === 'right' ? '-scale-x-100' : '';
  return (
    <SpeciesSprite
      species={species}
      className={`pointer-events-none absolute ${flip} ${selected ? 'brightness-125' : 'brightness-75'}`}
      style={{
        left: x - size / 2, top: y - slotSize(node) / 2 - INVADER_GAP - size, width: size, height: size,
      }}
    />
  );
}

// Connecteur droit entre deux emplacements liés (même ligne ou même colonne), de pointe à pointe.
// Gris dès qu'un des deux bouts est verrouillé.
function Connector({ from, to, color }) {
  const a = slotCenter(from);
  const b = slotCenter(to);
  const vertical = a.x === b.x;
  // Demi-tailles des losanges aux deux bouts : `first` est celui du haut (ou de gauche).
  const [first, last] = (vertical ? a.y < b.y : a.x < b.x) ? [from, to] : [to, from];
  const start = slotSize(first) / 2;
  const gap = start + slotSize(last) / 2;
  const style = vertical
    ? { left: a.x - 16, top: Math.min(a.y, b.y) + start, width: 32, height: Math.abs(a.y - b.y) - gap }
    : { left: Math.min(a.x, b.x) + start, top: a.y - 16, width: Math.abs(a.x - b.x) - gap, height: 32 };
  return (
    <div
      className={`pixelated absolute bg-size-[32px_32px] ${vertical ? 'bg-repeat-y' : 'bg-repeat-x'}`}
      style={{ ...style, backgroundImage: uiSprite(`war-connector-${vertical ? 'vertical' : 'horizontal'}`, color) }}
    />
  );
}

// Taille de la map à l'échelle 1 (px), marges comprises, pour que rien ne dépasse et que la mise
// en page ne bouge pas avec la sélection : en haut, les envahisseurs de la ligne du haut ; en
// bas, le sélecteur (une fois et demie le losange) d'un emplacement de la ligne du bas.
export function warMapSize(map, nodes) {
  const marginTop = Math.max(0, ...nodes.filter((node) => node.invader).map(
    (node) => INVADER_SIZE[node.invader] + INVADER_GAP + slotSize(node) / 2 - slotCenter(node).y,
  ));
  const marginBottom = SLOT / 4;
  const width = SLOT + (map.cols - 1) * STEP;
  const height = SLOT + (map.rows - 1) * STEP;
  return {
    width, height, marginTop, totalHeight: marginTop + height + marginBottom,
  };
}

// La map d'une guerre (rules.md 11.7), à l'échelle `scale` : liaisons, emplacements et
// envahisseurs. `nodes` : emplacements de la map avec leur état ('available', 'won', 'locked') ;
// `color` : palette de la faction du joueur ; `enemyRoster` : roster de l'IA (envahisseurs).
export default function WarMap({
  map, nodes, color, enemyRoster, selectedId, onSelect, scale,
}) {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const size = warMapSize(map, nodes);
  return (
    <div className="shrink-0" style={{ width: size.width * scale, height: size.totalHeight * scale }}>
      <div
        className="relative origin-top-left"
        style={{
          width: size.width, height: size.height, top: size.marginTop * scale, transform: `scale(${scale})`,
        }}
      >
        {map.links.map(([a, b]) => {
          const from = byId.get(a);
          const to = byId.get(b);
          const linkColor = from.state === 'locked' || to.state === 'locked' ? 'grey' : color;
          return <Connector key={`${a}-${b}`} from={from} to={to} color={linkColor} />;
        })}
        {nodes.map((node) => (
          <Slot
            key={node.id}
            node={node}
            color={color}
            selected={node.id === selectedId}
            onSelect={() => onSelect(node.id)}
          />
        ))}
        {nodes.filter((node) => node.invader).map((node) => (
          <Invader
            key={`invader-${node.id}`}
            node={node}
            enemyRoster={enemyRoster}
            selected={node.id === selectedId}
          />
        ))}
      </div>
    </div>
  );
}
