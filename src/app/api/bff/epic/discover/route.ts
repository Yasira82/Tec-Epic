import { NextRequest, NextResponse } from 'next/server';
import { resolveDiscover } from '@/lib/epic/server';

// GET /api/bff/epic/discover → the PUBLIC project directory (C-125). The whole Pi community
// browses launched projects (no login) — "what's being built on Pi?". Trust-first ranking
// (Zone-verified first, featured/Pro within the tier) is the backend's; the internal key
// is added server-side so the gateway hop is authorized while the end user needs no session.
// Optional ?category filter (whitelisted). Edge-cached briefly (it's public + aggregate).
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('category') ?? '';
  const category = /^[\w &-]{1,40}$/.test(raw) ? raw : '';   // simple whitelist
  const projects = await resolveDiscover(category);
  return NextResponse.json(
    { projects },
    { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=60' } },
  );
}
