# Docker Deployment Guide - In-Spectra

## Architecture

Cette application est maintenant entièrement containerisée avec Docker Compose :

- **PostgreSQL** (port 5432) : Base de données
- **Hono/TRPC** (port 3000) : API backend avec uploads 
- **Fastify API** (port 4000) : API REST + frontend web
- **Nginx** (ports 80/443) : Reverse proxy avec SSL

## Prérequis

- Docker >= 20.10
- Docker Compose >= 2.0
- Fichier `.env` configuré

## Migration depuis systemd

Si vous migrez depuis une installation systemd existante :

```bash
./migrate-to-docker.sh
```

Ce script va :
1. Sauvegarder la base PostgreSQL
2. Arrêter et désactiver les services systemd
3. Construire les images Docker
4. Démarrer les containers
5. Restaurer la base de données

## Démarrage manuel

```bash
# Construire les images
docker-compose build

# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Voir le statut
docker-compose ps
```

## Commandes utiles

```bash
# Arrêter tous les services
docker-compose down

# Redémarrer un service
docker-compose restart api
docker-compose restart trpc

# Voir les logs d'un service
docker-compose logs -f api
docker-compose logs -f trpc

# Reconstruire une image
docker-compose build --no-cache api

# Accéder à un container
docker exec -it in-spectra-api sh
docker exec -it in-spectra-db psql -U api_user -d in_spectra

# Nettoyer les volumes (⚠️ DANGER: efface les données)
docker-compose down -v
```

## Backup & Restore

### Backup

```bash
# Backup manuel
docker exec in-spectra-db pg_dump -U api_user in_spectra > backup.sql

# Backup automatique (cron)
0 2 * * * docker exec in-spectra-db pg_dump -U api_user in_spectra > /backups/in_spectra-$(date +\%Y\%m\%d).sql
```

### Restore

```bash
docker exec -i in-spectra-db psql -U api_user -d in_spectra < backup.sql
```

## Monitoring

```bash
# Voir les ressources utilisées
docker stats

# Voir les logs en temps réel
docker-compose logs -f --tail=100
```

## Mise à jour

```bash
# Pull dernières modifications
git pull origin main

# Rebuild et redémarrer
docker-compose up -d --build

# Ou restart sans rebuild
docker-compose restart
```

## Dépannage

### Les services ne démarrent pas

```bash
# Vérifier les logs
docker-compose logs

# Vérifier la santé
docker-compose ps
```

### La base de données ne démarre pas

```bash
# Vérifier les permissions
ls -la ./postgres_data

# Supprimer et recréer
docker-compose down -v
docker-compose up -d
```

### Nginx ne démarre pas

```bash
# Vérifier la config
docker exec in-spectra-nginx nginx -t

# Vérifier les certificats SSL
ls -la /etc/letsencrypt/live/api.in-spectra.com/
```

## Variables d'environnement

Créer un fichier `.env` à la racine :

```env
DATABASE_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret
DATABASE_SSL=false
EXPO_PUBLIC_API_BASE_URL=https://api.in-spectra.com
```

## Ports

- `3000` : Hono/TRPC API
- `4000` : Fastify API + Web Frontend
- `5432` : PostgreSQL
- `80` : HTTP (redirect vers HTTPS)
- `443` : HTTPS

## Sécurité

- Les certificats SSL sont montés depuis `/etc/letsencrypt`
- Les mots de passe sont dans `.env` (ne pas commit)
- Les uploads sont persistés dans `./uploads`
- La base de données est persistée dans un volume Docker

## Production

Pour un déploiement production :

1. Configurer les certificats SSL
2. Mettre à jour `.env` avec les secrets de production
3. Activer les backups automatiques
4. Configurer un monitoring (Portainer, Grafana, etc.)
