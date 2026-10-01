import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  Check,
  ChevronRight,
  FilePlus2,
  FileSignature,
  FileText,
  Info,
  ScrollText,
  Search,
  Send,
  Sparkles,
  X,
} from 'lucide-react'
import SignAnythingBuilder from './SignAnythingBuilder'

// ─── Types ───────────────────────────────────────────────────────────────

type Screen = 'picker' | 'templated' | 'sign-anything'

type StateCode = 'NSW' | 'VIC' | 'QLD' | 'WA' | 'SA' | 'TAS' | 'ACT' | 'NT'

type TemplateForm = {
  id: string
  name: string
  code?: string
  purpose: string
  category: 'agency' | 'amendment' | 'disclosure' | 'management' | 'other'
  frequency: 'common' | 'occasional' | 'rare'
}

type PeakBody = {
  state: StateCode
  body: string
  stateName: string
  forms: TemplateForm[]
}

// ─── Peak-body catalogue (prescribed forms) ──────────────────────────────

const catalogue: PeakBody[] = [
  {
    state: 'NSW',
    body: 'REINSW',
    stateName: 'New South Wales',
    forms: [
      { id: 'nsw-sales-agency', name: 'Residential Sales Agency Agreement', code: 'Form R009', purpose: 'Exclusive selling authority for a residential property', category: 'agency', frequency: 'common' },
      { id: 'nsw-auction-authority', name: 'Auction Authority', code: 'Form R010', purpose: 'Vendor authorises sale by public auction', category: 'agency', frequency: 'common' },
      { id: 'nsw-price-change', name: 'Price Change Acknowledgement', purpose: 'Vendor acknowledges revised price guide / reserve', category: 'amendment', frequency: 'common' },
      { id: 'nsw-marketing-amendment', name: 'Marketing Amendment', purpose: 'Adjust marketing schedule or spend within an existing agency', category: 'amendment', frequency: 'occasional' },
      { id: 'nsw-mgmt-agency', name: 'Residential Property Management Agreement', code: 'Form R014', purpose: 'Appoint agent to manage a leased property', category: 'management', frequency: 'occasional' },
      { id: 'nsw-material-fact', name: 'Material Fact Disclosure', purpose: 'Written disclosure of material facts to prospective purchasers', category: 'disclosure', frequency: 'occasional' },
    ],
  },
  {
    state: 'VIC',
    body: 'REIV',
    stateName: 'Victoria',
    forms: [
      { id: 'vic-form-7', name: 'Exclusive Sale Authority', code: 'Form 7', purpose: 'Exclusive appointment to sell a residential property', category: 'agency', frequency: 'common' },
      { id: 'vic-auction-authority', name: 'Auction Authority', purpose: 'Vendor authorises sale by public auction', category: 'agency', frequency: 'common' },
      { id: 'vic-price-change', name: 'Statement of Information Amendment', purpose: 'Update indicative selling price under s47AF Estate Agents Act', category: 'amendment', frequency: 'common' },
      { id: 'vic-section-27', name: 'Section 27 Deposit Release', purpose: 'Purchaser authorises early release of deposit to vendor', category: 'other', frequency: 'occasional' },
      { id: 'vic-general-auth', name: 'General Sale Authority', purpose: 'Non-exclusive selling authority', category: 'agency', frequency: 'rare' },
    ],
  },
  {
    state: 'QLD',
    body: 'REIQ',
    stateName: 'Queensland',
    forms: [
      { id: 'qld-form-6', name: 'Appointment of Property Agent', code: 'PO Form 6', purpose: 'Statutory appointment under the Property Occupations Act', category: 'agency', frequency: 'common' },
      { id: 'qld-price-change', name: 'PO Form 6 Amendment', purpose: 'Vary price, marketing or term of an existing appointment', category: 'amendment', frequency: 'common' },
      { id: 'qld-body-corp', name: 'Body Corporate Disclosure', code: 'BCCM Form 14', purpose: 'Disclosure to prospective buyer of a lot', category: 'disclosure', frequency: 'occasional' },
    ],
  },
  {
    state: 'WA',
    body: 'REIWA',
    stateName: 'Western Australia',
    forms: [
      { id: 'wa-selling-auth', name: 'Selling Authority', code: 'Form 006', purpose: 'Exclusive authority to sell a residential property', category: 'agency', frequency: 'common' },
      { id: 'wa-price-change', name: 'Selling Authority Amendment', purpose: 'Adjust price, term or fees on an existing authority', category: 'amendment', frequency: 'common' },
    ],
  },
  {
    state: 'SA',
    body: 'REISA',
    stateName: 'South Australia',
    forms: [
      { id: 'sa-sales-agency', name: 'Sales Agency Agreement', purpose: 'Exclusive authority to sell a residential property in SA', category: 'agency', frequency: 'common' },
      { id: 'sa-form-1', name: 'Vendor Disclosure', code: 'Form 1', purpose: 'Statutory disclosure to purchaser under s7 Land and Business Act', category: 'disclosure', frequency: 'occasional' },
    ],
  },
  {
    state: 'TAS',
    body: 'REIT',
    stateName: 'Tasmania',
    forms: [
      { id: 'tas-sales-auth', name: 'Property Sales Authority', purpose: 'Exclusive authority to sell', category: 'agency', frequency: 'common' },
    ],
  },
  {
    state: 'ACT',
    body: 'REIACT',
    stateName: 'Australian Capital Territory',
    forms: [
      { id: 'act-exclusive-agency', name: 'Exclusive Agency Agreement', purpose: 'Exclusive authority to sell in the ACT', category: 'agency', frequency: 'common' },
    ],
  },
  {
    state: 'NT',
    body: 'REINT',
    stateName: 'Northern Territory',
    forms: [
      { id: 'nt-sole-selling', name: 'Sole Selling Agency', purpose: 'Sole authority to sell a residential property in the NT', category: 'agency', frequency: 'common' },
    ],
  },
]

const categoryLabel: Record<TemplateForm['category'], string> = {
  agency: 'Agency',
  amendment: 'Amendment',
  disclosure: 'Disclosure',
  management: 'Management',
  other: 'Other',
}

const categoryDotClass: Record<TemplateForm['category'], string> = {
  agency: 'bg-accent',
  amendment: 'bg-warn',
  disclosure: 'bg-[#8b5cf6]',
  management: 'bg-success',
  other: 'bg-ink-faint',
}

// ─── Entry point ─────────────────────────────────────────────────────────

export default function NewAgreementFlow({ onClose }: { onClose: () => void }) {
  const [screen, setScreen] = useState<Screen>('picker')

  if (screen === 'sign-anything') {
    return <SignAnythingBuilder onBack={() => setScreen('picker')} onClose={onClose} />
  }
  if (screen === 'templated') {
    return <TemplatedFlow onBack={() => setScreen('picker')} onClose={onClose} />
  }
  return (
    <PickerModal
      onClose={onClose}
      onPickTemplated={() => setScreen('templated')}
      onPickSignAnything={() => setScreen('sign-anything')}
    />
  )
}

// ─── Picker modal ────────────────────────────────────────────────────────

function PickerModal({
  onClose,
  onPickTemplated,
  onPickSignAnything,
}: {
  onClose: () => void
  onPickTemplated: () => void
  onPickSignAnything: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 p-6" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[720px] rounded-[20px] bg-surface p-8 shadow-[var(--shadow-pop)]"
      >
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[11.5px] font-medium uppercase tracking-[0.08em] text-ink-faint">New agreement</div>
            <h2 className="mt-1 text-[22px] font-semibold tracking-tight">How would you like to start?</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-[10px] p-1.5 text-ink-muted transition hover:bg-canvas hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <PickerTile
            icon={<ScrollText size={20} />}
            title="Templated agreement"
            body="Pick a prescribed form from your state's peak body — agency agreements, price change acknowledgements, and other regulated documents."
            bullets={['REINSW · REIV · REIQ · REIWA', 'Auto-fills vendor & property details', 'Ready-to-send in under a minute']}
            onClick={onPickTemplated}
            tone="accent"
          />
          <PickerTile
            icon={<FileSignature size={20} />}
            title="Sign anything"
            body="Upload any PDF and place signature, initial, name and date fields yourself — like DocuSign, inside Tenvo."
            bullets={['Any PDF up to 20MB', 'Drag-place fields on each page', 'Multiple signers with signing order']}
            onClick={onPickSignAnything}
            tone="neutral"
          />
        </div>

        <div className="mt-6 flex items-start gap-2 rounded-[12px] bg-accent-tint px-3.5 py-3 text-[12.5px] text-ink-muted">
          <Info size={14} className="mt-0.5 shrink-0 text-accent" />
          <p>
            Every agreement — templated or custom — routes through Tenvo's audit trail, view analytics and reminder engine.
            Vendors don't need an account to sign.
          </p>
        </div>
      </div>
    </div>
  )
}

function PickerTile({
  icon,
  title,
  body,
  bullets,
  onClick,
  tone,
}: {
  icon: React.ReactNode
  title: string
  body: string
  bullets: string[]
  onClick: () => void
  tone: 'accent' | 'neutral'
}) {
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col items-start gap-3 rounded-[16px] border border-hairline bg-surface p-5 text-left transition hover:border-accent hover:shadow-[var(--shadow-card)]"
    >
      <div
        className={
          'flex h-10 w-10 items-center justify-center rounded-[10px] ' +
          (tone === 'accent' ? 'bg-accent-soft text-accent' : 'bg-black/[0.04] text-ink')
        }
      >
        {icon}
      </div>
      <div>
        <div className="text-[15px] font-semibold tracking-tight">{title}</div>
        <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">{body}</p>
      </div>
      <ul className="mt-1 space-y-1">
        {bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-1.5 text-[11.5px] text-ink-muted">
            <Check size={12} strokeWidth={2.5} className="mt-0.5 shrink-0 text-success" />
            {b}
          </li>
        ))}
      </ul>
      <div className="mt-auto flex items-center gap-1 text-[12.5px] font-medium text-accent opacity-0 transition group-hover:opacity-100">
        Choose <ChevronRight size={14} />
      </div>
    </button>
  )
}

// ─── Templated flow ──────────────────────────────────────────────────────

type TStep = 'catalogue' | 'fill' | 'sent'

function TemplatedFlow({ onBack, onClose }: { onBack: () => void; onClose: () => void }) {
  const [step, setStep] = useState<TStep>('catalogue')
  const [state, setState] = useState<StateCode>('NSW')
  const [query, setQuery] = useState('')
  const [selectedForm, setSelectedForm] = useState<TemplateForm | null>(null)

  const active = catalogue.find((p) => p.state === state)!

  const filteredForms = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return active.forms
    return active.forms.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.purpose.toLowerCase().includes(q) ||
        (f.code?.toLowerCase().includes(q) ?? false),
    )
  }, [active, query])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-canvas">
      <TopBar
        onBack={step === 'fill' ? () => setStep('catalogue') : onBack}
        onClose={onClose}
        eyebrow={step === 'sent' ? 'Sent' : 'Templated agreement'}
        title={
          step === 'catalogue' ? 'Choose a prescribed form'
          : step === 'fill' ? selectedForm?.name ?? ''
          : 'Agreement sent'
        }
        right={
          step === 'fill' ? (
            <button
              onClick={() => setStep('sent')}
              className="inline-flex items-center gap-1.5 rounded-[10px] bg-accent px-3.5 py-2 text-[12.5px] font-medium text-white transition hover:brightness-105"
            >
              <Send size={13} /> Send for signature
            </button>
          ) : null
        }
      />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[960px] px-8 py-8">
          {step === 'catalogue' && (
            <CatalogueScreen
              state={state}
              onState={setState}
              query={query}
              onQuery={setQuery}
              forms={filteredForms}
              body={active.body}
              stateName={active.stateName}
              onPick={(f) => {
                setSelectedForm(f)
                setStep('fill')
              }}
            />
          )}
          {step === 'fill' && selectedForm && (
            <FillScreen form={selectedForm} peakBody={active.body} />
          )}
          {step === 'sent' && selectedForm && <SentScreen form={selectedForm} onClose={onClose} />}
        </div>
      </div>
    </div>
  )
}

function CatalogueScreen({
  state,
  onState,
  query,
  onQuery,
  forms,
  body,
  stateName,
  onPick,
}: {
  state: StateCode
  onState: (s: StateCode) => void
  query: string
  onQuery: (q: string) => void
  forms: TemplateForm[]
  body: string
  stateName: string
  onPick: (f: TemplateForm) => void
}) {
  return (
    <>
      <div className="mb-6">
        <h2 className="text-[24px] font-semibold tracking-tight">Prescribed forms</h2>
        <p className="mt-1 text-[13px] text-ink-muted">
          Templates published by state peak bodies. Fill vendor and property details once, and Tenvo populates the whole document.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        {catalogue.map((p) => {
          const active = p.state === state
          return (
            <button
              key={p.state}
              onClick={() => onState(p.state)}
              className={
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium transition ' +
                (active ? 'bg-white text-ink shadow-[0_1px_2px_rgba(16,24,40,0.08)]' : 'text-ink-muted hover:text-ink')
              }
            >
              {p.state}
              <span
                className={
                  'rounded-full px-1.5 text-[10.5px] font-semibold ' +
                  (active ? 'bg-accent-soft text-accent' : 'bg-black/[0.06] text-ink-muted')
                }
              >
                {p.forms.length}
              </span>
            </button>
          )
        })}
        <div className="flex-1" />
        <div className="relative">
          <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search forms…"
            className="w-[240px] rounded-[10px] border border-hairline bg-surface py-1.5 pl-8 pr-3 text-[12.5px] outline-none placeholder:text-ink-faint focus:border-accent"
          />
        </div>
      </div>

      <div className="mb-3 text-[11.5px] font-medium uppercase tracking-[0.08em] text-ink-faint">
        {body} · {stateName}
      </div>

      <div className="space-y-2">
        {forms.length === 0 ? (
          <div className="rounded-[16px] bg-surface p-10 text-center text-[12.5px] text-ink-muted shadow-[var(--shadow-card)]">
            No forms match "{query}"
          </div>
        ) : (
          forms.map((f) => (
            <button
              key={f.id}
              onClick={() => onPick(f)}
              className="group flex w-full items-center gap-4 rounded-[14px] bg-surface px-5 py-4 text-left shadow-[var(--shadow-card)] transition hover:shadow-[0_2px_4px_rgba(16,24,40,0.05),0_8px_20px_rgba(16,24,40,0.05)]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-accent-soft text-accent">
                <FileText size={17} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <div className="truncate text-[14px] font-semibold tracking-tight">{f.name}</div>
                  {f.code && <div className="shrink-0 text-[11.5px] text-ink-faint">{f.code}</div>}
                </div>
                <div className="mt-0.5 truncate text-[12px] text-ink-muted">{f.purpose}</div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.04] px-2 py-0.5 text-[11px] text-ink-muted">
                  <span className={`h-1.5 w-1.5 rounded-full ${categoryDotClass[f.category]}`} />
                  {categoryLabel[f.category]}
                </span>
                <ChevronRight size={14} className="text-ink-faint transition group-hover:translate-x-0.5 group-hover:text-ink" />
              </div>
            </button>
          ))
        )}
      </div>
    </>
  )
}

function FillScreen({ form, peakBody }: { form: TemplateForm; peakBody: string }) {
  const [linkedProperty, setLinkedProperty] = useState('12 Bayview Rd, Balmain')
  const [vendors, setVendors] = useState('Sarah Chen, James Chen')
  const [term, setTerm] = useState('90 days')
  const [commission, setCommission] = useState('2.3% inc. GST')
  const [marketing, setMarketing] = useState('$3,807')
  const [effective, setEffective] = useState('')

  return (
    <div className="grid grid-cols-[1fr_320px] gap-8">
      <div>
        <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent">
          <ScrollText size={11} /> {peakBody} {form.code ?? ''}
        </div>
        <h2 className="text-[24px] font-semibold tracking-tight">{form.name}</h2>
        <p className="mt-1 text-[13px] text-ink-muted">{form.purpose}</p>

        <div className="mt-8 rounded-[16px] bg-surface p-6 shadow-[var(--shadow-card)]">
          <div className="mb-4 text-[11.5px] font-medium uppercase tracking-[0.08em] text-ink-faint">
            Auto-filled from Tenvo
          </div>

          <div className="space-y-5">
            <FillField
              label="Linked property"
              hint="Populates address, title reference, zoning and dwelling type"
              value={linkedProperty}
              onChange={setLinkedProperty}
            />
            <FillField
              label="Vendors"
              hint="Full legal names — separate multiple vendors with commas"
              value={vendors}
              onChange={setVendors}
            />
            <div className="grid grid-cols-2 gap-4">
              <FillField label="Agreement term" value={term} onChange={setTerm} />
              <FillField label="Effective date" value={effective} onChange={setEffective} placeholder="dd/mm/yyyy" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FillField label="Commission" value={commission} onChange={setCommission} />
              <FillField label="Marketing budget" value={marketing} onChange={setMarketing} />
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-[12px] bg-accent-tint px-3.5 py-3 text-[12.5px] text-ink-muted">
          <Sparkles size={14} className="mt-0.5 shrink-0 text-accent" />
          <p>
            Tenvo will populate the remaining prescribed fields from your workspace defaults (agency name, licensee, ABN,
            trust account) and generate the signed PDF on send.
          </p>
        </div>
      </div>

      <aside className="rounded-[16px] bg-surface p-5 shadow-[var(--shadow-card)]">
        <div className="text-[11.5px] font-medium uppercase tracking-[0.08em] text-ink-faint">Recipients</div>
        <div className="mt-3 space-y-2">
          <RecipientRow name="Sarah Chen" email="sarah@example.com" />
          <RecipientRow name="James Chen" email="james@example.com" />
        </div>
        <button className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-accent hover:brightness-110">
          <FilePlus2 size={13} /> Add signer
        </button>

        <div className="mt-6 border-t border-hairline pt-5">
          <div className="text-[11.5px] font-medium uppercase tracking-[0.08em] text-ink-faint">Delivery</div>
          <div className="mt-3 space-y-2 text-[12.5px]">
            <DeliveryRow label="Email + SMS" active />
            <DeliveryRow label="Email only" />
            <DeliveryRow label="Copy link" />
          </div>
        </div>
      </aside>
    </div>
  )
}

function FillField({
  label,
  hint,
  value,
  onChange,
  placeholder,
}: {
  label: string
  hint?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <label className="block">
      <div className="mb-1 text-[12px] font-medium text-ink">{label}</div>
      {hint && <div className="mb-1.5 text-[11.5px] text-ink-muted">{hint}</div>}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-[10px] border border-hairline bg-surface px-3 py-2 text-[13px] outline-none placeholder:text-ink-faint focus:border-accent"
      />
    </label>
  )
}

function RecipientRow({ name, email }: { name: string; email: string }) {
  const initials = name.split(/\s+/).map((n) => n[0]).join('').slice(0, 2)
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent">
        {initials}
      </div>
      <div className="min-w-0">
        <div className="truncate text-[12.5px] font-medium">{name}</div>
        <div className="truncate text-[11.5px] text-ink-muted">{email}</div>
      </div>
    </div>
  )
}

function DeliveryRow({ label, active }: { label: string; active?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={
          'flex h-4 w-4 items-center justify-center rounded-full border ' +
          (active ? 'border-accent bg-accent text-white' : 'border-hairline')
        }
      >
        {active && <Check size={10} strokeWidth={3} />}
      </div>
      <span className={active ? 'font-medium' : 'text-ink-muted'}>{label}</span>
    </div>
  )
}

function SentScreen({ form, onClose }: { form: TemplateForm; onClose: () => void }) {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-success">
        <Check size={22} strokeWidth={2.5} />
      </div>
      <h2 className="mt-4 text-[22px] font-semibold tracking-tight">Sent to vendors</h2>
      <p className="mt-1 max-w-[380px] text-[13px] text-ink-muted">
        {form.name} is now with Sarah and James Chen. You'll see view and signature events in the agreement's activity
        feed.
      </p>
      <div className="mt-6 flex gap-2">
        <button
          onClick={onClose}
          className="rounded-[10px] bg-accent px-4 py-2 text-[12.5px] font-medium text-white transition hover:brightness-105"
        >
          Back to agreements
        </button>
      </div>
    </div>
  )
}

// ─── Shared top bar ──────────────────────────────────────────────────────

export function TopBar({
  onBack,
  onClose,
  eyebrow,
  title,
  right,
}: {
  onBack: () => void
  onClose: () => void
  eyebrow: string
  title: string
  right?: React.ReactNode
}) {
  return (
    <header className="flex items-center gap-4 border-b border-hairline bg-surface/80 px-6 py-3 backdrop-blur">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-[10px] px-2 py-1.5 text-[12.5px] font-medium text-ink-muted transition hover:bg-canvas hover:text-ink"
      >
        <ArrowLeft size={14} /> Back
      </button>
      <div className="min-w-0">
        <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink-faint">{eyebrow}</div>
        <div className="truncate text-[14px] font-semibold tracking-tight">{title}</div>
      </div>
      <div className="ml-auto flex items-center gap-2">
        {right}
        <button
          onClick={onClose}
          className="rounded-[10px] p-1.5 text-ink-muted transition hover:bg-canvas hover:text-ink"
        >
          <X size={16} />
        </button>
      </div>
    </header>
  )
}
