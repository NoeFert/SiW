import wyrms from './wyrms.js';
import undead from './undead.js';

// Statique — les factions jouables (rules.md 9), une par fichier dans ce dossier, indexées par
// leur id (la valeur sauvegardée dans le profil du joueur, voir src/state/profileStore.js).
// Chaque fichier contient :
// - id              : identifiant de la faction
// - sovereignSprite : sprite du souverain (choix de faction, accueil)
// - color           : couleur principale de la faction
// - uiColor         : palette d'interface, dossier assets/ui/<uiColor>/ (src/ui/factionTheme.js)
// - projectile      : missile des attaques à distance de ses unités (assets/effect/)
// - roster          : les espèces de la faction et leurs stats (units.md)
// - startingArmy    : armée de début de jeu, nombre d'individus par espèce (rules.md 11.1)
// Le nom de la faction et le titre de son souverain sont dans src/ui/strings.js, avec les autres
// textes affichés au joueur.
export const FACTIONS = { wyrms, undead };
