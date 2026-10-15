# Sovereign in War

Jeu de stratégie web où l'on déploie des monstres qui combattent seuls, avec un contrôle limité par quelques ordres. Projet de la Gamejam CREA 2026, thème « Clickbait game ».

- Le projet a connu deux versions : la **version clickbait** (rendu 1), une bataille qui imitait une publicité de jeu de stratégie, aujourd'hui conservée dans un autre dépôt ; puis le **MVP**, le jeu complet, seul contenu de ce dépôt.
- Concept : [`SPECS/CONCEPT.md`](SPECS/CONCEPT.md). Toutes les spécifications sont dans [`SPECS/`](SPECS/).

## Stack

| Rôle | Outil |
|---|---|
| Langage | JavaScript |
| Champ de bataille | Phaser 3.90 |
| Interface autour (tour de commandement, écrans) | React 19, Tailwind CSS 4, shadcn/ui avec le thème 8bitcn |
| Profil du joueur sauvegardé | Zustand (`persist`, localStorage) |
| Bundler | Vite |
| Tests | Jest (règles du jeu, profil du joueur, données ; `tests/`) |

Pourquoi ces choix : [`SPECS/TECHNICAL.md`](SPECS/TECHNICAL.md).

## Lancer le projet

Prérequis : **Node.js 20.11 ou plus récent** (la configuration Vite utilise `import.meta.dirname`).

```
npm install
npm run dev        # jeu en local, sur l'URL affichée par Vite
npm test           # tests Jest
npm run build      # build de production dans dist/
npm run preview    # sert le build de production en local
npm run balance    # outil d'équilibrage : batailles simulées sans navigateur
npm run debug      # une bataille affichée en ASCII dans le terminal
```

Dans le jeu : **Commencer**, choisir une faction, puis suivre le tutoriel de la bataille tutoriel. En développement, le menu **devs** (en haut à gauche) permet de passer cette bataille ou de charger un joueur de test.

## Structure du code

```
src/
  data/      données statiques : une faction par fichier, une bataille par fichier (rangées par guerre),
             tutoriels, effets
  logic/     règles du jeu, JavaScript pur, sans Phaser ni React (testées par Jest) ;
             logic/battles/ : le moteur de bataille, découpé par rôle
  state/     profil du joueur sauvegardé (store Zustand)
  scenes/    Phaser : le champ de bataille, une vue par sujet (scenes/battle/)
  screens/   React : un fichier par écran
  ui/        React : composants, textes affichés (strings.js), thème de faction
tests/       tests Jest (logic/, state/, ui/)
assets/      sprites, fonds et interface (rangée par couleur), servis tels quels par Vite
```

Détail de l'architecture : [`SPECS/technical.md`](SPECS/technical.md) section 2.

## Ce que le POC m'a appris

**Ce qui marche**
- La séparation entre la logique (`src/logic/`) et l'affichage (Phaser, React) tient : toutes les règles se testent sans navigateur (261 tests Jest), et une nouvelle zone ou un nouveau tutoriel s'ajoute en modifiant seulement des données.
- Le cœur du jeu est jouable : déployer sous un plafond de présence, laisser combattre, donner de rares ordres. Les données changent visiblement à l'écran (jauge de présence, compteur de copies, barres de vie, bilan des pertes).
- L'enchaînement de trois zones avec des obstacles différents crée de vraies questions tactiques.
- Faire fuir une unité au bon moment, puis la voir revenir avec ses PV réduits, rend lisible la boucle de succès : c'est là que le contrôle limité prend son sens.

**Ce qui ne marchait pas**
- Les règles avaient des trous que l'IA avait comblés seule, sans le dire : distance mesurée depuis quelle case d'une unité 2×2, départage entre deux ennemis à égale distance, dernière attaque d'une fuite comptée pour les aptitudes, diagonales qui coupent le coin d'un obstacle, unité en fuite encerclée, deux comptes à rebours qui expirent en même temps… Une relecture des specs (depuis archivée) en a relevé neuf. Ils sont tranchés dans `RULES.md`, et le code a été réaligné avec un test pour chacun.
- Un bug d'ordre de résolution : une unité en fuite pouvait mourir ou survivre selon l'ordre interne des unités. Corrigé et testé.
- Le tutoriel n'enseignait que le déploiement : un joueur qui découvrait le jeu voyait surtout ses unités mourir, sans découvrir la fuite. Corrigé : une étape « battre en retraite » s'affiche en phase 2.
- La boucle d'échec reste peu visible sur le moment : rien ne distingue une unité tuée d'une unité en fuite, la perte n'apparaît que dans le bilan final.
- Le POC était devenu plus riche que le MVP prévu (trois zones contre une seule phase pour la bataille 01), ce qui brouillait la lecture POC / MVP.
- La version clickbait devenait inaccessible une fois le jeu normal lancé. Corrigé : le jeu démarre toujours sur l'intro, et le MVP est verrouillé.

**Ce que je change pour le MVP**

- Spécifier la bataille 01 avant de la coder : elle reprendra les trois zones du POC en plusieurs phases (nombre de phases, scripts et condition de victoire encore à définir).
- Rouvrir le jeu normal (bouton MVP) avec son parcours complet, les ordres Aller et Attaquer, le bouton Abandonner et la sauvegarde des pertes.
- Rendre la mort d'une unité visible au moment où elle arrive, pas seulement dans le bilan.

**Structure du code : OK**, avec une dette à solder pour le MVP (liste ci-dessous).

## À corriger pour le MVP

Le refactor d'octobre 2026 (`SPECS/refactor-roadmap.md`) a soldé une partie de cette dette : code mort (`findNearestEnemy`, `timeControl`), textes en dur de la Scene Phaser, assemblage de la bataille sorti de la Scene, sauvegarde réécrite (un seul profil, store Zustand). Reste :

- Sauvegarde : vérifier le comportement avec un localStorage corrompu ou bloqué depuis le passage à Zustand (`src/state/profileStore.js`).
- Au premier tick d'une fuite, un ennemi peut frapper deux fois (coup normal et dernière attaque).
- Dépendances inutiles : `cn` à retirer, `shadcn` à passer en devDependencies.
- Quelques textes encore en dur dans les écrans (ex : « Victoire », « Continuer »), hors de `strings.js`.
- La tour React se redessine à chaque frame (voulu, mais à surveiller).
- Pas de linter.
