import { NextRequest, NextResponse } from 'next/server';

// Map TMDB watch provider flat-rate results into the same shape the frontend expects
function tmdbProvidersToStreamingOptions(
  providersData: Record<string, any>
): Record<string, any[]> {
  const SERVICE_MAP: Record<number, { id: string; name: string }> = {
    8: { id: 'netflix', name: 'Netflix' },
    9: { id: 'prime', name: 'Prime Video' },
    337: { id: 'disney', name: 'Disney+' },
    15: { id: 'hulu', name: 'Hulu' },
    1899: { id: 'hbo', name: 'Max' },
    350: { id: 'apple', name: 'Apple TV+' },
    531: { id: 'paramount', name: 'Paramount+' },
    386: { id: 'peacock', name: 'Peacock' },
    190: { id: 'mubi', name: 'MUBI' },
  };
  const streamingOptions: Record<string, any[]> = {};
  for (const [countryCode, info] of Object.entries(providersData)) {
    const countryInfo = info as any;
    const options: any[] = [];
    const link = countryInfo.link || '';
    // flatrate = subscription streaming
    for (const provider of (countryInfo.flatrate || [])) {
      const mapped = SERVICE_MAP[provider.provider_id];
      options.push({
        service: mapped || { id: String(provider.provider_id), name: provider.provider_name },
        type: 'subscription',
        link,
      });
    }
    // free = ad-supported free streaming
    for (const provider of (countryInfo.free || [])) {
      const mapped = SERVICE_MAP[provider.provider_id];
      options.push({
        service: mapped || { id: String(provider.provider_id), name: provider.provider_name },
        type: 'free',
        link,
      });
    }
    // rent
    for (const provider of (countryInfo.rent || [])) {
      const mapped = SERVICE_MAP[provider.provider_id];
      options.push({
        service: mapped || { id: String(provider.provider_id), name: provider.provider_name },
        type: 'rent',
        link,
      });
    }
    if (options.length > 0) {
      streamingOptions[countryCode.toLowerCase()] = options;
    }
  }
  return streamingOptions;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tmdbId = searchParams.get('tmdbId');
  const type = searchParams.get('type');
  const apiKey = process.env.STREAMING_API_KEY;
  const tmdbToken = process.env.TMDB_API_TOKEN;

  // The Streaming Availability API uses "tv/" prefix (not "series/") for TMDB IDs
  const mediaType = type === 'tv' ? 'tv' : 'movie';

  // Try Streaming Availability API first
  let saData: any = null;
  if (apiKey) {
    try {
      const res = await fetch(
        `https://streaming-availability.p.rapidapi.com/shows/${mediaType}/${tmdbId}?output_language=en`,
        {
          headers: {
            'x-rapidapi-host': 'streaming-availability.p.rapidapi.com',
            'x-rapidapi-key': apiKey,
          },
        }
      );
      if (res.ok) {
        saData = await res.json();
      }
    } catch {
      // Streaming Availability API failed, will fall back to TMDB
    }
  }

  // Check if Streaming Availability API returned useful data
  const hasStreamingOptions = saData?.streamingOptions && Object.keys(saData.streamingOptions).length > 0;

  if (hasStreamingOptions) {
    return NextResponse.json(saData);
  }

  // Fallback: use TMDB's own watch/providers endpoint
  try {
    const tmdbType = type === 'tv' ? 'tv' : 'movie';
    const [providersRes, detailsRes] = await Promise.all([
      fetch(`https://api.themoviedb.org/3/${tmdbType}/${tmdbId}/watch/providers`, {
        headers: { Authorization: `Bearer ${tmdbToken}` },
      }),
      fetch(`https://api.themoviedb.org/3/${tmdbType}/${tmdbId}`, {
        headers: { Authorization: `Bearer ${tmdbToken}` },
      }),
    ]);
    const providersJson = await providersRes.json();
    const detailsJson = await detailsRes.json();
    const streamingOptions = tmdbProvidersToStreamingOptions(providersJson.results || {});
    return NextResponse.json({
      title: detailsJson.title || detailsJson.name || '',
      overview: detailsJson.overview || '',
      streamingOptions,
    });
  } catch {
    // If both APIs fail, return the SA data (may have partial info) or empty
    return NextResponse.json(saData || { streamingOptions: {} });
  }
}
