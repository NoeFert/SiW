# BALANCE-REVIEW.md — Revue d'équilibrage

Produit par `/balancer`. À relancer après tout changement de valeurs, de scripts de l'IA ou de batailles (nouvelle bataille, boss, nouvelle map). La simulation ne remplace pas le playtest : le bot joueur est passif et ne donne qu'une **borne basse** de ce qu'obtient un humain.

Le clickbait (premier rendu) est hors champ : c'est un projet passé, conservé dans un autre dépôt, sans lien avec les batailles du MVP. Les noms de fichiers cités plus bas sont ceux d'avant le refactor d'octobre 2026 (voir `SPECS/refactor-roadmap.md`).

---

## Session du 2026-10-08

### Outil

`npm run balance -- [options]` (`src/debug/balance/`) : batailles jouées par le moteur de `src/logic/` sans Phaser ni localStorage, pas fixe de 0,05 s, bot passif à 4 stratégies (`basics`, `flyers`, `mixed`, `legendaryFirst`), RNG mulberry32 (la bataille i utilise le seed `seed + i`). Options : `--faction`, `--battle`, `--strategy`, `--level`, `--army`, `--n`, `--seed`, `--replay`, `--player-xp`, `--json` (détail en tête de `index.js`).

Mesures de cette session : **seed 1, N = 8 ou 10** selon les tableaux (sessions courtes). Les scripts de `rules.md` 11.7 n'étant pas encore dans le code, ils ont été injectés en mémoire pour les simulations (scripts de vérification hors du dépôt).

---

## Cibles

| Axe | Cible |
|---|---|
| 1. Factions | Même bataille, même stratégie : taux de victoire à ±5 points ; PP perdus, Spirit Stones nettes et **niveaux gagnés par bataille** à ±15 %. L'XP *par survivant* n'est pas une cible (voir constat 1). |
| 2. Difficulté | Bot passif, armée de départ niveau 1 : victoire ≥ 90 % ; pertes moyennes **5 % de l'armée au départ de la map → environ 30 % au boss**, en montant à mesure qu'on approche du boss (≈ +4 points par pas sur le chemin le plus court). Batailles 1 / 2 / 3 (à 6 / 5 / 4 pas du boss) : **5 / 9 / 13 %**. |
| 3. Économie | À la première victoire, la récompense de victoire (seule) rembourse **150 à 200 %** du prix de réinvocation des pertes moyennes. |
| 4. XP | Une unité basique déployée qui survit atteint le **niveau 5 en 8 à 12 victoires** (vers le boss de la map 1). |
| 5. Fountain | Un joueur qui a tout perdu (0 unité, 0 Spirit Stone) peut regagner la bataille 1 après **≤ 30 min** d'attente. |
| 6. Farming | Rejouer la bataille la plus rentable rapporte au plus **2× la Fountain** par minute réelle, en Spirit Stones nettes (pertes déduites). **XP** : une unité basique ne passe pas du niveau 1 au niveau 5 en moins de **30 min de rejeu**. |
| 2 bis. Armée vétérane | L'armée attendue à chaque bataille (niveau projeté : ≈ 1 / 2 / 3 aux batailles 1 / 2 / 3) perd au moins **50 % des pertes visées** par la table de `rules.md` 11.7. |
| 5 bis. Part de la Fountain | Pour un joueur actif qui progresse sur la map, la Fountain représente au plus **25 %** de ses Spirit Stones (sessions continues et espacées). |

---

## Mesures clés

### Factions — scripts d'origine, niveau 1, N = 10 (stratégie `mixed`)

Réserve d'XP de kill (somme des PP du script adverse) avant correction :

| Bataille | Joueur Wyrms | Joueur Morts-Vivants |
|---|---|---|
| 1 | 122 | 95 |
| 2 | 122 | 60 |
| 3 | 269 | 170 |

| | Wyrms | Morts-Vivants avant | Morts-Vivants, zone 2 à 65 PP |
|---|---|---|---|
| XP par survivant (b1 / b2 / b3) | 36,8 / 42,3 / 70,5 | 27,1 / 18,9 / 34,8 | 25,9 / 27,4 / 43,5 |
| Niveaux gagnés par bataille | 3,0 / 3,5 / 4,3 | 2,9 / 0,9 / 2,9 | 2,7 / 3,2 / 4,1 |

### Difficulté — renfort des scripts (unités non légendaires ×k), niveau 1, `mixed`, N = 8

| Renfort | Pertes moyennes | Victoires |
|---|---|---|
| ×1 | ≈ 3 % | 100 % |
| ×1,5 | ≈ 7 % | 100 % |
| ×2 | ≈ 17 % | 100 % |
| ×3 | 30 à 70 % | 75 à 100 % |
| ×4 | 70 à 100 % | 0 à 63 % (falaise) |

Scripts retenus (`rules.md` 11.7), moyenne sur les 4 stratégies et les 2 factions, N = 8 :

| Bataille | Renfort | Victoires | Pertes moyennes | Cible |
|---|---|---|---|---|
| 1 — La passe | ×1,25 | 100 % | 6,6 % | 5 % |
| 2 — Les crevasses | ×1,5 | 100 % | 8,8 % | 9 % |
| 3 — La citadelle | ×1,5 | 100 % | 15,4 % | 13 % |

### Économie — première victoire, scripts de 11.7

| Bataille | Récompense | Pertes (≈ prix de réinvocation, k = 1) | Couverture (récompense seule) | Avec récompense de niveau moyenne |
|---|---|---|---|---|
| 1 | 60 | ≈ 28 | 214 % | 282 % |
| 2 | 80 | ≈ 37 | 216 % | 268 % |
| 3 | 100 | ≈ 65 | 154 % | 183 % |

Récompense de niveau moyenne : ≈ 190 XP par victoire, niveau N à 500 × N XP pour 50 × N Spirit Stones → **≈ +19 Spirit Stones par victoire, quel que soit le niveau**.

### XP — par espèce, scripts de 11.7, niveau 1, N = 8 (avec XP de survie à 10)

| | Basique | Tireur [Vol] |
|---|---|---|
| Wyrms | ≈ 22 / victoire (≈ 23 victoires jusqu'au niveau 5) | ≈ 85 |
| Morts-Vivants | ≈ 16 (≈ 31 victoires) | ≈ 66 |

Avec l'XP de survie à 40 (décision ci-dessous) : basiques ≈ 52 (Wyrms, ≈ 10 victoires) et ≈ 46 (Morts-Vivants, ≈ 11 victoires) — calcul exact, la survie n'influant pas sur la bataille.

### Fountain — armée minimale contre la bataille 1 (scripts de 11.7, `mixed`, N = 8)

| Faction | Armée | Prix | Victoires |
|---|---|---|---|
| Wyrms | 5 Vers | 50 | 0 % |
| Wyrms | 7 Vers | 70 | 38 % |
| Wyrms | 4 Vers + 2 Amphiptères | 90 | 100 % |
| Morts-Vivants | 16 Squelettes | 96 | 0 % |
| Morts-Vivants | 20 Squelettes | 120 | 38 % |
| Morts-Vivants | 6 Squelettes + 2 Nécromants | 86 | 88 % |

### Farming — rejeu (25 %, valeurs d'avant correction), `mixed`, N = 8

Hypothèse : ≈ 33 s réelles d'écrans et de transition par bataille ; récompense de niveau moyenne de 19 par victoire.

| Armée | Bataille 1 | Bataille 2 | Bataille 3 |
|---|---|---|---|
| Wyrms niveau 1 | 14,3 / min (4,8×) | 11,0 (3,7×) | 8,2 (2,7×) |
| Wyrms niveau 3 | 26,7 / min (8,9×) | 26,6 (8,9×) | 11,5 (3,8×) |
| Morts-Vivants niveau 3 | 23,1 / min (7,7×) | 21,0 (7,0×) | 13,3 (4,4×) |

(× = multiple de la Fountain à 3 / min.)

---

## Constats et décisions

1. **Factions — réserve d'XP de kill déséquilibrée** (scripts d'origine : 122 / 122 / 269 contre 95 / 60 / 170). Corrigé par les scripts propres à « Partir en guerre » (constat 2) : réserves égalisées dans toutes les zones sauf le Fort. L'écart restant d'XP *par survivant* (30 à 40 % plus bas côté Morts-Vivants, armée plus nombreuse) est **accepté comme identité de faction** : l'axe se juge sur les niveaux gagnés (≈ −10 %, dans la cible). → `SPECS/rules.md` 11.7.
2. **Difficulté — beaucoup trop facile** (100 % de victoires, 2 à 5 % de pertes) ; la cible initiale (victoires 60-80 % avec 20 % de pertes) était incohérente pour un bot qui gagne jusqu'à une falaise, et la bataille 3 n'est qu'au tiers du chemin vers le boss. Décision : la difficulté se lit dans les pertes et monte vers le boss ; **scripts propres à « Partir en guerre »**, renfort ×1,25 / ×1,5 / ×1,5. → `SPECS/rules.md` 11.7, `SPECS/roadmap-mvp.md`.
3. **Économie — léger surplus** sur les batailles 1 et 2 (214-216 %, dans le bruit de mesure). Décision : **ne rien changer** (60 / 80 / 100). Les récompenses de niveau (≈ +19 par victoire) sont un bonus de progression voulu.
4. **XP — basiques 2 à 3 fois trop lentes** (≈ 23 à 31 victoires jusqu'au niveau 5). Décision (valeur tranchée modifiée sur décision explicite) : **XP de survie 10 → 40**. → `SPECS/rules.md` 11.6, `SPECS/roadmap-mvp.md`.
5. **Fountain — retour après déroute totale ≈ 90 min** (il faut ≈ 90 Spirit Stones, capacité 30 au niveau 1). Décision : **3 Spirit Stones / min, capacité 60 + 30 × niveau** (90 au niveau 1). → `SPECS/rules.md` 10 et 11.8, `SPECS/roadmap-mvp.md`.
6. **Farming — rejeu jusqu'à ≈ 9× la Fountain** avec une armée vétérane, dont plus de la moitié en récompenses de niveau (XP du joueur non réduite au rejeu). Décision (valeur tranchée modifiée sur décision explicite) : **rejeu sans Spirit Stones, XP du joueur à 25 %** ; l'XP des individus n'est pas réduite. Vérification par le calcul : ≈ 3,7 / min, 1,2× la Fountain. → `SPECS/rules.md` 10, 11.5 et 11.7, `SPECS/roadmap-mvp.md`, `SPECS/technical.md`.

### Session 2 (2026-10-08) — trois risques avant de coder

Scripts de `rules.md` 11.7 injectés en mémoire, seed 1, N = 8, XP de survie à 40 (ajoutée par le calcul), ≈ 33 s d'écrans par bataille (hypothèse).

7. **Farming d'XP — une basique atteint le niveau 5 en 10 à 22 min de rejeu** (jusqu'à 48 XP / min, Morts-Vivants, bataille 3, `basics`), pour une cible de ≥ 30 min ; 40 des ≈ 52 XP par rejeu viennent de la survie. Décision (revient sur « XP des individus non réduite au rejeu », décision explicite) : **XP des individus à 25 % au rejeu**. Vérification par le calcul : ≈ 12 XP / min, ≈ 42 min. → `SPECS/rules.md` 11.6 et 11.7, `SPECS/roadmap-mvp.md`.
8. **Armée vétérane — pas de déséquilibre** sur les batailles 1 à 3. Pertes en victoire (moyenne des 4 stratégies, Wyrms / Morts-Vivants) : bataille 2 niveau 2 : 5,6 / 11,3 % (plancher 4,5 %) ; bataille 3 niveau 3 : 11,2 / 11,0 % (plancher 6,5 %) ; bataille 3 niveau 5 : 8,6 / 8,8 %. Écart calcul / simulation : l'efficacité calculée (≈ ×1,44 au niveau 3) ne fait presque pas baisser les pertes, qui viennent surtout des tireurs fragiles (18 PV : 12 à 21 % de pertes en stratégie `flyers` même au niveau 5). Aucune modification.
9. **Part de la Fountain — ≈ 10 % en session continue, mais 26 à 38 % en sessions espacées** (≈ 10 min de jeu par jour, Fountain pleine à chaque retour : 90 à 150 contre ≈ 250 de batailles ; hypothèse de 3 à 4 min par victoire de progression). Décision : **capacité 60 + 30 × N → 80 + 10 × N** (90 au niveau 1 gardé pour le filet de 30 min). Vérification par le calcul : 26 % au niveau 1, 31 % au niveau 3, accepté comme « presque dans la cible ». → `SPECS/rules.md` 10 et 11.8, `SPECS/roadmap-mvp.md`.

### Session 3 (2026-10-08) — après la mise à jour du code

10. **XP de kill multipliée par les coups fatals simultanés** (signalé en playtest : des Vers passaient du niveau 1 au niveau 3 dès la bataille 01). Bataille 01, Wyrms, 12 batailles : jusqu'à **611 XP de kill distribuée pour 159 dans le script** (jusqu'à 5 Vers à 150 XP) — des unités de même vitesse d'attaque déployées ensemble frappent en rythme et achèvent Athos au même tick, chacune gagnant 110. Décision (règle tranchée modifiée sur décision explicite) : **un seul tueur gagne l'XP** (le plus de dégâts à cet instant, puis le premier déployé ; un tueur qui meurt au même instant est écarté) ; les aptitudes au coup fatal restent attribuées à chacun (4.1). Vérification par simulation : XP de kill distribuée = 159 dans les 12 batailles, au plus un Ver niveau 3. → `SPECS/rules.md` 11.6, `src/logic/combat.js`.

**Conformité des scripts de 11.7, sur les vraies données** (N = 50, seed 1, niveau 1, avant la correction 10 — sans effet sur les pertes) : pertes en victoire, moyenne des 4 stratégies, Wyrms / Morts-Vivants — bataille 1 : 5,6 / 7,3 % (cible 5 ±3) ; bataille 2 : 7,1 / 10,9 % (cible 9 ±3) ; bataille 3 : 15,8 / 14,7 % (cible 13 ±3). Victoires : 100 % partout. **Les trois batailles sont conformes.**

### Code à mettre à jour (boucle de travail habituelle)

**Fait le 2026-10-08** (412 → 414 tests Jest au vert, build OK) : tous les points ci-dessous, plus la correction 10.


- `src/data/battleScript.js` + `src/data/battles.js` (`WAR_ZONES`) : scripts propres à « Partir en guerre » (`rules.md` 11.7), au lieu de ceux du clickbait.
- `src/logic/levels.js` : `SURVIVAL_XP` 10 → 40 ; au rejeu, XP du joueur (`victoryPlayerXp` / `resolveVictory`) et XP des individus (`individualXpGains`) à 25 %, arrondies à l'entier inférieur.
- `src/logic/war.js` : `REPLAY_REWARD_PERCENT` 25 → 0.
- `src/logic/fountain.js` : 3 par minute, capacité 80 + 10 × niveau. Attention : `harvestFountain` doit avancer l'heure de dernière récolte de `collected / 3` minutes (minute entamée conservée) ; quand la Fountain est pleine (capacité pas toujours multiple de 3, ex : 100), la production repart de la récolte.
- Panneau de récompenses de `WarScreen` : 0 Spirit Stone et « 25–50 » XP au rejeu (`technical.md`).
- Tests Jest associés.

---

## Trous dans les specs (à traiter avec `/enricher`)

- ~~**Difficulté selon la distance au boss**~~ : comblé par `/enricher` (2026-10-08), `rules.md` 11.7. Règle de conception : table de pertes visées par distance (1 % à 7 pas → 30 % au boss), ±3 points, mesurée en victoire, 4 stratégies, par faction, N = 50 ; victoire du bot ≥ 90 % (boss ≥ 60 %).
- **Adaptation de la difficulté à l'armée vétérane** : les batailles 1 à 3 restent dans la cible (constat 8), mais près du boss l'armée sera de niveau 4 à 5 face à des scripts calibrés pour le niveau 1. Impossible à mesurer tant que ces scripts n'existent pas. Aucune règle pour l'instant.
- **Bataille de boss** : contenu, script et récompense non définis.

---

## Points ouverts

- **Fort (bataille 3, zone 2)** : réserve d'XP de kill 150 PP côté Wyrms contre 239 côté Morts-Vivants (pertes comparables). À rééquilibrer avec les scripts définitifs.
- **Armée sans tireurs** : une armée de basiques seule perd contre les [Vol] adverses, même nombreuse (16 Squelettes : 0 % contre la bataille 1). Après une déroute totale, le joueur doit racheter des tireurs. À surveiller en playtest.
- **Vitesse d'XP des basiques à remesurer** : les mesures de l'axe XP (≈ 10 à 11 victoires jusqu'au niveau 5) comptaient les coups fatals simultanés en double ; avec un seul tueur, les basiques montent un peu moins vite. À remesurer (`npm run balance`, XP par espèce).
- **XP de rejeu des tireurs** : avec la réduction à 25 %, ≈ 22 XP / min, niveau 5 en ≈ 23 min de rejeu, sous les 30 min (la cible ne porte que sur les basiques).
- **Hypothèses de temps non mesurées** : ≈ 33 s d'écrans par bataille, 3 à 4 min par victoire de progression, 10 min de jeu par jour en sessions espacées. À confirmer en playtest.
- **Légendaire** : n'a gagné aucune XP dans les simulations (bot passif) ; à mesurer en playtest.
- Valeurs encore **provisoires** : somme de départ (0), k (1), multiplicateur du Légendaire (×1), récompenses (50 ; 60 / 80 / 100 ; rien au rejeu), Spirit Fountain (3 / min, 80 + 10 × niveau), récompense de niveau (50 × N), scripts de « Partir en guerre ».
- Mesures faites avec N = 8 à 10 : à reconfirmer avec N = 50 une fois les scripts dans le code (`npm run balance -- --n 50`).
