# AgriCollecte

App web (PWA, utilisable aussi sur mobile via le navigateur ou "Ajouter à l'écran d'accueil") pour la collecte de mesures agricoles par station → parcelle → ligne → valeurs.

## Structure

- `server/` — API Node.js/Express + Prisma + MongoDB Atlas, authentification JWT (email/mot de passe + Google Sign-In)
- `client/` — App React (Vite) + Tailwind CSS + PWA, export Excel (xlsx), i18n (FR/EN/AR/Darija)

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

### 2. Frontend

```bash
cd client
npm install           # déjà fait
npm run dev            # démarre sur http://localhost:5173
```

Le frontend proxy `/api` vers `http://localhost:4000` en dev (voir `vite.config.js`).

## Activer la connexion Google

1. Créer un identifiant OAuth "Application Web" sur https://console.cloud.google.com/apis/credentials
2. Ajouter `http://localhost:5173` (et votre domaine de production) aux "Origines JavaScript autorisées"
3. Renseigner le Client ID :
   - `server/.env` → `GOOGLE_CLIENT_ID=...`
   - `client/.env` (à créer) → `VITE_GOOGLE_CLIENT_ID=...`

Sans cette config, la connexion email/mot de passe fonctionne normalement ; le bouton Google affiche juste un message d'avertissement.

## Fonctionnalités

- Connexion email/mot de passe ou Google
- Création de stations, ajout de N parcelles nommées par station
- Travail de terrain par parcelle : "Ajouter une ligne" (numérotée automatiquement), saisie de valeurs numériques avec **Annuler**, **Retour**, **Suivant**, **Stop**
- Tableau récapitulatif par parcelle : modification/suppression d'une valeur ou d'une ligne
- Export Excel (.xlsx) téléchargeable depuis PC ou mobile

## Build production

```bash
cd client && npm run build   # génère client/dist (app statique + PWA)
cd server && npm start        # sert l'API (à héberger séparément, ex: Render/Railway)
```
