# Checklist du refactor

À passer à la fin de chaque étape du refactor (branche `refactor/state-and-scene`). Fichier temporaire : supprimé à la fin du refactor.

## Contrôles automatiques

- [ ] `npm test` : tous les tests passent, dont `battleReplay.test.js` (même résultat pour chaque bataille rejouée avec un aléa fixé)
- [ ] `npm run build` : le build passe sans erreur

## Parcours manuels (`npm run dev`)

Partir d'une sauvegarde vide (menu devs → `restart game`).

**Premier lancement**
- [ ] Écran d'intro, puis choix de faction
- [ ] Bataille 01 avec son tutoriel : chaque étape s'affiche et avance
- [ ] Glisser-déposer une unité : zone de déploiement visible pendant le glisser, unité posée
- [ ] Unités ennemies qui entrent par la droite, déplacements fluides, barres de vie, compteurs d'aptitude
- [ ] Missiles, entailles, coup critique, « Raté ! », soin
- [ ] Ordres Aller / Attaquer / Fuir : sélection de l'unité puis de la cible, clic droit pour annuler
- [ ] Pause (bouton et Espace) : terrain désaturé, animations figées ; ce qui est cliquable reste en couleur
- [ ] Victoire : le terrain reste affiché quelques secondes, puis l'écran de victoire (XP, niveaux, Spirit Stones)

**Accueil et méta**
- [ ] Accueil : conseils du tutoriel, Spirit Fountain, solde de Spirit Stones
- [ ] Unités / armée : ajouter et retirer des individus, renommer l'armée
- [ ] Invocation depuis l'accueil et depuis l'écran des unités ; « Retour » ramène au bon écran
- [ ] Codex

**Partir en guerre**
- [ ] Lancer une bataille ; changement de phase (l'armée sort à droite, entre à gauche, nouveau terrain)
- [ ] Abandonner : boîte de confirmation (pause), puis défaite avec la liste des pertes
- [ ] Défaite : « Réessayer » et « Accueil » ; les morts ont disparu de l'armée

**Sauvegarde**
- [ ] Recharger la page sur l'accueil : faction, unités, armée, Spirit Stones, XP, batailles gagnées et conseils vus sont conservés
- [ ] Recharger la page pendant la bataille 01 : on revient à la bataille 01
- [ ] Menu des paramètres de l'accueil → recommencer : retour à l'intro, sauvegarde vide
- [ ] Menu devs : chaque profil de test se charge et ouvre l'accueil
