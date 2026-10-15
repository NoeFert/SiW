// Pont entre la Scene Phaser (terrain) et la tour de commandement React : ni l'un ni l'autre
// ne touche au DOM ou aux objets de l'autre (technical.md 2.2). Ils partagent seulement
// l'instance `battle` créée par battle.js, qui porte aussi tout l'état d'interaction (pauses,
// sélection d'une commande : voir pause.js et orderSelection.js). `null` hors de l'écran de bataille.
//
// `unitDisplayCenter(unit)` : position affichée (px du canevas) du sprite d'une unité, publiée
// par la Scene pour la main du tutoriel. Pendant une pause, un sprite peut rester figé à
// mi-chemin entre deux cases (déplacement animé gelé), loin de sa case logique.
export const interactionState = {
  battle: null,
  unitDisplayCenter: null,
};
