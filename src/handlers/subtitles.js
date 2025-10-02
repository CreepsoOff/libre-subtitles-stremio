const { scrapeSubtitles } = require('../services/libre-subs-scraper');

function normalizeConfig(config) {
  if (!config || typeof config !== 'object') {
    return {
      languages: [],
      strictLanguages: false,
      includeHearingImpaired: true,
      preferHearingImpaired: false,
      formats: [],
      sources: []
    };
  }

  const rawPrefs = typeof config.preferences === 'object' ? config.preferences : config;

  const toArray = (value) => {
    if (!Array.isArray(value)) return [];
    return value
      .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
      .filter(Boolean);
  };

  const languages = toArray(rawPrefs.languages)
    .map((lang) => lang.toLowerCase().slice(0, 5))
    .map((lang) => lang.includes('-') ? lang.split('-')[0] : lang)
    .filter(Boolean);

  const formats = toArray(rawPrefs.formats).map((fmt) => fmt.toLowerCase());
  const sources = toArray(rawPrefs.sources).map((src) => src.toLowerCase());

  const includeHearingImpaired = rawPrefs.includeHearingImpaired !== false;
  const preferHearingImpaired = includeHearingImpaired && !!rawPrefs.preferHearingImpaired;

  return {
    languages,
    strictLanguages: !!rawPrefs.strictLanguages,
    includeHearingImpaired,
    preferHearingImpaired,
    formats,
    sources
  };
}

function applyPreferences(subtitles, preferences) {
  if (!Array.isArray(subtitles) || !subtitles.length) {
    return [];
  }

  let results = [...subtitles];

  if (preferences.formats.length) {
    results = results.filter((item) => {
      return item.format ? preferences.formats.includes(item.format) : false;
    });
  }

  if (preferences.sources.length) {
    results = results.filter((item) => {
      return item.source ? preferences.sources.includes(item.source) : false;
    });
  }

  if (!preferences.includeHearingImpaired) {
    results = results.filter((item) => !item.isHearingImpaired);
  }

  if (preferences.languages.length) {
    const preferred = results.filter((item) => preferences.languages.includes((item.lang || '').toLowerCase()));
    if (preferences.strictLanguages) {
      results = preferred;
    } else if (preferred.length) {
      const others = results.filter((item) => !preferences.languages.includes((item.lang || '').toLowerCase()));
      results = preferred.concat(others);
    }
  }

  if (preferences.preferHearingImpaired && preferences.includeHearingImpaired) {
    const hearing = results.filter((item) => item.isHearingImpaired);
    const regular = results.filter((item) => !item.isHearingImpaired);
    results = hearing.concat(regular);
  }

  const seen = new Set();
  return results.filter((item) => {
    if (!item || !item.id || !item.url) return false;
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

/**
 * Handle subtitle requests from Stremio
 * @param {Object} args - Arguments from Stremio
 * @param {string} args.type - Content type (movie or series)
 * @param {string} args.id - Content ID (e.g., tt1234567 for IMDB)
 * @param {Object} args.extra - Extra parameters (e.g., season, episode)
 * @param {Object} [args.config] - User configuration passed from install URL
 * @returns {Promise<Object>} Subtitle results
 */
async function handleSubtitles(args) {
  const { type, id, extra = {}, config } = args;
  const preferences = normalizeConfig(config);

  console.log(`Fetching subtitles for ${type} ${id}`, {
    season: extra.season,
    episode: extra.episode,
    preferences
  });

  try {
    const subtitles = await scrapeSubtitles({
      type,
      id,
      season: extra.season,
      episode: extra.episode
    });

    const filtered = applyPreferences(subtitles, preferences);

    return {
      subtitles: filtered.map(({ id: subtitleId, url, lang }) => ({ id: subtitleId, url, lang }))
    };
  } catch (error) {
    console.error('Error fetching subtitles:', error.message);
    return { subtitles: [] };
  }
}

module.exports = { handleSubtitles };
