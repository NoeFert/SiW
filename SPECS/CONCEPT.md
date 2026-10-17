# CONCEPT.md — Sovereign in War

## Le jeu en une phrase

Un jeu de stratégie en temps réel où le joueur, souverain d'une espèce de monstres, déploie ses troupes sur un champ de bataille puis les regarde combattre seules, en n'intervenant que par quelques ordres rares et bien choisis.

## De quoi parle le jeu

Le joueur incarne un souverain : la **Souveraine des Wyrms** (dragons et vers géants) ou le **Souverain des Morts-Vivants** (squelettes et nécromants). L'intelligence artificielle joue l'autre faction.

Une bataille se joue sur une grille de 24 × 14 cases (`RULES.md` section 1) :
- le joueur **déploie** ses monstres dans le premier quart du terrain, côté gauche, par glisser-déposer ;
- les monstres **se battent seuls** : ils avancent vers l'ennemi le plus proche, contournent les obstacles, frappent au corps-à-corps ou tirent à distance ;
- le joueur garde un **contrôle limité** : il peut ordonner à une unité d'attaquer une cible, d'aller sur une case ou de fuir, mais une seule fuite toutes les 5 secondes (`RULES.md` section 5).

Le vrai choix stratégique se fait **avant et pendant le déploiement** : chaque monstre coûte des points de présence, et le terrain n'en accepte jamais plus de 150 à la fois (`RULES.md` section 2). Déployer un dragon légendaire, c'est renoncer à une dizaine de petites unités.

Inonder le terrain n'est pas une bonne réponse par défaut (`SPECS/strategic-depth.md`) :
- les **Légendaires frappent en zone** : chaque coup blesse aussi les ennemis collés à la cible, et une masse serrée devient une proie (`RULES.md` 4.6) ;
- la **zone de déploiement est étroite** (colonnes 0 à 5) : on ne pose plus ses unités au contact de l'ennemi, on choisit à l'avance d'où elles partent (`RULES.md` 2) ;
- l'**XP de survie est partagée** entre tous les monstres déployés : plus on en engage, moins chacun progresse, et un monstre tombé emporte sa part (`RULES.md` 11.6).

## L'objectif du joueur

Gagner la bataille **en perdant le moins d'unités possible**. Une unité tuée est perdue pour de bon ; une unité blessée peut battre en retraite et revenir plus tard dans la bataille, avec ses PV réduits.

## Le peuple du souverain

Les monstres du joueur sont **son peuple vivant**, jamais des pions jetables. Chaque créature est un individu, avec son expérience et son histoire (son niveau). Une créature tombée ne revient pas, et aucune autre ne « la remplace » : une nouvelle invocation **fait grandir le peuple** d'une nouvelle vie, elle ne ramène pas la disparue.

C'est une règle de ton pour tous les textes montrés au joueur (`src/ui/strings.js`) :
- **à éviter** : remplacer, racheter, rachat, stock, pion, copie, unité « consommée » ;
- **à préférer** : peuple, créatures, individus, tombés, disparus, invoquer, donner vie, faire grandir son peuple.

Dans les specs, « copie » reste un terme technique de règle (réserves en bataille, `RULES.md` section 2).

## Deux versions du projet

Le projet est né d'une gamejam sur le thème du *clickbait game* (un jeu web inspiré des publicités de jeux mobiles). Sa première version, la **version clickbait** (le POC du rendu 1), imitait une publicité de jeu de stratégie : une bataille courte et spectaculaire, qui montrait le cœur du jeu en quelques minutes. C'est un projet passé, conservé dans un autre dépôt.

Ce dépôt contient la seconde version, le **MVP** : le jeu complet, construit comme un jeu, sur lequel porte désormais tout le travail.

## Ce que contient le MVP

Autour du moteur de bataille, le MVP apporte (détail dans `ROADMAP.md`) :
- le **parcours complet** : introduction, choix de faction, bataille, écran de victoire ou de défaite avec « Réessayer », écran d'accueil ;
- les **pertes définitives** : les monstres tués pendant la bataille sont sauvegardés et restent perdus, visibles sur l'écran de gestion de civilisation ;
- le **tutoriel de départ** (déployer, points de présence, battre en retraite : `TECHNICAL.md` 5.5), qui sera complété et affiné plus tard, une fois cette version du jeu terminée ;
- toutes les fonctionnalités de bataille accessibles au joueur (ordres, pause, abandon) ;
- une **première boucle méta**, organisée autour de l'écran d'accueil (détail dans `roadmap-mvp.md` et `RULES.md` section 11) :
  - la **gestion de civilisation** : consulter ses monstres espèce par espèce, et composer l'**armée** qui partira en guerre (500 points de présence au plus, au-dessus des 150 du terrain : l'armée contient des réserves) ;
  - une monnaie, les **Spirit Stones**, reçue au départ puis en récompense des victoires, et produite en continu par la **Spirit Fountain** de l'accueil, dont la capacité grandit avec le niveau du souverain ;
  - l'**invocation** : dépenser ses Spirit Stones pour donner vie à de nouvelles créatures d'espèces connues, ou réinvoquer son Légendaire tombé au combat ;
  - « **Partir en guerre** » : quatre batailles qui suivent la bataille tutoriel, à conquérir avec son armée : gagner une bataille ouvre celles qui lui sont reliées sur la map. Chacune traverse deux zones ; une bataille gagnée peut être rejouée pour progresser, mais une défaite coûte cher : les monstres tombés sont perdus quand même (`RULES.md` section 11.7). Sur la map, plusieurs chemins mènent au boss, et **plus une bataille est proche du boss, plus elle est dure**, quel que soit le chemin pris ;
  - les **niveaux** (`RULES.md` sections 11.5 et 11.6) :
    - chaque **monstre** gagne de l'expérience quand il survit à une victoire et quand il achève des ennemis. En montant de niveau (jusqu'au niveau 5), il devient plus robuste et plus fort, sans coûter plus de points de présence : un vétéran vaut plus qu'une recrue sur le terrain. Chaque monstre devient ainsi un individu reconnaissable dans la gestion de civilisation ;
    - le **souverain** progresse lui aussi à chaque victoire, d'autant plus que son armée en sort intacte, et chaque niveau lui rapporte des Spirit Stones ;
    - un **Légendaire** tombé peut être réinvoqué au niveau qu'il avait atteint, contre un prix plus élevé.

La boucle méta donne son poids à l'objectif du joueur : chaque créature tombée est une perte pour le peuple, et chaque Spirit Stone dépensée pour le faire grandir à nouveau ne sert pas à le rendre plus fort. Les niveaux renforcent encore cet enjeu : une créature tombée emporte son expérience avec elle, et la nouvelle venue part de zéro.
