# ChatGPT Implementation Checklist

This is a concise guide for implementing the scraper function.

## 🎯 Single Task: Implement scrapeSubtitles()

**File to edit**: `src/services/libre-subs-scraper.js`

**Function to implement**: `scrapeSubtitles({ type, id, season, episode })`

## 📋 Step-by-Step Implementation

### Step 1: Analyze the Website
```bash
# Visit and inspect:
https://libre-subs.fifthwit.net/

# Check:
- [ ] Search URL pattern
- [ ] HTML structure OR JSON API
- [ ] Download URL format
- [ ] Language codes used
```

### Step 2: Choose Parsing Method

**If HTML site:**
```bash
npm install cheerio
```

**If JSON API:**
No extra dependencies needed (axios already installed)

### Step 3: Implement the Function

Copy pattern from `IMPLEMENTATION_EXAMPLE.js` and adapt:

```javascript
async function scrapeSubtitles({ type, id, season, episode }) {
  // 1. Parse IMDB ID
  const imdbId = parseImdbId(id);
  
  // 2. Build search query
  const query = buildSearchQuery({ type, id: imdbId, season, episode });
  
  // 3. Make HTTP request
  const response = await axios.get(searchUrl);
  
  // 4. Parse response (HTML with cheerio OR JSON)
  const subtitles = []; // Extract here
  
  // 5. Return subtitles array
  return subtitles;
}
```

### Step 4: Format Output

Each subtitle object must have:
```javascript
{
  id: 'libre-subs-12345',      // Unique ID
  url: 'https://...',           // Direct download URL
  lang: 'en'                    // ISO 639-1 code (en, fr, es, etc.)
}
```

### Step 5: Test

```bash
# Start server
npm start

# Test in another terminal
curl http://localhost:7000/subtitles/movie/tt0111161.json

# Should return:
# { "subtitles": [ { "id": "...", "url": "...", "lang": "..." } ] }
```

## 📚 Reference Files

1. **IMPLEMENTATION_EXAMPLE.js**: Full working examples
2. **INSTRUCTIONS_FR.md**: Detailed French guide
3. **README.md**: Project documentation
4. **src/services/libre-subs-scraper.js**: File to implement

## 🔧 Helper Functions (Already Implemented)

- `parseImdbId(id)`: Extracts IMDB ID from Stremio format
- `buildSearchQuery({ type, id, season, episode })`: Builds search query string

## ⚠️ Important Notes

1. **Return empty array on error** (don't crash)
2. **Use timeouts** (10 seconds recommended)
3. **Add User-Agent** header
4. **Map language names to ISO codes** (see IMPLEMENTATION_EXAMPLE.js)
5. **Build full URLs** if site uses relative paths

## 🎨 Example Workflow

```javascript
// Input from Stremio
{ type: 'movie', id: 'tt0111161' }

// Your function processes
searchUrl = 'https://libre-subs.fifthwit.net/search?q=tt0111161'

// You extract and return
[
  { id: 'libre-subs-1', url: 'https://...', lang: 'en' },
  { id: 'libre-subs-2', url: 'https://...', lang: 'fr' }
]
```

## ✅ Testing Different Content Types

```bash
# Test movie
curl http://localhost:7000/subtitles/movie/tt0111161.json

# Test TV series
curl http://localhost:7000/subtitles/series/tt0903747:1:1.json
```

## 🚀 When Complete

The add-on will be fully functional and ready to:
1. Install in Stremio locally
2. Deploy to cloud (Heroku, Railway, Render)
3. Use in production

---

**Estimated time**: 1-2 hours
**Complexity**: Medium (depends on website structure)
**Files to modify**: Only 1 file (`src/services/libre-subs-scraper.js`)
