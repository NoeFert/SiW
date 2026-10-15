# TECHNICAL.md

Les technologies choisies, pourquoi, et la stratégie de tests. Ce fichier couvre le **comment** — pour le **quoi** (comportement du jeu), voir `rules.md` et `units.md`.

---

## 1. Langage et moteur

| Choix | Techno | Pourquoi |
|---|---|---|
| Langage | **JavaScript** | Choix simple pour démarrer rapidement, sans la charge d'un système de types à maintenir pour un prototype v1 |
| Moteur de jeu (champ de bataille) | **Phaser 3** (pas Phaser 4) | Phaser 4 est la version activement maintenue depuis avril 2026, mais trop récente pour être bien couverte par les connaissances des outils d'IA utilisés pour coder ce projet (Claude Code). Phaser 3, bien que figé (dernière version 3.90.0, plus de nouvelles fonctionnalités), reste stable et dispose d'une documentation et d'exemples massifs — un agent IA le connaît en profondeur et se trompe moins. Une migration vers Phaser 4 reste possible plus tard, une fois son écosystème plus mature |
| UI hors champ de bataille | **React + Tailwind CSS + shadcn/ui (thème 8bitcn)** | Phaser est peu adapté à construire de l'UI HTML classique (listes, boutons, panneaux). Tout ce qui n'est pas un asset de jeu dessiné à la main (sprites, backgrounds) — boutons, sidebar de déploiement, HUD, écrans de fin de bataille — passe par des composants génériques React plutôt que d'être recréé à la main en CSS. Le thème 8bitcn colle en plus à l'identité visuelle rétro du jeu. Installation des composants via `npx shadcn@latest add @8bitcn/<component>` |
| Bundler | **Vite** | Standard actuel pour les projets Phaser modernes, démarrage et rechargement à chaud rapides ; le plugin React de Vite permet de faire cohabiter Phaser et React sans friction |
| Gestionnaire de paquets | npm | Par défaut avec Node.js, pas de raison de s'en écarter pour ce projet |

---

## 2. Architecture

**Principe central : la logique du jeu ne dépend jamais de Phaser, ni de React.** Les règles vivent dans `src/logic/`, en JavaScript pur : elles se testent sans navigateur (section 4), et une bataille complète se simule en ligne de commande (`npm run balance`, `npm run debug`). Phaser et React ne font qu'afficher l'état et transmettre les actions du joueur.

### 2.1 Les dossiers

```
src/
  data/                 Données statiques, sans comportement
    factions/           Une faction par fichier (roster, armée de départ, couleurs, missile)
    battles/            Une bataille par fichier : battleTuto.js, puis un dossier par guerre
      war01/            (warMap01.js : la map ; battleStartW01.js… : ses batailles)
    tutorials.js, effects.js, sprites.js
  logic/                Règles du jeu, JavaScript pur, testées (tests/logic/)
    battles/            Moteur de bataille, découpé par rôle (carte en tête de battle.js)
    army.js, levels.js, summon.js, victory.js, war.js, fountain.js, homeTips.js, ownedUnits.js
                        Couche méta (rules.md 11)
  state/profileStore.js Profil du joueur, sauvegardé (section 5.4)
  scenes/               Phaser : BattleScene et ses vues (scenes/battle/)
  screens/              React : un fichier par écran (section 5)
  ui/                   React : composants, textes affichés (strings.js), thème de faction
  dev/, debug/          Menu devs, profils de test, outils de debug et d'équilibrage
tests/                  Jest : logic/ (règles), state/ (profil), ui/ (assets du thème)
```

**Moteur de bataille** (`src/logic/battles/`), quatre rôles :
1. **Déroulé** : `battleSetup.js` prépare une bataille à partir de sa définition ; `battle.js` porte l'objet bataille et la boucle `tickBattle` (lisible de haut en bas : tutoriel → arrivée des ennemis → unités → retours de fuite → fin de phase → fin de bataille) ; `phases.js`, `pause.js`, `tutorial.js`.
2. **Unités sur le terrain**, identiques pour les deux camps : `battleUnit.js` (la classe `BattleUnit`), `unitBehavior.js` (cible, déplacement, attaques, aptitudes, fuite), `pathfinding.js`, `grid.js`, `deployment.js` (réserves et règles de déploiement).
3. **Les deux commandants** : le joueur (`playerActions.js` : déployer, ordres, pause, abandon ; `orderSelection.js` : déroulé d'un ordre en plusieurs clics ; `fleeCooldown.js`) et l'IA (`aiScript.js` : arrivée des ennemis selon le script de la phase).
4. **Fin de bataille** : `battleEnd.js` (victoire, défaite, match nul, abandon).

### 2.2 Deux états, deux propriétaires

- **Le profil du joueur** (tout ce qui est sauvegardé) : un store Zustand, `src/state/profileStore.js`. Les écrans le lisent avec `useProfileStore` ; seules les actions du store le modifient, en appelant les règles de `src/logic/` (section 5.4).
- **La bataille en cours** (jamais sauvegardée) : un objet modifié en place par le moteur, décrit dans `createBattle` (`battle.js`). `BattleScreen` le crée (`createBattleFromDefinition`) et en est propriétaire : il le donne à la Scene Phaser, qui le fait avancer à chaque frame et l'affiche, et à la tour de commandement et au tutoriel, par leurs props. Après chaque frame, la Scene émet `BATTLE_FRAME_EVENT` : `BattleScreen` se redessine et détecte la fin de bataille. À la fin, le résultat passe au profil par les actions du store (`applyVictory`, `applyWarDefeat`).

### 2.3 Répartition Phaser / React

- **Phaser gère exclusivement le champ de bataille** : `BattleScene` orchestre, et délègue chaque sujet à une vue de `src/scenes/battle/` — `BattlefieldView` (fond et rochers), `DeploymentZoneView`, `UnitViews` (sprites, barres de vie, compteurs d'aptitude, déplacements animés), `CombatEffects` (missiles, entailles, aptitudes, textes flottants), `FieldInput` (clics sur le terrain), `PauseTint` (désaturation pendant les pauses).
- **React + shadcn/8bitcn gèrent tout le reste** : la **tour de commandement** de l'écran de bataille et tous les autres écrans (section 5), sans canevas Phaser.
- **Tour de commandement** (`src/ui/CommandTower.jsx`, détail dans `SPECS/ui-battle-screen-decisions.md`) : colonne **à gauche** du canevas, collée à la zone de déploiement du joueur. De haut en bas : bouton **Abandonner** (coin haut-droit, avec boîte de confirmation), jauge de présence, rangée **« Ordres »** (`src/ui/OrdersRow.jsx` : bouton **Pause** — interrupteur ⏸ / ▶ de la pause principale, raccourci Espace — puis icônes Aller / Attaquer / Fuir, cooldown affiché sur Fuir), liste « Vos unités » (seule zone qui défile, lignes regroupées par unités strictement identiques, drag & drop vers le terrain).
- Le canevas et la tour vivent **côte à côte**, jamais superposés (seuls les tooltips, la confirmation d'abandon et l'overlay du tutoriel passent par-dessus) ; aucune des deux couches ne manipule les objets de l'autre.
- **Signaux de pause sur le terrain** : désaturation complète pendant la pause principale, partielle pendant une pause d'interaction ; ce qui est cliquable (zone de déploiement, unités du joueur, ennemis ou cases ciblables) reste en couleur.
- **Couleurs des factions** : chaque faction déclare sa couleur principale et sa palette d'interface (`color`, `uiColor`, `src/data/factions/`). `src/ui/factionTheme.js` en tire des variables CSS posées sur `<html>` (couleurs, curseurs, accents) et Phaser lit `factionColor()` : changer ces deux champs change toutes les couleurs de la faction. Les assets d'interface sont rangés par couleur (`assets/ui/<couleur>/`, voir `assets/README.md`).

### 2.4 Style de modélisation des données
- **Entités avec comportement et état évolutif** (une unité sur le terrain) : classes ES6 porteuses de données et de comportement (ex : `BattleUnit`). La bataille en cours est un objet simple, modifié par les fonctions du moteur.
- **Configuration statique sans comportement propre** (factions, batailles, tutoriels, effets) : objets JavaScript simples dans `src/data/`, séparés du comportement.
- Une unité sur le terrain **référence** sa définition d'espèce plutôt que de dupliquer ses stats de base — voir `units.md`.

### 2.5 Convention de nommage
- **Le code, les noms de fichiers, les dossiers et les assets utilisent des noms anglais**, même si les documents `SPECS/` restent rédigés en français. Les commentaires du code sont en français, comme les specs. Les textes affichés au joueur sont en français, regroupés dans `src/ui/strings.js` pour une traduction future (hors de cette version).
- Ex : la classe `BattleUnit`, le fichier `unitBehavior.js`, le sprite `lambton-worm.png` — pas de noms français dans le code.
- **Vocabulaire** : une **guerre** (war) est un ensemble de batailles sur une map ; une **bataille** (battle) n'est jamais appelée « war ». Identifiants : `battleTuto` pour la bataille tutoriel, `battle` + id de l'emplacement de la map + `W` + numéro de la guerre pour les autres (`battleStartW01`). Ce que le joueur donne à ses unités s'appelle un **ordre** (`orderSelection`, `issuePlayerFlee`…).

### 2.6 Principe pour la v1 : DRY et simplicité maximale
- Priorité à un code **simple et sans répétition (DRY)** plutôt qu'à une architecture élaborée pensée pour anticiper la v2+
- Pas d'abstraction prématurée (pas de système de plugins, pas de couche de configuration générique) tant qu'un besoin concret ne l'exige pas
- Objectif : le code le plus direct possible, lisible par un humain autant que par une IA

## 3. Résolution de rendu

- **Taille d'une case de grille : 64×64 pixels.** Avec la grille de 24×14 cases (`rules.md` section 1), le canevas de jeu Phaser fait **1536×896 pixels** à sa taille de référence (base design resolution).
- **Résolution des assets fournis : 2x la taille d'affichage réelle**, pour rester net sur les écrans haute densité (Retina) — Phaser réduit à l'affichage.
  - Sprites 1 case (Lambton Worm, New-reborn Skeleton, et futurs Amphiptère/Necromant Initiate) : 128×128 px, PNG avec transparence
  - Sprites 4 cases / 2×2 (Fafnir, Athos) : 256×256 px, PNG avec transparence
  - Background de bataille : 3072×1792 px si possible (2x du canevas), sinon 1536×896 px minimum, PNG ou JPG
- Le DPI des fichiers n'a aucune incidence sur le rendu à l'écran — seule la taille en pixels compte.

### 3.1 Adaptation à la taille d'écran (desktop uniquement)

- **Le jeu s'adapte à la taille de la fenêtre du navigateur, desktop uniquement** — pas de layout mobile/tactile à prévoir pour la v1.
- **Le canevas Phaser garde toujours son ratio d'aspect (24:14)** : il ne s'étire jamais de façon à déformer la grille ou les sprites. Utiliser le Scale Manager de Phaser en mode `Phaser.Scale.FIT` avec un parent redimensionnable (`Phaser.Scale.RESIZE` sur le conteneur, ou écoute de `resize` window + `scale.resize()`), pour que le canevas grandisse ou rétrécisse en conservant ses proportions.
- **La tour de commandement React s'adapte plus librement** autour du canevas (largeur en `%` ou `rem`, pas de ratio imposé), tant qu'elle reste entièrement visible à côté du terrain, jamais superposée ni coupée.
- **Aucune barre de défilement non voulue** : chaque écran tient dans la fenêtre du navigateur, de la fenêtre d'un petit portable (**1024×560**, taille minimale) aux grands écrans. Ce qui ne tient pas se réduit ou se réorganise :
  - la map de « Partir en guerre » rétrécit (jamais au-delà de sa taille normale) pour tenir avec son panneau ;
  - sur une fenêtre de moins de 1280 px de large, le titre « Choisis ta faction » remonte au-dessus des souverains pour ne pas couvrir les monstres ;
  - écrans de victoire : « Montées de niveau » et « Unités perdues » côte à côte ; une liste exceptionnellement longue défile dans sa propre colonne, jamais la page.
- **Défilements voulus** : la liste des unités de la tour de commandement (barre de défilement du pack, `GRAPHICS.md`), et une colonne de bilan trop longue (ci-dessus).
- **Taille de fenêtre minimale : 1024×560** — en dessous, le jeu ne rétrécit pas davantage : le surplus défile plutôt que d'écraser les éléments. Pas de mode mobile ni tactile.
- Les positions de jeu (grille, coordonnées d'unités) restent exprimées dans le référentiel fixe de 1536×896 dans `src/logic/` — seule la couche Phaser convertit vers la taille d'affichage réelle au moment du rendu ; aucune règle de `rules.md` ne dépend de la résolution d'écran.

---

## 4. Stratégie de tests

- **Tests automatisés dès la v1**, avec **Jest** : les règles de `src/logic/` (`tests/logic/`), les actions du profil du joueur (`tests/state/`) et la présence des assets cités par les données de faction (`tests/ui/`). Les données (`src/data/`) sont vérifiées automatiquement : chaque phase de chaque bataille (`battleData.test.js`) et chaque faction (`wyrmsFaction.test.js`, `undeadFaction.test.js`)
- Priorité de couverture :
  1. Résolution de combat (dégâts simultanés, mort, aptitudes automatiques, dégâts de zone des [Légendaire] et leurs interactions, `rules.md` 4.6)
  2. Pathfinding (chemin le plus court, contournement d'obstacles, blocs 2×2, unités [Vol])
  3. Règles d'engagement au corps-à-corps (redirection vers un autre ennemi, file d'attente)
  4. Conditions de fin de bataille (victoire à la fin du script de l'IA, défaite, match nul, abandon)
  5. Déploiement : zone de déploiement (colonnes 0 à 5, bloc 2×2 entier dans la zone, `rules.md` 2), points de présence et copies (plafond vivant, copie perdue vs réutilisable)
  6. Couche méta (`rules.md` 11) : plafond de 500 PP et minimum d'1 individu de l'armée, retrait des morts de la liste et de l'armée, prix d'invocation, [Légendaire] unique, solde insuffisant, validation du nom de l'armée
  7. Niveaux (`rules.md` 11.5 et 11.6) : courbes d'XP du joueur et des individus, plafond du niveau 5, stats par niveau et leur arrondi, XP gagnée à la victoire (réserve de survie partagée entre les déployés, coups fatals, coup fatal simultané, bonus de survivants), récompenses de niveau, prix du niveau gardé à la réinvocation
- **Test de référence** (`tests/logic/battles/battleReplay.test.js`) : chaque bataille est rejouée par le bot de l'outil d'équilibrage avec un aléa fixé, et son résultat comparé à un instantané. Un écart signale un changement de comportement du moteur ; s'il est voulu, l'instantané se régénère (`npx jest battleReplay -u`). C'est le cas des dégâts de zone et de la zone de déploiement (`strategic-depth.md`) : l'instantané est à régénérer une fois, quand ils sont codés
- **Pas de tests automatisés sur la couche Phaser ni sur la couche React** (rendu, animations, input, composants UI) pour la v1 — cette partie reste validée manuellement en jouant, le coût de mise en place de tests d'interface n'étant pas justifié pour un prototype
- Chaque règle chiffrée de `rules.md` doit pouvoir correspondre à au moins un test automatisé qui la vérifie — cohérent avec la consigne de `rules.md` ("chaque ligne doit être vérifiable")
- **Outil d'équilibrage** (`src/debug/balance/`, `npm run balance`, skill `/balancer`) : script Node qui joue des batailles sans Phaser avec le moteur de `src/logic/` et un bot joueur passif (4 stratégies), seed fixe ; il prépare chaque bataille comme le jeu (`createBattleFromDefinition`) et n'importe que `src/logic/` et `src/data/`, sans localStorage. Ce n'est pas un test Jest : il mesure, il ne valide pas. Il sert notamment à vérifier qu'un script de « Partir en guerre » respecte la difficulté visée selon sa distance au boss (`rules.md` 11.7)

---

## 5. Écrans et navigation

Le jeu v1 est composé de **neuf écrans distincts**. Un seul d'entre eux (l'écran de bataille) contient le canevas Phaser ; les huit autres sont du React pur.

### 5.1 Liste des écrans

0. **IntroScreen** — texte d'introduction centré (le joueur est un souverain qui devra mener les siens à la guerre), avec un bouton pour continuer. Affiché juste avant `FactionChoiceScreen`, donc **une seule fois**, au tout début d'une partie.
1. **FactionChoiceScreen** — écran de choix de faction (Souveraine des Wyrms ou Souverain des Morts-Vivants). Affiché **une seule fois**, au tout début d'une partie (pas avant chaque bataille).
2. **BattleScreen** — l'écran de bataille (bataille tutoriel, ou bataille de « Partir en guerre ») : tour de commandement React à gauche (pause, abandon, déploiement, ordres) + canevas Phaser (champ de bataille) à droite. Il crée la bataille et la partage entre les deux (section 2.2).
3. **VictoryScreen** — écran de récompense affiché après une victoire. **Squelette minimal pour la v1** (voir 5.3). Il affiche une rangée de récompenses (**Spirit Stones gagnées**, `rules.md` 11.3, et **XP gagnée par le joueur**, 11.5), les **individus qui ont monté de niveau** (11.6) et les **unités perdues** (contenu détaillé en 5.3).
4. **DefeatScreen** — écran affiché après une défaite, avec un bouton **"Réessayer"** qui relance la même bataille (la faction déjà choisie reste conservée, aucun nouveau choix de faction demandé). Sert aussi après un match nul (`rules.md` 8.1), avec le titre « Match nul » au lieu de « Défaite » : même suite, aucun vainqueur. **Après une bataille de « Partir en guerre »** (`rules.md` 11.7) : il liste aussi les unités perdues (au format du bilan des pertes, 5.3) et ajoute un bouton **« Retour à l'accueil »** ; « Réessayer » relance la bataille avec l'armée telle qu'elle reste, et est désactivé si l'armée est vide.
5. **HomeScreen** — écran d'accueil, point central du jeu. **Accessible uniquement après avoir remporté la bataille tutoriel.** Affiche la faction choisie par le joueur (ex : "Vous jouez la Souveraine des Wyrms."), le **solde de Spirit Stones** en haut à droite (`rules.md` 11.3) avec, à sa droite, une **icône d'engrenage** (`settings.png`) qui ouvre un petit menu déroulant des paramètres — deux entrées : « Codex des mots-clés » (`CodexScreen`) et « Réinitialiser le jeu » (5.4) —, en haut à gauche le **portrait du souverain** avec, à sa droite, son nom, sa **barre d'XP** et son **niveau** (texte à côté de la barre, pas de badge) (`rules.md` 11.5), et, sur le bord gauche, quatre entrées de menu (sans style de bouton ni séparateur, `GRAPHICS.md`) : **Partir en guerre** (`WarScreen`), un bouton au **nom de la faction** suivi du nombre d'individus possédés (« Wyrms (21) » ou « Morts-Vivants (22) », `UnitsScreen`), **Armées** (`ArmyScreen`) et **Invocation** (`SummonScreen`). L'accueil affiche aussi, en bas à gauche, la **Spirit Fountain** (`rules.md` 11.8) : la statue de pierre (`stone-statue`) avec l'icône des Spirit Stones et le contenu actuel, mis à jour en continu ; un clic récolte. Elle est mise en route à la première arrivée sur l'accueil.
6. **UnitsScreen** et **ArmyScreen** — gestion de civilisation, en **deux écrans séparés**, chacun ouvert par son propre bouton de `HomeScreen` (pas d'onglets pour passer de l'un à l'autre) :
   - **Unités** (`UnitsScreen`), titré du nom de la faction (« Wyrms » / « Morts-Vivants ») : une **grille** (autant de colonnes que la largeur le permet) de **cases carrées**, espèce par espèce dans l'ordre du roster (panneau PanelLarge, `GRAPHICS.md`). Comme dans la tour de commandement (`ui-battle-screen-decisions.md` 2.2), **chaque espèce tient par défaut dans une seule case**, niveaux confondus ; une **flèche en haut à droite** de sa première case (si l'espèce a plusieurs niveaux) la sépare en une case par **groupe d'individus strictement identiques** (même niveau), par niveau décroissant, et un nouveau clic la regroupe (choix non sauvegardé). Une case montre le sprite, puis le nom et le niveau en couleur de la faction — la **tranche des niveaux présents** pour une case regroupée (« niv 1-5 ») ; un **carré en haut à gauche** (GridPanelInactive du pack) indique le nombre d'individus de la case (« 3x », absent pour un individu seul). Une espèce sans individu garde une case grisée avec son bouton « Invoquer » / « Réinvoquer » vers `SummonScreen`. Un clic sur une case ouvre la **page de détail du premier individu de la case** (le plus haut niveau, puis le plus avancé en XP ; vue interne à l'écran, pas un écran à part). La page de détail montre **toujours un seul individu**, jamais un groupe : grand sprite, nom de l'espèce, niveau, keywords, sa barre d'XP, stats complètes **à son niveau** (`rules.md` 11.6), texte des aptitudes ; des **flèches** sans cadre de bouton (◀ ▶) à gauche et à droite (centrées en hauteur) passent à l'**individu** précédent / suivant, un par un, dans l'ordre de la grille — y compris d'un individu à l'autre d'un même groupe (désactivées au bout) ; la flèche « Retour » (◀) de l'en-tête ramène à la grille (pas de bouton d'invocation).
   - **Armée** (`ArmyScreen`), titré « Armées » : nom modifiable, compteur « X / 500 PP », et un **accordéon par espèce**, les accordéons **côte à côte** (une colonne par espèce) — fermé, l'en-tête seul (sprite, nombre, nom, coût) ; ouvert, **une ligne par groupe d'individus strictement identiques** (même niveau, comme la tour de commandement) : nombre (« 3x », absent pour un individu seul), niveau, « X / Y dans l'armée », et des boutons − / + pour retirer ou ajouter un individu du groupe (`rules.md` 11.2). **Tous les accordéons sont ouverts par défaut** (un nouveau joueur voit tout de suite les boutons − / +) ; chacun se ferme et se rouvre indépendamment, sans sauvegarde.
   - Dans la grille des unités comme dans un accordéon ouvert de l'armée, les individus d'une espèce sont triés par **niveau décroissant, puis XP décroissante** : les vétérans en haut.
   - Au niveau 5 (maximum, `rules.md` 11.6), la barre d'XP d'un individu est pleine et affiche **« MAX »** au lieu de « X / Y XP » (provisoire, voir la Suite de `roadmap-mvp.md`).
7. **SummonScreen** — écran d'invocation, accessible depuis `HomeScreen` et depuis la case grisée d'une espèce sans individu (`UnitsScreen`). Deux colonnes (**1/3 – 2/3**). À gauche, une ligne par espèce de la faction du joueur — **sauf un [Légendaire] encore vivant**, masqué tant qu'il est à vos côtés : sprite, nom et prix en Spirit Stones (pas le nombre possédé). Un clic sur une espèce la **met en avant** — sa ligne est marquée par des **coins décoratifs** (Decorators/BorderC, dorés pour les Wyrms, violets pour les Morts-Vivants) au lieu d'un cadre — et l'affiche à droite : son sprite en grand au centre, et en bas le bouton « Invoquer (prix) » (« Réinvoquer (prix) » pour un [Légendaire] mort ; désactivé si le solde est insuffisant) qui invoque l'espèce mise en avant — `rules.md` 11.4. Au-dessus de ce bouton, pour une espèce qui n'est pas [Légendaire], des boutons **− / +** choisissent combien d'individus invoquer d'un coup (de 1 au maximum payable avec le solde ; si le solde ne paie même pas un individu, le nombre reste à 1, − et + sont désactivés, comme le bouton « Invoquer ») ; le bouton devient alors « Invoquer x2 (somme des prix) ». Le nombre revient à 1 après une invocation ou un changement d'espèce. À l'ouverture, la première espèce proposée est mise en avant (de même quand le [Légendaire] mis en avant vient d'être réinvoqué et disparaît de la liste). La boîte de confirmation de « Réinvoquer » propose le **niveau gardé** (de 1 au niveau du [Légendaire] à sa mort) et affiche le prix correspondant. Solde affiché comme sur `HomeScreen`.
8. **WarScreen** — écran « Partir en guerre », accessible depuis `HomeScreen` (`rules.md` 11.7). La **map 1** en arbre de compétences (`GRAPHICS.md`, `rules.md` 11.7) : un réseau de losanges — trois chemins du départ au boss, des passerelles et des impasses —, sur le fond de la map en plein écran ; les trois premiers losanges du chemin du bas portent les batailles, les autres sont verrouillés (« À venir »). Trois losanges sont surmontés d'un **envahisseur** ennemi (batailles de boss, `rules.md` 11.7), avec au-dessus de la map le compteur « Repousse l'envahisseur N/3 ». Un clic sur un losange le sélectionne (par défaut, la dernière bataille débloquée) et l'affiche dans un panneau à droite de la map : nom, état (**verrouillée**, **disponible**, **gagnée**), un bouton **« Combattre »** par bataille débloquée, désactivé si l'armée est vide (« Composez votre armée »), puis sous ce bouton une **rangée de récompenses** de la prochaine victoire : les Spirit Stones (0 au rejeu, `rules.md` 11.7) et l'XP du joueur, affichée en fourchette (« 100–200 » : 100 + jusqu'à 100 selon les PP survivants ; « 25–50 » au rejeu, `rules.md` 11.5). Une fois les trois batailles gagnées, message « D'autres terres à conquérir arrivent bientôt… ». Bouton « Retour » vers l'accueil.
9. **CodexScreen** — codex des mots-clés, accessible depuis le menu des paramètres de `HomeScreen`. Liste tous les tags affichés sur les unités — types d'attaque (« Corps-à-corps », « Tirs ») puis keywords (« Légendaire », « Vol ») — chacun dans le même badge que sur la page de détail d'un individu, suivi de son effet en une ou deux phrases (résumé de `rules.md` : 4.2 corps-à-corps, 4.5 tir à distance, 2 et 11.4 [Légendaire], 3 [Vol] ; textes dans `strings.js`). Bouton « Retour » vers l'accueil.

### 5.2 Enchaînement (v1)

```
IntroScreen → FactionChoiceScreen (une fois)
        │
        ▼
   BattleScreen ──────► DefeatScreen ──"Réessayer"──┐
        │                                             │
     victoire                                         │
        │                                             │
        ▼                                             │
  VictoryScreen                                        │
        │                                              │
        ▼                                              │
   HomeScreen ◄────────────────────────────────────────┘ (après la victoire)
     ├──► UnitsScreen (grille / détail d'un individu) ou ArmyScreen ──► retour HomeScreen
     │         └── « Invoquer » depuis une case grisée ──► SummonScreen
     ├──► SummonScreen ──► retour HomeScreen
     ├──► CodexScreen (menu des paramètres) ──► retour HomeScreen
     └──► WarScreen (« Partir en guerre ») ──► BattleScreen ──► VictoryScreen / DefeatScreen ──► retour HomeScreen (ou « Réessayer »)
```

« Réessayer » sur `DefeatScreen` relance `BattleScreen`.

- Au chargement de l'application, le profil sauvegardé (5.4) est lu : s'il n'y a pas encore de faction choisie, `IntroScreen` s'affiche, puis `FactionChoiceScreen` ; si une faction est déjà choisie mais la bataille tutoriel pas encore gagnée, l'app va directement à `BattleScreen` ; sinon, directement à `HomeScreen`.
- **Bataille tutoriel** : une défaite ne fait perdre ni la faction choisie ni aucune autre donnée persistée — seul un nouvel essai de la même bataille est proposé, et aucune perte d'unité d'une tentative ratée n'est comptabilisée (voir 5.4).
- **« Partir en guerre »** : une défaite, un abandon ou un match nul font perdre définitivement les individus tués (`rules.md` 11.7) ; rien d'autre n'est perdu.

### 5.3 Squelette de VictoryScreen et DefeatScreen pour la v1
- Les deux écrans sont volontairement minimaux : un titre (Victoire / Défaite ou Match nul), et un seul bouton d'action (Continuer vers l'accueil / Réessayer). Exception : la défaite (ou le match nul) d'une bataille de « Partir en guerre » affiche aussi la liste des unités perdues et deux boutons, « Réessayer » et « Retour à l'accueil » (5.1, `rules.md` 11.7)
- **Victoire** : entre le titre et le bouton, dans cet ordre (niveaux : `rules.md` 11.5 et 11.6) :
  1. une **rangée de récompenses**, avec le **même composant** que la rangée de récompenses du panneau de `WarScreen` (5.1, `GRAPHICS.md` « Partir en guerre ») : les **Spirit Stones gagnées** (icône, montant en dessous) — un seul total, qui additionne la récompense de victoire (`rules.md` 11.7) et les récompenses de niveau du joueur (11.5) —, puis l'**XP gagnée par le joueur** (« XP », montant exact en dessous, plus de fourchette) ;
  2. les **individus qui ont gagné au moins un niveau** pendant la bataille, regroupés par espèce et par passage de niveau, au format du bilan des pertes (ex : « 2x [sprite] Ver de Lambton niv 1 → 2 »). Bloc absent si aucun individu n'a monté de niveau ;
  3. le **bilan des pertes** : la liste des unités perdues (tuées) pendant la bataille, par espèce avec le nombre d'individus, « Aucune perte ! » s'il n'y en a pas.

### 5.4 Navigation et profil sauvegardé
- **Gestion de la navigation entre écrans : état React simple** (un state `screen` dans le composant racine `App.jsx`), pas de librairie de routing — le jeu est une session continue dans un seul onglet, sans besoin d'URLs distinctes par écran.
- **Profil du joueur** : un seul objet, sauvegardé sous **une seule clé du localStorage** (`siw.save`, versionnée) par un store Zustand avec le middleware `persist` (`src/state/profileStore.js`). Ses champs (`EMPTY_PROFILE`, `roadmap-mvp.md`) :
  1. `faction` : la faction choisie par le joueur
  2. `tutoBattleWon` : la bataille tutoriel a été gagnée (l'accueil est débloqué)
  3. `units` : les **individus possédés**, chacun `{ id, species, xp }` (`rules.md` 11.1 et 11.6 ; le niveau se calcule à partir de l'XP, il n'est pas sauvegardé) : créée avec l'armée de départ de la faction, mise à jour à chaque victoire (individus tués retirés, XP gagnée), à chaque défaite de « Partir en guerre » (individus tués retirés, `rules.md` 11.7) et à chaque invocation — jamais lors d'une tentative ratée de la bataille tutoriel (voir 5.2)
  4. `army` : l'**armée**, `{ name, unitIds }` (`rules.md` 11.2)
  5. `spiritStones` : le **solde de Spirit Stones** (entier, `rules.md` 11.3)
  6. `playerXp` : l'**XP du joueur** (entier, `rules.md` 11.5 ; le niveau se calcule à partir de l'XP)
  7. `fallenLegendaryLevel` : le **niveau du [Légendaire] à sa mort** (null s'il n'est jamais mort ; `rules.md` 11.4), mis à jour à chaque mort du [Légendaire] comptabilisée (victoire, ou défaite de « Partir en guerre »)
  8. `wonWarBattles` : les **batailles de « Partir en guerre » gagnées** (identifiants, ex : `['battleStartW01']` ; `rules.md` 11.7) : sert au déblocage de la bataille suivante et aux gains du rejeu (aucune Spirit Stone, XP du joueur à 25 %)
  9. `fountainLastHarvest` : l'**heure de la dernière récolte de la Spirit Fountain** (horodatage en millisecondes, `rules.md` 11.8 ; null tant que la fontaine n'est pas en route) : son contenu se recalcule à partir de cette heure
  10. `homeTipsSeen` : les **conseils de l'accueil déjà vus** (identifiants, ex : `['welcome']`, 5.5) : un conseil vu ne réapparaît jamais
- **Seules les actions du store modifient le profil** (`chooseFaction`, `applyVictory`, `applyWarDefeat`, `summonUnits`, `resummonLegendary`, `setArmy`, `startFountain`, `harvestSpiritFountain`, `markHomeTipSeen`, `resetProfile`) : elles appellent les règles de `src/logic/` et enregistrent le résultat, qui est sauvegardé aussitôt.
- **Identifiant d'un individu** : généré par `crypto.randomUUID()` à sa création (armée de départ ou invocation). Jamais dérivé de la taille de la liste, qui réutiliserait l'identifiant d'un individu mort ; aucun compteur n'est sauvegardé.
- Aucun champ de personnalisation n'est ajouté aux individus : l'identifiant suffit pour que les armées référencent des individus, et pour accueillir la personnalisation plus tard sans migration de sauvegarde.
- C'est une exception ciblée à l'absence de persistance, pas un système de sauvegarde généralisé : ce profil suffit à reconstituer l'écran de départ au chargement (5.2) et à afficher les écrans de la couche méta.
- Le raccourci « restart game » du menu devs (5.6) efface le profil et ramène à `IntroScreen`. Côté joueur, l'entrée **« Réinitialiser le jeu »** du menu des paramètres de `HomeScreen` (5.1) fait de même, après une boîte de confirmation (« Réinitialiser le jeu ? » [Annuler] [Réinitialiser]).
- Aucune autre donnée n'est persistée (l'état d'une bataille en cours, par exemple, repart de zéro à chaque chargement de `BattleScreen`).

### 5.5 Tutoriels
- **Un tutoriel est rattaché à une bataille**, pas au joueur : le fichier de chaque bataille (`src/data/battles/`) indique son tutoriel éventuel, et `BattleScreen` reçoit l'identifiant de la bataille à jouer. La bataille tutoriel (`battleTuto`) a le tutoriel de départ ; un tutoriel se rejoue à chaque « Réessayer » après une défaite ou un match nul.
- **Le contenu d'un tutoriel est une donnée** (`src/data/tutorials.js`) : une liste d'étapes (message, cibles de la main, gel, actions permises, conditions d'entrée et de passage). Le moteur (`src/logic/battles/tutorial.js`) et l'affichage (`src/ui/TutorialOverlay.jsx`) sont communs à toutes les batailles : un nouveau tutoriel s'écrit sans toucher au code, tant qu'il réutilise les conditions et les cibles de main existantes.
- **Chaque étape qui demande ou explique quelque chose fige la bataille** (tous les compteurs gelés, comme une pause, `rules.md` 5.2) et **n'autorise que l'action demandée**. Le bouton Pause est alors désactivé ; le bouton Abandonner reste toujours disponible (`rules.md` 8.2).
- Chaque étape affiche un **message** (composant `Item` 8bitcn, en haut du terrain) et une **main** qui montre l'action à faire. C'est le seul overlay autorisé par-dessus le terrain avec les tooltips (section 2.3).
- **Tutoriels existants** (`src/data/tutorials.js`) :
  - `STARTER_TUTORIAL` — tutoriel de départ, **sur la bataille tutoriel**. Son déroulé complet :

| Étape | Message | Main | Bataille | Suite |
|---|---|---|---|---|
| 1 | « Déploie ta 1ère unité. » | Allers-retours entre l'unité basique (Lambton / Skeleton) et la zone de déploiement | Figée (seul le déploiement est permis) | Le joueur déploie sa première unité |
| 1 (suite) | « Ton unité va combattre d'elle-même les ennemis. Certaines espèces de créatures tirent à distance, d'autres au corps-à-corps. » + [Continuer] | — | **En cours** : le joueur voit son unité se battre | Le message disparaît après 5 s au plus (ou au clic sur [Continuer]) ; l'étape 2 arrive 8 s (temps de bataille) après le début de l'étape |
| 2 | « Chaque unité possède des points de présence (PP). Tu ne peux pas dépasser une présence de 150 sur le terrain. Choisis bien tes unités déployées ! » + [Continuer] | Allers-retours entre la jauge de présence et le tag PP de l'unité basique | Figée | Clic sur [Continuer] ; la bataille reprend normalement |
| 3 | « Tu peux donner des ordres à tes unités. Essaie de faire battre en retraite l'une d'entre elles. » | Tapote le bouton Fuir de la rangée « Ordres » (lui seul) | Figée (seul l'ordre Fuir est permis) | Le joueur clique sur Fuir : étape 3 (suite) |
| 3 (suite) | « Clique ensuite sur l'unité à qui tu veux donner cet ordre. » | Tapote l'unité du joueur qui a le **moins de PV actuels** (en cas d'égalité, la première déployée) ; le joueur peut en choisir une autre | Figée (seul le choix d'une unité du joueur est permis) | L'ordre de fuite est donné : fin du tutoriel, la bataille reprend aussitôt et l'unité fuit. Annuler Fuir (re-clic sur Fuir, clic droit, Échap) ramène à l'étape 3 |

- **Déclenchement de l'étape 3** : quand l'IA a déployé son **avant-dernière vague** (avant-dernière entrée de son script, `rules.md` 7.1 — t=28 s) **ou au plus tard 8 s** (temps de bataille) après la fin de l'étape 2, au premier des deux ; dans les deux cas, dès que le joueur a au moins une unité sur le terrain, que Fuir est disponible (pas de cooldown en cours) et qu'aucun geste n'est en cours.

- **Tutoriel de l'accueil** (`HomeScreen`) : pas de visite guidée, mais des **conseils** qui apparaissent un par un, au moment où la fonction devient utile. Rien n'est verrouillé ni caché : le joueur peut tout explorer librement.
  - **Règles communes** : même bulle (`Item`, en haut de l'écran) et même main blanche que le tutoriel de bataille ; **une seule bulle à la fois**, au plus une par arrivée sur l'accueil ; **rien n'est figé** (tout reste cliquable) ; la bulle a un bouton [×] et disparaît aussi dès que le joueur quitte l'accueil. **Chaque conseil n'apparaît qu'une fois** : il est marqué vu dès qu'il s'affiche (sauvegardé, 5.4).
  - **Conseils** (l'ordre donne la priorité si deux sont prêts en même temps) :

| Conseil | Déclencheur | Message | Main |
|---|---|---|---|
| `welcome` | Première arrivée sur l'accueil | « Voici ton noble domaine, le territoire de ton peuple. » (retour à la ligne) « L'ennemi continue cependant son invasion, repousse-le ! » | Tapote « Partir en guerre » |
| `summon` | Arrivée sur l'accueil quand une espèce compte moins d'individus que sa dotation de départ (`units.md`, pertes) **et** que le solde paie l'invocation d'un individu de cette espèce (`rules.md` 11.4). Marqué vu aussi dès que le joueur invoque de lui-même | « En tant que souverain, tu possèdes un pouvoir puissant : fais grandir ton peuple en invoquant de nouvelles créatures. » (les unités sont le peuple vivant du souverain, jamais des pions remplaçables : pas de « remplacer ses morts ») | Tapote « Invocation » |
| `armyRecruit` | Arrivée sur l'accueil après au moins une invocation faite depuis l'arrivée précédente (écran Invocation ouvert depuis l'accueil ou depuis la section Unités ; non sauvegardé), avec au moins un individu hors de l'armée (`rules.md` 11.2 : un individu invoqué n'est pas ajouté à l'armée) | « Ta recrue n'est pas encore dans ton armée. Ajoute-la avant de repartir. » | Tapote « Gestion d'armée » |

  - Conseils prévus plus tard (hors de cette étape) : Spirit Fountain quand elle a de quoi être récoltée, vétérans dans la section Unités.

### 5.6 Menu devs (outil de développement)
- Menu burger « devs » fixe en haut à gauche de l'écran, par-dessus tous les écrans (`src/dev/DevMenu.jsx`). **Affiché seulement en développement** (`npm run dev`), absent du build publié.
- Raccourcis :
  - **restart game** : efface le profil et relance le jeu depuis l'introduction.
  - **skip tutorial** : affiché seulement pendant la bataille tutoriel ; la compte comme gagnée sans combat et ouvre l'accueil (`rules.md` 11).
  - **test-wyrm** / **test-undead** : remplace le profil par un joueur de test figé et ouvre l'accueil, sans jouer la bataille tutoriel. Profils de test : `src/dev/testProfiles.js`, écrits avec tous les champs du profil (5.4) :
    - **test-wyrm** : faction Wyrms, bataille tutoriel gagnée, 3 Vers de Lambton et 1 Amphiptère perdus (soit 9 / 7 / 1 individus restants), une armée contenant ces 17 survivants (375 PP) et **10 000 Spirit Stones** ; **test-undead** : la même progression côté Morts-Vivants (14 / 7 / 1 individus, 369 PP).
    - **Niveaux** (`rules.md` 11.5 et 11.6) : joueur à **1 700 XP** (niveau 3, 200 / 1 500 dans le niveau). XP des individus de test-wyrm (seuils cumulés : niveau 2 à 50, 3 à 150, 4 à 300, 5 à 500) :
      - Vers de Lambton : 500 (niveau 5, MAX), 320 (4), 160 (3), 60 (2), 20, 0, 0, 0, 0 (niveau 1) ;
      - Amphiptères : 70 (niveau 2), 30, 0, 0, 0, 0, 0 (niveau 1) ;
      - Fafnir : 350 (niveau 4).
    - **Spirit Fountain** pleine (dernière récolte il y a 24 h, `rules.md` 11.8), pour tester la récolte.
    - **Tutoriel de l'accueil déjà passé** : tous les conseils sont marqués vus (5.5).
