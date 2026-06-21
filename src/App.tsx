import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { supabase } from './supabase';
import { startCheckout } from './billing';
import PricingSection from './components/PricingSection';
import AIChat from './pages/AIChat';
import DashboardLayout from './pages/DashboardLayout';
import Home from './pages/Home';
import Settings from './pages/Settings';
import Marketing from './pages/Marketing';
import Website from './pages/Website';
import Voice from './pages/Voice';
import Checklist from './pages/Checklist';
import Onboarding from './pages/Onboarding';
import Checkout from './pages/Checkout';
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from 'motion/react';
import { ChevronRight, Sparkles } from 'lucide-react';

const LogoMark = ({ className = 'w-28 h-28 object-contain' }: { className?: string }) => (
  <img src="/logo.png" alt="Kernel Logo" className={className} />
);

const GoogleIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const PrimaryButton = ({ label = 'Get started', full }: { label?: string, full?: boolean }) => {
  const navigate = useNavigate();

  // Normalized cursor position within the button (-0.5 .. 0.5)
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  // Raw cursor position in px (for the glow)
  const gx = useMotionValue(0);
  const gy = useMotionValue(0);

  const spring = { stiffness: 250, damping: 18, mass: 0.6 };
  // Tilt toward the cursor: pointing up tilts top toward you, etc.
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [16, -16]), spring);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-16, 16]), spring);
  // Subtle parallax shift so it feels physical
  const translateX = useSpring(useTransform(px, [-0.5, 0.5], [-6, 6]), spring);
  const translateY = useSpring(useTransform(py, [-0.5, 0.5], [-6, 6]), spring);
  // Press scale driven through the same transform (no whileTap, so it never
  // fights the tilt and drops a frame).
  const scale = useSpring(1, { stiffness: 400, damping: 25 });

  const glow = useMotionTemplate`radial-gradient(160px circle at ${gx}px ${gy}px, rgba(0,210,255,0.35), transparent 65%)`;

  const handleMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;
    px.set(localX / rect.width - 0.5);
    py.set(localY / rect.height - 0.5);
    gx.set(localX);
    gy.set(localY);
  };

  const reset = () => {
    px.set(0);
    py.set(0);
    scale.set(1);
  };

  return (
    <div className={full ? 'w-full' : ''} style={{ perspective: 800 }}>
      <motion.button
        onClick={() => navigate('/onboarding')}
        onMouseMove={handleMove}
        onMouseEnter={handleMove}
        onMouseLeave={reset}
        onPointerDown={() => scale.set(0.96)}
        onPointerUp={() => scale.set(1)}
        style={{
          rotateX,
          rotateY,
          x: translateX,
          y: translateY,
          scale,
          transformStyle: 'preserve-3d',
          transformPerspective: 800,
          willChange: 'transform',
          backfaceVisibility: 'hidden',
        }}
        className={`group relative inline-flex items-center justify-center gap-3 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 text-white font-bold text-lg md:text-xl px-8 py-4 md:px-10 md:py-5 transition-colors duration-300 hover:bg-[#00d2ff]/10 hover:border-[#00d2ff]/40 hover:shadow-[0_0_50px_rgba(0,210,255,0.35)] overflow-hidden ${full ? 'w-full' : ''}`}
      >
        {/* Cursor-tracking glow */}
        <motion.div className="absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ background: glow, transform: 'translateZ(1px)' }} />
        {/* Sheen sweep */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
        {/* Lift the label off the surface for real depth */}
        <span className="relative z-10 flex items-center gap-3" style={{ transform: 'translateZ(40px)' }}>
          {label}
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6 transition-transform group-hover:translate-x-[4px] group-hover:text-[#00d2ff]" />
        </span>
      </motion.button>
    </div>
  );
};

const SectionEyebrow = ({ label, tag }: { label: string; tag?: string }) => (
  <div className="flex items-center gap-3">
    <div className="flex items-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-white" />
      <span className="text-sm font-medium">{label}</span>
    </div>
    {tag && (
      <span className="px-2 py-0.5 rounded-full border border-white/10 text-white/50 text-xs">
        {tag}
      </span>
    )}
  </div>
);

// Scroll-driven flower frame sequence. As the user scrolls through the tall
// container, the "video" plays forward; scrolling back up rewinds it. The
// frames are pre-keyed transparent WebP (black background removed, watermark
// stripped — see scripts/key_flower.py), so the flower composites cleanly over
// the page with no backing rectangle.
const FLOWER_FRAME_COUNT = 240;
const flowerFrameUrl = (i: number) =>
  `/flower_t/frame-${String(i).padStart(3, '0')}.webp`;

function FlowerScroll() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [ready, setReady] = useState(false);

  // Draw a single frame (1-based index) plus the watermark cover box.
  const drawFrame = (index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = imagesRef.current[index - 1];
    if (!img || !img.complete || img.naturalWidth === 0) return;

    // Transparent frames: clear first so the previous silhouette doesn't linger.
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };

  // Preload every frame so scrubbing is instant.
  useEffect(() => {
    const imgs: HTMLImageElement[] = [];
    let loaded = 0;
    for (let i = 1; i <= FLOWER_FRAME_COUNT; i++) {
      const img = new Image();
      img.src = flowerFrameUrl(i);
      img.onload = () => {
        loaded += 1;
        if (i === 1) drawFrame(1); // paint the first frame ASAP
        if (loaded === FLOWER_FRAME_COUNT) setReady(true);
      };
      imgs.push(img);
    }
    imagesRef.current = imgs;
  }, []);

  // Map scroll progress through the container to a frame index.
  useEffect(() => {
    let rafId = 0;
    const onScroll = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scrollable = el.offsetHeight - window.innerHeight;
      const progress = scrollable > 0 ? -rect.top / scrollable : 0;
      const clamped = Math.min(Math.max(progress, 0), 1);
      const frame = Math.min(
        FLOWER_FRAME_COUNT,
        Math.max(1, Math.round(clamped * (FLOWER_FRAME_COUNT - 1)) + 1)
      );
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => drawFrame(frame));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [ready]);

  // Iridescent gradient for the animated "bloom" word — echoes the flower's
  // blue/pink. `animate-shiny` flows the gradient; the motion scale makes it breathe.
  const bloomGradient: React.CSSProperties = {
    backgroundImage:
      'linear-gradient(to right, #A4F4FD 0%, #00d2ff 25%, #c08cff 50%, #00d2ff 75%, #A4F4FD 100%)',
    backgroundSize: '200% auto',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
    WebkitTextFillColor: 'transparent',
  };

  return (
    <div ref={containerRef} className="relative h-[300vh]">
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center">
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          className="block h-[68vh] w-full max-w-[1600px] object-contain"
        />
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          className="mt-[2vh] md:mt-[4vh] text-center text-4xl sm:text-6xl md:text-8xl font-bold tracking-tight"
        >
          Get ready for your business to{' '}
          <motion.span
            className="animate-shiny inline-block"
            style={bloomGradient}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            bloom
          </motion.span>
        </motion.h2>
      </div>
    </div>
  );
}

function Landing() {
  const navigate = useNavigate();

  const gradientStyle: React.CSSProperties = {
    backgroundImage: 'linear-gradient(to right, #091020 0%, #0B2551 12.5%, #A4F4FD 32.5%, #00d2ff 50%, #0B2551 67.5%, #091020 87.5%, #091020 100%)',
    backgroundSize: '200% auto',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
    WebkitTextFillColor: 'transparent',
    filter: 'url(#c3-noise)',
  };

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#0c0c0c] text-white">
      {/* Global background video */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <video autoPlay loop muted playsInline
          className="w-full h-full object-cover pointer-events-none"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260508_064122_c4750c0e-7476-4b44-94a2-a85a65c63bf2.mp4" />
      </div>

      {/* Root SVG filter */}
      <svg className="hidden">
        <filter id="c3-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.35 0" />
          <feComposite in2="SourceGraphic" operator="in" result="noise" />
          <feBlend in="SourceGraphic" in2="noise" mode="multiply" />
        </filter>
      </svg>

      <div className="relative z-10">
        {/* Section 1 — Navbar */}
        <motion.nav 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full px-6 md:px-12 py-6 flex items-center justify-between"
        >
          <div className="flex items-center">
            <LogoMark />
          </div>
          <div className="hidden md:flex gap-8">
            {['Features', 'Pricing', 'About', 'Support'].map((link, i) => (
              <motion.a 
                key={link}
                href="#"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 + i * 0.05 }}
                className="text-white/70 text-sm font-medium hover:text-white transition-colors"
              >
                {link}
              </motion.a>
            ))}
          </div>
          <motion.button
            onClick={() => navigate('/auth')}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
            className="hidden md:inline-flex items-center rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            Log in
          </motion.button>
          <button className="md:hidden w-10 h-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center">
            <div className="w-4 h-px bg-white relative before:absolute before:w-4 before:h-px before:bg-white before:-top-1.5 after:absolute after:w-4 after:h-px after:bg-white after:top-1.5" />
          </button>
        </motion.nav>

        {/* Section 2 — Hero */}
        <section className="pt-16 md:pt-28 pb-20 text-center flex flex-col items-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            className="text-6xl md:text-8xl lg:text-[7.5rem] font-bold tracking-tight leading-[0.9]"
          >
            <div className="text-white mb-2">The second brain</div>
            <div className="text-white mb-2">for your business.</div>
            <div className="animate-shiny inline-block" style={gradientStyle}>Kernel</div>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
            className="mt-8 text-white/60 max-w-lg text-lg md:text-xl leading-[1.6]"
          >
            Kernel is an AI-powered operations platform that thinks alongside you. Strategy, marketing, web presence, and daily insights — unified into one intelligent command center.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.7 }}
            className="mt-8 flex flex-col items-center gap-4"
          >
            <PrimaryButton />
          </motion.div>
        </section>

        {/* Section 3 & 4 — Scroll-driven flower sequence */}
        <FlowerScroll />

        {/* Section 5 — FeatureTriage */}
        <section className="w-full px-6 md:px-12 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-start">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <SectionEyebrow label="Operations" tag="AI-native" />
              <h2 className="mt-5 text-4xl md:text-6xl font-bold tracking-tight leading-[1.02]">
                Every decision, <br/> one step ahead.
              </h2>
              <p className="mt-6 text-white/60 text-lg leading-[1.6] max-w-lg">
                Kernel synthesizes your revenue data, market signals, and daily operations into clear, actionable intelligence. Focus on growth — the rest orchestrates itself.
              </p>
              <div className="mt-8 flex flex-wrap gap-2">
                {['AI Strategy Chat', 'Campaign Generator', 'Website Builder', 'Live Sales Data'].map(chip => (
                  <span key={chip} className="text-xs text-white/70 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03]">
                    {chip}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="liquid-glass rounded-2xl p-5"
            >
              <div className="text-xs font-medium text-white/60 mb-4 px-1">Today · Your business at a glance</div>
              <div className="space-y-3">
                {[
                  { title: 'Revenue Today', color: '#ffffff', items: ['$4,280 across 38 orders', 'Top seller: Signature Blend — 14 units'] },
                  { title: 'Marketing (3 active)', color: '#e5e5e5', items: ['Summer launch campaign — 2.4k reach', 'New product reel — scheduled 3pm'] },
                  { title: 'Website', color: '#a3a3a3', items: ['Last updated 2 hrs ago', '312 visits today · 4.2% conversion'] },
                  { title: 'AI Insight', color: '#525252', items: ['Revenue up 18% vs last Tuesday — consider restocking'] },
                ].map(group => (
                  <div key={group.title} className="liquid-glass rounded-lg p-3">
                    <div className="text-xs font-semibold mb-2" style={{ color: group.color }}>{group.title}</div>
                    <div className="space-y-1.5">
                      {group.items.map((item, i) => (
                        <div key={i} className="text-sm text-white/80 truncate">{item}</div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>



        {/* Section 7 — Testimonials */}
        <section className="w-full px-6 md:px-12 py-20 md:py-28 border-t border-white/10">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { quote: "Kernel replaced three separate tools for us. The AI insights alone have shifted how we plan every week.", name: "Rachel Nguyen", role: "Chief Operating Officer", company: "VEDA STUDIO" },
              { quote: "We launched a full website and our first marketing campaign in the same afternoon. That used to take us weeks.", name: "James Okafor", role: "Founder & CEO", company: "EMBER SUPPLY" },
              { quote: "The Square integration is magic. Seeing real-time revenue next to AI strategy recommendations changed our whole rhythm.", name: "Sofia Marchetti", role: "Head of Growth", company: "CALIBER CO" }
            ].map((testimonial, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="liquid-glass rounded-2xl p-6 flex flex-col"
              >
                <blockquote className="text-sm text-white/80 leading-[1.6] flex-1">"{testimonial.quote}"</blockquote>
                <figcaption className="mt-6 pt-5 border-t border-white/10">
                  <div className="text-sm font-semibold">{testimonial.name}</div>
                  <div className="text-xs text-white/50 mt-0.5">{testimonial.role}</div>
                  <div className="text-xs text-white font-semibold tracking-wide uppercase mt-2">{testimonial.company}</div>
                </figcaption>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Section 8 — Pricing */}
        <PricingSection onChoose={(plan, intv) => startCheckout(plan, intv)} />

        {/* Section 9 — FinalCTA */}
        <section className="w-full px-6 md:px-12 py-20 md:py-32">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="liquid-glass relative overflow-hidden rounded-3xl px-8 py-16 md:py-24 text-center"
          >
            <div className="absolute inset-0 pointer-events-none opacity-30" style={{ background: 'radial-gradient(600px circle at 50% 0%, rgba(255,255,255,0.15), transparent 70%)' }} />
            <h2 className="relative z-10 text-5xl md:text-7xl font-bold tracking-tight leading-[1.02]">
              Stop managing. <br/> Start building.
            </h2>
            <p className="relative z-10 mt-6 text-white/60 max-w-lg mx-auto text-base md:text-lg leading-[1.6]">
              Join the founders and operators who run smarter with an AI-powered second brain behind every decision.
            </p>
            <div className="relative z-10 mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <PrimaryButton />
              <button className="group rounded-full border border-white/15 text-white text-sm font-medium px-5 py-3 hover:bg-white/5 transition-colors flex items-center gap-2">
                Talk to sales
                <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-[1px]" />
              </button>
            </div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="w-full py-8 text-center border-t border-white/5">
          <p className="text-sm text-white/40">
            © {new Date().getFullYear()} Kernel. All rights reserved.
          </p>
          <div className="mt-3 flex items-center justify-center gap-6 text-sm text-white/40">
            <a href="https://kerneltermsofservice.notion.site/" target="_blank" rel="noopener noreferrer" className="hover:text-white/70 transition-colors">Terms of Service</a>
            <a href="https://kernelprivacypolicy.notion.site/" target="_blank" rel="noopener noreferrer" className="hover:text-white/70 transition-colors">Privacy Policy</a>
          </div>
        </footer>
      </div>
    </div>
  );
}

function Auth() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (isSignUp) {
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) {
        setError(signUpError.message);
      } else {
        navigate('/dashboard');
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
      } else {
        navigate('/dashboard');
      }
    }
    setLoading(false);
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="flex min-h-screen bg-[#000000] text-white font-geist"
    >
      {/* Left side: Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 lg:px-24 xl:px-32 relative z-10">
        <div className="w-full max-w-md mx-auto">
          {/* Back button */}
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors mb-12 font-medium"
          >
            <span className="text-lg leading-none mb-[2px]">‹</span> Back to home
          </button>

          <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-3 tracking-tight">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="text-white/50 text-base mb-10">
            {isSignUp ? 'Sign up to get started with Kernel.' : 'Sign in to pick up right where you left off.'}
          </p>

          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl mb-6">{error}</div>}

          <button 
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-black font-semibold rounded-xl py-4 text-base hover:bg-white/90 transition-colors disabled:opacity-50"
          >
            <GoogleIcon />
            {isSignUp ? 'Sign up with Google' : 'Sign in with Google'}
          </button>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-white/40 text-sm font-medium">or continue with email</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <form className="space-y-5" onSubmit={handleEmailAuth}>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
                className="w-full rounded-xl px-5 py-4 text-base text-white placeholder-white/30 outline-none focus:border-white/40 transition-colors"
                style={{ background: '#111111', border: '1px solid #222222' }} />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                className="w-full rounded-xl px-5 py-4 text-base text-white placeholder-white/30 outline-none focus:border-white/40 transition-colors"
                style={{ background: '#111111', border: '1px solid #222222' }} />
            </div>
            <button disabled={loading} type="submit"
              className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/20 text-white font-semibold rounded-xl py-4 text-base hover:bg-white/10 transition-colors mt-4 disabled:opacity-50">
              {loading ? 'Please wait…' : (isSignUp ? 'Create account' : 'Sign in')}
            </button>
          </form>

          <div className="mt-8 text-center flex flex-col gap-6">
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
              className="text-sm text-white/50 hover:text-white transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
            <p className="text-xs text-white/30">
              By continuing, you agree to our{' '}
              <a href="https://kerneltermsofservice.notion.site/" target="_blank" rel="noopener noreferrer" className="underline hover:text-white/50 transition-colors">Terms of Service</a>
              {' '}and{' '}
              <a href="https://kernelprivacypolicy.notion.site/" target="_blank" rel="noopener noreferrer" className="underline hover:text-white/50 transition-colors">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>

      {/* Right side: Video */}
      <div className="hidden lg:block lg:w-1/2 relative bg-[#0c0c0c]">
        <video
          autoPlay loop muted playsInline
          className="absolute inset-0 w-full h-full object-cover"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260302_085844_21a8f4b3-dea5-4ede-be16-d53f6973bb14.mp4"
        />
        <div className="absolute inset-0 bg-black/10" />
      </div>
    </motion.div>
  );
}

// Landing pad for Google (OAuth) sign-in. Waits for the login to fully finish,
// then sends brand-new users to onboarding and returning users to the dashboard.
function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let done = false;

    const finish = async (session: import('@supabase/supabase-js').Session | null) => {
      if (done || !session) return;
      done = true;
      // Does this user already have onboarding saved? If so → dashboard. If not → onboarding.
      const { data: ob } = await supabase
        .from('onboarding')
        .select('user_id')
        .eq('user_id', session.user.id)
        .maybeSingle();
      navigate(ob ? '/dashboard' : '/onboarding', { replace: true });
    };

    // The session may already be ready, or it may arrive a moment later.
    supabase.auth.getSession().then(({ data }) => finish(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => finish(session));

    // If nothing comes through after a few seconds, something is misconfigured.
    const timer = setTimeout(() => {
      if (!done) setError('Sign-in did not complete. Please try again.');
    }, 6000);

    return () => { sub.subscription.unsubscribe(); clearTimeout(timer); };
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0c0c0c] text-white gap-4">
      {error ? (
        <>
          <p className="text-white/70 text-sm">{error}</p>
          <button onClick={() => navigate('/auth')} className="text-sm underline underline-offset-2 text-white/80 hover:text-white">
            Back to sign in
          </button>
        </>
      ) : (
        <>
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-white/60 text-sm">Signing you in…</p>
        </>
      )}
    </div>
  );
}

function Success() {
  const navigate = useNavigate();
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#0c0c0c] text-white px-6">
      <div className="absolute inset-0 pointer-events-none opacity-30" style={{ background: 'radial-gradient(800px circle at 50% 0%, #0B2551, transparent 70%)' }} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="liquid-glass w-full max-w-md rounded-3xl p-8 md:p-12 relative z-10 text-center"
      >
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-[#A4F4FD]" />
          </div>
        </div>
        <h2 className="text-3xl font-bold tracking-tight mb-4">Welcome to Kernel</h2>
        <p className="text-white/60 mb-8 text-base leading-relaxed">
          You have successfully completed sign up. Your workspace is ready.
        </p>

        <button onClick={() => navigate('/dashboard')} className="w-full bg-white text-black font-semibold rounded-xl py-3 text-sm hover:bg-white/90 transition-colors">
          Continue to Dashboard
        </button>
      </motion.div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/success" element={<Success />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Home />} />
          <Route path="ai" element={<AIChat />} />
          <Route path="marketing" element={<Marketing />} />
          <Route path="website" element={<Website />} />
          <Route path="voice" element={<Voice />} />
          <Route path="checklist" element={<Checklist />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
