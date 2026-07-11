import { Link } from '@tanstack/react-router'
import {
  ArrowRight,
  Braces,
  Cloud,
  Component,
  Layers3,
  MousePointer2,
  Sparkles,
  UsersRound,
} from 'lucide-react'

function OffsetMark() {
  return (
    <span className="landing-logo-mark" aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  )
}

function ProductPreview() {
  return (
    <div className="product-preview" aria-label="Offset editor preview">
      <div className="preview-topbar">
        <div className="preview-brand">
          <OffsetMark />
          <span>OFFSET</span>
        </div>
        <span className="preview-document">Northwind launch</span>
        <div className="preview-people">
          <i />
          <i />
          <i />
          <button type="button">Share</button>
        </div>
      </div>
      <div className="preview-workspace">
        <div className="preview-layers">
          <span className="preview-panel-title">Layers</span>
          {[
            'Northwind — Desktop',
            'Hero still life',
            'Hero heading',
            'Primary action',
            'Northwind — Mobile',
          ].map((layer, index) => (
            <div
              className="preview-layer"
              data-active={index === 2}
              key={layer}
              style={
                {
                  '--indent': index === 0 || index === 4 ? 0 : 1,
                } as React.CSSProperties
              }
            >
              <Layers3 size={10} />
              <span>{layer}</span>
              <i />
            </div>
          ))}
        </div>
        <div className="preview-canvas">
          <div className="preview-toolrail">
            <MousePointer2 />
            <span />
            <Component />
            <Braces />
          </div>
          <div className="preview-artboard">
            <span className="mock-brand">NORTHWIND</span>
            <span className="mock-kicker">OBJECTS / 2026 EDITION</span>
            <h3>
              Objects for
              <br />
              slower mornings.
            </h3>
            <p>
              A considered collection of tactile forms, made for the rituals
              that make a day yours.
            </p>
            <button type="button">Explore the edit ↗</button>
            <div className="mock-art">
              <i />
              <i />
              <b />
            </div>
            <div className="mock-selection">
              <span>Hero heading</span>
              <i />
            </div>
          </div>
          <div className="preview-mobile">
            <div className="mobile-art" />
            <span>
              Form follows
              <br />
              feeling.
            </span>
          </div>
          <div className="mock-cursor cursor-one">
            <svg viewBox="0 0 18 22">
              <path d="M1 1.4 16.2 12l-7.1 1.15-3.8 6.1L1 1.4Z" />
            </svg>
            <span>Mika</span>
          </div>
          <div className="mock-cursor cursor-two">
            <svg viewBox="0 0 18 22">
              <path d="M1 1.4 16.2 12l-7.1 1.15-3.8 6.1L1 1.4Z" />
            </svg>
            <span>Noor</span>
          </div>
        </div>
        <div className="preview-inspector">
          <span className="preview-panel-title">Inspector</span>
          <label>
            Layer
            <input value="Hero heading" readOnly />
          </label>
          <span className="preview-rule" />
          <small>TRANSFORM</small>
          <div className="preview-input-grid">
            <span>X&nbsp; 56</span>
            <span>Y&nbsp; 190</span>
            <span>W&nbsp; 520</span>
            <span>H&nbsp; 192</span>
          </div>
          <span className="preview-rule" />
          <small>TYPOGRAPHY</small>
          <label>
            Typeface
            <input value="Newsreader" readOnly />
          </label>
          <div className="preview-input-grid">
            <span>Size&nbsp; 72</span>
            <span>Line&nbsp; .94</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const features = [
  {
    number: '01',
    icon: Component,
    title: 'Design with the real thing',
    copy: 'Every object is live React and HTML—not a flattened imitation. Inspect it, edit it, and ship it from the same model.',
  },
  {
    number: '02',
    icon: Layers3,
    title: 'Structure stays visible',
    copy: 'Nested frames, named layers, lock states, visibility, precise transforms, and type controls keep complex scenes legible.',
  },
  {
    number: '03',
    icon: UsersRound,
    title: 'Multiplayer by default',
    copy: 'Yjs resolves concurrent edits while live cursors and selections move through a room backed by a Durable Object.',
  },
  {
    number: '04',
    icon: Cloud,
    title: 'The edge is the backend',
    copy: 'SSR, WebSockets, persistence, and deploys share one Cloudflare Worker. No separate realtime service to babysit.',
  },
]

export function LandingPage() {
  return (
    <div className="landing-page" id="top">
      <header className="landing-nav">
        <Link to="/" className="landing-brand">
          <OffsetMark />
          <span>OFFSET</span>
        </Link>
        <nav aria-label="Main navigation">
          <a href="#system">System</a>
          <a href="#collaboration">Collaboration</a>
          <a href="https://github.com" target="_blank" rel="noreferrer">
            Source ↗
          </a>
        </nav>
        <Link
          to="/studio/$documentId"
          params={{ documentId: 'demo' }}
          className="nav-cta"
        >
          Open canvas <ArrowRight size={14} />
        </Link>
      </header>

      <main>
        <section className="landing-hero">
          <div className="hero-grid-marker hero-grid-marker-left">A / 001</div>
          <div className="hero-grid-marker hero-grid-marker-right">
            EDM · 53.5461° N
          </div>
          <div className="hero-copy">
            <p className="eyebrow">
              <span /> Infinite canvas for the living web
            </p>
            <h1>
              The browser is
              <br />
              <em>your artboard.</em>
            </h1>
            <p className="hero-subhead">
              Compose real React interfaces on an infinite canvas. Keep the
              layer tree, tune every property, and edit together at the edge.
            </p>
            <div className="hero-actions">
              <Link
                to="/studio/$documentId"
                params={{ documentId: 'demo' }}
                className="primary-cta"
              >
                Start designing <ArrowRight size={16} />
              </Link>
              <span>No account · Demo room included</span>
            </div>
          </div>
          <div className="hero-side-note">
            <span>Built for</span>
            <p>
              Design engineers
              <br />
              Product teams
              <br />
              Creative developers
            </p>
          </div>
          <div className="hero-preview-wrap">
            <ProductPreview />
          </div>
        </section>

        <section className="tech-strip" aria-label="Technology stack">
          <span>LIVE REACT DOM</span>
          <i />
          <span>YJS CRDT</span>
          <i />
          <span>DURABLE OBJECTS</span>
          <i />
          <span>TANSTACK START</span>
          <i />
          <span>CF WORKERS</span>
        </section>

        <section className="landing-system" id="system">
          <div className="section-index">
            <span>01</span>
            <p>THE SYSTEM</p>
          </div>
          <div className="section-heading-block">
            <p className="eyebrow">
              <span /> A canvas that understands interfaces
            </p>
            <h2>
              Pixels are the output.
              <br />
              <em>Structure is the medium.</em>
            </h2>
          </div>
          <div className="feature-grid">
            {features.map(({ number, icon: Icon, title, copy }) => (
              <article key={number}>
                <div className="feature-meta">
                  <span>{number}</span>
                  <Icon size={19} strokeWidth={1.45} />
                </div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="collaboration-section" id="collaboration">
          <div className="collab-visual">
            <div className="collab-grid" />
            <div className="collab-card collab-card-main">
              <span>Hero heading</span>
              <strong>
                Objects for
                <br />
                slower mornings.
              </strong>
              <i />
            </div>
            <div className="collab-card collab-card-side">
              <span>Live room</span>
              <div className="collab-person">
                <b style={{ background: '#ff6b45' }}>M</b>
                <p>
                  Mika<small>Editing type</small>
                </p>
              </div>
              <div className="collab-person">
                <b style={{ background: '#a9d36e' }}>N</b>
                <p>
                  Noor<small>Adjusting layout</small>
                </p>
              </div>
            </div>
            <div className="collab-beacon beacon-one">
              <i />
              <span>Mika</span>
            </div>
            <div className="collab-beacon beacon-two">
              <i />
              <span>Noor</span>
            </div>
          </div>
          <div className="collab-copy">
            <span className="section-number">02 / COLLABORATION</span>
            <h2>
              Same canvas.
              <br />
              Same moment.
            </h2>
            <p>
              Rooms synchronize at the object level, so two people can change
              different properties without taking turns or overwriting the whole
              document.
            </p>
            <ul>
              <li>
                <Sparkles size={15} /> Conflict-safe document updates
              </li>
              <li>
                <MousePointer2 size={15} /> Live cursors and selections
              </li>
              <li>
                <Cloud size={15} /> Durable edge persistence
              </li>
            </ul>
            <Link
              to="/studio/$documentId"
              params={{ documentId: 'shared-demo' }}
            >
              Enter a shared room <ArrowRight size={15} />
            </Link>
          </div>
        </section>

        <section className="final-cta-section">
          <div className="final-cta-mark">
            <OffsetMark />
          </div>
          <p>OFFSET / OPEN CANVAS</p>
          <h2>
            Make the page.
            <br />
            <em>Keep it alive.</em>
          </h2>
          <Link
            to="/studio/$documentId"
            params={{ documentId: 'demo' }}
            className="primary-cta light"
          >
            Open the canvas <ArrowRight size={16} />
          </Link>
          <span className="final-coordinate">53.5461° N / 113.4938° W</span>
        </section>
      </main>

      <footer className="landing-footer">
        <span>OFFSET © 2026</span>
        <span>React / TanStack / Cloudflare</span>
        <a href="#top">Back to top ↑</a>
      </footer>
    </div>
  )
}
