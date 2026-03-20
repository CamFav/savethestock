# SaveTheStock

Application web SaaS de gestion de stocks destinée aux restaurants.

## Stack

- `frontend/`: React + Vite
- `backend/`: ASP.NET Core + PostgreSQL
- `compose.yaml`: environnement Docker de développement
- `compose.production.yaml`: déploiement production avec images prébuildées

## Lancer le projet en local avec Docker

1. Copiez `.env.example` vers `.env`
2. Ajustez les variables si nécessaire
3. Lancez:

```bash
docker compose up --build
```

Accès local:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8080`
- Healthcheck: `http://localhost:8080/health`
- PostgreSQL: `localhost:5432`

## Développement

- Le frontend tourne dans un conteneur Vite avec hot reload
- Le backend tourne avec `dotnet watch`
- La base PostgreSQL est persistée dans un volume Docker

## Build des images

```bash
docker build -t savethestock-frontend ./frontend
docker build -t savethestock-backend ./backend
```

## Déploiement production

Le déploiement production repose sur `compose.production.yaml` et des images publiées dans un registre Docker, par défaut GHCR.

Sur le serveur:

1. Préparez un `.env` avec les variables de prod
2. Connectez-vous au registre Docker
3. Lancez:

```bash
docker compose -f compose.production.yaml pull
docker compose -f compose.production.yaml up -d
```

## CI/CD GitHub Actions

- `ci.yml`: lint, tests, build applicatif et build Docker sur `push` et `pull_request`
- `cd.yml`: build, push des images et déploiement via SSH sur `push` vers `main`

Secrets GitHub à prévoir:

- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_SSH_KEY`
- `DEPLOY_PATH`
- `GHCR_USERNAME`
- `GHCR_TOKEN`
- `PROD_POSTGRES_DB`
- `PROD_POSTGRES_USER`
- `PROD_POSTGRES_PASSWORD`
- `PROD_JWT_SECRET`
- `PROD_APP_ORIGIN`
