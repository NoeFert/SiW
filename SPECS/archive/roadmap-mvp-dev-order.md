# Ordre de développement de la couche méta (historique)

Sorti de `SPECS/roadmap-mvp.md` le 2026-10-17 : les étapes 1 à 15 sont faites ; l'étape 16 (playtest et chiffrage de l'économie) reste ouverte, voir `rules.md` 10.


1. Modèle de données et sauvegarde : individus `{ id, species }`, armée, solde de Spirit Stones (logique pure + tests Jest), et profil `test-wyrm` à jour
2. Écran d'accueil : solde en haut à droite, trois boutons (« Partir en guerre » sans contenu pour l'instant)
3. Gestion de civilisation, section Unités : liste par espèce + page de détail
4. Gestion de civilisation, section Armée : armée de départ automatique, renommage, composition sous 500 PP
5. Écran Invocation : achat, réinvocation du Légendaire, débit des Spirit Stones
6. Logique des niveaux (logique pure + tests Jest) : courbes d'XP du joueur et des individus, stats par niveau, XP gagnée à la victoire, prix de réinvocation selon le niveau gardé
7. Sauvegarde des niveaux (XP des individus, XP du joueur, niveau du Légendaire à sa mort), profil `test-wyrm` à jour, niveau et barre d'XP sur l'accueil
8. Gestion de civilisation, section Unités : accordéons par espèce + page de détail d'un individu
9. Gestion de civilisation, section Armée : accordéons par espèce, case « dans l'armée » par individu
10. Bataille : déploiement d'individus précis avec leurs stats de niveau, tour par espèce et niveau, coups fatals attribués ; à la victoire, XP des individus et du joueur (affichée sur l'écran de victoire), récompenses de niveau
11. Écran Invocation : réinvocation du Légendaire avec choix du niveau gardé
12. Second passage de roadmap : contenu de « Partir en guerre » **(fait : `rules.md` 11.7)** ; valeurs chiffrées de l'économie à revoir après playtest
13. « Partir en guerre » — données et logique (logique pure + tests Jest) : définition des trois batailles (zones et scripts provisoires), déblocage en séquence, récompenses (première victoire / rejeu), pertes en défaite, filet de sécurité (remplacé ensuite par la Spirit Fountain, étape 15) ; sauvegarde des batailles gagnées
14. « Partir en guerre » — écrans : `WarScreen`, bataille avec l'armée, écran de défaite enrichi (pertes, « Retour à l'accueil »), bouton de l'accueil activé
15. Spirit Fountain : logique (tests Jest), sauvegarde de l'heure de dernière récolte, affichage et récolte sur l'accueil
16. Playtest et chiffrage de l'économie (somme de départ, k, récompenses, récompense de niveau)

