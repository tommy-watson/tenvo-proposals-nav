import { useState } from 'react'
import {
  Bell,
  Bot,
  Calendar,
  ChevronsUpDown,
  Contact,
  FileText,
  LayoutDashboard,
  MessageSquare,
  MessageSquareText,
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
  Eye,
  Share2,
  Clock,
  Smartphone,
  ExternalLink,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import NewProposalWizard from './NewProposalWizard'
import Agreements from './Agreements'
import NewAgreementFlow from './NewAgreementFlow'

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
  demoUrl?: string
}

type AnalyticsEvent = { at: string; label: string; detail?: string }
type SectionViews = { name: string; views: number; dwell: string }

type ProposalAnalytics = {
  totalViews: number
  uniqueDevices: number
  avgTime: string
  deepestSection: string
  shares: number
  lastViewed: string
  sections: SectionViews[]
  timeline: AnalyticsEvent[]
}

const demoProposalUrl = '/proposals/33-shetland-drive-moama.html'

const analyticsByStage: Record<Stage, ProposalAnalytics> = {
  draft: {
    totalViews: 0,
    uniqueDevices: 0,
    avgTime: '—',
    deepestSection: '—',
    shares: 0,
    lastViewed: 'Not sent yet',
    sections: [],
    timeline: [{ at: 'Today', label: 'Draft created' }],
  },
  sent: {
    totalViews: 0,
    uniqueDevices: 0,
    avgTime: '—',
    deepestSection: '—',
    shares: 0,
    lastViewed: 'Awaiting first view',
    sections: [],
    timeline: [
      { at: 'Today', label: 'Sent to vendor', detail: 'Email delivered' },
      { at: 'Earlier', label: 'Draft ready for send' },
    ],
  },
  viewed: {
    totalViews: 6,
    uniqueDevices: 2,
    avgTime: '4m 12s',
    deepestSection: 'Marketing investment',
    shares: 1,
    lastViewed: '2h ago',
    sections: [
      { name: 'Thanks for having us', views: 6, dwell: '32s' },
      { name: "What's been selling nearby", views: 5, dwell: '58s' },
      { name: 'Presenting at its best', views: 5, dwell: '46s' },
      { name: 'Your Tailored Digital', views: 4, dwell: '1m 10s' },
      { name: 'Your Tailored Print Strategy', views: 4, dwell: '48s' },
      { name: 'Why us', views: 3, dwell: '38s' },
      { name: 'Marketing investment', views: 3, dwell: '1m 20s' },
      { name: 'Your sales team', views: 3, dwell: '26s' },
    ],
    timeline: [
      { at: '2h ago', label: 'Vendor opened again', detail: 'iPhone · Safari' },
      { at: 'Yesterday 6:40pm', label: 'Shared with partner', detail: 'Forwarded to partner@example.com' },
      { at: 'Yesterday 6:12pm', label: 'First view', detail: 'MacBook · Chrome · Melbourne' },
      { at: 'Yesterday 2:04pm', label: 'Sent to vendor' },
    ],
  },
  signed: {
    totalViews: 11,
    uniqueDevices: 3,
    avgTime: '6m 48s',
    deepestSection: "Let's get started",
    shares: 2,
    lastViewed: 'Signed',
    sections: [
      { name: 'Thanks for having us', views: 11, dwell: '42s' },
      { name: 'Marketing investment', views: 7, dwell: '2m 10s' },
      { name: 'Your sales team', views: 6, dwell: '48s' },
      { name: "Let's get started", views: 5, dwell: '1m 02s' },
    ],
    timeline: [
      { at: '2d ago', label: 'Agency agreement signed', detail: 'Both vendors signed' },
      { at: '3d ago', label: 'Vendor requested call', detail: 'Follow-up booked for Wednesday' },
      { at: '4d ago', label: 'Shared with second decision-maker' },
      { at: '5d ago', label: 'First view', detail: 'iPad · Safari · Echuca' },
      { at: '6d ago', label: 'Sent to vendor' },
    ],
  },
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

type NavItem = { label: string; icon: LucideIcon; active?: boolean }
type NavGroup = { heading: string; items: NavItem[] }

const navGroups: NavGroup[] = [
  {
    heading: 'Workspace',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard },
      { label: 'Conversations', icon: MessageSquare },
    ],
  },
  {
    heading: 'Pipeline',
    items: [
      { label: 'Properties', icon: Building2 },
      { label: 'Proposals', icon: FileText, active: true },
    ],
  },
  {
    heading: 'Schedule',
    items: [
      { label: 'Tasks', icon: ClipboardList },
      { label: 'Calendar', icon: Calendar },
      { label: 'OFI Planner', icon: CalendarClock },
    ],
  },
  {
    heading: 'Growth',
    items: [
      { label: 'Contacts', icon: Contact },
      { label: 'Prospecting', icon: Telescope },
      { label: 'Farming Areas', icon: Sprout },
    ],
  },
  {
    heading: 'AI',
    items: [{ label: 'AI bots', icon: Bot }],
  },
]

function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: () => void
}) {
  return (
    <aside
      className={
        'flex shrink-0 flex-col px-3 pt-4 pb-3 transition-[width] duration-200 ease-out ' +
        (collapsed ? 'w-[64px]' : 'w-[240px]')
      }
    >
      <div
        className={
          'flex items-center px-2 pb-4 ' + (collapsed ? 'justify-center' : 'justify-between')
        }
      >
        {!collapsed && (
          <span className="text-[18px] font-semibold tracking-tight text-ink">tenvo</span>
        )}
        <button
          onClick={onToggle}
          className="text-ink-faint hover:text-ink-muted"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <PanelLeft size={16} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden">
        {navGroups.map((g, i) => (
          <div key={g.heading} className={i === 0 ? '' : 'mt-4'}>
            {!collapsed && (
              <div className="mb-1 px-2 text-[11px] font-medium uppercase tracking-wider text-ink-faint">
                {g.heading}
              </div>
            )}
            <div className="space-y-0.5">
              {g.items.map((item) => (
                <SidebarItem key={item.label} item={item} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-3 space-y-0.5">
        <SidebarItem item={{ label: 'Settings', icon: SettingsIcon }} collapsed={collapsed} />
        <SidebarItem
          item={{ label: 'Share feedback', icon: MessageSquareText }}
          collapsed={collapsed}
        />
      </div>

      <button
        className={
          'mt-2 flex items-center gap-2.5 rounded-[10px] py-2 text-left hover:bg-white/60 ' +
          (collapsed ? 'justify-center px-0' : 'px-2')
        }
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-semibold text-white">
          BD
        </div>
        {!collapsed && (
          <>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[12.5px] font-medium text-ink">Bob Demo</div>
              <div className="truncate text-[11px] text-ink-faint">bob@demo.tenvo.app</div>
            </div>
            <ChevronsUpDown size={13} className="text-ink-faint" />
          </>
        )}
      </button>
    </aside>
  )
}

function SidebarItem({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const Icon = item.icon
  const base = item.active
    ? 'bg-accent text-white shadow-[0_1px_2px_rgba(0,87,255,0.28)]'
    : 'text-ink-muted hover:bg-white/60 hover:text-ink'
  if (collapsed) {
    return (
      <button
        title={item.label}
        aria-label={item.label}
        className={
          'flex h-9 w-full items-center justify-center rounded-[10px] transition ' + base
        }
      >
        <Icon size={16} strokeWidth={1.75} />
      </button>
    )
  }
  return (
    <button
      className={
        'flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-[7px] text-[13.5px] transition ' +
        base
      }
    >
      <Icon size={15} strokeWidth={1.75} />
      <span className="flex-1 text-left">{item.label}</span>
    </button>
  )
}

// ─── Topbar ──────────────────────────────────────────────────────────────

function TopBar() {
  return (
    <div className="flex items-center gap-2 pt-4">
      <div className="flex-1" />
      <div className="flex items-center gap-2 rounded-[10px] bg-white px-3 py-1.5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] w-[280px]">
        <Search size={14} className="text-ink-faint" />
        <input
          placeholder="Search Tenvo…"
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-ink-faint"
        />
      </div>
      <button className="inline-flex items-center gap-1.5 rounded-[10px] px-2.5 py-1.5 text-[13px] font-medium text-accent hover:bg-accent-soft">
        <Plus size={14} strokeWidth={2} />
        Quick add
      </button>
      <button className="relative flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-white/70" aria-label="Notifications">
        <Bell size={16} strokeWidth={1.75} />
        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[9.5px] font-semibold text-white">
          1
        </span>
      </button>
    </div>
  )
}

// ─── Pipeline card ───────────────────────────────────────────────────────

const methodTint: Record<Method, string> = {
  Auction: 'bg-warn-soft text-warn',
  'Private treaty': 'bg-accent-soft text-accent',
  EOI: 'bg-success-soft text-success',
}

function PipelineCard({ p, onOpen }: { p: Proposal; onOpen: () => void }) {
  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onOpen()}
      className="group relative cursor-pointer rounded-[14px] bg-surface p-3.5 shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-pop)]"
    >
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

function PipelineColumn({
  stage,
  label,
  hint,
  fit,
  onOpenCard,
  onAdd,
}: {
  stage: Stage
  label: string
  hint: string
  fit?: boolean
  onOpenCard: (p: Proposal) => void
  onAdd: () => void
}) {
  const items = proposals.filter((p) => p.stage === stage)
  return (
    <div className={`flex flex-1 flex-col ${fit ? 'min-w-0' : 'min-w-[260px]'}`}>
      <div className="flex items-baseline justify-between px-1 pb-2">
        <div className="flex items-baseline gap-2">
          <span className="text-[13px] font-semibold text-ink">{label}</span>
          <span className="text-[12px] text-ink-faint">{items.length}</span>
        </div>
        <span className="text-[11px] text-ink-faint">{hint}</span>
      </div>
      <div className="flex flex-1 flex-col gap-2.5 rounded-[16px] bg-black/[0.02] p-2.5 min-h-[200px]">
        {items.map((p) => (
          <PipelineCard key={p.id} p={p} onOpen={() => onOpenCard(p)} />
        ))}
        <button
          onClick={onAdd}
          className="mt-1 flex items-center justify-center gap-1.5 rounded-[10px] py-2 text-[12px] font-medium text-ink-faint hover:bg-white/70 hover:text-ink-muted"
        >
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
    <aside className="w-[200px] shrink-0 space-y-3">
      <div className="flex items-baseline justify-between px-1">
        <div className="text-[12px] font-semibold text-ink">This month</div>
        <button className="text-[11.5px] text-ink-muted hover:text-ink">September</button>
      </div>
      <div className="space-y-1.5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-[12px] bg-surface px-3 py-2 shadow-[var(--shadow-card)]">
            <div className="text-[11px] text-ink-muted">{s.label}</div>
            <div className="mt-0.5 flex items-baseline gap-1.5">
              <div className="text-[16px] font-semibold tracking-tight leading-tight">{s.value}</div>
              <div
                className={
                  'text-[10.5px] font-medium ' +
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [wizard, setWizard] = useState<null | 'proposal' | 'agreement'>(null)
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)

  const cta =
    tab === 'templates'
      ? { label: 'New template', target: 'proposal' as const }
      : tab === 'agreements'
      ? { label: 'New agreement', target: 'agreement' as const }
      : { label: 'New proposal', target: 'proposal' as const }

  const pageHeading =
    tab === 'templates'
      ? { title: 'Templates', subtitle: 'Pre-built proposals by product line — residential, PM, commercial, development.' }
      : tab === 'agreements'
      ? { title: 'Agreements', subtitle: 'Agency agreements and signatures across the pipeline.' }
      : { title: 'Proposals', subtitle: 'Every listing pitch from draft to signed agency agreement.' }

  const openWizard = (target: 'proposal' | 'agreement') => {
    setWizard(target)
  }
  const closeWizard = () => {
    setWizard(null)
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas font-sans text-ink">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((c) => !c)} />

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
                  <h1 className="text-[32px] font-semibold leading-tight tracking-tight">{pageHeading.title}</h1>
                  <p className="mt-1 text-[13.5px] text-ink-muted">{pageHeading.subtitle}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-white text-ink-muted shadow-[0_1px_2px_rgba(16,24,40,0.05)] hover:text-ink">
                    <MoreHorizontal size={16} />
                  </button>
                  <button
                    onClick={() => openWizard(cta.target)}
                    className="inline-flex items-center gap-1.5 rounded-[10px] bg-accent px-3.5 py-2 text-[13px] font-medium text-white shadow-[0_1px_2px_rgba(0,87,255,0.35)] hover:brightness-105"
                  >
                    <Plus size={14} strokeWidth={2.25} />
                    {cta.label}
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
                <div
                  className={
                    'flex flex-1 gap-4 pb-4 ' +
                    (sidebarCollapsed ? 'overflow-x-hidden' : 'overflow-x-auto')
                  }
                >
                  {stages.map((s) => (
                    <PipelineColumn
                      key={s.key}
                      stage={s.key}
                      label={s.label}
                      hint={s.hint}
                      fit={sidebarCollapsed}
                      onOpenCard={(p) => setSelectedProposal(p)}
                      onAdd={() => openWizard('proposal')}
                    />
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
                    <button
                      key={p.id}
                      onClick={() => setSelectedProposal(p)}
                      className="grid w-full cursor-pointer grid-cols-[minmax(0,1.5fr)_120px_120px_140px_100px_60px] items-center gap-4 border-t border-hairline/70 px-5 py-3 text-left text-[13px] hover:bg-canvas/60"
                    >
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
                      <div className="text-right text-accent">Open</div>
                    </button>
                  ))}
                </div>
              )}

              {tab === 'templates' && (
                <TemplatesLibrary
                  onOpen={() => openWizard('proposal')}
                  onNew={() => openWizard('proposal')}
                />
              )}

              {tab === 'agreements' && (
                <Agreements onNewAgreement={() => openWizard('agreement')} />
              )}
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

      {wizard === 'proposal' && <NewProposalWizard onClose={closeWizard} />}
      {wizard === 'agreement' && <NewAgreementFlow onClose={closeWizard} />}
      {selectedProposal && (
        <ProposalAnalyticsModal
          proposal={selectedProposal}
          onClose={() => setSelectedProposal(null)}
        />
      )}
    </div>
  )
}

// ─── Templates library ───────────────────────────────────────────────────

type TemplateCategoryKey = 'residential' | 'pm-landlord' | 'pm-tenant' | 'commercial' | 'development'

type Template = {
  id: string
  name: string
  description: string
  tone: 'Classic' | 'Modern' | 'Bold' | 'Minimal'
  lastUsed: string
}

type TemplateCategory = {
  key: TemplateCategoryKey
  label: string
  blurb: string
  templates: Template[]
}

const templateCategories: TemplateCategory[] = [
  {
    key: 'residential',
    label: 'Residential sales',
    blurb: 'Listing pitches for houses, units and townhouses.',
    templates: [
      { id: 'r1', name: 'Classic — single property', description: 'CMA, marketing plan, fee, team.', tone: 'Classic', lastUsed: 'Used 3 days ago' },
      { id: 'r2', name: 'Modern — hero property', description: 'Big imagery, short-copy, bold CTA.', tone: 'Modern', lastUsed: 'Used yesterday' },
      { id: 'r3', name: 'Prestige — luxury listing', description: 'Full-bleed photography, discreet pricing.', tone: 'Bold', lastUsed: 'Used last week' },
    ],
  },
  {
    key: 'pm-landlord',
    label: 'Property management — landlord',
    blurb: 'Pitching to manage an investment property for the landlord.',
    templates: [
      { id: 'pml1', name: 'Standard landlord pitch', description: 'Service inclusions, fees, tenancy pipeline.', tone: 'Classic', lastUsed: 'Used 6 days ago' },
      { id: 'pml2', name: 'Portfolio landlord', description: 'For multi-property investors with reporting focus.', tone: 'Modern', lastUsed: 'Used last month' },
    ],
  },
  {
    key: 'pm-tenant',
    label: 'Property management — tenant',
    blurb: 'Onboarding and expectation-setting for a prospective tenant.',
    templates: [
      { id: 'pmt1', name: 'Tenant welcome pack', description: 'Rights, obligations, maintenance process.', tone: 'Minimal', lastUsed: 'Used 2 weeks ago' },
      { id: 'pmt2', name: 'Lease renewal pitch', description: 'Renewal terms + any rent review.', tone: 'Classic', lastUsed: 'Used last week' },
    ],
  },
  {
    key: 'commercial',
    label: 'Commercial',
    blurb: 'Office, retail and industrial sales or leasing proposals.',
    templates: [
      { id: 'c1', name: 'Commercial sale', description: 'Investment case, yield analysis, buyer pool.', tone: 'Classic', lastUsed: 'Used last month' },
      { id: 'c2', name: 'Commercial leasing', description: 'Market rent, incentives, lead-tenant pipeline.', tone: 'Modern', lastUsed: 'Used 3 weeks ago' },
    ],
  },
  {
    key: 'development',
    label: 'Development',
    blurb: 'Masterplan or multi-lot development marketing proposals.',
    templates: [
      { id: 'd1', name: 'Masterplan launch', description: 'Vision, staging, display suite plan.', tone: 'Bold', lastUsed: 'Used yesterday' },
    ],
  },
]

const toneTint: Record<Template['tone'], string> = {
  Classic: 'bg-accent-soft text-accent',
  Modern: 'bg-success-soft text-success',
  Bold: 'bg-warn-soft text-warn',
  Minimal: 'bg-black/[0.05] text-ink-muted',
}

function TemplatesLibrary({
  onOpen,
  onNew,
}: {
  onOpen: (t: Template, categoryLabel: string) => void
  onNew: () => void
}) {
  return (
    <div className="flex-1 overflow-y-auto pb-6">
      <div className="space-y-7">
        {templateCategories.map((cat) => (
          <section key={cat.key}>
            <div className="mb-2 flex items-baseline justify-between">
              <div>
                <h3 className="text-[15px] font-semibold tracking-tight text-ink">{cat.label}</h3>
                <p className="text-[12px] text-ink-muted">{cat.blurb}</p>
              </div>
              <button
                onClick={onNew}
                className="inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:underline"
              >
                <Plus size={12} strokeWidth={2} />
                New in {cat.label.toLowerCase().split('—')[0].trim()}
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {cat.templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => onOpen(t, cat.label)}
                  className="group flex min-h-[130px] flex-col rounded-[14px] bg-surface p-4 text-left shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-pop)]"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-accent-soft text-accent">
                      <FileText size={15} strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[13.5px] font-semibold text-ink">{t.name}</div>
                      <div className="mt-0.5 text-[11.5px] text-ink-muted">{t.description}</div>
                    </div>
                  </div>
                  <div className="mt-auto flex items-center gap-1.5 pt-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10.5px] font-medium ${toneTint[t.tone]}`}>
                      {t.tone}
                    </span>
                    <span className="ml-auto text-[11px] text-ink-faint">{t.lastUsed}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
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

// ─── Proposal analytics modal ────────────────────────────────────────────

function ProposalAnalyticsModal({
  proposal,
  onClose,
}: {
  proposal: Proposal
  onClose: () => void
}) {
  const a = analyticsByStage[proposal.stage]
  const url = proposal.demoUrl ?? demoProposalUrl
  const maxViews = a.sections.reduce((m, s) => Math.max(m, s.views), 0)

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/35 p-6"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88vh] w-full max-w-[720px] flex-col overflow-hidden rounded-[20px] bg-canvas shadow-[0_20px_60px_rgba(16,24,40,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-hairline bg-surface px-6 py-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`h-1.5 w-1.5 rounded-full ${stageDot(proposal.stage)}`} />
              <span className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
                {stageLabel(proposal.stage)} · {proposal.daysInStage}d in stage
              </span>
            </div>
            <h2 className="mt-1 text-[20px] font-semibold tracking-tight">{proposal.address}</h2>
            <div className="mt-0.5 text-[13px] text-ink-muted">
              {proposal.suburb} · {proposal.vendor} · {proposal.method} · {proposal.priceRange}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-[10px] bg-accent px-3 py-1.5 text-[12.5px] font-medium text-white shadow-[0_1px_2px_rgba(0,87,255,0.35)] hover:brightness-105"
            >
              <ExternalLink size={13} strokeWidth={2} />
              Open proposal
            </a>
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-black/[0.05]"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {proposal.stage === 'draft' ? (
            <div className="rounded-[14px] bg-surface p-6 text-center shadow-[var(--shadow-card)]">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent">
                <FileText size={16} />
              </div>
              <div className="mt-3 text-[14px] font-semibold">No analytics yet</div>
              <div className="mt-1 text-[12.5px] text-ink-muted">
                Send this proposal to the vendor to start capturing views and engagement.
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <AnalyticsTile icon={<Eye size={13} />} label="Total views" value={String(a.totalViews)} />
                <AnalyticsTile icon={<Smartphone size={13} />} label="Unique devices" value={String(a.uniqueDevices)} />
                <AnalyticsTile icon={<Clock size={13} />} label="Avg time" value={a.avgTime} />
                <AnalyticsTile icon={<Share2 size={13} />} label="Shares" value={String(a.shares)} />
              </div>

              <div className="mt-3 flex items-center justify-between rounded-[12px] bg-surface px-4 py-2.5 text-[12px] text-ink-muted shadow-[var(--shadow-card)]">
                <span>
                  Deepest section: <span className="font-medium text-ink">{a.deepestSection}</span>
                </span>
                <span>Last viewed {a.lastViewed}</span>
              </div>

              {a.sections.length > 0 && (
                <div className="mt-5">
                  <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-ink-faint">
                    Sections viewed
                  </div>
                  <div className="rounded-[14px] bg-surface p-4 shadow-[var(--shadow-card)]">
                    <ul className="space-y-2.5">
                      {a.sections.map((s) => {
                        const pct = maxViews === 0 ? 0 : Math.round((s.views / maxViews) * 100)
                        return (
                          <li key={s.name} className="grid grid-cols-[minmax(0,1fr)_120px_60px] items-center gap-3 text-[12.5px]">
                            <div className="min-w-0 truncate">{s.name}</div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-black/[0.06]">
                              <div
                                className="h-full rounded-full bg-accent"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <div className="text-right text-ink-muted">
                              {s.views} · {s.dwell}
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </div>
              )}

              <div className="mt-5">
                <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-ink-faint">
                  Timeline
                </div>
                <div className="rounded-[14px] bg-surface p-4 shadow-[var(--shadow-card)]">
                  <ol className="space-y-3">
                    {a.timeline.map((e, i) => (
                      <li key={i} className="flex items-start gap-3 text-[12.5px]">
                        <div className="relative mt-1 flex flex-col items-center">
                          <span className="h-2 w-2 rounded-full bg-accent" />
                          {i < a.timeline.length - 1 && (
                            <span className="mt-1 h-full w-px bg-hairline" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-ink">{e.label}</div>
                          {e.detail && <div className="text-ink-muted">{e.detail}</div>}
                        </div>
                        <div className="shrink-0 text-[11.5px] text-ink-faint">{e.at}</div>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function AnalyticsTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-[12px] bg-surface px-3 py-2.5 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-wider text-ink-faint">
        <span className="text-ink-muted">{icon}</span>
        {label}
      </div>
      <div className="mt-1 text-[18px] font-semibold tracking-tight">{value}</div>
    </div>
  )
}
