import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get('type') || 'movie'; // 'movie' | 'tv'
  const region = req.nextUrl.searchParams.get('region') || 'US';
  const genre = req.nextUrl.searchParams.get('genre') || '';
  const page = req.nextUrl.searchParams.get('page') || '1';
  const token = process.env.TMDB_API_TOKEN;
  const headers = { Authorization: `Bearer ${token}` };

  try {
    if (type === 'all') {
      const g = genre ? `&with_genres=${genre}` : '';
      const [movieRes, tvRes] = await Promise.all([
        fetch(`https://api.themoviedb.org/3/movie/top_rated?region=${region}&page=${page}${g}`, { headers }),
        fetch(`https://api.themoviedb.org/3/tv/top_rated?region=${region}&page=${page}${g}`, { headers }),
      ]);
      const movieData = await movieRes.json();
      const tvData = await tvRes.json();
      const movies = (movieData.results || []).map((i: any) => ({ ...i, media_type: 'movie' }));
      const tvShows = (tvData.results || []).map((i: any) => ({ ...i, media_type: 'tv' }));
      const results = [...movies, ...tvShows].sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
      return NextResponse.json({ results });
    }

    const g = genre ? `&with_genres=${genre}` : '';
    const res = await fetch(
      `https://api.themoviedb.org/3/${type}/top_rated?region=${region}&page=${page}${g}`,
      { headers }
    );
    const data = await res.json();
    const results = (data.results || []).map((i: any) => ({ ...i, media_type: type }));
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
