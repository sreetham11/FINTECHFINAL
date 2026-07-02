import { NextResponse } from 'next/server';

/**
 * GET /api/nearby-nets?lat=..&lng=..
 *
 * Returns real nearby retail/food merchants (common NETS QR acceptors in SG)
 * from Google Places Nearby Search, with real coordinates + straight-line
 * distance. The Google key stays server-side.
 *
 * Always responds 200. If the key is missing or Places denies the request we
 * return `{ stores: [], fallback: true }` so the map can fall back to its
 * built-in demo pins instead of erroring.
 */

// Legacy Nearby Search accepts a single `type` per call, so we fan out across
// the merchant categories that typically accept NETS and merge the results.
const PLACE_TYPES = ['supermarket', 'convenience_store', 'cafe', 'restaurant'];
const RADIUS_M = 500;
const MAX_RESULTS = 15;

interface Store {
  place_id: string;
  name: string;
  lat: number;
  lng: number;
  type: string;
  distance: number; // metres
  distanceLabel: string;
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // metres
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function distanceLabel(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1)}km away` : `${Math.round(m)}m away`;
}

const prettyType = (t: string) =>
  ({
    supermarket: 'Grocery',
    convenience_store: 'Convenience',
    cafe: 'Café',
    restaurant: 'Food',
  } as Record<string, string>)[t] ?? 'Store';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lat = Number(searchParams.get('lat'));
  const lng = Number(searchParams.get('lng'));

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 });
  }

  // The key in .env.local may carry a stray leading/trailing space — trim it.
  const key = (
    process.env.GOOGLE_PLACES_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    ''
  ).trim();

  if (!key) {
    return NextResponse.json({ stores: [], fallback: true, reason: 'no_api_key' });
  }

  try {
    const results = await Promise.all(
      PLACE_TYPES.map(async (type) => {
        const url =
          `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
          `?location=${lat},${lng}&radius=${RADIUS_M}&type=${type}&key=${key}`;
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) return { type, status: 'HTTP_ERROR', results: [] as any[] };
        const data = await res.json();
        return { type, status: data.status as string, results: (data.results ?? []) as any[] };
      })
    );

    // If every call was denied/errored, tell the client to use its fallback.
    const anyOk = results.some((r) => r.status === 'OK' || r.status === 'ZERO_RESULTS');
    if (!anyOk) {
      const reason = results.find((r) => r.status && r.status !== 'HTTP_ERROR')?.status ?? 'request_failed';
      return NextResponse.json({ stores: [], fallback: true, reason });
    }

    const byId = new Map<string, Store>();
    for (const bucket of results) {
      for (const p of bucket.results) {
        const loc = p.geometry?.location;
        if (!p.place_id || !loc || byId.has(p.place_id)) continue;
        const distance = haversine(lat, lng, loc.lat, loc.lng);
        byId.set(p.place_id, {
          place_id: p.place_id,
          name: p.name,
          lat: loc.lat,
          lng: loc.lng,
          type: prettyType(bucket.type),
          distance,
          distanceLabel: distanceLabel(distance),
        });
      }
    }

    const stores = Array.from(byId.values())
      .sort((a, b) => a.distance - b.distance)
      .slice(0, MAX_RESULTS);

    return NextResponse.json({ stores, fallback: stores.length === 0 });
  } catch (e) {
    console.error('GET /api/nearby-nets error:', e);
    return NextResponse.json({ stores: [], fallback: true, reason: 'exception' });
  }
}
