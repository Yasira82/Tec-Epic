import { NextRequest, NextResponse } from 'next/server';
import { resolveOwnProjects } from '@/lib/epic/server';

// GET /api/bff/epic/projects — the project board (C-125), read-only.
// Epic is the Creation Runtime: it OWNS project creation/structure/lifecycle and
// COORDINATES the owning apps (Zone verifies, FundX funds, Legend records).
// Identity is derived from the `tec_user` session cookie server-side — NEVER a query
// param or body (P6). The owner is passed to the backend; on no session / unreachable
// backend, the curated sample is served so the board is never blank. Verification is
// presented from Zone and funding from FundX — never derived here.
function ownerFromSession(req: NextRequest): string | null {
  try {
    const raw = req.cookies.get('tec_user')?.value ?? '';
    if (!raw) return null;
    let u: Record<string, unknown>;
    try { u = JSON.parse(raw); } catch { u = JSON.parse(decodeURIComponent(raw)); }
    const owner = (u.piUsername ?? u.username) as string | undefined;
    return owner && owner.trim() ? owner : null;
  } catch { return null; }
}

export async function GET(req: NextRequest) {
  const owner = ownerFromSession(req);
  const { projects, source } = await resolveOwnProjects(owner);
  return NextResponse.json(
    { source, projects },
    { headers: { 'Cache-Control': 'private, max-age=60' } },
  );
}
