# GMAO VGP App

Application de gestion des équipements, interventions, inventaire, non‑conformités et rapports VGP. Elle fonctionne sur mobile (iOS/Android) et web, avec un backend Hono + tRPC + PostgreSQL.

## Fonctionnalités principales

- Gestion des équipements, sites et missions
- Interventions et non‑conformités (NC)
- VGP (création de rapports, exécution, observations)
- Synchronisation offline/online
- Gestion des pièces jointes

## Stack technique

- **Frontend** : Expo Router + React Native + TypeScript
- **Backend** : Hono + tRPC
- **Base de données** : PostgreSQL (prod) + SQLite (local)
- **Runtime** : Bun (recommandé) ou Node.js 20+

## Démarrage rapide

### Prérequis

- Bun installé
- Node.js 20+ (optionnel si Bun utilisé)

### Installation

```bash
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
bun i
```

### Lancer l’app (web)

```bash
bun run start-web
```

### Lancer l’app (mobile)

```bash
bun run start
```

## Configuration

Variables côté app (exposées au client) :

- `EXPO_PUBLIC_RORK_API_BASE_URL` : URL de l’API, ex. `https://api.in-spectra.com/api`

## Backend API

Le backend est dans le dossier [backend](backend) et est déployé via systemd + Nginx.

Guide complet : [DEPLOY.md](DEPLOY.md)

### Domaine et ports

- API : `api.in-spectra.com` → upstream `127.0.0.1:3000`
- App web (optionnel) : `app.in-spectra.com`

## Scripts utiles

- `bun run start-web` : preview web
- `bun run start` : preview mobile
- `bunx eslint .` : lint
- `bunx tsc --noEmit` : typecheck

## Structure du projet

```
├── app/                    # Écrans (Expo Router)
├── backend/                # API Hono + tRPC
├── components/             # UI partagée
├── contexts/               # Auth, DB, notifications
├── repositories/           # Accès données / sync
├── services/               # Web API, sync, storage
├── types/                  # Types partagés
└── assets/                 # Images
```

## Dépannage

- Si l’app ne charge pas : vérifier `EXPO_PUBLIC_RORK_API_BASE_URL`.
- Si l’API retourne 502 : vérifier le service `in-spectra-api` et Nginx (voir [DEPLOY.md](DEPLOY.md)).

## Contribution

1. Créer une branche
2. Commits clairs et courts
3. PR avec description des changements
