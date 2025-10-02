# Libre Subtitles - Stremio Addon

A polished Stremio subtitle add-on powered by [libre-subs.fifthwit.net](https://libre-subs.fifthwit.net/). It scrapes the Libre Subs catalogue, lets you fine-tune language/format/source preferences, and exposes a clean install experience via a custom web interface.

## Overview

- Built with the official Stremio Addon SDK and Express
- Targets the Libre Subs instance maintained by FifthWit
- Works with both IMDB (`tt`) and TMDB identifiers
- Handles movies and series (with season/episode parsing)
- Includes a local configuration UI to generate install links with custom filters

## Feature Highlights

- ✅ Subtitles for movies and TV series (IMDB & TMDB IDs)
- ✅ Language normalisation with multi-language filtering
- ✅ Format and source filters plus hearing-impaired toggles
- ✅ Interactive configurator served at `http://localhost:7000/`
- ✅ Direct Stremio install links (`stremio://…`) and shareable HTTP URLs

## Project Structure

```
libre-subtitles-stremio/
├── public/
│   ├── index.html             # Configuration UI
│   ├── styles.css             # UI styling
│   └── app.js                 # UI logic & link generation
├── src/
│   ├── index.js               # Express server + router wiring
│   ├── addon.js               # Addon builder and handler definitions
│   ├── manifest.js            # Stremio manifest configuration
│   ├── handlers/
│   │   └── subtitles.js       # Subtitle handler (filters & config parsing)
│   └── services/
│       └── libre-subs-scraper.js # Libre Subs scraping logic
├── package.json               # Node.js dependencies and scripts
├── README.md                  # Project documentation
└── …
```

## Quick Start

```bash
npm install
npm start
```

- The HTTP server listens on `PORT` (default `7000`).
- Visit `http://localhost:7000/` to open the configurator.
- Use the generated link (HTTP or `stremio://`) to install the add-on.

## Web Configurator

Accessible at the root path, the configurator mirrors modern add-on installers:

- 🗂️ **Language picker** with multi-select and optional strict filtering
- 🎧 **Hearing-impaired controls** (exclude or prioritise those tracks)
- 💾 **Format filter** (`srt`, `ass/ssa`, `vtt`, `sub`, `txt`)
- 🌐 **Source filter** (OpenSubtitles, Yavka, Subscene, etc.)
- 🔗 **Live install link preview** (`stremio://host/{config}/manifest.json`)
- 📋 **Copyable HTTP URL** for remote devices
- 🧾 **JSON preview** of the configuration payload (versioned)

The generated configuration is passed back to the add-on via Stremio’s config mechanism, so every subtitle response can honour the selected filters.

## Installing in Stremio

1. Ensure the server is running locally.
2. Open the configurator, adjust preferences, and click **Installer dans Stremio**.
3. Stremio opens (via `stremio://…`) with the generated configuration embedded.
4. Alternatively, copy the HTTP URL and paste it in *Community Addons* inside Stremio.

## Configuration Payload

The handler understands the following shape (fields are optional):

```json
{
  "version": 1,
  "preferences": {
    "languages": ["en", "fr"],
    "strictLanguages": true,
    "includeHearingImpaired": false,
    "preferHearingImpaired": true,
    "formats": ["srt", "ass"],
    "sources": ["opensubtitles"]
  }
}
```

- `languages`: ISO-639-1 codes. When present, non-strict mode reorders results; strict mode removes other languages entirely.
- `includeHearingImpaired`: defaults to `true`. Set to `false` to drop those tracks.
- `preferHearingImpaired`: keeps them but orders them before standard ones.
- `formats`: lower-case formats reported by Libre Subs (empty ⇒ all).
- `sources`: lower-case provider slugs (empty ⇒ all).

## API Endpoints

- `GET /` – Configuration UI (static assets in `public/`)
- `GET /manifest.json` – Add-on manifest
- `GET /subtitles/:type/:id.json` – Subtitle feed (query params: `season`, `episode`)
- `GET /health` – Simple health probe

## Development Notes

- `src/services/libre-subs-scraper.js` handles HTTP requests against Libre Subs and normalises the payload (language codes, URLs, metadata).
- `src/handlers/subtitles.js` parses the Stremio config payload and applies all filters before responding.
- The code logs incoming requests and gracefully returns an empty list on failures.
- Express replaces the default `serveHTTP` helper so we can host the UI alongside the add-on router.

### Testing locally

```bash
# Manifest
curl http://localhost:7000/manifest.json

# Movie subtitles
curl http://localhost:7000/subtitles/movie/tt3659388.json | jq

# Series subtitles (ID:S:E)
curl "http://localhost:7000/subtitles/series/tt0121955:1:1.json"
```

For ad-hoc testing in Node:

```javascript
const { handleSubtitles } = require('./src/handlers/subtitles');
handleSubtitles({
  type: 'movie',
  id: 'tt0111161',
  config: { preferences: { languages: ['en'], formats: ['srt'] } }
}).then(console.log);
```

## Deployment

Any Node-friendly hosting works (Render, Railway, Fly.io, etc.). Ensure the port is exposed and the `/` route is reachable for configuration. A simple `Procfile` such as `web: node src/index.js` suffices for Heroku-like platforms.

## Respecting Libre Subs

Libre Subs is a community service with no official rate limits, but please:

- Cache responses when deploying publicly
- Avoid aggressive polling
- Honour any future terms of service updates

## Resources

- [Stremio Addon SDK Documentation](https://github.com/Stremio/stremio-addon-sdk)
- [Libre Subs](https://libre-subs.fifthwit.net/)
- [Libre Subs GitHub mirror (wyzie-subs)](https://github.com/itzCozi/wyzie-subs)

---

Libre Subtitles Stremio Addon is released under the [Mozilla Public License 2.0](LICENSE).


## Production Deployment (sub.creepso.com)

1. Set the DNS A record for `sub.creepso.com` to point to your VPS.
2. Copy `.env.example` to `.env` if you want to override the default port.
3. Export an email for Let's Encrypt before starting Traefik: `export TRAEFIK_ACME_EMAIL=you@example.com`.
4. Run `docker-compose up -d --build`. Traefik obtains certificates automatically and routes traffic to the add-on container.
5. Visit `https://sub.creepso.com/` to access the configurator, then install the add-on in Stremio using the generated link.

The compose stack installs Traefik (reverse proxy with TLS) and the add-on container. Adjust `docker-compose.yml` to match your infrastructure if you already run Traefik elsewhere.

### Health checks

- `https://sub.creepso.com/health` returns `{ "status": "ok" }` and can be used for monitoring.
- Stremio manifest is available at `https://sub.creepso.com/manifest.json` (or the personalised path that embeds preferences).

### Notes

- The UI automatically embeds your selections into the URL, so the copied HTTP link always reflects the active filters.
- If you plan to migrate to [wyzie-lib](https://github.com/itzcozi/wyzie-lib) later, the scraper lives in `src/services/libre-subs-scraper.js` and can be swapped without touching the UI or Docker setup.
