# ROADMAP-MVP.md — Couche méta du MVP

Roadmap des fonctionnalités méta du MVP : accueil, gestion de civilisation, invocation, monnaie, niveaux, « Partir en guerre ». Le moteur de bataille et la bataille tutoriel sont décrits dans `roadmap.md`.

**Ce fichier fait priorité sur `roadmap.md` en cas de contradiction.**

---

## Objectif

Brancher sur le moteur de bataille une première boucle méta : perdre des créatures en bataille, gagner des Spirit Stones, faire grandir à nouveau son peuple — et faire progresser le joueur et ses unités survivantes en niveau, pour que perdre peu d'unités soit récompensé.

---

## Inclus dans le MVP

### Écran d'accueil (point central du jeu après la bataille tutoriel)
- Solde de **Spirit Stones** affiché en haut à droite (nom provisoire, libellé dans `strings.js`), suivi d'une icône d'engrenage : menu des paramètres avec **« Codex des mots-clés »** (page listant chaque mot-clé des unités et son effet en quelques mots, `technical.md` 5.1) et **« Réinitialiser le jeu »** (efface la sauvegarde après confirmation, `technical.md` 5.4)
- **Niveau du joueur** et barre d'XP, en haut à gauche à côté du portrait du souverain (`rules.md` 11.5)
- **Spirit Fountain** (`rules.md` 11.8) : produit 3 Spirit Stones par minute en temps réel, jusqu'à une capacité de 80 + 10 × niveau du joueur ; un clic récolte. Garantit qu'on peut toujours réinvoquer après avoir tout perdu
- Quatre entrées de menu, sur le bord gauche de l'écran : **Partir en guerre**, un bouton au **nom de la faction** suivi du nombre d'individus possédés (« Wyrms (21) », section Unités), **Armées** (section Armée), **Invocation**. Les deux sections de la gestion de civilisation sont des écrans séparés
- **Partir en guerre** : ouvre l'écran « Partir en guerre » (voir ci-dessous)
- **Tutoriel de l'accueil** : des conseils non bloquants, un par un, au moment où la fonction devient utile — pour l'instant l'arrivée (vers « Partir en guerre »), les premières pertes, quand le joueur peut faire grandir à nouveau son peuple (vers « Invocation ») et la première recrue invoquée (vers « Gestion d'armée ») ; chaque conseil n'apparaît qu'une fois (`technical.md` 5.5)

### Partir en guerre (`rules.md` 11.7)
- **Quatre batailles** (« La passe », « Les crevasses », « La citadelle », « L'essaim », noms provisoires) : chacune se débloque en gagnant une bataille reliée sur la map (`rules.md` 11.7) ; une bataille gagnée reste **rejouable**, sans Spirit Stones et avec l'XP du joueur et des individus réduite à 25 %
- **Écran « Partir en guerre »** : la map 1 en arbre de compétences : un réseau de trois chemins du départ au boss, avec passerelles et impasses ; 4 batailles jouables, les autres emplacements verrouillés « À venir » ; trois emplacements surmontés d'un envahisseur ennemi ([Vol], basique, [Légendaire] au boss) marquent les batailles de boss, objectif de la map affiché « Repousse l'envahisseur 0/3 » (batailles de boss pas encore écrites) ; un clic sur un losange affiche dans un panneau son nom, son état (verrouillée / disponible / gagnée) et sa récompense, bouton « Combattre » (désactivé si l'armée est vide)
- **Deux zones par bataille** (provisoire) : champ → « Le mur » ; « Le mur » → « Les trois couloirs » ; « Les trois couloirs » → « Le fort ». Scripts de l'IA provisoires, propres à « Partir en guerre » (`rules.md` 11.7), plus durs à mesure qu'on approche du boss. Zones et scripts définitifs : plus tard
- **Difficulté selon la distance au boss** (`rules.md` 11.7) : règle de conception des scripts, pas une mécanique du jeu. Chaque emplacement vise des pertes fixées par sa distance au boss (5 % au départ → 30 % au boss), vérifiées avec `npm run balance` avant d'ajouter sa bataille à la map
- **Victoire** dès la fin du script de la dernière zone ; ordres complets et abandon possibles, pas de tutoriel
- **Défaite, abandon ou match nul** : les individus tués sont **perdus quand même** ; aucune XP ni récompense ; écran de défaite avec les pertes, « Réessayer » et « Retour à l'accueil »
- **Fin du contenu** : les quatre batailles gagnées, un message annonce la suite ; tout reste rejouable

### Unités possédées : individus avec niveau, regroupés par espèce
- Le joueur possède une **liste d'individus** `{ id, species, xp }` (pas de nom, pas de PV propres, pas de trait) ; le niveau se déduit de l'XP ; les stats sont celles de l'espèce (`units.md`), augmentées selon le niveau (`rules.md` 11.6)
- L'interface regroupe les individus **par espèce** (accordéons), puis les montre un par un : ils sont discernables par leur niveau
- Un individu tué en bataille est retiré de la liste (mort définitive) et de toutes les armées qui le contiennent
- Les « copies disponibles » de `units.md` deviennent la **dotation de départ** du joueur (niveau 1) et ne sont plus un maximum de possession

### Niveaux (joueur et individus)
- **Joueur** (`rules.md` 11.5) : XP à chaque victoire (100 + bonus selon les PP survivants de l'armée ; 100 fixes pour la bataille tutoriel), courbe 500 × niveau, sans maximum. Chaque niveau rapporte des Spirit Stones (50 × nouveau niveau, provisoire)
- **Individus** (`rules.md` 11.6) : XP à la victoire seulement, bataille tutoriel comprise (réserve de survie de 200 XP partagée entre les déployés, morts compris, versée aux survivants ; + coût en PP de chaque ennemi achevé), courbe 50 × niveau, niveau 5 maximum. +10 % de PV et de dégâts par niveau ; coût en PP inchangé
- **Écran de victoire** : rangée de récompenses (Spirit Stones et XP du joueur, même composant que le panneau de « Partir en guerre »), individus qui ont monté de niveau, unités perdues — `technical.md` 5.3
- **Bataille** : la tour de déploiement affiche une ligne par espèce **et par niveau** (`ui-battle-screen-decisions.md` 2.2)

### Gestion de civilisation — section Unités
- Liste : une **grille de cases carrées**, une par groupe d'individus strictement identiques (même espèce, même niveau, comme la tour de commandement : sprite, puis nom, niveau en couleur de la faction et nombre), espèce par espèce. Une espèce sans individu (ex : Légendaire mort) garde une case grisée avec son bouton « Invoquer » / « Réinvoquer » menant à l'écran Invocation
- Clic sur une case → **page de détail de son premier individu** (jamais groupée) : grand sprite, nom de l'espèce, keywords, niveau, barre d'XP, flèches vers l'individu précédent / suivant (un par un), toutes les stats **à son niveau** (PV, dégâts, type d'attaque, taille, vitesses, portée, coût), texte des aptitudes (pas de bouton d'invocation)

### Gestion de civilisation — section Armée
- **Une seule armée** dans le MVP (les emplacements supplémentaires sont verrouillés, voir Suite)
- Une armée est une liste d'identifiants d'individus (preset) : un même individu pourra figurer dans plusieurs armées quand d'autres emplacements seront débloqués
- **Plafond : 500 PP** de coût total par armée (volontairement au-dessus des 150 PP du terrain) ; **minimum : 1 unité**
- Actions : **renommer** l'armée (1 à 20 caractères), **ajouter / retirer** des individus, avec un compteur « X / 500 PP ». Pas de suppression (armée unique)
- **Un accordéon par espèce** : fermé, l'en-tête seul ; ouvert, une ligne par niveau (individus strictement identiques regroupés, comme la tour de commandement) avec des boutons − / + pour retirer ou ajouter un individu
- Un individu invoqué n'est **pas** ajouté automatiquement à l'armée
- **Armée de départ** : créée automatiquement à l'arrivée sur l'accueil après la victoire de la bataille tutoriel, avec **tous les survivants** (les dotations de départ totalisent au plus 430 PP, donc tiennent toujours sous 500), et un nom par défaut

### Monnaie : Spirit Stones
- Somme de départ donnée au joueur au choix de la faction (0, provisoire)
- Récompense à chaque victoire : bataille tutoriel : 50 ; « Partir en guerre » : 60 / 80 / 100 et 80 (« L'essaim ») à la première victoire, rien au rejeu (provisoire)

### Écran Invocation (nouveau)
- Achat d'un individu d'une **espèce déjà connue** (roster de la faction du joueur) — pas de gacha
- **Pas de plafond de possession** pour les unités non légendaires : ce qui freine le joueur, c'est la monnaie ; le plafond d'armée (500 PP) et celui du terrain (150 PP) bornent déjà ce qui combat
- **[Légendaire] unique** : au plus un exemplaire possédé. Masqué de l'écran Invocation tant qu'il est vivant, proposé seulement s'il est mort
- Invocation et réinvocation sont **la même action** (payer, ajouter un individu) ; seul le libellé change : « Invoquer » pour une unité classique, « Réinvoquer » pour un Légendaire mort. Pas de délai ni de coût croissant d'une réinvocation à l'autre
- **Niveau gardé** : à la réinvocation, le joueur choisit le niveau du Légendaire, entre 1 et celui qu'il avait à sa mort ; +25 % du prix de base par niveau gardé au-delà du 1 (`rules.md` 11.4). Un individu invoqué autrement est niveau 1
- **Prix = coût en PP de l'espèce × k**, avec un multiplicateur à part éventuel pour le [Légendaire] (valeurs à définir)

### Persistance (localStorage)
- Un seul **profil du joueur**, sauvegardé sous une seule clé (`technical.md` 5.4) : la faction choisie, la victoire de la bataille tutoriel, la **liste des individus possédés** (avec leur XP), l'**armée** (nom + identifiants), le **solde de Spirit Stones**, l'**XP du joueur**, le **niveau du Légendaire à sa mort** (pour la réinvocation), la **liste des batailles de « Partir en guerre » gagnées**, l'**heure de la dernière récolte de la Spirit Fountain** et la **liste des conseils de l'accueil déjà vus** (tutoriel de l'accueil, `technical.md` 5.5)
- Pas de système de sauvegarde généralisé : ni historique de batailles, ni état d'une bataille en cours

### Outil de développement
- Profils de test `test-wyrm` et `test-undead` (menu devs) : **10 000 Spirit Stones** en plus de leurs pertes figées, et des niveaux variés (joueur et individus) — détail : `technical.md` 5.6

---

## Ordre de développement

1. Modèle de données et sauvegarde : individus `{ id, species }`, armée, solde de Spirit Stones (logique pure + tests Jest), et profil `test-wyrm` à jour
2. Écran d'accueil : solde en haut à droite, trois boutons (« Partir en guerre » sans contenu pour l'instant)
3. Gestion de civilisation, section Unités : liste par espèce + page de détail
4. Gestion de civilisation, section Armée : armée de départ automatique, renommage, composition sous 500 PP
5. Écran Invocation : achat, réinvocation du Légendaire, débit des Spirit Stones
6. Logique des niveaux (logique pure + tests Jest) : courbes d'XP du joueur et des individus, stats par niveau, XP gagnée à la victoire, prix de réinvocation selon le niveau gardé
7. Sauvegarde des niveaux (XP des individus, XP du joueur, niveau du Légendaire à sa mort), profil `test-wyrm` à jour, niveau et barre d'XP sur l'accueil
8. Gestion de civilisation, section Unités : accordéons par espèce + page de détail d'un individu
9. Gestion de civilisation, section Armée : accordéons par espèce, case « dans l'armée » par individu
10. Bataille : déploiement d'individus précis avec leurs stats de niveau, tour par espèce et niveau, coups fatals attribués ; à la victoire, XP des individus et du joueur (affichée sur l'écran de victoire), récompenses de niveau
11. Écran Invocation : réinvocation du Légendaire avec choix du niveau gardé
12. Second passage de roadmap : contenu de « Partir en guerre » **(fait : `rules.md` 11.7)** ; valeurs chiffrées de l'économie à revoir après playtest
13. « Partir en guerre » — données et logique (logique pure + tests Jest) : définition des trois batailles (zones et scripts provisoires), déblocage en séquence, récompenses (première victoire / rejeu), pertes en défaite, filet de sécurité (remplacé ensuite par la Spirit Fountain, étape 15) ; sauvegarde des batailles gagnées
14. « Partir en guerre » — écrans : `WarScreen`, bataille avec l'armée, écran de défaite enrichi (pertes, « Retour à l'accueil »), bouton de l'accueil activé
15. Spirit Fountain : logique (tests Jest), sauvegarde de l'heure de dernière récolte, affichage et récolte sur l'accueil
16. Playtest et chiffrage de l'économie (somme de départ, k, récompenses, récompense de niveau)

---

## Exclus du MVP (renvoyés en suite)

- Gacha (invocation d'espèces inconnues ou aléatoires)
- Plus d'une armée : les emplacements supplémentaires restent verrouillés
- Personnalisation des individus (noms, stats choisies, keywords) — seuls le renommage d'une armée et la progression en niveau sont inclus
- Délai ou coût croissant de réinvocation
- Suppression d'une armée

## Suite

- Déblocage progressif d'emplacements d'armée supplémentaires, **à certains niveaux du joueur** (niveaux à définir)
- **Hausse ponctuelle du plafond de l'armée** (500 PP) à certains niveaux du joueur (niveaux et montants à définir)
- **Amélioration** permettant à un individu de dépasser le niveau 5 (forme et coût à définir)
- **Cooldown de la fuite réduit** selon le niveau du joueur (`rules.md` 5.1 ; courbe à définir)
- Personnalisation des individus — le modèle `{ id, species, xp }` est prévu pour l'accueillir sans migration de sauvegarde
- Réinvocation avec délai ou coût croissant
- Gacha

---

## Décisions tranchées

| Point | Décision |
|---|---|
| Unités possédées | Liste d'individus `{ id, species, xp }` en données, regroupés par espèce puis montrés un par un ; la dotation de départ vient de `units.md` ; un individu tué est perdu définitivement |
| Pourquoi des individus dès le MVP | La sauvegarde doit de toute façon changer (monnaie, armée), et une armée référence des individus : cela évite une migration des sauvegardes quand la personnalisation arrivera. Seule l'XP est ajoutée maintenant |
| Niveau des individus | Porté par chaque individu (pas par l'espèce) ; XP à la victoire (survie + ennemis achevés) ; niveau 1 à 5 ; +10 % PV et dégâts par niveau ; coût en PP fixe, pour que garder ses unités en vie les rende plus fortes sous le même plafond |
| Niveau du joueur | XP à la victoire (100 + bonus selon les PP survivants ; 100 fixes au tutoriel) ; sans maximum ; rapporte des Spirit Stones. Emplacements d'armée et plafond de PP liés au niveau : hors MVP |
| Armée | Une seule armée (preset d'identifiants), renommable, 500 PP max, 1 unité min ; créée automatiquement avec tous les survivants de la bataille tutoriel, nommée « Armée 1 » ; composée individu par individu (accordéons) |
| Invocation | Achat d'espèces connues sans plafond ; Légendaire unique, réinvocable seulement s'il est mort ; même action pour invocation et réinvocation ; prix = coût PP × k ; à la réinvocation, niveau gardé au choix, +25 % du prix par niveau |
| Monnaie | Spirit Stones (nom provisoire) : somme de départ + récompenses de victoire (aucune au rejeu) + récompenses de niveau ; solde affiché en haut à droite de l'accueil |
| Partir en guerre | Quatre batailles, débloquées par les liens de la map, deux zones chacune, rejouables ; pertes définitives même en défaite ; la Spirit Fountain évite le blocage ; difficulté fixée par la distance au boss (règle de conception, `rules.md` 11.7) |

## Points encore ouverts

- **Économie** (valeurs provisoires, à chiffrer après playtest) : somme de départ (0), k (1), multiplicateur du Légendaire (×1), récompenses de victoire (50 ; 60 / 80 / 100 / 80 ; rien au rejeu), Spirit Fountain (3 / min, 80 + 10 × niveau)
- **Partir en guerre** : zones et scripts de l'IA définitifs des quatre batailles (scripts provisoires dans `rules.md` 11.7, chiffrés par `/balancer`)
- **Récompense de niveau du joueur** : 50 × nouveau niveau en Spirit Stones, provisoire, à revoir avec k
