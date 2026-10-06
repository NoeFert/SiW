import {
  Item, ItemActions, ItemContent, ItemDescription,
} from '@/components/ui/8bit/item.jsx';

// technical.md 5.5 : éléments communs aux tutoriels (bataille et accueil) — la bulle de message
// et la main qui montre l'action attendue.

// Main blanche des curseurs (assets/ui, 18×24 déjà agrandie ×2), affichée encore ×2 ; le bout
// de l'index est au même point chaud que le curseur CSS (7, 1), ×2.
const HAND_SCALE = 2;
const HAND_TIP = { x: 7 * HAND_SCALE, y: 1 * HAND_SCALE };
const HAND_PERIOD_MS = 6500; // durée d'un aller-retour de la main

// Centre à l'écran d'un élément repéré par un sélecteur (`data-tutorial`), ou null.
export function elementCenter(selector) {
  const rect = document.querySelector(selector)?.getBoundingClientRect();
  return rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : null;
}

// Position de la main à l'instant `now` : aller-retour doux entre deux points, ou petit
// tapotement vertical sur un point unique.
export function handPosition(targets, now) {
  const phase = (1 - Math.cos((now / HAND_PERIOD_MS) * 2 * Math.PI)) / 2; // 0 -> 1 -> 0
  const [from, to] = targets;
  if (!to) return { x: from.x, y: from.y + phase * 12 };
  return { x: from.x + (to.x - from.x) * phase, y: from.y + (to.y - from.y) * phase };
}

// Main posée (bout de l'index) sur `position`, en px écran ; à placer dans un conteneur `fixed`.
export function TutorialHand({ position }) {
  return (
    <img
      src="/ui/cursor-hand-white.png"
      alt=""
      draggable={false}
      className="pixelated pointer-events-none absolute"
      style={{
        left: position.x - HAND_TIP.x, top: position.y - HAND_TIP.y, width: 18 * HAND_SCALE, height: 24 * HAND_SCALE,
      }}
    />
  );
}

// Bulle de message (composant Item 8bitcn) ; `action` : bouton éventuel à droite du texte.
export function TutorialBubble({ children, action = null }) {
  return (
    <Item
      variant="outline"
      className="pointer-events-auto max-w-2xl rounded-none border-4 border-white bg-neutral-950 text-white shadow-[6px_6px_0_#000]"
    >
      <ItemContent>
        <ItemDescription className="line-clamp-none whitespace-pre-line text-xs leading-relaxed text-white">
          {children}
        </ItemDescription>
      </ItemContent>
      {action && <ItemActions>{action}</ItemActions>}
    </Item>
  );
}
