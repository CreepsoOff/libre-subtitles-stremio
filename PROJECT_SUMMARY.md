# Project Summary - Libre Subtitles Stremio Add-on

## ✅ Current Status (end-user ready)

The add-on is fully functional: it scrapes Libre Subs, exposes a configuration-aware subtitles feed, and serves a modern UI for generating installation links.

### Updated Project Structure

```
libre-subtitles-stremio/
├── public/                    # Web configurator (HTML/CSS/JS)
├── src/
│   ├── index.js               # Express server + Stremio router
│   ├── addon.js               # Manifest + handler wiring
│   ├── manifest.js            # Add-on metadata
│   ├── handlers/
│   │   └── subtitles.js       # Config parsing + filtering
│   └── services/
│       └── libre-subs-scraper.js # HTTP client and normalisation logic
├── QUICKSTART.md              # Simplified startup guide
├── README.md                  # Full documentation
└── …
```

## 🎯 Implemented Features

1. **Libre Subs Scraping**
   - Single API call to `/search` with support for IMDB & TMDB identifiers
   - Normalised language codes, formats, sources, hearing-impaired flag
   - Graceful error handling & logging

2. **Config-Aware Subtitle Handler**
   - Reads the JSON config embedded in Stremio install links
   - Filters by languages (strict or reorder), formats, sources
   - Options to exclude/prioritise hearing-impaired subtitles
   - Deduplication and safe fallbacks (empty array on failure)

3. **Web Configurator (`/`)**
   - Multi-select language dropdown with strict mode (copy refined for end users)
   - Toggle chips for formats/sources, hearing-impaired controls
   - Live JSON preview and `stremio://` link generator
   - HTTP link copy helper for remote devices

4. **Express Server Integration**
   - Serves static assets and mounts Stremio router via `getRouter`
   - Health endpoint (`/health`) for deployment probes
   - Accurate console logs even when binding to an ephemeral port

## 🧩 Configuration Payload

```json
{
  "version": 1,
  "preferences": {
    "languages": ["en", "fr"],
    "strictLanguages": false,
    "includeHearingImpaired": true,
    "preferHearingImpaired": false,
    "formats": ["srt", "ass"],
    "sources": ["opensubtitles"]
  }
}
```

All fields are optional. When omitted, the handler returns the full Libre Subs result set.

## 🔧 Next Ideas (Optional)

- Add caching (memory or disk) to reduce load on Libre Subs
- Expand source list dynamically based on API responses
- Add preset buttons to the UI (ex. « VO uniquement », « VF prioritaire »)
- Provide Dockerfile or deployment scripts for popular platforms
- Write unit tests for `normalizeConfig` and `applyPreferences`

## 📚 Key Docs

- `README.md` – overview, usage, deployment notes
- `QUICKSTART.md` – ultra-fast setup + curl examples
- `INSTRUCTIONS_FR.md` – memo (FR) about scraping & filters
- `IMPLEMENTATION_EXAMPLE.js` – historical examples for advanced scraping patterns

The repository is ready for production use or further customisation. Focus future work on caching, more provider integrations, or UI enhancements if required.


## 🐳 Deployment

- `Dockerfile` builds a slim production image (`node:20-alpine`).
- `docker-compose.yml` ships with Traefik routing for `sub.creepso.com`, HTTPS via Let's Encrypt, and automatic wiring to the add-on container.
- `TRAEFIK_ACME_EMAIL` must be set before `docker-compose up -d --build`.

## 🔮 Future Work

- Evaluate switching the scraper to [wyzie-lib](https://github.com/itzcozi/wyzie-lib) if the upstream package covers all Libre Subs sources out of the box.
