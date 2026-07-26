# AgriCollecte

App (web + mobile Android/iOS, un seul code source) pour la collecte de mesures agricoles par station → parcelle → ligne → valeurs.

## Structure

- `server/` — API Node.js/Express + Prisma + MongoDB Atlas, authentification JWT (email/mot de passe + Google Sign-In). Déployé sur Render.
- `client-mobile/` — App unique **React Native (Expo) + Expo Router + NativeWind**, compilée à la fois pour le web (via React Native Web) et pour Android/iOS (via EAS Build ou Gradle local). Export Excel (xlsx), i18n (FR/EN/AR/Darija).

## Démarrage

### 1. Backend

```bash
cd server
npm install            # déjà fait
npx prisma db push     # déjà fait (synchronise le schéma avec MongoDB Atlas)
npm run dev              # démarre sur http://localhost:4000
```

Variables d'environnement dans `server/.env` :
- `DATABASE_URL` — chaîne de connexion MongoDB Atlas (déjà renseignée)
- `JWT_SECRET` — à changer en production
- `GOOGLE_CLIENT_ID` — requis pour activer "Se connecter avec Google" (voir ci-dessous)

Après toute modification de `prisma/schema.prisma`, relancer `npx prisma db push` (MongoDB est schemaless : pas de fichiers de migration comme avec SQL, `db push` suffit).

### 2. App (web + mobile)

```bash
cd client-mobile
npm install                     # déjà fait
npx expo start                  # QR code à scanner avec l'app Expo Go (Android/iOS)
npx expo start --web            # ouvre l'app dans le navigateur (http://localhost:8081)
```

Variables d'environnement dans `client-mobile/.env` :
- `EXPO_PUBLIC_API_URL` — URL du backend (Render en prod, `http://localhost:4000/api` en dev local)
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID` — requis pour activer "Se connecter avec Google"

## Activer la connexion Google

1. Créer un identifiant OAuth "Application Web" sur https://console.cloud.google.com/apis/credentials
2. Ajouter les origines/URIs de redirection utilisées par Expo (web + `expo-auth-session`) aux "Origines JavaScript autorisées"
3. Renseigner le Client ID dans `server/.env` (`GOOGLE_CLIENT_ID`) et `client-mobile/.env` (`EXPO_PUBLIC_GOOGLE_CLIENT_ID`)

Sans cette config, la connexion email/mot de passe fonctionne normalement ; le bouton Google affiche juste un message d'avertissement.

## Fonctionnalités

- Connexion email/mot de passe ou Google
- Création de stations, ajout de N parcelles nommées par station
- Travail de terrain par parcelle : "Ajouter une ligne" (numérotée automatiquement), saisie de valeurs numériques avec **Annuler**, **Retour**, **Suivant**, **Stop**
- Tableau récapitulatif par parcelle : modification/suppression d'une valeur ou d'une ligne
- Export Excel (.xlsx) — téléchargement direct sur web, partage natif (`expo-sharing`) sur mobile

## Build production

```bash
# Web (build statique, à héberger sur Vercel/Netlify/Render Static Site/etc.)
cd client-mobile && npm run build:web   # génère client-mobile/dist

# Mobile — via EAS Build (cloud, recommandé)
cd client-mobile && eas build --platform android --profile preview

# Backend
cd server && npm start                  # à héberger séparément (Render/Railway) — déjà en place sur Render
```
