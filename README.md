# Association I KOUE GUI A ITA - Plateforme Web
Ce projet est l'application web officielle (PWA) de l'Association I KOUE GUI A ITA (République Centrafricaine).

## Technologies Utilisées
- React 19 / Vite
- Tailwind CSS 4
- Progressive Web App (PWA) via `vite-plugin-pwa`
- TypeScript

## Instructions d'installation
1. Cloner le projet.
2. Installer les dépendances : `npm install`
3. Lancer le serveur de développement : `npm run dev`
4. Compiler pour la production : `npm run build`

## Structure des Dossiers
- `/public` : Actifs statiques, icônes PWA, sitemap.xml, robots.txt.
- `/src/components` : Composants réutilisables (Layout, boutons, formulaires).
- `/src/pages` : Vues principales de l'application (Accueil, Domaines, Espace Membre).
- `/src/hooks` : Hooks React personnalisés (ex. usePWAInstall).

## Optimisations de Performance & SEO (Effectuées)
- **Lazy Loading** : Les pages sont chargées à la demande via `React.lazy` et `Suspense`.
- **PWA** : L'application est installable (Manifest Web App, Service Worker), permettant un support hors-ligne de base.
- **SEO** : Meta tags avancés, Open Graph, Twitter Cards, et Schema.org (JSON-LD) intégrés.
- **Images** : Format WebP et Lazy Loading appliqués via configuration et attributs HTML.

## Mise à jour du Contenu
Pour modifier les pages principales :
- Rendez-vous dans `/src/pages`.
- Chaque section de contenu (textes, images) est écrite en React/JSX.

## Contacts techniques
Pour toute assistance, contactez le Bureau Exécutif de l'association.

## Procédure de sauvegarde
- Le code source doit être versionné via Git (GitHub/GitLab).
- Les données sensibles (base de données de l'Espace Membre) devront être sauvegardées régulièrement via les outils Cloud lors de l'intégration du backend final.

## Workflow sécurisé d'adhésion

Les décisions d'acceptation et de refus sont exécutées par les fonctions callable Firebase dans `/functions`, avec vérification du rôle côté serveur. Les clients ne peuvent pas modifier directement le statut des demandes. Après acceptation, le profil est activé immédiatement si un compte Auth existe déjà, ou lors de sa prochaine connexion Google avec une adresse e-mail vérifiée.

Le projet utilise la base Firestore nommée `ai-studio-associationikoue-fd6a3bd0-f950-4d83-a060-f13ee4c4c3a5`. Les règles Firestore et les fonctions doivent viser cette base.

Avant d'activer ce parcours dans un environnement Firebase :
1. Sélectionner le projet Firebase correct avec `firebase use <project-id>`.
2. Vérifier que le projet autorise le déploiement des Cloud Functions et que la facturation requise par Firebase est configurée.
3. Déployer les règles et les deux fonctions : `firebase deploy --only firestore:rules,functions:decideMembershipRequest,functions:syncApprovedMembership`.
4. Tester une demande en attente, une acceptation, un refus, puis une connexion Google avec l'adresse approuvée.

**Important :** le code est versionné sur la branche de travail. Le déploiement en production reste volontairement séparé et doit être autorisé puis vérifié explicitement.
