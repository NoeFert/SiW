# ROADMAP-MVP.md — Couche méta du MVP

> **Rôle** : le périmètre de la couche méta du MVP — accueil, gestion de civilisation, invocation, monnaie, niveaux, « Partir en guerre ». Le moteur de bataille est dans `roadmap.md`, les règles dans `rules.md`. Index des fichiers : `README.md`.

**Ce fichier fait priorité sur `roadmap.md` en cas de contradiction.**

**Objectif** : une première boucle méta — perdre des créatures en bataille, gagner des Spirit Stones, faire grandir à nouveau son peuple, et faire progresser en niveau le joueur et ses survivants, pour que perdre peu d'unités soit récompensé.

## Inclus

| Élément | Règles | Écrans |
|---|---|---|
| Individus possédés `{ id, species, xp }`, dotation de départ | `rules.md` 11.1 | `technical.md` 5.1 (Unités) |
| Une armée, 500 PP au plus, renommable | `rules.md` 11.2 | `technical.md` 5.1 (Armées) |
| Spirit Stones : somme de départ, récompenses | `rules.md` 11.3 | `technical.md` 5.1 (Accueil) |
| Invocation, réinvocation du [Légendaire] au niveau gardé | `rules.md` 11.4 | `technical.md` 5.1 (Invocation) |
| Niveau du joueur | `rules.md` 11.5 | `technical.md` 5.1 (Accueil) |
| Niveau des individus | `rules.md` 11.6 | `technical.md` 5.1, 5.3 |
| « Partir en guerre » : map 1, quatre batailles, déblocage par les liens, rejeu, pertes même en défaite | `rules.md` 11.7 | `technical.md` 5.1 (Partir en guerre) |
| Spirit Fountain | `rules.md` 11.8 | `technical.md` 5.1 (Accueil) |
| Écran de victoire (récompenses, montées de niveau, pertes) | `rules.md` 11.5 à 11.7 | `technical.md` 5.3 |
| Tutoriel de l'accueil (conseils non bloquants) | — | `technical.md` 5.5 |
| Codex des mots-clés, « Réinitialiser le jeu » | — | `technical.md` 5.1, 5.4 |
| Profils de test (menu devs) | — | `technical.md` 5.6 |

## Sauvegardé

Seuls cas de persistance validés (`CLAUDE.md`) : un **profil du joueur** sous une seule clé du localStorage (champs : `technical.md` 5.4) —
- la faction choisie et la victoire de la bataille tutoriel ;
- les individus possédés, avec leur XP, et l'armée (nom, identifiants) ;
- le solde de Spirit Stones et l'XP du joueur ;
- le niveau du [Légendaire] à sa mort ;
- les batailles de « Partir en guerre » gagnées ;
- l'heure de la dernière récolte de la Spirit Fountain ;
- les conseils de l'accueil déjà vus.

Rien d'autre : ni historique de batailles, ni bataille en cours.

## Exclus du MVP

- Gacha (invocation d'espèces inconnues ou aléatoires)
- Plus d'une armée (emplacements supplémentaires verrouillés), suppression d'une armée
- Personnalisation des individus (noms, stats, keywords) — seuls le renommage de l'armée et la progression en niveau sont inclus
- Délai ou coût croissant de réinvocation
- Batailles des autres emplacements de la map 1, dont les batailles de boss (`rules.md` 11.7) ; autres maps

## Suite

- Emplacements d'armée supplémentaires, débloqués à certains niveaux du joueur
- Hausse ponctuelle du plafond de l'armée (500 PP) à certains niveaux du joueur
- Amélioration pour dépasser le niveau 5 d'un individu
- Cooldown de la fuite réduit selon le niveau du joueur (`rules.md` 5.1)
- Personnalisation des individus
- Réinvocation avec délai ou coût croissant
- Gacha

## Points ouverts

- Valeurs provisoires de l'économie, des récompenses et des scripts : `rules.md` 10, à chiffrer après playtest et avec `/balancer`.
