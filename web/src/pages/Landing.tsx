import { Link } from 'react-router-dom'
import { Reveal } from '../components/Reveal'
import '../landing.css'

const PROBLEMS = [
  {
    n: '01',
    title: 'No real-time view',
    body: "Expenses don't show until reports are filed and posted, so no one can say how much of the year's budget is left right now.",
  },
  {
    n: '02',
    title: "Unclear what each expense was for",
    body: 'People get confused about which charge belongs to which trip or purpose, with no audit trail on recent spend.',
  },
  {
    n: '03',
    title: 'The wrong cost centre, the "shell game"',
    body: 'Spend gets charged to the wrong cost centre, which makes it hard to readjust future spend — an 8k charge here, quietly offset from another team’s budget there.',
  },
  {
    n: '04',
    title: 'Spreadsheets with no trace',
    body: 'Budgets and plans live in Excel files that change with no record of who changed what, or when.',
  },
]

const FLOW = [
  {
    title: 'SQL does the arithmetic',
    body: 'Amounts are computed deterministically in Postgres — never claimed by a model. A validator diffs every figure against the recomputation before it reaches a flag.',
  },
  {
    title: 'Claude classifies and explains',
    body: 'Two agents match trips to charges and reports, flag what’s outstanding or miscoded, and write a one-line reason that cites the rows behind it.',
  },
  {
    title: 'Nothing writes back',
    body: 'The agents have read-only access to source systems. A finance analyst reviews, dismisses or approves — every change is logged with who, when, and why.',
  },
]

const GOALS = [
  {
    quote: 'We saved 2 hours on a busy day making sure our T&E was on track, and had no unexpected overspend at the end of the month.',
    metric: 'Time saved · month-end surprise',
  },
  {
    quote: 'We fit all our trips and expenses into the budget we had, by readjusting and optimizing trips and their sequencing.',
    metric: 'Scenarios used before trips are cut',
  },
  {
    quote: 'Our team no longer thinks twice about what they can spend, because it shows the latest numbers for individuals and the team.',
    metric: 'View age · adoption',
  },
  {
    quote: 'I wish I had this for my own personal or family trips.',
    metric: 'Qualitative pull',
  },
]

const METRICS = [
  { value: '−80%', label: 'Finance-manager hours vs. week-1 baseline', tag: 'Phase 1 target' },
  { value: '100%', label: 'Amounts exact to the cent', tag: 'Always' },
  { value: '≤95%', label: 'Trip status accuracy on the gold set', tag: 'Phase 1 target' },
  { value: '≤24h', label: 'Source data freshness', tag: 'Phase 1 target' },
]

export function Landing() {
  return (
    <div className="land">
      <nav className="land-nav">
        <div className="brand">
          <span className="brand-mark">TE</span>
          <span className="brand-name">T&amp;E Visibility</span>
        </div>
        <div className="land-nav-links">
          <a href="#how-it-works">How it works</a>
          <a href="#goals">Why it matters</a>
          <Link to="/app" className="land-btn" style={{ height: 36, padding: '0 16px', fontSize: 13 }}>
            Sign in
          </Link>
        </div>
      </nav>

      <header className="land-hero">
        <div>
          <div className="land-eyebrow">For strategic finance managers</div>
          <h1 className="land-h1">
            Know what&rsquo;s left in the <em>T&amp;E budget</em>. Today.
          </h1>
          <Reveal delay={120}>
            <div className="land-mock">
              <div className="land-mock-bar">
                <span className="land-mock-dot" />
                <span className="land-mock-dot" />
                <span className="land-mock-dot" />
              </div>
              <div className="land-mock-body">
                <div>
                  <div className="stat-label">Outstanding spend, unexpensed</div>
                  <div className="land-mock-figure">$69,121.05</div>
                </div>
                <div>
                  <div className="stat-label">Computed in</div>
                  <div className="stat-value">SQL, not a model</div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
        <div className="land-hero-side">
          <p className="land-sub">
            It ties every expense to its trip and purpose, flags spend on the wrong cost centre, and lets your team test trip scenarios — before
            month end surprises you. Two Claude agents reconcile trips, card charges and expense reports behind it.
          </p>
          <div className="land-cta-row">
            <Link to="/app" className="land-btn">
              Sign in
            </Link>
            <a href="#how-it-works" className="land-btn land-btn-ghost">
              How it works
            </a>
          </div>
        </div>
      </header>

      <section className="land-section">
        <Reveal>
          <div className="land-kicker">The problem</div>
          <h2 className="land-h2">Finance managers can&rsquo;t see how much budget is left today, so overspend only shows up at month end.</h2>
        </Reveal>
        <div className="land-problem-grid">
          {PROBLEMS.map((p, i) => (
            <Reveal key={p.n} delay={i * 60}>
              <div className="land-problem-card">
                <span className="land-problem-num">{p.n}</span>
                <span className="land-problem-title">{p.title}</span>
                <span className="land-problem-body">{p.body}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="land-section" id="how-it-works">
        <Reveal>
          <div className="land-kicker">How it works</div>
          <h2 className="land-h2">Deterministic where it counts. Judgment where it&rsquo;s needed.</h2>
        </Reveal>
        <div className="land-flow">
          {FLOW.map((f, i) => (
            <Reveal key={f.title} delay={i * 80} className="land-flow-step">
              <span className="land-flow-num">{i + 1}</span>
              <span className="land-flow-title">{f.title}</span>
              <span className="land-flow-body">{f.body}</span>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="land-section" id="goals">
        <Reveal>
          <div className="land-kicker">What success sounds like</div>
          <h2 className="land-h2">Four things we want a finance manager to say after the pilot.</h2>
        </Reveal>
        <div className="land-goal-grid">
          {GOALS.map((g, i) => (
            <Reveal key={g.quote} delay={i * 60}>
              <div className="land-goal-card">
                <span className="land-goal-quote">&ldquo;{g.quote}&rdquo;</span>
                <span className="land-goal-metric">Maps to: {g.metric}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="land-band">
        <div className="land-section" style={{ paddingTop: 80, paddingBottom: 80 }}>
          <Reveal>
            <div className="land-kicker">Phase 1 targets</div>
            <h2 className="land-h2">Proposed targets, measured against a week-1 baseline — never assumed.</h2>
          </Reveal>
          <div className="land-metric-grid">
            {METRICS.map((m, i) => (
              <Reveal key={m.label} delay={i * 70}>
                <div className="land-metric">
                  <span className="land-metric-value">{m.value}</span>
                  <span className="land-metric-label">{m.label}</span>
                  <span className="land-metric-tag">{m.tag}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="land-section land-final">
        <Reveal>
          <h2 className="land-h2" style={{ marginBottom: 8 }}>
            Read-only on source systems. Nothing is filed or sent automatically.
          </h2>
          <p className="land-sub" style={{ maxWidth: '52ch' }}>
            The agents never write back to your card, travel or expense systems. Every change inside T&amp;E Visibility — an override, a
            dismissal, a reallocation — is logged with who, when, and why.
          </p>
        </Reveal>
        <Reveal delay={100}>
          <Link to="/app" className="land-btn">
            Sign in to your workspace
          </Link>
        </Reveal>
      </section>

      <footer className="land-footer">
        <span>T&amp;E Visibility · dummy data only in this prototype</span>
        <span>Built on Supabase, Vercel and the Claude API</span>
      </footer>
    </div>
  )
}
