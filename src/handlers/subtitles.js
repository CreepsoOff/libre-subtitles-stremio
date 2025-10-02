const { scrapeSubtitles } = require('../services/libre-subs-scraper');

/**
 * Handle subtitle requests from Stremio
 * @param {Object} args - Arguments from Stremio
 * @param {string} args.type - Content type (movie or series)
 * @param {string} args.id - Content ID (e.g., tt1234567 for IMDB)
 * @param {Object} args.extra - Extra parameters (e.g., season, episode)
 * @returns {Promise<Object>} Subtitle results
 */
async function handleSubtitles(args) {
  const { type, id, extra = {} } = args;
  
  console.log(`Fetching subtitles for ${type} ${id}`, extra);
  
  try {
    // Scrape subtitles from libre-subs.fifthwit.net
    const subtitles = await scrapeSubtitles({
      type,
      id,
      season: extra.season,
      episode: extra.episode
    });
    
    return { subtitles };
  } catch (error) {
    console.error('Error fetching subtitles:', error.message);
    return { subtitles: [] };
  }
}

module.exports = { handleSubtitles };
