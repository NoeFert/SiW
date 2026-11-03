// Le bout de l'index est au point chaud du curseur CSS.
const HAND_SCALE = 2;
const HAND_TIP = { x: 7 * HAND_SCALE, y: 1 * HAND_SCALE };
const HAND_PERIOD_MS = 6500; // aller-retour de la main

export function elementCenter(selector) {
  const rect = document.querySelector(selector)?.getBoundingClientRect();
  return rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : null;
}

export function handPosition(targets, now) {
  const phase = (1 - Math.cos((now / HAND_PERIOD_MS) * 2 * Math.PI)) / 2; // 0 -> 1 -> 0
  const [from, to] = targets;
  if (!to) return { x: from.x, y: from.y + phase * 12 };
  return { x: from.x + (to.x - from.x) * phase, y: from.y + (to.y - from.y) * phase };
}

export function TutorialHand({ position }) {
  return (
    <img
      src="/ui/white/cursor-hand.png"
      alt=""
      draggable={false}
      className="pixelated pointer-events-none absolute"
      style={{
        left: position.x - HAND_TIP.x, top: position.y - HAND_TIP.y, width: 18 * HAND_SCALE, height: 24 * HAND_SCALE,
      }}
    />
  );
}
