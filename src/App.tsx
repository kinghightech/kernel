import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { supabase } from './supabase';
import AIChat from './pages/AIChat';
import DashboardLayout from './pages/DashboardLayout';
import Home from './pages/Home';
import { motion, useMotionValue, useSpring, useTransform, useMotionTemplate } from 'motion/react';
import { ChevronRight, Search, Sparkles, Paperclip, Trash2, MoreHorizontal, Reply, Forward, Archive } from 'lucide-react';

const AppleLogo = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 384 512" fill="currentColor">
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
  </svg>
);

const LogoMark = ({ className = 'w-28 h-28 object-contain' }: { className?: string }) => (
  <img src="/logo.png" alt="Kernel Logo" className={className} />
);

const PrimaryButton = ({ label = 'Launch your growth', full }: { label?: string, full?: boolean }) => {
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
        onClick={() => navigate('/auth')}
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

function Landing() {
  const [yearly, setYearly] = useState(false);

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
    <div className="relative min-h-screen overflow-x-hidden bg-[#0c0c0c] text-white">
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
            {['Solutions', 'Pricing', 'Blog', 'Documentation', 'Careers'].map((link, i) => (
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
            <div className="text-white mb-2">Your email.</div>
            <div className="animate-shiny inline-block" style={gradientStyle}>Kernel</div>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
            className="mt-8 text-white/60 max-w-lg text-lg md:text-xl leading-[1.6]"
          >
            Kernel is the premier inbox platform for the current era. It leverages powerful AI to organize, prioritize, and refine your messages into total clarity.
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

        {/* Sections 3 & 4 Wrapper */}
        <section className="w-full px-6 md:px-12 py-16 md:py-24">
          {/* Section 3 — macOS menu bar strip */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.9 }}
            className="mb-2"
          >
            <div className="w-full h-10 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl flex items-center justify-between text-xs font-medium px-4">
              <div className="flex items-center gap-4">
                <AppleLogo className="w-3.5 h-3.5" />
                <span className="font-bold text-white">Kernel</span>
                {['File', 'Edit', 'View', 'Go', 'Window', 'Help'].map((item, index) => (
                  <span key={item} className={`text-white/80 ${index > 2 ? 'hidden sm:inline' : ''} ${index > 3 ? 'hidden md:inline' : ''}`}>
                    {item}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-3 text-white/80">
                <Search className="w-3.5 h-3.5" />
                <span>Wed May 6 1:09 PM</span>
              </div>
            </div>
          </motion.div>

          {/* Section 4 — Inbox mockup */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 1.1 }}
          >
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0e1014]/90 backdrop-blur-2xl">
              {/* Title bar */}
              <div className="h-10 flex items-center px-4 border-b border-white/10 relative">
              <div className="flex gap-2 z-10">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <div className="w-3 h-3 rounded-full bg-[#28c840]" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs text-white/50 font-medium">Kernel — Inbox</span>
              </div>
            </div>

            {/* Body */}
            <div className="grid grid-cols-1 md:grid-cols-12 h-[600px] md:h-[520px]">
              {/* Sidebar */}
              <div className="hidden md:block col-span-3 border-r border-white/10 bg-black/30 p-4">
                <button className="w-full flex items-center justify-center gap-2 rounded-lg bg-white text-black text-xs font-semibold px-3 py-2 mb-6 hover:bg-white/90 transition-colors">
                  <Sparkles className="w-3.5 h-3.5" />
                  Compose with Kernel
                </button>
                <div className="space-y-1 mb-8">
                  {[
                    { label: 'Inbox', icon: 'Inbox', count: 12, active: true },
                    { label: 'Starred', icon: 'Star', count: 3 },
                    { label: 'Sent', icon: 'Send' },
                    { label: 'Drafts', icon: 'File', count: 2 },
                    { label: 'Archive', icon: 'Archive' },
                    { label: 'Trash', icon: 'Trash2' },
                  ].map(item => (
                    <div key={item.label} className={`flex items-center justify-between px-3 py-1.5 rounded-md text-sm cursor-pointer ${item.active ? 'bg-white/10 text-white' : 'text-white/60 hover:bg-white/5'}`}>
                      <span>{item.label}</span>
                      {item.count && <span className="text-xs">{item.count}</span>}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-white/40 font-semibold mb-3 px-3">Labels</div>
                  <div className="space-y-1">
                    {[
                      { label: 'Work', color: '#00d2ff' },
                      { label: 'Personal', color: '#A4F4FD' },
                      { label: 'Travel', color: '#f59e0b' },
                      { label: 'Finance', color: '#10b981' },
                    ].map(label => (
                      <div key={label.label} className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-white/60 hover:bg-white/5 cursor-pointer">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: label.color }} />
                        {label.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Message list */}
              <div className="col-span-12 md:col-span-4 border-r border-white/10 flex flex-col bg-black/10">
                <div className="p-3 border-b border-white/10 flex items-center gap-2 text-white/40">
                  <Search className="w-4 h-4" />
                  <span className="text-sm">Search mail</span>
                </div>
                <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
                  {[
                    { sender: 'Linear', subject: 'Weekly product digest', preview: 'Your team shipped 23 issues this week...', time: '9:41 AM', unread: true, active: true },
                    { sender: 'Sophia Chen', subject: 'Re: Q3 roadmap review', preview: 'Thanks for sending the deck over. I had a few thoughts...', time: '8:12 AM', unread: true },
                    { sender: 'Figma', subject: 'Marcus commented on your file', preview: 'Love the new direction on the landing hero.', time: 'Yesterday' },
                    { sender: 'Stripe', subject: 'Payout of $12,480.00 sent', preview: 'Your payout is on its way to your bank...', time: 'Yesterday' },
                    { sender: 'Vercel', subject: 'Deployment ready for kernel-web', preview: 'Preview is live at kernel-web-g3f.vercel.app', time: 'Mon' },
                    { sender: 'GitHub', subject: '[kernel/core] PR #482 approved', preview: 'david-lim approved your pull request.', time: 'Mon' },
                  ].map((msg, i) => (
                    <div key={i} className={`p-4 border-b border-white/5 cursor-pointer ${msg.active ? 'bg-white/5' : 'hover:bg-white/[0.02]'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm ${msg.unread ? 'font-semibold text-white' : 'font-medium text-white/80'}`}>{msg.sender}</span>
                        <span className={`text-xs ${msg.active ? 'text-brand' : 'text-white/40'}`}>{msg.time}</span>
                      </div>
                      <div className={`text-sm mb-1 truncate ${msg.unread ? 'font-medium text-white/90' : 'text-white/70'}`}>{msg.subject}</div>
                      <div className="text-xs text-white/50 truncate">{msg.preview}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reader */}
              <div className="hidden md:flex col-span-5 flex-col bg-black/5">
                <div className="h-14 border-b border-white/10 flex items-center justify-between px-4">
                  <div className="flex items-center gap-1">
                    <button className="w-7 h-7 rounded-md hover:bg-white/5 flex items-center justify-center text-white/60 transition-colors"><Reply className="w-4 h-4" /></button>
                    <button className="w-7 h-7 rounded-md hover:bg-white/5 flex items-center justify-center text-white/60 transition-colors"><Forward className="w-4 h-4" /></button>
                    <div className="w-px h-4 bg-white/10 mx-1" />
                    <button className="w-7 h-7 rounded-md hover:bg-white/5 flex items-center justify-center text-white/60 transition-colors"><Archive className="w-4 h-4" /></button>
                    <button className="w-7 h-7 rounded-md hover:bg-white/5 flex items-center justify-center text-white/60 transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <button className="w-7 h-7 rounded-md hover:bg-white/5 flex items-center justify-center text-white/60 transition-colors"><MoreHorizontal className="w-4 h-4" /></button>
                </div>
                <div className="flex-1 p-8 overflow-y-auto">
                  <h2 className="text-xl font-semibold mb-6">Weekly product digest</h2>
                  <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#00d2ff] to-[#0B2551] flex items-center justify-center text-xs font-semibold">L</div>
                      <div>
                        <div className="text-sm font-medium">Linear <span className="text-white/50 font-normal">to me · 9:41 AM</span></div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full border border-[#00d2ff]/30 text-[#00d2ff] text-xs">Work</span>
                  </div>

                  <div className="liquid-glass rounded-xl p-4 mb-8">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-[#A4F4FD]" />
                      <span className="text-sm font-medium text-[#A4F4FD]">Summary by Kernel</span>
                    </div>
                    <p className="text-sm text-white/80 leading-relaxed">
                      Your team closed 23 issues, merged 14 PRs, and shipped 2 features. Top contributor: Marcus. No action needed.
                    </p>
                  </div>

                  <div className="space-y-4 text-sm text-white/80 leading-relaxed">
                    <p>Hi team,</p>
                    <p>Here is your weekly digest of everything happening across your projects. This was a strong week with significant progress on the Q3 roadmap.</p>
                    <p>Twenty-three issues were closed, fourteen pull requests were merged, and two customer-facing features went out. The velocity trend continues to climb.</p>
                    <p>Let me know if you would like a deeper breakdown by project or contributor.</p>
                    <p className="text-white/50 pt-2">— The Linear team</p>
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/10">
                    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm hover:bg-white/10 cursor-pointer transition-colors">
                      <Paperclip className="w-4 h-4 text-white/50" />
                      <span>digest-may-6.pdf</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        </section>

        {/* Section 5 — FeatureTriage */}
        <section className="w-full px-6 md:px-12 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-start">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <SectionEyebrow label="Triage" tag="AI-native" />
              <h2 className="mt-5 text-4xl md:text-6xl font-bold tracking-tight leading-[1.02]">
                Clear your inbox <br/> in a single pass.
              </h2>
              <p className="mt-6 text-white/60 text-lg leading-[1.6] max-w-lg">
                Kernel reads every message, understands intent, and routes the noise away from the signal. Focus on what moves your day forward — the rest handles itself.
              </p>
              <div className="mt-8 flex flex-wrap gap-2">
                {['Auto-categorize', 'Snooze for later', 'Silent newsletters', 'One-tap unsubscribe'].map(chip => (
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
              <div className="text-xs font-medium text-white/60 mb-4 px-1">Today · 42 messages triaged</div>
              <div className="space-y-3">
                {[
                  { title: 'Priority (4)', color: '#ffffff', items: ['Sophia Chen — Q3 review', 'David Lim — contract signoff'] },
                  { title: 'Follow-up (7)', color: '#e5e5e5', items: ['Marcus — design review', 'Figma — comment thread'] },
                  { title: 'Updates (18)', color: '#a3a3a3', items: ['Vercel — deploy ready', 'GitHub — PR #482 merged'] },
                  { title: 'Archived (13)', color: '#525252', items: ['Stripe payout · Newsletter · Receipts'] },
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

        {/* Section 6 — LogoCloud */}
        <section className="w-full px-6 md:px-12 py-16 md:py-20">
          <div className="text-center text-xs uppercase tracking-widest text-white/40">
            Trusted by the world's most thoughtful teams
          </div>
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-6">
            {['Linear', 'Vercel', 'Figma', 'Stripe', 'Ramp', 'Notion', 'Loom', 'Arc'].map((logo, i) => (
              <motion.div 
                key={logo}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="flex items-center justify-center"
              >
                <span className="text-sm font-semibold tracking-tight text-white/50 hover:text-white transition-colors cursor-pointer">{logo}</span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Section 7 — Testimonials */}
        <section className="w-full px-6 md:px-12 py-20 md:py-28 border-t border-white/10">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { quote: "Kernel gave our leadership team four hours of their week back. It reads like email from the future.", name: "Parker Wilf", role: "Group Product Manager", company: "MERCURY" },
              { quote: "The command palette alone has changed how I process messages. I can't imagine going back to a traditional client.", name: "Andrew von Rosenbach", role: "Senior Engineering Program Manager", company: "COHERE" },
              { quote: "Triage that actually understands context. Our team stopped dreading Monday morning inboxes.", name: "Mathies Christensen", role: "Engineering Manager", company: "LUNAR" }
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
              <div className="c3-desc">For creators taking their first steps with Forma.</div>
              <ul className="c3-list">
                <li><div className="c3-check"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>Up to 3 projects in the cloud</li>
                <li><div className="c3-check"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>Image export up to 1080p</li>
                <li><div className="c3-check"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>Basic editing tools</li>
                <li><div className="c3-check"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>Free templates and icons</li>
                <li><div className="c3-check"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>Access via web and mobile app</li>
              </ul>
              <button className="c3-btn">Choose Plan</button>
            </div>

            <div className="c3-card">
              <div className="c3-tier-small">Standard</div>
              <div className="c3-tier-large">{yearly ? '$99,99/y' : '$9,99/m'}</div>
              <div className="c3-desc">For freelancers and small teams who need more freedom and flexibility.</div>
              <ul className="c3-list">
                <li><div className="c3-check"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>Up to 50 projects in the cloud</li>
                <li><div className="c3-check"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>Export up to 4K</li>
                <li><div className="c3-check"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>Advanced editing toolkit</li>
                <li><div className="c3-check"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>Team collaboration (up to 5 members)</li>
                <li><div className="c3-check"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>Access to premium template library</li>
              </ul>
              <button className="c3-btn">Choose Plan</button>
            </div>

            <div className="c3-card c3-card-pro">
              <div className="c3-tier-small">Pro</div>
              <div className="c3-tier-large">{yearly ? '$199,99/y' : '$19,99/m'}</div>
              <div className="c3-desc">For studios, agencies, and professional creators working with brands.</div>
              <ul className="c3-list">
                <li><div className="c3-check"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>Unlimited projects</li>
                <li><div className="c3-check"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>Export up to 8K + animations</li>
                <li><div className="c3-check"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>AI-powered content generation tools</li>
                <li><div className="c3-check"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>Unlimited team members</li>
                <li><div className="c3-check"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>Brand customization</li>
              </ul>
              <button className="c3-btn">Choose Plan</button>
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
              Close the tabs. <br/> Open your day.
            </h2>
            <p className="relative z-10 mt-6 text-white/60 max-w-lg mx-auto text-base md:text-lg leading-[1.6]">
              Join thousands of builders, founders, and operators who treat email like a tool — not an obligation.
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
      </div>
    </div>
  );
}

function Auth() {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(true);
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

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-[#0c0c0c] text-white px-6">
      <div className="absolute inset-0 pointer-events-none opacity-30" style={{ background: 'radial-gradient(800px circle at 50% 0%, #0B2551, transparent 70%)' }} />
      <div className="absolute inset-0 pointer-events-none opacity-20" style={{ background: 'radial-gradient(400px circle at 50% -20%, #A4F4FD, transparent 80%)' }} />
      
      <button onClick={() => navigate('/')} className="absolute top-8 left-8 text-white/50 hover:text-white transition-colors text-sm flex items-center gap-2">
        <ChevronRight className="w-4 h-4 rotate-180" /> Back
      </button>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="liquid-glass w-full max-w-md rounded-3xl p-8 md:p-12 relative z-10"
      >
        <div className="flex justify-center mb-8">
          <LogoMark className="w-40 h-40 object-contain" />
        </div>
        <h2 className="text-3xl font-bold text-center mb-2 tracking-tight">
          {isSignUp ? 'Create an account' : 'Welcome back'}
        </h2>
        <p className="text-white/60 text-center mb-8 text-sm">
          {isSignUp ? 'Sign up to get started with Kernel.' : 'Sign in to your account to continue.'}
        </p>

        {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl mb-6">{error}</div>}

        <div className="space-y-4">
          <form className="space-y-4" onSubmit={handleEmailAuth}>
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1.5">Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1.5">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30 transition-colors" />
            </div>
            <button disabled={loading} type="submit" className="w-full bg-white text-black font-semibold rounded-xl py-3 text-sm hover:bg-white/90 transition-colors mt-2 disabled:opacity-50">
              {loading ? 'Authenticating...' : (isSignUp ? 'Sign Up' : 'Sign In')}
            </button>
          </form>

          <div className="text-center mt-6">
            <button 
              onClick={() => { setIsSignUp(!isSignUp); setError(null); }} 
              className="text-xs text-white/50 hover:text-white transition-colors"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </motion.div>
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
        <Route path="/auth" element={<Auth />} />
        <Route path="/success" element={<Success />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Home />} />
          <Route path="ai" element={<AIChat />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
