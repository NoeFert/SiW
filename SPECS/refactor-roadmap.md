# Refactor : suivi des étapes

Refactor de lisibilité lancé le 2026-10-15 suite au feedback du POC (`FEEDBACK-POC.md`). **Aucune nouvelle fonctionnalité** : on nettoie le code pour le rendre lisible, simple et réutilisable par un humain.

Problèmes à résoudre (feedback) :
1. Séparer l'état de jeu du joueur (sauvegardé dans le localStorage) de l'état d'une bataille.
2. La Scene Phaser gère trop de choses différentes (animations, zone de déploiement, PV des unités…) : la découper par sujet.
3. Rendre le code lisible, compréhensible et réutilisable pour un humain, pas seulement pour une IA.

## Consignes de suivi

- **Ce fichier est tenu à jour au fur et à mesure du refactor** : cocher chaque point terminé, noter le commit de chaque étape, et reporter tout ajustement du processus dans le journal en bas de page. Les étapes décrivent toujours la **dernière version** du plan.
- Une branche : `refactor/state-and-scene`. Un commit par étape.
- **Claude ne commite jamais lui-même** : quand une étape est prête, il propose un message de commit ; Noémie le réécrit, le valide et fait le commit.
- Le site ne doit jamais être cassé : chaque étape se termine sur les contrôles automatiques et les parcours manuels ci-dessous.
- Arrêt après chaque étape pour que Noémie relise le diff avant la suivante.
- Code 100 % en anglais ; commentaires en français, comme les specs ; textes affichés au joueur en français dans `src/ui/strings.js`.

## Étapes

### Étape 0 — Filet de sécurité ✅ (`96eb901`)
- [x] Créer la branche `refactor/state-and-scene`
- [x] Vérifier que tous les tests passent (418 au départ) et que le build passe
- [x] Écrire la checklist de tests manuels (voir « Contrôles de fin d'étape »)
- [x] Ajouter une simulation headless déterministe (aléa fixé) : `tests/logic/battleReplay.test.js` rejoue chaque bataille et compare à un instantané (32 victoires, 8 défaites)

### Étape 1 — Retirer le clickbait et l'entraînement ✅ (`08fadea`)
- [x] Supprimer le mode clickbait : bataille, scripts, tutoriel, bilan de victoire, textes, entrée du menu devs, tests
- [x] Supprimer le mode entraînement : `training.js`, `setupTraining`, entrée du menu devs, tests
- [x] Supprimer les champs de bataille qui ne servaient qu'à eux (`orders`, `surrenderAllowed`, `playerRoster`), après vérification
- [x] `App.jsx` n'a plus de notion de mode
- [x] Supprimer le code devenu mort : condition de tutoriel `phaseElapsed`, cible de main `playerUnit`, `getCasualtyReport` et `countOwnedCopies`, palette CSS « Dungeon Torch »
- [x] Zones « Le mur », « Les trois couloirs », « Le fort » conservées (utilisées par « Partir en guerre ») ; leur test devient `battleZones.test.js`

### Étape 2 — État du joueur ✅ (`0a83528`)
- [x] Installer Zustand
- [x] Un seul objet profil (faction, première victoire, individus, armée, Spirit Stones, XP, niveau du Légendaire mort, batailles gagnées, fontaine, conseils vus) dans un store Zustand : `src/state/profileStore.js`
- [x] Sauvegardé à un seul endroit : middleware `persist`, une seule clé localStorage versionnée (`siw.save`). Pas de migration des anciennes clés (aucun joueur réel)
- [x] Le profil n'est modifié que par les actions du store, qui appellent les fonctions pures de `logic/` (`resolveVictory`, `resolveWarDefeat`, invocation, fontaine…)
- [x] Plus aucun écran n'importe `persistence.js`, qui est supprimé
- [x] Mettre à jour les profils de test du menu devs (`src/dev/testProfiles.js`) et supprimer `test-wyrm-fallen` ; chaque profil de test liste tous les champs du profil, comme un profil sauvegardé (vérifié par un test)
- [x] Tests des actions du store : `tests/state/profileStore.test.js`

### Étape 3 — Données des batailles, préparation de la bataille et flux de jeu ✅ (`e523215`)
- [x] Toutes les données d'une bataille dans un seul fichier, dans `src/data/battles/` (`battleTuto.js`, puis un sous-dossier par guerre : `war01/` avec sa map `warMap01.js` et ses batailles `battleStartW01.js`, `battleLow1W01.js`, `battleLow2W01.js`) : récompense, tutoriel, et pour chaque phase son fond, son plan d'obstacles (ASCII) et les scripts de l'IA. `src/data/battles/index.js` liste les batailles et décrit le format. Remplace `battles.js`, `battleScript.js` et `battlefield.js`
- [x] Sortir la préparation de la bataille de la Scene vers une fonction testée de `logic/` : `createBattleFromDefinition(definition, faction, playerUnits)` (`src/logic/battleSetup.js`), utilisée aussi par l'outil d'équilibrage. `createBattle` reçoit directement les individus du joueur (plus de réserve créée puis remplacée)
- [x] Sortir de `App.jsx` la logique « fin de bataille → profil » vers les actions du store du profil (fait à l'étape 2)
- [x] `App.jsx` ne garde que la navigation entre écrans et les appels aux actions du store
- [x] Vocabulaire : une **guerre** (war) est un ensemble de batailles sur une map ; une **bataille** (battle) n'est plus jamais appelée « war ». Identifiants : `firstBattle` → `battleTuto` (et `tutoBattleWon`, `TUTO_BATTLE_ID`… partout), `war1/2/3` → `battle` + id de l'emplacement + `W01`
- [x] `tests/logic/battleData.test.js` vérifie automatiquement chaque bataille et chaque phase (fond présent, plan 24 x 14, entrée de l'IA libre, aucune zone isolée, scripts triés, nom et emplacement sur la map)

### Étape 4 — Découper la logique de bataille par rôle ✅ (`b1927eb`, `8247a6a`, `8dea6c9`)
- [x] Fichiers du moteur de bataille rangés dans `src/logic/battles/` (tests en miroir dans `tests/logic/battles/`) ; `src/logic/` ne garde que la couche méta (armée, fontaine, conseils, niveaux, individus, invocation, victoire, guerre)
- [x] Quatre rôles, décrits par une carte du moteur en tête de `battle.js` :
  1. Déroulé de la bataille : `battleSetup.js`, `battle.js` (l'objet bataille et la boucle `tickBattle`, lisible de haut en bas), `phases.js`, `pause.js`, `tutorial.js`
  2. Unités sur le terrain, identiques pour les deux camps : `battleUnit.js`, `unitBehavior.js`, `pathfinding.js`, `deployment.js`
  3. Les deux commandants : `playerActions.js` (nouveau : déployer, ordres, pause, abandon, sortis de `battle.js` ; les ordres de l'ancien `commands.js` y sont fusionnés), `orderSelection.js` (ex-`commandSelection.js` : déroulé d'un ordre en plusieurs clics) et `fleeCooldown.js` (cooldown de la fuite, rules.md 5.1) ; `aiScript.js` (l'arrivée des ennemis, `deployDueEnemies`, y est déplacée)
  4. Fin de bataille : `battleEnd.js` contient toutes les règles de fin (délai de victoire, abandon, IA vaincue à la fin du script, verdict), sorties de `battle.js`
- [x] L'objet `battle` garde sa forme (champs à plat) : la Scene, la tour et les tests lisent les mêmes champs ; l'instantané de `battleReplay` ne change pas
- [x] Données des factions réunies : un fichier par faction dans `src/data/factions/` (`wyrms.js`, `undead.js`, `index.js` qui exporte `FACTIONS`) avec son id, le sprite du souverain, son roster et son armée de départ (`startingArmy`). Remplace `rosters.js`, `wyrmsRoster.js`, `undeadRoster.js` et `SOVEREIGN_SPRITES`
- [x] Le champ `copies` sort des espèces : l'armée de départ (`startingArmy`) sert à la dotation du joueur, à la réserve de l'IA et au conseil d'invocation. `createBattle` reçoit les factions des deux camps
- [x] Couleurs des factions dans leurs données : `color` (couleur principale) et `uiColor` (palette, dossier `assets/ui/<uiColor>/`). `src/ui/factionTheme.js` en tire les variables CSS posées sur <html> (couleur, curseurs, accents) ; Phaser lit `factionColor()` (`renderConstants.js`). Changer ces deux champs change toutes les couleurs de la faction
- [x] `assets/ui/` rangé par couleur : neutres à la racine, `gold/`, `purple/` (palettes des factions, mêmes noms de fichiers), `white/`, `red/`, `green/`, `grey/`, `black/` ; `tests/ui/factionTheme.test.js` vérifie les palettes et tous les chemins `/ui/…` du code
- [ ] Option, si Noémie la veut : ordonner la déclaration de `createBattle` en sections commentées, une par rôle, sans renommer de champ

### Étape 5 — Partage de la bataille entre la Scene et React ✅ (`fb5507b`)
- [x] `BattleScreen` crée la bataille (`createBattleFromDefinition`) et en est propriétaire : il la transmet à la Scene au démarrage et à la tour de commandement par les props
- [x] Après chaque `tickBattle`, la Scene émet un événement Phaser (`battleFrame`) ; `BattleScreen` s'y abonne pour se redessiner (tour, tutoriel) et détecter la fin de bataille
- [x] Supprimer l'objet global `interactionState` et les deux boucles `requestAnimationFrame` (`useBattle.js`, `BattleScreen.jsx`) ; la position affichée des sprites (main du tutoriel) se demande directement à la Scene
- [x] `battle` reste un objet modifié en place par le moteur ; aucune nouvelle dépendance

### Étape 6 — Découpage de BattleScene ✅ (`3823f7d`)
- [x] Une vue par sujet dans `src/scenes/battle/`, chacune recevant la Scene : `BattlefieldView` (fond, rochers, phases), `DeploymentZoneView`, `UnitViews` (sprites, barre de vie, compteur d'aptitude, déplacements, transition de phase), `CombatEffects` (missiles, entailles, aptitudes, textes flottants), `FieldInput` (clics sur le terrain, cadre de sélection), `PauseTint` (désaturation pendant les pauses : une simple fonction, `applyPauseTint`)
- [x] La configuration des effets part dans `src/data/effects.js`
- [x] La Scene ne garde que l'orchestration : 90 lignes (649 avant)
- [x] Les textes flottants affichés au joueur (« COUP CRITIQUE ! », « Raté ! ») passent dans `src/ui/strings.js` (`fieldTexts`)

### Étape 7 — Passe de lisibilité
- [ ] Commentaires : expliquer ce que fait le code, pas son historique ; renvois aux specs courts, seulement là où une règle est implémentée (7b)
- [x] Code mort (7a) : `showLevel` / `withLevels` supprimés (la tour affiche toujours le niveau), `findNearestEnemy` (plus utilisé par le jeu) déplacé dans son test, import `lossReport` inutilisé retiré. La clé de sauvegarde legacy a disparu avec `persistence.js` (étape 2)
- [x] Gros écrans découpés (7a) : `CivilizationScreen.jsx` (372 lignes) devient `UnitsScreen.jsx` (grille des unités) et `ArmyScreen.jsx` (armée), plus `ui/IndividualDetail.jsx` (page d'un individu) ; `WarScreen.jsx` garde l'écran et le panneau, la map part dans `ui/WarMap.jsx` ; `App.jsx` : actions du menu devs dans `DevMenu.jsx`, ouverture de l'invocation factorisée
- [x] Fichiers périmés supprimés (7a) : `SPECS-REVIEW.md`, `PRE-RENDU-CHECK.md` (`gamejam-skills-claude/` n'existait déjà plus)

### Étape 8 — Specs à jour
- [ ] `technical.md` décrit l'architecture réelle (états, stores, dossiers, découpage de la Scene)
- [ ] Retirer le clickbait des specs (`CONCEPT.md`, `roadmap.md`, `roadmap-mvp.md`, `rules.md`, `technical.md`…) et le remplacer par : le MVP est la seconde version du projet, après une version clickbait ; le clickbait vit désormais dans un autre dépôt, c'est un projet passé, et on se concentre uniquement sur le MVP
- [ ] Aligner le vocabulaire des specs sur le code : « bataille 01 » → bataille tutoriel (`battleTuto`), guerre (war) = ensemble de batailles sur une map, identifiants des batailles (`battleStartW01`…)
- [ ] Mettre à jour `CLAUDE.md` et le `README.md` (qui parlent encore du clickbait)
- [ ] Clore ce suivi (toutes les cases cochées) et fusionner la branche

## Contrôles de fin d'étape

**Automatiques**
- [ ] `npm test` : tous les tests passent, dont `battleReplay.test.js`
- [ ] `npm run build` : le build passe sans erreur

**Parcours manuels** (`npm run dev`, en partant d'une sauvegarde vide : menu devs → `restart game`)

Premier lancement
- [ ] Écran d'intro, puis choix de faction
- [ ] Bataille 01 avec son tutoriel : chaque étape s'affiche et avance
- [ ] Glisser-déposer une unité : zone de déploiement visible pendant le glisser, unité posée
- [ ] Unités ennemies qui entrent par la droite, déplacements fluides, barres de vie, compteurs d'aptitude
- [ ] Missiles, entailles, coup critique, « Raté ! », soin
- [ ] Ordres Aller / Attaquer / Fuir : sélection de l'unité puis de la cible, clic droit pour annuler
- [ ] Pause (bouton et Espace) : terrain désaturé, animations figées ; ce qui est cliquable reste en couleur
- [ ] Victoire : le terrain reste affiché quelques secondes, puis l'écran de victoire (XP, niveaux, Spirit Stones)

Accueil et méta
- [ ] Accueil : conseils du tutoriel, Spirit Fountain, solde de Spirit Stones
- [ ] Unités / armée : ajouter et retirer des individus, renommer l'armée
- [ ] Invocation depuis l'accueil et depuis l'écran des unités ; « Retour » ramène au bon écran
- [ ] Codex

Partir en guerre
- [ ] Lancer une bataille ; changement de phase (l'armée sort à droite, entre à gauche, nouveau terrain)
- [ ] Abandonner : boîte de confirmation (pause), puis défaite avec la liste des pertes
- [ ] Défaite : « Réessayer » et « Accueil » ; les morts ont disparu de l'armée

Sauvegarde
- [ ] Recharger la page sur l'accueil : faction, unités, armée, Spirit Stones, XP, batailles gagnées et conseils vus sont conservés
- [ ] Recharger la page pendant la bataille 01 : on revient à la bataille 01
- [ ] Menu des paramètres de l'accueil → recommencer : retour à l'intro, sauvegarde vide
- [ ] Menu devs : chaque profil de test se charge et ouvre l'accueil

## Journal des ajustements

Changements apportés au plan initial, du plus ancien au plus récent.

- **2026-10-15 — Décisions avant le démarrage**
  - État du joueur : store **Zustand** au lieu d'un contexte React ; **une seule clé** localStorage ; pas de migration (aucun joueur réel).
  - État de la bataille : découpé en **sous-objets** (`sim` / `interaction` / `events`, étape 4) ; un **store Zustand** remplace `interactionState` (étape 5), au lieu de passer `battle` en props.
  - **Clickbait et entraînement retirés** (nouvelle étape 1), y compris des specs (étape 8). La checklist manuelle ne parle donc plus du clickbait.
  - Commentaires en français, code en anglais.
  - Phaser conservé pour l'instant.
  - Périmètre de l'étape 7 élargi : gros écrans React découpés, fichiers périmés hors `src/` supprimés.
  - Profils de test du menu devs à mettre à jour, `test-wyrm-fallen` supprimé (étape 2).
- **2026-10-15 — Étape 0**
  - 418 tests au départ (et non 261, chiffre du feedback, antérieur).
  - Le test de référence rejoue les batailles avec le bot de `src/debug/balance/` : il ne donne pas d'ordres et n'utilise ni la pause ni le tutoriel, ces parties restent couvertes par les tests unitaires et les parcours manuels.
  - La checklist est intégrée à ce fichier (`REFACTOR-CHECKLIST.md` supprimé).
- **2026-10-15 — Commits**
  - Les commits sont faits par Noémie : Claude propose le message, Noémie le réécrit et commite. (Les deux premiers commits de la branche, `96eb901` et `631cad6`, ont été faits par Claude avant cette consigne.)
- **2026-10-15 — Étape 1**
  - Plus de tests après l'étape (438 : +40 du test de référence, −20 tests clickbait/entraînement) ; instantané de référence inchangé.
  - Code mort découvert en route : supprimé s'il venait du clickbait, sinon noté pour l'étape 7.
- **2026-10-15 — Étape 2**
  - La logique « fin de bataille → profil » d'`App.jsx` est passée dans les actions du store dès cette étape (prévue à l'étape 3) : il fallait de toute façon la réécrire pour quitter `persistence.js`.
  - Les champs du profil gardent les noms qu'attendent déjà `resolveVictory` et `resolveWarDefeat` (`units`, `army`, `playerXp`…) : le profil leur est passé tel quel.
  - Les actions sont des fonctions exportées à côté du store (pas dans l'état) : seules les données sont sauvegardées, et les actions s'appellent aussi bien depuis React que depuis les tests.
  - Les anciennes clés `siw.*` restent dans le localStorage des navigateurs de dev, sans effet : le jeu repart de l'intro une fois.
- **2026-10-15 — Étape 3**
  - Ajout demandé par Noémie : réunir toutes les données d'une bataille dans un seul fichier, pour avoir un aperçu immédiat et créer une bataille sans toucher à plusieurs fichiers.
  - Obstacles écrits en plan ASCII dans chaque phase (choix de Noémie) : une zone utilisée par deux batailles est recopiée dans les deux fichiers, chaque bataille se modifie sans toucher aux autres.
  - Le nom affiché d'une bataille reste dans `src/ui/strings.js` (choix de Noémie), pour garder tous les textes du joueur au même endroit ; son emplacement sur la map reste dans `warMaps.js`.
  - Le fond de chaque phase devient une image au choix (`background.image`) plus un sens (`flipped`) : une nouvelle zone pourra avoir son propre fond.
  - Contrôle : les nouvelles définitions ont été comparées aux anciennes (obstacles, scripts, récompenses, sens du fond) avant suppression ; instantané de référence inchangé.
  - Ajustement de Noémie en cours d'étape : un sous-dossier par guerre (`war01/`, avec sa map), batailles nommées battle + emplacement + W + numéro de guerre, `firstBattle` → `battleTuto` partout dans le code (y compris le champ du profil `tutoBattleWon` et les commentaires « bataille 01 » → « bataille tutoriel »). La « bataille 01 » des specs sera alignée à l'étape 8.
  - Les instantanés de référence ont été renommés (clés seulement) et passent tels quels : les batailles renommées se jouent à l'identique.
- **2026-10-15 — Étape 4**
  - Première version (sous-objets `sim` / `interaction` / `events`) annulée par Noémie : elle renommait les accès dans 25 fichiers sans rendre la logique plus facile à suivre.
  - Nouvelle version, sur proposition de Noémie (fichier central, unités, interactions du joueur, fin de bataille), ajustée : on répartit les fonctions par rôle au lieu de changer la forme de l'objet ; l'arrivée des ennemis est rangée avec le joueur dans « les deux commandants » (une décision, pas de la simulation) ; la fin de bataille détecte elle-même ses conditions ; l'armée du joueur est donnée au moteur, qui ne lit jamais le profil.
  - Ajout de Noémie en cours d'étape : les fichiers du moteur de bataille dans `src/logic/battles/`.
  - Ajustement demandé par Noémie : `commands.js` fusionné dans `playerActions.js` (un ordre traversait trois fichiers, `orderSelection` → `playerActions` → `commands`). Le cooldown de la fuite reste à part dans `fleeCooldown.js` : le mettre dans `playerActions.js` aurait créé un import circulaire avec `tutorial.js`.
  - Vocabulaire « ordre » partout pour ce que donne le joueur : `commandSelection` → `orderSelection` (fichier et champ de la bataille), `cancelCommand` → `cancelOrder`, pause d'interaction `'command'` → `'order'`, commentaires « commande » → « ordre ». Seul `unit.command` (l'ordre que l'unité exécute) garde son nom.
  - `combat.js` renommé `unitBehavior.js` (choix de Noémie) : il fait agir toutes les unités à chaque tick (cible, déplacement, attaques, aptitudes, ordres, fuite), pas seulement le combat. Sa fonction principale `resolveCombatTick` devient `updateUnitBehaviors`, et son test `unitBehavior.test.js`.
  - Classe `Unit` renommée `BattleUnit` (`battleUnit.js`, choix de Noémie) : c'est une unité sur le terrain le temps d'une bataille, à distinguer des individus possédés du profil. Elle reste dans `battles/`, seul endroit qui l'utilise. Le renommage des individus (`profile.units` → `profile.individuals`, `ownedUnits.js` → `individuals.js`) est écarté pour l'instant.
  - Ajout de Noémie : les données de chaque faction dans un seul fichier (un fichier par faction, choix de Noémie). Le nom de la faction et le titre du souverain restent dans `src/ui/strings.js` (choix de Noémie, comme pour les noms de batailles).
  - Armée de départ séparée des stats (`startingArmy`, choix de Noémie) : `createDeploymentState(roster, startingArmy, individuals)`, `createStartingUnits(startingArmy)`, `createBattle(grid, player, enemy, …)` avec des factions. Dans les tests, les espèces fictives gardent `copies` pour rester courtes ; `tests/logic/battles/testFaction.js` en tire la faction de test.
  - Ajout de Noémie : couleur principale et palette d'interface dans les données de faction, et `assets/ui/` rangé par couleur. Les assets propres à une faction (badge et barre d'XP, dans sa couleur principale) vont dans le dossier de sa palette, nommés `*-faction.png` ; les assets jaunes de la map de guerre rejoignent `gold/` (choix de Noémie). Les classes `text-faction-wyrms`… deviennent `text-faction` / `bg-faction`, et les props `faction` devenues inutiles sont retirées. La couleur principale est maintenant donnée en hexadécimal (avant : oklch dans index.css et hexadécimal dans renderConstants.js, deux définitions).
- **2026-10-15 — Étape 5 replanifiée (avant de la commencer)**
  - Le store Zustand de la bataille est abandonné : la bataille est un objet modifié en place 60 fois par seconde, le store n'aurait servi qu'à porter sa référence et un compteur de frames ; le plan supposait aussi les sous-objets de l'étape 4, abandonnés. Même objectif (plus d'objet global ni de boucles qui relisent en permanence), moyen plus simple permis par l'étape 3 : `BattleScreen` crée la bataille et la transmet, la Scene signale chaque frame par un événement Phaser.
- **2026-10-15 — Étape 5**
  - `BattleScreen` redessine tout l'écran à chaque frame (tour et tutoriel reçoivent la bataille par leurs props) : un seul abonnement à `BATTLE_FRAME_EVENT` au lieu d'un hook par composant ; `useBattle.js` et `interactionState.js` sont supprimés.
  - La position affichée des sprites pour la main du tutoriel est une méthode de la Scene (`unitDisplayCenter`), que `BattleScreen` transmet à l'overlay.
- **2026-10-15 — Étape 6**
  - `PauseTint` est une fonction plutôt qu'une classe : elle ne garde aucun état, elle calcule le niveau de désaturation et le transmet au terrain et aux unités (`tint`).
  - Ajustement de Noémie : le missile de chaque faction (et sa couleur d'impact) rejoint ses données (`projectile`, src/data/factions/) ; `src/data/effects.js` ne garde que les effets communs (entaille, aptitudes, compteurs, durée de vol).
