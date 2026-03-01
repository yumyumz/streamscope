import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('tmdbId');
  const type = req.nextUrl.searchParams.get('type'); // 'movie' or 'tv'
  if (!id || !type) return NextResponse.json({ error: 'Missing params' }, { status: 400 });

  const mediaType = type === 'tv' ? 'tv' : 'movie';
  const token = process.env.TMDB_API_TOKEN;
  const headers = { Authorization: `Bearer ${token}` };

  try {
    const [detailRes, videosRes, similarRes] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/${mediaType}/${id}`, { headers }),
      fetch(`https://api.themoviedb.org/3/${mediaType}/${id}/videos`, { headers }),
      fetch(`https://api.themoviedb.org/3/${mediaType}/${id}/similar?page=1`, { headers }),
    ]);

    const detail = await detailRes.json();
    const videos = await videosRes.json();
    const similar = await similarRes.json();

    // Find best trailer: prefer official YouTube trailers
    const trailer = (videos.results || []).find(
      (v: any) => v.site === 'YouTube' && v.type === 'Trailer' && v.official
    ) || (videos.results || []).find(
      (v: any) => v.site === 'YouTube' && v.type === 'Trailer'
    ) || null;

    return NextResponse.json({
      runtime: detail.runtime || detail.episode_run_time?.[0] || null,
      genres: (detail.genres || []).map((g: any) => g.name),
      trailerKey: trailer?.key || null,
      similar: (similar.results || []).slice(0, 12).map((item: any) => ({
        id: item.id,
        title: item.title || item.name,
        poster_path: item.poster_path,
        vote_average: item.vote_average,
        media_type: mediaType,
        release_date: item.release_date,
        first_air_date: item.first_air_date,
      })),
    });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
