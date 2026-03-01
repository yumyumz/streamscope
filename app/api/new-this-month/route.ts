import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const region = req.nextUrl.searchParams.get('region') || 'US';
  const type = req.nextUrl.searchParams.get('type') || 'movie'; // 'movie' | 'tv' | 'all'
  const token = process.env.TMDB_API_TOKEN;
  const headers = { Authorization: `Bearer ${token}` };

  const now = new Date();
  const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  try {
    if (type === 'all') {
      const [movieRes, tvRes] = await Promise.all([
        fetch(`https://api.themoviedb.org/3/discover/movie?region=${region}&primary_release_date.gte=${firstOfMonth}&sort_by=popularity.desc`, { headers }),
        fetch(`https://api.themoviedb.org/3/discover/tv?region=${region}&first_air_date.gte=${firstOfMonth}&sort_by=popularity.desc`, { headers }),
      ]);
      const movieData = await movieRes.json();
      const tvData = await tvRes.json();
      const movies = (movieData.results || []).map((i: any) => ({ ...i, media_type: 'movie' }));
      const shows = (tvData.results || []).map((i: any) => ({ ...i, media_type: 'tv' }));
      const results = [...movies, ...shows].sort((a, b) => (b.popularity || 0) - (a.popularity || 0)).slice(0, 20);
      return NextResponse.json({ results });
    }

    const dateKey = type === 'tv' ? 'first_air_date' : 'primary_release_date';
    const res = await fetch(
      `https://api.themoviedb.org/3/discover/${type}?region=${region}&${dateKey}.gte=${firstOfMonth}&sort_by=popularity.desc`,
      { headers }
    );
    const data = await res.json();
    const results = (data.results || []).map((i: any) => ({ ...i, media_type: type }));
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
