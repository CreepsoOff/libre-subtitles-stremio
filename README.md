# Libre Subtitles - Stremio Addon

A Stremio addon that provides subtitles by scraping [libre-subs.fifthwit.net](https://libre-subs.fifthwit.net/).

## Overview

This addon integrates with Stremio to provide subtitle support from the Libre Subtitles database. It's built using the Stremio Addon SDK and provides a clean, maintainable structure for subtitle scraping.

## Features

- 🎬 Support for movies and TV series
- 🌍 Multiple language support
- 🔍 IMDB and TMDB ID support
- 📺 Episode-specific subtitles for TV shows
- 🚀 Easy to deploy and configure

## Project Structure

```
libre-subtitles-stremio/
├── src/
│   ├── index.js                 # Main entry point - starts the HTTP server
│   ├── addon.js                 # Addon builder and handler definitions
│   ├── manifest.js              # Stremio manifest configuration
│   ├── handlers/
│   │   └── subtitles.js         # Subtitle request handler
│   └── services/
│       └── libre-subs-scraper.js # Scraping logic for libre-subs.fifthwit.net
├── package.json                 # Node.js dependencies and scripts
├── .env.example                 # Environment variables template
├── .gitignore                   # Git ignore rules
├── LICENSE                      # Mozilla Public License 2.0
└── README.md                    # This file
```

## Installation

### Prerequisites

- Node.js 14.0.0 or higher
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone https://github.com/CreepsoOff/libre-subtitles-stremio.git
cd libre-subtitles-stremio
```

2. Install dependencies:
```bash
npm install
```

3. Create environment configuration (optional):
```bash
cp .env.example .env
```

4. Start the addon:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The addon will be available at `http://localhost:7000`

## Usage

### Installing in Stremio

1. Start the addon server (see Setup above)
2. Open Stremio application
3. Click on the addons icon (puzzle piece)
4. Click "Community Addons"
5. Paste the addon URL: `http://localhost:7000/manifest.json`
6. Click "Install"

### Development

The main scraping logic needs to be implemented in `src/services/libre-subs-scraper.js`. This file contains:

- `scrapeSubtitles()` - Main function to scrape subtitles from libre-subs.fifthwit.net
- Helper functions for parsing IDs and building search queries
- Placeholder structure showing expected subtitle format

### Implementing the Scraper

To complete the implementation, you need to:

1. **Analyze the target website** (libre-subs.fifthwit.net):
   - Understand the URL structure
   - Identify search endpoints or pages
   - Determine how to construct download URLs

2. **Update `scrapeSubtitles()` function**:
   - Add HTTP requests to fetch subtitle listings
   - Parse HTML or JSON responses
   - Extract subtitle information (language, quality, etc.)
   - Format results according to Stremio's subtitle object structure

3. **Subtitle object format**:
```javascript
{
  id: 'unique-identifier',        // Unique ID for the subtitle
  url: 'https://...',              // Direct download URL
  lang: 'en'                       // ISO 639-1 language code
}
```

### Testing

Test the addon by:

1. Starting the server: `npm start`
2. Opening the manifest: `http://localhost:7000/manifest.json`
3. Testing subtitle requests: `http://localhost:7000/subtitles/movie/tt1234567.json`

## Configuration

### Environment Variables

- `PORT` - Server port (default: 7000)

### Manifest Configuration

Edit `src/manifest.js` to customize:

- Addon name and description
- Supported content types
- ID prefixes (IMDB, TMDB)
- Contact information

## API Endpoints

When running, the addon exposes these endpoints:

- `GET /manifest.json` - Addon manifest
- `GET /subtitles/:type/:id.json` - Get subtitles for content
  - `:type` - Content type (movie or series)
  - `:id` - Content ID (e.g., tt1234567 for IMDB)
  - Query params: `season`, `episode` (for series)

## Deployment

### Local Network

The addon can be accessed by other devices on your local network using your computer's IP address:

```
http://YOUR_IP:7000/manifest.json
```

### Cloud Deployment

The addon can be deployed to any Node.js hosting platform:

- **Heroku**: Add `Procfile` with `web: node src/index.js`
- **Railway**: Connects directly to the GitHub repository
- **Render**: Auto-detects Node.js and uses `npm start`
- **DigitalOcean App Platform**: Configure with Node.js buildpack

After deployment, install using your public URL:
```
https://your-addon.example.com/manifest.json
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the Mozilla Public License Version 2.0 - see the [LICENSE](LICENSE) file for details.

## Resources

- [Stremio Addon SDK Documentation](https://github.com/Stremio/stremio-addon-sdk)
- [Stremio Addon Examples](https://github.com/Stremio/stremio-addon-sdk/tree/master/docs)
- [Libre Subtitles Website](https://libre-subs.fifthwit.net/)

## Notes

This addon is designed as a foundation. The actual scraping implementation for libre-subs.fifthwit.net needs to be completed based on the website's structure and any terms of service or usage policies they have in place.

Always respect the website's robots.txt, rate limits, and terms of service when implementing web scraping functionality.