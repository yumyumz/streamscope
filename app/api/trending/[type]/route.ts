import { NextRequest, NextResponse } from 'next/server';
export async function GET(req: NextRequest, context: { params: Promise<{ type: string }> }) {
  const { type } = await context.params;
  const region = req.nextUrl.searchParams.get('region') || 'US';
  const genre = req.nextUrl.searchParams.get('genre') || '';
  const page = req.nextUrl.searchParams.get('page') || '1';
  const token = process.env.TMDB_API_TOKEN;
  const headers = { Authorization: `Bearer ${token}` };
  const langMap: Record<string,string> = { KR:'ko', JP:'ja', FR:'fr', DE:'de', ES:'es', IT:'it', BR:'pt', MX:'es', IN:'hi', SE:'sv', NL:'nl' };
  const lang = langMap[region];
  try {
    // When a genre filter is set, always use discover (trending endpoint doesn't support genre filtering)
    if (genre && type !== 'all') {
      const url = `https://api.themoviedb.org/3/discover/${type}?region=${region}&with_genres=${genre}&sort_by=popularity.desc&page=${page}${lang ? `&with_original_language=${lang}` : ''}`;
      const res = await fetch(url, { headers });
      const data = await res.json();
      const results = data.results?.map((item: any) => ({ ...item, media_type: type }));
      return NextResponse.json({ results });
    }
    if (lang && type !== 'all') {
      const url = `https://api.themoviedb.org/3/discover/${type}?region=${region}&with_original_language=${lang}&sort_by=popularity.desc&page=${page}`;
      const res = await fetch(url, { headers });
      const data = await res.json();
      const results = data.results?.map((item: any) => ({ ...item, media_type: type }));
      return NextResponse.json({ results });
    }
    if (genre && type === 'all') {
      const [movieRes, tvRes] = await Promise.all([
        fetch(`https://api.themoviedb.org/3/discover/movie?region=${region}&with_genres=${genre}&sort_by=popularity.desc&page=${page}`, { headers }),
        fetch(`https://api.themoviedb.org/3/discover/tv?region=${region}&with_genres=${genre}&sort_by=popularity.desc&page=${page}`, { headers }),
      ]);
      const movieData = await movieRes.json();
      const tvData = await tvRes.json();
      const movies = (movieData.results || []).map((item: any) => ({ ...item, media_type: 'movie' }));
      const tvShows = (tvData.results || []).map((item: any) => ({ ...item, media_type: 'tv' }));
      const results = [...movies, ...tvShows].sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0));
      return NextResponse.json({ results });
    }
    const res = await fetch(`https://api.themoviedb.org/3/trending/${type}/week?region=${region}&page=${page}`, { headers });
    const data = await res.json();
    return NextResponse.json(data);
  } catch { return NextResponse.json({ error: 'Failed' }, { status: 500 }); }
}
