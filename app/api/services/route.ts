import { NextRequest, NextResponse } from 'next/server';
export async function GET(req: NextRequest) {
  const country = req.nextUrl.searchParams.get('country') || 'US';
  const serviceId = req.nextUrl.searchParams.get('serviceId') || '8';
  const type = req.nextUrl.searchParams.get('type') || 'movie';
  const genre = req.nextUrl.searchParams.get('genre') || '';
  const page = req.nextUrl.searchParams.get('page') || '1';
  const token = process.env.TMDB_API_TOKEN;
  let url = `https://api.themoviedb.org/3/discover/${type}?watch_region=${country}&with_watch_providers=${serviceId}&sort_by=popularity.desc&page=${page}`;
  if (genre) url += `&with_genres=${genre}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  const results = data.results?.map((item: any) => ({ ...item, media_type: type }));
  return NextResponse.json({ results: results || [] });
}
