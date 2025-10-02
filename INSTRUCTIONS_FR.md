# Instructions pour ChatGPT Codex

## Mise à jour

Le projet est désormais fonctionnel :

- le scraping de Libre Subs est implémenté (`src/services/libre-subs-scraper.js`)
- les filtres basés sur la configuration Stremio sont actifs (`src/handlers/subtitles.js`)
- une interface web moderne est disponible sur `http://localhost:7000/`

Ce document sert de mémo si vous souhaitez modifier, étendre ou dépanner l’add-on.

## Structure résumée

1. **src/index.js** : serveur Express qui sert l’interface web et monte le routeur Stremio (`getRouter`).
2. **src/addon.js** : construction de l’add-on Stremio (manifest + handlers).
3. **src/handlers/subtitles.js** : lecture de la config utilisateur et filtrage des sous-titres.
4. **src/services/libre-subs-scraper.js** : appels HTTP vers Libre Subs + normalisation des résultats.
5. **public/** : interface de configuration (HTML/CSS/JS) qui génère les liens d’installation.

## Personnalisation du scraping

La fonction `scrapeSubtitles({ type, id, season, episode })` :

1. Analyse l’identifiant (IMDB/TMDB) et construit les paramètres d’appel (`id`, `season`, `episode`).
2. Envoie une requête `GET https://libre-subs.fifthwit.net/search` avec `axios`.
3. Normalise chaque entrée (langue ISO 639-1, format, source, indicateur malentendants, etc.).
4. Retourne un tableau d’objets enrichis (utilisés ensuite pour filtrer avant d’être renvoyés à Stremio).

Pour ajuster :
- Modifier `LANGUAGE_OVERRIDES` ou `LANGUAGE_NAME_MAP` si de nouveaux codes apparaissent.
- Adapter la logique de `buildSearchParams` si Libre Subs change son API.
- Ajouter un mécanisme de cache en enveloppant l’appel HTTP (`axios.get`).

## Logique de filtrage (handler)

`handleSubtitles(args)` reçoit `config` lorsque l’utilisateur installe l’add-on via un lien contenant un JSON.

- `normalizeConfig` nettoie et valide les préférences (langues, formats, sources, options « hearing impaired »).
- `applyPreferences` applique les filtres, réordonne ou supprime les entrées selon les choix.
- La réponse finale ne renvoie à Stremio que `id`, `url`, `lang` (les métadonnées supplémentaires restent internes).

Pour ajouter un nouveau filtre :
1. Étendre la configuration côté UI (`public/app.js`).
2. Ajuster `normalizeConfig` pour lire l’option.
3. Modifier `applyPreferences` pour utiliser l’information.

## Interface web

`public/index.html`, `styles.css`, `app.js` fournissent :

- un sélecteur de langues multi-choix avec mode strict
- des filtres formats & sources (boutons « chips »)
- deux options pour les sous-titres malentendants (exclure / prioriser)
- un copier-coller d’URL HTTP et un lien `stremio://` dynamique
- un aperçu JSON de la configuration générée

Points d’extension :
- Ajouter d’autres sources ou formats dans les constantes `SOURCE_OPTIONS` et `FORMAT_OPTIONS`.
- Inclure des préréglages (ex. « Netflix style ») en insérant des boutons qui remplissent `state`.
- Localiser le texte en anglais/espagnol via un petit dictionnaire JS.

## Tests

```bash
npm start                     # lance le serveur et l’UI
curl http://localhost:7000/manifest.json
curl "http://localhost:7000/subtitles/movie/tt0111161.json"
```

Tests Node.js rapides :

```javascript
const { handleSubtitles } = require('./src/handlers/subtitles');
handleSubtitles({
  type: 'movie',
  id: 'tt3659388',
  config: { preferences: { languages: ['fr'], strictLanguages: true } }
}).then(console.log).catch(console.error);
```

## Déploiement

1. Construire une image Docker ou déployer via `node src/index.js` (Render, Railway, Fly…)
2. Exposer le port TCP et autoriser le trafic HTTP vers `/` et `/manifest.json`.
3. Configurer un reverse proxy/TLS si nécessaire (l’UI fonctionne sur HTTPS sans adaptations spécifiques).

## Bonnes pratiques

- Respecter Libre Subs : limiter la fréquence des requêtes, mettre en cache si l’add-on devient public.
- Gérer les erreurs : `scrapeSubtitles` retourne un tableau vide et journalise les problèmes.
- Mettre à jour la liste des sources/formats si de nouveaux fournisseurs apparaissent.
- Tenir la documentation (`README`, `QUICKSTART`) synchronisée après chaque évolution majeure.

Avec ces informations, vous pouvez facilement ajuster le comportement du scraper, enrichir les filtres ou adapter l’interface selon vos besoins.
