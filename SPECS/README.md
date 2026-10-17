# SPECS — qui contient quoi

**Un fait, un seul endroit.** Chaque fichier a un rôle ; les autres renvoient à lui au lieu de le répéter. En cas de doute, la règle de `rules.md` fait foi.

| Fichier | Rôle | Contient | Ne contient pas |
|---|---|---|---|
| `CONCEPT.md` | le pourquoi | le jeu, l'objectif du joueur, ce que contient le MVP (une page) | aucun chiffre, aucune règle |
| `roadmap.md` | le périmètre du moteur de bataille | ce qui est inclus dans le MVP, ce qui est repoussé, en liste avec renvois | le détail des règles |
| `roadmap-mvp.md` | le périmètre de la couche méta | idem pour l'accueil, l'armée, l'invocation, la guerre… ; fait priorité sur `roadmap.md` | le détail des règles |
| `rules.md` | le quoi | les règles testables et leurs valeurs | le pourquoi, l'historique, le code |
| `units.md` | les données | les stats des unités, en tableaux | les mécaniques (→ `rules.md`) |
| `technical.md` | le comment | stack, architecture, écrans, tests | les règles du jeu |
| `GRAPHICS.md` | l'apparence | direction artistique, assets, effets visuels | les règles du jeu |
| `ui-battle-screen-decisions.md` | l'écran de bataille | disposition et comportement de l'interface | les règles du jeu |
| `strategic-depth.md` | les pistes | pistes de profondeur stratégique : retenues (devenues des règles) et autres idées | des règles à coder |
| `AGENTIC-WORKFLOW.md` | la méthode | la boucle de travail avec l'IA | — |
| `DECISIONS.md` | le pourquoi des valeurs | une ligne par décision : quoi, pourquoi, source, date | les règles elles-mêmes |
| `archive/` | l'historique | documents terminés (refactor d'octobre 2026, retour sur le POC) | rien d'actif : inutile pour coder |

Rapports produits par les skills, à la racine du dépôt : `BALANCE-REVIEW.md` (`/balancer`), `SPECS-REVIEW.md` (`/spec-reviewer`).
