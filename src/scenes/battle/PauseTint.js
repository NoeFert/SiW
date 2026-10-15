import { getClickableHighlights } from '../../logic/battles/orderSelection.js';

// Signaux de pause (ui-battle-screen-decisions.md 3) : le terrain est désaturé via un FX
// ColorMatrix (-1 = niveaux de gris) — complètement pendant la pause principale, partiellement
// pendant une pause d'interaction ou une étape figée du tutoriel. Ce qui est cliquable
// (getClickableHighlights) garde ses couleurs. Pas de calque opaque : tout reste visible et
// cliquable. Sans WebGL (fallback Canvas), preFX n'existe pas et le signal est absent.
const FULL_DESATURATION = -1;
const PARTIAL_DESATURATION = -0.7;

function desaturationLevel(pause) {
  if (pause.main) return FULL_DESATURATION;
  if (pause.interaction || pause.tutorial) return PARTIAL_DESATURATION;
  return 0;
}

// Applique le signal de pause de `battle` au terrain (BattlefieldView) et aux unités (UnitViews).
export function applyPauseTint(battle, battlefield, units) {
  const level = desaturationLevel(battle.pause);
  const { zone, unitIds } = getClickableHighlights(battle);
  battlefield.tint(level, zone);
  units.tint(level, unitIds);
}
