# Quick Start Guide

## Installation rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Démarrer le serveur
npm start
```

Le serveur démarre sur http://localhost:7000

## Tester l'add-on

### Manifest
```bash
curl http://localhost:7000/manifest.json
```

### Sous-titres pour un film
```bash
curl http://localhost:7000/subtitles/movie/tt0111161.json
```

### Sous-titres pour une série
```bash
curl http://localhost:7000/subtitles/series/tt0903747:1:1.json
```

## Installer dans Stremio

1. Ouvrir Stremio
2. Aller dans "Addons"
3. Cliquer sur "Community Addons"
4. Coller l'URL : `http://localhost:7000/manifest.json`
5. Cliquer sur "Install"

## Développement

```bash
# Mode développement avec rechargement automatique
npm run dev
```

## Fichier principal à compléter

**src/services/libre-subs-scraper.js**

C'est le seul fichier qui nécessite une implémentation complète. Voir INSTRUCTIONS_FR.md pour plus de détails.

## Structure des endpoints

### GET /manifest.json
Retourne le manifeste de l'add-on

### GET /subtitles/:type/:id.json
- `:type` = "movie" ou "series"
- `:id` = ID IMDB (ex: "tt0111161")
- Pour les séries : `:id` = "tt0903747:1:1" (ID:saison:épisode)

## Prochaines étapes

1. ✅ Projet configuré
2. ⚠️ Analyser libre-subs.fifthwit.net
3. ⚠️ Implémenter scrapeSubtitles()
4. ⚠️ Tester avec vrais contenus
5. ⚠️ Déployer

## Aide

Voir README.md et INSTRUCTIONS_FR.md pour la documentation complète.
