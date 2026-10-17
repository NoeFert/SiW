import battleTuto from './battleTuto.js';
import battleStartW01 from './war01/battleStartW01.js';
import battleLow1W01 from './war01/battleLow1W01.js';
import battleLow2W01 from './war01/battleLow2W01.js';
import battleTop1W01 from './war01/battleTop1W01.js';

// Statique — toutes les batailles du jeu, une par fichier :
// - battleTuto.js : la bataille tutoriel, jouée une seule fois au début du jeu ;
// - un sous-dossier par guerre (« Partir en guerre », rules.md 11.7) : war01/ contient la map de
//   la guerre (warMap01.js) et les fichiers de ses batailles. Une bataille d'une guerre est
//   nommée d'après l'emplacement de la map qui la porte et sa guerre : battle + id de
//   l'emplacement + W + numéro de la guerre (battleStartW01 = emplacement « start » de war01).
//
// Chaque fichier de bataille contient tout ce qui la définit :
// - reward   : Spirit Stones de la première victoire (rules.md 11.7)
// - tutorial : étapes du tutoriel de la bataille (src/data/tutorials.js, technical.md 5.5), ou null
// - phases   : les zones jouées l'une après l'autre (rules.md 7.3), chacune avec :
//   - background   : image de fond (assets/backgrounds/<image>.png) et `flipped` pour l'afficher
//                    retournée
//   - obstacles    : plan de la zone, une chaîne par rangée (24 x 14 cases) — '.' case libre,
//                    '#' rocher d'une case, '@@/@@' rocher 2x2 (voir parseObstacleMap). Colonnes
//                    0-5 : déploiement du joueur (rules.md 2) ; colonne 23 : entrée de l'IA,
//                    toujours libre.
//   - enemyScripts : arrivée des ennemis selon la faction jouée par l'IA (rules.md 7.1), écrite
//                    avec `waves` (waves.js)
//
// Pour ajouter une bataille à une guerre : copier un fichier de bataille de son dossier, le
// nommer d'après son emplacement, l'ajouter à BATTLES et à WAR_BATTLE_IDS ci-dessous, lui donner
// un nom dans src/ui/strings.js (`war.battleNames`) et l'indiquer sur son emplacement dans la map
// (`battle` dans warMap01.js). tests/logic/battleData.test.js vérifie automatiquement chaque
// bataille (plan valide, scripts triés, nom, emplacement…).
export const BATTLES = {
  battleTuto,
  battleStartW01,
  battleLow1W01,
  battleLow2W01,
  battleTop1W01,
};

export const TUTO_BATTLE_ID = 'battleTuto';
// Batailles de la guerre 01. Leur déblocage suit les liens de la map (rules.md 11.7, warMap01.js).
export const WAR_BATTLE_IDS = ['battleStartW01', 'battleLow1W01', 'battleLow2W01', 'battleTop1W01'];
