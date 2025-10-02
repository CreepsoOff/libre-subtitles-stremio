const manifest = {
  id: 'com.libresubtitles.stremio',
  version: '1.0.0',
  name: 'Libre Subtitles',
  description: 'Subtitles from libre-subs.fifthwit.net',

  logo: 'https://dl.strem.io/addon-logo.png',
  background: 'https://dl.strem.io/addon-background.jpg',

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
    configurable: true,
    configurationRequired: false
  },

  // Contact information
  contactEmail: '',

  // Configuration metadata (UI provided on /)
  config: [
    {
      key: 'preferences',
      type: 'text',
      title: 'Configuration JSON generated from the web interface',
      required: false
    }
  ]
};

module.exports = { manifest };
