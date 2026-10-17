# SPECS-REVIEW.md — Revue de cohérence des specs

Produit par `/spec-reviewer` le 2026-10-17, à la fin de la réécriture de `SPECS/` pour la concision (étapes 1 à 4 : archive et index des rôles, roadmaps, `rules.md`, `technical.md` / `ui-battle-screen-decisions.md` / `GRAPHICS.md`). Remplace la revue du 2026-10-15, dont tous les points ont été traités (code mis à jour, commité).

Fichiers relus ensemble : `README.md`, `CONCEPT.md`, `rules.md`, `units.md`, `roadmap.md`, `roadmap-mvp.md`, `technical.md`, `GRAPHICS.md`, `ui-battle-screen-decisions.md`, `strategic-depth.md`, `AGENTIC-WORKFLOW.md`, `DECISIONS.md`. Non audités : `SPECS/archive/` (historique).

---

## Points relevés et décisions

| # | Type | Constat | Décision | Fichiers modifiés |
|---|---|---|---|---|
| 1 | Incohérence | Soif de sang plafonnée à 145 PV (`units.md`) ou aux PV max du niveau (`rules.md` 11.6, code) | PV max du niveau (145 au niveau 1) | `units.md` |
| 2 | Ambiguïté | `rules.md` 7.3 parlait d'« unité 2×2 » bloquée par le passage étroit de « Le mur », alors que les deux seules unités 2×2 (Fafnir, Athos) volent | Précisé « au sol », avec une note : aucune n'existe en v1, ces contraintes préparent un roster étendu | `rules.md` |
| 3 | Trou | `WarScreen` sélectionnait « la dernière bataille débloquée », ambigu depuis le déblocage par les liens (plusieurs batailles s'ouvrent ensemble) | On garde le code : le dernier emplacement non verrouillé dans l'ordre de `warMap01.js`, désormais écrit | `technical.md` |
| 4 | Incohérence | `rules.md` 10 dit toutes les autres valeurs tranchées ; `units.md` disait ses stats « à ajuster en playtesting », avec deux paragraphes de justification | Stats tranchées ; justifications déplacées | `units.md`, `DECISIONS.md` |

---

## Vérifié sans problème

- Valeurs croisées : plafonds (150 PP terrain, 500 PP armée), zone de déploiement (colonnes 0 à 5), cooldown de la fuite (5 s), dégâts de zone (50 %, valeurs de `units.md`), réserve d'XP de survie (200), récompenses (50 ; 60 / 80 / 100 ; 80), Spirit Fountain (3 / min, 80 + 10 × niveau), dotations (430 / 418 PP), profils de test (375 / 369 PP).
- Scripts de l'IA : copies de départ suffisantes pour chaque bataille, phases comprises (ex : « La citadelle », IA Morts-Vivants : 18 Squelettes et 4 Necromants pour 18 et 8 copies).
- Renvois de section entre fichiers et depuis le code : toutes les sections citées existent.
- Champs du profil (`technical.md` 5.4) : chacun correspond à une règle de `rules.md` 11 et à un cas de persistance de `roadmap-mvp.md`.
- Fin de bataille : pendant les 2 s qui suivent une victoire acquise, l'IA n'a plus d'unité sur le terrain, donc aucune perte n'est possible.

---

## Conclusion

Un agent IA qui recevrait ces fichiers sans autre contexte n'aurait pas besoin d'inventer de règle pour le scope v1. Les seuls points ouverts sont **nommés comme tels** :
- les **valeurs provisoires** de `rules.md` 10, à mesurer avec `/balancer` — en particulier après les dégâts de zone et la zone de déploiement, qui ont fait monter les pertes du bot d'environ 60 % sur les batailles existantes ;
- le **contenu « à venir »** : batailles des autres emplacements de la map 1, dont les boss (`rules.md` 11.7) ; l'apparence d'une unité en fuite ou engagée (`ui-battle-screen-decisions.md` 5).

Ce skill peut être relancé à tout moment, notamment après plusieurs `/enricher` ou avant une grosse session de développement.
