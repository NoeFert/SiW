# TECHNICAL.md

> **Rôle** : le comment — stack, architecture, écrans, stratégie de tests. Le comportement du jeu est dans `rules.md` et `units.md`, l'apparence dans `GRAPHICS.md`. Index des fichiers : `README.md`.

## 1. Stack

| Rôle | Choix |
|---|---|
| Langage | JavaScript |
| Champ de bataille | Phaser 3 (3.90.0), pas Phaser 4 |
| Reste de l'interface | React + Tailwind CSS + shadcn/ui, thème 8bitcn (`npx shadcn@latest add @8bitcn/<component>`) |
| Bundler | Vite (plugin React) |
| Paquets | npm |

Le pourquoi de ces choix : `DECISIONS.md`.

## 2. Architecture

**Principe central : la logique du jeu ne dépend jamais de Phaser, ni de React.** Les règles vivent dans `src/logic/`, en JavaScript pur : elles se testent sans navigateur, et une bataille complète se simule en ligne de commande (`npm run balance`, `npm run debug`). Phaser et React affichent l'état et transmettent les actions du joueur.

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
  state/profileStore.js Profil du joueur, sauvegardé (5.4)
  scenes/               Phaser : BattleScene et ses vues (scenes/battle/)
  screens/              React : un fichier par écran (5)
  ui/                   React : composants, textes affichés (strings.js), thème de faction
  dev/, debug/          Menu devs, profils de test, outils de debug et d'équilibrage
tests/                  Jest : logic/ (règles), state/ (profil), ui/ (assets du thème)
```

**Moteur de bataille** (`src/logic/battles/`), quatre rôles :
1. **Déroulé** : `battleSetup.js` (préparer une bataille), `battle.js` (l'objet bataille et la boucle `tickBattle`, lisible de haut en bas), `phases.js`, `pause.js`, `tutorial.js`.
2. **Unités sur le terrain**, identiques pour les deux camps : `battleUnit.js`, `unitBehavior.js`, `pathfinding.js`, `grid.js`, `deployment.js`.
3. **Les deux commandants** : le joueur (`playerActions.js`, `orderSelection.js`, `fleeCooldown.js`) et l'IA (`aiScript.js`).
4. **Fin de bataille** : `battleEnd.js`.

### 2.2 Deux états, deux propriétaires

- **Le profil du joueur** (sauvegardé) : un store Zustand, `src/state/profileStore.js`. Les écrans le lisent avec `useProfileStore` ; seules ses actions le modifient, en appelant `src/logic/` (5.4).
- **La bataille en cours** (jamais sauvegardée) : un objet modifié en place par le moteur (`createBattle`, `battle.js`). `BattleScreen` le crée (`createBattleFromDefinition`) et le possède : il le donne à la Scene Phaser, qui le fait avancer et l'affiche à chaque frame, et à la tour et au tutoriel par leurs props. Après chaque frame, la Scene émet `BATTLE_FRAME_EVENT` : `BattleScreen` se redessine et détecte la fin. Le résultat passe au profil par `applyVictory` ou `applyWarDefeat`.

### 2.3 Répartition Phaser / React

- **Phaser : le champ de bataille seulement.** `BattleScene` orchestre et délègue à une vue par sujet (`src/scenes/battle/`) : `BattlefieldView` (fond, rochers), `DeploymentZoneView`, `UnitViews` (sprites, barres de vie, compteurs, déplacements), `CombatEffects` (missiles, entailles, aptitudes, textes flottants), `FieldInput` (clics), `PauseTint` (désaturation).
- **React : tout le reste**, dont la tour de commandement (`src/ui/CommandTower.jsx`, `OrdersRow.jsx` ; disposition : `ui-battle-screen-decisions.md`).
- Canevas et tour sont **côte à côte**, jamais superposés ; seuls les infobulles, la confirmation d'abandon et l'overlay du tutoriel passent par-dessus. Aucune couche ne manipule les objets de l'autre.
- **Couleurs des factions** : chaque faction déclare sa couleur principale et sa palette d'interface (`color`, `uiColor`, `src/data/factions/`). `src/ui/factionTheme.js` en tire des variables CSS sur `<html>` ; Phaser lit `factionColor()`. Changer ces deux champs change toutes les couleurs de la faction. Assets d'interface rangés par couleur : `assets/ui/<couleur>/` (`assets/README.md`).

### 2.4 Modélisation des données
- **Entités avec comportement et état** (une unité sur le terrain) : classes ES6 (`BattleUnit`), qui **référencent** leur espèce au lieu de copier ses stats. La bataille est un objet simple, modifié par les fonctions du moteur.
- **Configuration statique** (factions, batailles, tutoriels, effets) : objets simples dans `src/data/`.

### 2.5 Nommage
- Code, fichiers, dossiers et assets **en anglais** (`BattleUnit`, `unitBehavior.js`, `lambton-worm.png`) ; commentaires et specs en français ; textes affichés en français, dans `src/ui/strings.js`.
- **Vocabulaire** : une **guerre** (war) est un ensemble de batailles sur une map ; une **bataille** (battle) n'est jamais appelée « war ». Identifiants : `battleTuto`, puis `battle` + emplacement de la map + `W` + numéro de la guerre (`battleStartW01`). Ce que le joueur donne à ses unités est un **ordre** (`orderSelection`, `issuePlayerFlee`).

### 2.6 Simplicité
Code DRY et direct, sans abstraction pensée pour la v2+ (pas de plugins, pas de couche de configuration générique) tant qu'un besoin concret ne l'exige pas.

## 3. Rendu

- **Case : 64 × 64 px** ; le canevas fait **1536 × 896 px** à sa taille de référence (24 × 14 cases).
- **Assets à 2× leur taille d'affichage** : 128 × 128 px pour une unité d'une case, 256 × 256 px pour une 2×2 (PNG transparents) ; fond de bataille 3072 × 1792 px si possible, 1536 × 896 px au minimum. Seule la taille en pixels compte, pas le DPI.
- Les positions de `src/logic/` restent dans le référentiel fixe de la grille ; seule la couche Phaser convertit vers la taille affichée. Aucune règle ne dépend de la résolution.

### 3.1 Taille de la fenêtre (desktop uniquement)
- Pas de mode mobile ni tactile. **Taille minimale : 1024 × 560** ; en dessous, le surplus défile au lieu d'écraser les éléments.
- Le canevas garde son ratio 24:14 (`Phaser.Scale.FIT` dans un parent redimensionnable) ; la tour s'adapte librement autour, toujours entière.
- **Pas de barre de défilement non voulue.** Ce qui ne tient pas se réduit ou se réorganise : la map de « Partir en guerre » rétrécit (jamais au-delà de sa taille normale) ; sous 1280 px de large, le titre « Choisis ta faction » remonte au-dessus des souverains ; sur l'écran de victoire, « Montées de niveau » et « Unités perdues » sont côte à côte.
- **Défilements voulus** : la liste de la tour, et une colonne de bilan exceptionnellement longue (dans sa colonne, jamais la page).

## 4. Tests

- **Jest** : les règles de `src/logic/` (`tests/logic/`), les actions du profil (`tests/state/`), les assets cités par les factions (`tests/ui/`). Les données sont vérifiées automatiquement : chaque phase de chaque bataille (`battleData.test.js`), chaque faction (`wyrmsFaction.test.js`, `undeadFaction.test.js`).
- Chaque règle chiffrée de `rules.md` a au moins un test. Priorités : résolution du combat (dont dégâts de zone), pathfinding, engagement au corps-à-corps, fin de bataille, déploiement (zone, plafond, copies), couche méta (armée, invocation, nom), niveaux (courbes, stats, XP de survie et de kill, récompenses, prix du niveau gardé).
- **Test de référence** (`tests/logic/battles/battleReplay.test.js`) : chaque bataille est rejouée par le bot d'équilibrage avec un aléa fixé, et comparée à un instantané. Un écart signale un changement de comportement du moteur ; s'il est voulu, régénérer l'instantané (`npx jest battleReplay -u`).
- **Pas de tests automatisés de Phaser ni de React** (rendu, animations, input, composants) : validés à la main, en jouant.
- **Outil d'équilibrage** (`src/debug/balance/`, `npm run balance`, skill `/balancer`) : script Node qui joue des batailles avec le moteur de `src/logic/` et un bot passif (4 stratégies), seed fixe, sans localStorage. Il mesure, il ne valide pas ; il sert notamment à vérifier la difficulté visée d'un script de « Partir en guerre » (`rules.md` 11.7).

## 5. Écrans et navigation

Douze écrans (`src/screens/`) ; seul `BattleScreen` contient le canevas Phaser. Apparence de chaque écran : `GRAPHICS.md`.

### 5.1 Liste des écrans

| Écran | Contenu et comportement |
|---|---|
| **IntroScreen** | texte d'introduction (le joueur est un souverain qui mènera les siens à la guerre) et un bouton pour continuer ; une seule fois, au tout début |
| **PrologueScreen** | animation, une seule fois, après l'intro : deux paragraphes apparaissent en fondu l'un après l'autre (1 s de fondu, 4 s chacun), disparaissent en fondu (1 s) ; la Souveraine des Wyrms glisse depuis la gauche (1 s), puis le Souverain des Morts-Vivants depuis la droite (1 s) ; ils dialoguent, une réplique à la fois dans une bulle tournée vers le centre, « Continuer » passe à la suivante ; fondu vers le choix de faction (1 s). Pas de bouton pour passer. Le souverain qui glisse avec sa bulle est un composant à part (`SovereignDialogue`), réutilisable. Textes dans `strings.js` |
| **FactionChoiceScreen** | choix entre la Souveraine des Wyrms et le Souverain des Morts-Vivants ; une seule fois |
| **BattleScreen** | bataille tutoriel ou de « Partir en guerre » : tour de commandement à gauche, canevas à droite (`ui-battle-screen-decisions.md`) ; crée la bataille et la partage (2.2) |
| **VictoryScreen** | récompenses, montées de niveau, pertes (5.3) |
| **DefeatScreen** | après une défaite, ou un match nul (titre « Match nul ») : « Réessayer » relance la même bataille, sans nouveau choix de faction. Après « Partir en guerre » : aussi les unités perdues et « Retour à l'accueil » ; « Réessayer » est désactivé si l'armée est vide |
| **HomeScreen** | voir ci-dessous |
| **UnitsScreen** | voir ci-dessous |
| **ArmyScreen** | voir ci-dessous |
| **SummonScreen** | voir ci-dessous |
| **WarScreen** | voir ci-dessous |
| **CodexScreen** | depuis le menu des paramètres : chaque tag des unités — types d'attaque (« Corps-à-corps », « Tirs ») puis keywords (« Légendaire », « Vol ») — avec son effet en une ou deux phrases (textes dans `strings.js`) ; « Retour » vers l'accueil |

**HomeScreen** — l'accueil, point central, accessible seulement après la victoire de la bataille tutoriel.
- La faction du joueur est rappelée (« Vous jouez la Souveraine des Wyrms. »).
- En haut à gauche : le portrait du souverain, son nom, sa barre d'XP et son niveau (11.5). En haut à droite : le solde de Spirit Stones (11.3) et une icône d'engrenage qui ouvre le menu des paramètres (« Codex des mots-clés », « Réinitialiser le jeu », 5.4).
- Sur le bord gauche, quatre entrées : **Partir en guerre**, le **nom de la faction** suivi du nombre d'individus possédés (« Wyrms (21) », vers `UnitsScreen`), **Armées**, **Invocation**.
- En bas à gauche : la **Spirit Fountain** (11.8) et son contenu, mis à jour en continu ; un clic récolte. Elle est mise en route à la première arrivée sur l'accueil.

**UnitsScreen** — titré du nom de la faction.
- Une grille de cases carrées, espèce par espèce dans l'ordre du roster. Par défaut une case par espèce, niveaux confondus (« niv 1-5 ») ; une flèche sur la première case (si l'espèce a plusieurs niveaux) la sépare en une case par niveau, par niveau décroissant, et un nouveau clic la regroupe (choix non sauvegardé). Une case montre le sprite, le nom, le niveau et le nombre d'individus (« 3x », seulement à partir de 2).
- Une espèce sans individu garde une case grisée avec « Invoquer » / « Réinvoquer », vers `SummonScreen`.
- Un clic ouvre la **page de détail** du premier individu de la case (plus haut niveau, puis plus d'XP) : toujours un seul individu — grand sprite, espèce, niveau, keywords, barre d'XP, stats à son niveau (11.6), aptitudes ; pas de bouton d'invocation. Des flèches passent à l'individu précédent ou suivant, un par un, dans l'ordre de la grille (désactivées au bout) ; « Retour » ramène à la grille.

**ArmyScreen** — titré « Armées ».
- Le nom de l'armée, modifiable à tout moment (règles du nom : `rules.md` 11.2) : validation par Entrée ou par un bouton ✓, annulation par Échap.
- Un compteur « X / 500 PP ».
- Un **accordéon par espèce**, côte à côte, tous ouverts par défaut (chacun se ferme indépendamment, sans sauvegarde). Fermé : sprite, nombre, nom, coût. Ouvert : une ligne par niveau, avec le nombre, le niveau, « X / Y dans l'armée » et les boutons − / + (11.2).

Dans la grille des unités et dans les accordéons, les individus sont triés par niveau puis XP décroissants. Au niveau 5, la barre d'XP est pleine et affiche « MAX ».

**SummonScreen** — depuis l'accueil, ou la case grisée d'une espèce sans individu.
- Deux colonnes (1/3 – 2/3). À gauche, une ligne par espèce de la faction (sprite, nom, prix ; pas le nombre possédé), **sauf le [Légendaire] tant qu'il est vivant**. Un clic met une espèce en avant ; à l'ouverture, c'est la première (de même quand le [Légendaire] mis en avant vient d'être réinvoqué et disparaît).
- À droite, l'espèce mise en avant en grand, et le bouton « Invoquer (prix) » — « Réinvoquer (prix) » pour un [Légendaire] mort — désactivé si le solde est insuffisant (11.4).
- Pour une espèce non légendaire, des boutons − / + choisissent combien en invoquer (de 1 au maximum payable ; si le solde ne paie pas un individu, le nombre reste à 1 et tout est désactivé) ; le bouton devient « Invoquer x2 (somme des prix) ». Le nombre revient à 1 après une invocation ou un changement d'espèce.
- « Réinvoquer » ouvre une confirmation où le joueur choisit le niveau gardé, avec son prix. Le solde est affiché comme sur l'accueil.

**WarScreen** — « Partir en guerre » (11.7).
- La map 1 en plein écran, en réseau de losanges (`GRAPHICS.md`) ; les emplacements sans bataille sont verrouillés (« À venir »). Au-dessus de la map : « Repousse l'envahisseur N/3 ».
- Un clic sélectionne un losange (par défaut, le dernier emplacement non verrouillé dans l'ordre de la liste de `warMap01.js`) et l'affiche dans un panneau à droite : nom, état (verrouillée, disponible, gagnée), bouton **« Combattre »** pour une bataille débloquée (désactivé si l'armée est vide : « Composez votre armée »), puis les récompenses de la prochaine victoire — Spirit Stones (0 au rejeu) et XP du joueur en fourchette (« 100–200 » ; « 25–50 » au rejeu).
- Toutes les batailles gagnées : « D'autres terres à conquérir arrivent bientôt… ». « Retour » vers l'accueil.

### 5.2 Enchaînement

```
IntroScreen → PrologueScreen → FactionChoiceScreen (une fois)
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

Au chargement, le profil (5.4) décide de l'écran : pas de faction → `IntroScreen` ; faction choisie mais bataille tutoriel pas gagnée → `BattleScreen` ; sinon → `HomeScreen`.

### 5.3 Écrans de fin de bataille
- Volontairement minimaux : un titre (Victoire, Défaite ou Match nul) et un bouton (Continuer vers l'accueil, ou Réessayer). Défaite d'une bataille de « Partir en guerre » : voir `DefeatScreen` (5.1).
- **Victoire**, entre le titre et le bouton, dans cet ordre :
  1. une **rangée de récompenses** (même composant que le panneau de `WarScreen`) : les Spirit Stones gagnées, en un seul total (récompense de victoire + récompenses de niveau), puis l'XP gagnée par le joueur, au montant exact ;
  2. les **individus qui ont gagné au moins un niveau**, regroupés par espèce et par passage de niveau (« 2x [sprite] Ver de Lambton niv 1 → 2 ») ; absent si aucun ;
  3. le **bilan des pertes** : les unités tuées, par espèce avec leur nombre, ou « Aucune perte ! ».

### 5.4 Navigation et profil sauvegardé
- **Navigation** : un simple état `screen` dans `App.jsx`, sans librairie de routing ni URL par écran.
- **Profil** : un seul objet, sous **une seule clé du localStorage** (`siw.save`, versionnée), par un store Zustand avec `persist` (`src/state/profileStore.js`, `EMPTY_PROFILE`). C'est la seule persistance du jeu (`roadmap-mvp.md`).

| Champ | Contenu |
|---|---|
| `faction` | la faction choisie |
| `tutoBattleWon` | la bataille tutoriel est gagnée (l'accueil est débloqué) |
| `units` | les individus possédés, `{ id, species, xp }` (le niveau se calcule) ; mis à jour à chaque victoire, défaite de « Partir en guerre » et invocation, jamais après une tentative ratée de la bataille tutoriel |
| `army` | l'armée, `{ name, unitIds }` |
| `spiritStones` | le solde (entier) |
| `playerXp` | l'XP du joueur (entier ; le niveau se calcule) |
| `fallenLegendaryLevel` | le niveau du [Légendaire] à sa dernière mort comptée (null s'il n'est jamais mort) |
| `wonWarBattles` | les batailles de « Partir en guerre » gagnées (ex : `['battleStartW01']`) : déblocage et rejeu |
| `fountainLastHarvest` | l'heure de la dernière récolte de la Spirit Fountain (ms ; null avant sa mise en route) |
| `homeTipsSeen` | les conseils de l'accueil déjà vus (ex : `['welcome']`) |

- **Seules les actions du store modifient le profil** (`chooseFaction`, `applyVictory`, `applyWarDefeat`, `summonUnits`, `resummonLegendary`, `setArmy`, `startFountain`, `harvestSpiritFountain`, `markHomeTipSeen`, `resetProfile`) ; elles appellent `src/logic/` et le résultat est sauvegardé aussitôt.
- **Identifiant d'un individu** : `crypto.randomUUID()` à sa création ; jamais dérivé de la taille de la liste (il réutiliserait l'identifiant d'un mort) ; aucun compteur sauvegardé. Aucun champ de personnalisation.
- **« Réinitialiser le jeu »** (menu des paramètres) efface le profil après confirmation (« Réinitialiser le jeu ? » [Annuler] [Réinitialiser]) et ramène à `IntroScreen`, comme « restart game » du menu devs (5.6).

### 5.5 Tutoriels
- **Un tutoriel est rattaché à une bataille**, pas au joueur : le fichier de la bataille indique son tutoriel éventuel. La bataille tutoriel (`battleTuto`) a le tutoriel de départ ; il se rejoue à chaque « Réessayer ».
- **Son contenu est une donnée** (`src/data/tutorials.js`) : des étapes (message, cibles de la main, gel, actions permises, conditions d'entrée et de passage). Le moteur (`src/logic/battles/tutorial.js`) et l'affichage (`src/ui/TutorialOverlay.jsx`) sont communs : un nouveau tutoriel s'écrit sans code s'il réutilise les conditions et cibles existantes.
- Une étape qui demande ou explique **fige la bataille** (`rules.md` 5.2) et n'autorise que l'action demandée ; le bouton Pause est désactivé, Abandonner reste disponible.
- Chaque étape affiche un **message** (en haut du terrain) et une **main** qui montre l'action.

**`STARTER_TUTORIAL`** (bataille tutoriel) :

| Étape | Message | Main | Bataille | Suite |
|---|---|---|---|---|
| 1 | « Déploie ta 1ère unité. » | va et vient entre l'unité basique et la zone de déploiement | figée (seul le déploiement est permis) | le joueur déploie une unité |
| 1 (suite) | « Ton unité va combattre d'elle-même les ennemis. Certaines espèces de créatures tirent à distance, d'autres au corps-à-corps. » + [Continuer] | — | en cours | le message disparaît après 5 s au plus (ou au clic) ; l'étape 2 arrive 8 s (temps de bataille) après le début de l'étape |
| 2 | « Chaque unité possède des points de présence (PP). Tu ne peux pas dépasser une présence de 150 sur le terrain. Choisis bien tes unités déployées ! » + [Continuer] | va et vient entre la jauge de présence et le tag PP de l'unité basique | figée | clic sur [Continuer] |
| 3 | « Tu peux donner des ordres à tes unités. Essaie de faire battre en retraite l'une d'entre elles. » | tapote le bouton Fuir (lui seul) | figée (seul Fuir est permis) | clic sur Fuir |
| 3 (suite) | « Clique ensuite sur l'unité à qui tu veux donner cet ordre. » | tapote l'unité du joueur qui a le moins de PV actuels (à égalité, la première déployée) ; une autre peut être choisie | figée (seul le choix d'une unité est permis) | ordre de fuite donné : fin du tutoriel, la bataille reprend. Annuler Fuir ramène à l'étape 3 |

- **Déclenchement de l'étape 3** : quand l'IA a déployé l'avant-dernière entrée de son script (t = 28 s, `rules.md` 7.1), ou au plus tard 8 s (temps de bataille) après la fin de l'étape 2 ; dans les deux cas, dès que le joueur a une unité sur le terrain, que Fuir est disponible et qu'aucun geste n'est en cours.

**Conseils de l'accueil** (`HomeScreen`) : pas de visite guidée, des conseils un par un, au moment où une fonction devient utile ; rien n'est verrouillé.
- Même bulle et même main que le tutoriel de bataille. Une seule bulle à la fois, au plus une par arrivée sur l'accueil ; rien n'est figé ; la bulle se ferme par [×] ou quand le joueur quitte l'accueil. Un conseil est marqué vu (sauvegardé) dès qu'il s'affiche, et n'apparaît qu'une fois.
- L'ordre du tableau donne la priorité si deux conseils sont prêts en même temps.

| Conseil | Déclencheur | Message | Main |
|---|---|---|---|
| `welcome` | première arrivée sur l'accueil | « Voici ton noble domaine, le territoire de ton peuple. » (retour à la ligne) « L'ennemi continue cependant son invasion, repousse-le ! » | tapote « Partir en guerre » |
| `summon` | arrivée sur l'accueil quand une espèce a moins d'individus que sa dotation de départ **et** que le solde paie un individu de cette espèce ; marqué vu aussi dès que le joueur invoque de lui-même | « En tant que souverain, tu possèdes un pouvoir puissant : fais grandir ton peuple en invoquant de nouvelles créatures. » | tapote « Invocation » |
| `armyRecruit` | arrivée sur l'accueil après au moins une invocation depuis l'arrivée précédente (quel que soit le chemin vers l'écran Invocation ; non sauvegardé), avec au moins un individu hors de l'armée | « Ta recrue n'est pas encore dans ton armée. Ajoute-la avant de repartir. » | tapote « Gestion d'armée » |

Conseils prévus plus tard : la Spirit Fountain quand elle a de quoi être récoltée, les vétérans dans l'écran des unités.

### 5.6 Menu devs
Menu « devs » fixe en haut à gauche, par-dessus tous les écrans (`src/dev/DevMenu.jsx`), **seulement en développement** (`npm run dev`).

- **restart game** : efface le profil et relance depuis l'introduction.
- **skip tutorial** : pendant la bataille tutoriel seulement ; la compte comme gagnée sans combat (`rules.md` 11.1) et ouvre l'accueil.
- **test-wyrm** / **test-undead** : remplace le profil par un joueur de test figé (`src/dev/testProfiles.js`, tous les champs de 5.4) et ouvre l'accueil.

| Profil | test-wyrm | test-undead |
|---|---|---|
| Individus restants | 9 Vers / 7 Amphiptères / 1 Fafnir (3 Vers et 1 Amphiptère perdus) | 14 / 7 / 1 (même progression) |
| Armée | les 17 survivants (375 PP) | tous les survivants (369 PP) |
| Spirit Stones | 10 000 | 10 000 |
| XP du joueur | 1 700 (niveau 3, 200 / 1 500) | idem |
| Spirit Fountain | pleine (dernière récolte il y a 24 h) | idem |
| Conseils de l'accueil | tous vus | tous vus |

XP des individus de test-wyrm (seuils : niveau 2 à 50, 3 à 150, 4 à 300, 5 à 500) : Vers 500 (5), 320 (4), 160 (3), 60 (2), 20, 0, 0, 0, 0 ; Amphiptères 70 (2), 30, 0, 0, 0, 0, 0 ; Fafnir 350 (4).
