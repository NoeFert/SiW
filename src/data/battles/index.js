import battleTuto from './battleTuto.js';
import battleStartW01 from './war01/battleStartW01.js';
import battleLow1W01 from './war01/battleLow1W01.js';
import battleLow2W01 from './war01/battleLow2W01.js';
import battleTop1W01 from './war01/battleTop1W01.js';
import battleMid1W01 from './war01/battleMid1W01.js';

// Toutes les batailles. Une guerre = un dossier (war01/).
// Nom d'une bataille de guerre : battle + emplacement + W + numéro de guerre.
export const BATTLES = {
  battleTuto,
  battleStartW01,
  battleLow1W01,
  battleLow2W01,
  battleTop1W01,
  battleMid1W01,
};

export const TUTO_BATTLE_ID = 'battleTuto';
export const WAR_BATTLE_IDS = ['battleStartW01', 'battleLow1W01', 'battleLow2W01', 'battleTop1W01', 'battleMid1W01'];
