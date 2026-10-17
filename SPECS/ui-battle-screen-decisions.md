# UI / UX — Écran de bataille

> **Rôle** : l'écran de bataille — disposition et comportement de l'interface. Les règles du jeu sont dans `rules.md`. Index des fichiers : `README.md`.

**Objectif** : une interface aussi simple que celle d'un jeu « clickbait ». **Critère** : un joueur qui voit l'écran pour la première fois comprend en 3 à 5 secondes, sans lire, ce qu'il doit faire.

## 1. Disposition

```
┌────────────────┬──────────────────────────────────────┐
│     [Abandon.] │                                      │  fixe
│   ( jauge )    │                                      │  fixe
│  ORDRES        │   camp du joueur  │   camp de l'IA    │
│ [⏸][➜][⚔][🏳] │ (déploiement :    │                   │  fixe
│                │  1er quart)       │                   │
│  VOS UNITÉS    │        ──── sens d'attaque ───▶        │
│  ┌──────────┐  │                                      │
│  │ unité    │  │                                      │  ↕ la liste défile
│  ├──────────┤  │         CHAMP DE BATAILLE            │
│  │ unité    │  │         (canevas Phaser)             │
└────────────────┴──────────────────────────────────────┘
```

- **À gauche, la tour de commandement** : une colonne verticale, collée à la zone de déploiement du joueur (colonnes 0 à 5, `rules.md` 2). **À droite, le terrain** (canevas Phaser). Le joueur attaque de gauche à droite.
- L'écran se lit comme une phrase : `[ mes unités ] → [ ma zone ] → [ l'ennemi ]` — je choisis, je dépose, j'attaque. À gauche ce que **je** fais, à droite ce que **mes troupes** font.
- Aucun bouton par-dessus le terrain (`technical.md` 2.3).

## 2. Tour de commandement

De haut en bas : bouton **Abandonner** (coin haut-droit), **jauge de présence**, rangée **« Ordres »** (fixe), liste **« Vos unités »** (seule partie qui défile).

### 2.1 Jauge de présence
Une fiole ronde (pack Pixel UI : ValueBars/White, FlaskBackground et FlaskForeground) qui se remplit de bas en haut selon les PP sur le terrain, d'une couleur unie : la couleur principale de la faction (doré pour les Wyrms, menthe pour les Morts-Vivants). Le ratio (`60/150`) est écrit par-dessus. Pas de label.

### 2.2 « Vos unités »
Une case par ligne de la liste, deux cases par rangée.

```
┌──────────────────┐
│[8x]           > │  carré en haut à gauche : nombre ; flèche : grouper / dégrouper
│     [sprite]     │
│  ♥ 50/50  niv 1  │  PV, niveau
│     [10 PP]      │  tag de présence
└──────────────────┘
```

- **Case** : même panneau que les cases de l'écran des unités (panneau et coins dorés pour un [Légendaire]). Le nombre (`8x`, jamais `8/12`) n'apparaît qu'à partir de 2. Puis, centrés : sprite, PV et niveau (texte simple, couleur de la faction, PV du niveau), tag de PP. Ni nom, ni dégâts, ni keywords.
- **Blessé** : PV en couleur d'alerte (`♥ 25/40`, orange ou rouge selon la gravité) et mini barre de vie sous le sprite, au même code visuel que les barres du terrain. Les cases intactes gardent le format X/Y.
- **Espèce regroupée (par défaut)** : une seule case par espèce. Son nombre est le total de l'espèce, son niveau la tranche des niveaux présents (« niv 1-5 », ou « niv 3 »), ses PV ceux du prochain individu déployé. Un glisser depuis cette case déploie d'abord les individus **intacts** par niveau décroissant, puis les **blessés** par niveau puis PV décroissants.
- **Espèce dégroupée** : une flèche en haut à droite de la première case (si l'espèce a plusieurs lignes) dégroupe l'espèce, un nouveau clic la regroupe ; le choix vaut pour la bataille en cours. Dégroupée, l'espèce a une case par groupe **strictement identique** (même niveau, mêmes PV actuels), et le joueur choisit le niveau et les PV de l'individu qu'il déploie. Une nouvelle ligne (un blessé) apparaît juste sous son groupe d'origine.

| Cas (espèce dégroupée) | Résultat |
|---|---|
| Ver qui revient de fuite avec tous ses PV | rejoint son groupe (`8x`) |
| Ver qui revient à 25/50 PV | nouvelle ligne `1x` |
| Deux Vers qui reviennent, à 25 et à 30 PV | deux lignes |
| Deux Vers qui reviennent, tous deux à 25 PV | une ligne `2x` |

- **Visibilité** : la tour ne montre que les unités en réserve. Une unité morte ou sur le terrain disparaît de la liste ; elle revient si elle fuit. Un [Légendaire] n'ayant qu'une copie, il disparaît donc une fois déployé.
- **PP insuffisants** : la case est grisée. Un clic, ou une tentative de glisser, affiche au-dessus d'elle une infobulle qui explique la situation et suggère de libérer de la place (sans bouton). Rien au survol.
- **Déploiement** : glisser depuis n'importe quel endroit de la case vers le terrain ; le geste met le jeu en pause d'interaction (`rules.md` 5.2).

### 2.3 Rangée « Ordres »
```
ORDRES
[ ⏸ ] [ ➜ ][ ⚔ ][ 🏳 ]
 Pause Aller Attaquer Fuir
```

- Le bouton **Pause** (interrupteur ⏸ / ▶ de la pause principale, barre Espace ; pas un menu : terrain et tour restent utilisables) puis les trois ordres en icônes (provisoires), toujours visibles ; une infobulle au-dessus donne leur nom au survol prolongé.
- **Donner un ordre** (`rules.md` 5) : clic sur l'ordre (le jeu se met en pause) → clic sur une unité du joueur (cadre de la couleur de sa faction) → clic sur une case (Aller) ou un ennemi (Attaquer). Fuir n'a pas de cible : l'unité fuit dès qu'elle est choisie. L'ordre choisi est surligné dans la couleur de la faction pendant la sélection.
- Sans ordre choisi, un clic sur le terrain ne fait rien. Cliquer un autre ordre en cours de route le remplace (l'unité est à rechoisir).
- **Annuler**, à n'importe quel stade : re-clic sur l'ordre surligné, clic droit sur le terrain ou touche Échap.
- **Cooldown de Fuir** (`rules.md` 5.1) : le bouton est grisé et se remplit de bas en haut ; son infobulle donne le temps restant ; un clic ne fait rien.

## 3. Signaux de pause

Pendant une pause, le terrain reste entièrement visible et cliquable. **Règle pour le joueur : ce qui est en couleur est cliquable.**

| Situation | Terrain | Reste en couleur |
|---|---|---|
| Pause principale | désaturation complète ; le bouton ⏸ devient un ▶ qui pulse | — |
| Déploiement (glisser) | désaturation partielle | la zone de déploiement du joueur |
| Ordre : choix de l'unité | désaturation partielle | les unités du joueur |
| Ordre : choix de la cible | désaturation partielle | les ennemis (Attaquer) ou les cases accessibles (Aller) |

- Les animations des unités sont gelées avec le jeu.
- Une interaction pendant la pause principale garde la désaturation complète ; seuls les éléments valides reprennent leur couleur.

## 4. Bouton Abandonner

Coin haut-droit de la tour, disponible en permanence, bataille tutoriel comprise (`rules.md` 8.2). Il ouvre une confirmation, par exemple : « Abandonner la bataille ? Vos unités en réserve seront conservées. » ; la bataille est en pause d'interaction pendant la confirmation.

## 5. Points ouverts

Rendu, sans effet sur les règles : l'apparence d'une unité en fuite et d'une unité engagée au corps-à-corps.
