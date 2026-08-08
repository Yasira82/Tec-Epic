// TEC Epic — Creation Runtime (C-125) — read-only V1 data.
//
// Epic = System of Construction: where new economic initiatives are born
// ("What are you building?"). This V1 is a read-only project board over a curated
// SAMPLE. Epic OWNS project creation + structure + lifecycle; it does NOT own
// verification (Zone), capital (FundX), reputation recording (Legend), or
// transactions (Commerce/payment-service). The critical value chain is:
//   Epic (create) → Zone (verify) → activity (execute) → Legend (earn).
// When live, projects are the caller's OWN (identity from the session cookie,
// never a param — P6); funding is executed by FundX, verification minted by Zone.

export type ProjectType =
  | 'STARTUP' | 'COMMUNITY' | 'CAMPAIGN' | 'EVENT' | 'CHALLENGE' | 'PROGRAM' | 'INITIATIVE';

// Project lifecycle (C-125): DRAFT → ACTIVE → FUNDED → COMPLETED → LEGEND.
export type ProjectStatus = 'DRAFT' | 'ACTIVE' | 'FUNDED' | 'COMPLETED' | 'LEGEND';

export interface Milestone {
  title:     string;
  done:      boolean;
}

export interface Project {
  id:           string;
  owner?:       string;          // creator's Pi username (public) — used to gate owner-only edits
  type:         ProjectType;
  name:         string;
  tagline:      string;
  category:     string;
  team:         number;          // team size
  status:       ProjectStatus;
  zoneVerified: boolean;         // presented from Zone — Epic never self-verifies
  featured?:    boolean;         // Epic Pro — featured in the public directory (visibility only,
                                 // ranks BELOW zoneVerified; never affects verification)
  fundingGoal?: number;          // π — optional FundX integration
  fundedPct?:   number;          // 0-100, presented from FundX
  milestones:   Milestone[];
}

export const PROJECTS: Project[] = [
  {
    id: 'pi-makers-hub',
    type: 'COMMUNITY',
    name: 'Pi Makers Hub',
    tagline: 'A builder community turning Pi ideas into shipped products.',
    category: 'Community',
    team: 6,
    status: 'ACTIVE',
    zoneVerified: true,
    milestones: [
      { title: 'Charter + first 50 members', done: true },
      { title: 'Weekly build sessions', done: true },
      { title: 'First community-shipped app', done: false },
    ],
  },
  {
    id: 'greenpi-market',
    type: 'STARTUP',
    name: 'GreenPi Market',
    tagline: 'A Pi-native marketplace for sustainable local goods.',
    category: 'Commerce',
    team: 4,
    status: 'FUNDED',
    zoneVerified: true,
    fundingGoal: 5000,
    fundedPct: 72,
    milestones: [
      { title: 'MVP storefront', done: true },
      { title: 'Zone-verified merchant onboarding', done: true },
      { title: 'First 100 orders', done: false },
    ],
  },
  {
    id: 'learn-pi-campaign',
    type: 'CAMPAIGN',
    name: 'Learn Pi Campaign',
    tagline: 'Onboarding pioneers with plain-language Pi education.',
    category: 'Education',
    team: 3,
    status: 'ACTIVE',
    zoneVerified: false,
    milestones: [
      { title: 'Curriculum outline', done: true },
      { title: '10 explainer guides', done: false },
    ],
  },
  {
    id: 'pi-hack-2026',
    type: 'EVENT',
    name: 'Pi Hack 2026',
    tagline: 'A 48-hour hackathon building on the TEC/Pi stack.',
    category: 'Hackathon',
    team: 8,
    status: 'COMPLETED',
    zoneVerified: true,
    milestones: [
      { title: 'Venue + sponsors', done: true },
      { title: '30 teams registered', done: true },
      { title: 'Winners → Legend records', done: true },
    ],
  },
  {
    id: 'first-legend-fund',
    type: 'INITIATIVE',
    name: 'First Legend Fund',
    tagline: 'A completed initiative now recorded as permanent reputation.',
    category: 'Social Impact',
    team: 5,
    status: 'LEGEND',
    zoneVerified: true,
    milestones: [
      { title: 'Delivered all milestones', done: true },
      { title: 'Outcome verified by Zone', done: true },
      { title: 'Recorded in Legend', done: true },
    ],
  },
];

export const TYPE_META: Record<ProjectType, { label: string; icon: string }> = {
  STARTUP:    { label: 'Startup',    icon: '🚀' },
  COMMUNITY:  { label: 'Community',  icon: '🤝' },
  CAMPAIGN:   { label: 'Campaign',   icon: '📣' },
  EVENT:      { label: 'Event',      icon: '🎪' },
  CHALLENGE:  { label: 'Challenge',  icon: '🏁' },
  PROGRAM:    { label: 'Program',    icon: '🎓' },
  INITIATIVE: { label: 'Initiative', icon: '🌱' },
};

// Lifecycle order — used to render the Epic→…→Legend pipeline progress.
export const STATUS_ORDER: ProjectStatus[] = ['DRAFT', 'ACTIVE', 'FUNDED', 'COMPLETED', 'LEGEND'];

export const STATUS_META: Record<ProjectStatus, { label: string; tone: string }> = {
  DRAFT:     { label: 'Draft',     tone: '#8B5CF6' },
  ACTIVE:    { label: 'Active',    tone: '#3B82F6' },
  FUNDED:    { label: 'Funded',    tone: '#06B6D4' },
  COMPLETED: { label: 'Completed', tone: '#22C55E' },
  LEGEND:    { label: 'Legend',    tone: '#FBBF24' },
};

export function getProject(id: string): Project | null {
  return PROJECTS.find((p) => p.id === id) ?? null;
}
