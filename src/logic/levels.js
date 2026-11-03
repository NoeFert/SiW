// Niveaux du joueur et des individus (rules.md 11.5 et 11.6).

// --- Individus (rules.md 11.6) ---

export const INDIVIDUAL_MAX_LEVEL = 5;
export const SURVIVAL_XP_POOL = 200;

export const REPLAY_XP_PERCENT = 25;

export function replayXp(xp) {
  return Math.floor((xp * REPLAY_XP_PERCENT) / 100);
}

// 0, 50, 150, 300, 500
export function individualXpForLevel(level) {
  return 25 * (level - 1) * level;
}

export const INDIVIDUAL_MAX_XP = individualXpForLevel(INDIVIDUAL_MAX_LEVEL);

export function individualLevel(xp) {
  let level = 1;
  while (level < INDIVIDUAL_MAX_LEVEL && xp >= individualXpForLevel(level + 1)) level += 1;
  return level;
}

export function individualProgress(xp) {
  const level = individualLevel(xp);
  const isMax = level === INDIVIDUAL_MAX_LEVEL;
  const start = individualXpForLevel(level);
  return {
    level,
    isMax,
    xpInLevel: isMax ? 0 : xp - start,
    xpForLevel: isMax ? 0 : individualXpForLevel(level + 1) - start,
  };
}

// +10 % par niveau, calculé en entiers.
export function levelStat(base, level) {
  return Math.floor((base * (9 + level) + 5) / 10);
}

export function levelDamage(damage, level) {
  if (typeof damage === 'number') return levelStat(damage, level);
  return { ranged: levelStat(damage.ranged, level), melee: levelStat(damage.melee, level) };
}

// XP des individus à la victoire (rules.md 11.6). Renvoie aussi les morts et leur niveau.
export function individualXpGains(battleUnits, replay = false) {
  const deployed = battleUnits.filter((u) => u.faction === 'player' && u.individualId);
  const dead = new Map(); // individualId -> niveau à la mort
  for (const unit of deployed) if (!unit.isAlive) dead.set(unit.individualId, unit.level);
  const deployedCount = new Set(deployed.map((u) => u.individualId)).size;
  const survivalShare = deployedCount > 0 ? Math.floor(SURVIVAL_XP_POOL / deployedCount) : 0;

  const gains = new Map();
  for (const unit of deployed) {
    if (dead.has(unit.individualId)) continue;
    const previous = gains.get(unit.individualId) ?? survivalShare;
    gains.set(unit.individualId, previous + unit.killXp);
  }
  if (replay) for (const [id, xp] of gains) gains.set(id, replayXp(xp));
  return { gains, dead };
}

export function applyVictoryToUnits(units, { gains, dead }) {
  return units
    .filter((unit) => !dead.has(unit.id))
    .map((unit) => (gains.has(unit.id)
      ? { ...unit, xp: Math.min(INDIVIDUAL_MAX_XP, unit.xp + gains.get(unit.id)) }
      : unit));
}

// Passages de niveau regroupés par espèce (technical.md 5.3).
export function levelUps(before, after) {
  const afterById = new Map(after.map((unit) => [unit.id, unit]));
  const groups = new Map();
  for (const unit of before) {
    const updated = afterById.get(unit.id);
    if (!updated) continue;
    const from = individualLevel(unit.xp);
    const to = individualLevel(updated.xp);
    if (to === from) continue;
    const key = `${unit.species}-${from}-${to}`;
    const group = groups.get(key) ?? { species: unit.species, from, to, count: 0 };
    group.count += 1;
    groups.set(key, group);
  }
  return [...groups.values()];
}

export function sortByLevel(units) {
  return [...units].sort((a, b) => b.xp - a.xp);
}

// --- Joueur (rules.md 11.5) ---

export const TUTO_BATTLE_PLAYER_XP = 100;
export const VICTORY_PLAYER_XP = 100;
export const SURVIVORS_BONUS_XP = 100;

// 0, 500, 1 500...
export function playerXpForLevel(level) {
  return 250 * (level - 1) * level;
}

export function playerLevel(xp) {
  let level = 1;
  while (xp >= playerXpForLevel(level + 1)) level += 1;
  return level;
}

export function playerProgress(xp) {
  const level = playerLevel(xp);
  const start = playerXpForLevel(level);
  return { level, xpInLevel: xp - start, xpForLevel: playerXpForLevel(level + 1) - start };
}

export function victoryPlayerXp(armyCost, survivorsCost, replay = false) {
  const xp = VICTORY_PLAYER_XP + Math.floor((SURVIVORS_BONUS_XP * survivorsCost) / armyCost);
  return replay ? replayXp(xp) : xp;
}

export const LEVEL_REWARD_FACTOR = 50;

export function playerLevelReward(xpBefore, xpAfter) {
  let reward = 0;
  for (let level = playerLevel(xpBefore) + 1; level <= playerLevel(xpAfter); level += 1) {
    reward += LEVEL_REWARD_FACTOR * level;
  }
  return reward;
}
