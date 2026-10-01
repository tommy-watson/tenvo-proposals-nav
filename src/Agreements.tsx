import { useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowUpRight,
  Check,
  Circle,
  Clock,
  Download,
  Eye,
  FileSignature,
  MoreHorizontal,
  Plus,
  Send,
  ShieldCheck,
  X,
} from 'lucide-react'
import NewAgreementFlow from './NewAgreementFlow'

type SigStatus = 'pending' | 'viewed' | 'signed' | 'declined'
type AgreementStatus = 'draft' | 'awaiting' | 'partial' | 'signed' | 'voided'

type Signatory = {
  name: string
  email: string
  status: SigStatus
  when?: string
}

type Agreement = {
  id: string
  property: { address: string; suburb: string }
  vendors: Signatory[]
  method: string
  agreementPeriod: string
  commission: string
  aml: number
  marketing: number
  payLater: boolean
  status: AgreementStatus
  sentAt?: string
  signedAt?: string
  proposalHref?: string
}

const agreements: Agreement[] = [
  {
    id: 'ag1',
    property: { address: '16 Perricoota Road', suburb: 'Moama' },
    vendors: [
      { name: 'Karen Whittaker', email: 'karenw@example.com', status: 'signed', when: 'Yesterday 2:14pm' },
      { name: 'Steve Whittaker', email: 'steve@example.com', status: 'viewed', when: 'Yesterday 8:02pm' },
    ],
    method: 'Auction',
    agreementPeriod: '90 days',
    commission: '2.3% inc. GST',
    aml: 250,
    marketing: 3807,
    payLater: false,
    status: 'partial',
    sentAt: '2 days ago',
  },
  {
    id: 'ag2',
    property: { address: '74 Mitchell Street', suburb: 'Marrickville' },
    vendors: [
      { name: 'Bob Local', email: 'bob@example.com', status: 'viewed', when: '4h ago' },
    ],
    method: 'Auction',
    agreementPeriod: '90 days',
    commission: '2.3% inc. GST',
    aml: 250,
    marketing: 3272,
    payLater: true,
    status: 'awaiting',
    sentAt: 'Yesterday',
  },
  {
    id: 'ag3',
    property: { address: '118 Darling Street', suburb: 'Rozelle' },
    vendors: [
      { name: 'David Nguyen', email: 'd.nguyen@example.com', status: 'signed', when: '3 days ago' },
      { name: 'Amy Nguyen', email: 'amy.nguyen@example.com', status: 'signed', when: '3 days ago' },
    ],
    method: 'Auction',
    agreementPeriod: '90 days',
    commission: '2.3% inc. GST',
    aml: 250,
    marketing: 3272,
    payLater: false,
    status: 'signed',
    sentAt: '5 days ago',
    signedAt: '3 days ago',
  },
  {
    id: 'ag4',
    property: { address: '8 Curlewis Street', suburb: 'Bondi' },
    vendors: [
      { name: 'Ted Marshall', email: 'ted@example.com', status: 'signed', when: '2 wks ago' },
    ],
    method: 'Auction',
    agreementPeriod: '120 days',
    commission: '2.5% inc. GST',
    aml: 250,
    marketing: 4200,
    payLater: false,
    status: 'signed',
    sentAt: '3 wks ago',
    signedAt: '2 wks ago',
  },
  {
    id: 'ag5',
    property: { address: '12 Bayview Road', suburb: 'Balmain' },
    vendors: [
      { name: 'Sarah Chen', email: 'sarah@example.com', status: 'pending' },
      { name: 'James Chen', email: 'james@example.com', status: 'pending' },
    ],
    method: 'Auction',
    agreementPeriod: '90 days',
    commission: '2.3% inc. GST',
    aml: 250,
    marketing: 3807,
    payLater: false,
    status: 'draft',
  },
]

const formatMoney = (n: number) =>
  n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 })

type Filter = 'all' | 'awaiting' | 'partial' | 'signed' | 'draft'

const filterConfig: { key: Filter; label: string; predicate: (a: Agreement) => boolean }[] = [
  { key: 'all',       label: 'All',                predicate: () => true },
  { key: 'awaiting',  label: 'Awaiting signature', predicate: (a) => a.status === 'awaiting' },
  { key: 'partial',   label: 'Partially signed',   predicate: (a) => a.status === 'partial' },
  { key: 'signed',    label: 'Signed',             predicate: (a) => a.status === 'signed' },
  { key: 'draft',     label: 'Drafts',             predicate: (a) => a.status === 'draft' },
]

// ─── Status text ─────────────────────────────────────────────────────────

function statusText(a: Agreement): { headline: string; sub: string } {
  const signed = a.vendors.filter((v) => v.status === 'signed').length
  const total = a.vendors.length
  const unsigned = total - signed
  switch (a.status) {
    case 'draft':
      return { headline: 'Draft', sub: 'Not sent yet' }
    case 'awaiting':
      return { headline: 'Awaiting signature', sub: `Sent ${a.sentAt}` }
    case 'partial':
      return {
        headline: `Awaiting ${unsigned} signature${unsigned === 1 ? '' : 's'}`,
        sub: `${signed} of ${total} signed · sent ${a.sentAt}`,
      }
    case 'signed':
      return { headline: 'Signed', sub: `Fully signed ${a.signedAt}` }
    case 'voided':
      return { headline: 'Voided', sub: '—' }
  }
}

function sigStatusLabel(s: SigStatus): string {
  return s === 'signed' ? 'Signed' : s === 'viewed' ? 'Viewed' : s === 'declined' ? 'Declined' : 'Not sent'
}

// ─── Agreement card ──────────────────────────────────────────────────────

function AgreementCard({ a }: { a: Agreement }) {
  const [expanded, setExpanded] = useState(false)
  const s = statusText(a)

  const primaryLabel =
    a.status === 'draft' ? 'Send'
    : a.status === 'partial' ? `Nudge ${a.vendors.find((v) => v.status !== 'signed')?.name.split(/\s+/)[0] ?? ''}`.trim()
    : a.status === 'awaiting' ? 'Resend'
    : a.status === 'signed' ? 'Download'
    : 'Resend'

  return (
    <article
      onClick={() => setExpanded(!expanded)}
      className="cursor-pointer rounded-[14px] bg-surface px-5 py-4 shadow-[var(--shadow-card)] transition hover:shadow-[0_2px_4px_rgba(16,24,40,0.05),0_8px_20px_rgba(16,24,40,0.05)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold tracking-tight">{a.property.address}</h3>
          <p className="mt-0.5 truncate text-[12.5px] text-ink-muted">
            {a.vendors.map((v) => v.name).join(' & ')}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[12.5px] font-medium text-ink">{s.headline}</div>
          <div className="mt-0.5 text-[11.5px] text-ink-muted">{s.sub}</div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="min-w-0 truncate text-[12px] text-ink-muted">
          {a.method} · {a.commission} · {formatMoney(a.marketing)} marketing · {a.agreementPeriod}
        </div>
        <button
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 rounded-[10px] bg-accent px-3.5 py-1.5 text-[12.5px] font-medium text-white transition hover:brightness-105"
        >
          {primaryLabel}
        </button>
      </div>

      {expanded && (
        <div className="mt-4 space-y-1.5 border-t border-hairline pt-3">
          {a.vendors.map((v, i) => (
            <div key={i} className="flex items-baseline justify-between gap-4 text-[12.5px]">
              <span className="truncate">{v.name}</span>
              <div className="shrink-0 text-right">
                <span className={v.status === 'signed' ? 'text-success font-medium' : 'text-ink-muted'}>
                  {sigStatusLabel(v.status)}
                </span>
                {v.when && <span className="ml-2 text-[11.5px] text-ink-faint">{v.when}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  )
}

// ─── Main Agreements view ────────────────────────────────────────────────

export default function Agreements() {
  const [filter, setFilter] = useState<Filter>('all')
  const [creating, setCreating] = useState(false)

  const filtered = useMemo(() => {
    const cfg = filterConfig.find((f) => f.key === filter)!
    return agreements.filter(cfg.predicate)
  }, [filter])

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: agreements.length, awaiting: 0, partial: 0, signed: 0, draft: 0 }
    for (const a of agreements) {
      if (a.status === 'awaiting') c.awaiting++
      if (a.status === 'partial') c.partial++
      if (a.status === 'signed') c.signed++
      if (a.status === 'draft') c.draft++
    }
    return c
  }, [])

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Filter row */}
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        {filterConfig.map((f) => {
          const active = f.key === filter
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium transition ' +
                (active ? 'bg-white text-ink shadow-[0_1px_2px_rgba(16,24,40,0.08)]' : 'text-ink-muted hover:text-ink')
              }
            >
              {f.label}
              <span
                className={
                  'rounded-full px-1.5 text-[10.5px] font-semibold ' +
                  (active ? 'bg-accent-soft text-accent' : 'bg-black/[0.06] text-ink-muted')
                }
              >
                {counts[f.key]}
              </span>
            </button>
          )
        })}
        <div className="flex-1" />
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1.5 rounded-[10px] border border-hairline bg-surface px-3 py-1.5 text-[12.5px] font-medium text-ink hover:border-ink-faint"
        >
          <Plus size={12} strokeWidth={2} />
          New agreement
        </button>
      </div>

      {/* List */}
      <div className="flex-1 space-y-2 overflow-y-auto pb-8">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[16px] bg-surface p-10 text-center shadow-[var(--shadow-card)]">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent">
              <FileSignature size={20} />
            </div>
            <div className="mt-3 text-[15px] font-semibold">No agreements in this view</div>
            <div className="mt-1 text-[12.5px] text-ink-muted">
              Agreements sit inside proposals — send one from the Review step of a proposal to get started.
            </div>
          </div>
        ) : (
          filtered.map((a) => <AgreementCard key={a.id} a={a} />)
        )}
      </div>

      {creating && <NewAgreementFlow onClose={() => setCreating(false)} />}
    </div>
  )
}
