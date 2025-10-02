/**
 * EXAMPLE IMPLEMENTATION GUIDE
 * 
 * This file shows how to implement the scraping logic using cheerio.
 * This is NOT production code but a guide for ChatGPT to understand the pattern.
 */

// First, install cheerio if you need HTML parsing:
// npm install cheerio

const axios = require('axios');
const cheerio = require('cheerio'); // Only if you need HTML parsing

const BASE_URL = 'https://libre-subs.fifthwit.net';

/**
 * Example implementation of scrapeSubtitles
 * 
 * Steps to implement:
 * 1. Visit https://libre-subs.fifthwit.net and analyze the site structure
 * 2. Identify how to search for subtitles (search endpoint, URL patterns)
 * 3. Identify CSS selectors to extract subtitle information
 * 4. Build the scraping logic
 */
async function scrapeSubtitlesExample({ type, id, season, episode }) {
  try {
    // Step 1: Parse the IMDB ID
    const imdbId = parseImdbId(id);
    
    // Step 2: Build search query (e.g., "tt0111161" or "tt0903747 S01E01")
    const searchQuery = buildSearchQuery({ type, id: imdbId, season, episode });
    
    // Step 3: Construct search URL
    // This is an EXAMPLE - you need to check the actual URL pattern
    const searchUrl = `${BASE_URL}/search?q=${encodeURIComponent(searchQuery)}`;
    
    console.log('Searching:', searchUrl);
    
    // Step 4: Make HTTP request
    const response = await axios.get(searchUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Stremio-LibreSubtitles/1.0',
        'Accept': 'text/html,application/json'
      }
    });
    
    // Step 5: Parse the response
    // If the response is JSON:
    // const data = response.data;
    // const subtitles = data.results.map(item => ({
    //   id: `libre-subs-${item.id}`,
    //   url: item.download_url,
    //   lang: item.language_code
    // }));
    
    // If the response is HTML:
    const $ = cheerio.load(response.data);
    const subtitles = [];
    
    // Example: Extract subtitles from HTML
    // IMPORTANT: These CSS selectors are EXAMPLES - inspect the actual site!
    $('.subtitle-item').each((index, element) => {
      const $elem = $(element);
      
      // Extract subtitle information
      // Adjust these selectors based on the actual HTML structure
      const subtitleId = $elem.attr('data-id') || index;
      const downloadLink = $elem.find('a.download').attr('href');
      const languageName = $elem.find('.language').text().trim();
      
      // Skip if essential data is missing
      if (!downloadLink) return;
      
      // Convert language name to ISO code
      const langCode = mapLanguageToCode(languageName);
      
      // Build full URL if needed
      const fullUrl = downloadLink.startsWith('http') 
        ? downloadLink 
        : new URL(downloadLink, BASE_URL).href;
      
      subtitles.push({
        id: `libre-subs-${subtitleId}`,
        url: fullUrl,
        lang: langCode
      });
    });
    
    console.log(`Found ${subtitles.length} subtitles`);
    return subtitles;
    
  } catch (error) {
    console.error('Scraping error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
}

/**
 * Helper: Parse IMDB ID from Stremio format
 * Examples:
 * - "tt0111161" -> "tt0111161"
 * - "tt0903747:1:1" -> "tt0903747"
 */
function parseImdbId(id) {
  const match = id.match(/^(tt\d+)/);
  return match ? match[1] : id;
}

/**
 * Helper: Build search query string
 */
function buildSearchQuery({ type, id, season, episode }) {
  const imdbId = parseImdbId(id);
  let query = imdbId;
  
  // For TV series, add season and episode
  if (type === 'series' && season && episode) {
    const s = season.toString().padStart(2, '0');
    const e = episode.toString().padStart(2, '0');
    query += ` S${s}E${e}`;
  }
  
  return query;
}

/**
 * Helper: Map language names to ISO 639-1 codes
 * Expand this based on languages available on libre-subs
 */
function mapLanguageToCode(languageName) {
  const languageMap = {
    'english': 'en',
    'anglais': 'en',
    'french': 'fr',
    'français': 'fr',
    'francais': 'fr',
    'spanish': 'es',
    'espagnol': 'es',
    'español': 'es',
    'german': 'de',
    'allemand': 'de',
    'italian': 'it',
    'italien': 'it',
    'portuguese': 'pt',
    'portugais': 'pt',
    'russian': 'ru',
    'russe': 'ru',
    'chinese': 'zh',
    'chinois': 'zh',
    'japanese': 'ja',
    'japonais': 'ja',
    'korean': 'ko',
    'coréen': 'ko',
    'arabic': 'ar',
    'arabe': 'ar',
    'dutch': 'nl',
    'néerlandais': 'nl',
    'polish': 'pl',
    'polonais': 'pl',
    'turkish': 'tr',
    'turc': 'tr',
    'swedish': 'sv',
    'suédois': 'sv',
    'danish': 'da',
    'danois': 'da',
    'norwegian': 'no',
    'norvégien': 'no',
    'finnish': 'fi',
    'finnois': 'fi',
    'greek': 'el',
    'grec': 'el',
    'czech': 'cs',
    'tchèque': 'cs',
    'romanian': 'ro',
    'roumain': 'ro',
    'hungarian': 'hu',
    'hongrois': 'hu',
    'hebrew': 'he',
    'hébreu': 'he',
    'hindi': 'hi',
  };
  
  const normalized = languageName.toLowerCase().trim();
  return languageMap[normalized] || 'en'; // Default to English if unknown
}

/**
 * ALTERNATIVE: If the site has an API
 * 
 * Some subtitle sites provide JSON APIs instead of HTML pages.
 * In that case, the implementation is simpler:
 */
async function scrapeSubtitlesFromAPI({ type, id, season, episode }) {
  try {
    const imdbId = parseImdbId(id);
    
    // Example API endpoint (not real)
    const apiUrl = `${BASE_URL}/api/subtitles`;
    
    const response = await axios.get(apiUrl, {
      params: {
        imdb_id: imdbId,
        type: type,
        season: season,
        episode: episode
      },
      timeout: 10000,
      headers: {
        'User-Agent': 'Stremio-LibreSubtitles/1.0'
      }
    });
    
    // Parse JSON response
    const data = response.data;
    
    // Map API response to Stremio format
    const subtitles = data.subtitles.map(sub => ({
      id: `libre-subs-${sub.id}`,
      url: sub.download_url,
      lang: sub.language
    }));
    
    return subtitles;
    
  } catch (error) {
    console.error('API error:', error.message);
    throw error;
  }
}

/**
 * TIPS FOR IMPLEMENTATION:
 * 
 * 1. Inspect the website first:
 *    - Use browser DevTools to see HTML structure
 *    - Check Network tab to see if there's an API
 *    - Look for patterns in URLs
 * 
 * 2. Handle errors gracefully:
 *    - Return empty array on errors (don't crash)
 *    - Log errors for debugging
 *    - Use timeouts to avoid hanging requests
 * 
 * 3. Respect the website:
 *    - Add appropriate User-Agent
 *    - Implement rate limiting if needed
 *    - Cache results to reduce requests
 *    - Check robots.txt
 * 
 * 4. Test thoroughly:
 *    - Test with movies
 *    - Test with TV series
 *    - Test with different languages
 *    - Test error cases (invalid IDs, network issues)
 * 
 * 5. Performance:
 *    - Use timeouts (10 seconds recommended)
 *    - Consider caching popular results
 *    - Handle multiple concurrent requests
 */

module.exports = {
  scrapeSubtitlesExample,
  scrapeSubtitlesFromAPI,
  parseImdbId,
  buildSearchQuery,
  mapLanguageToCode
};
