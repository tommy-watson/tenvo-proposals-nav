import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  Building2,
  Check,
  ChevronRight,
  Copy,
  Link as LinkIcon,
  Mail,
  Phone,
  Send,
  Smartphone,
  X,
} from 'lucide-react'

type Channel = 'email' | 'sms' | 'link'

type Person = { id: string; name: string; email: string; phone: string }

type Props = {
  onClose: () => void
  onSend: () => void
  channel: Channel
  people: Person[]
  sendIndividually: boolean
  personalNote: string
  property: { address: string; suburb: string; postcode: string; beds: number; baths: number; cars: number; land: number }
  price: { low: number; high: number }
  variant: 'full' | 'price-update'
  agreement?: { include: boolean; method: string; periodDays: number }
  feeCommission?: number
  feeAml?: number
  marketingTotal?: number
  payLater?: boolean
  agentName?: string
  agencyName?: string
}

const formatMoney = (n: number) =>
  n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 })

function subjectLine(variant: 'full' | 'price-update', address: string) {
  return variant === 'price-update'
    ? `Price update — ${address}`
    : `Your listing proposal — ${address}`
}

function greeting(name: string, combined: boolean) {
  if (!name) return 'Hi there,'
  const firsts = name.split(/\s*&\s*|\s+and\s+/i).map((n) => n.trim().split(/\s+/)[0]).filter(Boolean)
  if (firsts.length === 0) return 'Hi there,'
  if (firsts.length === 1 || !combined) return `Hi ${firsts[0]},`
  if (firsts.length === 2) return `Hi ${firsts[0]} and ${firsts[1]},`
  return `Hi ${firsts.slice(0, -1).join(', ')} and ${firsts[firsts.length - 1]},`
}

function fillPlaceholders(text: string, firstName: string) {
  return text.replace(/\{first\s*name\}|\{first\}/gi, firstName)
}

// ─── Email body ──────────────────────────────────────────────────────────

function EmailPreview({
  toName,
  toEmail,
  greetingLine,
  note,
  property,
  price,
  variant,
  agentName,
  agencyName,
  agreement,
  feeCommission,
  feeAml,
  marketingTotal,
  payLater,
  signerFirstName,
}: {
  toName: string
  toEmail: string
  greetingLine: string
  note: string
  property: Props['property']
  price: Props['price']
  variant: Props['variant']
  agentName: string
  agencyName: string
  agreement?: Props['agreement']
  feeCommission?: number
  feeAml?: number
  marketingTotal?: number
  payLater?: boolean
  signerFirstName: string
}) {
  return (
    <div className="mx-auto max-w-[600px] rounded-[14px] border border-hairline bg-white shadow-[var(--shadow-card)]">
      {/* Header bar */}
      <div className="border-b border-hairline px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-ink text-[13px] font-semibold text-white">
            CLK
          </div>
          <div className="text-[13px] font-semibold tracking-tight">Charles L. King &amp; Co</div>
          <div className="text-[11px] text-ink-muted">· First National Echuca</div>
        </div>
      </div>

      <div className="px-6 py-6">
        <div className="text-[10.5px] font-medium uppercase tracking-widest text-ink-faint">
          {variant === 'price-update' ? 'Price update' : 'Listing proposal'}
        </div>
        <h2 className="mt-1 text-[22px] font-semibold leading-tight tracking-tight text-ink">
          For {property.address}, {property.suburb}
        </h2>

        <p className="mt-5 text-[14px] leading-relaxed text-ink">{greetingLine}</p>
        <div className="mt-3 whitespace-pre-line text-[14px] leading-relaxed text-ink">
          {note.trim() || `Thanks again for having me out — I've pulled the recent sales around you together and mapped out a plan for what a campaign would look like. Read through in your own time and call me any time with questions.`}
        </div>

        {/* Property preview card */}
        <div className="mt-6 overflow-hidden rounded-[12px] border border-hairline">
          <div className="h-[140px] w-full bg-gradient-to-br from-sky-100 to-blue-200" />
          <div className="p-4">
            <div className="text-[10.5px] font-medium uppercase tracking-widest text-ink-faint">
              Your property
            </div>
            <div className="mt-0.5 text-[16px] font-semibold tracking-tight">
              {property.address}
            </div>
            <div className="text-[12.5px] text-ink-muted">{property.suburb} NSW {property.postcode}</div>
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-ink-muted">
              <span>{property.beds}bd</span>
              <span className="text-ink-faint">·</span>
              <span>{property.baths}ba</span>
              <span className="text-ink-faint">·</span>
              <span>{property.cars}car</span>
              {property.land > 0 && (
                <>
                  <span className="text-ink-faint">·</span>
                  <span>{property.land}m²</span>
                </>
              )}
            </div>
            {price.low > 0 && price.high > 0 && (
              <div className="mt-3 rounded-[8px] bg-canvas p-3">
                <div className="text-[10.5px] font-medium uppercase tracking-widest text-ink-faint">
                  Suggested price guide
                </div>
                <div className="mt-0.5 text-[17px] font-semibold tracking-tight text-accent tabular-nums">
                  {formatMoney(price.low)} – {formatMoney(price.high)}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <button className="pointer-events-none inline-flex items-center gap-1.5 rounded-full bg-accent px-6 py-3 text-[14px] font-semibold text-white shadow-[0_4px_12px_rgba(0,87,255,0.25)]">
            View your proposal
            <ChevronRight size={15} />
          </button>
        </div>

        {agreement?.include && variant === 'full' && (
          <div className="mt-6 rounded-[14px] border border-hairline bg-canvas p-4">
            <div className="flex items-center gap-2 text-[10.5px] font-medium uppercase tracking-widest text-ink-faint">
              <span className="flex h-4 w-4 items-center justify-center rounded-[4px] bg-ink text-[9px] font-bold text-white">✎</span>
              When you're ready
            </div>
            <div className="mt-1.5 text-[15px] font-semibold tracking-tight">
              Sign the agency agreement to get us started
            </div>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">
              {signerFirstName ? `${signerFirstName}, you can` : 'You can'} sign directly inside the proposal — no printing, no scanning. Two clicks.
            </p>

            <div className="mt-3 space-y-1 rounded-[10px] bg-surface p-3 text-[12px]">
              <TermRow label="Method of sale" value={agreement.method} />
              {feeCommission !== undefined && (
                <TermRow label="Commission" value={`${feeCommission}% inc. GST${feeAml ? ` + $${feeAml} AML` : ''}`} />
              )}
              {marketingTotal !== undefined && (
                <TermRow label="Marketing" value={`${formatMoney(marketingTotal)}${payLater ? ' · paid at settlement' : ''}`} />
              )}
              <TermRow label="Agreement period" value={`${agreement.periodDays} days`} />
            </div>

            <div className="mt-3 flex justify-center">
              <button className="pointer-events-none inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-[13px] font-semibold text-white">
                Review &amp; sign
                <ChevronRight size={13} />
              </button>
            </div>
            <div className="mt-2 text-center text-[10.5px] text-ink-faint">
              Cooling-off period applies · powered by Tenvo · secure e-signature
            </div>
          </div>
        )}

        <p className="mt-6 text-[12.5px] leading-relaxed text-ink-muted">
          No rush and no pressure — take your time. If anything's not clear, or you'd like to change something, just call or reply here.
        </p>

        <div className="mt-6 border-t border-hairline pt-5">
          <div className="text-[13.5px] font-semibold">{agentName}</div>
          <div className="text-[12px] text-ink-muted">Licensed Estate Agent · {agencyName}</div>
          <div className="mt-1 flex items-center gap-3 text-[12px] text-ink-muted">
            <span className="inline-flex items-center gap-1"><Phone size={11} />03 5482 2111</span>
            <span className="inline-flex items-center gap-1"><Building2 size={11} />172 Hare St, Echuca</span>
          </div>
        </div>
      </div>

      <div className="border-t border-hairline bg-canvas/60 px-6 py-3 text-center text-[10.5px] text-ink-faint">
        Sent from Tenvo · You can unsubscribe or reply directly to {toName || 'Tom'} at any time.
      </div>
    </div>
  )
}

// ─── SMS body ────────────────────────────────────────────────────────────

function SMSPreview({ toName, toPhone, address, agentFirstName }: { toName: string; toPhone: string; address: string; agentFirstName: string }) {
  const text = `Hi ${toName.split(/\s+/)[0] || 'there'}, ${agentFirstName} here. Here's the listing proposal we talked about for ${address} — no rush, have a read when you get a chance: https://tenvo.link/p/x9k2 · Call any time.`
  return (
    <div className="mx-auto max-w-[380px]">
      <div className="mb-2 flex items-center justify-between px-2 text-[11px] text-ink-muted">
        <span>To: {toPhone || '—'}</span>
        <span>{text.length}/160 chars</span>
      </div>
      {/* Phone chrome */}
      <div className="overflow-hidden rounded-[36px] border-[10px] border-ink bg-white shadow-[0_10px_30px_-8px_rgba(16,24,40,0.4)]">
        <div className="flex items-center justify-between bg-canvas px-5 py-1.5 text-[11px] font-semibold">
          <span>9:41</span>
          <span>iMessage</span>
          <span>••</span>
        </div>
        <div className="min-h-[300px] bg-canvas/60 px-4 py-6">
          <div className="mx-auto mb-3 text-center text-[11px] text-ink-muted">
            SMS · Today 3:12 PM
          </div>
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-[18px] rounded-bl-[4px] bg-white px-3.5 py-2.5 text-[13.5px] leading-relaxed text-ink shadow-[0_1px_2px_rgba(16,24,40,0.06)]">
              {text}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Link preview ────────────────────────────────────────────────────────

function LinkPreview({ shareLink }: { shareLink: string }) {
  return (
    <div className="mx-auto max-w-[560px] rounded-[14px] border border-hairline bg-white p-5 shadow-[var(--shadow-card)]">
      <div className="text-[10.5px] font-medium uppercase tracking-widest text-ink-faint">
        Shareable link
      </div>
      <div className="mt-2 flex items-center gap-2 rounded-[10px] border border-hairline bg-canvas px-3 py-2.5">
        <LinkIcon size={14} className="text-ink-faint" />
        <code className="flex-1 truncate text-[13px] tabular-nums text-ink">{shareLink}</code>
        <button className="inline-flex items-center gap-1 rounded-[8px] bg-ink px-2.5 py-1 text-[11.5px] font-medium text-white hover:brightness-110">
          <Copy size={11} />
          Copy
        </button>
      </div>
      <div className="mt-4 rounded-[10px] bg-canvas p-3">
        <div className="text-[11.5px] font-semibold">Anyone with the link can view</div>
        <div className="mt-1 text-[11.5px] leading-relaxed text-ink-muted">
          You'll still get open + view tracking, but views won't be tied to a specific vendor. Best when you want to share via WhatsApp, text or from your own inbox.
        </div>
      </div>
    </div>
  )
}

// ─── Main modal ──────────────────────────────────────────────────────────

export default function SendPreview({
  onClose,
  onSend,
  channel,
  people,
  sendIndividually,
  personalNote,
  property,
  price,
  variant,
  agreement,
  feeCommission,
  feeAml,
  marketingTotal,
  payLater,
  agentName = 'Tom Watson',
  agencyName = 'Charles L. King & Co · First National Echuca',
}: Props) {
  const [activeIdx, setActiveIdx] = useState(0)

  // For combined send with multiple people, we render one email with combined greeting
  const recipients = useMemo(() => {
    if (sendIndividually) return people
    // Combined: one virtual recipient with joined names
    const joinedName = people.map((p) => p.name.trim()).filter(Boolean).join(' & ')
    const emails = people.map((p) => p.email.trim()).filter(Boolean).join(', ')
    const phones = people.map((p) => p.phone.trim()).filter(Boolean).join(', ')
    return [{ id: 'combined', name: joinedName, email: emails, phone: phones }]
  }, [people, sendIndividually])

  const active = recipients[Math.min(activeIdx, recipients.length - 1)]

  const filledNote = fillPlaceholders(personalNote, active?.name.split(/\s+/)[0] ?? '')
  const greetingLine = greeting(active?.name ?? '', !sendIndividually)
  const subject = subjectLine(variant, property.address || 'your property')
  const shareLink = `https://tenvo.link/p/${property.address ? property.address.split(/\s+/)[0].toLowerCase() : 'x9k2'}-${property.suburb.toLowerCase() || 'nsw'}`

  const channelLabel = channel === 'email' ? 'email' : channel === 'sms' ? 'SMS' : 'shareable link'
  const sendCta =
    channel === 'link'
      ? 'Copy link'
      : sendIndividually && people.length > 1
      ? `Send ${people.length} ${channelLabel}s now`
      : `Send ${channelLabel} now`

  return (
    <div className="fixed inset-0 z-[70] flex bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative m-auto flex h-[calc(100vh-2rem)] w-full max-w-[880px] flex-col overflow-hidden rounded-[20px] bg-canvas shadow-[var(--shadow-pop)]"
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
        <header className="border-b border-hairline bg-surface px-6 py-4 pr-14">
          <div className="text-[10.5px] font-medium uppercase tracking-widest text-ink-faint">
            Preview · nothing sent yet
          </div>
          <h2 className="mt-0.5 text-[19px] font-semibold tracking-tight">
            {channel === 'email' && 'Email preview'}
            {channel === 'sms' && 'SMS preview'}
            {channel === 'link' && 'Shareable link preview'}
          </h2>

          {/* Per-recipient tabs when sending individually */}
          {sendIndividually && recipients.length > 1 && (
            <div className="mt-3 flex items-center gap-1 overflow-x-auto">
              {recipients.map((r, i) => (
                <button
                  key={r.id}
                  onClick={() => setActiveIdx(i)}
                  className={
                    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] transition ' +
                    (i === activeIdx
                      ? 'border-accent bg-accent-tint text-accent'
                      : 'border-hairline bg-surface text-ink-muted hover:border-ink-faint hover:text-ink')
                  }
                >
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9.5px] font-semibold tabular-nums text-ink-muted">
                    {i + 1}
                  </span>
                  <span className="font-medium">{r.name.split(/\s+/)[0] || 'Unnamed'}</span>
                  {channel === 'email' && !r.email && (
                    <span className="rounded-full bg-danger-soft px-1.5 py-0.5 text-[9.5px] font-medium uppercase tracking-wider text-danger">
                      missing
                    </span>
                  )}
                  {channel === 'sms' && !r.phone && (
                    <span className="rounded-full bg-danger-soft px-1.5 py-0.5 text-[9.5px] font-medium uppercase tracking-wider text-danger">
                      missing
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </header>

        {/* Preview area */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {channel === 'email' && (
            <>
              <div className="mx-auto mb-4 max-w-[600px] space-y-1.5 rounded-[12px] border border-hairline bg-surface p-3.5 text-[12.5px]">
                <MetaRow label="From" value={`${agentName} <tom@charleslking.com.au>`} />
                <MetaRow label="To" value={active?.email || 'missing email'} tone={active?.email ? undefined : 'danger'} />
                <MetaRow label="Subject" value={subject} bold />
              </div>
              <EmailPreview
                toName={active?.name ?? ''}
                toEmail={active?.email ?? ''}
                greetingLine={greetingLine}
                note={filledNote}
                property={property}
                price={price}
                variant={variant}
                agentName={agentName}
                agencyName={agencyName}
                agreement={agreement}
                feeCommission={feeCommission}
                feeAml={feeAml}
                marketingTotal={marketingTotal}
                payLater={payLater}
                signerFirstName={active?.name.split(/\s+/)[0] ?? ''}
              />
            </>
          )}
          {channel === 'sms' && (
            <SMSPreview
              toName={active?.name ?? ''}
              toPhone={active?.phone ?? ''}
              address={property.address || 'your property'}
              agentFirstName={agentName.split(/\s+/)[0]}
            />
          )}
          {channel === 'link' && <LinkPreview shareLink={shareLink} />}
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between border-t border-hairline bg-surface px-6 py-3">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-[10px] px-4 py-2 text-[13px] font-medium text-ink-muted hover:bg-canvas"
          >
            <ArrowLeft size={13} />
            Back to review
          </button>

          <div className="text-[12px] text-ink-muted">
            {sendIndividually && recipients.length > 1 ? (
              <>
                Recipient <span className="font-semibold text-ink">{activeIdx + 1}</span> of {recipients.length}
                {' — '}
                <span className="text-accent">
                  {recipients.filter((r) =>
                    channel === 'email' ? r.email : channel === 'sms' ? r.phone : true,
                  ).length}
                  {' / '}
                  {recipients.length} ready
                </span>
              </>
            ) : (
              <>Preview only · nothing has been sent yet</>
            )}
          </div>

          <button
            onClick={onSend}
            className="inline-flex items-center gap-1.5 rounded-[10px] bg-accent px-4 py-2 text-[13px] font-medium text-white shadow-[0_1px_2px_rgba(0,87,255,0.35)] hover:brightness-105"
          >
            {channel === 'email' && <Mail size={13} />}
            {channel === 'sms' && <Smartphone size={13} />}
            {channel === 'link' && <Copy size={13} />}
            {sendCta}
          </button>
        </footer>
      </div>
    </div>
  )
}

function TermRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-hairline/50 py-1 last:border-b-0">
      <span className="text-[11px] text-ink-muted">{label}</span>
      <span className="text-[12px] font-semibold text-ink">{value}</span>
    </div>
  )
}

function MetaRow({ label, value, bold, tone }: { label: string; value: string; bold?: boolean; tone?: 'danger' }) {
  return (
    <div className="grid grid-cols-[64px_1fr] items-baseline gap-3">
      <div className="text-[10.5px] font-medium uppercase tracking-wider text-ink-faint">{label}</div>
      <div
        className={
          (bold ? 'font-semibold text-ink ' : 'text-ink-muted ') +
          (tone === 'danger' ? 'text-danger' : '')
        }
      >
        {value}
      </div>
    </div>
  )
}

// Silence unused-import warning
void Check
void Send
