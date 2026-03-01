'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, Tv, Film, Star, Play, Tag, Globe } from 'lucide-react';

const SERVICES = [
  { id: '8', name: 'Netflix', color: '#E50914', emoji: '🎬' },
  { id: '9', name: 'Prime Video', color: '#00A8E0', emoji: '📦' },
  { id: '337', name: 'Disney+', color: '#113CCF', emoji: '🏰' },
  { id: '15', name: 'Hulu', color: '#1CE783', emoji: '📺' },
  { id: '1899', name: 'Max', color: '#5822B4', emoji: '👑' },
  { id: '350', name: 'Apple TV+', color: '#1a1a1a', emoji: '🍎' },
  { id: '531', name: 'Paramount+', color: '#0064FF', emoji: '⭐' },
  { id: '386', name: 'Peacock', color: '#2C2C2C', emoji: '🦚' },
  { id: '190', name: 'MUBI', color: '#FF3C00', emoji: '🎭' },
];

const COUNTRIES = [
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
];

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

function svcColor(name: string) {
  return SERVICES.find((s) => s.name === name)?.color || '#555';
}
function svcEmoji(name: string) {
  return SERVICES.find((s) => s.name === name)?.emoji || '📺';
}
function countryFlag(code: string) {
  return COUNTRIES.find((c) => c.code === code)?.flag || code;
}

interface Title {
  id: number; title?: string; name?: string; poster_path: string;
  vote_average: number; media_type: string; overview: string;
  release_date?: string; first_air_date?: string;
  services?: Record<string, string[]>;
}

type Mode = 'grid' | 'catalog' | 'together';

export default function ServicesPage() {
  const [mode, setMode] = useState<Mode>('grid');
  const [selectedService, setSelectedService] = useState<typeof SERVICES[0] | null>(null);
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>('movie');
  const [country, setCountry] = useState('US');
  const [titles, setTitles] = useState<Title[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [catalogPage, setCatalogPage] = useState(1);
  const [hasMoreCatalog, setHasMoreCatalog] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);

  // Watch Together
  const [pickedCountries, setPickedCountries] = useState<string[]>([]);
  const [overlapTitles, setOverlapTitles] = useState<Title[]>([]);
  const [overlapLoading, setOverlapLoading] = useState(false);
  const [sharedServices, setSharedServices] = useState<string[]>([]);
  const [overlapSvc, setOverlapSvc] = useState<string | null>(null);

  useEffect(() => {
    if (mode === 'catalog' && selectedService) { setCatalogPage(1); setHasMoreCatalog(true); fetchCatalog(1); }
  }, [selectedService, mediaType, country, selectedGenre]);

  useEffect(() => {
    if (mode === 'together' && pickedCountries.length >= 2) fetchOverlap();
  }, [pickedCountries, mediaType, selectedGenre, overlapSvc]);

  async function fetchCatalog(page = 1) {
    if (!selectedService) return;
    if (page === 1) setLoading(true); else setLoadingMore(true);
    const g = selectedGenre ? `&genre=${selectedGenre}` : '';
    try {
      const r = await fetch(`/api/services?serviceId=${selectedService.id}&type=${mediaType}&country=${country}${g}&page=${page}`, { cache: 'no-store' });
      const d = await r.json();
      const results = d.results || [];
      if (results.length === 0) setHasMoreCatalog(false);
      if (page === 1) setTitles(results); else setTitles((prev) => [...prev, ...results]);
    } catch { /* */ }
    if (page === 1) setLoading(false); else setLoadingMore(false);
  }

  async function loadMoreCatalog() {
    const next = catalogPage + 1;
    setCatalogPage(next);
    await fetchCatalog(next);
  }

  async function fetchOverlap() {
    setOverlapLoading(true);
    const g = selectedGenre ? `&genre=${selectedGenre}` : '';
    const s = overlapSvc ? `&serviceId=${overlapSvc}` : '';
    try {
      const r = await fetch(`/api/services/overlap?countries=${pickedCountries.join(',')}&type=${mediaType}${s}${g}`, { cache: 'no-store' });
      const d = await r.json();
      setOverlapTitles(d.results || []);
      setSharedServices(d.sharedServices || []);
    } catch {
      setOverlapTitles([]);
      setSharedServices([]);
    }
    setOverlapLoading(false);
  }

  function goGrid() { setMode('grid'); setSelectedService(null); setTitles([]); setOverlapTitles([]); setPickedCountries([]); }
  function goCatalog(svc: typeof SERVICES[0]) { setSelectedService(svc); setMode('catalog'); setTitles([]); setSelectedGenre(null); }
  function goTogether() { setMode('together'); setPickedCountries([]); setOverlapTitles([]); setSharedServices([]); setOverlapSvc(null); setSelectedGenre(null); }
  function togglePick(code: string) { setPickedCountries((p) => p.includes(code) ? p.filter((c) => c !== code) : [...p, code]); }

  const accent = mode === 'catalog' && selectedService ? selectedService.color : '#e63946';

  // Shared genre chip renderer
  function GenreBar() {
    return (
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        <Tag size={13} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }} />
        <button onClick={() => setSelectedGenre(null)}
          className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0"
          style={{ background: !selectedGenre ? accent : 'rgba(255,255,255,0.04)', color: !selectedGenre ? 'white' : 'rgba(255,255,255,0.45)', border: `1px solid ${!selectedGenre ? 'transparent' : 'rgba(255,255,255,0.07)'}` }}>
          All Genres
        </button>
        {GENRES.filter((g) => g.types.includes(mediaType)).map((g) => (
          <button key={g.id} onClick={() => setSelectedGenre(selectedGenre === g.id ? null : g.id)}
            className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0"
            style={{ background: selectedGenre === g.id ? accent : 'rgba(255,255,255,0.04)', color: selectedGenre === g.id ? 'white' : 'rgba(255,255,255,0.45)', border: `1px solid ${selectedGenre === g.id ? 'transparent' : 'rgba(255,255,255,0.07)'}` }}>
            {g.name}
          </button>
        ))}
      </div>
    );
  }

  function MediaToggle({ color }: { color: string }) {
    return (
      <div className="flex items-center gap-1 p-1 rounded-full"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <button onClick={() => { setMediaType('movie'); setSelectedGenre(null); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
          style={{ background: mediaType === 'movie' ? color : 'transparent', color: mediaType === 'movie' ? 'white' : 'rgba(255,255,255,0.45)' }}>
          <Film size={12} /> Movies
        </button>
        <button onClick={() => { setMediaType('tv'); setSelectedGenre(null); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
          style={{ background: mediaType === 'tv' ? color : 'transparent', color: mediaType === 'tv' ? 'white' : 'rgba(255,255,255,0.45)' }}>
          <Tv size={12} /> TV Shows
        </button>
      </div>
    );
  }

  function LoadingSkeleton() {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="rounded-2xl animate-pulse" style={{ aspectRatio: '2/3', background: 'rgba(255,255,255,0.04)' }} />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white" style={{ background: '#080810' }}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 md:px-6 py-3 flex items-center gap-4"
        style={{ background: 'rgba(8,8,16,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <a href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
            style={{ background: 'linear-gradient(135deg, #e63946, #c1121f)' }}>📡</div>
          <span className="text-xl tracking-wide" style={{ fontFamily: 'var(--font-bebas)' }}>
            STREAM<span style={{ color: '#e63946' }}>SCOPE</span>
          </span>
        </a>
        <nav className="flex items-center gap-1 ml-4">
          <a href="/" className="px-3 py-1.5 rounded-full text-sm transition-colors hover:bg-white/5" style={{ color: 'rgba(255,255,255,0.4)' }}>Trending</a>
          <a href="/services" className="px-3 py-1.5 rounded-full text-sm font-medium"
            style={{ background: 'rgba(230,57,70,0.1)', color: '#e63946', border: '1px solid rgba(230,57,70,0.2)' }}>Services</a>
        </nav>
      </header>

      <div className="pt-20 px-6 md:px-10 pb-20">

        {/* ─── GRID ─── */}
        {mode === 'grid' && (
          <>
            <div className="mb-8 pt-6">
              <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-playfair)' }}>Browse by Service</h1>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Pick a streaming platform to explore its catalog</p>
            </div>
            <div className="flex items-center gap-2 mb-8">
              <span className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Region:</span>
              <div className="flex flex-wrap gap-2">
                {COUNTRIES.map((c) => (
                  <button key={c.code} onClick={() => setCountry(c.code)}
                    className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                    style={{ background: country === c.code ? '#e63946' : 'rgba(255,255,255,0.05)', color: country === c.code ? 'white' : 'rgba(255,255,255,0.5)', border: `1px solid ${country === c.code ? 'transparent' : 'rgba(255,255,255,0.07)'}` }}>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {SERVICES.map((s) => (
                <button key={s.id} onClick={() => goCatalog(s)}
                  className="group relative rounded-2xl p-6 text-left transition-all duration-300 hover:-translate-y-1.5"
                  style={{ background: `linear-gradient(135deg, ${s.color}22 0%, ${s.color}08 100%)`, border: `1px solid ${s.color}30`, boxShadow: `0 4px 20px ${s.color}15` }}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = `0 8px 30px ${s.color}35`)}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = `0 4px 20px ${s.color}15`)}>
                  <div className="text-4xl mb-3">{s.emoji}</div>
                  <div className="font-bold text-sm">{s.name}</div>
                  <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Browse catalog →</div>
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: `linear-gradient(135deg, ${s.color}15 0%, transparent 100%)` }} />
                </button>
              ))}
              <button onClick={goTogether}
                className="group relative rounded-2xl p-6 text-left transition-all duration-300 hover:-translate-y-1.5"
                style={{ background: 'linear-gradient(135deg, rgba(230,57,70,0.18) 0%, rgba(99,102,241,0.08) 100%)', border: '1px solid rgba(230,57,70,0.3)', boxShadow: '0 4px 20px rgba(230,57,70,0.12)' }}
                onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 8px 30px rgba(230,57,70,0.3)')}
                onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(230,57,70,0.12)')}>
                <div className="text-4xl mb-3">🌍</div>
                <div className="font-bold text-sm">Watch Together</div>
                <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>Find shared titles →</div>
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(135deg, rgba(230,57,70,0.1) 0%, transparent 100%)' }} />
              </button>
            </div>
          </>
        )}

        {/* ─── CATALOG ─── */}
        {mode === 'catalog' && selectedService && (
          <>
            <div className="pt-6 mb-6 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <button onClick={goGrid} className="flex items-center gap-1.5 text-sm transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  <ChevronLeft size={15} /> All Services
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selectedService.emoji}</span>
                  <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-playfair)' }}>{selectedService.name}</h1>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MediaToggle color={selectedService.color} />
                <select value={country} onChange={(e) => setCountry(e.target.value)}
                  className="px-3 py-1.5 rounded-full text-sm outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}>
                  {COUNTRIES.map((c) => <option key={c.code} value={c.code} style={{ background: '#12121e' }}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <GenreBar />
            {loading ? <LoadingSkeleton /> : titles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="text-5xl mb-4">😔</span>
                <p className="text-lg font-medium mb-2">{selectedService.name} not available here</p>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Try a different country</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {titles.map((t, i) => (
                  <div key={t.id} className="group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1.5"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="absolute top-2.5 left-2.5 z-10 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold"
                      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', color: 'rgba(255,255,255,0.5)' }}>{i + 1}</div>
                    <div className="relative overflow-hidden" style={{ aspectRatio: '2/3' }}>
                      {t.poster_path ? (
                        <img src={`https://image.tmdb.org/t/p/w500${t.poster_path}`} alt={t.title || t.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.2)' }}>No Image</div>
                      )}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3"
                        style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 60%)' }}>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold w-full justify-center" style={{ background: selectedService.color }}>
                          <Play size={10} fill="white" /> Watch on {selectedService.name}
                        </div>
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium truncate leading-tight mb-1.5">{t.title || t.name}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1" style={{ color: '#fbbf24' }}>
                          <Star size={10} fill="currentColor" />
                          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{t.vote_average.toFixed(1)}</span>
                        </div>
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>{(t.release_date || t.first_air_date || '').slice(0, 4)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Load More */}
            {!loading && hasMoreCatalog && titles.length > 0 && (
              <div className="flex justify-center mt-10">
                <button onClick={loadMoreCatalog} disabled={loadingMore}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all hover:scale-105 disabled:opacity-50"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
                  {loadingMore ? 'Loading…' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}

        {/* ─── WATCH TOGETHER ─── */}
        {mode === 'together' && (
          <>
            <div className="pt-6 mb-2 flex items-center gap-4">
              <button onClick={goGrid} className="flex items-center gap-1.5 text-sm transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.4)' }}>
                <ChevronLeft size={15} /> All Services
              </button>
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🌍</span>
                <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-playfair)' }}>Watch Together</h1>
              </div>
            </div>
            <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.4)', maxWidth: '480px' }}>
              Pick two or more countries to find titles available everywhere — perfect for movie nights across borders.
            </p>

            {/* Country picker */}
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Countries {pickedCountries.length >= 2 && <span style={{ color: '#e63946' }}>· {pickedCountries.length} selected</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {COUNTRIES.map((c) => {
                  const on = pickedCountries.includes(c.code);
                  return (
                    <button key={c.code} onClick={() => togglePick(c.code)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                      style={{
                        background: on ? 'rgba(230,57,70,0.15)' : 'rgba(255,255,255,0.03)',
                        color: on ? 'white' : 'rgba(255,255,255,0.45)',
                        border: `1.5px solid ${on ? '#e63946' : 'rgba(255,255,255,0.07)'}`,
                        boxShadow: on ? '0 0 12px rgba(230,57,70,0.15)' : 'none',
                      }}>
                      <span>{c.flag}</span> {c.name}
                    </button>
                  );
                })}
              </div>
              {pickedCountries.length < 2 && (
                <p className="text-xs mt-3" style={{ color: 'rgba(255,255,255,0.2)' }}>Select at least 2</p>
              )}
            </div>

            {/* Optional service filter */}
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>Service</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setOverlapSvc(null)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={{ background: !overlapSvc ? '#e63946' : 'rgba(255,255,255,0.04)', color: !overlapSvc ? 'white' : 'rgba(255,255,255,0.45)', border: `1px solid ${!overlapSvc ? 'transparent' : 'rgba(255,255,255,0.07)'}` }}>
                  Any
                </button>
                {SERVICES.map((s) => (
                  <button key={s.id} onClick={() => setOverlapSvc(overlapSvc === s.id ? null : s.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={{ background: overlapSvc === s.id ? s.color : 'rgba(255,255,255,0.04)', color: overlapSvc === s.id ? 'white' : 'rgba(255,255,255,0.45)', border: `1px solid ${overlapSvc === s.id ? 'transparent' : 'rgba(255,255,255,0.07)'}` }}>
                    {s.emoji} {s.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4"><MediaToggle color="#e63946" /></div>
            <GenreBar />

            {/* Shared services banner */}
            {!overlapLoading && sharedServices.length > 0 && overlapTitles.length > 0 && (
              <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-xs font-bold uppercase tracking-widest shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }}>Shared</span>
                <div className="flex flex-wrap gap-1.5">
                  {sharedServices.map((name) => (
                    <span key={name} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                      style={{ background: svcColor(name), boxShadow: `0 1px 6px ${svcColor(name)}50` }}>
                      {svcEmoji(name)} {name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Results */}
            {pickedCountries.length < 2 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Globe size={40} style={{ color: 'rgba(255,255,255,0.08)', marginBottom: '16px' }} />
                <p className="text-lg font-medium mb-2">Pick your countries</p>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>Select 2+ countries to discover shared titles</p>
              </div>
            ) : overlapLoading ? <LoadingSkeleton /> : overlapTitles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <span className="text-5xl mb-4">😔</span>
                <p className="text-lg font-medium mb-2">No shared titles found</p>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Try fewer countries, a different genre, or remove the service filter</p>
              </div>
            ) : (
              <>
                <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  {overlapTitles.length} title{overlapTitles.length !== 1 ? 's' : ''} in&nbsp;
                  {pickedCountries.map((c) => COUNTRIES.find((co) => co.code === c)?.name || c).join(' + ')}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {overlapTitles.map((t, i) => {
                    const svcs = t.services || {};
                    const hasSvcs = Object.keys(svcs).length > 0;
                    // Unique service names across all countries
                    const allNames = [...new Set(Object.values(svcs).flat())];

                    return (
                      <div key={t.id}
                        className="group relative rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        {/* Rank */}
                        <div className="absolute top-2.5 left-2.5 z-10 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold"
                          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', color: i < 3 ? '#e63946' : 'rgba(255,255,255,0.5)' }}>
                          {i + 1}
                        </div>
                        {/* Poster */}
                        <div className="relative overflow-hidden" style={{ aspectRatio: '2/3' }}>
                          {t.poster_path ? (
                            <img src={`https://image.tmdb.org/t/p/w500${t.poster_path}`} alt={t.title || t.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.2)' }}>No Image</div>
                          )}
                          {/* Hover overlay */}
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 gap-1"
                            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, transparent 55%)' }}>
                            {hasSvcs ? pickedCountries.map((c) => (
                              <div key={c} className="flex items-center justify-between text-xs">
                                <span>{countryFlag(c)} {c}</span>
                                <span className="truncate ml-2" style={{ color: svcs[c] ? 'rgba(30,215,96,0.85)' : 'rgba(255,255,255,0.25)' }}>
                                  {svcs[c] ? svcs[c].join(', ') : '—'}
                                </span>
                              </div>
                            )) : (
                              <div className="text-xs text-center" style={{ color: 'rgba(30,215,96,0.8)' }}>Available in all selected countries</div>
                            )}
                          </div>
                        </div>
                        {/* Info */}
                        <div className="p-3">
                          <p className="text-sm font-medium truncate leading-tight mb-1">{t.title || t.name}</p>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1" style={{ color: '#fbbf24' }}>
                              <Star size={10} fill="currentColor" />
                              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>{t.vote_average.toFixed(1)}</span>
                            </div>
                            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>{(t.release_date || t.first_air_date || '').slice(0, 4)}</span>
                          </div>
                          {/* Service pills */}
                          {hasSvcs && (
                            <div className="flex flex-wrap gap-1">
                              {allNames.slice(0, 3).map((name) => {
                                const inAll = pickedCountries.every((c) => svcs[c]?.includes(name));
                                return (
                                  <span key={name} className="text-xs px-1.5 py-0.5 rounded-md"
                                    style={{
                                      background: inAll ? `${svcColor(name)}22` : 'rgba(255,255,255,0.04)',
                                      color: inAll ? svcColor(name) : 'rgba(255,255,255,0.3)',
                                      border: `1px solid ${inAll ? `${svcColor(name)}33` : 'rgba(255,255,255,0.06)'}`,
                                    }}>
                                    {name}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
