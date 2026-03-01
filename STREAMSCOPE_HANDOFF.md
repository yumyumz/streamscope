# StreamScope — Project Handoff Document

## What is StreamScope?
A global streaming availability dashboard that shows trending content and where to watch titles across countries and services.

## Tech Stack
- **Framework**: Next.js 16 (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **Icons**: lucide-react
- **Map**: react-simple-maps
- **APIs**: TMDB, Streaming Availability API (RapidAPI)

## Project Location
`~/streamscope` on the user's Mac

## File Structure
```
app/
  page.tsx                    ← Main trending + detail view
  layout.tsx                  ← Root layout
  globals.css                 ← Global styles
  components/
    AvailabilityMap.tsx        ← World map showing streaming availability
  api/
    trending/[type]/route.ts  ← TMDB trending endpoint (all/movie/tv)
    search/route.ts           ← TMDB search endpoint
    streaming/route.ts        ← Streaming availability lookup
    services/route.ts         ← Browse by streaming service
  services/
    page.tsx                  ← Browse by streaming service page
.env.local                    ← API keys (see below)
next.config.ts                ← Image domains config
```

## Environment Variables (.env.local)
```
TMDB_API_TOKEN=your_tmdb_read_access_token
STREAMING_API_KEY=your_rapidapi_key
```

## APIs Used

### TMDB
- Trending: `GET /3/trending/{type}/week?region={country}`
- Discover: `GET /3/discover/{type}?watch_region={country}&with_original_language={lang}&sort_by=popularity.desc`
- Search: `GET /3/search/multi?query={q}`
- Auth: Bearer token in Authorization header

### Streaming Availability (RapidAPI)
- Endpoint: `GET https://streaming-availability.p.rapidapi.com/shows/{movie|series}/{tmdbId}`
- Headers: `x-rapidapi-key`, `x-rapidapi-host`
- Returns: `streamingOptions` object keyed by lowercase country code

## Features Already Built
- ✅ Global trending page with cinematic hero section
- ✅ Filter by All / Movies / TV Shows
- ✅ Country selector (15 countries) that changes trending results
- ✅ Search any movie or TV show with live dropdown
- ✅ Detail page showing where to watch in selected country
- ✅ World map showing global availability (react-simple-maps)
- ✅ "Available In" country list with full country names
- ✅ Browse by streaming service page (Netflix, Prime, Disney+ etc.)
- ✅ Service catalog filtered by country and movie/tv type
- ✅ Disclaimer about incomplete availability data

## Known Limitations
- Streaming Availability API free tier has gaps (especially Apple TV+)
- Country selector on trending uses TMDB discover endpoint with language filtering for non-US countries
- "All" tab for non-US countries fetches movies + TV separately and merges by popularity

## Planned Features (Not Yet Built)
- Genre filtering on trending and service pages
- "Similar titles" on detail page (TMDB has an endpoint for this)
- Trailer button linking to YouTube via TMDB video endpoint
- Pagination / "Load More" on trending and service pages
- Mobile responsiveness improvements
- Runtime and genre tags on detail page
- "New this month" section
- Remember last selected country via localStorage
- Top rated vs trending toggle
- Deploy to Vercel

## TMDB Service Provider IDs (for reference)
- Netflix: 8
- Prime Video: 9
- Disney+: 337
- Hulu: 15
- Max (HBO): 1899
- Apple TV+: 350
- Paramount+: 531
- Peacock: 386
- MUBI: 190

## Design
- Background: `#080810`
- Accent: `#e63946` (red)
- Font: Georgia serif for headings
- Dark cinematic aesthetic with blur effects

## How to Run
```bash
cd ~/streamscope
npm run dev
# Visit http://localhost:3000
```
