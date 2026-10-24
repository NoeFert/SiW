# GRAPHICS.md — Direction artistique

> **Rôle** : l'apparence — direction artistique, assets, effets visuels. Les règles du jeu sont dans `rules.md`, le contenu des écrans dans `technical.md` 5. Index des fichiers : `README.md`.

## Intention

**Dark fantasy rétro** : des souverains masqués et des monstres effrayants en pixel art, sur un champ de bataille sombre et peu engageant. Tous les assets du jeu (unités, souverains, décor) sont **dessinés à la main** ; seule l'interface vient du pack acheté **Pixel UI & HUD** (Dead Revolver, itch.io), qui habille les composants shadcn/8bitcn.

- **Silhouettes lisibles** sur un fond neutre et peu contrasté.
- **Une couleur signature par faction**, reprise partout.
- **Ambiance plutôt qu'effets** : le décor encadre la bataille sans gêner la lecture de la grille.

## Palettes des factions

| Faction | Couleur signature | Tons secondaires | Utilisée pour |
|---|---|---|---|
| Souveraine des Wyrms | **doré** (#eab532) | rouge sombre, noir | jauge de présence, barres de vie, niveaux, projectiles (orange) |
| Souverain des Morts-Vivants | **menthe** (#73ecbc) | violet, gris ardoise | jauge de présence, barres de vie, niveaux, projectiles (menthe) |

**Accents de l'interface** (survol du bouton principal et du menu de l'accueil, curseur, coins décoratifs) : dorés pour les Wyrms, violets pour les Morts-Vivants et les écrans d'avant le choix de faction.

## Les souverains (choix de faction)

| Souveraine des Wyrms | Souverain des Morts-Vivants |
|---|---|
| ![Souveraine des Wyrms](assets/wyrm_sovereign.png) | ![Souverain des Morts-Vivants](assets/undead_sovereign.png) |

## Les unités

Sprites à 2× leur taille d'affichage (`technical.md` 3). Les unités du joueur regardent vers la droite, celles de l'IA vers la gauche (sprite retourné).

| Wyrms | | Morts-Vivants | |
|---|---|---|---|
| ![Ver de Lambton](assets/lambton-worm.png) | Ver de Lambton (basique) | ![New-reborn Skeleton](assets/new-reborn-skeleton.png) | New-reborn Skeleton (basique) |
| ![Amphiptère](assets/ampiptere.png) | Amphiptère ([Vol], à distance) | ![Necromant Initiate](assets/necromant.png) | Necromant Initiate ([Vol], à distance) |
| ![Fafnir](assets/fafnir.png) | Fafnir the Cursed One ([Légendaire]) | ![Athos](assets/athos.png) | Athos the Lord of Pain ([Légendaire]) |

## Le champ de bataille

![Champ de bataille](assets/battlefield-01.png)

Une plaine désertique gris-beige, peu contrastée, encadrée de rochers noirs et de racines, au thème des wyrms ; une porte éclairée à gauche marque le côté du joueur. La même image sert à toutes les zones, retournée pour « Le mur » (`rules.md` 7.3). Un seul sprite de rocher pour les obstacles (d'autres pourront venir) :

![Rocher](assets/rocks.png)

## Effets en bataille

| Évènement | Effet |
|---|---|
| **Tir** | missile animé tiré d'une planche d'effets (`assets/effect/`, images de 64 × 64, une ligne par couleur), joué en entier pendant son vol (220 ms), orienté vers la cible ; à l'arrivée, un éclat rond dans la couleur de la faction. Wyrms : `missile-burst.png` (15 étapes, ligne orange, la 1re) ; Morts-Vivants : `missile-streak.png` (8 étapes, ligne verte, la 4e) |
| **Coup au corps-à-corps** (dernière attaque sur une unité qui fuit comprise) | entaille blanche (6e ligne de `hit-slash.png`, 8 étapes, 300 ms) sur la victime, à la taille de son emprise, pour les deux factions |
| **Attaque dévastatrice** (Fafnir) | « COUP CRITIQUE ! », tremblement d'écran, victime qui clignote en jaune (3 fois 70 ms), pics orange (1re ligne de `hit-spikes.png`, 1,5 s, deux fois la taille de l'unité) |
| **Frappe paralysante** (Athos) | tourbillon vert (4e ligne de `hit-swirl.png`, 1,5 s par cycle) **en boucle** sur la victime tant qu'elle est paralysée ; « Raté ! » à chaque attaque annulée |
| **Soif de sang** (Athos) | « +40 » en vert |
| **Dégâts de zone** ([Légendaire], `rules.md` 4.6) | chaque ennemi touché clignote dans la couleur de la faction du [Légendaire] (doré pour Fafnir, menthe pour Athos) : une silhouette pleine de son sprite, posée par-dessus lui, 3 fois 70 ms, au moment de l'impact ; pas de texte, de secousse ni d'animation |
| **Entrée d'une unité de l'IA** | elle arrive depuis l'extérieur de l'écran, à droite, jusqu'à sa case d'entrée |

- Les effets sur une victime la suivent ; si le coup la tue, l'effet finit là où elle est morte. Un ennemi tué par la zone disparaît sans clignoter. Un tourbillon dont la victime meurt du coup est joué une fois.
- **Barres de vie** au-dessus des unités (et mini barre des cases blessées de la tour) : couleur principale de la faction de l'unité, quels que soient ses PV.
- **Compteur des aptitudes périodiques**, sous la barre de vie : une rangée de N cases (ValueSlots/StepSlotA) — vertes pour la Frappe paralysante (N = 4), rouges pour l'Attaque dévastatrice (N = 5) ; une case remplie par attaque portée depuis le dernier déclenchement.
- **Pause** et **zone de déploiement** : terrain désaturé, ce qui est cliquable reste en couleur (`ui-battle-screen-decisions.md` 3).
- Les unités en bataille ne montrent pas leur niveau.

## Accueil

- **Fond** (provisoire) : un château sombre en pixel art (200 × 93 px), en plein écran sans lissage, jusqu'au bord de la fenêtre — gris chaud (`assets/backgrounds/dark-castle-warm-grey.png`) pour les Wyrms, gris froid (`dark-castle-cold-grey.png`) pour les Morts-Vivants.
- **Portrait du souverain**, en haut à gauche, dans un cadre en creux (Frame) ; à sa droite, son nom, la barre d'XP avec « Niveau X » (sans badge) et « XP / XP du niveau » en dessous.
- **Menu** : quatre entrées sur le bord gauche (20 px de marge en plus du padding), entre le portrait et la fontaine, sans cadre de bouton ni séparateur ; texte rétro, violet clair au survol (doré chez les Wyrms).
- **Spirit Fountain** : la statue de pierre (`assets/sprites/stone-statue.png`, 72 × 115 px, taille d'origine, luminosité 75 %) surmontée de l'icône des Spirit Stones et de son contenu, en bas à gauche, posée sur le sol du château. Cliquable sans cadre de bouton, plus lumineuse au survol ; vide, elle reste opaque mais n'est pas cliquable. À la récolte, des gemmes (autant que de Spirit Stones récoltées, 5 au plus) volent l'une après l'autre jusqu'au solde (0,7 s), qui augmente à leur arrivée. Infobulle provisoire : « Cette statue génère 3 gemmes obscures par minute. Puisse le souverain faire bon usage de cette ressource précieuse. » (le nombre suit `rules.md` 11.8).
- **Unités qui errent** : jusqu'à trois individus différents d'une case (pas les [Légendaire]), tirés au hasard, au bas de l'écran à la hauteur de la fontaine ; moins s'il en manque. Chacune entre par un bord, 2 s après la précédente, puis va et vient au hasard entre la gauche et la droite (lentement, pauses de 1 à 4 s), sans sortir de l'écran, le sprite tourné dans le sens de la marche. Toutes les 5 minutes, elles sortent par le bord le plus proche et un nouveau groupe entre. Sprites d'environ 58 px (la moitié de la statue) ; un clic fait sursauter l'unité (0,35 s). Elles passent derrière la fontaine et le menu.

## Spirit Stones

Icône : la **gemme noire** du pack (Black/Jewel_Spin, `assets/ui/spirit-stone.png`), fixe (première image seulement), à 22 × 22 px, la même pour les deux factions. Sur l'accueil et l'écran Invocation, le solde est l'icône et le nombre, sans le mot, dans un cadre (Panels/Black/Panel).

## Niveaux

- **« niv X » en texte coloré** (couleur de la faction du joueur) : cases de l'écran des unités et de la tour de bataille.
- **Badge « niv X »** (bannière du pack, dorée ou menthe) : accordéons de l'écran Armées, page de détail d'un individu.
- **Barre d'XP** : RegularBarA, remplissage menthe (barre verte du pack) ou doré (barre orange recolorée, `assets/ui/bar-fill-wyrms.png`) ; pleine avec « MAX » au niveau 5.

## Partir en guerre

- **Map** : un arbre de compétences (sprites SkillTree, à 2×) — des losanges (SkillSlotSharp) sur une grille de 10 × 7 cases espacées de 80 px, reliés de pointe à pointe par des connecteurs droits ; chaque losange a un intérieur noir. Le départ est en bas à gauche, le boss en haut à droite.
- **Fond** (provisoire) : `assets/backgrounds/temporary-map1.png` (2048 × 1536), sur tout l'écran, monochrome, contraste ×1,5, luminosité 50 %.
- **Boss** : losange plus grand (SkillSlotLarge, 56 px au lieu de 42), avec son sélecteur SelectorLarge.
- **Envahisseurs** : le sprite de l'espèce ennemie, tourné vers la gauche, 5 px au-dessus de la pointe du losange (40 px, 64 px pour le [Légendaire]), assombri, éclairci quand son losange est sélectionné. Compteur « Repousse l'envahisseur N/3 » au-dessus de la map, aligné à gauche.
- **États** : disponible = losange vide ; gagnée = losange plein (SkillSlotSharpPlaceholder) ; verrouillée = losange gris, panneau à moitié transparent. Un connecteur est gris dès qu'un de ses bouts est verrouillé. Couleur du joueur sur la map : jaune (Wyrms) ou violet (Morts-Vivants).
- **Sélection** : SelectorSharp à 3× autour du losange, gris sur un emplacement verrouillé.
- **Panneau** : nom (avec l'état à sa droite), « Combattre », puis la rangée de récompenses (panneaux Panels/Black/Panel : l'icône des Spirit Stones et « XP », avec les montants en dessous) ; rien pour un emplacement verrouillé. Les zones des batailles ne sont pas affichées.

## Interface

Les composants React gardent leur API shadcn/8bitcn ; leur cadre est un sprite du pack, en 9-slice (`border-image`), affiché à 2× sans lissage (`src/components/ui/8bit/styles/pixel-ui.css`). Le pack complet reste dans `asset-packs/` (local, ignoré par git) ; seuls les fichiers utilisés sont copiés dans `assets/ui/`.

- **Curseur** : curseurs du pack (×2) dans la couleur de la faction du joueur — doré, violet, ou blanc tant qu'il n'a pas de faction. Flèche par défaut (boutons compris), main sur un élément cliquable sans cadre de bouton, main fermée sur une unité de la tour qu'on peut glisser, « interdit » sur ce qui est indisponible.
- **Main du tutoriel** : la main blanche des curseurs (`cursor-hand-white`), quelle que soit la faction, deux fois plus grande qu'un curseur ; le bout de l'index pointe la cible.
- **Padding** : 48 px du bord de la fenêtre sur tous les écrans (`--spacing-game`, `src/index.css`) ; les fonds et les unités qui errent vont jusqu'au bord, et en bataille la tour et le terrain aussi. Les éléments « dans un coin » (portrait, solde, menu, fontaine, « Retour ») sont collés au padding.
- **Fond des écrans** : dégradé vertical de #2a2c2f (haut) à #838796 (bas), sur toute la fenêtre. Fond noir (#171717) pour l'intro, le prologue, le choix de faction et la bataille (où il remplit l'espace que le terrain laisse libre) ; la tour de bataille garde son propre fond, et le château de l'accueil recouvre le dégradé.
- **Plein écran** : « Partir en guerre », les unités, « Armées » et Invocation occupent tout l'écran. En-tête commun en haut à gauche : une flèche ◀ sans cadre (le « Retour ») puis le titre, et dessous un séparateur (DividerD recoloré en gris très foncé) ; le contenu défile si besoin (`src/ui/ScreenLayout.jsx`). Grilles et listes remplissent la largeur.
- **Page de détail d'un individu** : flèches ◀ ▶ sans cadre de bouton, à gauche et à droite, centrées en hauteur.
- **Tags d'une unité** (page de détail seulement) : son type d'attaque — « Corps-à-corps », « Tirs », ou les deux pour Fafnir — puis ses keywords (« Légendaire », « Vol »).

| Composant | Sprite | Comportement |
|---|---|---|
| Bouton | ButtonA (34 × 18) | repos : liseré gris (secondaire), blanc (principal), rouge (« destructive ») ; survol : blanc, violet pour le principal ; clic : enfoncé |
| Panneau de ligne ou de case | PanelLarge noir (48 × 48) | bilans de victoire et de défaite, liste d'invocation (éclaircie au survol), accordéons de l'écran Armées, cases du choix de faction |
| Panneau uni | Panel noir (48 × 48) | solde, menu des paramètres, titre « Choisis ta faction », champ de renommage de l'armée |
| Carte | PanelLarge noir (48 × 48) | liseré gris, contenu en thème sombre (plus utilisée par la couche méta) |
| Boîte de confirmation | PanelLarge noir, boutons ButtonA | réinitialiser, abandonner, réinvoquer : « Annuler » au liseré gris, l'action au liseré blanc |
| Infobulle | SpeechTooltip noir (32 × 32) | liseré gris, sans flèche : tour de bataille, Spirit Fountain |
| Bulle de tutoriel | Speech blanc (32 × 32) | liseré blanc, fond noir |
| Badge | bannières (64 × 15), hauteur 30 px | liseré blanc (défaut), gris (secondaire), doré ou menthe (niveaux) |
| Barre d'XP | RegularBarA | couleur de la faction du joueur |
| Case d'un groupe d'individus (écran des unités) | PanelLarge noir | sprite, nom et « niv X » ; nombre (« 3x ») dans un carré en haut à gauche (GridPanelInactive), à partir de 2 ; [Légendaire] : panneau doré (Gold/PanelLarge) et coins dorés (Decorators/Gold/BorderC) |
| Espèce sélectionnée (Invocation) | BorderC (11 × 11, à 2×) | quatre coins dans les coins de la ligne, dorés ou violets, au lieu d'un cadre |
| Portrait du souverain | Frame noir (32 × 32) | cadre en creux |
