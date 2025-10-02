const axios = require('axios');

const BASE_URL = 'https://libre-subs.fifthwit.net';
const SEARCH_ENDPOINT = `${BASE_URL}/search`;
const REQUEST_TIMEOUT = 10000;
const USER_AGENT = 'LibreSubtitlesStremio/1.0 (+https://libre-subs.fifthwit.net)';

const LANGUAGE_OVERRIDES = {
  pb: 'pt',
  'pt-br': 'pt',
  'pt_br': 'pt',
  por: 'pt',
  eng: 'en',
  enus: 'en',
  enuk: 'en',
  fre: 'fr',
  fra: 'fr',
  ger: 'de',
  deu: 'de',
  spa: 'es',
  esp: 'es',
  ita: 'it',
  rum: 'ro'
};

const LANGUAGE_NAME_MAP = {
  english: 'en',
  'english (us)': 'en',
  'english (uk)': 'en',
  spanish: 'es',
  'spanish (la)': 'es',
  french: 'fr',
  german: 'de',
  portuguese: 'pt',
  'portuguese (br)': 'pt',
  italian: 'it',
  dutch: 'nl',
  polish: 'pl',
  russian: 'ru',
  arabic: 'ar',
  turkish: 'tr',
  swedish: 'sv',
  danish: 'da',
  norwegian: 'no',
  finnish: 'fi',
  romanian: 'ro',
  hungarian: 'hu',
  bulgarian: 'bg',
  croatian: 'hr',
  serbian: 'sr',
  greek: 'el',
  czech: 'cs',
  slovak: 'sk',
  slovenian: 'sl',
  hebrew: 'he',
  japanese: 'ja',
  chinese: 'zh',
  korean: 'ko',
  indonesian: 'id',
  malay: 'ms',
  thai: 'th',
  vietnamese: 'vi'
};

const FALLBACK_LANGUAGE = 'en';

function normalizeLanguage(code, display) {
  const normalizedCode = (code || '').toLowerCase();

  if (normalizedCode && LANGUAGE_OVERRIDES[normalizedCode]) {
    return LANGUAGE_OVERRIDES[normalizedCode];
  }

  if (normalizedCode && /^[a-z]{2}$/.test(normalizedCode)) {
    return normalizedCode;
  }

  if (normalizedCode && /^[a-z]{2}-[a-z]{2}$/.test(normalizedCode)) {
    return normalizedCode.split('-')[0];
  }

  if (display) {
    const normalizedDisplay = display.toLowerCase().trim();

    if (LANGUAGE_NAME_MAP[normalizedDisplay]) {
      return LANGUAGE_NAME_MAP[normalizedDisplay];
    }

    const baseName = normalizedDisplay.split('(')[0].trim();
    if (LANGUAGE_NAME_MAP[baseName]) {
      return LANGUAGE_NAME_MAP[baseName];
    }
  }

  if (normalizedCode && /^[a-z]{2,}/.test(normalizedCode)) {
    return normalizedCode.slice(0, 2);
  }

  return FALLBACK_LANGUAGE;
}

function extractBaseId(rawId) {
  if (!rawId) {
    return '';
  }

  const trimmed = rawId.trim();

  const imdbMatch = trimmed.match(/^(tt\d+)/i);
  if (imdbMatch) {
    return imdbMatch[1];
  }

  const tmdbMatch = trimmed.match(/^tmdb:(\d+)/i);
  if (tmdbMatch) {
    return tmdbMatch[1];
  }

  if (trimmed.includes(':')) {
    const [firstSegment, ...rest] = trimmed.split(':');

    if (firstSegment.toLowerCase() === 'tmdb' && rest.length) {
      return rest[0];
    }

    const firstMatch = firstSegment.match(/^(tt\d+)/i);
    if (firstMatch) {
      return firstMatch[1];
    }

    return extractBaseId(firstSegment);
  }

  if (/^\d+$/.test(trimmed)) {
    return trimmed;
  }

  return '';
}

function sanitizeNumber(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const numeric = parseInt(String(value).trim(), 10);
  if (Number.isNaN(numeric)) {
    return undefined;
  }

  return numeric;
}

function parseSeasonEpisode(rawId, season, episode) {
  let resultSeason = sanitizeNumber(season);
  let resultEpisode = sanitizeNumber(episode);

  if ((resultSeason === undefined || resultEpisode === undefined) && rawId && rawId.includes(':')) {
    const parts = rawId.split(':');
    if (parts.length >= 3) {
      if (resultSeason === undefined) {
        resultSeason = sanitizeNumber(parts[parts.length - 2]);
      }
      if (resultEpisode === undefined) {
        resultEpisode = sanitizeNumber(parts[parts.length - 1]);
      }
    }
  }

  return { season: resultSeason, episode: resultEpisode };
}

function buildSearchParams({ type, id, season, episode, preferences = {} }) {
  const baseId = extractBaseId(id);
  if (!baseId) {
    return null;
  }

  const params = { id: baseId };

  const prefLangs = Array.isArray(preferences.languages) ? preferences.languages.filter(Boolean) : [];
  if (prefLangs.length === 1) {
    params.language = prefLangs[0];
  }

  const prefFormats = Array.isArray(preferences.formats) ? preferences.formats.filter(Boolean) : [];
  if (prefFormats.length === 1) {
    params.format = prefFormats[0];
  }

  if (type === 'series') {
    const parsed = parseSeasonEpisode(id, season, episode);
    if (parsed.season !== undefined) {
      params.season = parsed.season;
    }
    if (parsed.episode !== undefined) {
      params.episode = parsed.episode;
    }
  }

  return params;
}

function createSubtitleEntry(item) {
  if (!item || !item.url) {
    return null;
  }

  const lang = normalizeLanguage(item.language, item.display);
  const fullUrl = item.url.startsWith('http') ? item.url : `${BASE_URL}${item.url}`;
  const subtitleId = item.id ? `libre-subs-${item.id}` : `libre-subs-${Buffer.from(fullUrl).toString('base64').slice(0, 16)}`;
  const format = (item.format || '').toLowerCase();
  const source = (item.source || '').toLowerCase();
  const displayName = item.display || item.language || '';

  return {
    id: subtitleId,
    url: fullUrl,
    lang,
    format,
    source,
    displayName,
    encoding: item.encoding || null,
    isHearingImpaired: Boolean(item.isHearingImpaired)
  };
}

/**
 * Scrape subtitles from libre-subs.fifthwit.net
 * @param {Object} params - Search parameters
 * @param {string} params.type - Content type (movie or series)
 * @param {string} params.id - Content ID (IMDB or TMDB)
 * @param {string|number} [params.season] - Season number for series
 * @param {string|number} [params.episode] - Episode number for series
 * @returns {Promise<Array>} Array of subtitle objects
 */
async function scrapeSubtitles({ type, id, season, episode, preferences = {} }) {
  const searchParams = buildSearchParams({ type, id, season, episode, preferences });

  if (!searchParams) {
    console.warn('Unable to build search parameters for subtitle request', { type, id, season, episode });
    return [];
  }

  try {
    const response = await axios.get(SEARCH_ENDPOINT, {
      params: searchParams,
      timeout: REQUEST_TIMEOUT,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json'
      },
      validateStatus: (status) => status >= 200 && status < 500
    });

    if (response.status >= 400) {
      console.warn('libre-subs returned non-success status', { status: response.status, params: searchParams });
      return [];
    }

    const payload = Array.isArray(response.data) ? response.data : response.data && Array.isArray(response.data.results) ? response.data.results : [];

    if (!Array.isArray(payload)) {
      console.warn('Unexpected response structure from libre-subs', { type: typeof response.data });
      return [];
    }

    const subtitles = payload.map(createSubtitleEntry).filter(Boolean);

    return subtitles;
  } catch (error) {
    console.error('Scraping error:', error.message);
    throw error;
  }
}

/**
 * Helper function to parse IMDB ID from various formats
 * @param {string} id - Content ID
 * @returns {string} Clean IMDB ID
 */
function parseImdbId(id) {
  const match = id.match(/^(tt\d+)/);
  return match ? match[1] : id;
}

/**
 * Helper function to construct search query
 * @param {Object} params - Search parameters
 * @returns {string} Search query string
 */
function buildSearchQuery({ type, id, season, episode }) {
  const imdbId = parseImdbId(id);
  let query = imdbId;

  if (type === 'series' && season && episode) {
    query += ` S${season.toString().padStart(2, '0')}E${episode.toString().padStart(2, '0')}`;
  }

  return query;
}

module.exports = {
  scrapeSubtitles,
  parseImdbId,
  buildSearchQuery
};


