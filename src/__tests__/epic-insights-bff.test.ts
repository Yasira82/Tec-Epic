// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// TEC Epic — Portfolio Insights BFF (C-125). Epic Pro's standalone service: an aggregate
// of the caller's OWN projects. Identity is the `tec_user` session (P6 — never a param);
// the aggregate is gated behind the caller's LIVE subscription (P5). A non-Pro sees
// `{ pro: false }` (teaser), a Pro sees the insights.
const GW = 'https://api.example.com';
process.env.API_GATEWAY_URL = GW;
process.env.INTERNAL_SECRET = 'secret';

const makeReq = (cookies?: Record<string, string>) => {
  const cookieStr = cookies ? Object.entries(cookies).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('; ') : '';
  const headers: Record<string, string> = {};
  if (cookieStr) headers['Cookie'] = cookieStr;
  return new NextRequest('http://localhost/api/bff/epic/insights', { method: 'GET', headers });
};
const ok = (data: unknown) => ({ ok: true, status: 200, json: async () => data } as Response);

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
  process.env.API_GATEWAY_URL = GW;
  process.env.INTERNAL_SECRET = 'secret';
});

describe('GET /api/bff/epic/insights (Pro Portfolio Insights, gated)', () => {
  it('401 without a session (identity from the cookie, P6)', async () => {
    const { GET } = await import('@/app/api/bff/epic/insights/route');
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
  });

  it('non-Pro → { pro:false } and NEVER fetches the insights aggregate (P5 gate)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(ok({ data: { plan: 'FREE', isActive: true } })); // sub = not Pro
    const { GET } = await import('@/app/api/bff/epic/insights/route');
    const res  = await GET(makeReq({ tec_user: JSON.stringify({ piUsername: 'maya' }), tec_access_token: 'tok' }));
    const json = await res.json();
    expect(json.pro).toBe(false);
    expect(json.insights).toBeNull();
    // only the subscription check ran — the insights endpoint was never called
    expect(fetchSpy.mock.calls.every(([u]) => !String(u).includes('/epic/insights/'))).toBe(true);
    fetchSpy.mockRestore();
  });

  it('Pro → returns the owner’s portfolio insights', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(ok({ data: { plan: 'PRO', isActive: true, isExpired: false } }))                 // sub = Pro
      .mockResolvedValueOnce(ok({ data: { insights: { total: 3, completionRate: 67, legendOutcomes: 1 } } })); // insights
    const { GET } = await import('@/app/api/bff/epic/insights/route');
    const res  = await GET(makeReq({ tec_user: JSON.stringify({ piUsername: 'maya' }), tec_access_token: 'tok' }));
    const json = await res.json();
    expect(json.pro).toBe(true);
    expect(json.insights.total).toBe(3);
    const insightsCall = fetchSpy.mock.calls.find(([u]) => String(u).includes('/api/identity/epic/insights/maya'));
    expect(insightsCall).toBeDefined();
    fetchSpy.mockRestore();
  });
});
