import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Layers,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { type Comp, marketPool, PhotoTile, formatMoney } from './NewProposalWizard'

type Tab = 'sold' | 'for-sale'
type Step = 'select' | 'analyse'

type Props = {
  onClose: () => void
  onSave: (comps: Comp[]) => void
  initialComps: Comp[]
  initialStep?: Step
  subjectAddress: string
  subjectSuburb: string
  subjectMeta: { beds: number; baths: number; cars: number; land: number }
}

function priceOf(c: Comp) {
  if (c.priceHigh) return `${formatMoney(c.price)}–${formatMoney(c.priceHigh)}`
  return formatMoney(c.price)
}

function formatShort(n: number) {
  return n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 2).replace(/\.?0+$/, '')}M`
    : `$${Math.round(n / 1000)}k`
}

function shortPrice(c: Comp) {
  if (c.priceHigh) return `${formatShort(c.price)}–${formatShort(c.priceHigh)}`
  return formatShort(c.price)
}

// ─── Sub components ──────────────────────────────────────────────────────

function SegmentedTabs({ tab, onChange, counts }: { tab: Tab; onChange: (t: Tab) => void; counts: Record<Tab, number> }) {
  return (
    <div className="inline-flex rounded-full bg-black/[0.05] p-1">
      {(['sold', 'for-sale'] as Tab[]).map((t) => {
        const active = t === tab
        return (
          <button
            key={t}
            onClick={() => onChange(t)}
            className={
              'relative flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] font-medium transition ' +
              (active ? 'bg-white text-ink shadow-[0_1px_2px_rgba(16,24,40,0.08)]' : 'text-ink-muted hover:text-ink')
            }
          >
            {t === 'sold' ? 'Sold' : 'For sale'}
            <span className={'rounded-full px-1.5 text-[10.5px] font-semibold ' + (active ? 'bg-accent-soft text-accent' : 'bg-black/[0.06] text-ink-muted')}>
              {counts[t]}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function FilterButton({ label, value, active, onClick }: { label: string; value?: string; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={
        'group inline-flex items-center gap-1.5 rounded-[10px] border px-2.5 py-1.5 text-[12.5px] transition ' +
        (active
          ? 'border-accent bg-accent-tint text-accent'
          : 'border-hairline bg-surface text-ink-muted hover:border-ink-faint hover:text-ink')
      }
    >
      <span className="text-[10.5px] uppercase tracking-wider text-ink-faint">{label}</span>
      {value && <span className="font-medium text-ink">{value}</span>}
      <ChevronDown size={11} className="text-ink-faint" />
    </button>
  )
}

function MarketCard({
  c,
  onOpen,
  onAdd,
  selected,
}: {
  c: Comp
  onOpen: () => void
  onAdd: () => void
  selected: boolean
}) {
  const dateLabel = c.kind === 'sold' ? c.soldDate : c.listedDate
  return (
    <div
      onClick={onOpen}
      className={
        'group flex cursor-pointer gap-4 rounded-[16px] border bg-surface p-3.5 transition ' +
        (selected
          ? 'border-accent/40 bg-accent-tint/40'
          : 'border-hairline hover:border-ink-faint hover:shadow-[var(--shadow-card)]')
      }
    >
      <PhotoTile seed={c.id} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-[14.5px] font-semibold">{c.address}</div>
            <div className="truncate text-[12px] text-ink-muted">{c.suburb} NSW {c.postcode}</div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onAdd() }}
            aria-label={selected ? 'In CMA' : 'Add to CMA'}
            className={
              'shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition ' +
              (selected
                ? 'bg-accent text-white'
                : 'bg-canvas text-ink-muted hover:bg-accent hover:text-white')
            }
          >
            {selected ? 'In CMA' : '+ Add'}
          </button>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11.5px] text-ink-muted">
          <span>{c.beds}bd</span>
          <span className="text-ink-faint">·</span>
          <span>{c.baths}ba</span>
          <span className="text-ink-faint">·</span>
          <span>{c.cars}car</span>
          {c.land > 0 && (
            <>
              <span className="text-ink-faint">·</span>
              <span>{c.land}m²</span>
            </>
          )}
          <span className="text-ink-faint">·</span>
          <span>{c.type}</span>
        </div>

        <div className="mt-2 flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <div className="text-[15px] font-semibold tabular-nums">{priceOf(c)}</div>
            <div className="text-[11px] text-ink-muted">
              {c.kind === 'sold' ? 'sold' : 'listed'} {dateLabel}
            </div>
          </div>
          <div className="text-[11px] text-ink-faint">
            {c.dom}d on market · {c.distance}km away
          </div>
        </div>
      </div>
    </div>
  )
}

function CMAPanel({
  selected,
  onRemove,
  onOpenAnalyse,
}: {
  selected: Comp[]
  onRemove: (id: string) => void
  onOpenAnalyse: () => void
}) {
  const soldSelected = selected.filter((c) => c.kind === 'sold')
  const soldAvg = soldSelected.length
    ? Math.round(soldSelected.reduce((s, c) => s + c.price, 0) / soldSelected.length)
    : 0
  const soldPrices = soldSelected.map((c) => c.price)
  const spread = soldPrices.length
    ? {
        low: Math.min(...soldPrices),
        high: Math.max(...soldPrices),
      }
    : null

  return (
    <aside className="flex h-full min-h-0 w-[300px] shrink-0 flex-col border-l border-hairline bg-surface/70">
      <div className="border-b border-hairline px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[12px] font-semibold">
            <Layers size={13} className="text-accent" />
            In this CMA
          </div>
          <span className="rounded-full bg-canvas px-2 py-0.5 text-[11px] font-medium tabular-nums text-ink-muted">
            {selected.length}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2">
        {selected.length === 0 ? (
          <div className="mt-6 rounded-[14px] border border-dashed border-hairline px-4 py-8 text-center">
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-accent">
              <Plus size={14} />
            </div>
            <div className="mt-2 text-[12.5px] font-semibold">Empty CMA</div>
            <div className="mt-1 text-[11.5px] leading-relaxed text-ink-muted">
              Click <span className="font-medium text-ink">+ Add</span> on any property to start building.
            </div>
          </div>
        ) : (
          <ol className="space-y-1">
            {selected.map((c, i) => (
              <li key={c.id} className="group flex items-center gap-2 rounded-[10px] px-2 py-1.5 hover:bg-canvas">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-canvas text-[10.5px] font-semibold tabular-nums text-ink-muted">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12.5px] font-medium">{c.address}</div>
                  <div className="flex items-center gap-1 text-[10.5px] text-ink-muted">
                    <span>{c.kind === 'sold' ? 'sold' : 'listed'}</span>
                    <span className="text-ink-faint">·</span>
                    <span className="tabular-nums">{shortPrice(c)}</span>
                  </div>
                </div>
                <button
                  onClick={() => onRemove(c.id)}
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-ink-faint opacity-0 transition group-hover:opacity-100 hover:bg-danger-soft hover:text-danger"
                  aria-label="Remove"
                >
                  <X size={11} />
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>

      {selected.length > 0 && (
        <div className="border-t border-hairline px-4 py-3">
          <div className="mb-2 grid grid-cols-2 gap-3 text-[11px]">
            <div>
              <div className="text-[9.5px] font-medium uppercase tracking-wider text-ink-faint">Avg sold</div>
              <div className="text-[13px] font-semibold tabular-nums">{soldAvg ? formatMoney(soldAvg) : '—'}</div>
            </div>
            <div>
              <div className="text-[9.5px] font-medium uppercase tracking-wider text-ink-faint">Spread</div>
              <div className="text-[13px] font-semibold tabular-nums">
                {spread ? `${formatShort(spread.low)}–${formatShort(spread.high)}` : '—'}
              </div>
            </div>
          </div>
          <button
            onClick={onOpenAnalyse}
            className="flex w-full items-center justify-center gap-1.5 rounded-[10px] bg-ink px-3 py-2 text-[12px] font-medium text-white hover:brightness-110"
          >
            <Sparkles size={12} />
            Analyse & rank
          </button>
        </div>
      )}
    </aside>
  )
}

function DetailDrawer({
  c,
  isSelected,
  onClose,
  onToggle,
}: {
  c: Comp
  isSelected: boolean
  onClose: () => void
  onToggle: () => void
}) {
  return (
    <div className="absolute inset-0 z-20 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        className="relative flex h-full w-[440px] flex-col overflow-hidden bg-surface shadow-[0_-8px_28px_-4px_rgba(16,24,40,0.16)] animate-in slide-in-from-right"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-ink-muted shadow-[0_1px_2px_rgba(16,24,40,0.08)] ring-1 ring-hairline hover:text-ink"
        >
          <X size={14} />
        </button>

        <div className="h-[240px] w-full shrink-0">
          <div className="h-full w-full">
            <PhotoTile seed={c.id + '-detail'} size="lg" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="mb-1 text-[10.5px] font-medium uppercase tracking-widest text-ink-faint">
            {c.kind === 'sold' ? 'Sold property' : 'Currently for sale'}
          </div>
          <h3 className="text-[19px] font-semibold tracking-tight">{c.address}</h3>
          <div className="text-[13px] text-ink-muted">{c.suburb} NSW {c.postcode}</div>

          <div className="mt-4 rounded-[14px] bg-canvas p-4">
            <div className="text-[10.5px] font-medium uppercase tracking-widest text-ink-faint">
              {c.kind === 'sold' ? 'Sold for' : 'Listed at'}
            </div>
            <div className="mt-0.5 text-[24px] font-semibold tabular-nums tracking-tight">{priceOf(c)}</div>
            {c.land > 0 && (
              <div className="mt-0.5 text-[11.5px] text-ink-muted">
                {formatMoney(Math.round(c.price / c.land))} / m²
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-4 gap-3 rounded-[14px] bg-surface p-3 ring-1 ring-hairline">
            <MiniStat label="Beds" value={String(c.beds)} />
            <MiniStat label="Baths" value={String(c.baths)} />
            <MiniStat label="Car" value={String(c.cars)} />
            <MiniStat label="Land" value={c.land > 0 ? `${c.land}m²` : '—'} />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <MiniCard label={c.kind === 'sold' ? 'Sold date' : 'Listed date'} value={c.kind === 'sold' ? c.soldDate ?? '—' : c.listedDate ?? '—'} />
            <MiniCard label="Days on market" value={`${c.dom} days`} />
            <MiniCard label="Distance" value={`${c.distance}km`} />
            {c.yearBuilt && <MiniCard label="Year built" value={String(c.yearBuilt)} />}
          </div>
        </div>

        <div className="border-t border-hairline bg-surface px-5 py-3">
          <button
            onClick={onToggle}
            className={
              'flex w-full items-center justify-center gap-1.5 rounded-[10px] px-4 py-2.5 text-[13.5px] font-medium transition ' +
              (isSelected
                ? 'border border-hairline bg-surface text-ink hover:bg-canvas'
                : 'bg-accent text-white shadow-[0_1px_2px_rgba(0,87,255,0.35)] hover:brightness-105')
            }
          >
            {isSelected ? (
              <>
                <Trash2 size={13} />
                Remove from CMA
              </>
            ) : (
              <>
                <Plus size={13} strokeWidth={2.25} />
                Add to CMA
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-[10.5px] font-medium uppercase tracking-wider text-ink-faint">{label}</div>
      <div className="mt-0.5 text-[13.5px] font-semibold">{value}</div>
    </div>
  )
}

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] bg-canvas px-3 py-2">
      <div className="text-[10.5px] font-medium uppercase tracking-wider text-ink-faint">{label}</div>
      <div className="mt-0.5 text-[13px] font-semibold">{value}</div>
    </div>
  )
}

function AnalyseRow({
  c,
  rank,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onRemove,
  onNoteChange,
}: {
  c: Comp
  rank: number
  isFirst: boolean
  isLast: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
  onNoteChange: (v: string) => void
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-5 rounded-[16px] bg-surface p-4 shadow-[var(--shadow-card)]">
      <div className="flex gap-3">
        <div className="relative shrink-0">
          <PhotoTile seed={c.id} size="md" />
          <div className="absolute -left-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[11px] font-semibold tabular-nums text-white shadow-md">
            {rank}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate text-[14px] font-semibold">{c.address}</div>
              <div className="truncate text-[12px] text-ink-muted">{c.suburb} NSW {c.postcode}</div>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <div className="text-[15px] font-semibold tabular-nums">{shortPrice(c)}</div>
              <div className="text-[10.5px] text-ink-muted">
                {c.kind === 'sold' ? c.soldDate : c.listedDate}
              </div>
            </div>
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[11px] text-ink-muted">
            <span>{c.beds}bd · {c.baths}ba · {c.cars}car</span>
            {c.land > 0 && (<><span className="text-ink-faint">·</span><span>{c.land}m²</span></>)}
            <span className="text-ink-faint">·</span>
            <span>{c.dom}d on market</span>
            <span className="text-ink-faint">·</span>
            <span>{c.distance}km away</span>
          </div>

          <div className="mt-3 flex items-center gap-1">
            <button
              onClick={onMoveUp}
              disabled={isFirst}
              className="flex h-7 w-7 items-center justify-center rounded-[8px] text-ink-muted transition hover:bg-canvas disabled:opacity-30"
              aria-label="Move up"
            >
              <ChevronUp size={14} />
            </button>
            <button
              onClick={onMoveDown}
              disabled={isLast}
              className="flex h-7 w-7 items-center justify-center rounded-[8px] text-ink-muted transition hover:bg-canvas disabled:opacity-30"
              aria-label="Move down"
            >
              <ChevronDown size={14} />
            </button>
            <div className="mx-1 h-4 w-px bg-hairline" />
            <button
              onClick={onRemove}
              className="flex h-7 items-center gap-1 rounded-[8px] px-2 text-[11.5px] text-danger transition hover:bg-danger-soft"
              aria-label="Remove"
            >
              <Trash2 size={12} />
              Remove
            </button>
          </div>
        </div>
      </div>
      <textarea
        value={c.note ?? ''}
        onChange={(e) => onNoteChange(e.target.value)}
        placeholder="Add a note — what makes this comp relevant? (e.g. same street, superior finish, larger land)"
        className="h-full min-h-[110px] rounded-[12px] bg-canvas px-3 py-2.5 text-[12.5px] leading-relaxed outline-none transition placeholder:text-ink-faint focus:bg-white focus:ring-2 focus:ring-accent-soft"
      />
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────

export default function CMABuilder({
  onClose,
  onSave,
  initialComps,
  initialStep = 'select',
  subjectAddress,
  subjectSuburb,
  subjectMeta,
}: Props) {
  const [step, setStep] = useState<Step>(initialStep)
  const [tab, setTab] = useState<Tab>('sold')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Comp[]>(initialComps)
  const [detail, setDetail] = useState<Comp | null>(null)

  const selectedIds = useMemo(() => new Set(selected.map((c) => c.id)), [selected])

  const filtered = marketPool
    .filter((c) => c.kind === tab)
    .filter((c) =>
      search.trim()
        ? (c.address + ' ' + c.suburb).toLowerCase().includes(search.trim().toLowerCase())
        : true,
    )

  const counts: Record<Tab, number> = {
    sold: marketPool.filter((c) => c.kind === 'sold').length,
    'for-sale': marketPool.filter((c) => c.kind === 'for-sale').length,
  }

  const toggleAdd = (c: Comp) => {
    if (selectedIds.has(c.id)) {
      setSelected(selected.filter((s) => s.id !== c.id))
    } else {
      setSelected([...selected, { ...c, fromCMA: true, included: true, note: c.note ?? '' }])
    }
  }
  const removeFromSelected = (id: string) => setSelected(selected.filter((c) => c.id !== id))
  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir
    if (target < 0 || target >= selected.length) return
    const next = [...selected]
    ;[next[idx], next[target]] = [next[target], next[idx]]
    setSelected(next)
  }
  const setNote = (id: string, note: string) => {
    setSelected(selected.map((c) => (c.id === id ? { ...c, note } : c)))
  }

  const soldSelected = selected.filter((c) => c.kind === 'sold')
  const forSaleSelected = selected.filter((c) => c.kind === 'for-sale')
  const soldAvg = soldSelected.length
    ? Math.round(soldSelected.reduce((s, c) => s + c.price, 0) / soldSelected.length)
    : 0

  return (
    <div className="fixed inset-0 z-[60] flex bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative m-auto flex h-[calc(100vh-2rem)] w-full max-w-[1180px] flex-col overflow-hidden rounded-[20px] bg-canvas shadow-[var(--shadow-pop)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-30 flex h-8 w-8 items-center justify-center rounded-full bg-surface text-ink-muted shadow-[0_1px_2px_rgba(16,24,40,0.08)] ring-1 ring-hairline hover:bg-canvas hover:text-ink"
        >
          <X size={16} />
        </button>

        {/* Header */}
        <header className="border-b border-hairline bg-surface px-6 py-4">
          <div className="flex items-center justify-between gap-6 pr-10">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-[10.5px] font-medium uppercase tracking-widest text-ink-faint">
                <Layers size={11} className="text-accent" />
                Comparative market analysis
              </div>
              <h2 className="mt-1 text-[22px] font-semibold tracking-tight">
                {step === 'select' ? 'Pick comparables' : 'Rank & annotate'}
              </h2>
            </div>
            <div className="flex shrink-0 items-center gap-3 rounded-[12px] border border-hairline bg-canvas px-3 py-2">
              <PhotoTile seed={subjectAddress + subjectSuburb} size="md" />
              <div>
                <div className="text-[10.5px] font-medium uppercase tracking-wider text-ink-faint">Subject</div>
                <div className="text-[13px] font-semibold">{subjectAddress || 'Untitled'}, {subjectSuburb}</div>
                <div className="mt-0.5 text-[11px] text-ink-muted">
                  {subjectMeta.beds}bd · {subjectMeta.baths}ba · {subjectMeta.cars}car · {subjectMeta.land}m²
                </div>
              </div>
            </div>
          </div>

          {/* Step dots */}
          <div className="mt-3 flex items-center gap-2 text-[11.5px] text-ink-muted">
            <StepDot label="Select" active={step === 'select'} onClick={() => setStep('select')} />
            <div className="h-px w-6 bg-hairline" />
            <StepDot label="Analyse" active={step === 'analyse'} onClick={() => selected.length > 0 && setStep('analyse')} disabled={selected.length === 0 && step !== 'analyse'} />
          </div>
        </header>

        {step === 'select' ? (
          <div className="flex min-h-0 flex-1">
            {/* Left column */}
            <div className="flex min-h-0 flex-1 flex-col">
              {/* Toolbar */}
              <div className="flex items-center gap-3 border-b border-hairline bg-surface px-6 py-3">
                <SegmentedTabs tab={tab} onChange={setTab} counts={counts} />
                <div className="flex flex-1 items-center gap-2 rounded-[10px] border border-hairline bg-canvas px-3 py-1.5">
                  <Search size={13} className="text-ink-faint" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search address or street"
                    className="w-full bg-transparent text-[13px] outline-none placeholder:text-ink-faint"
                  />
                </div>
                <button className="inline-flex items-center gap-1.5 rounded-[10px] border border-hairline bg-surface px-3 py-1.5 text-[12.5px] text-ink hover:border-ink-faint">
                  <ArrowUpDown size={12} className="text-ink-faint" />
                  Sort
                </button>
              </div>

              {/* Filter row (compact) */}
              <div className="flex items-center gap-2 border-b border-hairline bg-canvas/40 px-6 py-2">
                <FilterButton label="Type" value="House" active />
                <FilterButton label="Beds" value="4+" active />
                <FilterButton label="Land" value="Any" />
                <FilterButton label="Radius" value="2km" active />
                <FilterButton label="Sold" value="12 mo" active />
                <div className="flex-1" />
                <button className="inline-flex items-center gap-1.5 rounded-[10px] px-2.5 py-1.5 text-[12px] font-medium text-ink-muted hover:text-ink">
                  <SlidersHorizontal size={12} />
                  All filters
                </button>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {filtered.length === 0 ? (
                  <div className="rounded-[14px] bg-surface p-10 text-center text-[13px] text-ink-muted">
                    Nothing matches. Clear the search or widen filters.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filtered.map((c) => (
                      <MarketCard
                        key={c.id}
                        c={c}
                        selected={selectedIds.has(c.id)}
                        onOpen={() => setDetail(c)}
                        onAdd={() => toggleAdd(c)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <CMAPanel
              selected={selected}
              onRemove={removeFromSelected}
              onOpenAnalyse={() => setStep('analyse')}
            />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {selected.length === 0 ? (
              <div className="rounded-[14px] bg-surface p-10 text-center text-[13px] text-ink-muted">
                No properties selected yet. Head back to <button onClick={() => setStep('select')} className="font-medium text-accent">Select</button> to add some.
              </div>
            ) : (
              <div className="mx-auto max-w-4xl space-y-6">
                {soldSelected.length > 0 && (
                  <section>
                    <div className="mb-2 flex items-baseline justify-between">
                      <h3 className="text-[15px] font-semibold">
                        Sold ({soldSelected.length}) · avg {formatMoney(soldAvg)}
                      </h3>
                      <div className="text-[11.5px] text-ink-muted">Higher-ranked appears first in the report</div>
                    </div>
                    <div className="space-y-2">
                      {soldSelected.map((c) => {
                        const globalIdx = selected.findIndex((x) => x.id === c.id)
                        const groupIdx = soldSelected.findIndex((x) => x.id === c.id)
                        return (
                          <AnalyseRow
                            key={c.id}
                            c={c}
                            rank={groupIdx + 1}
                            isFirst={groupIdx === 0}
                            isLast={groupIdx === soldSelected.length - 1}
                            onMoveUp={() => move(globalIdx, -1)}
                            onMoveDown={() => move(globalIdx, 1)}
                            onRemove={() => removeFromSelected(c.id)}
                            onNoteChange={(v) => setNote(c.id, v)}
                          />
                        )
                      })}
                    </div>
                  </section>
                )}
                {forSaleSelected.length > 0 && (
                  <section>
                    <div className="mb-2 flex items-baseline justify-between">
                      <h3 className="text-[15px] font-semibold">For sale ({forSaleSelected.length})</h3>
                      <div className="text-[11.5px] text-ink-muted">Shows current market context</div>
                    </div>
                    <div className="space-y-2">
                      {forSaleSelected.map((c) => {
                        const globalIdx = selected.findIndex((x) => x.id === c.id)
                        const groupIdx = forSaleSelected.findIndex((x) => x.id === c.id)
                        return (
                          <AnalyseRow
                            key={c.id}
                            c={c}
                            rank={groupIdx + 1}
                            isFirst={groupIdx === 0}
                            isLast={groupIdx === forSaleSelected.length - 1}
                            onMoveUp={() => move(globalIdx, -1)}
                            onMoveDown={() => move(globalIdx, 1)}
                            onRemove={() => removeFromSelected(c.id)}
                            onNoteChange={(v) => setNote(c.id, v)}
                          />
                        )
                      })}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="flex items-center justify-between border-t border-hairline bg-surface px-6 py-3">
          {step === 'select' ? (
            <>
              <button
                onClick={onClose}
                className="rounded-[10px] px-4 py-2 text-[13px] font-medium text-ink-muted hover:bg-canvas"
              >
                Cancel
              </button>
              <div className="text-[12.5px] text-ink-muted">
                <span className="font-semibold text-ink">{selected.length}</span> selected
                {selected.length > 0 && (
                  <>
                    {' · avg '}<span className="font-medium text-ink tabular-nums">{soldAvg ? formatMoney(soldAvg) : '—'}</span>
                    <button onClick={() => setSelected([])} className="ml-3 text-accent">Clear all</button>
                  </>
                )}
              </div>
              <button
                onClick={() => onSave(selected)}
                disabled={selected.length === 0}
                className={
                  'inline-flex items-center gap-1.5 rounded-[10px] px-4 py-2 text-[13px] font-medium transition ' +
                  (selected.length === 0
                    ? 'bg-canvas text-ink-faint'
                    : 'bg-accent text-white shadow-[0_1px_2px_rgba(0,87,255,0.35)] hover:brightness-105')
                }
              >
                Save CMA
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep('select')}
                className="inline-flex items-center gap-1.5 rounded-[10px] px-4 py-2 text-[13px] font-medium text-ink-muted hover:bg-canvas"
              >
                <ArrowLeft size={13} />
                Back to select
              </button>
              <div className="text-[12.5px] text-ink-muted">
                <span className="font-semibold text-ink">{selected.length}</span> in CMA · order and notes save with it
              </div>
              <button
                onClick={() => onSave(selected)}
                className="inline-flex items-center gap-1.5 rounded-[10px] bg-accent px-4 py-2 text-[13px] font-medium text-white shadow-[0_1px_2px_rgba(0,87,255,0.35)] hover:brightness-105"
              >
                Save CMA
                <ArrowRight size={13} />
              </button>
            </>
          )}
        </footer>

        {detail && (
          <DetailDrawer
            c={detail}
            isSelected={selectedIds.has(detail.id)}
            onClose={() => setDetail(null)}
            onToggle={() => { toggleAdd(detail); setDetail(null) }}
          />
        )}
      </div>
    </div>
  )
}

function StepDot({ label, active, disabled, onClick }: { label: string; active: boolean; disabled?: boolean; onClick?: () => void }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={
        'flex items-center gap-1.5 rounded-full px-2 py-1 text-[11.5px] transition ' +
        (active ? 'text-ink' : disabled ? 'text-ink-faint' : 'text-ink-muted hover:text-ink')
      }
    >
      <span className={'flex h-4 w-4 items-center justify-center rounded-full text-[9.5px] font-semibold ' + (active ? 'bg-accent text-white' : 'bg-black/[0.08] text-ink-muted')}>
        {label === 'Select' ? '1' : '2'}
      </span>
      {label}
    </button>
  )
}
