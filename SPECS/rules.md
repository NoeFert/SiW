# RULES.md — Scope v1

> **Rôle** : le quoi — les règles du scope v1, chiffrées et testables : moteur de bataille (sections 1 à 9), couche méta (section 11). Le pourquoi des valeurs est dans `DECISIONS.md`, les stats des unités dans `units.md`. Index des fichiers : `README.md`.

Chaque section donne la règle de base, puis ses valeurs, puis ses **cas limites**.

---

## 1. Terrain

- Grille de **24 cases de large × 14 de haut**. Deux unités ne partagent jamais une case.
- Certaines cases sont des **obstacles** infranchissables au sol. Le plan de chaque zone est dans le fichier de sa bataille (`src/data/battles/`) ; les zones sont décrites en 7.3.
- **Le champ** (bataille tutoriel) : 16 obstacles — 12 d'une case et 4 blocs 2×2 —, dispersés, sans couloir fermé ni cul-de-sac, symétriques de part et d'autre de la ligne médiane.

## 2. Déploiement

Le joueur pose ses unités par glisser-déposer dans sa **zone de déploiement**. Le temps s'arrête dès le début du geste (pause d'interaction, 5.2).

- **Camps** : le joueur a la moitié gauche (colonnes 0 à 11) et attaque vers la droite ; l'IA a la moitié droite et entre par le bord droit (7.2).
- **Zone de déploiement du joueur** : les **colonnes 0 à 5**, sur des cases libres (ni obstacle, ni unité). Une unité 2×2 doit y avoir ses 4 cases. Les unités [Vol] suivent la même règle.
- **Plafond vivant** : au plus **150 points de présence (PP)** sur le terrain par camp. Les points d'une unité se libèrent dès qu'elle meurt ou quitte le terrain en fuyant ; le joueur peut alors redéployer.
- **[Légendaire]** : un seul à la fois sur le terrain par camp, quel que soit le plafond.
- **Copies** : chaque espèce a un nombre de copies fixe pour la bataille (toutes ses phases).

| Camp | Copies |
|---|---|
| Joueur, bataille tutoriel | tous ses individus (11.1) |
| Joueur, « Partir en guerre » | les individus de son armée (11.2), chacun avec les stats de son niveau (11.6) |
| IA | les copies de départ de `units.md` |

**Cas limites**
- Pas de distance minimale à un ennemi : une case libre de la zone reste valide au contact d'un ennemi.
- Les colonnes 6 à 11 ne servent pas au déploiement, mais les unités du joueur s'y déplacent librement.
- Une unité **tuée** perd sa copie pour le reste de la bataille (4.4) — y compris tuée à l'instant même où elle atteint le bord en fuyant.
- Une unité qui **fuit** revient en réserve avec ses PV réduits et reste redéployable.

## 3. Mouvement

Sans ordre, une unité va vers l'**ennemi le plus proche**, en contournant obstacles et unités. Sans ennemi sur le terrain, elle reste sur place.

- Déplacement en **8 directions**, à la vitesse de l'unité (`units.md`).
- **Distances** (portée, ennemi le plus proche, trajet) : en cases, une diagonale valant une case. Pour une unité 2×2, entre les **cases les plus proches** des deux unités.
- **Unité 2×2** : un bloc rigide ; un pas n'est valide que si ses 4 cases d'arrivée sont libres.
- **Unité [Vol]** : ignore les obstacles du terrain (pas les unités) et peut s'arrêter au-dessus d'un obstacle.

**Cas limites**
- **Coin d'obstacle** : un pas en diagonale est interdit si l'une des deux cases du coin traversé est un obstacle. Les unités, elles, ne bloquent jamais une diagonale. Les [Vol] ne sont pas concernées.
- **Égalité de distance** : l'ennemi qui a le moins de PV actuels, puis le premier déployé.
- **Ennemi inatteignable** (unité au sol) : on ne compte d'abord que les ennemis atteignables par le terrain — une case adjacente libre pour le corps-à-corps, une case d'où tirer pour un tireur. Les unités, qui bougent, ne rendent jamais un ennemi inatteignable. S'il ne reste que des ennemis inatteignables, l'unité s'approche au plus près du plus proche.
- **Passage trop étroit** pour une unité 2×2 : elle attend ou contourne, comme devant un obstacle.

## 4. Combat

### 4.1 Déroulement dans le temps
Le temps est **continu**. Chaque unité attaque à son propre rythme (vitesse d'attaque, `units.md`). Toutes les attaques d'un même instant sont **calculées, puis appliquées ensemble** : aucune unité n'a l'avantage de l'ordre.

**Cas limites**
- Une unité qui arrive au contact ou à portée porte son premier coup après un intervalle complet. Une unité qui attaquait déjà garde son rythme en changeant de cible, ou en passant du tir au corps-à-corps.
- Deux unités qui s'entretuent au même instant meurent toutes les deux.
- **Coup fatal simultané** : si plusieurs attaques du même instant tuent une cible, chaque attaquant compte comme ayant porté le coup fatal pour les aptitudes (Soif de sang), sauf un attaquant qui meurt lui-même à cet instant. Pour l'XP, un seul tueur : 11.6.
- Un effet qui vise « les prochaines attaques » d'une cible (Frappe paralysante) ne touche jamais une attaque de cette cible portée au même instant.

### 4.2 Engagement au corps-à-corps
Une unité au corps-à-corps rejoint une case adjacente libre de sa cible et frappe. **Engagée**, elle garde sa cible jusqu'à sa mort (sauf ordre Attaquer, 5).

**Cas limites**
- Un second allié sur la même cible contourne le premier pour trouver une autre case adjacente libre.
- Plus de case adjacente libre : l'unité se redirige vers le prochain ennemi le plus proche ; elle n'attend une place que s'il n'y a aucun autre ennemi.
- Une unité qui attend une place (non engagée) peut se rediriger vers un ennemi qui se rapproche.

### 4.3 Adjacence des unités 2×2
Une unité 2×2 est adjacente à une cible dès qu'**une seule** de ses cases touche une case adjacente à la cible.

### 4.4 Mort
À 0 PV, une unité meurt et quitte le terrain. L'individu est perdu pour toujours (11.1) ; le joueur peut invoquer un **nouvel** individu de l'espèce, ou réinvoquer son [Légendaire] (11.4).

### 4.5 Attaque à distance
Un tireur attaque une cible dans sa **portée** (`units.md`), jamais une cible adjacente (portée minimale : 2 cases). Les dégâts sont appliqués à l'instant du tir, avec la résolution de 4.1 ; le projectile n'est qu'un visuel. **Pas de ligne de vue** : obstacles et unités n'arrêtent pas un tir.

| Type | Exemple | Pendant qu'il tire | Si la cible se colle à lui |
|---|---|---|---|
| Purement à distance | Amphiptère, Necromant Initiate | reste immobile tant que la cible est à portée | recule vers la case hors contact la plus proche |
| Tire en avançant | Athos | avance vers la cible, s'arrête à 2 cases | recule, comme ci-dessus |
| Hybride | Fafnir | avance vers la cible sans s'arrêter de tirer | passe au corps-à-corps (4.2) |

**Cas limites**
- Un recul bloqué (bord, obstacle, unité) contourne. Un tireur encerclé, sans case hors contact atteignable, reste sur place **sans tirer** jusqu'à ce qu'un passage se libère.

### 4.6 Dégâts de zone des [Légendaire]
Chaque attaque d'un [Légendaire] (Fafnir, Athos, des deux camps), à distance comme au corps-à-corps, touche sa cible **et tous les autres ennemis à 1 case** de la cible — le carré 3×3 autour d'une cible d'une case. Ces ennemis subissent **50 %** des dégâts de l'attaque (provisoire, section 10), arrondis au plus proche (0,5 au-dessus). Valeurs par unité : `units.md`.

**Cas limites**
- La base est le dégât de l'attaque, niveau (11.6) et Attaque dévastatrice compris, même si la cible avait moins de PV.
- Jamais les alliés. Les unités [Vol] et les unités en fuite sont touchées. Les positions sont celles de l'instant de l'attaque.
- Les dégâts de zone sont appliqués au même instant que l'attaque (4.1) et comptent comme dégâts infligés pour départager les tueurs (11.6).
- Un ennemi tué par la zone est achevé par le [Légendaire] : XP de kill (11.6) et Soif de sang (40 PV par ennemi tué, cible ou zone).
- Une attaque et sa zone comptent **une fois** dans les compteurs d'aptitude (6.1). La Frappe paralysante ne touche que la cible. Une attaque annulée n'a pas de zone. La dernière attaque gratuite sur une unité qui fuit (5) n'a pas de zone.

## 5. Ordres du joueur

Le joueur peut donner un **ordre** à une de ses unités sur le terrain. Les ordres sont optionnels : sans ordre, l'unité agit seule (3, 4). Une unité n'a qu'un ordre à la fois : **le dernier donné remplace le précédent**.

| Ordre | Cible | Pendant l'ordre | Fin |
|---|---|---|---|
| **Aller** | une case | l'unité ne combat pas, ni ne riposte, même frappée | arrivée sur la case, ou au plus près si elle est inatteignable (obstacle, case occupée, bloc 2×2 qui déborderait du terrain) |
| **Attaquer** | un ennemi | l'unité quitte son engagement (4.2) ; un tireur avance jusqu'à la portée puis tire (4.5) | cible morte ou sortie du terrain, ou nouvel ordre |
| **Fuir** | — | l'unité va vers la case de bord atteignable la plus proche | sortie au bord : retour en réserve, sans récupérer ses PV |

À la fin d'un ordre, l'unité reprend son comportement autonome.

- **Donner un ordre** met le jeu en pause d'interaction (5.2) dès le clic sur l'ordre ; la bataille reprend quand l'ordre est donné ou annulé, sauf pendant la pause principale. Déroulé des clics et annulation : `ui-battle-screen-decisions.md` 2.3. Un ordre annulé n'est pas émis et ne consomme pas le cooldown de la fuite.

**Cas limites — fuite**
- La fuite est toujours possible, même engagée. Chaque ennemi alors engagé sur l'unité porte **une dernière attaque**, une seule fois, au début de la fuite. Elle est gratuite : elle ne change pas le rythme de l'ennemi (4.1) et ne compte pas pour les aptitudes (6.1).
- Une unité déjà sur un bord quitte le terrain aussitôt.
- **Aucun bord atteignable** (unité encerclée, entrée du « Fort » bouchée) : l'unité reste en fuite sur place et **riposte au corps-à-corps** contre un ennemi adjacent, à son rythme ; un tireur pur ne riposte pas. Elle reprend sa fuite dès qu'un chemin se libère.
- Les ennemis peuvent poursuivre et frapper l'unité qui fuit.

### 5.1 Cooldown de la fuite
**5 secondes** de temps de bataille entre deux ordres Fuir, toutes unités confondues ; Fuir est impossible pendant ce délai. Le cooldown est gelé pendant les pauses. Aller et Attaquer n'ont pas de cooldown. Dans le MVP, le cooldown ne dépend pas du niveau du joueur (réduction : Suite, `roadmap-mvp.md`).

### 5.2 Pauses
Le temps de bataille ne s'écoule que si **aucune** pause n'est active. Pendant une pause, tout est gelé : timers d'attaque, mouvements, cooldown de la fuite, script de l'IA.

| Pause | Déclenchement | Fin |
|---|---|---|
| **Principale** | le joueur (⏸ / ▶, barre Espace) | le joueur |
| **D'interaction** | glisser-déposer de déploiement (2), choix d'un ordre (5), confirmation d'abandon (8.2) | fin ou annulation du geste |
| **Gel du tutoriel** | étape du tutoriel qui demande ou explique (`technical.md` 5.5) ; seule l'action demandée est possible | action faite |

- Pendant la pause principale, le joueur peut déployer (plusieurs fois, sous le plafond, 2) et donner des ordres ; le jeu reste en pause après.

**Cas limites**
- Le cooldown étant gelé, une seule fuite est possible par pause principale ; Aller et Attaquer restent illimités.
- La confirmation d'abandon annule un ordre en cours de sélection.

## 6. Aptitudes

Une **aptitude** est un pouvoir propre à certaines espèces (`units.md`). Deux types :

### 6.1 Type automatique
Se déclenche seule, selon sa condition (ex : toutes les N attaques, au coup fatal), sans action du joueur. Exemples v1 : Attaque dévastatrice de Fafnir, Frappe paralysante et Soif de sang d'Athos.

**Cas limites**
- Les compteurs « toutes les N attaques » ne comptent que les attaques réellement portées : ni une attaque annulée (Frappe paralysante), ni la dernière attaque gratuite sur une unité qui fuit (5).

### 6.2 Type à usage limité
Activée par le joueur, depuis une icône dédiée, un nombre limité de fois par bataille. Aucune unité du roster v1 n'en a.

## 7. IA adverse

L'IA ne gère aucune ressource : elle suit un **script**. Pour chaque phase, le script dit quelle espèce entre à quel instant (en secondes depuis le début de la phase) ; la case est choisie au moment de l'entrée (7.2). Une fois entrée, une unité de l'IA se comporte comme une unité du joueur sans ordre.

- **Plafond** : le même plafond vivant de 150 PP que le joueur (2). Une entrée qui le dépasserait **attend** que des points se libèrent (l'IA ne fait jamais fuir), et les entrées suivantes attendent derrière elle. Le coût total d'un script n'est donc pas un budget.
- **Copies** : les copies de départ de sa faction (`units.md`), pour toute la bataille.

### 7.1 Script de la bataille tutoriel (provisoire, section 10)

| Instant | IA Wyrms | IA Morts-Vivants |
|---|---|---|
| 0 s | 1 Ver de Lambton | 1 New-reborn Skeleton |
| 8 s | 1 Amphiptère | 1 Necromant Initiate |
| 20 s | 1 Ver de Lambton | 1 New-reborn Skeleton |
| 28 s | 2 Vers de Lambton | 2 New-reborn Skeletons |
| 35 s | Fafnir | Athos |

À 35 s, le [Légendaire] (110 PP) attend sous le plafond tant que les unités de l'IA encore sur le terrain dépassent 40 PP.

### 7.2 Entrée par le bord droit
Les unités de l'IA **entrent par le bord droit**, jamais au milieu du terrain. Leur case est tirée **au hasard** parmi les positions qui passent ces filtres, dans l'ordre :
1. **Valide** : bloc entier collé au bord droit (dernière colonne, ou les deux dernières pour un 2×2), sur des cases libres.
2. **Stratégique** : la rangée la plus proche d'une **cible stratégique** — d'abord un **renfort** (un ennemi engagé au corps-à-corps avec un allié de l'IA à 50 % de ses PV max ou moins, dans un sens ou dans l'autre de l'engagement) ; sinon l'**éradication** (le ou les ennemis qui ont le plus de PV actuels).

Les unités d'une même vague entrent ensemble, sur des rangées voisines.

**Cas limites**
- Aucun ennemi sur le terrain : case tirée parmi toutes les positions valides du bord ; pour une vague, chaque unité est tirée au hasard.
- Bord plein : l'entrée attend qu'une case se libère, et les suivantes derrière elle.

### 7.3 Bataille en plusieurs phases
Une bataille enchaîne une ou plusieurs **phases**, chacune avec sa zone et son script. La bataille tutoriel en a une ; celles de « Partir en guerre » en ont deux (11.7).

- **Fin d'une phase** : l'IA a déployé tout son script de la phase et n'a plus aucune unité sur le terrain. S'il reste une phase, ce n'est pas une victoire.
- **Transition** : tout est figé (seul Abandonner reste possible, 8.2) ; l'armée du joueur sort par la droite puis entre par la gauche de la zone suivante, chaque unité sur la case libre la plus à gauche de sa rangée (ou de la rangée libre la plus proche), les plus avancées en premier. Les ordres en cours sont annulés.
- **Conservé** : les morts, les PV perdus, la réserve (redéployable dans la zone de déploiement, 2), le plafond de 150 PP, le cooldown de la fuite. Le script de la phase suivante se compte depuis son début.

**Zones** (plan ASCII dans le fichier de la bataille). Dans toutes : le bord d'entrée de l'IA (dernière colonne) reste libre, aucune case libre n'est isolée, une unité 2×2 au sol peut traverser, et les rochers d'un mur se touchent par un côté. (Aucune unité 2×2 au sol n'existe en v1 : Fafnir et Athos volent. Ces contraintes préparent un roster étendu.)

| Zone | Description |
|---|---|
| **Le champ** | terrain de la bataille tutoriel (1) |
| **« Le mur »** (fond retourné) | mur de rochers qui serpente (colonnes 14-17), percé d'un passage d'une case (rangée 3 — une unité 2×2 au sol n'y passe pas) et d'un passage de deux cases (rangées 10-11) ; les tireurs tirent par-dessus, les [Vol] le survolent |
| **« Les trois couloirs »** | deux crêtes séparent trois couloirs, franchissables seulement en volant |
| **« Le fort »** (provisoire) | ruine en fer à cheval côté joueur, salle de 4×4 cases ouverte vers l'ennemi par une entrée de deux cases ; protège du corps-à-corps, pas des tirs. Cul-de-sac assumé |
| **« L'essaim »** | terrain nu, sauf deux rochers 2×2 juste devant l'entrée de l'IA (colonnes 20-21, rangées 3-4 et 9-10), que les ennemis contournent en se groupant |

**Cas limites**
- Fin d'une phase et élimination du joueur au même instant (plus aucune unité, terrain et réserve) : défaite immédiate, sans transition.

## 8. Fin de bataille

### 8.1 Victoire, défaite et match nul

| Issue | Condition |
|---|---|
| **Victoire** | l'IA a déployé tout le script de sa **dernière** phase et n'a plus aucune unité sur le terrain (même s'il lui reste des copies : elle ne les redéploie jamais) |
| **Défaite** | le joueur n'a plus aucune unité, ni sur le terrain ni en réserve, ou il abandonne (8.2) |
| **Match nul** | la victoire et la défaite arrivent au même instant (résolution simultanée, 4.1) |

- La victoire est acquise à l'instant où elle est remplie ; l'écran de victoire s'affiche **2 s** (temps de bataille) plus tard. Pendant ces 2 s, rien ne change le verdict (ni abandon, ni perte).
- Un match nul ne rapporte rien et n'est pas une victoire : la bataille tutoriel n'est pas validée, le joueur peut réessayer.

**Cas limites**
- Pas de compte à rebours : un terrain vide ne termine jamais la bataille. Un joueur dont le terrain est vide mais qui a une réserve redéploie quand il veut, pendant que l'IA continue son script.

### 8.2 Abandon
Possible à tout moment (tutoriel compris), avec confirmation : c'est une **défaite**. Les unités en réserve ne sont pas tuées ; les règles de pertes de la bataille s'appliquent aux morts (11.1).

## 9. Roster

Deux factions : **Souveraine des Wyrms** et **Souverain des Morts-Vivants**. Le joueur en choisit une au début de la partie ; l'IA joue toujours l'autre. Chacune a 3 espèces : une basique, une [Vol], une [Légendaire]. Stats : `units.md`.

## 10. Valeurs provisoires

Toutes les autres valeurs sont tranchées.

| Valeur | Provisoire | Section |
|---|---|---|
| Script de la bataille tutoriel | tableau de 7.1 | 7.1 |
| Dégâts de zone des [Légendaire] | 50 % | 4.6 |
| Zones et scripts de « Partir en guerre » | tableaux de 11.7 | 11.7 |
| Somme de départ en Spirit Stones | 0 | 11.3 |
| Récompenses de victoire | tutoriel 50 ; batailles 1 / 2 / 3 : 60 / 80 / 100 ; « L'essaim » : 80 ; rejeu : 0 | 11.7 |
| Coefficient de prix k ; multiplicateur du [Légendaire] | 1 ; ×1 | 11.4 |
| Récompense de niveau du joueur | 50 × le nouveau niveau | 11.5 |
| Réserve d'XP de survie | 200 par bataille | 11.6 |
| Spirit Fountain : production ; capacité | 3 / min ; 80 + 10 × niveau du joueur | 11.8 |

## 11. Couche méta

Périmètre : `roadmap-mvp.md` ; écrans : `technical.md` 5.

### 11.1 Individus possédés
Le joueur possède une liste d'**individus** : un identifiant unique, une espèce, une XP (11.6). Leurs stats sont celles de l'espèce (`units.md`), augmentées selon leur niveau.

- **Dotation de départ**, au choix de la faction : pour chaque espèce, les « copies de départ » de `units.md` (ex : Wyrms : 12 Vers de Lambton, 8 Amphiptères, 1 Fafnir).
- Tout nouvel individu est **niveau 1, 0 XP**, sauf le [Légendaire] réinvoqué à un niveau gardé (11.4).
- **Pertes** : un individu tué en bataille est retiré de la liste et de l'armée.

| Bataille | Victoire | Défaite, abandon, match nul |
|---|---|---|
| Tutoriel | morts perdus | rien n'est perdu |
| « Partir en guerre » | morts perdus | morts perdus quand même |

**Cas limites**
- Deux individus de même espèce et de même niveau sont interchangeables.
- Page rechargée ou fermée pendant une bataille : la bataille est annulée comme si elle n'avait pas eu lieu (aucune perte, XP ni récompense ; `technical.md` 5.4).
- **« Skip tutorial »** (menu devs, `technical.md` 5.6, pendant la bataille tutoriel seulement) : la bataille compte comme gagnée sans combat — aucune perte, aucune XP d'individu, armée de départ avec toute la dotation, 100 XP pour le joueur, 50 Spirit Stones ; le joueur arrive sur l'accueil sans écran de victoire.

### 11.2 Armée
L'**armée** est une liste d'individus possédés, avec un nom. Le joueur n'en a qu'**une**.

- **Plafond** : la somme des coûts en PP de ses individus ne dépasse jamais **500** (le coût ne dépend pas du niveau). Distinct du plafond de 150 PP du terrain (2).
- **Composition**, un individu à la fois. Les individus strictement identiques (même espèce, même niveau) sont groupés ; pour un groupe, « + » ajoute celui qui a le plus d'XP parmi ceux hors de l'armée, « − » retire celui qui en a le moins parmi ceux dans l'armée.
- **Nom** : 1 à 20 caractères, sans filtre (accents, chiffres, emojis). Les espaces de début et de fin sont retirés avant de compter ; un emoji compte pour un caractère. Nom par défaut : « Armée 1 ».
- **Armée de départ** : créée à la victoire de la bataille tutoriel avec **tous les survivants** (les dotations, 430 PP pour les Wyrms et 418 pour les Morts-Vivants, tiennent sous le plafond).

**Cas limites**
- Un ajout qui dépasserait 500 PP est impossible. Le joueur ne peut pas retirer lui-même le dernier individu.
- Les morts peuvent vider l'armée : « Combattre » est alors impossible (11.7) jusqu'à ce que le joueur ajoute un individu. Pas d'ajout automatique.
- Un nom vide, ou fait seulement d'espaces, est refusé : l'ancien nom reste.

### 11.3 Spirit Stones
La monnaie, appelée « **gemmes obscures** » dans les textes du jeu. Le solde est un entier, jamais négatif.

- **Gains** : la somme de départ, les récompenses de victoire (11.7), les récompenses de niveau du joueur (11.5), la Spirit Fountain (11.8). Montants : section 10.
- Défaite, abandon ou match nul : aucune récompense.

### 11.4 Invocation
Invoquer, c'est **payer le prix** d'une espèce de sa faction et **ajouter un nouvel individu** de cette espèce. Pas de gacha.

- **Prix** : coût en PP de l'espèce × k, avec un multiplicateur pour le [Légendaire] (section 10).
- **Espèce non légendaire** : pas de plafond de possession ; on peut en invoquer plusieurs d'un coup, pour la somme des prix, si le solde couvre le tout.
- **[Légendaire]** : au plus un possédé. L'invoquer est impossible tant qu'il est vivant ; mort, il peut être **réinvoqué** (même action, sans délai ni coût croissant), un par un, après confirmation.
- **Niveau gardé** : le niveau du [Légendaire] à sa mort est mémorisé. À la réinvocation, le joueur choisit un niveau entre 1 et ce niveau ; prix = prix de base × (1 + 0,25 × (niveau − 1)), arrondi à l'entier inférieur (Fafnir, base 110 : 110 au niveau 1, 165 au niveau 3, 220 au niveau 5). Il reprend l'XP du **début** du niveau choisi.
- Un individu invoqué n'est **pas** ajouté à l'armée.

**Cas limites**
- Solde insuffisant : invocation impossible. Annuler la confirmation ne dépense rien.
- Le niveau mémorisé est **écrasé à chaque mort** (mort niveau 5, réinvoqué niveau 1, remort niveau 2 → niveau 2 au plus).

### 11.5 Niveau du joueur
Le joueur a une **XP** cumulée, qui donne son niveau (niveau 1 à 0 XP, sans maximum).

| Situation | XP gagnée |
|---|---|
| Victoire, « Partir en guerre » | 100 + 100 × (PP des survivants / PP de l'armée), arrondi inférieur (200 sans perte) |
| Rejeu d'une bataille déjà gagnée | 25 % du gain ci-dessus, arrondi inférieur |
| Victoire, bataille tutoriel | 100 |
| Défaite, abandon, match nul | 0 |

- Les PP portent sur **toute l'armée emmenée** (déployés et réserve) ; un survivant est un individu de l'armée vivant à la fin.
- **Courbe** : du niveau N au niveau N + 1, **500 × N XP** (1 500 XP cumulés pour le niveau 3).
- **Récompense** : chaque niveau atteint rapporte **50 × le nouveau niveau** en Spirit Stones ; chaque niveau franchi d'un coup est récompensé.

### 11.6 Niveau des individus
Chaque individu a une **XP** cumulée, qui donne son niveau, de **1 à 5**. L'XP n'est gagnée **qu'à la victoire** (tutoriel compris) ; un individu mort pendant la bataille ne gagne rien.

- **XP de survie** : une réserve de **200 XP** par bataille, divisée par le **nombre d'individus déployés** au moins une fois (morts compris), arrondie à l'entier inférieur ; chaque déployé vivant à la fin (sur le terrain ou revenu de fuite) reçoit cette part, celle des morts est perdue. Ex : 8 déployés dont 2 morts → 25 pour chacun des 6 survivants.
- **XP de kill** : + le coût en PP de chaque ennemi qu'il a achevé (ex : 6 pour un New-reborn Skeleton, 110 pour Athos).
- **Rejeu** d'une bataille déjà gagnée : 25 % du total, arrondi inférieur.
- **Courbe** : du niveau N au niveau N + 1, **50 × N XP** (niveau 5 à 500 XP cumulés) ; l'XP est plafonnée à 500.
- **Effet** : +10 % de PV max et de dégâts par niveau au-dessus du 1, arrondi au plus proche (0,5 au-dessus) ; calcul en entiers : base × (9 + niveau) / 10. Les deux dégâts d'un hybride augmentent ; vitesses, portée, taille et coût ne changent pas.

| Niveau | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| Dégâts du Ver de Lambton | 8 | 9 | 10 | 10 | 11 |
| PV du Ver de Lambton | 40 | 44 | 48 | 52 | 56 |
| Dégâts du New-reborn Skeleton | 5 | 6 | 6 | 7 | 7 |

- Les unités de l'IA sont toujours niveau 1.

**Cas limites**
- Un individu déployé plusieurs fois (après une fuite, ou dans les deux zones) compte une fois dans le partage ; ses kills se cumulent.
- **Coup fatal simultané** : un seul des attaquants gagne l'XP de kill — celui qui a infligé le plus de dégâts à la cible à cet instant (dégâts de zone compris, 4.6), puis le premier déployé ; un attaquant mort à cet instant est écarté. Pour les aptitudes, chacun compte toujours (4.1).
- Le niveau ne change jamais pendant une bataille.
- Les aptitudes qui multiplient les dégâts s'appliquent aux dégâts du niveau ; Soif de sang rend toujours 40 PV, plafonnée aux PV max du niveau.

### 11.7 Partir en guerre
Des batailles placées sur la **map 1**, un réseau de 19 emplacements (`src/data/battles/war01/warMap01.js`) : trois chemins du départ au boss, des passerelles et des impasses. Le joueur y part avec **son armée** (11.2). Chaque bataille a **2 zones** ; ordres et abandon comme au tutoriel, sans tutoriel.

| Bataille | Emplacement | Zones | Récompense (première victoire) |
|---|---|---|---|
| **« La passe »** | start | le champ → « Le mur » | 60 |
| **« Les crevasses »** | low1 | « Le mur » → « Les trois couloirs » | 80 |
| **« La citadelle »** | low2 | « Les trois couloirs » → « Le fort » | 100 |
| **« L'essaim »** | top1 | « L'essaim » → « L'essaim » | 80 |

- **Déblocage** : la bataille du départ est disponible après la victoire de la bataille tutoriel ; toute autre bataille se débloque dès qu'une bataille d'un **emplacement relié** par un lien de la map est gagnée.
- **Rejeu** à volonté d'une bataille gagnée : aucune Spirit Stone, XP du joueur et des individus à 25 % (11.5, 11.6).
- **Victoire** : section 8.1, puis pertes (11.1), XP (11.5, 11.6) et récompense.
- **Défaite, abandon ou match nul** : les morts sont perdus quand même et le niveau du [Légendaire] mort est mémorisé (11.4) ; aucune XP, aucune récompense. « Réessayer » relance la même bataille avec l'armée restante.
- **Envahisseurs** : trois emplacements portent les batailles de boss, chacun surmonté d'une espèce ennemie — son [Vol] au milieu de la ligne du haut, sa basique sur le chemin de droite, son [Légendaire] au boss. Objectif de la map : gagner ces trois batailles (compteur « N/3 »).
- Les autres emplacements, dont les boss, n'ont pas encore de bataille : ils restent verrouillés. Une seule map.

**Scripts de l'IA** (provisoires, section 10 ; instants depuis le début de la zone) :

| Bataille, zone | IA Wyrms | IA Morts-Vivants |
|---|---|---|
| La passe, le champ | 0 s : 1 Ver ; 4 s : 1 Amphiptère ; 10 s : 1 Ver ; 14 s : 3 Vers | 0 s : 1 Squelette ; 4 s : 1 Necromant ; 10 s : 1 Squelette ; 14 s : 3 Squelettes ; 18 s : 2 Squelettes |
| La passe, « Le mur » | 0 s : 2 Vers ; 5 s : 1 Amphiptère ; 12 s : 2 Vers | 0 s : 2 Squelettes ; 5 s : 1 Necromant ; 12 s : 3 Squelettes ; 18 s : 2 Squelettes |
| Les crevasses, les deux zones | 0 s : 3 Vers ; 5 s : 1 Amphiptère ; 12 s : 2 Vers | 0 s : 3 Squelettes ; 5 s : 1 Necromant ; 12 s : 3 Squelettes ; 18 s : 3 Squelettes |
| La citadelle, « Les trois couloirs » | script des Crevasses | script des Crevasses |
| La citadelle, « Le fort » | 0 s : 4 Vers ; 10 s : Fafnir | 0 s : 6 Squelettes ; 10 s : 3 Necromants ; 15 s : 3 Squelettes ; 20 s : Athos |
| L'essaim, zone 1 | 0 s : 4 Vers ; 3 s : 2 Vers | 0 s : 5 Squelettes ; 3 s : 4 Squelettes |
| L'essaim, zone 2 | 0 s : 3 Vers ; 4 s : 3 Vers | 0 s : 9 Squelettes |

(Ver = Ver de Lambton, Squelette = New-reborn Skeleton, Necromant = Necromant Initiate.)

**Difficulté selon la distance au boss** (règle de conception des scripts, pas une mécanique du jeu). La **distance** est le nombre minimal de liens jusqu'au boss. Chaque script vise les pertes moyennes ci-dessous, en PP de l'armée, pour un joueur passif avec l'armée de départ niveau 1.

| Distance | Emplacements de la map 1 | Pertes visées |
|---|---|---|
| 7 | deadA | 1 % |
| 6 | start, mid1 | 5 % |
| 5 | low1, mid2, top1 | 9 % |
| 4 | low2, mid3, top2, deadB, deadC | 13 % |
| 3 | low3, mid4, top3 | 17 % |
| 2 | low4, top4 | 21 % |
| 1 | low5, top5 | 25 % |
| 0 | boss | 30 % |

- **Mesure** (`npm run balance`) : pertes en victoire seulement, moyenne des 4 stratégies du bot, pour chaque faction du joueur, N = 50, seed 1.
- **Conformité** : pertes à ±3 points de la cible pour chaque faction, et au moins 90 % de victoires (60 % au boss). Un script non conforme est retouché avant d'entrer sur la map. La table vaut pour toute nouvelle bataille de la map 1 ; une autre map aura la sienne.

**Cas limites**
- Armée vide : « Combattre » et « Réessayer » sont impossibles.
- Un emplacement sans bataille ne débloque rien.
- Les quatre batailles gagnées : le contenu est terminé, tout reste rejouable.

### 11.8 Spirit Fountain
Une fontaine de l'accueil qui **produit des Spirit Stones en continu** ; le joueur récolte d'un clic. Elle garantit qu'un joueur qui a tout perdu pourra toujours réinvoquer.

- **Mise en route** : vide, à la première arrivée sur l'accueil.
- **Production** : **3 par minute**, en temps réel (jeu fermé ou en bataille compris). Contenu = 3 × minutes entières depuis la dernière récolte (ou la mise en route), plafonné à la capacité.
- **Capacité** : **80 + 10 × niveau du joueur**, celle du niveau actuel.
- **Récolte** : tout le contenu passe au solde ; la fontaine se vide.

**Cas limites**
- Récolte d'une fontaine vide : sans effet.
- La minute entamée n'est pas perdue. Si la fontaine était pleine, l'excédent est perdu et la production repart de la récolte.
- Horloge de l'appareil reculée : le contenu n'est jamais négatif.
