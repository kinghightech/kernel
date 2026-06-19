import { useState } from 'react';
import type { Plan, Interval } from '../billing';

export type PlanChoice = 'free' | Plan;

const Check = () => (
  <div className="c3-check">
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

// The exact pricing section used on the landing page, reusable elsewhere.
// `onChoose` is called with the plan and the selected billing interval.
export default function PricingSection({ onChoose }: { onChoose: (plan: PlanChoice, interval: Interval) => void }) {
  const [yearly, setYearly] = useState(false);
  const interval: Interval = yearly ? 'year' : 'month';

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
          <span className="c3-watermark-line-1">Your email.</span>
          <span className="c3-watermark-line-2">Kernel</span>
        </div>
      </div>

      <div className="c3-grid">
        <div className="c3-card">
          <div className="c3-tier-small">Free</div>
          <div className="c3-tier-large">Free</div>
          <div className="c3-desc">For creators taking their first steps with Kernel.</div>
          <ul className="c3-list">
            <li><Check />Up to 3 projects in the cloud</li>
            <li><Check />Image export up to 1080p</li>
            <li><Check />Basic editing tools</li>
            <li><Check />Free templates and icons</li>
            <li><Check />Access via web and mobile app</li>
          </ul>
          <button className="c3-btn" onClick={() => onChoose('free', interval)}>Choose Plan</button>
        </div>

        <div className="c3-card">
          <div className="c3-tier-small">Pro</div>
          <div className="c3-tier-large">
            {yearly ? '$99.99/y' : (
              <>
                <span style={{ textDecoration: 'line-through', opacity: 0.4, fontWeight: 400, marginRight: 10 }}>$15.99</span>
                $9.99/m
              </>
            )}
          </div>
          <div
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
              fontSize: '0.78rem', fontWeight: 600, color: '#9ab4ff',
              border: '1px solid rgba(154,180,255,0.35)', borderRadius: 999,
              padding: '5px 12px', marginTop: 14,
            }}
          >
            ✦ Free 3-day trial — try for 3 days for $0
          </div>
          <div className="c3-desc">For freelancers and small teams who need more freedom and flexibility.</div>
          <ul className="c3-list">
            <li><Check />Up to 50 projects in the cloud</li>
            <li><Check />Export up to 4K</li>
            <li><Check />Advanced editing toolkit</li>
            <li><Check />Team collaboration (up to 5 members)</li>
            <li><Check />Access to premium template library</li>
          </ul>
          <button className="c3-btn" onClick={() => onChoose('pro', interval)}>Choose Plan</button>
        </div>

        <div className="c3-card c3-card-pro">
          <div className="c3-tier-small">Max</div>
          <div className="c3-tier-large">{yearly ? '$199.99/y' : '$19.99/m'}</div>
          <div className="c3-desc">For studios, agencies, and professional creators working with brands.</div>
          <ul className="c3-list">
            <li><Check />Unlimited projects</li>
            <li><Check />Export up to 8K + animations</li>
            <li><Check />AI-powered content generation tools</li>
            <li><Check />Unlimited team members</li>
            <li><Check />Brand customization</li>
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
