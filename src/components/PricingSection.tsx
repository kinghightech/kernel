import { useState } from 'react';
import type { Plan, Interval } from '../billing';

export type PlanChoice = Plan;

const Check = () => (
  <div className="c3-check">
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

// The exact pricing section used on the landing page, reusable elsewhere.
// `onChoose` is called with the plan and the selected billing interval.
// `watermark` overrides the big faded background text (two lines).
export default function PricingSection({
  onChoose,
  watermark,
}: {
  onChoose: (plan: PlanChoice, interval: Interval) => void;
  watermark?: { line1: string; line2: string };
}) {
  const [yearly, setYearly] = useState(false);
  const interval: Interval = yearly ? 'year' : 'month';
  const wm = watermark ?? { line1: 'Your email.', line2: 'Kernel' };

  return (
    <section className="c3-pricing-section">
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <filter id="c3-noise-pricing">
          <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="2" stitchTiles="stitch" />
          <feComponentTransfer><feFuncA type="linear" slope="0.075" /></feComponentTransfer>
          <feComposite in2="SourceGraphic" operator="in" result="noise" />
          <feBlend in="SourceGraphic" in2="noise" mode="overlay" />
        </filter>
      </svg>

      <div className="c3-watermark-container">
        <div className="c3-watermark-main" style={{ filter: 'url(#c3-noise-pricing)' }}>
          <span className="c3-watermark-line-1">{wm.line1}</span>
          <span className="c3-watermark-line-2">{wm.line2}</span>
        </div>
      </div>

      <div className="c3-grid">
        <div
          className="c3-card"
          style={{
            position: 'relative',
            border: '1.5px solid rgba(0,210,255,0.65)',
            boxShadow: '0 0 0 1px rgba(0,210,255,0.25), 0 0 45px rgba(0,210,255,0.18)',
          }}
        >
          <div
            style={{
              position: 'absolute', top: 16, right: 16,
              fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.04em',
              color: '#00d2ff', background: 'rgba(0,210,255,0.12)',
              border: '1px solid rgba(0,210,255,0.4)', borderRadius: 999,
              padding: '4px 10px', textTransform: 'uppercase',
            }}
          >
            Recommended
          </div>
          <div className="c3-tier-small">Pro</div>
          <div className="c3-tier-large" style={{ whiteSpace: 'nowrap' }}>
            {yearly ? '$99.99/y' : (
              <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                <span style={{ textDecoration: 'line-through', opacity: 0.4, fontWeight: 400, fontSize: '0.9rem' }}>$15.99</span>
                <span>$9.99/m</span>
              </span>
            )}
          </div>
          <div className="c3-desc">Everything a local business needs to grow.</div>
          <ul className="c3-list">
            <li><Check />3 website generations</li>
            <li><Check />Today's outlook — weather &amp; green/red days</li>
            <li><Check />Connect Square for live sales &amp; top sellers</li>
            <li><Check />Upcoming local events</li>
            <li><Check />Limited AI chat</li>
            <li><Check />Everything in Free</li>
          </ul>
          <button className="c3-btn" onClick={() => onChoose('pro', interval)}>Choose Plan</button>
        </div>

        <div className="c3-card c3-card-pro">
          <div className="c3-tier-small">Max</div>
          <div className="c3-tier-large">{yearly ? '$199.99/y' : '$19.99/m'}</div>
          <div className="c3-desc">The full suite — unlimited, with your own AI receptionist.</div>
          <ul className="c3-list">
            <li><Check />Unlimited website generations &amp; improvements</li>
            <li><Check />Unlimited AI chat</li>
            <li><Check />AI marketing — real social campaign content</li>
            <li><Check />Your own AI receptionist for missed calls</li>
            <li><Check />Everything in Pro</li>
          </ul>
          <button className="c3-btn" onClick={() => onChoose('max', interval)}>Choose Plan</button>
        </div>
      </div>

      <div className="c3-toggle-wrap">
        <span className="text-sm font-medium text-white/80">Yearly</span>
        <button
          className={`c3-toggle ${yearly ? 'active' : ''}`}
          onClick={() => setYearly(!yearly)}
          aria-label="Toggle yearly pricing"
        >
          <div className="c3-toggle-knob" />
        </button>
      </div>
    </section>
  );
}
