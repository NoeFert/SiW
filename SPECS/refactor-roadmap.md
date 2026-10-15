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

### Étape 2 — État du joueur ✅
- [x] Installer Zustand
- [x] Un seul objet profil (faction, première victoire, individus, armée, Spirit Stones, XP, niveau du Légendaire mort, batailles gagnées, fontaine, conseils vus) dans un store Zustand : `src/state/profileStore.js`
- [x] Sauvegardé à un seul endroit : middleware `persist`, une seule clé localStorage versionnée (`siw.save`). Pas de migration des anciennes clés (aucun joueur réel)
- [x] Le profil n'est modifié que par les actions du store, qui appellent les fonctions pures de `logic/` (`resolveVictory`, `resolveWarDefeat`, invocation, fontaine…)
- [x] Plus aucun écran n'importe `persistence.js`, qui est supprimé
- [x] Mettre à jour les profils de test du menu devs (`src/dev/testProfiles.js`) et supprimer `test-wyrm-fallen` ; chaque profil de test liste tous les champs du profil, comme un profil sauvegardé (vérifié par un test)
- [x] Tests des actions du store : `tests/state/profileStore.test.js`

### Étape 3 — Préparation de la bataille et flux de jeu
- [ ] Sortir la préparation de la bataille de la Scene vers une fonction testée de `logic/`, par exemple `createBattleFromDefinition(definition, faction, playerUnits)`. Au passage : `createBattle` crée une réserve du joueur que la Scene remplace aussitôt par celle de ses individus
- [x] Sortir de `App.jsx` la logique « fin de bataille → profil » vers les actions du store du profil (fait à l'étape 2)
- [ ] `App.jsx` ne garde que la navigation entre écrans

### Étape 4 — Sous-objets de la bataille
- [ ] Découper l'objet `battle` en sous-objets : `sim` (grille, unités, temps, phases, IA, réserves, fin de bataille), `interaction` (pause, commande en cours de sélection, tutoriel), `events` (événements visuels du dernier tick)
- [ ] Adapter `logic/`, les tests et l'outil d'équilibrage ; l'instantané de `battleReplay` ne change pas

### Étape 5 — Store de la bataille
- [ ] Un store Zustand de la bataille en cours remplace l'objet global `interactionState`
- [ ] Il remplace aussi les deux boucles `requestAnimationFrame` (`useBattle.js`, `BattleScreen.jsx`)
- [ ] `battle` reste un objet modifié en place par le moteur (60 fois par seconde) : le store en porte la référence et un compteur de frame incrémenté par la Scene

### Étape 6 — Découpage de BattleScene
- [ ] Classes de vue simples qui reçoivent la Scene : `BattlefieldView` (fond, rochers, phases), `DeploymentZoneView`, `UnitViews` (sprites, barre de vie, compteur d'aptitude, déplacements), `CombatEffects` (missiles, entailles, aptitudes, textes flottants), `PauseTint` (désaturation), `FieldInput` (clics sur le terrain, indicateur de sélection)
- [ ] La configuration des effets part dans `src/data/effects.js`
- [ ] La Scene ne garde que l'orchestration, environ 100 lignes

### Étape 7 — Passe de lisibilité
- [ ] Commentaires : expliquer ce que fait le code, pas son historique ; renvois aux specs courts, seulement là où une règle est implémentée
- [ ] Nommage, duplications, code mort (clé de sauvegarde legacy, etc.). Repéré en route :
  - `showLevel` / `withLevels` (`deployment.js`) : toujours vrais côté joueur depuis le retrait du clickbait
  - import `lossReport` inutilisé dans `tests/logic/war.test.js` (antérieur au refactor)
- [ ] `App.jsx`, `CivilizationScreen.jsx` (386 lignes) et `WarScreen.jsx` (241 lignes) découpés en sous-composants
- [ ] Supprimer les fichiers périmés ou en double hors `src/` : `gamejam-skills-claude/`, `SPECS-REVIEW.md`, `PRE-RENDU-CHECK.md`

### Étape 8 — Specs à jour
- [ ] `technical.md` décrit l'architecture réelle (états, stores, dossiers, découpage de la Scene)
- [ ] Retirer le clickbait des specs (`CONCEPT.md`, `roadmap.md`, `roadmap-mvp.md`, `rules.md`, `technical.md`…) et le remplacer par : le MVP est la seconde version du projet, après une version clickbait ; le clickbait vit désormais dans un autre dépôt, c'est un projet passé, et on se concentre uniquement sur le MVP
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
