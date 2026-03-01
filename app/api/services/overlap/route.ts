import { NextRequest, NextResponse } from 'next/server';

const KNOWN_SERVICES: Record<number, string> = {
  8: 'Netflix', 9: 'Prime Video', 337: 'Disney+', 15: 'Hulu',
  1899: 'Max', 350: 'Apple TV+', 531: 'Paramount+', 386: 'Peacock', 190: 'MUBI',
};

export async function GET(req: NextRequest) {
  const countriesParam = req.nextUrl.searchParams.get('countries') || '';
  const serviceId = req.nextUrl.searchParams.get('serviceId') || '';
  const type = req.nextUrl.searchParams.get('type') || 'movie';
  const genre = req.nextUrl.searchParams.get('genre') || '';
  const token = process.env.TMDB_API_TOKEN;
  const headers = { Authorization: `Bearer ${token}` };
  const countries = countriesParam.split(',').filter(Boolean);

  if (countries.length < 2) {
    return NextResponse.json({ error: 'Need 2+ countries' }, { status: 400 });
  }

  try {
    // 1. Discover titles per country in parallel
    const perCountry = await Promise.all(
      countries.map(async (c) => {
        let url = `https://api.themoviedb.org/3/discover/${type}?watch_region=${c}&sort_by=popularity.desc`;
        if (serviceId) url += `&with_watch_providers=${serviceId}`;
        if (genre) url += `&with_genres=${genre}`;
        const r = await fetch(url, { headers });
        const d = await r.json();
        return { country: c, ids: new Set((d.results || []).map((t: any) => t.id)), items: d.results || [] };
      })
    );

    // 2. Intersect IDs
    let common = new Set(perCountry[0].ids);
    for (let i = 1; i < perCountry.length; i++) {
      common = new Set([...common].filter((id) => perCountry[i].ids.has(id)));
    }

    const titleMap = new Map(perCountry[0].items.map((t: any) => [t.id, t]));
    const titles = [...common]
      .map((id) => titleMap.get(id))
      .filter(Boolean)
      .sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0));

    // 3. Fetch watch/providers for top 20 to get per-country service info
    const top = titles.slice(0, 20);
    const provResults = await Promise.all(
      top.map(async (t: any) => {
        try {
          const r = await fetch(`https://api.themoviedb.org/3/${type}/${t.id}/watch/providers`, { headers });
          const d = await r.json();
          return { id: t.id, data: d.results || {} };
        } catch { return { id: t.id, data: {} }; }
      })
    );

    const provMap = new Map(provResults.map((p) => [p.id, p.data]));

    // 4. Build results with per-country services
    const sharedServiceSet = new Map<string, string>(); // id → name

    const results = titles.map((t: any) => {
      const prov = provMap.get(t.id) || {};
      const services: Record<string, string[]> = {}; // country → service names

      for (const c of countries) {
        const cd = prov[c];
        if (!cd) continue;
        const names: string[] = [];
        for (const p of [...(cd.flatrate || []), ...(cd.free || [])]) {
          const name = KNOWN_SERVICES[p.provider_id] || p.provider_name;
          if (name && !names.includes(name)) names.push(name);
        }
        if (names.length) services[c] = names;
      }

      // Track services in ALL countries for this title
      if (Object.keys(services).length === countries.length) {
        const first = services[countries[0]];
        for (const name of first) {
          const inAll = countries.every((c) => services[c]?.includes(name));
          if (inAll) sharedServiceSet.set(name, name);
        }
      }

      return { ...t, media_type: type, services };
    });

    return NextResponse.json({
      results,
      sharedServices: [...sharedServiceSet.keys()],
      countries,
    });
  } catch (e) {
    console.error('Overlap error:', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
