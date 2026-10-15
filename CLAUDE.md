# CLAUDE.md

Instructions persistantes pour Claude Code sur ce projet. Lues automatiquement à chaque session.

## Contexte du projet

Jeu de stratégie autobattler en JavaScript : Phaser 3 pour le champ de bataille, React pour l'interface. Ce dépôt ne contient que le MVP ; la version clickbait (rendu 1) est un projet passé, dans un autre dépôt. Les specs complètes vivent dans `SPECS/` et font autorité — ne jamais inventer une règle ou une valeur qui n'y figure pas sans le signaler explicitement à l'utilisateur.

**Assets disponibles** dans `assets/` (voir `assets/README.md` pour le détail) : sprites des six unités, des deux souverains et des rochers, et le background de la bataille.

Lire dans cet ordre avant toute tâche de code :
1. `SPECS/CONCEPT.md` — le jeu, les deux versions du projet et ce que contient le MVP
2. `SPECS/ROADMAP.md` — périmètre exact de la v1 (ce qui est inclus/exclu)
   - `SPECS/roadmap-mvp.md` — couche méta du MVP (accueil, gestion de civilisation, invocation, monnaie, persistance). **Fait priorité sur `roadmap.md` en cas de contradiction.**
3. `SPECS/RULES.md` — mécaniques du jeu (comportements, chiffres)
4. `SPECS/units.md` — stats précises des unités des deux factions
5. `SPECS/TECHNICAL.md` — stack, architecture (dossiers, états, répartition Phaser / React), stratégie de tests

Voir aussi `SPECS/AGENTIC-WORKFLOW.md` pour la boucle de travail attendue.

**Refactor d'octobre 2026 terminé** : étapes, décisions et contrôles de fin d'étape dans `SPECS/refactor-roadmap.md` (historique).

## Règles de travail

- **Ne jamais mélanger logique de jeu et rendu Phaser.** Le dossier `src/logic/` ne doit avoir aucune dépendance à Phaser (voir `SPECS/technical.md` section 2). Si une tâche semble pousser à violer cette séparation, le signaler avant de coder.
- **Écrire un test Jest pour toute règle de `rules.md` implémentée**, dans `tests/logic/`. Après toute modification du moteur, le test de référence `battleReplay` doit passer sans régénérer son instantané, sauf changement de comportement voulu. Une fonctionnalité de la logique de jeu sans test associé n'est pas considérée terminée.
- **Ne pas ajouter de fonctionnalité hors du scope v1** listé dans `SPECS/roadmap.md` et `SPECS/roadmap-mvp.md`, même si elle semble simple à ajouter (ex : gacha, traits, personnalisation). Si une tâche demandée touche à ces éléments, le signaler plutôt que de l'implémenter silencieusement.
- **Persistance : jamais de sa propre initiative.** Ne rien sauvegarder (localStorage ou autre) sans que l'utilisateur ait validé ce cas précis de persistance (ex : ceux listés dans `SPECS/roadmap-mvp.md`) ou l'ait explicitement demandé. Pour tout autre cas, demander avant d'implémenter.
- **Si une valeur ou une règle nécessaire n'est pas dans `SPECS/`**, demander plutôt que de deviner — les specs sont censées être exhaustives pour la v1, un trou est probablement un oubli à combler.
- **Code, fichiers, dossiers et assets en anglais.** Les textes affichés au joueur sont en français pour l'instant (regroupés dans `src/ui/strings.js`, pour une traduction future). Les documents dans `SPECS/` et les commentaires du code restent en français, mais le code et les noms de fichiers utilisent l'anglais (ex : `BattleUnit`, `unitBehavior.js`, `lambton-worm.png`). Vocabulaire : `SPECS/technical.md` 2.5 (guerre / bataille, ordre).
- **DRY et simplicité maximale pour la v1.** Pas d'abstraction ou d'architecture pensée pour anticiper la v2+ (pas de système de plugins, pas de couche de config générique) tant qu'un besoin concret ne l'exige pas. Objectif : le code le plus direct possible, lisible par un humain autant que par une IA.
- **Commits : jamais de sa propre initiative.** Quand un changement est prêt, proposer un message de commit ; l'utilisateur le relit, le réécrit si besoin et fait le commit.
