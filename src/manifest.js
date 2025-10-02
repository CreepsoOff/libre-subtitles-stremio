const manifest = {
  id: 'com.libresubtitles.stremio',
  version: '1.0.0',
  name: 'Libre Subtitles',
  description: 'Subtitles from libre-subs.fifthwit.net',
  
  // Resources provided by this addon
  resources: ['subtitles'],
  
  // Content types supported
  types: ['movie', 'series'],
  
  // ID prefixes supported (e.g., IMDB, TMDB)
  idPrefixes: ['tt', 'tmdb'],
  
  // Catalog configuration (none for subtitles-only addon)
  catalogs: [],
  
  // Additional metadata
  behaviorHints: {
    configurable: false,
    configurationRequired: false
  },
  
  // Contact information
  contactEmail: ''
};

module.exports = { manifest };
