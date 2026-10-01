import { useState } from 'react'
import {
  Bell,
  Briefcase,
  Calendar,
  Contact,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Moon,
  PanelLeft,
  Plus,
  Search,
  Settings as SettingsIcon,
  Building2,
  Sprout,
  Telescope,
  ClipboardList,
  CalendarClock,
  MoreHorizontal,
  ArrowUpRight,
  Sparkles,
  X,
  Mic,
} from 'lucide-react'
import NewProposalWizard from './NewProposalWizard'
import Agreements from './Agreements'

// ─── Types ────────────────────────────────────────────────────────────────

type Stage = 'draft' | 'sent' | 'viewed' | 'signed'
type Method = 'Auction' | 'Private treaty' | 'EOI'

type Proposal = {
  id: string
  address: string
  suburb: string
  vendor: string
  method: Method
  priceRange: string
  stage: Stage
  daysInStage: number
  signals?: { views?: number; shared?: boolean; highIntent?: boolean }
}

const proposals: Proposal[] = [
  { id: 'p1', address: '12 Bayview Rd', suburb: 'Balmain', vendor: 'Sarah & James Chen', method: 'Auction', priceRange: '$2.85M – $3.05M', stage: 'draft', daysInStage: 1 },
  { id: 'p2', address: '4/86 Hall St', suburb: 'Bondi', vendor: 'Marco Ricci', method: 'Private treaty', priceRange: '$1.45M – $1.55M', stage: 'draft', daysInStage: 3 },

  { id: 'p3', address: '74 Mitchell St', suburb: 'Marrickville', vendor: 'Bob Local', method: 'Auction', priceRange: '$1.95M – $2.1M', stage: 'sent', daysInStage: 2 },
  { id: 'p4', address: '22 Beach Rd', suburb: 'Cronulla', vendor: 'Emma Holloway', method: 'Auction', priceRange: '$2.4M – $2.6M', stage: 'sent', daysInStage: 4 },
  { id: 'p5', address: '9 Rowntree St', suburb: 'Balmain', vendor: 'Priya Patel', method: 'Private treaty', priceRange: '$3.1M – $3.3M', stage: 'sent', daysInStage: 6 },

  { id: 'p6', address: '118 Darling St', suburb: 'Rozelle', vendor: 'David & Amy Nguyen', method: 'Auction', priceRange: '$2.2M – $2.4M', stage: 'viewed', daysInStage: 1, signals: { views: 6, shared: true, highIntent: true } },
  { id: 'p7', address: '3 Wolseley Rd', suburb: 'Point Piper', vendor: 'Alicia Fern', method: 'EOI', priceRange: '$18M+', stage: 'viewed', daysInStage: 5, signals: { views: 2 } },

  { id: 'p8', address: '8 Curlewis St', suburb: 'Bondi', vendor: 'Ted Marshall', method: 'Auction', priceRange: '$3.6M – $3.85M', stage: 'signed', daysInStage: 2 },
]

const stages: { key: Stage; label: string; hint: string }[] = [
  { key: 'draft', label: 'Draft', hint: 'Being prepared' },
  { key: 'sent', label: 'Sent', hint: 'Awaiting first view' },
  { key: 'viewed', label: 'Viewed', hint: 'Vendor is engaging' },
  { key: 'signed', label: 'Signed', hint: 'Agency agreement in' },
]

// ─── Sidebar ─────────────────────────────────────────────────────────────

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Conversations', icon: MessageSquare },
  { label: 'Properties', icon: Building2 },
  { label: 'Proposals', icon: FileText, active: true },
  { label: 'Tasks', icon: ClipboardList },
  { label: 'Calendar', icon: Calendar },
  { label: 'OFI Planner', icon: CalendarClock },
  { label: 'Contacts', icon: Contact },
  { label: 'Prospecting', icon: Telescope },
  { label: 'Farming Areas', icon: Sprout },
  { label: 'Settings', icon: SettingsIcon },
]

function Sidebar() {
  return (
    <aside className="flex w-[232px] shrink-0 flex-col px-3 pt-4 pb-3">
      <div className="flex items-center justify-between px-2 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-accent text-[13px] font-semibold text-white">
            t
          </div>
          <span className="text-[14px] font-semibold tracking-tight">Tenvo</span>
        </div>
        <PanelLeft size={16} className="text-ink-faint" />
      </div>

      <button className="flex w-full items-center gap-2 rounded-[10px] px-2.5 py-2 text-[13px] font-medium text-ink-muted hover:bg-white/60">
        <Briefcase size={15} strokeWidth={1.75} />
        <span>Sales</span>
        <span className="ml-auto text-[11px] text-ink-faint">workspace</span>
      </button>

      <div className="mt-3 mb-1 px-2 text-[11px] font-medium uppercase tracking-wider text-ink-faint">
        Workspace
      </div>

      <nav className="flex-1 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.label}
              className={
                'flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-[7px] text-[13.5px] transition ' +
                (item.active
                  ? 'bg-white text-ink shadow-[0_1px_2px_rgba(16,24,40,0.05)]'
                  : 'text-ink-muted hover:bg-white/60 hover:text-ink')
              }
            >
              <Icon size={15} strokeWidth={1.75} className={item.active ? 'text-accent' : ''} />
              <span className="flex-1 text-left">{item.label}</span>
            </button>
          )
        })}
      </nav>

      <button className="mt-2 flex items-center gap-2 rounded-[10px] px-2.5 py-2 text-[12.5px] text-ink-muted hover:bg-white/60">
        <MessageSquare size={14} strokeWidth={1.75} />
        Help & feedback
      </button>
    </aside>
  )
}

// ─── Topbar ──────────────────────────────────────────────────────────────

function TopBar() {
  return (
    <div className="flex items-center gap-2 pt-4">
      <div className="flex flex-1 items-center gap-2 rounded-[10px] bg-white px-3 py-1.5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] max-w-[380px]">
        <Search size={14} className="text-ink-faint" />
        <input
          placeholder="Search Tenvo…"
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-ink-faint"
        />
        <kbd className="rounded bg-canvas px-1.5 py-[1px] text-[10.5px] text-ink-faint">⌘K</kbd>
      </div>
      <div className="flex-1" />
      <button className="inline-flex items-center gap-1.5 rounded-[10px] px-2.5 py-1.5 text-[13px] font-medium text-accent hover:bg-accent-soft">
        <Plus size={14} strokeWidth={2} />
        Quick add
      </button>
      <button className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-white/70">
        <Bell size={16} strokeWidth={1.75} />
      </button>
      <button className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-white/70">
        <Moon size={16} strokeWidth={1.75} />
      </button>
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-white">
        TD
      </div>
    </div>
  )
}

// ─── Pipeline card ───────────────────────────────────────────────────────

const methodTint: Record<Method, string> = {
  Auction: 'bg-warn-soft text-warn',
  'Private treaty': 'bg-accent-soft text-accent',
  EOI: 'bg-success-soft text-success',
}

function PipelineCard({ p }: { p: Proposal }) {
  return (
    <div className="group relative cursor-pointer rounded-[14px] bg-surface p-3.5 shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-pop)]">
      {p.signals?.highIntent && (
        <div className="absolute -top-1.5 -right-1.5 flex h-5 items-center gap-1 rounded-full bg-warn px-1.5 text-[10px] font-semibold text-white shadow-sm">
          <Sparkles size={10} />
          Hot
        </div>
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-[14px] font-semibold text-ink">{p.address}</div>
          <div className="truncate text-[12px] text-ink-muted">{p.suburb} · {p.vendor}</div>
        </div>
        <button className="opacity-0 transition group-hover:opacity-100" aria-label="Open">
          <ArrowUpRight size={14} className="text-ink-faint" />
        </button>
      </div>

      <div className="mt-2.5 flex items-center gap-1.5">
        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10.5px] font-medium ${methodTint[p.method]}`}>
          {p.method}
        </span>
        <span className="text-[11.5px] text-ink-muted">{p.priceRange}</span>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-ink-faint">
        <span>
          {p.daysInStage === 0 ? 'Today' : `${p.daysInStage}d in stage`}
        </span>
        {p.signals?.views !== undefined && (
          <span className="inline-flex items-center gap-1 text-ink-muted">
            <span className={`h-1.5 w-1.5 rounded-full ${p.signals.highIntent ? 'bg-warn' : 'bg-success'}`} />
            {p.signals.views} views{p.signals.shared ? ' · shared' : ''}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Pipeline column ─────────────────────────────────────────────────────

function PipelineColumn({ stage, label, hint }: { stage: Stage; label: string; hint: string }) {
  const items = proposals.filter((p) => p.stage === stage)
  return (
    <div className="flex min-w-[260px] flex-1 flex-col">
      <div className="flex items-baseline justify-between px-1 pb-2">
        <div className="flex items-baseline gap-2">
          <span className="text-[13px] font-semibold text-ink">{label}</span>
          <span className="text-[12px] text-ink-faint">{items.length}</span>
        </div>
        <span className="text-[11px] text-ink-faint">{hint}</span>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 rounded-[16px] bg-black/[0.02] p-2.5 min-h-[200px]">
        {items.map((p) => (
          <PipelineCard key={p.id} p={p} />
        ))}
        <button className="mt-1 flex items-center justify-center gap-1.5 rounded-[10px] py-2 text-[12px] font-medium text-ink-faint hover:bg-white/70 hover:text-ink-muted">
          <Plus size={12} strokeWidth={2} />
          Add proposal
        </button>
      </div>
    </div>
  )
}

// ─── Segmented / view toggle ─────────────────────────────────────────────

function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
}: {
  options: { key: T; label: string }[]
  value: T
  onChange: (v: T) => void
  size?: 'md' | 'sm'
}) {
  return (
    <div className={`inline-flex items-center rounded-[10px] bg-black/[0.04] p-0.5 ${size === 'sm' ? 'text-[12px]' : 'text-[13px]'}`}>
      {options.map((opt) => {
        const active = opt.key === value
        return (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            className={
              'rounded-[8px] px-3 py-1 font-medium transition ' +
              (active ? 'bg-white text-ink shadow-[0_1px_2px_rgba(16,24,40,0.06)]' : 'text-ink-muted hover:text-ink')
            }
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Right rail ──────────────────────────────────────────────────────────

const stats = [
  { label: 'Sent this month', value: '12', delta: '+3 vs last month', tone: 'ink' },
  { label: 'Open rate', value: '83%', delta: '+8pp', tone: 'success' },
  { label: 'High intent', value: '2', delta: 'Follow up today', tone: 'warn' },
  { label: 'Signed', value: '5', delta: '$14.2M in listings', tone: 'success' },
]

function StatsRail() {
  return (
    <aside className="w-[260px] shrink-0 space-y-3">
      <div className="flex items-baseline justify-between px-1">
        <div className="text-[12px] font-semibold text-ink">This month</div>
        <button className="text-[11.5px] text-ink-muted hover:text-ink">September</button>
      </div>
      <div className="space-y-2">
        {stats.map((s) => (
          <div key={s.label} className="rounded-[14px] bg-surface p-3.5 shadow-[var(--shadow-card)]">
            <div className="text-[11.5px] text-ink-muted">{s.label}</div>
            <div className="mt-0.5 flex items-baseline gap-2">
              <div className="text-[22px] font-semibold tracking-tight">{s.value}</div>
              <div
                className={
                  'text-[11px] font-medium ' +
                  (s.tone === 'success' ? 'text-success' : s.tone === 'warn' ? 'text-warn' : 'text-ink-muted')
                }
              >
                {s.delta}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-[14px] bg-surface p-3.5 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[12.5px] font-semibold">
            <Sparkles size={13} className="text-warn" />
            Follow up today
          </div>
          <button className="text-[11px] text-accent">All</button>
        </div>
        <ul className="mt-2 space-y-2">
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-warn" />
            <div className="min-w-0 text-[12px]">
              <div className="truncate font-medium">David & Amy Nguyen</div>
              <div className="truncate text-ink-muted">Viewed 6× · shared with partner</div>
            </div>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-ink-faint" />
            <div className="min-w-0 text-[12px]">
              <div className="truncate font-medium">Priya Patel</div>
              <div className="truncate text-ink-muted">6 days since sent — no open</div>
            </div>
          </li>
        </ul>
      </div>
    </aside>
  )
}

// ─── App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab] = useState<'proposals' | 'templates' | 'agreements'>('proposals')
  const [view, setView] = useState<'board' | 'list'>('board')
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas font-sans text-ink">
      <Sidebar />

      <main className="relative flex-1 overflow-hidden pr-6">
        <div className="flex h-full flex-col">
          <div className="px-6">
            <TopBar />
          </div>

          <div className="mt-4 flex flex-1 gap-6 overflow-hidden pl-6">
            {/* Center */}
            <div className="flex min-w-0 flex-1 flex-col">
              {/* Header */}
              <div className="flex items-end justify-between pb-4">
                <div>
                  <h1 className="text-[32px] font-semibold leading-tight tracking-tight">Proposals</h1>
                  <p className="mt-1 text-[13.5px] text-ink-muted">
                    Every listing pitch from draft to signed agency agreement.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-white text-ink-muted shadow-[0_1px_2px_rgba(16,24,40,0.05)] hover:text-ink">
                    <MoreHorizontal size={16} />
                  </button>
                  <button
                    onClick={() => setSheetOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-[10px] bg-accent px-3.5 py-2 text-[13px] font-medium text-white shadow-[0_1px_2px_rgba(0,87,255,0.35)] hover:brightness-105"
                  >
                    <Plus size={14} strokeWidth={2.25} />
                    New proposal
                  </button>
                </div>
              </div>

              {/* Sub-nav row */}
              <div className="flex items-center justify-between pb-4">
                <Segmented
                  options={[
                    { key: 'proposals', label: 'Proposals' },
                    { key: 'templates', label: 'Templates' },
                    { key: 'agreements', label: 'Agreements' },
                  ]}
                  value={tab}
                  onChange={setTab}
                />
                <div className="flex items-center gap-2">
                  {tab === 'proposals' && (
                    <Segmented
                      options={[
                        { key: 'board', label: 'Board' },
                        { key: 'list', label: 'List' },
                      ]}
                      value={view}
                      onChange={setView}
                      size="sm"
                    />
                  )}
                </div>
              </div>

              {/* Board */}
              {tab === 'proposals' && view === 'board' && (
                <div className="flex flex-1 gap-4 overflow-x-auto pb-4">
                  {stages.map((s) => (
                    <PipelineColumn key={s.key} stage={s.key} label={s.label} hint={s.hint} />
                  ))}
                </div>
              )}

              {tab === 'proposals' && view === 'list' && (
                <div className="flex-1 overflow-y-auto rounded-[16px] bg-surface shadow-[var(--shadow-card)]">
                  <div className="grid grid-cols-[minmax(0,1.5fr)_120px_120px_140px_100px_60px] items-center gap-4 px-5 py-3 text-[11px] font-medium uppercase tracking-wider text-ink-faint">
                    <div>Property & vendor</div>
                    <div>Stage</div>
                    <div>Method</div>
                    <div>Price range</div>
                    <div>In stage</div>
                    <div />
                  </div>
                  {proposals.map((p) => (
                    <div key={p.id} className="grid grid-cols-[minmax(0,1.5fr)_120px_120px_140px_100px_60px] items-center gap-4 border-t border-hairline/70 px-5 py-3 text-[13px] hover:bg-canvas/60">
                      <div>
                        <div className="font-medium">{p.address}</div>
                        <div className="text-[12px] text-ink-muted">{p.suburb} · {p.vendor}</div>
                      </div>
                      <div className="text-ink-muted">
                        <span className="inline-flex items-center gap-1.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${stageDot(p.stage)}`} />
                          {stageLabel(p.stage)}
                        </span>
                      </div>
                      <div className="text-ink-muted">{p.method}</div>
                      <div className="text-ink-muted">{p.priceRange}</div>
                      <div className="text-ink-muted">{p.daysInStage}d</div>
                      <div className="text-right">
                        <button className="text-accent">Open</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'templates' && (
                <div className="flex flex-1 items-center justify-center rounded-[16px] bg-surface p-10 text-center shadow-[var(--shadow-card)]">
                  <div>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
                      <FileText size={20} />
                    </div>
                    <h3 className="mt-3 text-[16px] font-semibold">Templates library</h3>
                    <p className="mt-1 max-w-sm text-[13px] text-ink-muted">
                      Reusable proposal templates live here. Open one to launch the template builder.
                    </p>
                    <button className="mt-4 inline-flex items-center gap-1.5 rounded-[10px] bg-accent px-3.5 py-2 text-[13px] font-medium text-white">
                      <Plus size={14} strokeWidth={2.25} />
                      New template
                    </button>
                  </div>
                </div>
              )}

              {tab === 'agreements' && <Agreements />}
            </div>

            {/* Right rail */}
            <StatsRail />
          </div>
        </div>

        {/* Ask anything */}
        <div className="pointer-events-none absolute bottom-6 left-0 right-0 z-10 flex justify-center">
          <div className="pointer-events-auto flex items-center gap-2.5 rounded-full bg-surface/95 px-4 py-2.5 shadow-[var(--shadow-pop)] backdrop-blur">
            <Sparkles size={14} className="text-accent" />
            <span className="text-[13px] text-ink-muted">Ask anything about your pipeline</span>
            <Mic size={14} className="text-ink-faint" />
          </div>
        </div>
      </main>

      {sheetOpen && <NewProposalWizard onClose={() => setSheetOpen(false)} />}
    </div>
  )
}

// ─── helpers for list view ───────────────────────────────────────────────
function stageLabel(s: Stage) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
function stageDot(s: Stage) {
  return s === 'signed' ? 'bg-success' : s === 'viewed' ? 'bg-warn' : s === 'sent' ? 'bg-accent' : 'bg-ink-faint'
}
