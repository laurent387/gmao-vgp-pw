# Déploiement (VPS) — API Hono/tRPC + Postgres

Ce repo contient une app Expo (mobile/web) + un serveur API Hono/tRPC (dossier `backend/`).

Ce document décrit un déploiement simple sur un VPS Linux (Ubuntu/Debian) avec :
- Bun pour exécuter l'API
- systemd pour la supervision
- Nginx en reverse-proxy (HTTPS)

## 1) Prérequis sur le VPS

- Ubuntu 22.04+ (ou Debian 12)
- Un nom de domaine (ex: `api.votre-domaine.tld`) pointant vers l'IP du VPS
- Postgres accessible (local ou externe)

Installez les dépendances système :

```bash
sudo apt update
sudo apt install -y nginx curl unzip
```

### Installer Bun

```bash
curl -fsSL https://bun.sh/install | bash

# Recharger votre shell
source ~/.bashrc

bun --version
```

## 2) Récupérer le code (Git)

```bash
# Recommandé: déployer dans /opt
sudo mkdir -p /opt/inspectra
sudo chown -R $USER:$USER /opt/inspectra

cd /opt/inspectra
git clone <VOTRE_URL_GIT> app
cd app

bun i
```

## 3) Variables d'environnement (serveur)

Le serveur lit ces variables :
- `PORT` (ex: 3000)
- `DATABASE_HOST`
- `DATABASE_PORT`
- `DATABASE_NAME`
- `DATABASE_USER`
- `DATABASE_PASSWORD`
- `DATABASE_SSL` (`true`/`false`)

Créez un fichier d'environnement dédié (ex: `/etc/inspectra/api.env`) :

```bash
sudo mkdir -p /etc/inspectra
sudo nano /etc/inspectra/api.env
```

Contenu (exemple) :

```bash
PORT=3000
NODE_ENV=production

DATABASE_HOST=87.106.26.179
DATABASE_PORT=5432
DATABASE_NAME=inspectra_db
DATABASE_USER=inspectra_user
DATABASE_PASSWORD=changeme
DATABASE_SSL=false
```

Sécurisez :

```bash
sudo chmod 600 /etc/inspectra/api.env
```

## 4) Lancer l'API manuellement (test)

Depuis le repo :

```bash
cd /opt/inspectra/app

# L'API écoute sur 0.0.0.0:PORT
bun backend/server.ts
```

Test :

```bash
curl http://127.0.0.1:3000/
# => {"status":"ok","message":"In-Spectra API is running"}
```

tRPC :

```bash
curl -s http://127.0.0.1:3000/api/trpc/auth.login -X POST \
  -H 'content-type: application/json' \
  --data '{"email":"admin@inspectra.fr","password":"admin123"}'
```

## 5) systemd (service)

Créez `/etc/systemd/system/inspectra-api.service` :

```bash
sudo nano /etc/systemd/system/inspectra-api.service
```

Contenu :

```ini
[Unit]
Description=Inspectra API (Hono + tRPC)
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/inspectra/app
EnvironmentFile=/etc/inspectra/api.env
ExecStart=/home/www-data/.bun/bin/bun backend/server.ts
Restart=always
RestartSec=2

# Hardening basique
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/inspectra/app /opt/inspectra/app/uploads

[Install]
WantedBy=multi-user.target
```

Notes :
- Ajustez le chemin `ExecStart` si Bun est installé ailleurs.
- Si vous préférez, créez un utilisateur dédié `inspectra` plutôt que `www-data`.
- Le dossier `uploads/` est créé automatiquement pour stocker les documents/photos.

Activez :

```bash
sudo systemctl daemon-reload
sudo systemctl enable inspectra-api
sudo systemctl start inspectra-api
sudo systemctl status inspectra-api

# Logs
sudo journalctl -u inspectra-api -f
```

## 6) Nginx (reverse proxy)

Créez `/etc/nginx/sites-available/inspectra-api` :

```bash
sudo nano /etc/nginx/sites-available/inspectra-api
```

Contenu (HTTP) :

```nginx
server {
  listen 80;
  server_name api.votre-domaine.tld;

  client_max_body_size 50M;

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Activez :

```bash
sudo ln -sf /etc/nginx/sites-available/inspectra-api /etc/nginx/sites-enabled/inspectra-api
sudo nginx -t
sudo systemctl reload nginx
```

### HTTPS (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.votre-domaine.tld
```

## 7) Configurer l'app mobile/web

Dans l'interface Rork, configurez :
- `EXPO_PUBLIC_RORK_API_BASE_URL=https://api.votre-domaine.tld`

C'est l'URL utilisée côté app pour appeler `.../api/trpc`.

## 8) Mise à jour (deploy)

```bash
cd /opt/inspectra/app

git pull
bun i
sudo systemctl restart inspectra-api
sudo journalctl -u inspectra-api -n 200 --no-pager
```

## 9) Dépannage

- Vérifier le service : `sudo systemctl status inspectra-api`
- Logs : `sudo journalctl -u inspectra-api -f`
- Vérifier Nginx : `sudo nginx -t` puis `sudo systemctl reload nginx`
- Tester local : `curl http://127.0.0.1:3000/`

---

## Routes API tRPC

### Auth
- `auth.login` - Connexion utilisateur
- `auth.me` - Utilisateur courant

### Sync
- `sync.push` - Envoi des données offline (rapports, NC, actions, missions, maintenances, documents)
- `sync.pull` - Récupération des changements depuis lastSyncAt
- `sync.status` - État du serveur

### Admin (ADMIN/HSE_MANAGER uniquement)
- `admin.listUsers` / `admin.createUser` / `admin.updateUser` / `admin.deleteUser`
- `admin.listSites` / `admin.createSite` / `admin.updateSite` / `admin.deleteSite`
- `admin.listZones` / `admin.createZone` / `admin.updateZone` / `admin.deleteZone`
- `admin.listControlTypes` / `admin.createControlType` / `admin.updateControlType` / `admin.deleteControlType`
- `admin.listChecklistTemplates` / `admin.createChecklistTemplate` / `admin.deleteChecklistTemplate`
- `admin.listChecklistItems` / `admin.createChecklistItem` / `admin.updateChecklistItem` / `admin.deleteChecklistItem`
- `admin.seedPostgres` - Initialisation des données de démo

### Assets
- `assets.list` / `assets.getById`

### Missions
- `missions.list` / `missions.getById` / `missions.create` / `missions.updateStatus` / `missions.getAssets`

### Reports
- `reports.list` / `reports.getById` / `reports.count` / `reports.create`

### Non-Conformités
- `nc.list` / `nc.getById` / `nc.create` / `nc.updateStatus`
- `nc.actions` / `nc.createAction` / `nc.updateActionStatus`

### Maintenance
- `maintenance.list` / `maintenance.getById` / `maintenance.create` / `maintenance.listByTechnician` / `maintenance.updateStatus`

### Sites & Controls
- `sites.list` / `sites.getById` / `sites.getZones`
- `controls.list` / `controls.getByAsset`

### Dashboard
- `dashboard.kpis` / `dashboard.dueEcheances`

## Endpoint REST (upload fichiers)

- `POST /api/uploads` - Upload de photos/documents
  - Headers: `Authorization: Bearer <token>`
  - Body: `multipart/form-data` avec `entityType`, `entityId`, `documentId`, `file`
  - Retourne: `{ id, url }`

- `GET /uploads/:name` - Télécharger un fichier uploadé

## Rôles utilisateurs

| Rôle | Permissions |
|------|-------------|
| ADMIN | Toutes les permissions, gestion utilisateurs/sites/contrôles |
| HSE_MANAGER | Création/validation missions, NC, actions + Admin UI |
| TECHNICIAN | Exécution missions, création rapports/NC |
| AUDITOR | Lecture seule uniquement (aucune mutation) |

## Instructions de test

1. Seed la base de données :
```bash
curl -X POST http://127.0.0.1:3000/api/trpc/admin.seedPostgres \
  -H 'content-type: application/json' \
  -H 'authorization: Bearer mock_token_admin' \
  --data '{"forceReset":true,"assetsPerSite":10}'
```

2. Test de synchronisation :
```bash
# Push
curl -X POST http://127.0.0.1:3000/api/trpc/sync.push \
  -H 'content-type: application/json' \
  -H 'authorization: Bearer mock_token_tech' \
  --data '{"items":[]}'

# Pull
curl http://127.0.0.1:3000/api/trpc/sync.pull \
  -H 'authorization: Bearer mock_token_tech'
```

3. Test rôle AUDITOR (doit échouer sur mutations) :
```bash
curl -X POST http://127.0.0.1:3000/api/trpc/nc.create \
  -H 'content-type: application/json' \
  -H 'authorization: Bearer mock_token_auditor' \
  --data '{"asset_id":"test","title":"test","description":"test","severity":3}'
# => 403 Forbidden
```
