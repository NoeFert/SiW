# DECISIONS.md — Journal des décisions

Le **pourquoi** des règles et des valeurs, sorti de `rules.md` pour que les règles restent courtes. Une ligne par décision ; la règle elle-même ne vit que dans `rules.md` (ou `units.md`).

Format : **quoi** — pourquoi (source, date). Les plus récentes en haut de chaque section.

## Bataille

- **Fafnir et Athos : profils différents, DPS brut rapproché** — Fafnir est un tank offensif hybride, Athos une artillerie fragile (145 PV contre 220) avec contrôle (Frappe paralysante) et soin conditionnel (Soif de sang) : il reste plus vulnérable au focus, mais regagne en résilience s'il enchaîne les kills. Leur DPS brut est rapproché (0,27 / 0,23 par PP) pour qu'aucune faction ne soit systématiquement plus forte au choix initial ; l'écart de PV par PP est assumé (ancien `units.md`).

- **Dégâts de zone des [Légendaire], zone de déploiement réduite, XP de survie partagée** — surcharger le terrain gagnait toujours ; ces trois règles rendent la masse risquée (`strategic-depth.md`, 2026-10-15).
- **L'IA joue toujours l'autre faction** — cohérence narrative : le joueur n'affronte jamais sa propre armée en miroir (ancienne roadmap).
- **Une unité encerclée en fuite riposte sur place** — aucun obstacle ne peut couper tous les bords : seule une foule d'unités peut bloquer une fuite, et l'unité ne doit pas rester sans défense (ancienne roadmap).
- **Le champ est symétrique de part et d'autre de la ligne médiane** — le terrain reste équitable quel que soit le camp (ancien `rules.md` 1).
- **Donner un ordre met le jeu en pause** — décidé après des tests de jeu : laisser le temps courir pendant la sélection créait du stress (ancien `rules.md` 5, `ui-battle-screen-decisions.md` 2.3).
- **L'IA entre par le bord droit** — une apparition soudaine au contact paraissait injuste ; le joueur voit arriver les ennemis et a le temps de réagir (ancien `rules.md` 7.2).
- **Pas de compte à rebours de fin de bataille** — l'ancien délai de 15 s quand un terrain se vide a été supprimé, pour les deux camps et dans toutes les batailles (ancien `rules.md` 8).
- **Victoire affichée 2 s après être acquise** — laisser voir la fin du combat (ancien `rules.md` 8.1).
- **Le coût total d'un script de l'IA n'est pas un budget** — seul le plafond vivant de 150 PP limite l'IA, comme le joueur ; le [Légendaire] attend donc que le terrain se libère (ancien `rules.md` 7.1).

## Couche méta

- **Script de « L'essaim »** — calibré par le timing (vagues serrées) car l'IA utilise déjà toutes ses copies de basiques ; mesuré : 8,0 % de pertes (joueur Wyrms), 9,9 % (joueur Morts-Vivants), cible 9 % ±3, 100 % de victoires (`npm run balance`, N = 50, seed 1, 2026-10-17). Récompense 80, comme « Les crevasses », à la même distance du boss.
- **XP de survie partagée (réserve de 200)** — remplace +40 par survivant, pour que sur-déployer coûte de la progression (`strategic-depth.md`, 2026-10-15).
- **XP de survie 10 → 40** (avant la réserve partagée) — les basiques atteignaient le niveau 5 en 23 à 31 victoires au lieu de 8 à 12 (`BALANCE-REVIEW.md`, 2026-10-08).
- **Un seul tueur gagne l'XP d'un coup fatal simultané** — des unités qui frappent en rythme (plusieurs Vers déployés ensemble) gagnaient chacune les 110 XP d'Athos (`BALANCE-REVIEW.md`, 2026-10-08).
- **Rejeu : XP du joueur et des individus à 25 %, aucune Spirit Stone** — le rejeu rapportait jusqu'à 9 fois la Spirit Fountain par minute, et une basique passait du niveau 1 au 5 en 10 à 22 min (cible : 30 min au moins) (`BALANCE-REVIEW.md`, 2026-10-08).
- **XP fixe de 100 au tutoriel** — l'armée n'existe pas encore, et le tutoriel garde ainsi moins de facteurs variables (ancien `rules.md` 11.5).
- **Spirit Fountain : 3 / min, capacité 80 + 10 × niveau** — pleine au niveau 1 (90, en 30 min), elle suffit à réinvoquer une armée qui gagne la bataille 1, tout en restant un complément des batailles (`BALANCE-REVIEW.md`, 2026-10-08). Elle remplace l'ancien « filet de sécurité ».
- **Calcul des stats de niveau en entiers** — base × (9 + niveau) / 10, pour éviter les erreurs de virgule (ancien `rules.md` 11.6).
- **Déblocage par les liens de la map** — la map est un réseau : gagner une bataille ouvre ses voisines, plusieurs chemins mènent au boss (« L'essaim », 2026-10-17).
- **Individus `{ id, species, xp }` dès le MVP** — la sauvegarde devait changer de toute façon (monnaie, armée) ; une armée référence des individus, et le modèle accueillera la personnalisation sans migration de sauvegarde (ancienne roadmap-mvp).
- **Coût en PP fixe, quel que soit le niveau** — garder ses unités en vie les rend plus fortes sous le même plafond (ancienne roadmap-mvp).
- **Pas de plafond de possession** (hors [Légendaire]) — la monnaie freine déjà ; le plafond de l'armée (500 PP) et celui du terrain (150 PP) bornent ce qui combat (ancienne roadmap-mvp).
- **Armée de 500 PP, au-dessus des 150 du terrain** — l'armée emporte des réserves, à déployer à mesure que le terrain se libère (ancienne roadmap-mvp).

## Interface

- **Tour de commandement verticale, à gauche du terrain** — une barre sous le terrain le réduirait d'environ un tiers sur un écran 16:9 (≈ 1320 × 770 px au lieu de ≈ 1630 × 950 px en 1920 × 1080) ; la liste défile naturellement à la molette ; attaquer de gauche à droite est une convention plus forte que la place d'une barre d'outils, et l'œil tombe d'abord sur les actions. Coût accepté : le bouton Pause n'est pas en haut à droite (`ui-battle-screen-decisions.md`).
- **Bouton Pause dans la rangée « Ordres »** — tout ce qui agit sur le déroulé de la bataille au même endroit ; il a remplacé l'ancien menu « Commandes » en bas de la tour (`ui-battle-screen-decisions.md`).
- **Signal de pause : terrain désaturé + bouton ▶ qui pulse** — retenu parmi cinq propositions (bandeau « PAUSE », cadre coloré, animations gelées seules…) : signal immédiat qui ne cache rien ; les pauses d'interaction gardent en couleur ce qui est cliquable (`ui-battle-screen-decisions.md`).
- **Pause principale en interrupteur, pas en menu** — laisser aux joueurs plus lents le temps de réfléchir sans stress constant, tout en gardant le terrain et la tour utilisables (`ui-battle-screen-decisions.md`).
- **Abandon disponible en permanence, tutoriel compris** — la v1 est une bêta : toutes les fonctionnalités doivent pouvoir être testées (`ui-battle-screen-decisions.md`).
- **Dégâts de zone montrés par une silhouette, pas par une teinte** — le sprite porte le filtre de désaturation de la pause (preFX), qui ne rend pas la teinte de façon fiable ; une teinte multipliée se voit à peine sur des sprites sombres (playtest, 2026-10-17).

## Stack

- **JavaScript** — démarrer vite, sans système de types à maintenir pour un prototype v1.
- **Phaser 3 plutôt que Phaser 4** — Phaser 4 (maintenu depuis avril 2026) est trop récent pour être bien connu des outils d'IA qui codent le projet ; Phaser 3, figé à 3.90.0, est stable et très documenté. Migration possible plus tard.
- **React + Tailwind + shadcn/ui (8bitcn) pour l'interface** — Phaser se prête mal à l'interface HTML classique (listes, boutons, panneaux) ; des composants génériques évitent de tout recréer en CSS, et le thème 8bitcn colle à l'identité rétro.
- **Vite** — standard pour Phaser, rechargement à chaud rapide, et son plugin React fait cohabiter Phaser et React.
- **Navigation sans librairie de routing** — une session continue dans un seul onglet, sans besoin d'URL par écran.
