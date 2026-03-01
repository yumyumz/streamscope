'use client';

import { useState, useEffect, useRef } from 'react';
import { TrendingUp, Tv, Film, Globe, Star, ChevronDown, Search, X, Play, ChevronLeft, Info, Tag, Clock, ExternalLink } from 'lucide-react';
import AvailabilityMap from './components/AvailabilityMap';

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'IN', name: 'India' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'SE', name: 'Sweden' },
];

const SERVICE_COLORS: Record<string, string> = {
  netflix: '#E50914', prime: '#00A8E0', disney: '#113CCF',
  hulu: '#1CE783', hbo: '#5822B4', apple: '#1a1a1a',
  paramount: '#0064FF', peacock: '#000000', mubi: '#FF3C00', default: '#333',
};

const SERVICE_NAMES: Record<string, string> = {
  netflix: 'Netflix', prime: 'Prime Video', disney: 'Disney+',
  hulu: 'Hulu', hbo: 'Max', apple: 'Apple TV+',
  paramount: 'Paramount+', peacock: 'Peacock', mubi: 'MUBI',
};

const GENRES = [
  { id: 28, name: 'Action', types: ['movie'] },
  { id: 12, name: 'Adventure', types: ['movie'] },
  { id: 16, name: 'Animation', types: ['movie', 'tv'] },
  { id: 35, name: 'Comedy', types: ['movie', 'tv'] },
  { id: 80, name: 'Crime', types: ['movie', 'tv'] },
  { id: 99, name: 'Documentary', types: ['movie', 'tv'] },
  { id: 18, name: 'Drama', types: ['movie', 'tv'] },
  { id: 10751, name: 'Family', types: ['movie', 'tv'] },
  { id: 14, name: 'Fantasy', types: ['movie'] },
  { id: 36, name: 'History', types: ['movie'] },
  { id: 27, name: 'Horror', types: ['movie'] },
  { id: 10402, name: 'Music', types: ['movie'] },
  { id: 9648, name: 'Mystery', types: ['movie', 'tv'] },
  { id: 10749, name: 'Romance', types: ['movie'] },
  { id: 878, name: 'Sci-Fi', types: ['movie', 'tv'] },
  { id: 53, name: 'Thriller', types: ['movie'] },
  { id: 10752, name: 'War', types: ['movie'] },
  { id: 10759, name: 'Action & Adventure', types: ['tv'] },
  { id: 10765, name: 'Sci-Fi & Fantasy', types: ['tv'] },
  { id: 10768, name: 'War & Politics', types: ['tv'] },
];

type MediaType = 'all' | 'movie' | 'tv';

interface TrendingItem {
  id: number; title?: string; name?: string;
  poster_path: string; backdrop_path: string;
  vote_average: number; media_type: string; overview: string;
  release_date?: string; first_air_date?: string; genre_ids: number[];
  popularity?: number;
}

interface SearchResult {
  id: number; title?: string; name?: string; media_type: string;
  poster_path: string; vote_average: number;
  release_date?: string; first_air_date?: string;
}

interface StreamingOption {
  service: { id: string; name: string }; type: string; link: string;
}

interface StreamingData {
  title: string; overview: string;
  streamingOptions: Record<string, StreamingOption[]>;
}

interface DetailData {
  runtime: number | null;
  genres: string[];
  trailerKey: string | null;
  similar: SimilarItem[];
}

interface SimilarItem {
  id: number; title: string; poster_path: string;
  vote_average: number; media_type: string;
  release_date?: string; first_air_date?: string;
}

export default function Home() {
  const [mediaType, setMediaType] = useState<MediaType>('all');
  const [country, setCountry] = useState('US');

  // Persist country across sessions
  useEffect(() => {
    const saved = localStorage.getItem('streamscope-country');
    if (saved) setCountry(saved);
  }, []);
  function setCountryPersisted(code: string) {
    setCountry(code);
    localStorage.setItem('streamscope-country', code);
  }
  const [trending, setTrending] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [heroItem, setHeroItem] = useState<TrendingItem | null>(null);
  const [showCountryMenu, setShowCountryMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<NodeJS.Timeout>(undefined);
  const [selectedTitle, setSelectedTitle] = useState<SearchResult | TrendingItem | null>(null);
  const [streamingData, setStreamingData] = useState<StreamingData | null>(null);
  const [streamingLoading, setStreamingLoading] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [detailData, setDetailData] = useState<DetailData | null>(null);
  const [trendingPage, setTrendingPage] = useState(1);
  const [hasMoreTrending, setHasMoreTrending] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [viewMode, setViewMode] = useState<'trending' | 'top-rated'>('trending');
  const [newThisMonth, setNewThisMonth] = useState<TrendingItem[]>([]);

  useEffect(() => { setTrendingPage(1); setHasMoreTrending(true); fetchTrending(1); }, [mediaType, country, selectedGenre, viewMode]);

  useEffect(() => { fetchNewThisMonth(); }, [mediaType, country]);

  async function fetchNewThisMonth() {
    const type = mediaType === 'all' ? 'all' : mediaType;
    try {
      const res = await fetch(`/api/new-this-month?type=${type}&region=${country}`, { cache: 'no-store' });
      const data = await res.json();
      setNewThisMonth(data.results || []);
    } catch (e) { console.error(e); }
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function fetchTrending(page = 1) {
    if (page === 1) setLoading(true); else setLoadingMore(true);
    try {
      let results = [];
      const genreParam = selectedGenre ? `&genre=${selectedGenre}` : '';
      const pageParam = `&page=${page}`;
      const type = mediaType === 'all' ? 'all' : mediaType;

      if (viewMode === 'top-rated') {
        const res = await fetch(`/api/top-rated?type=${type}&region=${country}${genreParam}${pageParam}`, { cache: 'no-store' });
        const data = await res.json();
        results = data.results || [];
      } else if (mediaType === 'all' && (country !== 'US' || selectedGenre)) {
        const [moviesRes, tvRes] = await Promise.all([
          fetch(`/api/trending/movie?region=${country}${genreParam}${pageParam}`, { cache: 'no-store' }),
          fetch(`/api/trending/tv?region=${country}${genreParam}${pageParam}`, { cache: 'no-store' }),
        ]);
        const moviesData = await moviesRes.json();
        const tvData = await tvRes.json();
        results = [...(moviesData.results || []), ...(tvData.results || [])]
          .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
      } else {
        const res = await fetch(`/api/trending/${type}?region=${country}${genreParam}${pageParam}`, { cache: 'no-store' });
        const data = await res.json();
        results = data.results || [];
      }
      if (results.length === 0) setHasMoreTrending(false);
      if (page === 1) {
        setTrending(results);
        if (results.length > 0) setHeroItem(results[0]);
      } else {
        setTrending((prev) => [...prev, ...results]);
      }
    } catch (e) { console.error(e); }
    if (page === 1) setLoading(false); else setLoadingMore(false);
  }

  async function loadMoreTrending() {
    const next = trendingPage + 1;
    setTrendingPage(next);
    await fetchTrending(next);
  }

  function handleSearchInput(value: string) {
    setSearchQuery(value);
    clearTimeout(searchTimeout.current);
    if (!value.trim()) { setSearchResults([]); setShowSearchDropdown(false); return; }
    searchTimeout.current = setTimeout(() => doSearch(value), 400);
  }

  async function doSearch(query: string) {
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data.results?.slice(0, 6) || []);
      setShowSearchDropdown(true);
    } catch (e) { console.error(e); }
    setSearchLoading(false);
  }

  async function handleSelectTitle(item: SearchResult | TrendingItem) {
    setSelectedTitle(item); setShowSearchDropdown(false);
    setSearchQuery(''); setStreamingData(null); setDetailData(null); setStreamingLoading(true);
    try {
      const [streamRes, detailRes] = await Promise.all([
        fetch(`/api/streaming?tmdbId=${item.id}&type=${item.media_type}`),
        fetch(`/api/detail?tmdbId=${item.id}&type=${item.media_type}`),
      ]);
      const [streamJson, detailJson] = await Promise.all([streamRes.json(), detailRes.json()]);
      setStreamingData(streamJson);
      setDetailData(detailJson);
    } catch (e) { console.error(e); }
    setStreamingLoading(false);
  }

  const selectedCountry = COUNTRIES.find((c) => c.code === country);
  const countryStreaming = streamingData?.streamingOptions?.[country.toLowerCase()] || [];

  return (
    <div className="min-h-screen text-white" style={{ background: '#080810' }}>

      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50"
        style={{ background: 'linear-gradient(to bottom, rgba(8,8,16,0.98) 0%, transparent 100%)', backdropFilter: 'blur(12px)' }}>
        {/* Row 1: logo + nav + country */}
        <div className="px-4 md:px-6 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
              style={{ background: 'linear-gradient(135deg, #e63946, #c1121f)' }}>
              📡
            </div>
            <span className="text-xl tracking-wide" style={{ fontFamily: 'var(--font-bebas)' }}>
              STREAM<span style={{ color: '#e63946' }}>SCOPE</span>
            </span>
          </div>

          {/* Nav: always visible */}
          <nav className="flex items-center gap-1 ml-3 shrink-0">
            <a href="/" className="px-3 py-1.5 rounded-full text-sm font-medium"
              style={{ background: 'rgba(230,57,70,0.1)', color: '#e63946', border: '1px solid rgba(230,57,70,0.2)' }}>Trending</a>
            <a href="/services" className="px-3 py-1.5 rounded-full text-sm transition-colors hover:bg-white/5"
              style={{ color: 'rgba(255,255,255,0.4)' }}>Services</a>
          </nav>

          {/* Search: hidden on mobile (shown in row 2), visible on md+ */}
          <div className="hidden md:block flex-1 max-w-lg relative" ref={searchRef}>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-full text-sm"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Search size={14} style={{ color: 'rgba(255,255,255,0.3)' }} />
              <input type="text" placeholder="Search movies & shows..."
                value={searchQuery} onChange={(e) => handleSearchInput(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm placeholder-white/30" />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setShowSearchDropdown(false); }}>
                  <X size={13} style={{ color: 'rgba(255,255,255,0.3)' }} />
                </button>
              )}
            </div>
            {showSearchDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl overflow-hidden shadow-2xl z-50"
                style={{ background: '#12121e', border: '1px solid rgba(255,255,255,0.08)' }}>
                {searchLoading ? (
                  <div className="px-4 py-3 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>Searching...</div>
                ) : searchResults.length === 0 ? (
                  <div className="px-4 py-3 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>No results found</div>
                ) : searchResults.map((item) => (
                  <button key={item.id} onClick={() => handleSelectTitle(item)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-white/5">
                    {item.poster_path ? (
                      <img src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                        alt={item.title || item.name} className="w-8 h-11 object-cover rounded-md" />
                    ) : (
                      <div className="w-8 h-11 rounded-md flex items-center justify-center text-xs"
                        style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.2)' }}>?</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title || item.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                        {item.media_type === 'tv' ? 'TV Series' : 'Movie'} · {(item.release_date || item.first_air_date || '').slice(0, 4)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0" style={{ color: '#fbbf24' }}>
                      <Star size={10} fill="currentColor" />
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.vote_average?.toFixed(1)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Country selector */}
          <div className="relative shrink-0 ml-auto">
            <button onClick={() => setShowCountryMenu(!showCountryMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-colors hover:bg-white/10"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Globe size={13} style={{ color: '#e63946' }} />
              <span className="hidden sm:inline" style={{ color: 'rgba(255,255,255,0.8)' }}>{selectedCountry?.name}</span>
              <ChevronDown size={12} style={{ color: 'rgba(255,255,255,0.3)' }} />
            </button>
            {showCountryMenu && (
              <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl overflow-hidden shadow-2xl z-50 max-h-64 overflow-y-auto"
                style={{ background: '#12121e', border: '1px solid rgba(255,255,255,0.08)' }}>
                {COUNTRIES.map((c) => (
                  <button key={c.code} onClick={() => { setCountryPersisted(c.code); setShowCountryMenu(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/5"
                    style={{ color: country === c.code ? '#e63946' : 'rgba(255,255,255,0.6)' }}>
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Row 2 (mobile only): search bar */}
        <div className="md:hidden px-4 pb-3 relative" ref={searchRef}>
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-full text-sm"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Search size={14} style={{ color: 'rgba(255,255,255,0.3)' }} />
            <input type="text" placeholder="Search movies & shows..."
              value={searchQuery} onChange={(e) => handleSearchInput(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm placeholder-white/30" />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setShowSearchDropdown(false); }}>
                <X size={13} style={{ color: 'rgba(255,255,255,0.3)' }} />
              </button>
            )}
          </div>
          {showSearchDropdown && (
            <div className="absolute top-full left-4 right-4 mt-1 rounded-2xl overflow-hidden shadow-2xl z-50"
              style={{ background: '#12121e', border: '1px solid rgba(255,255,255,0.08)' }}>
              {searchLoading ? (
                <div className="px-4 py-3 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>Searching...</div>
              ) : searchResults.length === 0 ? (
                <div className="px-4 py-3 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>No results found</div>
              ) : searchResults.map((item) => (
                <button key={item.id} onClick={() => handleSelectTitle(item)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-white/5">
                  {item.poster_path ? (
                    <img src={`https://image.tmdb.org/t/p/w92${item.poster_path}`}
                      alt={item.title || item.name} className="w-8 h-11 object-cover rounded-md" />
                  ) : (
                    <div className="w-8 h-11 rounded-md flex items-center justify-center text-xs"
                      style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.2)' }}>?</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title || item.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {item.media_type === 'tv' ? 'TV Series' : 'Movie'} · {(item.release_date || item.first_air_date || '').slice(0, 4)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0" style={{ color: '#fbbf24' }}>
                    <Star size={10} fill="currentColor" />
                    <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.vote_average?.toFixed(1)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* DETAIL VIEW */}
      {selectedTitle && (
        <div className="pt-24 md:pt-20 min-h-screen">
          {(selectedTitle as TrendingItem).backdrop_path && (
            <div className="fixed inset-0 z-0" style={{ pointerEvents: 'none' }}>
              <div className="absolute inset-0 bg-cover bg-center opacity-10"
                style={{ backgroundImage: `url(https://image.tmdb.org/t/p/w1280${(selectedTitle as TrendingItem).backdrop_path})` }} />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #080810 0%, rgba(8,8,16,0.95) 100%)' }} />
            </div>
          )}
          <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-6 py-8">
            <button onClick={() => { setSelectedTitle(null); setStreamingData(null); setDetailData(null); }}
              className="flex items-center gap-1.5 text-sm mb-6 transition-colors hover:text-white"
              style={{ color: 'rgba(255,255,255,0.4)' }}>
              <ChevronLeft size={15} /> Back to Trending
            </button>
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-8">
              <div className="shrink-0 flex justify-center sm:justify-start">
                {selectedTitle.poster_path ? (
                  <img src={`https://image.tmdb.org/t/p/w342${selectedTitle.poster_path}`}
                    alt={selectedTitle.title || selectedTitle.name || ''}
                    className="w-36 sm:w-44 rounded-2xl shadow-2xl" style={{ border: '1px solid rgba(255,255,255,0.08)' }} />
                ) : (
                  <div className="w-36 sm:w-44 rounded-2xl" style={{ aspectRatio: '2/3', background: 'rgba(255,255,255,0.05)' }} />
                )}
              </div>
              <div className="flex-1 pt-0 sm:pt-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(230,57,70,0.15)', color: '#e63946', border: '1px solid rgba(230,57,70,0.2)' }}>
                    {selectedTitle.media_type === 'tv' ? 'TV Series' : 'Movie'}
                  </span>
                </div>
                <h1 className="text-3xl font-bold mb-3 leading-tight" style={{ fontFamily: 'var(--font-playfair)' }}>
                  {selectedTitle.title || selectedTitle.name}
                </h1>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center gap-1.5" style={{ color: '#fbbf24' }}>
                    <Star size={13} fill="currentColor" />
                    <span className="text-sm font-bold">{selectedTitle.vote_average?.toFixed(1)}</span>
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                  <span className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                    {((selectedTitle as TrendingItem).release_date || (selectedTitle as TrendingItem).first_air_date || '').slice(0, 4)}
                  </span>
                  {detailData?.runtime && (
                    <>
                      <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                      <div className="flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        <Clock size={12} />
                        <span className="text-sm">{Math.floor(detailData.runtime / 60)}h {detailData.runtime % 60}m</span>
                      </div>
                    </>
                  )}
                </div>
                {detailData?.genres && detailData.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {detailData.genres.map((g) => (
                      <span key={g} className="text-xs px-2.5 py-1 rounded-full"
                        style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        {g}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.55)', maxWidth: '520px' }}>
                  {streamingData?.overview || (selectedTitle as TrendingItem).overview}
                </p>

                {detailData?.trailerKey && (
                  <a href={`https://www.youtube.com/watch?v=${detailData.trailerKey}`}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-8 transition-all hover:scale-105"
                    style={{ background: 'rgba(255,0,0,0.15)', color: '#ff4444', border: '1px solid rgba(255,0,0,0.25)' }}>
                    <ExternalLink size={13} /> Watch Trailer
                  </a>
                )}
                {!detailData?.trailerKey && <div className="mb-8" />}

                <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Where to Watch in {selectedCountry?.name}
                </h2>
                <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  Availability data may be incomplete. Some services like Apple TV+ may not be shown.
                </p>
                {streamingLoading ? (
                  <div className="flex gap-3">
                    {[1,2,3].map((i) => <div key={i} className="w-28 h-11 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />)}
                  </div>
                ) : countryStreaming.length === 0 ? (
                  <div className="flex items-center gap-3 p-4 rounded-2xl"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <span className="text-2xl">😔</span>
                    <div>
                      <p className="text-sm font-medium">Not available in {selectedCountry?.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Try changing the country in the top right</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2.5">
                    {countryStreaming.map((option: StreamingOption, i: number) => {
                      const serviceId = option.service.id;
                      const color = SERVICE_COLORS[serviceId] || SERVICE_COLORS.default;
                      const name = SERVICE_NAMES[serviceId] || option.service.name;
                      return (
                        <a key={i} href={option.link} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 hover:brightness-110"
                          style={{ backgroundColor: color, boxShadow: `0 4px 15px ${color}40` }}>
                          <Play size={12} fill="white" />
                          {name}
                          {option.type === 'free' && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }}>FREE</span>}
                          {option.type === 'rent' && <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.2)' }}>RENT</span>}
                        </a>
                      );
                    })}
                  </div>
                )}

                {streamingData?.streamingOptions && (
                  <div className="mt-8">
                    <AvailabilityMap
                      streamingOptions={streamingData.streamingOptions}
                      title={selectedTitle.title || selectedTitle.name || ''}
                    />
                  </div>
                )}
                {streamingData?.streamingOptions && Object.keys(streamingData.streamingOptions).length > 0 && (
                  <div className="mt-8">
                    <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>Available In</h2>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(streamingData.streamingOptions).map(([code]) => {
                        const ALL_COUNTRIES: Record<string, string> = {
                          us: 'United States', gb: 'United Kingdom', ca: 'Canada', au: 'Australia',
                          de: 'Germany', fr: 'France', jp: 'Japan', kr: 'South Korea', in: 'India',
                          br: 'Brazil', mx: 'Mexico', es: 'Spain', it: 'Italy', nl: 'Netherlands',
                          se: 'Sweden', pt: 'Portugal', no: 'Norway', dk: 'Denmark', fi: 'Finland',
                          ch: 'Switzerland', at: 'Austria', be: 'Belgium', pl: 'Poland', cz: 'Czech Republic',
                          hu: 'Hungary', ro: 'Romania', gr: 'Greece', tr: 'Turkey', ru: 'Russia',
                          za: 'South Africa', ng: 'Nigeria', eg: 'Egypt', ar: 'Argentina', cl: 'Chile',
                          co: 'Colombia', pe: 'Peru', nz: 'New Zealand', sg: 'Singapore', th: 'Thailand',
                          id: 'Indonesia', my: 'Malaysia', ph: 'Philippines', hk: 'Hong Kong', tw: 'Taiwan',
                          ua: 'Ukraine', il: 'Israel', sa: 'Saudi Arabia', ae: 'UAE', pk: 'Pakistan',
                          sk: 'Slovakia', hr: 'Croatia', bg: 'Bulgaria', rs: 'Serbia', ee: 'Estonia',
                          lv: 'Latvia', lt: 'Lithuania', si: 'Slovenia', is: 'Iceland', ie: 'Ireland',
                          ec: 'Ecuador', md: 'Moldova', vn: 'Vietnam', cy: 'Cyprus', pa: 'Panama',
                          bo: 'Bolivia', py: 'Paraguay', uy: 'Uruguay', ve: 'Venezuela', gt: 'Guatemala',
                          cr: 'Costa Rica', do: 'Dominican Republic', hn: 'Honduras', ni: 'Nicaragua',
                          sv: 'El Salvador', jm: 'Jamaica', tt: 'Trinidad and Tobago', bb: 'Barbados',
                          gh: 'Ghana', ke: 'Kenya', tz: 'Tanzania', ug: 'Uganda', et: 'Ethiopia',
                          ma: 'Morocco', dz: 'Algeria', tn: 'Tunisia', lk: 'Sri Lanka', bd: 'Bangladesh',
                          np: 'Nepal', kz: 'Kazakhstan', uz: 'Uzbekistan', ge: 'Georgia', am: 'Armenia',
                          az: 'Azerbaijan', by: 'Belarus', mk: 'North Macedonia', al: 'Albania',
                          ba: 'Bosnia', me: 'Montenegro', xk: 'Kosovo', mt: 'Malta', lu: 'Luxembourg',
                          li: 'Liechtenstein', mc: 'Monaco', sm: 'San Marino', ad: 'Andorra',

                        };
                        const countryName = ALL_COUNTRIES[code.toLowerCase()] || code.toUpperCase();
                        return (
                          <button key={code} onClick={() => setCountryPersisted(code.toUpperCase())}
                            className="px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-105"
                            style={{
                              background: country.toLowerCase() === code ? '#e63946' : 'rgba(255,255,255,0.05)',
                              color: country.toLowerCase() === code ? 'white' : 'rgba(255,255,255,0.5)',
                              border: `1px solid ${country.toLowerCase() === code ? 'transparent' : 'rgba(255,255,255,0.07)'}`,
                            }}>
                            {countryName}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Similar titles */}
                {detailData?.similar && detailData.similar.length > 0 && (
                  <div className="mt-10">
                    <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>
                      More Like This
                    </h2>
                    <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                      {detailData.similar.map((item) => (
                        <button key={item.id} onClick={() => handleSelectTitle(item as any)}
                          className="shrink-0 group relative rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
                          style={{ width: '110px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div className="relative overflow-hidden" style={{ aspectRatio: '2/3' }}>
                            {item.poster_path ? (
                              <img src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
                                alt={item.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs"
                                style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.2)' }}>No Image</div>
                            )}
                          </div>
                          <div className="p-2">
                            <p className="text-xs font-medium truncate leading-tight">{item.title}</p>
                            <div className="flex items-center gap-1 mt-1" style={{ color: '#fbbf24' }}>
                              <Star size={9} fill="currentColor" />
                              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.vote_average?.toFixed(1)}</span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TRENDING VIEW */}
      {!selectedTitle && (
        <>
          {heroItem && !loading && (
            <div className="relative overflow-hidden" style={{ height: '70vh', minHeight: '480px' }}>
              <div className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(https://image.tmdb.org/t/p/original${heroItem.backdrop_path})`, filter: 'brightness(0.35) saturate(1.2)' }} />
              <div className="absolute inset-0" style={{
                background: 'linear-gradient(to right, rgba(8,8,16,0.95) 0%, rgba(8,8,16,0.4) 60%, transparent 100%), linear-gradient(to top, rgba(8,8,16,1) 0%, transparent 60%)'
              }} />
              <div className="relative h-full flex items-end px-5 md:px-10 pb-8 md:pb-12" style={{ paddingTop: '80px' }}>
                <div style={{ maxWidth: '560px' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
                      style={{ background: 'rgba(230,57,70,0.15)', color: '#e63946', border: '1px solid rgba(230,57,70,0.25)' }}>
                      {viewMode === 'top-rated' ? <><Star size={10} /> #1 Top Rated</> : <><TrendingUp size={10} /> #1 Trending</>}
                    </div>
                    <span className="text-xs uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>
                      {heroItem.media_type === 'tv' ? 'TV Series' : 'Movie'} · {selectedCountry?.name}
                    </span>
                  </div>
                  <h1 className="font-bold mb-4 leading-tight" style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(28px, 5vw, 52px)' }}>
                    {heroItem.title || heroItem.name}
                  </h1>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-1.5" style={{ color: '#fbbf24' }}>
                      <Star size={13} fill="currentColor" />
                      <span className="text-sm font-bold">{heroItem.vote_average.toFixed(1)}</span>
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
                    <span className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      {(heroItem.release_date || heroItem.first_air_date || '').slice(0, 4)}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.55)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {heroItem.overview}
                  </p>
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleSelectTitle(heroItem as any)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:scale-105"
                      style={{ background: '#e63946', boxShadow: '0 4px 20px rgba(230,57,70,0.4)' }}>
                      <Play size={13} fill="white" /> Where to Watch
                    </button>
                    <button onClick={() => handleSelectTitle(heroItem as any)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all hover:bg-white/10"
                      style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <Info size={13} /> More Info
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className={`px-6 md:px-10 pb-20 ${!heroItem ? 'pt-28 md:pt-20' : ''}`} style={{ marginTop: heroItem ? '2rem' : undefined }}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-1 p-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                {(['all', 'movie', 'tv'] as MediaType[]).map((type) => (
                  <button key={type} onClick={() => { setMediaType(type); setSelectedGenre(null); }}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all"
                    style={{
                      background: mediaType === type ? '#e63946' : 'transparent',
                      color: mediaType === type ? 'white' : 'rgba(255,255,255,0.45)',
                      boxShadow: mediaType === type ? '0 2px 10px rgba(230,57,70,0.3)' : 'none',
                    }}>
                    {type === 'tv' && <Tv size={12} />}
                    {type === 'movie' && <Film size={12} />}
                    {type === 'all' && <TrendingUp size={12} />}
                    {type === 'all' ? 'All' : type === 'movie' ? 'Movies' : 'TV Shows'}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 p-1 rounded-full"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <button onClick={() => { setViewMode('trending'); setSelectedGenre(null); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={{
                      background: viewMode === 'trending' ? '#e63946' : 'transparent',
                      color: viewMode === 'trending' ? 'white' : 'rgba(255,255,255,0.45)',
                    }}>
                    <TrendingUp size={11} /> Trending
                  </button>
                  <button onClick={() => { setViewMode('top-rated'); setSelectedGenre(null); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={{
                      background: viewMode === 'top-rated' ? '#e63946' : 'transparent',
                      color: viewMode === 'top-rated' ? 'white' : 'rgba(255,255,255,0.45)',
                    }}>
                    <Star size={11} /> Top Rated
                  </button>
                </div>
              </div>
            </div>

            {/* Genre filters */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              <Tag size={13} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
              <button onClick={() => setSelectedGenre(null)}
                className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0"
                style={{
                  background: selectedGenre === null ? '#e63946' : 'rgba(255,255,255,0.04)',
                  color: selectedGenre === null ? 'white' : 'rgba(255,255,255,0.45)',
                  border: `1px solid ${selectedGenre === null ? 'transparent' : 'rgba(255,255,255,0.07)'}`,
                }}>
                All Genres
              </button>
              {GENRES
                .filter(g => mediaType === 'all' || g.types.includes(mediaType))
                .map((genre) => (
                  <button key={genre.id} onClick={() => setSelectedGenre(selectedGenre === genre.id ? null : genre.id)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0"
                    style={{
                      background: selectedGenre === genre.id ? '#e63946' : 'rgba(255,255,255,0.04)',
                      color: selectedGenre === genre.id ? 'white' : 'rgba(255,255,255,0.45)',
                      border: `1px solid ${selectedGenre === genre.id ? 'transparent' : 'rgba(255,255,255,0.07)'}`,
                    }}>
                    {genre.name}
                  </button>
                ))}
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {Array.from({ length: 20 }).map((_, i) => (
                  <div key={i} className="rounded-2xl animate-pulse" style={{ aspectRatio: '2/3', background: 'rgba(255,255,255,0.04)' }} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4" id="trending-grid">
                {trending.map((item, index) => (
                  <div key={item.id} onClick={() => handleSelectTitle(item as any)}
                    className="group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1.5"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}>
                    <div className="absolute top-2.5 left-2.5 z-10 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold"
                      style={{
                        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
                        color: index < 3 ? '#e63946' : 'rgba(255,255,255,0.5)',
                        border: index < 3 ? '1px solid rgba(230,57,70,0.3)' : 'none'
                      }}>
                      {index + 1}
                    </div>
                    <div className="relative overflow-hidden" style={{ aspectRatio: '2/3' }}>
                      {item.poster_path ? (
                        <img src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                          alt={item.title || item.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs"
                          style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.2)' }}>No Image</div>
                      )}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3"
                        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)' }}>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold w-full justify-center"
                          style={{ background: 'rgba(230,57,70,0.9)' }}>
                          <Play size={10} fill="white" /> Where to Watch
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium truncate leading-tight mb-1.5">{item.title || item.name}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1" style={{ color: '#fbbf24' }}>
                          <Star size={10} fill="currentColor" />
                          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{item.vote_average.toFixed(1)}</span>
                        </div>
                        <span className="text-xs uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.25)' }}>
                          {item.media_type === 'tv' ? 'Series' : 'Film'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Load More */}
            {!loading && hasMoreTrending && trending.length > 0 && (
              <div className="flex justify-center mt-10">
                <button onClick={loadMoreTrending} disabled={loadingMore}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all hover:scale-105 disabled:opacity-50"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
                  {loadingMore ? 'Loading…' : 'Load More'}
                </button>
              </div>
            )}

            {/* New This Month */}
            {newThisMonth.length > 0 && (
              <div className="mt-14">
                <div className="flex items-center gap-2 mb-5">
                  <h2 className="text-lg font-bold" style={{ fontFamily: 'var(--font-playfair)' }}>New This Month</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: 'rgba(230,57,70,0.12)', color: '#e63946', border: '1px solid rgba(230,57,70,0.2)' }}>
                    {selectedCountry?.name}
                  </span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-3" style={{ scrollbarWidth: 'none' }}>
                  {newThisMonth.map((item) => (
                    <div key={item.id} onClick={() => handleSelectTitle(item as any)}
                      className="shrink-0 group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1"
                      style={{ width: '130px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="relative overflow-hidden" style={{ aspectRatio: '2/3' }}>
                        {item.poster_path ? (
                          <img src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
                            alt={item.title || item.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs"
                            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.2)' }}>No Image</div>
                        )}
                        <div className="absolute top-2 right-2 text-xs px-1.5 py-0.5 rounded-md font-semibold"
                          style={{ background: '#e63946', color: 'white' }}>
                          NEW
                        </div>
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs font-medium truncate leading-tight mb-1">{item.title || item.name}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1" style={{ color: '#fbbf24' }}>
                            <Star size={9} fill="currentColor" />
                            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.vote_average?.toFixed(1)}</span>
                          </div>
                          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
                            {item.media_type === 'tv' ? 'Series' : 'Film'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
