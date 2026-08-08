import { NextRequest, NextResponse } from 'next/server';
import { resolveInsights, resolveProStatus } from '@/lib/epic/server';

// GET /api/bff/epic/insights — Epic Pro "Portfolio Insights" (C-125). An aggregate of
// the caller's OWN projects (a founder dashboard). Identity is the `tec_user` session
// cookie server-side — NEVER a query param or body (P6). The aggregate is gated behind
// the caller's LIVE subscription (P5 — Epic never stores billing); a non-Pro gets
// `{ pro: false }` so the UI can show a teaser. Honest empty state on no session.
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
  if (!owner) return NextResponse.json({ pro: false, insights: null }, { status: 401 });

  const token = req.cookies.get('tec_access_token')?.value ?? null;
  const isPro = await resolveProStatus(token);
  if (!isPro) return NextResponse.json({ pro: false, insights: null }, { headers: { 'Cache-Control': 'private, max-age=15' } });

  const insights = await resolveInsights(owner);
  return NextResponse.json({ pro: true, insights }, { headers: { 'Cache-Control': 'private, max-age=30' } });
}
