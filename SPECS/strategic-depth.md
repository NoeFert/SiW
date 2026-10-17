# STRATEGIC-DEPTH.md — Profondeur stratégique des batailles

> **Rôle** : les pistes de profondeur stratégique — retenues (devenues des règles) et autres idées. Rien ici n'est à coder tel quel. Index des fichiers : `README.md`.

Pistes pour que le choix des unités, leur placement et le nombre déployé comptent dans une bataille. Les pistes retenues sont désormais des règles (`rules.md`, `units.md`) : en cas d'écart, les règles font foi. Les « Autres idées » n'en sont pas : chacune devrait passer par `/enricher` avant d'être codée, et leurs valeurs sont des exemples.

---

## Le problème

Remplir le terrain d'unités gagne toujours. Les 4 stratégies du bot gagnent 100 % des batailles (`BALANCE-REVIEW.md`) : il n'existe pas de mauvais choix.

Causes :

1. **Les stats favorisent la masse.** Quand deux armées s'affrontent en continu, la force d'une armée croît comme le carré de son nombre d'unités (loi de Lanchester). À budget égal, la rentabilité d'une unité se mesure donc par `DPS × PV / coût²` : environ 4,0 pour le Ver de Lambton, 3,9 pour le New-reborn Skeleton, 0,4 pour Fafnir, 0,3 pour Athos et 0,2 pour les tireurs [Vol] (PV du 2026-10-17). Les basiques sont 10 à 20 fois plus rentables que le reste.
2. **Rien ne punit le groupement** : toutes les attaques visent une seule cible.
3. **Déployer ne coûte rien pendant la bataille** :
   - le plafond de 150 points se libère aussitôt qu'une unité meurt ;
   - le déploiement met le jeu en pause ;
   - le joueur peut déployer dans toute sa moitié, y compris à côté d'un ennemi qui y est entré ;
   - déployer plus fait tuer plus vite, donc perdre moins ;
   - l'XP de survie (+40) est versée à chaque unité déployée.
4. **L'IA est sous-dimensionnée** : 60 à 100 PP par zone dans les scripts, contre 150 pour le joueur.
5. **Le [Légendaire] est trop puissant** (constat de playtest, 2026-10-17) : le déployer reste toujours le bon choix. Il faut en limiter l'utilisation ; le moyen n'est pas tranché (pistes dans « Autres idées »).
6. **Les [Vol] dominent les unités au sol** (constat de playtest, 2026-10-17) : les basiques meurent avant d'atteindre les tireurs [Vol]. `BALANCE-REVIEW.md` le relevait déjà : une armée de basiques seule perd contre les [Vol] adverses.

---

## Pistes retenues (intégrées le 2026-10-15)

1. **Dégâts de zone sur les Légendaires** (`rules.md` 4.6, `units.md`) : chaque attaque de Fafnir et d'Athos touche aussi les ennemis à 1 case de la cible, pour 50 % des dégâts de l'attaque. La zone suit l'Attaque dévastatrice ; un ennemi tué par la zone compte comme achevé (XP de kill, Soif de sang) ; la Frappe paralysante ne touche que la cible ; pas de zone sur la dernière attaque gratuite portée à une unité qui fuit.
2. **Zone de déploiement réduite** (`rules.md` 2) : colonnes 0 à 5, le premier quart du terrain, sans distance minimale à un ennemi.
3. **XP de survie partagée** (`rules.md` 11.6) : réserve de 200 XP par bataille (provisoire), divisée par le nombre d'individus déployés (morts compris) et versée aux survivants.
4. **PV rééquilibrés** (2026-10-17, problème 6 ; `units.md`) : Amphiptère et Necromant Initiate passent de 18 à 14 PV, le Ver de Lambton de 40 à 50, le New-reborn Skeleton de 22 à 28 (basiques +25 %, ratio Ver / Squelette gardé). Effet contraire au problème 1 : la rentabilité des basiques monte encore (3,2 → 4,0 pour le Ver).

**Reste à faire** : mesurer avec `/balancer`, PV du 2026-10-17 compris. Les dégâts de zone renforcent aussi les Légendaires de l'IA (bataille tutoriel à t=35 s, « Le fort ») : les pertes visées (`rules.md` 11.7) et la cible « niveau 5 en 8 à 12 victoires » (`BALANCE-REVIEW.md`) sont à revérifier.

### Mesurer le résultat

Les cibles actuelles de `/balancer` ne portent que sur les pertes moyennes. Il faut y ajouter une **cible d'écart** : dans chaque zone, au moins une des stratégies du bot doit faire nettement moins bien que les autres (beaucoup plus de pertes ou une défaite). On peut aussi ajouter une stratégie « tout-basiques » au bot pour vérifier que la masse ne domine plus. Seuil à trancher.

---

## Autres idées

Non retenues pour l'instant, gardées pour plus tard.

**Limiter le [Légendaire]** (problème 5)
- Fatigue entre batailles : après une bataille où il a été déployé, il est indisponible pour la suivante.
- Arrivée retardée : déployable seulement après un délai de bataille (par exemple 30 s).
- Un seul déploiement par bataille : une fois déployé, il ne revient plus, même après une fuite (fin du cycle fuite → redéploiement).
- Coût en PP plus élevé (par exemple 110 → 130) : moins de place pour le reste sous le plafond de 150.

**Contre le groupement**
- Malus quand une unité est entourée d'alliés (piétinement, panique). Moins lisible que les dégâts de zone.

**Coût du déploiement**
- Points rendus avec du retard : les points d'une unité morte reviennent après quelques secondes au lieu d'instantanément.
- Jauge de déploiement qui se remplit avec le temps (comme l'élixir de Clash Royale) à la place du plafond fixe. C'est le levier le plus fort pour faire compter le moment d'un déploiement, mais il remplace une règle centrale.

**Choix des unités**
- Triangle de contres léger par bonus de dégâts : tireurs > Légendaires, basiques > tireurs, Légendaire > basiques (avec la piste 1). Le balancer a déjà repéré un contre involontaire : une armée de basiques seule perd contre les [Vol] adverses.
- Armée ennemie montrée avant la bataille (« Tes éclaireurs ont repéré… ») pour que la composition de l'armée de 500 points devienne un vrai choix.
- Scripts d'IA qui posent une question par zone : une zone pleine de [Vol] contre le tout-basiques, une Légendaire derrière un goulot contre la masse.

**Placement et terrain**
- Ligne de vue pour les tirs (déjà prévue hors v1, `rules.md` 4.5) : les rochers protègent des tirs.
- Types de terrain qui jouent sur différentes règles : l'eau bloque le sol mais pas les tirs, la forêt bloque les tirs mais pas la marche, une hauteur donne +1 de portée.
- Goulots qui neutralisent le surnombre au corps-à-corps (comme « Le mur »), surtout s'ils sont combinés aux dégâts de zone.
- Ennemis qui ciblent les arrières (par exemple des [Vol] qui visent le tireur le plus fragile) : la protection des tireurs devient une question de placement.

**Récompenser l'efficacité**
- Objectifs par bataille : « Gagner en déployant au plus 80 PP », « Sans perdre de Ver ». Ils rendent les mauvais choix visibles sur l'écran de fin.
