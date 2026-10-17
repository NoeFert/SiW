# ROADMAP.md

> **Rôle** : le périmètre du moteur de bataille — ce qui est inclus dans le MVP (scope v1), puis la suite (v2+). Les règles elles-mêmes sont dans `rules.md`. Index des fichiers : `README.md`.

**Objectif du MVP** : valider que le cœur du jeu (unités autonomes, contrôle limité du joueur) est jouable et amusant, et donner une raison de rejouer (la couche méta, `roadmap-mvp.md`, qui fait priorité sur ce fichier).

## Inclus

| Élément | Règles |
|---|---|
| Grille 24 × 14 avec obstacles | `rules.md` 1 |
| Deux factions (Wyrms, Morts-Vivants), 3 unités chacune ; l'IA joue l'autre faction | `rules.md` 9, `units.md` |
| Déploiement : zone de déploiement, plafond vivant de 150 PP, copies limitées | `rules.md` 2 |
| Mouvement autonome, pathfinding, corps-à-corps et tir | `rules.md` 3 et 4 |
| Dégâts de zone des [Légendaire] | `rules.md` 4.6 |
| Aptitudes automatiques | `rules.md` 6, `units.md` |
| Ordres Aller, Attaquer, Fuir (cooldown sur Fuir) | `rules.md` 5 |
| Pause principale et pauses d'interaction | `rules.md` 5.2 |
| Bouton Abandonner | `rules.md` 8.2 |
| IA scriptée, entrée par le bord droit | `rules.md` 7 |
| Batailles en plusieurs phases | `rules.md` 7.3 |
| Victoire, défaite, match nul | `rules.md` 8 |
| Bataille tutoriel guidée (une phase) | `rules.md` 7.1, `technical.md` 5.5 |
| Enchaînement des écrans (intro, faction, bataille, fin, accueil) | `technical.md` 5 |
| Couche méta | `roadmap-mvp.md` |

## Exclus du MVP

- Gacha (l'invocation d'espèces connues, elle, est incluse)
- Traits et leurs deux générateurs
- Personnalisation des unités (noms, achat de keywords) — la progression par niveau, elle, est incluse
- Coût en points de présence à 3 niveaux (en v1 : coût fixe par espèce)
- Classes, synergies, arbre de renforcement
- Unités avec une aptitude à usage limité (le type est défini, `rules.md` 6.2, mais aucune unité ne l'a)
- Roster étendu et factions supplémentaires
- Ligne de vue des tirs (`rules.md` 4.5)

## Suite (v2+)

À traiter une fois le MVP validé en pratique. Pistes de la couche méta : `roadmap-mvp.md`.

- Gacha
- Traits, avec deux générateurs (vétérance normale / danger-négligence)
- Personnalisation des unités
- Coût en points de présence à 3 niveaux
- Classes, rôles, synergies ; arbre de renforcement par unité
- Nouvelles unités, dont certaines avec une aptitude à usage limité
- Autres guerres (maps et batailles)
- Roster étendu et factions supplémentaires

## Points ouverts

Valeurs provisoires : `rules.md` 10.
