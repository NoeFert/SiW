# SPECS-REVIEW.md — Revue de cohérence des specs

Produit par `/spec-reviewer` le 2026-10-15, juste après l'intégration de `SPECS/strategic-depth.md` par `/enricher` (dégâts de zone des [Légendaire], zone de déploiement réduite, XP de survie partagée).

Fichiers relus ensemble : `CONCEPT.md`, `rules.md`, `units.md`, `roadmap.md`, `roadmap-mvp.md`, `technical.md`, `GRAPHICS.md`, `ui-battle-screen-decisions.md`, `AGENTIC-WORKFLOW.md`, `strategic-depth.md`. Documents historiques non audités (depuis rangés dans `SPECS/archive/`) : `refactor-roadmap.md`, `FEEDBACK-POC.md`.

---

## Points relevés et décisions

| # | Type | Constat | Décision | Fichiers modifiés |
|---|---|---|---|---|
| 1 | Incohérence | `rules.md` 2 et 11 citaient encore la « version clickbait », qui n'est plus dans ce dépôt | Mentions retirées | `rules.md` |
| 2 | Trou | `rules.md` 6 renvoyait à un « design doc section 2.2 » inexistant | Renvoi vers `units.md` | `rules.md` |
| 3 | Incohérence | `rules.md` 10 disait toutes les valeurs de la bataille tranchées ; la note de 7.1 parlait d'un script provisoire et d'une « règle à venir » jamais décrite ; les 50 % de 4.6 n'avaient pas de statut | La section 10 liste deux valeurs provisoires en attendant `/balancer` : le script de la bataille tutoriel (7.1) et les 50 % de 4.6. La note de 7.1 renvoie à la section 10, sans parler de règle à venir | `rules.md` |
| 4 | Incohérence | Niveau dans la tour de bataille : badge (`GRAPHICS.md`) ou texte simple (`ui-battle-screen-decisions.md` 2.2) | Texte simple coloré, à côté des PV | `GRAPHICS.md` |
| 5 | Incohérence | Tags (type d'attaque, keywords) dans la tour de bataille : oui (`GRAPHICS.md`) ou non (`ui-battle-screen-decisions.md` 2.2) | Pas de tags dans la tour, seulement sur la page de détail | `GRAPHICS.md` |
| 6 | Incohérence | Nombre d'individus d'un groupe : « fine bande en haut » (`GRAPHICS.md`) ou « carré en haut à gauche » (`technical.md` 5.1, `ui-battle-screen-decisions.md`, code) | Carré en haut à gauche | `GRAPHICS.md` |
| 7 | Incohérence | `ui-battle-screen-decisions.md` 1 présentait toute la moitié gauche comme zone de déploiement | Précisé : premier quart, colonnes 0 à 5 (`rules.md` 2) | `ui-battle-screen-decisions.md` |
| 8 | Trou | Le clignotement des ennemis touchés par la zone renvoyait à un clignotement du coup critique documenté nulle part (seulement dans le code) | Décrit dans les deux cas : jaune pour le coup critique, orange pour la zone, 3 clignotements de 70 ms | `GRAPHICS.md` |
| 9 | Incohérence | Regroupement dans la tour : « une case par espèce » par défaut, mais une « Règle de regroupement » (niveau + PV) sans mode précisé, et un mode dégroupé décrit « par niveau » seul | La règle de regroupement vaut pour l'espèce dégroupée (même niveau et mêmes PV). **Nouveau** : une case regroupée déploie d'abord les intacts (niveau décroissant), puis les blessés en dernier. Renvoi corrigé en section 4 (`technical.md` 2.3) | `ui-battle-screen-decisions.md` |

---

## Code à mettre à jour

Les specs sont en avance sur le code pour :
- **Dégâts de zone des [Légendaire]** (`rules.md` 4.6, `units.md`) et leur clignotement orange (`GRAPHICS.md`).
- **Zone de déploiement** colonnes 0 à 5 (`rules.md` 2).
- **XP de survie partagée** (`rules.md` 11.6).
- **Ordre de déploiement d'une case regroupée** : les blessés en dernier (`ui-battle-screen-decisions.md` 2.2, point 9).

Les deux premiers changent le comportement du moteur : l'instantané de `battleReplay` est à régénérer une fois, volontairement (`technical.md` 4).

---

## Points ouverts (connus, non bloquants)

- **Valeurs provisoires**, listées dans `rules.md` 10 : script de la bataille tutoriel, 50 % des dégâts de zone, réserve d'XP de survie (200), économie de la couche méta. À mesurer avec `/balancer` une fois le code à jour. Les dégâts de zone renforcent aussi les [Légendaire] de l'IA (bataille tutoriel, « Le fort »).
- **Contenu non encore écrit**, déjà signalé comme tel : batailles de boss et autres emplacements de la map 1 (`rules.md` 11.7), zones et scripts définitifs de « Partir en guerre ».

---

## Conclusion

Un agent IA qui recevrait ces fichiers sans autre contexte n'aurait pas besoin d'inventer de règle pour coder les trois ajouts de `strategic-depth.md` ni le reste du scope v1 décrit. Les seuls trous restants sont des **valeurs provisoires**, nommées comme telles dans `rules.md` 10, et du **contenu explicitement « à venir »** (batailles de boss, emplacements verrouillés), que l'agent ne doit pas inventer.
