# DECISIONS.md — Journal des décisions

Le **pourquoi** des règles et des valeurs, sorti de `rules.md` pour que les règles restent courtes. Une ligne par décision ; la règle elle-même ne vit que dans `rules.md` (ou `units.md`).

Format : **quoi** — pourquoi (source, date). Les plus récentes en haut de chaque section.

## Bataille

- **Dégâts de zone des [Légendaire], zone de déploiement réduite, XP de survie partagée** — surcharger le terrain gagnait toujours ; ces trois règles rendent la masse risquée (`strategic-depth.md`, 2026-10-15).
- **L'IA joue toujours l'autre faction** — cohérence narrative : le joueur n'affronte jamais sa propre armée en miroir (ancienne roadmap).
- **Une unité encerclée en fuite riposte sur place** — aucun obstacle ne peut couper tous les bords : seule une foule d'unités peut bloquer une fuite, et l'unité ne doit pas rester sans défense (ancienne roadmap).

## Couche méta

- **Déblocage par les liens de la map** — la map est un réseau : gagner une bataille ouvre ses voisines, plusieurs chemins mènent au boss (« L'essaim », 2026-10-17).
- **Individus `{ id, species, xp }` dès le MVP** — la sauvegarde devait changer de toute façon (monnaie, armée) ; une armée référence des individus, et le modèle accueillera la personnalisation sans migration de sauvegarde (ancienne roadmap-mvp).
- **Coût en PP fixe, quel que soit le niveau** — garder ses unités en vie les rend plus fortes sous le même plafond (ancienne roadmap-mvp).
- **Pas de plafond de possession** (hors [Légendaire]) — la monnaie freine déjà ; le plafond de l'armée (500 PP) et celui du terrain (150 PP) bornent ce qui combat (ancienne roadmap-mvp).
- **Armée de 500 PP, au-dessus des 150 du terrain** — l'armée emporte des réserves, à déployer à mesure que le terrain se libère (ancienne roadmap-mvp).

## Interface
