import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  FileSignature,
  Hash,
  Loader2,
  Mail,
  Plus,
  Send,
  Trash2,
  Type,
  Upload,
  User,
  X,
} from 'lucide-react'
import { TopBar } from './NewAgreementFlow'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

// ─── Types ───────────────────────────────────────────────────────────────

type FieldType = 'signature' | 'initial' | 'name' | 'date' | 'text'

type Signer = {
  id: string
  name: string
  email: string
  color: string
  swatch: string
}

type PlacedField = {
  id: string
  type: FieldType
  page: number
  x: number
  y: number
  w: number
  h: number
  signerId: string
  label?: string
}

type PageDim = { width: number; height: number }

type Screen = 'upload' | 'build' | 'sent'

// ─── Palette ─────────────────────────────────────────────────────────────

const signerPalette: { color: string; swatch: string }[] = [
  { color: '#0057ff', swatch: '#e8efff' },
  { color: '#8b5cf6', swatch: '#efe9ff' },
  { color: '#f59e0b', swatch: '#fff2df' },
  { color: '#34c759', swatch: '#e6f7ea' },
  { color: '#ef4444', swatch: '#ffe5e3' },
  { color: '#06b6d4', swatch: '#e0f7fb' },
]

const fieldDefs: Record<FieldType, { label: string; icon: React.ComponentType<{ size?: number }>; w: number; h: number }> = {
  signature: { label: 'Signature', icon: FileSignature, w: 0.24, h: 0.055 },
  initial:   { label: 'Initial',   icon: Hash,          w: 0.08, h: 0.055 },
  name:      { label: 'Name',      icon: User,          w: 0.22, h: 0.035 },
  date:      { label: 'Date',      icon: Calendar,      w: 0.14, h: 0.035 },
  text:      { label: 'Text',      icon: Type,          w: 0.22, h: 0.035 },
}

const uid = () => Math.random().toString(36).slice(2, 10)

// ─── Component ───────────────────────────────────────────────────────────

export default function SignAnythingBuilder({
  onBack,
  onClose,
}: {
  onBack: () => void
  onClose: () => void
}) {
  const [screen, setScreen] = useState<Screen>('upload')
  const [file, setFile] = useState<File | null>(null)

  if (screen === 'sent') {
    return <SentScreen fileName={file?.name ?? 'Document'} onClose={onClose} />
  }
  if (screen === 'build' && file) {
    return (
      <BuildScreen
        file={file}
        onBack={() => {
          setScreen('upload')
          setFile(null)
        }}
        onClose={onClose}
        onSend={() => setScreen('sent')}
      />
    )
  }
  return (
    <UploadScreen
      onBack={onBack}
      onClose={onClose}
      onPick={(f) => {
        setFile(f)
        setScreen('build')
      }}
    />
  )
}

// ─── Upload screen ───────────────────────────────────────────────────────

function UploadScreen({
  onBack,
  onClose,
  onPick,
}: {
  onBack: () => void
  onClose: () => void
  onPick: (f: File) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const accept = (f: File | undefined) => {
    if (!f) return
    if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
      alert('Please choose a PDF file.')
      return
    }
    onPick(f)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-canvas">
      <TopBar onBack={onBack} onClose={onClose} eyebrow="Sign anything" title="Upload a document" />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[720px] px-8 py-16">
          <h2 className="text-[24px] font-semibold tracking-tight">Upload the PDF you want signed</h2>
          <p className="mt-1 text-[13px] text-ink-muted">
            Any PDF — a supplier contract, a builder's approval, a private treaty variation. Drag and drop, or browse. On the
            next screen you'll place signature, initial, name and date fields wherever they need to go.
          </p>

          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              accept(e.dataTransfer.files?.[0])
            }}
            onClick={() => inputRef.current?.click()}
            className={
              'mt-8 flex cursor-pointer flex-col items-center justify-center rounded-[20px] border-2 border-dashed bg-surface p-16 text-center transition ' +
              (dragOver ? 'border-accent bg-accent-tint' : 'border-hairline hover:border-ink-faint')
            }
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
              <Upload size={22} />
            </div>
            <div className="mt-4 text-[16px] font-semibold">Drop a PDF here</div>
            <div className="mt-1 text-[12.5px] text-ink-muted">or click to browse — up to 20MB</div>
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => accept(e.target.files?.[0] ?? undefined)}
            />
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <FeatureBlurb icon={<FileSignature size={14} />} title="Signatures & initials" body="Drag onto any page, assign to any signer." />
            <FeatureBlurb icon={<User size={14} />} title="Name, date, text" body="Auto-filled from the signer's profile when signed." />
            <FeatureBlurb icon={<Mail size={14} />} title="No account needed" body="Signers get an email link — mobile-friendly." />
          </div>
        </div>
      </div>
    </div>
  )
}

function FeatureBlurb({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-[12px] bg-surface p-4 shadow-[var(--shadow-card)]">
      <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-accent-soft text-accent">{icon}</div>
      <div className="mt-2 text-[12.5px] font-semibold">{title}</div>
      <div className="mt-0.5 text-[11.5px] leading-relaxed text-ink-muted">{body}</div>
    </div>
  )
}

// ─── Build screen ────────────────────────────────────────────────────────

function BuildScreen({
  file,
  onBack,
  onClose,
  onSend,
}: {
  file: File
  onBack: () => void
  onClose: () => void
  onSend: () => void
}) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null)
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageDims, setPageDims] = useState<Record<number, PageDim>>({})
  const [loading, setLoading] = useState(true)
  const [renderError, setRenderError] = useState<string | null>(null)

  const [signers, setSigners] = useState<Signer[]>([
    { id: uid(), name: '', email: '', ...signerPalette[0] },
  ])
  const [activeSignerId, setActiveSignerId] = useState<string>('')
  const [activeTool, setActiveTool] = useState<FieldType | null>(null)
  const [fields, setFields] = useState<PlacedField[]>([])

  useEffect(() => {
    setActiveSignerId((prev) => prev || signers[0]?.id || '')
  }, [signers])

  // Load PDF
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setRenderError(null)
    file
      .arrayBuffer()
      .then((buf) => pdfjsLib.getDocument({ data: buf }).promise)
      .then(async (doc) => {
        if (cancelled) return
        setPdf(doc)
        setNumPages(doc.numPages)
        setCurrentPage(1)
        const dims: Record<number, PageDim> = {}
        for (let i = 1; i <= doc.numPages; i++) {
          const p = await doc.getPage(i)
          const vp = p.getViewport({ scale: 1 })
          dims[i] = { width: vp.width, height: vp.height }
        }
        if (cancelled) return
        setPageDims(dims)
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        console.error(err)
        setRenderError('Could not read that PDF. Try another file.')
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [file])

  const addSigner = () => {
    const colorIdx = signers.length % signerPalette.length
    const s: Signer = { id: uid(), name: '', email: '', ...signerPalette[colorIdx] }
    setSigners((prev) => [...prev, s])
    setActiveSignerId(s.id)
  }

  const removeSigner = (id: string) => {
    setSigners((prev) => prev.filter((s) => s.id !== id))
    setFields((prev) => prev.filter((f) => f.signerId !== id))
    if (activeSignerId === id) {
      const rest = signers.filter((s) => s.id !== id)
      setActiveSignerId(rest[0]?.id ?? '')
    }
  }

  const updateSigner = (id: string, patch: Partial<Signer>) => {
    setSigners((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  const placeField = (type: FieldType, xFrac: number, yFrac: number) => {
    if (!activeSignerId) return
    const def = fieldDefs[type]
    const field: PlacedField = {
      id: uid(),
      type,
      page: currentPage,
      x: Math.max(0, Math.min(1 - def.w, xFrac - def.w / 2)),
      y: Math.max(0, Math.min(1 - def.h, yFrac - def.h / 2)),
      w: def.w,
      h: def.h,
      signerId: activeSignerId,
    }
    setFields((prev) => [...prev, field])
  }

  const moveField = (id: string, xFrac: number, yFrac: number) => {
    setFields((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f
        return {
          ...f,
          x: Math.max(0, Math.min(1 - f.w, xFrac)),
          y: Math.max(0, Math.min(1 - f.h, yFrac)),
        }
      }),
    )
  }

  const removeField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id))
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveTool(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const pageFields = useMemo(() => fields.filter((f) => f.page === currentPage), [fields, currentPage])

  const readyToSend = signers.every((s) => s.name.trim() && s.email.trim()) && fields.length > 0 && signers.length > 0

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-canvas">
      <TopBar
        onBack={onBack}
        onClose={onClose}
        eyebrow="Sign anything"
        title={file.name}
        right={
          <>
            <div className="mr-2 text-[11.5px] text-ink-muted">
              {fields.length} field{fields.length === 1 ? '' : 's'} · {signers.length} signer{signers.length === 1 ? '' : 's'}
            </div>
            <button
              onClick={onSend}
              disabled={!readyToSend}
              className={
                'inline-flex items-center gap-1.5 rounded-[10px] px-3.5 py-2 text-[12.5px] font-medium transition ' +
                (readyToSend
                  ? 'bg-accent text-white hover:brightness-105'
                  : 'cursor-not-allowed bg-black/[0.05] text-ink-faint')
              }
            >
              <Send size={13} /> Send for signature
            </button>
          </>
        }
      />

      <div className="grid flex-1 grid-cols-[280px_1fr_240px] overflow-hidden">
        {/* Signers */}
        <aside className="overflow-y-auto border-r border-hairline bg-surface p-4">
          <div className="mb-2 flex items-baseline justify-between">
            <div className="text-[11.5px] font-medium uppercase tracking-[0.08em] text-ink-faint">Signers</div>
            <button
              onClick={addSigner}
              className="inline-flex items-center gap-1 text-[11.5px] font-medium text-accent hover:brightness-110"
            >
              <Plus size={11} /> Add
            </button>
          </div>
          <p className="mb-3 text-[11.5px] text-ink-muted">
            Fields you place will be assigned to the highlighted signer.
          </p>
          <div className="space-y-2">
            {signers.map((s, idx) => (
              <SignerRow
                key={s.id}
                signer={s}
                index={idx + 1}
                active={s.id === activeSignerId}
                onActivate={() => setActiveSignerId(s.id)}
                onChange={(patch) => updateSigner(s.id, patch)}
                onRemove={signers.length > 1 ? () => removeSigner(s.id) : undefined}
                fieldCount={fields.filter((f) => f.signerId === s.id).length}
              />
            ))}
          </div>
        </aside>

        {/* Canvas */}
        <main className="relative overflow-y-auto bg-canvas">
          {loading && (
            <div className="flex h-full items-center justify-center gap-2 text-[13px] text-ink-muted">
              <Loader2 size={16} className="animate-spin" /> Loading PDF…
            </div>
          )}
          {renderError && (
            <div className="flex h-full items-center justify-center text-[13px] text-danger">{renderError}</div>
          )}
          {pdf && !loading && !renderError && pageDims[currentPage] && (
            <PageCanvas
              pdf={pdf}
              pageNumber={currentPage}
              baseDim={pageDims[currentPage]}
              fields={pageFields}
              signers={signers}
              activeTool={activeTool}
              onPlaceField={placeField}
              onMoveField={moveField}
              onRemoveField={removeField}
            />
          )}
          {numPages > 1 && (
            <PageNav
              current={currentPage}
              total={numPages}
              onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
              onNext={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
            />
          )}
        </main>

        {/* Palette */}
        <aside className="overflow-y-auto border-l border-hairline bg-surface p-4">
          <div className="mb-2 text-[11.5px] font-medium uppercase tracking-[0.08em] text-ink-faint">Fields</div>
          <p className="mb-3 text-[11.5px] text-ink-muted">
            Click a field, then click on the document where it should go. Drag placed fields to reposition.
          </p>
          <div className="space-y-1.5">
            {(Object.keys(fieldDefs) as FieldType[]).map((t) => (
              <FieldToolButton
                key={t}
                type={t}
                active={activeTool === t}
                onClick={() => setActiveTool(activeTool === t ? null : t)}
                disabled={!activeSignerId}
              />
            ))}
          </div>
          {activeTool && (
            <div className="mt-3 flex items-start gap-2 rounded-[10px] bg-accent-tint px-3 py-2 text-[11.5px] text-ink-muted">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              Click on the page to place a {fieldDefs[activeTool].label.toLowerCase()}. Press Esc to cancel.
            </div>
          )}

          <div className="mt-6 border-t border-hairline pt-4">
            <div className="mb-2 text-[11.5px] font-medium uppercase tracking-[0.08em] text-ink-faint">
              Pages ({numPages})
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {Array.from({ length: numPages }, (_, i) => i + 1).map((n) => {
                const count = fields.filter((f) => f.page === n).length
                return (
                  <button
                    key={n}
                    onClick={() => setCurrentPage(n)}
                    className={
                      'relative flex aspect-[3/4] items-center justify-center rounded-[6px] border text-[10.5px] font-medium transition ' +
                      (n === currentPage
                        ? 'border-accent bg-accent-tint text-accent'
                        : 'border-hairline bg-canvas text-ink-muted hover:border-ink-faint')
                    }
                  >
                    {n}
                    {count > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[9px] font-semibold text-white">
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

// ─── Signer row ──────────────────────────────────────────────────────────

function SignerRow({
  signer,
  index,
  active,
  onActivate,
  onChange,
  onRemove,
  fieldCount,
}: {
  signer: Signer
  index: number
  active: boolean
  onActivate: () => void
  onChange: (patch: Partial<Signer>) => void
  onRemove?: () => void
  fieldCount: number
}) {
  return (
    <div
      onClick={onActivate}
      className={
        'cursor-pointer rounded-[12px] border bg-surface p-3 transition ' +
        (active ? 'border-transparent shadow-[0_0_0_2px_var(--color-accent)]' : 'border-hairline hover:border-ink-faint')
      }
    >
      <div className="flex items-center gap-2">
        <div
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold"
          style={{ background: signer.swatch, color: signer.color }}
        >
          {index}
        </div>
        <div className="flex-1 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-faint">
          Signer {index}
        </div>
        <span className="text-[10.5px] text-ink-faint">
          {fieldCount} field{fieldCount === 1 ? '' : 's'}
        </span>
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="rounded p-1 text-ink-faint hover:bg-canvas hover:text-danger"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
      <input
        value={signer.name}
        onChange={(e) => onChange({ name: e.target.value })}
        onClick={(e) => e.stopPropagation()}
        placeholder="Full name"
        className="mt-2 w-full rounded-[8px] border border-hairline bg-canvas px-2.5 py-1.5 text-[12.5px] outline-none placeholder:text-ink-faint focus:border-accent focus:bg-surface"
      />
      <input
        value={signer.email}
        onChange={(e) => onChange({ email: e.target.value })}
        onClick={(e) => e.stopPropagation()}
        placeholder="Email"
        type="email"
        className="mt-1.5 w-full rounded-[8px] border border-hairline bg-canvas px-2.5 py-1.5 text-[12.5px] outline-none placeholder:text-ink-faint focus:border-accent focus:bg-surface"
      />
    </div>
  )
}

// ─── Field tool button ───────────────────────────────────────────────────

function FieldToolButton({
  type,
  active,
  onClick,
  disabled,
}: {
  type: FieldType
  active: boolean
  onClick: () => void
  disabled?: boolean
}) {
  const def = fieldDefs[type]
  const Icon = def.icon
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={
        'flex w-full items-center gap-2.5 rounded-[10px] border px-3 py-2 text-[12.5px] font-medium transition ' +
        (disabled
          ? 'cursor-not-allowed border-hairline bg-canvas text-ink-faint'
          : active
            ? 'border-transparent bg-accent text-white shadow-[0_0_0_1px_var(--color-accent)]'
            : 'border-hairline bg-surface text-ink hover:border-ink-faint')
      }
    >
      <Icon size={14} />
      {def.label}
    </button>
  )
}

// ─── Page canvas + field overlay ─────────────────────────────────────────

function PageCanvas({
  pdf,
  pageNumber,
  baseDim,
  fields,
  signers,
  activeTool,
  onPlaceField,
  onMoveField,
  onRemoveField,
}: {
  pdf: PDFDocumentProxy
  pageNumber: number
  baseDim: PageDim
  fields: PlacedField[]
  signers: Signer[]
  activeTool: FieldType | null
  onPlaceField: (t: FieldType, x: number, y: number) => void
  onMoveField: (id: string, x: number, y: number) => void
  onRemoveField: (id: string) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(800)
  const [rendering, setRendering] = useState(true)

  // Resize observer
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width
      if (w) setContainerWidth(w)
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const displayWidth = Math.min(containerWidth - 64, 900)
  const scale = displayWidth / baseDim.width
  const displayHeight = baseDim.height * scale

  // Render current page
  useEffect(() => {
    let cancelled = false
    const canvas = canvasRef.current
    if (!canvas) return
    setRendering(true)
    ;(async () => {
      const page = await pdf.getPage(pageNumber)
      const dpr = window.devicePixelRatio || 1
      const viewport = page.getViewport({ scale: scale * dpr })
      canvas.width = viewport.width
      canvas.height = viewport.height
      canvas.style.width = `${displayWidth}px`
      canvas.style.height = `${displayHeight}px`
      const ctx = canvas.getContext('2d')
      if (!ctx || cancelled) return
      await page.render({ canvasContext: ctx, viewport, canvas }).promise
      if (!cancelled) setRendering(false)
    })().catch(() => {})
    return () => {
      cancelled = true
    }
  }, [pdf, pageNumber, scale, displayWidth, displayHeight])

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeTool) return
    const rect = e.currentTarget.getBoundingClientRect()
    const xFrac = (e.clientX - rect.left) / rect.width
    const yFrac = (e.clientY - rect.top) / rect.height
    onPlaceField(activeTool, xFrac, yFrac)
  }

  return (
    <div ref={containerRef} className="flex justify-center px-8 py-8">
      <div className="relative" style={{ width: displayWidth }}>
        <div className="rounded-[8px] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.06),0_10px_30px_rgba(16,24,40,0.08)]">
          <canvas ref={canvasRef} className={rendering ? 'opacity-0' : 'opacity-100 transition-opacity'} />
        </div>

        <div
          onClick={handleClick}
          className={
            'absolute inset-0 ' + (activeTool ? 'cursor-crosshair' : 'cursor-default')
          }
          style={{ width: displayWidth, height: displayHeight }}
        >
          {fields.map((f) => {
            const signer = signers.find((s) => s.id === f.signerId)
            if (!signer) return null
            return (
              <FieldChip
                key={f.id}
                field={f}
                signer={signer}
                canvasWidth={displayWidth}
                canvasHeight={displayHeight}
                onMove={(x, y) => onMoveField(f.id, x, y)}
                onRemove={() => onRemoveField(f.id)}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Placed field chip (draggable) ───────────────────────────────────────

function FieldChip({
  field,
  signer,
  canvasWidth,
  canvasHeight,
  onMove,
  onRemove,
}: {
  field: PlacedField
  signer: Signer
  canvasWidth: number
  canvasHeight: number
  onMove: (xFrac: number, yFrac: number) => void
  onRemove: () => void
}) {
  const def = fieldDefs[field.type]
  const Icon = def.icon
  const [dragging, setDragging] = useState(false)
  const [hover, setHover] = useState(false)
  const dragState = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null)

  const left = field.x * canvasWidth
  const top = field.y * canvasHeight
  const width = field.w * canvasWidth
  const height = field.h * canvasHeight

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      dragState.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: field.x,
        origY: field.y,
      }
      setDragging(true)
    },
    [field.x, field.y],
  )

  useEffect(() => {
    if (!dragging) return
    const onMove_ = (e: MouseEvent) => {
      const st = dragState.current
      if (!st) return
      const dx = (e.clientX - st.startX) / canvasWidth
      const dy = (e.clientY - st.startY) / canvasHeight
      onMove(st.origX + dx, st.origY + dy)
    }
    const onUp = () => {
      dragState.current = null
      setDragging(false)
    }
    window.addEventListener('mousemove', onMove_)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove_)
      window.removeEventListener('mouseup', onUp)
    }
  }, [dragging, canvasWidth, canvasHeight, onMove])

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={(e) => e.stopPropagation()}
      className="absolute flex select-none items-center gap-1.5 rounded-[4px] border-2 px-1.5 text-[10.5px] font-medium"
      style={{
        left,
        top,
        width,
        height,
        borderColor: signer.color,
        background: signer.swatch,
        color: signer.color,
        cursor: dragging ? 'grabbing' : 'grab',
        opacity: dragging ? 0.85 : 1,
      }}
    >
      <Icon size={11} />
      <span className="truncate">{def.label}</span>
      {(hover || dragging) && (
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-white text-ink-muted shadow-[0_1px_2px_rgba(16,24,40,0.1)] hover:text-danger"
        >
          <X size={9} strokeWidth={2.5} />
        </button>
      )}
    </div>
  )
}

// ─── Page nav ────────────────────────────────────────────────────────────

function PageNav({
  current,
  total,
  onPrev,
  onNext,
}: {
  current: number
  total: number
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <div className="pointer-events-none sticky bottom-4 flex justify-center">
      <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-surface px-1.5 py-1 shadow-[var(--shadow-pop)]">
        <button
          onClick={onPrev}
          disabled={current === 1}
          className="rounded-full p-1.5 text-ink-muted transition hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={14} />
        </button>
        <div className="px-2 text-[12px] font-medium tabular-nums text-ink">
          {current} <span className="text-ink-faint">/ {total}</span>
        </div>
        <button
          onClick={onNext}
          disabled={current === total}
          className="rounded-full p-1.5 text-ink-muted transition hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

// ─── Sent screen ─────────────────────────────────────────────────────────

function SentScreen({ fileName, onClose }: { fileName: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-canvas p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success-soft text-success">
        <Check size={22} strokeWidth={2.5} />
      </div>
      <h2 className="mt-4 text-[22px] font-semibold tracking-tight">Sent for signature</h2>
      <p className="mt-1 max-w-[420px] text-[13px] text-ink-muted">
        {fileName} is on its way. Signers will receive an email link — you'll see view and signature events on the agreement.
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
