# ROADMAP.md

Le projet a connu deux versions. La première, une **version clickbait** (le POC du rendu 1 : une bataille courte au format d'une publicité de jeu mobile), est un projet passé, conservé dans un autre dépôt. Ce dépôt ne contient que la seconde, le **MVP** : le jeu complet, sur lequel porte désormais tout le travail. Ce fichier décrit son périmètre (scope v1), puis la suite (scope v2+).

---

## MVP — scope v1

**Objectif :** valider que le cœur du gameplay (unités autonomes + contrôle limité du joueur) est jouable et amusant, et lui donner une raison de rejouer (la couche méta).

> **Couche méta du MVP** (accueil, gestion de civilisation, armée, invocation, Spirit Stones, niveaux, « Partir en guerre ») : le détail est dans `roadmap-mvp.md`, qui **fait priorité** sur ce fichier en cas de contradiction.

### Inclus
- Une grille avec obstacles (voir `rules.md` section 1)
- **Deux factions jouables** (Souveraine des Wyrms et Souverain des Morts-Vivants), roster réduit de 3 unités chacune (basique, [Vol], [Légendaire]). Le joueur choisit sa faction en début de partie ; l'IA contrôle automatiquement l'autre — pour éviter que le joueur affronte sa propre armée en miroir (voir `rules.md` section 9 et `units.md`)
- Déploiement avec pause tactique dans la zone de déploiement (colonnes 0 à 5, le premier quart du terrain), plafond vivant de points de présence, nombre de copies limité par espèce (voir `rules.md` section 2)
- **Dégâts de zone des [Légendaire]** : chaque attaque touche aussi les ennemis à 1 case de la cible, pour 50 % des dégâts (voir `rules.md` 4.6)
- **XP de survie partagée** entre les individus déployés (voir `rules.md` 11.6) — avec les deux points ci-dessus, pour que surcharger le terrain ne soit plus la stratégie gagnante (`strategic-depth.md`)
- **Pause principale** : interrupteur ⏸ / ▶ (et barre Espace) qui gèle tous les compteurs de la bataille, pendant laquelle le joueur peut encore déployer et donner un ordre (voir `rules.md` section 5.2)
- **Tutoriel guidé pendant la bataille tutoriel** : messages et main animée, bataille figée tant que le joueur n'a pas fait l'action demandée (déployer, points de présence, battre en retraite — voir `technical.md` section 5.5)
- **Bouton Abandonner**, disponible à tout moment de la bataille (tutoriel compris), avec confirmation : défaite, réserves conservées (voir `rules.md` section 8.2)
- Mouvement autonome + pathfinding + règles d'engagement corps-à-corps et à distance (voir `rules.md` sections 3 et 4)
- Combat autonome (dégâts, PV, mort définitive)
- Aptitudes automatiques propres à certaines unités (voir `rules.md` section 6 et `units.md`)
- Ordres du joueur (attaquer, aller à, fuir), donnés depuis la rangée « Ordres » de la tour (le clic sur un ordre met le jeu en pause), cooldown de 5 secondes en temps de bataille sur Fuir uniquement, gelé pendant les pauses (voir `rules.md` section 5)
- **Bataille tutoriel en une seule phase** (terrain de `rules.md` section 1, script 7.1) ; les batailles de « Partir en guerre » enchaînent deux phases (`rules.md` 7.3 et 11.7)
- IA adverse scriptée (`rules.md` 7 et 11.7), script symétrique selon la faction jouée par l'IA ; les unités IA entrent par le bord droit du terrain, sur une rangée choisie au moment du déploiement selon la situation du terrain (voir `rules.md` section 7)
- Conditions de fin de bataille : victoire dès la fin du script de l'IA avec son terrain vide, défaite quand le joueur n'a plus aucune unité ou abandonne, match nul ; pas de compte à rebours (voir `rules.md` section 8)
- **Enchaînement d'écrans complet** (voir `technical.md` section 5) : écran d'introduction puis écran de choix de faction (une seule fois, au tout début) → écran de bataille (tour de commandement React à gauche + canevas Phaser) → écran de victoire ou de défaite (« Réessayer ») → après la victoire de la bataille tutoriel, écran d'accueil, point central de la couche méta
- **Couche méta** (`roadmap-mvp.md`, `rules.md` 11) : gestion de civilisation (unités possédées, composition et nom de l'armée), invocation, Spirit Stones, niveaux du joueur et des individus, « Partir en guerre » (trois batailles en séquence), Spirit Fountain
- **Profil du joueur sauvegardé** (localStorage, `technical.md` 5.4) : faction, individus possédés avec leur XP, armée, solde, XP du joueur, batailles gagnées… — une exception ciblée, pas un système de sauvegarde généralisé

### Exclus (renvoyés au scope v2+)
- Gacha (l'invocation d'espèces connues, elle, est dans le MVP)
- Traits et leurs deux générateurs
- Personnalisation des unités (noms, achat de keywords) — la progression des stats par niveau, elle, est dans le MVP
- Système de coût en points de présence à 3 niveaux — en v1, coût fixe simple par espèce
- Classes/synergies et arbre de renforcement
- Aptitudes à usage limité activées par le joueur (`rules.md` 6.2) — définies dans les règles, mais aucune unité du roster v1 n'en possède
- Sauvegarde au-delà du profil du joueur (historique de batailles, bataille en cours)
- Roster étendu au-delà des 3 unités par faction, et factions supplémentaires au-delà des deux premières
- D'autres guerres que la guerre 01 (une seule map en v1)

---

## Suite — scope v2+

À traiter une fois le MVP validé en pratique (détail des pistes de la couche méta : « Suite » de `roadmap-mvp.md`).

- Gacha
- Système de traits, deux générateurs (vétérance normale / danger-négligence)
- Personnalisation des unités
- Système de coût en points de présence à 3 niveaux
- Classes/rôles et synergies
- Arbre de renforcement par unité
- Aptitudes à usage limité pour de nouvelles unités
- D'autres guerres (maps et batailles), avec leurs propres scripts
- Roster étendu (plus d'unités par faction) et factions supplémentaires

---

## Décisions tranchées pour le scope v1

| Point | Décision |
|---|---|
| Découpage du temps de bataille | Temps continu (delta-time) ; chaque unité agit selon son propre timer de vitesse d'attaque |
| Dégâts simultanés (même frame) | Toutes les attaques du frame sont calculées puis appliquées ensemble — pas d'ordre d'initiative |
| Limitation des ordres | Le clic sur un ordre met le jeu en pause ; cooldown de 5 secondes en temps de bataille entre deux fuites (Aller et Attaquer sans cooldown), gelé pendant les pauses |
| Pause principale | Interrupteur ⏸ / ▶ (barre Espace), gèle tous les compteurs ; déploiements multiples, Aller/Attaquer illimités et une seule fuite possibles pendant la pause |
| Retraite d'une unité engagée | Toujours possible immédiatement ; l'ennemi engagé peut placer une dernière attaque au désengagement |
| Adjacence d'une unité 4-cases | Adjacente dès qu'une de ses 4 cases touche une case adjacente à la cible |
| Pathfinding d'une unité 4-cases | Bloc 2×2 rigide, chemin le plus court |
| Conflit [Vol] + retraite sans bord accessible | Face aux obstacles, un bord est toujours géométriquement atteignable ; une unité encerclée par d'autres unités reste en fuite sur place et riposte au corps-à-corps (`rules.md` section 5) |
| Déclenchement du script IA | Timing en temps absolu depuis le début de la phase |
| Case d'apparition des unités IA | Entrée par le bord droit du terrain (jamais d'apparition au milieu du champ de bataille), sur la rangée la plus proche d'une cible stratégique (renfort, puis éradication), au hasard en cas d'égalité (`rules.md` 7.2) |
| Nombre de batailles scriptées | La bataille tutoriel, en une seule phase (`rules.md` 7.1), puis les trois batailles de la guerre 01 (« Partir en guerre »), en deux phases chacune (`rules.md` 11.7, `roadmap-mvp.md`) |
| Choix de faction | Le joueur choisit entre Wyrms et Morts-Vivants, l'IA joue l'autre — pour préserver la cohérence narrative. Écran séparé, une seule fois au début, choix sauvegardé dans le profil |
| Points de présence | Plafond vivant de 150 points, se libère à la mort/fuite d'une unité |
| Zone de déploiement | Colonnes 0 à 5 (premier quart du terrain), sans distance minimale à un ennemi |
| Contre la masse | Dégâts de zone des [Légendaire] (50 %, à 1 case de la cible) et XP de survie partagée (200 XP, provisoire) |
| Copies par espèce | Le joueur engage ses individus (tous à la bataille tutoriel, son armée en guerre) ; l'IA a l'armée de départ de sa faction (`units.md`). Une copie tuée est perdue définitivement, une copie en fuite reste réutilisable |
| Fin de bataille | Victoire dès que l'IA a fini son script et n'a plus d'unité sur le terrain ; défaite quand le joueur n'a plus aucune unité (terrain et réserve) ou abandonne ; match nul possible. Pas de compte à rebours |
| Aptitudes | Deux types définis : automatique (sans action du joueur) et à usage limité (activée par le joueur) — seul le type automatique est utilisé par le roster v1 |
| Après une défaite | Écran de défaite dédié avec bouton « Réessayer » qui relance la même bataille (aucune perte d'une tentative ratée de la bataille tutoriel n'est comptée ; en guerre, les morts sont perdus quand même, `rules.md` 11.7) ; même écran après un match nul, titré « Match nul » |
| Après la victoire | Écran de victoire (récompenses, montées de niveau, pertes) puis écran d'accueil |
| Stack UI | Phaser 3 pour le champ de bataille uniquement ; React + Tailwind + shadcn/ui (thème 8bitcn) pour toute l'UI autour (tour de commandement, boutons, écrans) — voir `technical.md` |

## Points encore ouverts concernant le scope v1

Moteur de bataille : aucun point bloquant. Couche méta : voir « Points encore ouverts » de `roadmap-mvp.md` (valeurs provisoires de l'économie, zones et scripts définitifs de « Partir en guerre »). Le détail des valeurs par unité (stats, coûts, aptitudes) est dans `units.md`, l'enchaînement des écrans dans `technical.md` section 5, et les mécaniques complètes dans `rules.md`.
