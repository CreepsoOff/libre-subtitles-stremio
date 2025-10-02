# Guide de démarrage

## Installation rapide

```bash
npm install
npm start
```

Le serveur écoute par défaut sur [http://localhost:7000](http://localhost:7000).

## Interface web

- Ouvrez `http://localhost:7000/` pour accéder au configurateur.
- Sélectionnez vos langues, formats et sources préférées.
- Utilisez « Installer dans Stremio » ou copiez l’URL HTTP générée.

## Tests rapides

```bash
# Manifest
dev@pc$ curl http://localhost:7000/manifest.json

# Sous-titres film
dev@pc$ curl http://localhost:7000/subtitles/movie/tt0111161.json

# Sous-titres série (ID:Saison:Episode)
dev@pc$ curl "http://localhost:7000/subtitles/series/tt0903747:1:1.json"
```

## Installation dans Stremio

1. Démarrez l’add-on localement.
2. Générez un lien via l’interface web.
3. Dans Stremio : Addons → Community Addons → collez l’URL.

## Développement

```bash
npm run dev   # nodemon + rechargement
```

Le scraping est déjà implémenté (`src/services/libre-subs-scraper.js`). Vous pouvez adapter les filtres dans `src/handlers/subtitles.js` et personnaliser l’UI dans `public/`.

## Endpoints disponibles

- `GET /` — Interface de configuration
- `GET /manifest.json` — Manifeste Stremio
- `GET /subtitles/:type/:id.json` — Flux de sous-titres (params `season`, `episode`)
- `GET /health` — Sonde de santé

## Besoin d’aide ?

Consultez `README.md` pour la documentation détaillée ainsi que `INSTRUCTIONS_FR.md` pour les notes historiques.
