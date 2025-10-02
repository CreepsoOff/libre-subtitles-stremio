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

function applyPreferences(subtitles, preferences, maxResults = 5) {
  if (!Array.isArray(subtitles) || !subtitles.length) {
    return [];
  }

  const normalizedLangs = preferences.languages.map((lang) => lang.toLowerCase());
  const enforceStrict = preferences.strictLanguages && normalizedLangs.length;

  const languageMatches = normalizedLangs.length
    ? subtitles.filter((item) => normalizedLangs.includes((item.lang || '').toLowerCase()))
    : [...subtitles];

  let ordered = [...languageMatches];

  if (!preferences.includeHearingImpaired) {
    const nonHearing = ordered.filter((item) => !item.isHearingImpaired);
    if (nonHearing.length) {
      ordered = nonHearing;
      if (nonHearing.length < maxResults) {
        const hearingExtras = languageMatches.filter((item) => item.isHearingImpaired && !nonHearing.includes(item));
        ordered = ordered.concat(hearingExtras);
      }
    } else if (!enforceStrict) {
      ordered = languageMatches;
    } else {
      ordered = nonHearing;
    }
  }

  if (preferences.formats.length) {
    const formatSet = new Set(preferences.formats.map((fmt) => fmt.toLowerCase()));
    const filtered = ordered.filter((item) => item.format && formatSet.has(item.format));
    if (filtered.length || !enforceStrict) {
      ordered = filtered.length ? filtered : ordered;
    } else {
      ordered = filtered;
    }
  }

  if (preferences.sources.length) {
    const sourceSet = new Set(preferences.sources.map((src) => src.toLowerCase()));
    const filtered = ordered.filter((item) => item.source && sourceSet.has(item.source));
    if (filtered.length || !enforceStrict) {
      ordered = filtered.length ? filtered : ordered;
    } else {
      ordered = filtered;
    }
  }

  if (!ordered.length && normalizedLangs.length) {
    ordered = languageMatches;
  }

  if (preferences.preferHearingImpaired && preferences.includeHearingImpaired) {
    const hearing = ordered.filter((item) => item.isHearingImpaired);
    const regular = ordered.filter((item) => !item.isHearingImpaired);
    ordered = hearing.concat(regular);
  }

  const seen = new Set();
  const deduped = [];
  for (const item of ordered) {
    if (!item || !item.id || !item.url) continue;
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    deduped.push(item);
  }

  const finalList = maxResults ? deduped.slice(0, maxResults) : deduped;
  return finalList;
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
      episode: extra.episode,
      preferences
    });

    let filtered = applyPreferences(subtitles, preferences, 5);
    if (!filtered.length && preferences.strictLanguages) {
      filtered = applyPreferences(subtitles, { ...preferences, strictLanguages: false }, 5);
    }

    console.log(`Returning ${filtered.length} subtitle(s) for ${type} ${id}`);

    return {
      subtitles: filtered.map(({ id: subtitleId, url, lang, format, source }) => ({
        id: subtitleId,
        url,
        lang,
        ...(format ? { format } : {}),
        ...(source ? { source } : {})
      }))
    };
  } catch (error) {
    console.error('Error fetching subtitles:', error.message);
    return { subtitles: [] };
  }
}

module.exports = { handleSubtitles };
