import { NextResponse } from 'next/server';
import { PROJECTS } from '@/lib/epic/projects';

// GET /api/bff/epic/projects — the project board (C-125), read-only.
// Epic is the Creation Runtime: it OWNS project creation/structure/lifecycle and
// COORDINATES the owning apps (Zone verifies, FundX funds, Legend records). This
// V1 serves a curated SAMPLE (source:'sample'); when live it proxies the caller's
// OWN projects (identity from the session cookie, never a param — P6), with
// verification presented from Zone and funding from FundX.
export function GET() {
  return NextResponse.json(
    { source: 'sample', projects: PROJECTS },
    { headers: { 'Cache-Control': 'private, max-age=60' } },
  );
}
