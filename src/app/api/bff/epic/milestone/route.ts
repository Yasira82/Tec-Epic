import { NextRequest, NextResponse } from 'next/server';
import { addMilestone, setMilestoneDone } from '@/lib/epic/server';
import { isE2eMode, e2eStub } from '@/lib/server/e2e-mode';

// POST /api/bff/epic/milestone   — add a milestone to the caller's OWN project.
// PATCH /api/bff/epic/milestone  — toggle a milestone's done state.
// Identity is derived from the `tec_user` session cookie server-side — NEVER the
// request body (P6). The body carries only the slug + milestone data; the backend
// re-enforces owner-scope + terminal-state. Honest statuses flow back to the UI
// (401 no session · 403 not yours · 400 bad input · 503 unreachable).
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

export async function POST(req: NextRequest) {
  if (isE2eMode()) return e2eStub(200, { project: null });
  const body = (await req.json().catch(() => ({}))) as { slug?: unknown; title?: unknown };
  const slug  = typeof body.slug === 'string' ? body.slug.trim() : '';
  const title = typeof body.title === 'string' ? body.title : '';
  if (!slug) return NextResponse.json({ ok: false, error: 'slug required' }, { status: 400 });

  const result = await addMilestone(ownerFromSession(req), slug, title);
  return NextResponse.json(
    { ok: result.ok, project: result.project ?? null, error: result.error },
    { status: result.ok ? 200 : result.status },
  );
}

export async function PATCH(req: NextRequest) {
  if (isE2eMode()) return e2eStub(200, { project: null });
  const body = (await req.json().catch(() => ({}))) as { slug?: unknown; index?: unknown; done?: unknown };
  const slug  = typeof body.slug === 'string' ? body.slug.trim() : '';
  const index = typeof body.index === 'number' ? body.index : Number(body.index);
  const done  = Boolean(body.done);
  if (!slug) return NextResponse.json({ ok: false, error: 'slug required' }, { status: 400 });
  if (!Number.isInteger(index)) return NextResponse.json({ ok: false, error: 'index required' }, { status: 400 });

  const result = await setMilestoneDone(ownerFromSession(req), slug, index, done);
  return NextResponse.json(
    { ok: result.ok, project: result.project ?? null, error: result.error },
    { status: result.ok ? 200 : result.status },
  );
}
