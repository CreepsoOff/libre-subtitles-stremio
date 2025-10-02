# Instructions pour ChatGPT Codex

Ce document fournit des instructions détaillées pour implémenter le scraper de sous-titres pour libre-subs.fifthwit.net.

## Structure du Projet

Le projet est un add-on Stremio qui utilise le SDK officiel. La structure est la suivante :

### Fichiers principaux

1. **src/index.js** : Point d'entrée qui démarre le serveur HTTP
2. **src/addon.js** : Configuration de l'add-on et définition des handlers
3. **src/manifest.js** : Manifeste Stremio (métadonnées de l'add-on)
4. **src/handlers/subtitles.js** : Handler qui traite les requêtes de sous-titres
5. **src/services/libre-subs-scraper.js** : ⚠️ FICHIER À IMPLÉMENTER - logique de scraping

## Tâches à accomplir

### 1. Analyser le site libre-subs.fifthwit.net

Avant d'implémenter le scraper, il faut comprendre :
- La structure des URLs (recherche, résultats, téléchargement)
- Les sélecteurs CSS/HTML pour extraire les données
- Le format des identifiants (IMDB, TMDB, etc.)
- Les langues disponibles et leur format
- Les restrictions éventuelles (rate limiting, authentification, etc.)

### 2. Implémenter la fonction scrapeSubtitles()

Localisation : `src/services/libre-subs-scraper.js`

La fonction doit :

```javascript
async function scrapeSubtitles({ type, id, season, episode }) {
  // 1. Construire l'URL de recherche
  //    - Utiliser l'ID IMDB (format: tt1234567)
  //    - Pour les séries: inclure saison et épisode
  
  // 2. Faire une requête HTTP à libre-subs.fifthwit.net
  //    - Utiliser axios (déjà installé)
  //    - Gérer les erreurs et timeouts
  
  // 3. Parser la réponse (HTML ou JSON)
  //    - Extraire la liste des sous-titres disponibles
  //    - Pour chaque sous-titre, récupérer :
  //      * ID unique
  //      * URL de téléchargement
  //      * Code de langue (ISO 639-1)
  
  // 4. Retourner un tableau d'objets au format Stremio
  return [
    {
      id: 'unique-id',
      url: 'https://direct-download-url',
      lang: 'en'
    }
  ];
}
```

### 3. Format des objets de sous-titres

Chaque sous-titre doit avoir cette structure :

```javascript
{
  id: string,      // Identifiant unique (ex: "libre-subs-123456")
  url: string,     // URL de téléchargement direct du fichier .srt ou .vtt
  lang: string     // Code langue ISO 639-1 (en, fr, es, etc.)
}
```

### 4. Gestion des types de contenu

#### Films (type: 'movie')
- ID : généralement au format IMDB (tt1234567)
- Recherche simple par ID

#### Séries TV (type: 'series')
- ID : format IMDB avec saison/épisode (tt0903747:1:1)
- Paramètres supplémentaires : season et episode
- Format de recherche suggéré : "tt0903747 S01E01"

### 5. Bibliothèques disponibles

Le projet inclut déjà :
- **axios** : pour les requêtes HTTP
- **stremio-addon-sdk** : SDK officiel Stremio

Bibliothèques recommandées à ajouter si nécessaire :
- **cheerio** : pour parser le HTML (comme jQuery côté serveur)
- **jsdom** : alternative à cheerio pour DOM complet
- **node-fetch** : alternative à axios

Installation : `npm install cheerio`

### 6. Exemple d'implémentation (pseudo-code)

```javascript
const axios = require('axios');
const cheerio = require('cheerio'); // À installer si nécessaire

async function scrapeSubtitles({ type, id, season, episode }) {
  // Nettoyer l'ID IMDB
  const imdbId = parseImdbId(id);
  
  // Construire la requête de recherche
  const searchQuery = buildSearchQuery({ type, id: imdbId, season, episode });
  
  // URL de recherche sur libre-subs
  const searchUrl = `${BASE_URL}/search?q=${encodeURIComponent(searchQuery)}`;
  
  // Effectuer la requête
  const response = await axios.get(searchUrl, {
    timeout: 10000,
    headers: {
      'User-Agent': 'Stremio-LibreSubtitles/1.0'
    }
  });
  
  // Parser le HTML avec cheerio
  const $ = cheerio.load(response.data);
  const subtitles = [];
  
  // Extraire les sous-titres (adapter les sélecteurs CSS)
  $('.subtitle-item').each((i, elem) => {
    const id = $(elem).attr('data-id');
    const downloadUrl = $(elem).find('.download-link').attr('href');
    const lang = $(elem).find('.language').text().toLowerCase();
    
    subtitles.push({
      id: `libre-subs-${id}`,
      url: new URL(downloadUrl, BASE_URL).href,
      lang: mapLanguageCode(lang)
    });
  });
  
  return subtitles;
}

// Helper pour mapper les noms de langues vers codes ISO
function mapLanguageCode(language) {
  const map = {
    'english': 'en',
    'french': 'fr',
    'spanish': 'es',
    'german': 'de',
    // ... ajouter d'autres langues
  };
  return map[language.toLowerCase()] || language;
}
```

### 7. Tests et Débogage

Pour tester le scraper :

```bash
# Démarrer le serveur
npm start

# Dans un autre terminal, tester les endpoints
curl http://localhost:7000/manifest.json
curl http://localhost:7000/subtitles/movie/tt0111161.json
curl http://localhost:7000/subtitles/series/tt0903747:1:1.json
```

Ajouter des logs pour déboguer :
```javascript
console.log('Search URL:', searchUrl);
console.log('Found subtitles:', subtitles.length);
```

### 8. Bonnes pratiques

1. **Respect du site** :
   - Ajouter un User-Agent identifiable
   - Implémenter un rate limiting si nécessaire
   - Mettre en cache les résultats
   - Respecter robots.txt

2. **Gestion d'erreurs** :
   - Try/catch autour des requêtes HTTP
   - Retourner un tableau vide en cas d'erreur
   - Logger les erreurs pour le débogage

3. **Performance** :
   - Utiliser des timeouts raisonnables
   - Limiter le nombre de requêtes concurrentes
   - Considérer un système de cache

4. **Codes de langues** :
   - Utiliser ISO 639-1 (codes à 2 lettres)
   - Mapper les noms de langues vers les codes
   - Gérer les variantes (pt-BR, en-US, etc.)

### 9. Déploiement

Une fois implémenté et testé localement :

1. **Push vers GitHub** : Les changements sont automatiquement poussés
2. **Déployer sur un service cloud** :
   - Heroku (gratuit avec limitations)
   - Railway (simple, gratuit pour démarrer)
   - Render (gratuit tier disponible)
   - DigitalOcean App Platform

3. **Installer dans Stremio** :
   - Utiliser l'URL publique : `https://your-app.com/manifest.json`

### 10. Ressources

- [Stremio Addon SDK](https://github.com/Stremio/stremio-addon-sdk)
- [Stremio Addon Examples](https://github.com/Stremio/stremio-addon-sdk/tree/master/docs/examples)
- [Cheerio Documentation](https://cheerio.js.org/)
- [Axios Documentation](https://axios-http.com/)

## Résumé des étapes

1. ✅ Structure du projet créée
2. ✅ Dépendances installées
3. ✅ Serveur fonctionnel
4. ⚠️ **À FAIRE** : Implémenter `scrapeSubtitles()` dans `src/services/libre-subs-scraper.js`
5. ⚠️ **À FAIRE** : Tester avec des films et séries réels
6. ⚠️ **À FAIRE** : Déployer en production

## Contact

Pour toute question ou problème, consulter la documentation Stremio ou ouvrir une issue sur GitHub.
