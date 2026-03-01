import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  if (!query) return NextResponse.json({ error: 'Query required' }, { status: 400 });
  const token = process.env.TMDB_API_TOKEN;
  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(query)}&include_adult=false`,
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );
    const data = await res.json();
    const filtered = data.results?.filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv');
    return NextResponse.json({ results: filtered || [] });
  } catch {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
