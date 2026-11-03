// Conséquences d'une victoire (rules.md 11).
import { armyCost, createArmy, removeDeadFromArmy } from './army.js';
import {
  TUTO_BATTLE_PLAYER_XP, applyVictoryToUnits, individualXpGains, levelUps, playerLevelReward,
  victoryPlayerXp,
} from './levels.js';
import { fallenLegendaryLevelAfter } from './ownedUnits.js';
import { lossReport } from './war.js';

// `save` : profil avant la bataille. Renvoie la nouvelle sauvegarde et le bilan.
export function resolveVictory(save, battleUnits, roster, {
  tutoBattle, armyName, reward = 0, replay = false,
}) {
  const xpGains = individualXpGains(battleUnits, replay);
  const units = applyVictoryToUnits(save.units, xpGains);

  const fallenLegendaryLevel = fallenLegendaryLevelAfter(
    roster, save.units, xpGains.dead, save.fallenLegendaryLevel,
  );

  const xpGained = tutoBattle
    ? TUTO_BATTLE_PLAYER_XP
    : victoryPlayerXp(armyCost(save.army, save.units, roster), armyCost(save.army, units, roster), replay);
  const playerXp = save.playerXp + xpGained;

  const army = tutoBattle ? createArmy(armyName, units) : removeDeadFromArmy(save.army, units);

  const spiritStonesGained = reward + playerLevelReward(save.playerXp, playerXp);

  return {
    save: {
      units,
      army,
      playerXp,
      spiritStones: save.spiritStones + spiritStonesGained,
      fallenLegendaryLevel,
    },
    report: {
      xpGained,
      spiritStonesGained,
      levelUps: levelUps(save.units, units),
      lost: lossReport(roster, save.units, xpGains.dead),
    },
  };
}
