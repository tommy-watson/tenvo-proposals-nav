import { useMemo, useState } from 'react'
import CMABuilder from './CMABuilder'
import SendPreview from './SendPreview'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  ClipboardCheck,
  FileSignature,
  FileText,
  ShieldCheck,
  Gauge,
  Home,
  Info,
  Layers,
  Loader2,
  Mail,
  MapPin,
  Megaphone,
  Percent,
  Search,
  Send,
  Sparkles,
  Undo2,
  UserMinus,
  UserPlus,
  Users,
  X,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────

export type Variant = 'full' | 'price-update'

export type Comp = {
  id: string
  kind: 'sold' | 'for-sale'
  address: string
  suburb: string
  postcode: string
  price: number
  priceHigh?: number
  soldAgo: string
  soldDate?: string
  listedDate?: string
  beds: number
  baths: number
  cars: number
  land: number
  type: string
  dom: number
  distance: number
  yearBuilt?: number
  fromCMA: boolean
  included: boolean
  note?: string
}

type MarketingLine = {
  id: string
  label: string
  category: 'Digital' | 'Print' | 'Media'
  amount: number
  included: boolean
}

type Person = { id: string; name: string; email: string; phone: string }

type State = {
  variant: Variant
  property: {
    address: string
    suburb: string
    postcode: string
    beds: number
    baths: number
    cars: number
    land: number
    type: string
  }
  vendor: {
    people: Person[]
    sendIndividually: boolean
  }
  comps: Comp[]
  price: { low: number; high: number }
  marketing: MarketingLine[]
  payLater: boolean
  fee: { commission: number; aml: number; noSell: boolean }
  sections: Record<string, boolean>
  personalNote: string
  agreement: {
    include: boolean
    method: string
    periodDays: number
  }
}

const makeId = () => `p_${Math.random().toString(36).slice(2, 9)}`

function splitVendorNames(combined: string): string[] {
  const parts = combined
    .split(/\s*&\s*|\s+and\s+/i)
    .map((p) => p.trim())
    .filter(Boolean)
  if (parts.length <= 1) return parts.length ? [parts[0]] : []
  const last = parts[parts.length - 1]
  const lastWords = last.split(/\s+/)
  const surname = lastWords.length > 1 ? lastWords[lastWords.length - 1] : null
  return parts.map((p, i) => {
    if (i === parts.length - 1) return p
    if (surname && p.split(/\s+/).length === 1) return `${p} ${surname}`
    return p
  })
}

function displayVendorName(people: Person[]): string {
  return people.map((p) => p.name.trim()).filter(Boolean).join(' & ')
}

function greetingNames(people: Person[]): string {
  const names = people.map((p) => p.name.trim().split(/\s+/)[0]).filter(Boolean)
  if (names.length === 0) return 'there'
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1]
}

// Master market pool — everything the agent can pull into a CMA
export const marketPool: Comp[] = [
  // ── Sold (13) ────────────────────────────────────────────────────────────
  { id: 'mp_s01', kind: 'sold', address: '41 Wharparilla Drive',   suburb: 'Moama', postcode: '2731', price: 1_120_000, soldAgo: '6 days ago', soldDate: '20 Sep 2026', beds: 4, baths: 2, cars: 2, land: 780, type: 'House', dom: 12, distance: 0.4, yearBuilt: 2019, fromCMA: false, included: false },
  { id: 'mp_s02', kind: 'sold', address: '12 Chanter Street',      suburb: 'Moama', postcode: '2731', price:   985_000, soldAgo: '3 wks ago', soldDate: '05 Sep 2026', beds: 4, baths: 2, cars: 2, land: 720, type: 'House', dom: 21, distance: 0.8, yearBuilt: 2015, fromCMA: false, included: false },
  { id: 'mp_s03', kind: 'sold', address: '8 The Range Boulevard',  suburb: 'Moama', postcode: '2731', price: 1_275_000, soldAgo: '2 mo ago',  soldDate: '26 Jul 2026', beds: 4, baths: 2, cars: 3, land: 850, type: 'House', dom: 34, distance: 0.5, yearBuilt: 2021, fromCMA: false, included: false },
  { id: 'mp_s04', kind: 'sold', address: '66 Perricoota Road',     suburb: 'Moama', postcode: '2731', price:   915_000, soldAgo: '3 mo ago',  soldDate: '18 Jun 2026', beds: 4, baths: 2, cars: 2, land: 820, type: 'House', dom: 45, distance: 0.2, yearBuilt: 2011, fromCMA: false, included: false },
  { id: 'mp_s05', kind: 'sold', address: '22 Cadell Street',       suburb: 'Moama', postcode: '2731', price: 1_050_000, soldAgo: '4 mo ago',  soldDate: '02 Jun 2026', beds: 4, baths: 2, cars: 2, land: 700, type: 'House', dom: 18, distance: 1.2, yearBuilt: 2018, fromCMA: false, included: false },
  { id: 'mp_s06', kind: 'sold', address: '20 Mayflower Drive',     suburb: 'Moama', postcode: '2731', price:   730_000, soldAgo: '2 mo ago',  soldDate: '23 Jul 2026', beds: 4, baths: 2, cars: 2, land: 640, type: 'House', dom: 28, distance: 0.6, yearBuilt: 2018, fromCMA: false, included: false },
  { id: 'mp_s07', kind: 'sold', address: '15 Mayflower Drive',     suburb: 'Moama', postcode: '2731', price:   780_000, soldAgo: '6 mo ago',  soldDate: '24 Mar 2026', beds: 4, baths: 2, cars: 2, land: 682, type: 'House', dom: 27, distance: 0.7, yearBuilt: 2017, fromCMA: false, included: false },
  { id: 'mp_s08', kind: 'sold', address: '11 Wharparilla Drive',   suburb: 'Moama', postcode: '2731', price: 1_060_000, soldAgo: '5 wks ago', soldDate: '22 Aug 2026', beds: 4, baths: 2, cars: 2, land: 760, type: 'House', dom: 19, distance: 0.4, yearBuilt: 2020, fromCMA: false, included: false },
  { id: 'mp_s09', kind: 'sold', address: '5 Cadell Street',        suburb: 'Moama', postcode: '2731', price: 1_180_000, soldAgo: '7 wks ago', soldDate: '08 Aug 2026', beds: 5, baths: 3, cars: 2, land: 890, type: 'House', dom: 23, distance: 1.0, yearBuilt: 2022, fromCMA: false, included: false },
  { id: 'mp_s10', kind: 'sold', address: '18 Cobb Street',         suburb: 'Moama', postcode: '2731', price:   955_000, soldAgo: '3 mo ago',  soldDate: '25 Jun 2026', beds: 4, baths: 2, cars: 2, land: 715, type: 'House', dom: 31, distance: 0.9, yearBuilt: 2014, fromCMA: false, included: false },
  { id: 'mp_s11', kind: 'sold', address: '92 Meninya Street',      suburb: 'Moama', postcode: '2731', price: 1_020_000, soldAgo: '4 mo ago',  soldDate: '30 May 2026', beds: 4, baths: 2, cars: 3, land: 810, type: 'House', dom: 17, distance: 1.3, yearBuilt: 2016, fromCMA: false, included: false },
  { id: 'mp_s12', kind: 'sold', address: '2 Emmylou Place',        suburb: 'Moama', postcode: '2731', price:   735_000, soldAgo: '4 mo ago',  soldDate: '19 May 2026', beds: 4, baths: 2, cars: 2, land: 748, type: 'House', dom: 21, distance: 0.2, yearBuilt: 2013, fromCMA: false, included: false },
  { id: 'mp_s13', kind: 'sold', address: '20 Emerald Avenue',      suburb: 'Moama', postcode: '2731', price:   780_000, soldAgo: '10 mo ago', soldDate: '17 Nov 2025', beds: 4, baths: 2, cars: 2, land: 608, type: 'House', dom: 70, distance: 0.3, yearBuilt: 2010, fromCMA: false, included: false },

  // ── For sale (8) ─────────────────────────────────────────────────────────
  { id: 'mp_fs01', kind: 'for-sale', address: '11 Antrim Court',    suburb: 'Moama', postcode: '2731', price: 680_000, priceHigh: 710_000, soldAgo: 'listed 11d ago', listedDate: '15 Sep 2026', beds: 4, baths: 2, cars: 2, land: 712, type: 'House', dom: 11, distance: 0.5, yearBuilt: 2012, fromCMA: false, included: false },
  { id: 'mp_fs02', kind: 'for-sale', address: '9 Skye Avenue',       suburb: 'Moama', postcode: '2731', price: 715_000,                     soldAgo: 'listed 3d ago',  listedDate: '23 Sep 2026', beds: 4, baths: 2, cars: 2, land: 0,   type: 'House', dom: 3,  distance: 0.6, yearBuilt: 2016, fromCMA: false, included: false },
  { id: 'mp_fs03', kind: 'for-sale', address: '1 Morton Court',      suburb: 'Moama', postcode: '2731', price: 850_000, priceHigh: 870_000, soldAgo: 'listed 50d ago', listedDate: '07 Aug 2026', beds: 4, baths: 2, cars: 2, land: 777, type: 'House', dom: 50, distance: 0.7, yearBuilt: 2015, fromCMA: false, included: false },
  { id: 'mp_fs04', kind: 'for-sale', address: '17 Martin Street',    suburb: 'Moama', postcode: '2731', price: 530_000, priceHigh: 560_000, soldAgo: 'listed 37d ago', listedDate: '20 Aug 2026', beds: 4, baths: 2, cars: 2, land: 731, type: 'House', dom: 37, distance: 0.8, yearBuilt: 2008, fromCMA: false, included: false },
  { id: 'mp_fs05', kind: 'for-sale', address: '84 Perricoota Road',  suburb: 'Moama', postcode: '2731', price: 995_000,                     soldAgo: 'listed 22d ago', listedDate: '04 Sep 2026', beds: 4, baths: 2, cars: 2, land: 780, type: 'House', dom: 22, distance: 0.3, yearBuilt: 2017, fromCMA: false, included: false },
  { id: 'mp_fs06', kind: 'for-sale', address: '25 Riverina Drive',   suburb: 'Moama', postcode: '2731', price: 1_150_000,                   soldAgo: 'listed 8d ago',  listedDate: '18 Sep 2026', beds: 4, baths: 2, cars: 2, land: 820, type: 'House', dom: 8,  distance: 0.9, yearBuilt: 2020, fromCMA: false, included: false },
  { id: 'mp_fs07', kind: 'for-sale', address: '33 Reserve Court',    suburb: 'Moama', postcode: '2731', price: 890_000,                     soldAgo: 'listed 14d ago', listedDate: '12 Sep 2026', beds: 4, baths: 2, cars: 2, land: 700, type: 'House', dom: 14, distance: 1.1, yearBuilt: 2014, fromCMA: false, included: false },
  { id: 'mp_fs08', kind: 'for-sale', address: '6 The Range Boulevard', suburb: 'Moama', postcode: '2731', price: 1_320_000,                 soldAgo: 'listed 5d ago',  listedDate: '21 Sep 2026', beds: 5, baths: 3, cars: 3, land: 915, type: 'House', dom: 5,  distance: 0.5, yearBuilt: 2023, fromCMA: false, included: false },
]

// Which comps make up the existing CMA per appraisal
const cmaByAppraisal: Record<string, string[]> = {
  a1: ['mp_s01', 'mp_s02', 'mp_s03', 'mp_s04', 'mp_s05'],
  a2: ['mp_s06', 'mp_s07'],
  a4: ['mp_s10', 'mp_s11'],
  a6: ['mp_s04', 'mp_s05'],
}

const initial: State = {
  variant: 'full',
  property: {
    address: '16 Perricoota Road',
    suburb: 'Moama',
    postcode: '2731',
    beds: 4,
    baths: 2,
    cars: 2,
    land: 802,
    type: 'House',
  },
  vendor: {
    people: [
      { id: 'v1', name: 'Karen Whittaker', email: 'karenw@example.com', phone: '0412 448 902' },
      { id: 'v2', name: 'Steve Whittaker', email: '', phone: '' },
    ],
    sendIndividually: false,
  },
  comps: cmaByAppraisal.a1
    .map((id) => marketPool.find((m) => m.id === id))
    .filter((c): c is Comp => !!c)
    .map((c) => ({ ...c, fromCMA: true, included: true })),
  price: { low: 1_050_000, high: 1_150_000 },
  marketing: [
    { id: 'm1', label: 'realestate.com.au listing (Highlight)', category: 'Digital', amount: 1439, included: true },
    { id: 'm2', label: 'Domain listing (Gold)',                  category: 'Digital', amount:  110, included: true },
    { id: 'm3', label: 'Professional photography',               category: 'Media',   amount:  850, included: true },
    { id: 'm4', label: 'Drone & walk-through video',             category: 'Media',   amount:  395, included: true },
    { id: 'm5', label: 'Meta ads (Facebook + Instagram)',        category: 'Digital', amount:  499, included: true },
    { id: 'm6', label: 'Signboard (QR-enabled)',                 category: 'Print',   amount:  250, included: true },
    { id: 'm7', label: 'Premium brochures',                      category: 'Print',   amount:   75, included: true },
    { id: 'm8', label: 'Riverine Herald — double ad',            category: 'Print',   amount:  140, included: true },
    { id: 'm9', label: 'Floorplan',                              category: 'Media',   amount:   49, included: true },
  ],
  payLater: false,
  fee: { commission: 2.3, aml: 250, noSell: true },
  sections: {
    Greeting: true,
    'Recent local sales': true,
    'What\'s currently for sale': true,
    'Your home against the market': true,
    'Tailored print strategy': true,
    'Why us': true,
    'Marketing investment': true,
    'Our fee': true,
    'Your sales team': true,
    'What clients say': true,
  },
  personalNote:
    "Karen and Steve — great to meet you both on Saturday. Here's what we discussed, with recent sales around you so you can see how we've landed on our number. Any questions, call me any time.",
  agreement: {
    include: true,
    method: 'Auction',
    periodDays: 90,
  },
}

// ─── Helpers ─────────────────────────────────────────────────────────────

export const formatMoney = (n: number) =>
  n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 })

const formatShort = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 2).replace(/\.?0+$/, '')}M`
    : `$${Math.round(n / 1000)}K`

// ─── Recent appraisals (upstream of a proposal) ──────────────────────────

type Appraisal = {
  id: string
  address: string
  suburb: string
  postcode: string
  beds: number
  baths: number
  cars: number
  land: number
  type: string
  vendor: string
  vendorEmail?: string
  vendorPhone?: string
  low: number
  high: number
  appraisedAgo: string
  status: 'no-proposal' | 'proposal-sent'
  hasCMA: boolean
}

const recentAppraisals: Appraisal[] = [
  {
    id: 'a1', address: '16 Perricoota Road', suburb: 'Moama', postcode: '2731',
    beds: 4, baths: 2, cars: 2, land: 802, type: 'House',
    vendor: 'Karen & Steve Whittaker', vendorEmail: 'karenw@example.com', vendorPhone: '0412 448 902',
    low: 1_050_000, high: 1_150_000, appraisedAgo: 'Yesterday', status: 'no-proposal', hasCMA: true,
  },
  {
    id: 'a2', address: '7 Nyeoma Court', suburb: 'Echuca', postcode: '3564',
    beds: 3, baths: 2, cars: 2, land: 615, type: 'House',
    vendor: 'Julie Deacon', vendorEmail: 'juliedeacon@example.com', vendorPhone: '0417 220 561',
    low: 780_000, high: 820_000, appraisedAgo: '2 days ago', status: 'no-proposal', hasCMA: true,
  },
  {
    id: 'a3', address: '33 Mundarra Way', suburb: 'Moama', postcode: '2731',
    beds: 5, baths: 3, cars: 3, land: 1120, type: 'House',
    vendor: 'Whitcombe family', vendorPhone: '0403 918 774',
    low: 1_400_000, high: 1_550_000, appraisedAgo: '4 days ago', status: 'no-proposal', hasCMA: false,
  },
  {
    id: 'a4', address: '12 Boston Avenue', suburb: 'Echuca', postcode: '3564',
    beds: 3, baths: 1, cars: 1, land: 528, type: 'House',
    vendor: 'Peter Rowley', vendorPhone: '0429 118 004',
    low: 650_000, high: 695_000, appraisedAgo: '1 wk ago', status: 'proposal-sent', hasCMA: true,
  },
  {
    id: 'a5', address: '88 Ogilvie Avenue', suburb: 'Echuca', postcode: '3564',
    beds: 4, baths: 2, cars: 2, land: 720, type: 'House',
    vendor: 'Nikki Bramley', vendorEmail: 'nikkib@example.com',
    low: 890_000, high: 950_000, appraisedAgo: '2 wks ago', status: 'no-proposal', hasCMA: false,
  },
  {
    id: 'a6', address: '4 Simpson Street', suburb: 'Moama', postcode: '2731',
    beds: 4, baths: 2, cars: 2, land: 690, type: 'House',
    vendor: 'Jason & Kim Locke', vendorPhone: '0402 776 331',
    low: 920_000, high: 980_000, appraisedAgo: '3 wks ago', status: 'proposal-sent', hasCMA: true,
  },
]

// ─── Steps definition ────────────────────────────────────────────────────

type StepKey =
  | 'variant'
  | 'property'
  | 'vendor'
  | 'comps'
  | 'marketing'
  | 'fee'
  | 'review'

const stepConfig: { key: StepKey; label: string; icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }> }[] = [
  { key: 'variant',   label: 'Type',        icon: FileText },
  { key: 'property',  label: 'Property',    icon: Home },
  { key: 'vendor',    label: 'Vendor',      icon: Users },
  { key: 'comps',     label: 'Market',      icon: Gauge },
  { key: 'marketing', label: 'Marketing',   icon: Megaphone },
  { key: 'fee',       label: 'Fee',         icon: Percent },
  { key: 'review',    label: 'Review',      icon: Send },
]

// ─── Component ───────────────────────────────────────────────────────────

export default function NewProposalWizard({ onClose }: { onClose: () => void }) {
  const [state, setState] = useState<State>(initial)
  const [stepIdx, setStepIdx] = useState(0)
  const [previewChannel, setPreviewChannel] = useState<null | 'email' | 'sms' | 'link'>(null)

  const activeSteps = useMemo<StepKey[]>(() => {
    if (state.variant === 'price-update') {
      return ['variant', 'property', 'vendor', 'comps', 'review']
    }
    return stepConfig.map((s) => s.key)
  }, [state.variant])

  const step = activeSteps[stepIdx]
  const idxOf = (k: StepKey) => activeSteps.indexOf(k)

  const canBack = stepIdx > 0
  const canNext = stepIdx < activeSteps.length - 1

  const marketingSubtotal = state.marketing.filter((m) => m.included).reduce((s, m) => s + m.amount, 0)
  const marketingTotal = state.payLater ? Math.round(marketingSubtotal * 1.0765) : marketingSubtotal

  return (
    <div
      className="fixed inset-0 z-50 flex bg-black/25 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative m-auto flex h-[calc(100vh-2rem)] w-full max-w-[1080px] overflow-hidden rounded-[20px] bg-canvas shadow-[var(--shadow-pop)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close proposal wizard"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-surface text-ink-muted shadow-[0_1px_2px_rgba(16,24,40,0.08)] ring-1 ring-hairline transition hover:bg-canvas hover:text-ink"
        >
          <X size={16} strokeWidth={2} />
        </button>
        {/* Progress rail */}
        <aside className="w-[220px] shrink-0 border-r border-hairline bg-surface/80 px-5 py-6">
          <div className="mb-6">
            <div className="text-[10.5px] font-medium uppercase tracking-widest text-ink-faint">New proposal</div>
            <div className="mt-1 text-[15px] font-semibold">
              {state.property.address || 'Untitled proposal'}
            </div>
            <div className="text-[12px] text-ink-muted">
              {state.property.suburb} · {state.variant === 'price-update' ? 'Price update' : 'Full listing pitch'}
            </div>
          </div>

          <ol className="space-y-1">
            {stepConfig.map((s) => {
              const active = s.key === step
              const included = activeSteps.includes(s.key)
              const done = included && idxOf(s.key) < stepIdx
              const Icon = s.icon
              return (
                <li key={s.key}>
                  <button
                    disabled={!included}
                    onClick={() => included && setStepIdx(idxOf(s.key))}
                    className={
                      'flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left text-[13px] transition ' +
                      (active
                        ? 'bg-white text-ink shadow-[0_1px_2px_rgba(16,24,40,0.06)]'
                        : included
                        ? 'text-ink-muted hover:bg-white/70 hover:text-ink'
                        : 'text-ink-faint line-through opacity-60')
                    }
                  >
                    <span
                      className={
                        'flex h-6 w-6 items-center justify-center rounded-full ' +
                        (done
                          ? 'bg-success text-white'
                          : active
                          ? 'bg-accent text-white'
                          : 'bg-black/[0.06] text-ink-muted')
                      }
                    >
                      {done ? <Check size={12} strokeWidth={3} /> : <Icon size={12} strokeWidth={2} />}
                    </span>
                    <span className="flex-1">{s.label}</span>
                    {!included && <span className="text-[10.5px] uppercase tracking-wider">skip</span>}
                  </button>
                </li>
              )
            })}
          </ol>

          <button
            onClick={onClose}
            className="mt-8 flex w-full items-center gap-2 rounded-[10px] px-2.5 py-2 text-[12px] text-ink-muted hover:bg-white/70"
          >
            <X size={14} />
            Save & close
          </button>
        </aside>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1 overflow-y-auto px-10 py-8">
            {step === 'variant' && <VariantStep state={state} setState={setState} />}
            {step === 'property' && <PropertyStep state={state} setState={setState} />}
            {step === 'vendor' && <VendorStep state={state} setState={setState} />}
            {step === 'comps' && <CompsStep state={state} setState={setState} />}
            {step === 'marketing' && <MarketingStep state={state} setState={setState} marketingTotal={marketingTotal} marketingSubtotal={marketingSubtotal} />}
            {step === 'fee' && <FeeStep state={state} setState={setState} />}
            {step === 'review' && <ReviewStep state={state} setState={setState} marketingTotal={marketingTotal} onPreview={setPreviewChannel} />}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-hairline bg-surface px-10 py-4">
            <button
              disabled={!canBack}
              onClick={() => setStepIdx((i) => i - 1)}
              className={
                'inline-flex items-center gap-1.5 rounded-[10px] px-3 py-2 text-[13px] font-medium ' +
                (canBack ? 'text-ink-muted hover:bg-canvas' : 'text-ink-faint opacity-50')
              }
            >
              <ArrowLeft size={14} />
              Back
            </button>
            <div className="text-[12px] text-ink-faint">
              Step {stepIdx + 1} of {activeSteps.length}
            </div>
            {canNext ? (
              <button
                onClick={() => setStepIdx((i) => i + 1)}
                className="inline-flex items-center gap-1.5 rounded-[10px] bg-accent px-4 py-2 text-[13px] font-medium text-white shadow-[0_1px_2px_rgba(0,87,255,0.35)] hover:brightness-105"
              >
                Continue
                <ArrowRight size={14} />
              </button>
            ) : (
              <button
                onClick={() => setPreviewChannel('email')}
                className="inline-flex items-center gap-1.5 rounded-[10px] bg-accent px-4 py-2 text-[13px] font-medium text-white shadow-[0_1px_2px_rgba(0,87,255,0.35)] hover:brightness-105"
              >
                <Send size={14} />
                Preview & send
              </button>
            )}
          </div>
        </div>
      </div>

      {previewChannel && (
        <SendPreview
          channel={previewChannel}
          onClose={() => setPreviewChannel(null)}
          onSend={() => { setPreviewChannel(null); onClose() }}
          people={state.vendor.people}
          sendIndividually={state.vendor.sendIndividually}
          personalNote={state.personalNote}
          property={{
            address: state.property.address,
            suburb: state.property.suburb,
            postcode: state.property.postcode,
            beds: state.property.beds,
            baths: state.property.baths,
            cars: state.property.cars,
            land: state.property.land,
          }}
          price={state.price}
          variant={state.variant}
          agreement={state.agreement}
          feeCommission={state.fee.commission}
          feeAml={state.fee.aml}
          marketingTotal={marketingTotal}
          payLater={state.payLater}
        />
      )}
    </div>
  )
}

// ─── Steps ───────────────────────────────────────────────────────────────

function StepHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="mb-6 max-w-2xl">
      <div className="text-[11px] font-medium uppercase tracking-widest text-ink-faint">{eyebrow}</div>
      <h2 className="mt-1 text-[26px] font-semibold leading-tight tracking-tight">{title}</h2>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-muted">{subtitle}</p>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[12.5px] font-medium text-ink">{label}</span>
        {hint && <span className="text-[11.5px] text-ink-faint">{hint}</span>}
      </div>
      {children}
    </label>
  )
}

const inputCls =
  'w-full rounded-[10px] border border-hairline bg-surface px-3 py-2 text-[13.5px] outline-none transition focus:border-accent focus:ring-2 focus:ring-accent-soft'

// ── Variant

function VariantStep({ state, setState }: { state: State; setState: (s: State) => void }) {
  const opts: { key: Variant; title: string; body: string; badge?: string; sections: number }[] = [
    {
      key: 'full',
      title: 'Full listing pitch',
      body: 'The complete pack — recent sales, market context, positioning, marketing plan, fee, team and testimonials. Use for a first meeting or when winning the listing.',
      badge: 'Most common',
      sections: 11,
    },
    {
      key: 'price-update',
      title: 'Price update',
      body: 'CMA-only. Recent sales, current market and your home\'s position — no marketing, fee, team or testimonials. Use to reset expectations mid-campaign or after a market shift.',
      sections: 4,
    },
  ]
  return (
    <>
      <StepHeader
        eyebrow="Start"
        title="What kind of proposal is this?"
        subtitle="Choose the shape. You can turn individual sections on or off later in Review."
      />
      <div className="grid gap-3 max-w-2xl">
        {opts.map((o) => {
          const active = state.variant === o.key
          return (
            <button
              key={o.key}
              onClick={() => setState({ ...state, variant: o.key })}
              className={
                'flex items-start gap-4 rounded-[16px] border p-5 text-left transition ' +
                (active
                  ? 'border-accent bg-accent-tint shadow-[var(--shadow-card)]'
                  : 'border-hairline bg-surface hover:border-ink-faint/50')
              }
            >
              <div
                className={
                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ' +
                  (active ? 'border-accent bg-accent' : 'border-hairline')
                }
              >
                {active && <div className="h-2 w-2 rounded-full bg-white" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-semibold">{o.title}</span>
                  {o.badge && (
                    <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] font-medium text-accent">
                      {o.badge}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-muted">{o.body}</p>
                <div className="mt-2 text-[11.5px] text-ink-faint">{o.sections} sections</div>
              </div>
            </button>
          )
        })}
      </div>
    </>
  )
}

// ── Property

function Stepper({ value, onChange, min = 0, max = 12 }: { value: number; onChange: (n: number) => void; min?: number; max?: number }) {
  return (
    <div className="flex w-full items-center justify-between rounded-[10px] border border-hairline bg-surface p-1">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="flex h-8 w-8 items-center justify-center rounded-[7px] text-[17px] font-medium text-ink-muted transition hover:bg-canvas disabled:opacity-30"
        aria-label="Decrease"
      >
        −
      </button>
      <div className="text-[15px] font-semibold tabular-nums">{value}</div>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="flex h-8 w-8 items-center justify-center rounded-[7px] text-[17px] font-medium text-ink-muted transition hover:bg-canvas disabled:opacity-30"
        aria-label="Increase"
      >
        +
      </button>
    </div>
  )
}

function AppraisalCard({ a, active, onClick }: { a: Appraisal; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={
        'group relative flex w-[220px] shrink-0 flex-col rounded-[14px] border p-3.5 text-left transition ' +
        (active
          ? 'border-accent bg-accent-tint shadow-[var(--shadow-card)]'
          : 'border-hairline bg-surface hover:border-ink-faint/50 hover:shadow-[var(--shadow-card)]')
      }
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-[10.5px] font-medium uppercase tracking-wider text-ink-faint">
          {a.appraisedAgo}
        </div>
        <div className="flex items-center gap-1">
          {!a.hasCMA && (
            <span className="rounded-full bg-warn-soft px-1.5 py-0.5 text-[9.5px] font-medium uppercase tracking-wider text-warn">
              No CMA
            </span>
          )}
          {a.status === 'proposal-sent' && (
            <span className="rounded-full bg-black/[0.05] px-1.5 py-0.5 text-[9.5px] font-medium uppercase tracking-wider text-ink-muted">
              Sent
            </span>
          )}
          {active && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-accent text-white">
              <Check size={10} strokeWidth={3} />
            </span>
          )}
        </div>
      </div>
      <div className="mt-1.5 truncate text-[13.5px] font-semibold">{a.address}</div>
      <div className="truncate text-[11.5px] text-ink-muted">{a.suburb} · {a.vendor}</div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className={'text-[13px] font-semibold tracking-tight ' + (a.hasCMA ? 'text-accent' : 'text-ink-muted')}>
          {formatShort(a.low)}–{formatShort(a.high)}
        </span>
        {!a.hasCMA && <span className="text-[10px] text-ink-faint">verbal</span>}
      </div>
      <div className="mt-1 text-[10.5px] text-ink-faint">{a.beds}bd · {a.baths}ba · {a.cars}car · {a.land}sqm</div>
    </button>
  )
}

function PropertyStep({ state, setState }: { state: State; setState: (s: State) => void }) {
  const p = state.property
  const set = (patch: Partial<State['property']>) => setState({ ...state, property: { ...p, ...patch } })

  const linkedAppraisal = recentAppraisals.find(
    (a) => a.address === p.address && a.suburb === p.suburb,
  )
  const activeAppraisalId = linkedAppraisal?.id

  const divergedFields = linkedAppraisal
    ? ([
        p.beds !== linkedAppraisal.beds ? { label: 'Beds', from: linkedAppraisal.beds, to: p.beds } : null,
        p.baths !== linkedAppraisal.baths ? { label: 'Baths', from: linkedAppraisal.baths, to: p.baths } : null,
        p.cars !== linkedAppraisal.cars ? { label: 'Car', from: linkedAppraisal.cars, to: p.cars } : null,
        p.land !== linkedAppraisal.land ? { label: 'Land', from: `${linkedAppraisal.land}sqm`, to: `${p.land}sqm` } : null,
        p.type !== linkedAppraisal.type ? { label: 'Type', from: linkedAppraisal.type, to: p.type } : null,
        p.postcode !== linkedAppraisal.postcode ? { label: 'Postcode', from: linkedAppraisal.postcode, to: p.postcode } : null,
      ].filter(Boolean) as { label: string; from: string | number; to: string | number }[])
    : []

  const divergeKey = divergedFields.map((d) => `${d.label}=${d.to}`).join('|')
  const [dismissedKey, setDismissedKey] = useState<string>('')
  const showDivergeWarning = divergedFields.length > 0 && dismissedKey !== divergeKey

  const toggleAppraisal = (a: Appraisal) => {
    if (a.id === activeAppraisalId) {
      setState({
        ...state,
        property: { address: '', suburb: '', postcode: '', beds: 0, baths: 0, cars: 0, land: 0, type: 'House' },
        vendor: {
          people: [{ id: makeId(), name: '', email: '', phone: '' }],
          sendIndividually: false,
        },
        comps: [],
        price: { low: 0, high: 0 },
      })
      return
    }
    const names = splitVendorNames(a.vendor)
    const people: Person[] = names.length
      ? names.map((n, i) => ({
          id: makeId(),
          name: n,
          email: i === 0 ? a.vendorEmail ?? '' : '',
          phone: i === 0 ? a.vendorPhone ?? '' : '',
        }))
      : [{ id: makeId(), name: a.vendor, email: a.vendorEmail ?? '', phone: a.vendorPhone ?? '' }]

    // Seed CMA comps if the appraisal has one; otherwise clear so Market shows the empty state
    const seededIds = a.hasCMA ? cmaByAppraisal[a.id] ?? [] : []
    const seededComps: Comp[] = seededIds
      .map((id) => marketPool.find((m) => m.id === id))
      .filter((c): c is Comp => !!c)
      .map((c) => ({ ...c, fromCMA: true, included: true }))

    setState({
      ...state,
      property: {
        address: a.address, suburb: a.suburb, postcode: a.postcode,
        beds: a.beds, baths: a.baths, cars: a.cars, land: a.land, type: a.type,
      },
      vendor: { people, sendIndividually: state.vendor.sendIndividually },
      comps: seededComps,
      price: { low: a.low, high: a.high },
    })
  }

  return (
    <>
      <StepHeader
        eyebrow="Property"
        title="Which property is this proposal for?"
        subtitle="Pick a recent appraisal to auto-fill, or enter a new address below."
      />

      {/* Recent appraisals carousel */}
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[12px] font-medium text-ink">
            <ClipboardCheck size={13} className="text-accent" />
            Recent appraisals
          </div>
          <button className="text-[11.5px] text-ink-muted hover:text-ink">View all</button>
        </div>
        <div className="-mx-10 overflow-x-auto pb-2 px-10 [scrollbar-width:thin]">
          <div className="flex gap-2.5">
            {recentAppraisals.map((a) => (
              <AppraisalCard
                key={a.id}
                a={a}
                active={a.id === activeAppraisalId}
                onClick={() => toggleAppraisal(a)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-2xl space-y-4">
        <Field label="Street address" hint="Start typing — we'll match a listing">
          <div className="relative">
            <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input value={p.address} onChange={(e) => set({ address: e.target.value })} className={inputCls + ' pl-9'} />
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Suburb"><input value={p.suburb} onChange={(e) => set({ suburb: e.target.value })} className={inputCls} /></Field>
          <Field label="Postcode"><input value={p.postcode} onChange={(e) => set({ postcode: e.target.value })} className={inputCls} /></Field>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <Field label="Beds"><Stepper value={p.beds} onChange={(n) => set({ beds: n })} /></Field>
          <Field label="Baths"><Stepper value={p.baths} onChange={(n) => set({ baths: n })} /></Field>
          <Field label="Car"><Stepper value={p.cars} onChange={(n) => set({ cars: n })} /></Field>
          <Field label="Land (sqm)">
            <input
              type="text"
              inputMode="numeric"
              value={p.land || ''}
              onChange={(e) => set({ land: parseInt(e.target.value.replace(/[^\d]/g, '')) || 0 })}
              className={inputCls}
            />
          </Field>
        </div>

        {showDivergeWarning && (
          <div className="flex items-start gap-3 rounded-[14px] border border-warn/30 bg-warn-soft p-3.5">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warn" strokeWidth={2} />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-ink">
                This differs from the appraisal for {linkedAppraisal?.vendor}
              </div>
              <div className="mt-0.5 text-[12px] leading-relaxed text-ink-muted">
                {divergedFields.map((d) => `${d.label} ${d.from} → ${d.to}`).join(' · ')}
              </div>
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  onClick={() => setDismissedKey(divergeKey)}
                  className="inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1 text-[11.5px] font-medium text-white hover:brightness-110"
                >
                  Update the property record
                </button>
                <button
                  onClick={() => setDismissedKey(divergeKey)}
                  className="text-[11.5px] font-medium text-ink-muted hover:text-ink"
                >
                  Just for this proposal
                </button>
              </div>
            </div>
            <button
              onClick={() => setDismissedKey(divergeKey)}
              className="shrink-0 text-ink-faint hover:text-ink-muted"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        )}
        <Field label="Property type">
          <div className="flex flex-wrap gap-2">
            {['House', 'Townhouse', 'Unit', 'Land', 'Acreage'].map((t) => {
              const active = t === p.type
              return (
                <button
                  key={t}
                  onClick={() => set({ type: t })}
                  className={
                    'rounded-full px-3 py-1.5 text-[12.5px] font-medium ' +
                    (active ? 'bg-accent text-white' : 'bg-black/[0.04] text-ink-muted hover:bg-black/[0.07]')
                  }
                >
                  {t}
                </button>
              )
            })}
          </div>
        </Field>
      </div>
    </>
  )
}

// ── Vendor

function polishNote(input: string, people: Person[], sendIndividually: boolean): string {
  const g = sendIndividually
    ? '{first name}'
    : greetingNames(people)
  const trimmed = input.trim().replace(/\s+/g, ' ')
  const both = people.length > 1 && !sendIndividually ? ' you both' : ' you'
  if (!trimmed) {
    return `Hi ${g} — thanks for making the time on Saturday. I've pulled together the recent sales around${both} so you can see exactly how we've landed on our number, along with a straightforward plan to take you to market. Any questions at all, call me any time.`
  }
  const looksCasual = /\b(hey|hi|yo)\b/i.test(trimmed) || trimmed.length < 80
  if (looksCasual) {
    return `Hi ${g} — really appreciated the time on Saturday. I've put together the recent sales around${both} so you can see how we've landed on our number, and mapped out a clear plan for what a campaign would look like. No pressure — read through in your own time, and give me a call whenever suits.`
  }
  return `Hi ${g} — thank you for having me out on Saturday, it was great to sit down with${both}. I've pulled together the recent sales around${both} so you can see exactly how we've landed on our number, along with a clear, step-by-step plan for taking your home to market. There's no rush — take your time reading through, and call me any time with questions.`
}

function VendorStep({ state, setState }: { state: State; setState: (s: State) => void }) {
  const v = state.vendor
  const setVendor = (patch: Partial<State['vendor']>) => setState({ ...state, vendor: { ...v, ...patch } })
  const setPeople = (people: Person[]) => setVendor({ people })

  const [polishing, setPolishing] = useState(false)
  const [previousNote, setPreviousNote] = useState<string | null>(null)

  const linkedAppraisal = recentAppraisals.find(
    (a) => a.address === state.property.address && a.suburb === state.property.suburb,
  )
  const appraisalNames = linkedAppraisal ? splitVendorNames(linkedAppraisal.vendor) : []
  const [clearedFromAppraisal, setClearedFromAppraisal] = useState<string | null>(null)

  const updatePerson = (id: string, patch: Partial<Person>) => {
    const before = v.people.find((p) => p.id === id)
    setPeople(v.people.map((p) => (p.id === id ? { ...p, ...patch } : p)))
    if (
      before &&
      patch.name !== undefined &&
      patch.name.trim() === '' &&
      before.name.trim() !== '' &&
      appraisalNames.some((n) => n.toLowerCase() === before.name.trim().toLowerCase())
    ) {
      setClearedFromAppraisal(before.name.trim())
    }
  }

  const addPerson = () => setPeople([...v.people, { id: makeId(), name: '', email: '', phone: '' }])

  const removePerson = (id: string) => {
    const removed = v.people.find((p) => p.id === id)
    const next = v.people.filter((p) => p.id !== id)
    setPeople(next.length ? next : [{ id: makeId(), name: '', email: '', phone: '' }])
    if (
      removed &&
      removed.name.trim() &&
      appraisalNames.some((n) => n.toLowerCase() === removed.name.trim().toLowerCase())
    ) {
      setClearedFromAppraisal(removed.name.trim())
    }
  }

  const restoreVendor = () => {
    if (!clearedFromAppraisal) return
    const already = v.people.some(
      (p) => p.name.trim().toLowerCase() === clearedFromAppraisal.toLowerCase(),
    )
    if (!already) {
      const emptyIdx = v.people.findIndex((p) => !p.name.trim())
      if (emptyIdx >= 0) {
        setPeople(v.people.map((p, i) => (i === emptyIdx ? { ...p, name: clearedFromAppraisal } : p)))
      } else {
        setPeople([...v.people, { id: makeId(), name: clearedFromAppraisal, email: '', phone: '' }])
      }
    }
    setClearedFromAppraisal(null)
  }

  const runPolish = () => {
    setPolishing(true)
    const before = state.personalNote
    setTimeout(() => {
      setPreviousNote(before)
      setState({ ...state, personalNote: polishNote(before, v.people, v.sendIndividually) })
      setPolishing(false)
    }, 700)
  }
  const undoPolish = () => {
    if (previousNote === null) return
    setState({ ...state, personalNote: previousNote })
    setPreviousNote(null)
  }

  const hasMultiple = v.people.length > 1
  const filledEmails = v.people.filter((p) => p.email.trim()).length

  return (
    <>
      <StepHeader
        eyebrow="Vendor"
        title="Who's the proposal for?"
        subtitle="Add each decision-maker as their own person. Choose to send as one combined proposal, or personalised to each individually."
      />
      <div className="max-w-xl space-y-3">
        {v.people.map((p, i) => (
          <div key={p.id} className="rounded-[14px] border border-hairline bg-surface p-3.5">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-canvas text-[10.5px] font-medium text-ink-muted">
                {i + 1}
              </span>
              <input
                value={p.name}
                onChange={(e) => updatePerson(p.id, { name: e.target.value })}
                placeholder={i === 0 ? 'Full name (e.g. Karen Whittaker)' : 'Full name'}
                className="flex-1 rounded-[8px] border border-transparent bg-transparent px-2 py-1.5 text-[14px] font-semibold outline-none transition focus:border-hairline focus:bg-canvas"
              />
              {v.people.length > 1 && (
                <button
                  onClick={() => removePerson(p.id)}
                  className="rounded-full p-1 text-ink-faint hover:bg-canvas hover:text-ink"
                  aria-label="Remove person"
                >
                  <X size={13} />
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <Mail size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input
                  value={p.email}
                  onChange={(e) => updatePerson(p.id, { email: e.target.value })}
                  placeholder="Email"
                  className="w-full rounded-[8px] border border-hairline bg-surface pl-7 pr-2 py-1.5 text-[12.5px] outline-none focus:border-accent"
                />
              </div>
              <input
                value={p.phone}
                onChange={(e) => updatePerson(p.id, { phone: e.target.value })}
                placeholder="Phone"
                className="w-full rounded-[8px] border border-hairline bg-surface px-2.5 py-1.5 text-[12.5px] outline-none focus:border-accent"
              />
            </div>
          </div>
        ))}

        <button
          onClick={addPerson}
          className="flex w-full items-center justify-center gap-1.5 rounded-[12px] border border-dashed border-hairline bg-surface/60 py-2.5 text-[12.5px] font-medium text-ink-muted hover:border-accent hover:text-accent"
        >
          <UserPlus size={13} strokeWidth={2} />
          Add another person
        </button>

        {clearedFromAppraisal && (
          <div className="flex items-start gap-3 rounded-[14px] border border-warn/30 bg-warn-soft p-3.5">
            <UserMinus size={16} className="mt-0.5 shrink-0 text-warn" strokeWidth={2} />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-semibold text-ink">
                Is {clearedFromAppraisal} not the vendor?
              </div>
              <div className="mt-0.5 text-[12px] leading-relaxed text-ink-muted">
                We had them on the appraisal for {linkedAppraisal?.address}, {linkedAppraisal?.suburb}. Tell us so the property record stays accurate.
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setClearedFromAppraisal(null)}
                  className="inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1 text-[11.5px] font-medium text-white hover:brightness-110"
                >
                  Confirm — not the vendor
                </button>
                <button
                  onClick={restoreVendor}
                  className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1 text-[11.5px] font-medium text-ink shadow-[0_1px_2px_rgba(16,24,40,0.05)] ring-1 ring-hairline hover:bg-canvas"
                >
                  Restore {clearedFromAppraisal.split(/\s+/)[0]}
                </button>
                <button
                  onClick={() => setClearedFromAppraisal(null)}
                  className="text-[11.5px] font-medium text-ink-muted hover:text-ink"
                >
                  Skip
                </button>
              </div>
            </div>
          </div>
        )}

        {hasMultiple && (
          <div className="rounded-[14px] border border-hairline bg-surface p-3.5">
            <div className="mb-2 flex items-baseline justify-between">
              <div className="text-[12px] font-semibold">Delivery</div>
              <div className="text-[11px] text-ink-faint">
                {filledEmails}/{v.people.length} emails filled
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: false, label: 'One combined proposal', body: 'Both names in greeting — one link' },
                { key: true,  label: 'Send individually',      body: 'Each person gets their own copy' },
              ].map((o) => {
                const active = v.sendIndividually === o.key
                return (
                  <button
                    key={String(o.key)}
                    onClick={() => setVendor({ sendIndividually: o.key })}
                    className={
                      'rounded-[12px] border p-3 text-left transition ' +
                      (active ? 'border-accent bg-accent-tint' : 'border-hairline bg-surface hover:border-ink-faint/50')
                    }
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-semibold">{o.label}</span>
                      {active && <Check size={13} className="text-accent" strokeWidth={3} />}
                    </div>
                    <div className="mt-0.5 text-[11.5px] text-ink-muted">{o.body}</div>
                  </button>
                )
              })}
            </div>
            {v.sendIndividually && (
              <div className="mt-2 flex items-start gap-1.5 rounded-[10px] bg-accent-tint/60 px-2.5 py-2 text-[11.5px] text-ink-muted">
                <Info size={12} className="mt-0.5 shrink-0 text-accent" />
                <span>Each recipient sees their own first name in the greeting. Opens & views tracked per person on the pipeline board.</span>
              </div>
            )}
          </div>
        )}

        <Field label="Personal note in the greeting" hint="Optional — appears above the sales data">
          <div className="relative">
            <textarea
              value={state.personalNote}
              onChange={(e) => {
                setState({ ...state, personalNote: e.target.value })
                if (previousNote !== null) setPreviousNote(null)
              }}
              rows={5}
              className={inputCls + ' resize-none leading-relaxed pb-11'}
            />
            <div className="absolute bottom-2 right-2 flex items-center gap-1.5">
              {previousNote !== null && !polishing && (
                <button
                  onClick={undoPolish}
                  className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11.5px] font-medium text-ink-muted shadow-[0_1px_2px_rgba(16,24,40,0.06)] ring-1 ring-hairline hover:text-ink"
                >
                  <Undo2 size={11} />
                  Undo
                </button>
              )}
              <button
                onClick={runPolish}
                disabled={polishing}
                className={
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-medium transition ' +
                  (polishing
                    ? 'bg-accent-soft text-accent'
                    : 'bg-gradient-to-r from-accent to-[#4a7bff] text-white shadow-[0_1px_2px_rgba(0,87,255,0.35)] hover:brightness-105')
                }
              >
                {polishing ? (
                  <>
                    <Loader2 size={11} className="animate-spin" />
                    Polishing…
                  </>
                ) : (
                  <>
                    <Sparkles size={11} />
                    Polish with AI
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="mt-1 text-[11px] text-ink-faint">
            {v.sendIndividually
              ? '“{first name}” will be swapped in for each recipient on send.'
              : 'Uses your voice + past pitches. Nothing is sent until you hit Send.'}
          </div>
        </Field>
      </div>
    </>
  )
}

// ── Comps

export function PhotoTile({ seed, size = 'md' }: { seed: string; size?: 'md' | 'lg' }) {
  const palettes = [
    'from-orange-100 to-amber-200',
    'from-sky-100 to-blue-200',
    'from-emerald-100 to-teal-200',
    'from-rose-100 to-pink-200',
    'from-violet-100 to-purple-200',
    'from-stone-100 to-stone-200',
  ]
  const idx = [...seed].reduce((a, c) => a + c.charCodeAt(0), 0) % palettes.length
  const dims = size === 'lg' ? 'h-24 w-32' : 'h-[76px] w-[100px]'
  return (
    <div className={`shrink-0 rounded-[10px] bg-gradient-to-br ${palettes[idx]} flex items-center justify-center ${dims}`}>
      <Home size={22} className="text-white/70" strokeWidth={1.5} />
    </div>
  )
}

function PriceBubble({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  const display = value ? '$' + value.toLocaleString('en-AU') : ''
  return (
    <div className="flex-1">
      <div className="mb-1.5 text-center text-[10.5px] font-medium uppercase tracking-widest text-ink-faint">{label}</div>
      <input
        type="text"
        inputMode="numeric"
        value={display}
        placeholder="$0"
        onChange={(e) => onChange(parseInt(e.target.value.replace(/[^\d]/g, '')) || 0)}
        className="w-full rounded-full border border-hairline bg-white px-6 py-3.5 text-center text-[22px] font-semibold tracking-tight tabular-nums shadow-[var(--shadow-card)] outline-none transition focus:border-accent focus:ring-4 focus:ring-accent-soft"
      />
    </div>
  )
}

function CompsStep({ state, setState }: { state: State; setState: (s: State) => void }) {
  const toggle = (id: string) =>
    setState({
      ...state,
      comps: state.comps.map((c) => (c.id === id ? { ...c, included: !c.included } : c)),
    })
  const included = state.comps.filter((c) => c.included)
  const soldIncluded = included.filter((c) => c.kind === 'sold')
  const forSaleIncluded = included.filter((c) => c.kind === 'for-sale')
  const avg = soldIncluded.length ? Math.round(soldIncluded.reduce((s, c) => s + c.price, 0) / soldIncluded.length) : 0

  const rangePct = state.price.low > 0 ? ((state.price.high - state.price.low) / state.price.low) * 100 : 0
  const wide = rangePct > 10

  const [builderOpen, setBuilderOpen] = useState<false | 'select' | 'analyse'>(false)
  const linkedAddress = state.property.address ? `${state.property.address}, ${state.property.suburb}` : 'this property'

  const openBuilder = (at: 'select' | 'analyse' = 'select') => setBuilderOpen(at)
  const closeBuilder = () => setBuilderOpen(false)
  const handleSaveCMA = (comps: Comp[]) => {
    setState({ ...state, comps })
    setBuilderOpen(false)
  }

  return (
    <>
      <StepHeader
        eyebrow="Market"
        title="Comparable market analysis"
        subtitle="These are the comps that back up your price guide. Whatever you settle on saves as the CMA on this property."
      />

      <div className="max-w-3xl">
        {/* CMA summary card — the primary UI now */}
        {state.comps.length > 0 ? (
          <div className="mb-4 rounded-[16px] bg-surface p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-accent-soft text-accent">
                    <Layers size={15} strokeWidth={1.75} />
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold">CMA for {linkedAddress}</div>
                    <div className="text-[11.5px] text-ink-muted">
                      Saved on the property record · reused next time
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-5 text-[12.5px]">
                  <div>
                    <div className="text-[10.5px] font-medium uppercase tracking-wider text-ink-faint">Sold</div>
                    <div className="text-[15px] font-semibold tabular-nums">{soldIncluded.length}</div>
                  </div>
                  <div>
                    <div className="text-[10.5px] font-medium uppercase tracking-wider text-ink-faint">For sale</div>
                    <div className="text-[15px] font-semibold tabular-nums">{forSaleIncluded.length}</div>
                  </div>
                  <div>
                    <div className="text-[10.5px] font-medium uppercase tracking-wider text-ink-faint">Avg sold</div>
                    <div className="text-[15px] font-semibold tabular-nums">{soldIncluded.length ? formatMoney(avg) : '—'}</div>
                  </div>
                  <div className="flex-1" />
                </div>
              </div>
              <button
                onClick={() => openBuilder('select')}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-[10px] border border-hairline bg-surface px-3 py-2 text-[12.5px] font-medium text-ink shadow-[0_1px_2px_rgba(16,24,40,0.05)] hover:border-ink-muted"
              >
                Edit CMA
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-4 rounded-[16px] border border-dashed border-hairline bg-surface p-8 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-accent">
              <Layers size={18} strokeWidth={1.75} />
            </div>
            <div className="mt-3 text-[15px] font-semibold">No CMA on file for {linkedAddress}</div>
            <p className="mx-auto mt-1 max-w-md text-[13px] leading-relaxed text-ink-muted">
              Build one now — search sold and for-sale properties, add notes and rank them. Your CMA saves back to the property so next time it's pre-loaded.
            </p>
            <button
              onClick={() => openBuilder('select')}
              className="mt-4 inline-flex items-center gap-1.5 rounded-[10px] bg-accent px-4 py-2 text-[13px] font-medium text-white shadow-[0_1px_2px_rgba(0,87,255,0.35)] hover:brightness-105"
            >
              <Search size={14} strokeWidth={2} />
              Build CMA
            </button>
          </div>
        )}

        {/* Price guide */}
        <div className="mb-4 rounded-[16px] bg-surface p-5 shadow-[var(--shadow-card)]">
          <div className="mb-3 flex items-baseline justify-between">
            <div className="text-[11px] font-medium uppercase tracking-widest text-ink-faint">Suggested price guide</div>
            {soldIncluded.length > 0 ? (
              <div className="text-[11.5px] text-ink-faint">
                Based on {soldIncluded.length} sold comp{soldIncluded.length === 1 ? '' : 's'} · avg {formatMoney(avg)}
              </div>
            ) : (
              <div className="text-[11.5px] text-ink-faint">
                Add sold comps to sanity-check your range
              </div>
            )}
          </div>
          <div className="flex items-end gap-3">
            <PriceBubble
              label="Low"
              value={state.price.low}
              onChange={(n) => setState({ ...state, price: { ...state.price, low: n } })}
            />
            <div className="pb-3.5 text-[20px] text-ink-faint">–</div>
            <PriceBubble
              label="High"
              value={state.price.high}
              onChange={(n) => setState({ ...state, price: { ...state.price, high: n } })}
            />
          </div>
          {wide && (
            <div className="mt-4 flex items-start gap-2.5 rounded-[12px] bg-warn-soft p-3">
              <AlertTriangle size={14} className="mt-0.5 shrink-0 text-warn" strokeWidth={2} />
              <div className="text-[12.5px] leading-relaxed">
                <span className="font-semibold text-ink">Wide price range ({rangePct.toFixed(0)}%)</span>
                <span className="text-ink-muted"> — vendors and buyers read a range this wide as uncertainty. Tighten to under 10% for a firmer positioning.</span>
              </div>
            </div>
          )}
        </div>

        {/* Compact preview of what's in the CMA */}
        {state.comps.length > 0 && (
          <div className="rounded-[16px] bg-surface p-4 shadow-[var(--shadow-card)]">
            <div className="mb-2 flex items-baseline justify-between">
              <div className="text-[12px] font-semibold">In this CMA</div>
              <button
                onClick={() => openBuilder('analyse')}
                className="text-[11.5px] font-medium text-accent"
              >
                Manage order & notes
              </button>
            </div>
            <div className="space-y-1.5">
              {state.comps.map((c, i) => (
                <div key={c.id} className={'flex items-center gap-3 rounded-[10px] px-2 py-1.5 ' + (c.included ? '' : 'opacity-50')}>
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-canvas text-[10.5px] font-medium text-ink-muted">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px]">
                      {c.address}
                      {c.note && <span className="ml-1.5 text-[11px] text-ink-muted italic">— {c.note}</span>}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-canvas px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-ink-muted">
                    {c.kind === 'sold' ? 'Sold' : 'For sale'}
                  </span>
                  <span className="w-24 shrink-0 text-right text-[12.5px] font-medium tabular-nums">
                    {c.priceHigh ? `${formatMoney(c.price)}–${formatMoney(c.priceHigh)}` : formatMoney(c.price)}
                  </span>
                  <button
                    onClick={() => toggle(c.id)}
                    className="text-[11.5px] font-medium text-ink-muted hover:text-ink"
                  >
                    {c.included ? 'Hide' : 'Show'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center gap-2 rounded-[12px] bg-canvas px-3 py-2 text-[11.5px] text-ink-muted">
          <Info size={12} className="text-ink-faint" />
          <span>Method of sale can stay as "decide together" — you can lock in auction, private treaty or EOI during the vendor meeting.</span>
        </div>
      </div>

      {builderOpen && (
        <CMABuilder
          onClose={closeBuilder}
          onSave={handleSaveCMA}
          initialComps={state.comps}
          initialStep={builderOpen}
          subjectAddress={state.property.address}
          subjectSuburb={state.property.suburb}
          subjectMeta={{ beds: state.property.beds, baths: state.property.baths, cars: state.property.cars, land: state.property.land }}
        />
      )}
    </>
  )
}

// ── Marketing

type MarketingPreset = { id: string; label: string; description: string; items: string[] }

const marketingPresets: MarketingPreset[] = [
  {
    id: 'essential',
    label: 'Essential',
    description: 'Portal listing, photos, signboard, floorplan',
    items: ['m1', 'm3', 'm6', 'm9'],
  },
  {
    id: 'standard',
    label: 'Standard',
    description: 'Adds Domain, social ads, brochures',
    items: ['m1', 'm2', 'm3', 'm5', 'm6', 'm7', 'm9'],
  },
  {
    id: 'premium',
    label: 'Premium',
    description: 'Full pack — drone video + newspaper',
    items: ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9'],
  },
]

function MarketingStep({
  state,
  setState,
  marketingSubtotal,
  marketingTotal,
}: {
  state: State
  setState: (s: State) => void
  marketingSubtotal: number
  marketingTotal: number
}) {
  const toggle = (id: string) =>
    setState({
      ...state,
      marketing: state.marketing.map((m) => (m.id === id ? { ...m, included: !m.included } : m)),
    })
  const setAmount = (id: string, amount: number) =>
    setState({
      ...state,
      marketing: state.marketing.map((m) => (m.id === id ? { ...m, amount } : m)),
    })

  const currentIds = state.marketing.filter((m) => m.included).map((m) => m.id).sort()
  const activePreset =
    marketingPresets.find((p) => {
      const sorted = [...p.items].sort()
      return sorted.length === currentIds.length && sorted.every((id, i) => id === currentIds[i])
    })?.id ?? 'custom'

  const applyPreset = (p: MarketingPreset) => {
    setState({
      ...state,
      marketing: state.marketing.map((m) => ({ ...m, included: p.items.includes(m.id) })),
    })
  }

  const presetTotal = (p: MarketingPreset) =>
    state.marketing.filter((m) => p.items.includes(m.id)).reduce((s, m) => s + m.amount, 0)

  const grouped = ['Digital', 'Print', 'Media'] as const
  return (
    <>
      <StepHeader
        eyebrow="Marketing"
        title="Tailored marketing pack"
        subtitle="Start from a preset, then tweak individual items. Vendor gets a pay-now vs pay-at-settlement option at the bottom."
      />

      <div className="max-w-3xl space-y-4">
        {/* Preset chooser */}
        <div className="grid grid-cols-4 gap-2">
          {marketingPresets.map((p) => {
            const active = activePreset === p.id
            return (
              <button
                key={p.id}
                onClick={() => applyPreset(p)}
                className={
                  'flex flex-col items-start gap-1 rounded-[14px] border p-3 text-left transition ' +
                  (active
                    ? 'border-accent bg-accent-tint shadow-[var(--shadow-card)]'
                    : 'border-hairline bg-surface hover:border-ink-faint/50')
                }
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-[13px] font-semibold">{p.label}</span>
                  {active && (
                    <div className="flex h-4 w-4 items-center justify-center rounded-full bg-accent text-white">
                      <Check size={10} strokeWidth={3} />
                    </div>
                  )}
                </div>
                <div className="text-[11px] leading-snug text-ink-muted">{p.description}</div>
                <div className="mt-0.5 text-[12.5px] font-semibold tracking-tight text-accent tabular-nums">
                  {formatMoney(presetTotal(p))}
                </div>
              </button>
            )
          })}
          <div
            className={
              'flex flex-col items-start gap-1 rounded-[14px] border p-3 ' +
              (activePreset === 'custom' ? 'border-accent bg-accent-tint' : 'border-hairline bg-surface/60')
            }
          >
            <div className="flex w-full items-center justify-between">
              <span className="text-[13px] font-semibold">Custom</span>
              {activePreset === 'custom' && (
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-accent text-white">
                  <Check size={10} strokeWidth={3} />
                </div>
              )}
            </div>
            <div className="text-[11px] leading-snug text-ink-muted">Your hand-picked mix</div>
            <div className="mt-0.5 text-[12.5px] font-semibold tracking-tight tabular-nums">
              {activePreset === 'custom' ? formatMoney(marketingSubtotal) : '—'}
            </div>
          </div>
        </div>

        {grouped.map((cat) => {
          const items = state.marketing.filter((m) => m.category === cat)
          return (
            <div key={cat} className="overflow-hidden rounded-[14px] bg-surface shadow-[var(--shadow-card)]">
              <div className="border-b border-hairline px-4 py-2 text-[11px] font-medium uppercase tracking-wider text-ink-muted">
                {cat}
              </div>
              {items.map((m) => (
                <div key={m.id} className={'grid grid-cols-[24px_minmax(0,1fr)_120px] items-center gap-3 border-b border-hairline/60 px-4 py-3 last:border-b-0 ' + (m.included ? '' : 'opacity-50')}>
                  <div
                    onClick={() => toggle(m.id)}
                    className={
                      'flex h-5 w-5 cursor-pointer items-center justify-center rounded-md border transition ' +
                      (m.included ? 'border-accent bg-accent text-white' : 'border-hairline bg-surface')
                    }
                  >
                    {m.included && <Check size={12} strokeWidth={3} />}
                  </div>
                  <div className="text-[13px]">{m.label}</div>
                  <div className="flex items-center gap-1 text-[13px]">
                    <span className="text-ink-faint">$</span>
                    <input
                      type="number"
                      value={m.amount}
                      onChange={(e) => setAmount(m.id, +e.target.value)}
                      className={inputCls + ' text-right py-1'}
                    />
                  </div>
                </div>
              ))}
            </div>
          )
        })}

        <div className="rounded-[14px] bg-surface p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-baseline justify-between">
            <div className="text-[12.5px] font-medium">Vendor payment option</div>
            <div className="text-[11.5px] text-ink-faint">Loading +7.65% for pay-at-settlement</div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {[
              { key: false, label: 'Pay now', body: 'Invoice on campaign start' },
              { key: true, label: 'Pay at settlement', body: 'Charged from proceeds + 7.65%' },
            ].map((o) => {
              const active = state.payLater === o.key
              return (
                <button
                  key={String(o.key)}
                  onClick={() => setState({ ...state, payLater: o.key })}
                  className={
                    'rounded-[12px] border p-3 text-left transition ' +
                    (active ? 'border-accent bg-accent-tint' : 'border-hairline bg-surface hover:border-ink-faint/50')
                  }
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[13.5px] font-semibold">{o.label}</span>
                    {active && <Check size={14} className="text-accent" strokeWidth={3} />}
                  </div>
                  <div className="mt-0.5 text-[12px] text-ink-muted">{o.body}</div>
                  <div className="mt-2 text-[16px] font-semibold tracking-tight">
                    {formatMoney(o.key ? Math.round(marketingSubtotal * 1.0765) : marketingSubtotal)}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex items-baseline justify-between rounded-[14px] bg-ink p-4 text-white">
          <div className="text-[12.5px] text-white/70">Vendor pays</div>
          <div className="text-[22px] font-semibold tracking-tight">{formatMoney(marketingTotal)}</div>
        </div>
      </div>
    </>
  )
}

// ── Fee

function FeeStep({ state, setState }: { state: State; setState: (s: State) => void }) {
  const example = 1_100_000
  const commissionOnExample = Math.round((state.fee.commission / 100) * example)
  return (
    <>
      <StepHeader
        eyebrow="Fee"
        title="Your commission structure"
        subtitle="Pre-filled with your CLK default. Adjust for this vendor if you're negotiating."
      />
      <div className="max-w-2xl space-y-4">
        <div className="rounded-[14px] bg-surface p-5 shadow-[var(--shadow-card)]">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Commission (inc. GST)">
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.05"
                  value={state.fee.commission}
                  onChange={(e) => setState({ ...state, fee: { ...state.fee, commission: +e.target.value } })}
                  className={inputCls + ' text-right'}
                />
                <span className="text-ink-muted">%</span>
              </div>
            </Field>
            <Field label="AML / ID verification" hint="Government-required, one-off">
              <div className="flex items-center gap-1">
                <span className="text-ink-faint">$</span>
                <input
                  type="number"
                  value={state.fee.aml}
                  onChange={(e) => setState({ ...state, fee: { ...state.fee, aml: +e.target.value } })}
                  className={inputCls + ' text-right'}
                />
              </div>
            </Field>
          </div>
          <label className="mt-4 flex items-start gap-3 rounded-[12px] bg-canvas p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={state.fee.noSell}
              onChange={(e) => setState({ ...state, fee: { ...state.fee, noSell: e.target.checked } })}
              className="mt-0.5 h-4 w-4 accent-[color:var(--color-accent)]"
            />
            <div>
              <div className="text-[13px] font-medium">Include no-sell clause</div>
              <div className="mt-0.5 text-[12px] text-ink-muted">Zero commission if the property doesn't sell. Standard CLK offering.</div>
            </div>
          </label>
        </div>

        <div className="rounded-[14px] bg-accent-tint p-4">
          <div className="text-[12px] text-ink-muted">On a sale price of <span className="font-medium text-ink">{formatMoney(example)}</span></div>
          <div className="mt-1 text-[22px] font-semibold tracking-tight text-accent">{formatMoney(commissionOnExample + state.fee.aml)}</div>
          <div className="mt-0.5 text-[11.5px] text-ink-muted">Commission {formatMoney(commissionOnExample)} + AML {formatMoney(state.fee.aml)}</div>
        </div>
      </div>
    </>
  )
}

// ── Review

function TermsMini({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-wider text-ink-faint">{label}</div>
      {children ? <div className="mt-0.5">{children}</div> : <div className="mt-0.5 text-[12px] font-semibold">{value}</div>}
    </div>
  )
}

function ReviewStep({ state, setState, marketingTotal, onPreview }: { state: State; setState: (s: State) => void; marketingTotal: number; onPreview: (c: 'email' | 'sms' | 'link') => void }) {
  const toggle = (label: string) =>
    setState({ ...state, sections: { ...state.sections, [label]: !state.sections[label] } })

  const sectionKeys = state.variant === 'price-update'
    ? ['Greeting', 'Recent local sales', "What's currently for sale", 'Your home against the market']
    : Object.keys(state.sections)

  return (
    <>
      <StepHeader
        eyebrow="Review"
        title="Final check before you send"
        subtitle="Toggle any section off if you'd rather not include it. Then send by email or share a link."
      />

      <div className="grid max-w-4xl gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-3">
          <div className="rounded-[14px] bg-surface p-4 shadow-[var(--shadow-card)]">
            <div className="text-[11px] font-medium uppercase tracking-wider text-ink-faint">Sections included</div>
            <div className="mt-3 space-y-1.5">
              {sectionKeys.map((label) => {
                const on = state.sections[label]
                return (
                  <label key={label} className="flex items-center justify-between rounded-[10px] px-2 py-1.5 hover:bg-canvas cursor-pointer">
                    <span className="text-[13px]">{label}</span>
                    <button
                      onClick={(e) => { e.preventDefault(); toggle(label) }}
                      className={
                        'relative h-5 w-9 rounded-full transition ' + (on ? 'bg-accent' : 'bg-black/[0.1]')
                      }
                    >
                      <span
                        className={
                          'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ' + (on ? 'left-[18px]' : 'left-0.5')
                        }
                      />
                    </button>
                  </label>
                )
              })}
            </div>
          </div>

          {state.variant === 'full' && (
            <div className={'rounded-[14px] p-4 shadow-[var(--shadow-card)] transition ' + (state.agreement.include ? 'bg-surface ring-1 ring-accent/25' : 'bg-surface')}>
              <div className="flex items-start gap-3">
                <div className={'flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ' + (state.agreement.include ? 'bg-accent text-white' : 'bg-canvas text-ink-muted')}>
                  <FileSignature size={16} strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="text-[13.5px] font-semibold">Include the agency agreement for signing</div>
                    <span className="rounded-full bg-canvas px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-ink-muted">
                      e-sign
                    </span>
                  </div>
                  <div className="mt-0.5 text-[12px] leading-relaxed text-ink-muted">
                    {state.vendor.people.length > 1
                      ? `Karen and Steve will each get a signing block inside the proposal — you'll see it under Agreements once it's out.`
                      : `They'll get a signing block inside the proposal — visible in Agreements once it's out.`}
                  </div>
                </div>
                <button
                  onClick={() => setState({ ...state, agreement: { ...state.agreement, include: !state.agreement.include } })}
                  className={'relative h-5 w-9 shrink-0 rounded-full transition ' + (state.agreement.include ? 'bg-accent' : 'bg-black/[0.1]')}
                  aria-label="Toggle agreement"
                >
                  <span className={'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ' + (state.agreement.include ? 'left-[18px]' : 'left-0.5')} />
                </button>
              </div>

              {state.agreement.include && (
                <div className="mt-3 grid grid-cols-4 gap-2 rounded-[12px] bg-canvas p-3">
                  <TermsMini label="Method" value={state.agreement.method} />
                  <TermsMini label="Commission" value={`${state.fee.commission}% + $${state.fee.aml}`} />
                  <TermsMini label="Marketing" value={`$${(marketingTotal / 1000).toFixed(1)}k${state.payLater ? ' · @ settlement' : ''}`} />
                  <TermsMini label="Period">
                    <select
                      value={state.agreement.periodDays}
                      onChange={(e) => setState({ ...state, agreement: { ...state.agreement, periodDays: +e.target.value } })}
                      className="w-full rounded-[6px] bg-surface px-1.5 py-1 text-[12px] font-semibold outline-none focus:ring-2 focus:ring-accent-soft"
                    >
                      <option value={60}>60 days</option>
                      <option value={90}>90 days</option>
                      <option value={120}>120 days</option>
                    </select>
                  </TermsMini>
                </div>
              )}

              {state.agreement.include && state.fee.noSell && (
                <div className="mt-2 flex items-center gap-2 text-[11.5px] text-ink-muted">
                  <ShieldCheck size={12} className="text-success" />
                  <span>No-sell clause included — zero commission if the property doesn't sell.</span>
                </div>
              )}
            </div>
          )}

          <div className="rounded-[14px] bg-surface p-4 shadow-[var(--shadow-card)]">
            <div className="flex items-baseline justify-between">
              <div className="text-[11px] font-medium uppercase tracking-wider text-ink-faint">Send options</div>
              {state.vendor.people.length > 1 && (
                <span className="text-[11px] text-ink-muted">
                  {state.vendor.sendIndividually
                    ? `Individual · ${state.vendor.people.length} recipients`
                    : 'One combined proposal'}
                </span>
              )}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {([
                {
                  channel: 'email' as const,
                  icon: Mail,
                  label: 'Email',
                  body: state.vendor.sendIndividually && state.vendor.people.length > 1
                    ? `to ${state.vendor.people.length} recipients`
                    : `to ${displayVendorName(state.vendor.people) || 'vendor'}`,
                },
                {
                  channel: 'sms' as const,
                  icon: Send,
                  label: 'SMS link',
                  body: state.vendor.people[0]?.phone || 'no number',
                },
                { channel: 'link' as const, icon: ChevronRight, label: 'Copy link', body: 'Share yourself' },
              ]).map((o) => (
                <button
                  key={o.channel}
                  onClick={() => onPreview(o.channel)}
                  className="rounded-[12px] border border-hairline bg-surface p-3 text-left hover:border-accent"
                >
                  <div className="flex items-center justify-between">
                    <o.icon size={16} className="text-accent" />
                    <span className="text-[10px] font-medium uppercase tracking-wider text-ink-faint">Preview</span>
                  </div>
                  <div className="mt-2 text-[13px] font-semibold">{o.label}</div>
                  <div className="text-[11.5px] text-ink-muted">{o.body}</div>
                </button>
              ))}
            </div>
            {state.vendor.sendIndividually && state.vendor.people.length > 1 && (
              <div className="mt-3 space-y-1.5 rounded-[10px] bg-canvas p-2.5">
                <div className="text-[10.5px] font-medium uppercase tracking-wider text-ink-faint">Recipients</div>
                {state.vendor.people.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-[12px]">
                    <span className="font-medium">{p.name || 'Unnamed'}</span>
                    <span className={p.email ? 'text-ink-muted' : 'text-danger'}>
                      {p.email || 'missing email'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2 rounded-[14px] bg-surface p-4 shadow-[var(--shadow-card)]">
          <div className="text-[11px] font-medium uppercase tracking-wider text-ink-faint">Summary</div>
          <SummaryRow k="Property" v={`${state.property.address}, ${state.property.suburb}`} />
          <SummaryRow k="Vendor" v={displayVendorName(state.vendor.people) || '—'} />
          <SummaryRow
            k="Delivery"
            v={state.vendor.people.length > 1
              ? (state.vendor.sendIndividually ? `Individual × ${state.vendor.people.length}` : 'Combined')
              : 'Single'}
          />
          <SummaryRow k="Guide" v={`${formatMoney(state.price.low)} – ${formatMoney(state.price.high)}`} />
          <SummaryRow k="Type" v={state.variant === 'price-update' ? 'Price update' : 'Full listing pitch'} />
          {state.variant === 'full' && (
            <>
              <SummaryRow k="Marketing" v={formatMoney(marketingTotal)} />
              <SummaryRow k="Commission" v={`${state.fee.commission}% + $${state.fee.aml} AML`} />
              <SummaryRow k="Agreement" v={state.agreement.include ? `${state.agreement.method} · ${state.agreement.periodDays}d` : 'Not included'} />
            </>
          )}
        </div>
      </div>
    </>
  )
}

function SummaryRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-hairline/70 py-1.5 last:border-b-0">
      <span className="text-[11.5px] text-ink-muted">{k}</span>
      <span className="text-[12.5px] font-medium text-right">{v}</span>
    </div>
  )
}
