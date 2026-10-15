# STRATEGIC-DEPTH.md — Profondeur stratégique des batailles

Pistes pour que le choix des unités, leur placement et le nombre déployé comptent dans une bataille. **Rien ici n'est une règle** : chaque point retenu doit passer par `/enricher` pour entrer dans `rules.md` ou `units.md`, avec ses valeurs, avant d'être codé. Les valeurs citées sont des exemples, pas des décisions.

---

## Le problème

Remplir le terrain d'unités gagne toujours. Les 4 stratégies du bot gagnent 100 % des batailles (`BALANCE-REVIEW.md`) : il n'existe pas de mauvais choix.

Causes :

1. **Les stats favorisent la masse.** Quand deux armées s'affrontent en continu, la force d'une armée croît comme le carré de son nombre d'unités (loi de Lanchester). À budget égal, la rentabilité d'une unité se mesure donc par `DPS × PV / coût²` : environ 3,2 pour le Ver de Lambton, 3,1 pour le New-reborn Skeleton, 0,4 pour Fafnir, 0,3 pour Athos et 0,2 pour les tireurs [Vol]. Les basiques sont 10 à 15 fois plus rentables que le reste.
2. **Rien ne punit le groupement** : toutes les attaques visent une seule cible.
3. **Déployer ne coûte rien pendant la bataille** :
   - le plafond de 150 points se libère aussitôt qu'une unité meurt ;
   - le déploiement met le jeu en pause ;
   - le joueur peut déployer dans toute sa moitié, y compris à côté d'un ennemi qui y est entré ;
   - déployer plus fait tuer plus vite, donc perdre moins ;
   - l'XP de survie (+40) est versée à chaque unité déployée.
4. **L'IA est sous-dimensionnée** : 60 à 100 PP par zone dans les scripts, contre 150 pour le joueur.

---

## Pistes retenues

### 1. Dégâts de zone sur les Légendaires

L'aptitude de chaque Légendaire touche plusieurs cases au lieu d'une seule cible. Par exemple, l'Attaque dévastatrice de Fafnir frappe les 3×3 cases autour de sa cible au lieu de doubler ses dégâts, et le tir d'Athos traverse une ligne de cases.

- **Effet visé** : face à une Légendaire ennemie, une masse de basiques serrés devient une erreur. Côté joueur, la Légendaire trouve un rôle : contrer la masse.
- **À trancher** : la forme et la taille de la zone de chaque Légendaire, les dégâts dans la zone (pleins ou réduits), le sort des alliés dans la zone (épargnés ou touchés), le déclencheur (toutes les N attaques, comme aujourd'hui, ou chaque attaque), l'interaction avec les unités 2×2 et avec l'XP de kill quand plusieurs ennemis meurent dans la même zone (`rules.md` 11.6).

### 2. Zone de déploiement réduite

Le joueur ne déploie plus dans toute sa moitié, mais dans une bande près de la tour de commandement, et/ou jamais à moins de quelques cases d'un ennemi.

- **Effet visé** : le placement devient une décision prise à l'avance, plus une réaction de dernière seconde, et les obstacles entre la zone de déploiement et l'ennemi prennent de l'importance.
- **À trancher** : la largeur de la bande (en colonnes), la distance minimale à un ennemi, la règle applicable aux unités [Vol], le cas des zones où la bande est en partie couverte d'obstacles (le « Fort »), l'endroit où arrive l'armée après une transition entre zones (`rules.md` 7.3), l'affichage de la zone autorisée pendant le glisser-déposer.

### 3. XP de survie partagée

L'XP de survie n'est plus versée en entier à chaque unité déployée qui survit : une réserve d'XP par bataille est partagée entre les individus déployés.

- **Effet visé** : sur-déployer dilue la progression du peuple. Gagner avec peu d'unités devient une bonne décision, en accord avec l'objectif « gagner en perdant le moins possible ».
- **À trancher** :
  - le montant de la réserve (fixe, ou selon la bataille) ;
  - le mode de partage (à parts égales, ou au prorata du coût en PP) ;
  - l'arrondi ;
  - qui reçoit une part : tous les déployés, ou seulement les survivants (si les morts comptent dans le partage sans rien recevoir, les pertes coûtent aussi en XP) ;
  - l'interaction avec le rejeu à 25 % et avec la bataille tutoriel (`rules.md` 11.6).
- **Équilibrage** : la cible « une basique survivante atteint le niveau 5 en 8 à 12 victoires » (`BALANCE-REVIEW.md`) est à remesurer, car elle dépendra du nombre d'unités déployées.

### Mesurer le résultat

Les cibles actuelles de `/balancer` ne portent que sur les pertes moyennes. Il faut y ajouter une **cible d'écart** : dans chaque zone, au moins une des stratégies du bot doit faire nettement moins bien que les autres (beaucoup plus de pertes ou une défaite). On peut aussi ajouter une stratégie « tout-basiques » au bot pour vérifier que la masse ne domine plus. Seuil à trancher.

---

## Autres idées

Non retenues pour l'instant, gardées pour plus tard.

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
