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
