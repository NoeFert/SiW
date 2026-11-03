import { getClickableHighlights } from '../../logic/battles/orderSelection.js';

// Signal de pause : désaturation du terrain, sauf ce qui est cliquable. Absent sans WebGL.
const FULL_DESATURATION = -1;
const PARTIAL_DESATURATION = -0.7;

function desaturationLevel(pause) {
  if (pause.main) return FULL_DESATURATION;
  if (pause.interaction || pause.tutorial) return PARTIAL_DESATURATION;
  return 0;
}

export function applyPauseTint(battle, battlefield, units) {
  const level = desaturationLevel(battle.pause);
  const { zone, unitIds } = getClickableHighlights(battle);
  battlefield.tint(level, zone);
  units.tint(level, unitIds);
}
