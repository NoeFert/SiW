---
name: balancer
description: Vérifie l'équilibre du jeu par le calcul et par simulation de batailles headless — factions, difficulté des combats selon le niveau du joueur, pertes contre Spirit Stones gagnées, progression XP, filet anti-blocage (Spirit Fountain) et farming au rejeu. Session interactive, met à jour SPECS/ avec accord. Produit BALANCE-REVIEW.md.
user-invocable: true
argument-hint: "[axe à vérifier en priorité : factions | difficulté | économie | xp | fountain | farming]"
---

# Balancer

## Objectif

Mesurer l'équilibre du jeu, sans s'en remettre seulement à l'intuition, sur six axes :

1. **Factions** : un joueur Wyrms et un joueur Morts-Vivants ont-ils la même expérience ?
2. **Difficulté des combats** : la difficulté suit-elle la montée en puissance du joueur (niveau, ressources, armée vétérane) ?
3. **Pertes contre Spirit Stones gagnées** : ce qu'une victoire rapporte, comparé au prix de réinvocation des unités perdues.
4. **Progression XP / niveaux** : vitesse de montée en niveau des individus et du joueur, puissance d'une armée vétérane.
5. **Filet anti-blocage** : un joueur qui a tout perdu peut-il revenir dans la partie grâce à la Spirit Fountain, et en combien de temps ?
6. **Farming / rejeu** : une boucle de rejeu écrase-t-elle les autres sources de revenu et d'XP ?

Deux méthodes, toujours combinées : **les calculs** (à partir des valeurs de `SPECS/` et du code) et **la simulation** (batailles jouées sans Phaser par le moteur de `src/logic/`, avec un bot joueur). Les calculs disent ce qui *devrait* se passer, la simulation ce qui *se passe* vraiment (pathfinding, plafond de 150 PP, aptitudes, scripts de l'IA).

Ce skill **mesure et propose** ; il n'invente aucune règle. Toute règle absente de `SPECS/` (par exemple l'adaptation de la difficulté au niveau du joueur, ou les batailles de boss) est signalée comme un trou à combler, jamais inventée.

## Règle d'interaction (impérative)

Une seule question à la fois. Attends la réponse avant de continuer. Présente un déséquilibre à la fois, jamais une liste d'un coup.

## Prérequis

`SPECS/CONCEPT.md`, `SPECS/rules.md`, `SPECS/units.md` et `SPECS/roadmap-mvp.md` doivent exister. Sinon, refuse de continuer et dis à l'étudiant de lancer `/specifier` (ou `/roadmapper` pour la roadmap) d'abord.

## Sources à lire

- `SPECS/units.md` : stats, coûts, copies de départ.
- `SPECS/rules.md` : section 7 (scripts de l'IA), 8 (victoire, défaite, match nul), 10 (valeurs provisoires de l'économie), 11 (individus, armée, Spirit Stones, invocation, niveaux, « Partir en guerre », Spirit Fountain).
- `SPECS/roadmap-mvp.md` : « Points ouverts » (renvoie aux valeurs provisoires de `rules.md` 10).
- `SPECS/DECISIONS.md` : le pourquoi des valeurs déjà tranchées.
- `BALANCE-REVIEW.md` s'il existe déjà : les décisions précédentes et les cibles fixées, pour ne pas revenir sur ce qui est tranché.
- Le code, pour vérifier que les valeurs réelles correspondent aux specs : `src/data/` (rosters, scripts, batailles, map), `src/logic/levels.js`, `summon.js`, `fountain.js`, `war.js`, `victory.js`. Un écart code / specs est signalé comme tel : ce n'est pas un problème d'équilibre, c'est un bug ou une spec à mettre à jour.

## Outil de simulation : `src/debug/balance/`

Script Node versionné, lancé par `npm run balance`, à côté de `src/debug/printBattle.js`. Il n'importe que `src/logic/` et `src/data/` : **aucune dépendance à Phaser ni à localStorage**, il ne modifie aucune sauvegarde.

S'il n'existe pas encore, propose de le créer (avec l'accord de l'étudiant) avant de lancer les simulations. S'il existe, relis-le et complète-le si un axe le demande. Ce qu'il doit faire :

- **Jouer une bataille** à partir d'une définition de `src/data/battles.js` (toutes ses zones), d'une faction joueur et d'une armée d'individus (espèce + niveau), avec `createBattle` / `deployPlayerUnit` / `tickBattle` et un pas de temps fixe. Seed du RNG fixe et documenté, pour que deux sessions donnent des chiffres comparables.
- **Bot joueur à plusieurs stratégies simples**, toutes soumises au plafond de 150 PP et déployant dès que le plafond le permet : `basics` (unités basiques d'abord), `flyers` (unités [Vol] d'abord), `mixed` (alternance), `legendaryFirst` (le [Légendaire] dès que possible). Aucune commande fine (pas de focus, pas de fuite) : c'est un joueur passif, une borne basse de ce qu'un humain obtient.
- **Mesurer** sur N batailles par configuration (N = 50 par défaut) : taux de victoire / défaite / match nul, durée, pertes (nombre d'individus et PP), XP gagnée par individu, Spirit Stones gagnées (récompense + niveau du joueur).
- **Sortie** : un tableau texte lisible par configuration (faction × bataille × stratégie × niveau de l'armée), et l'option `--json` pour que le skill puisse relire les chiffres.

Si une mesure demande une logique qui n'existe pas dans `src/logic/`, ne la réécris pas dans le script : signale-le à l'étudiant.

## Déroulé

1. Vérifie les prérequis. Si un fichier manque, arrête-toi avec le message de refus.

2. Lis les sources ci-dessus. Si l'étudiant a passé un axe en argument, commence par celui-là.

3. **Cibles.** Pour chaque axe, il faut une cible pour juger : sans cible, pas de déséquilibre, seulement des chiffres. Si `BALANCE-REVIEW.md` ne contient pas encore la cible d'un axe, aide l'étudiant à la définir **avant** de mesurer cet axe, une question à la fois, en lui proposant 2 ou 3 options chiffrées. Exemples :
   - Économie : « une victoire avec des pertes moyennes rembourse X % des pertes ».
   - Difficulté : « taux de victoire attendu d'une armée de niveau N contre la bataille B ».
   - Fountain : « un joueur qui a tout perdu regagne la première bataille en moins de X minutes de jeu ».
   - Farming : « rejouer la meilleure bataille ne rapporte pas plus de X fois la Fountain par minute ».

4. **Calculs statiques**, axe par axe :
   - **Factions** : DPS/PP et PV/PP par paire (comme `units.md`), mais surtout l'asymétrie réelle : le joueur Wyrms affronte le script Morts-Vivants et inversement. Compare la puissance totale (PP, PV, DPS) des scripts de l'IA par faction et par zone, et l'**XP par kill** selon la faction (l'XP vaut le coût en PP de l'ennemi achevé, `rules.md` 11.6 : un Squelette rapporte 6, un Ver 10).
   - **Difficulté** : puissance effective d'une armée selon le niveau de ses individus (+10 % PV et dégâts par niveau ≈ ×(1 + 0,1 × (niveau − 1))² en efficacité au même coût en PP) comparée à la puissance des scripts de chaque bataille. Projette l'armée attendue à chaque étape de la progression.
   - **Économie** : prix de réinvocation des pertes typiques vs récompense de victoire + récompense de niveau du joueur (50 × N). Indique laquelle des deux sources domine selon le niveau.
   - **XP** : nombre de victoires pour qu'un individu basique atteigne le niveau 5, selon sa faction ; nombre de victoires par niveau du joueur (courbe 500 × N).
   - **Fountain** : capacité au niveau 1 (30) et à quelques niveaux types ; ce qu'elle permet de réinvoquer ; minutes réelles pour remplir la capacité.
   - **Farming** : Spirit Stones/minute et XP/minute de chaque bataille rejouée (récompense réduite à 25 %), comparées à la Fountain (1/min).

5. **Simulations.** Lance `npm run balance` sur les configurations utiles à l'axe en cours (les deux factions, chaque bataille de « Partir en guerre », les quatre stratégies, armée de départ niveau 1 puis armées de niveau 3 et 5). Confronte les résultats aux calculs : un écart important entre les deux est un constat en soi (interaction non prévue, IA bloquée, stratégie dominante).

6. **Constats, un par un.** Pour chaque déséquilibre (écart avec la cible) : chiffres à l'appui (calcul + simulation), en quelques lignes, puis **une** question pour trancher, avec 2 ou 3 corrections chiffrées possibles (ex : « récompense de La passe 60 → 80 », « XP de survie 10 → 15 »). Ne propose de toucher qu'aux valeurs marquées **provisoires** dans `SPECS/` en priorité ; une valeur tranchée ne change que si l'étudiant le décide explicitement.
   - Si le constat révèle une **règle manquante** (ex : adaptation de la difficulté au niveau du joueur, batailles de boss), ne la rédige pas : note-la comme trou à combler et suggère `/enricher`.
   - Si l'étudiant choisit une correction, propose la modification du fichier `SPECS/` concerné (et seulement de `SPECS/` : le code se met à jour ensuite, dans la boucle de travail habituelle). Applique-la avec son accord, puis relance la simulation concernée pour vérifier l'effet avant de passer au constat suivant.

7. Une fois tous les axes passés en revue, écris (ou mets à jour) `BALANCE-REVIEW.md` à la racine du projet :
   - **Cibles** par axe (celles décidées dans cette session et les précédentes).
   - **Mesures** : tableaux clés (calcul et simulation), avec le seed, N et la date.
   - **Constats et décisions** : pour chaque déséquilibre, la décision prise et le fichier modifié.
   - **Trous dans les specs** : règles manquantes repérées, à traiter avec `/enricher`.
   - **Points ouverts** : constats non tranchés, valeurs encore provisoires.

8. Confirme que `BALANCE-REVIEW.md` est prêt. Rappelle que le skill est à relancer après chaque changement de valeurs, de scripts de l'IA ou de batailles (nouvelle bataille de boss, nouvelle map), et que la simulation ne remplace pas le playtest : le bot joueur ne donne qu'une borne basse.
