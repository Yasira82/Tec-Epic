# TEC Epic — Claude Code Instructions

> ⚡ **SESSION START:** اقرأ `knowledge-base/C-02___CURRENT_STATE_.md` + **app charter
> `knowledge-base/C-125___EPIC_CREATION_RUNTIME.md`** من `yasira82/tec-knowledge-base` (branch: `main`).

## What This App Is

**The Creation Runtime** of the Pi economy (C-125) — the **System of
Construction**. Epic answers one question:

```
"What are you building?"
```

Epic is the birthplace of new things in TEC: it lets individuals and communities
**create, launch, and grow** new economic initiatives — startups, communities,
campaigns, events, challenges, programs, initiatives. Where Hub manages *who you
are*, Epic manages *what you are creating*. The critical value chain is:

```
Epic (create) → Zone (verify) → activity (execute) → Legend (earn)
```

Built from `tec-template-base` (Next.js 15 frontend).

**Current Phase: Epic V0/V1 — Creation preview (read-only).** Identity / domain /
slug / legal + a themed **project board** (sample projects · type · lifecycle ·
Zone-verified · funding) + a `/project/[id]` detail (lifecycle pipeline +
milestones + FundX-presented funding) + **Epic Pro** (the Pi Portal "Process a
Transaction" gate). Real project creation / funding is Phase 2 (gated on Zone +
FundX + Connection live). Deployed (Mainnet) · Pi App ID registered · env set · payment live · referral growth loop wired (C-133).

---

## Pi App Identity

| Field | Value |
|-------|-------|
| **App** | TEC Epic |
| **Domain** | `https://epic.tecosystem.app` |
| **Pi App ID** | ✅ Registered (Mainnet) · Vercel `NEXT_PUBLIC_PI_APP_ID` |
| **APP_SOURCE slug** | `epic` (payment-service resolves `PI_API_KEY_EPIC`) |
| **PI_SANDBOX** | `false` (Mainnet) |

---

## Epic-Specific Rules (C-125)

### The creation boundary — Epic builds; the owning systems verify/fund/record
Epic **OWNS**: project creation (type · name · description · category), project
structure (team + roles · goals + milestones · public launch), and the project
lifecycle (`DRAFT → ACTIVE → FUNDED → COMPLETED → LEGEND`). Epic does **NOT OWN**:
- **Verification** → Zone verifies Epic projects (Epic cannot self-verify).
- **Capital** → FundX manages funding flows (Epic never moves Pi directly).
- **Reputation recording** → Legend records Epic outcomes on completion.
- **Transactions** → Commerce / payment-service. **Risk** → Insure. **Enterprise** → Titan.

### Isolation (P6)
Projects are the caller's own — identity from the `tec_user` session cookie
server-side, **never** a query param or request body. No session → fail closed.
Public view (browsing active projects) is allowed; creating/editing requires auth.

**Reference of record:** `yasira82/tec-knowledge-base` —
`C-125___EPIC_CREATION_RUNTIME.md` (charter) + `C-12_Dual_Mode_Payment.md`
(payment anti-regression) + `C-123` (session/cookies).

---

## Stack

- Next.js 15 App Router + TypeScript strict · React 18
- `@yasser172/tec-ui` (design system) · `@yasser172/tec-auth` · `@yasser172/tec-sdk`
- Vitest (unit) + Playwright (e2e) · Deployment: Vercel

---

## Architecture Rules (non-negotiable)

### CSRF — middleware ONLY (P2 single source of truth)
CSRF is enforced in **`middleware.ts`** and **nowhere else**: a request is trusted
if the double-submit token matches **OR** it is first-party (Origin host === Host /
`*.tecosystem.app`).
- ❌ **NEVER** add a CSRF check inside a route handler (`csrfCookie !== csrfHeader`
  → 403). It 403's legit Mode-2 payments in Pi Browser (drops `sameSite=None`
  cookies). The CI `payment-policy` job fails the build if you do. (KB C-12 §11)
- ✅ A route may *forward* `x-csrf-token` to a downstream call; it must never *validate* it.

### ADR-007 — Dual-mode payment (Pi foreign session)
Every buy handler MUST guard before touching `window.Pi`:
```typescript
const isHubNavigation = () =>
  document.referrer.toLowerCase().includes('hub.tecosystem.app');
if (isHubNavigation() || !(window as any).Pi || !piReady) {
  redirectToHubPayment(...);   // Mode 1: Hub modal → /hub?pay=1&...
  return;
}
// Mode 2: standalone — createPaymentRecord() then createU2APayment() (src/lib/pi-payment.ts)
```
> Epic Pro (subscription) is the only buy flow. Approve under `PI_API_KEY_EPIC`
> (never the default Hub key — the Analytics approve→502 lesson, C-12 §11).

### ADR-009 — Unified payment contract
`amount` is a **number**; gateway path is **`/api/payment/*`** (singular); the only
inter-service header is **`x-internal-key`** + `INTERNAL_SECRET`. Don't re-declare
payment Zod locally — shapes live in `@yasser172/tec-sdk`.

### Two-SDK boundary
```
Client components → src/lib-client/*  (browser state, Pi hooks)
API routes (BFF)  → @yasser172/tec-sdk via /api/bff/*  (server-only)
```

### Auth / cookies (LOCKED)
SSO via Hub cookies `tec_access_token`, `tec_csrf`, `tec_user`. Never localStorage.
Identity is derived from the `tec_user` cookie server-side — **never from the request body**.

---

## Setup status + Roadmap (C-125 §Build Protocol)

```
Epic V0/V1 — Creation preview (customized from template):
  ✅ package.json name = tec-epic · APP_SOURCE = 'epic'
  ✅ sso-callback ALLOWED_AUDIENCES → epic.tecosystem.app + tec-epic.vercel.app
  ✅ privacy + terms → TEC Epic / epic.tecosystem.app
  ✅ NEW-A: no NEXT_PUBLIC_API_GATEWAY_URL / Railway host in the client bundle
  ✅ /app themed: project board + Epic→Zone→Legend pipeline + Epic Pro (real Pi U2A)
  ✅ /project/[id] detail (lifecycle + milestones + FundX-presented funding) + BFF /api/bff/epic/projects
  ✅ CREATE a project (C-125 — Epic owns creation): CreateProject form on the board →
     POST /api/bff/epic/projects → backend EpicService.createProject (DRAFT/unverified/
     unfunded, unique slug, owner = session identity — P6). Turns Epic from read-only
     into a real create surface; the new project is completable → Legend (create → earn).
  ✅ VALUE CHAIN (C-121): "Mark project complete → Legend" — owner-scoped write path
     (BFF /api/bff/epic/complete derives owner from session, P6) → backend graduates
     the project to LEGEND + emits epic.project.completed.v1 → Legend records the
     achievement (create → earn). Epic never records reputation itself.

Live on Mainnet — all complete (SSoT: architecture/app-fleet.yaml):
  ✅ Register Pi App ID (Pi Developer Portal) → Vercel NEXT_PUBLIC_PI_APP_ID +
    API_GATEWAY_URL · INTERNAL_SECRET · SSO_SECRET · PI_SANDBOX=false.
  ✅ payment-service: set PI_API_KEY_EPIC on Railway (approve→502 otherwise, C-12 §11).
  ✅ Hub SSO: add epic.tecosystem.app + tec-epic.vercel.app to Hub /api/auth/sso
    ALLOWED_TARGETS + Hub domain registry.
  ✅ Deploy (Vercel) + runtime-verify login (C-123) + a real Epic Pro payment
    Mode 1 (Hub) AND Mode 2 (standalone).

Epic V1+ (post-Portal — C-125): real project creation (STARTUP + COMMUNITY) → team
  invitation → milestone tracking → Zone verification request → FundX funding →
  Connection community formation. Gated on Zone + FundX + Connection live + 1k users.
```

---

## What NOT To Do

- Do NOT self-verify projects — Zone verifies (Epic presents the badge, never mints it)
- Do NOT move Pi or hold funding in Epic — FundX executes capital flows
- Do NOT record reputation in Epic — Legend records outcomes on completion
- Do NOT validate CSRF in a route handler — middleware only (CI blocks it)
- Do NOT send `amount` as a string, or use `/payments` / `x-service-secret`
- Do NOT skip the ADR-007 `isHubNavigation()` guard before `window.Pi`
- Do NOT store tokens in localStorage; do NOT derive identity from the body
- Do NOT add `NEXT_PUBLIC_*` for internal service URLs or `INTERNAL_SECRET`

---

## Commit Convention

```
feat(epic):  new creation feature   fix(payment): payment flow fix (test carefully)
fix(epic):   bug fix                 chore(scope):  build/config
```

---

## Skills

Available via plugin — invoke automatically when the situation matches:

| Situation | Skill |
|-----------|-------|
| Writing new feature or fixing a bug → use TDD | `/tdd` |
| Bug, regression, or unexpected behavior | `/diagnose` |
| Writing or modifying tests | `/test-guard` |
| Writing or modifying BFF routes, payment handlers, or API contracts | `/clean-code-guard` |
| Updating docs, CLAUDE.md, or knowledge-base entries | `/docs-guard` |
| Planning a new feature or architectural decision | `/grill-with-docs` |
| Breaking down a roadmap item into GitHub Issues | `/to-issues` |
| Session is getting long or context is filling up | `/handoff` |
| Adding pre-commit hooks to this repo | `/setup-pre-commit` |
