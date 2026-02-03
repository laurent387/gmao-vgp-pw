# In-Spectra Fastify API

## Fonctionnalités actuelles
- CRUD complet (GET, GET/:id, POST, PUT, DELETE) pour assets, missions, nonconformities, reports, users
- Import/export JSON pour chaque entité
- Pagination, tri, validation de schéma (TypeBox)

## Prochaines étapes
- Remplacer les TODOs par des requêtes SQL réelles (insert, update, delete)
- Ajouter l’authentification JWT (plugin fastify-jwt)
- Générer la documentation Swagger (plugin fastify-swagger)
- Ajouter la validation d’entrée avancée si besoin
- Ajouter la gestion des erreurs personnalisée

## Démarrage

```bash
cd fastify-backend
bun install
bun run server.ts
```

## Variables d’environnement
- Voir `.env.example`
