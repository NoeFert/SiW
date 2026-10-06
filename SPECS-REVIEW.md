# SPECS-REVIEW.md — Revue de cohérence et de complétude

Date : 2026-10-06. Fichiers relus ensemble : `CONCEPT.md`, `rules.md`, `units.md`, `roadmap.md`, `roadmap-mvp.md`, `technical.md`, `POC-SPECS.md`, `GRAPHICS.md`, `AGENTIC-WORKFLOW.md`, `ui-battle-screen-decisions.md`.

La revue précédente (2026-10-02, commit `d5eda8b`) reste valable : ses 8 points sont toujours réglés dans les specs. Celle-ci traite les écarts apparus depuis, surtout avec les travaux sur l'accueil, l'invocation et « Partir en guerre ».

## Trous et incohérences traités

| # | Constat | Type | Décision | Fichiers modifiés |
|---|---|---|---|---|
| 1 | [Légendaire] vivant sur l'écran Invocation : « grisé, Déjà à vos côtés » (`rules.md` 11.4, `roadmap-mvp.md`) contre « masqué » (`technical.md` 5.1, code). | Incohérence | **Masqué** tant qu'il est vivant. | `rules.md` 11.4, `roadmap-mvp.md` |
| 2 | Menu de l'accueil : « soulignées d'un séparateur » (`technical.md` 5.1) contre « ni séparateur » (`GRAPHICS.md`). | Incohérence | **Pas de séparateur.** | `technical.md` 5.1 |
| 3 | Spirit Fountain vide : « à moitié transparente » et « reste opaque » dans la même section de `GRAPHICS.md`. | Incohérence | **Opaque**, simplement non cliquable. | `GRAPHICS.md` |
| 4 | Écran de victoire du jeu normal : la puce sur le clickbait coupait la liste, si bien que les Spirit Stones et les pertes se retrouvaient rangées sous le clickbait ; 5.1 et 5.6 parlaient encore d'un écran « minimal ». | Incohérence | Dans l'ordre : 1. une **rangée de récompenses** avec le même composant que le panneau de `WarScreen` (Spirit Stones = victoire + niveaux du joueur, puis XP exacte du joueur) ; 2. les individus qui ont monté de niveau ; 3. les unités perdues. Le clickbait ne change pas. | `technical.md` 5.1, 5.3 et 5.6 ; `roadmap-mvp.md` |
| 5 | Invocation multiple : « de 1 au maximum payable », sans cas prévu quand le solde ne paie même pas un individu. | Trou (cas limite) | Le nombre reste à 1, et − / + sont désactivés, comme le bouton « Invoquer ». | `technical.md` 5.1 |
| 6 | Le « tutoriel complet » de `CONCEPT.md` apprenait « les commandes », alors que `STARTER_TUTORIAL` n'enseigne ni Aller ni Attaquer. | Incohérence | Le tutoriel de départ reste celui de `technical.md` 5.5 (déployer, PP, retraite). Il sera complété **après** cette version du jeu. | `CONCEPT.md` |
| 7 | « Un seul bouton d'action » sur les écrans de fin (`technical.md` 5.3), alors que la défaite de « Partir en guerre » en a deux. | Incohérence | Exception écrite dans 5.3 : pertes + « Réessayer » + « Retour à l'accueil ». | `technical.md` 5.3 |

## Ce qui reste ouvert

Ces points sont tous écrits et signalés comme provisoires ou à venir dans les specs. Aucun ne pousse à inventer une règle pour le scope actuel :
- **économie** : somme de départ (0), k (1), multiplicateur du Légendaire (×1), récompenses de victoire, Spirit Fountain, récompense de niveau (`rules.md` 10) ;
- **zones et scripts définitifs** de « Partir en guerre » (provisoirement ceux de la bataille-clickbait, `rules.md` 11.7) ;
- **map 1** : les emplacements sans bataille, boss compris, sont verrouillés et n'ont pas de contenu (rien à implémenter) ;
- **tutoriel** : il sera complété et affiné une fois cette version du jeu terminée. D'ici là, aucune étape n'est à ajouter.

## Écarts code / specs à vérifier

Chaque point se traite dans une étape à part, avec ses tests Jest quand il touche `src/logic/` :
- écran de victoire du jeu normal : rangée de récompenses (composant du panneau `WarScreen`), puis montées de niveau, puis pertes (`technical.md` 5.3) ;
- invocation multiple avec un solde trop faible pour un seul individu : nombre à 1, − / + désactivés (`technical.md` 5.1) ;
- `strings.js` : la clé `alreadyOwned` (« Déjà à vos côtés ») n'est plus utilisée depuis que le [Légendaire] vivant est masqué. Il reste à décider s'il faut la supprimer.

## Conclusion

Un agent IA qui recevrait ces fichiers sans autre contexte n'aurait pas besoin d'inventer de règle pour le scope v1. Les seuls points encore ouverts sont des valeurs provisoires déjà chiffrées, du contenu explicitement verrouillé (map 1) et le tutoriel, explicitement reporté.
