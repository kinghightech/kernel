import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { Home, Sparkles, LogOut, Settings, Megaphone, Globe, PhoneCall, ListChecks } from 'lucide-react';
import { supabase } from '../supabase';
import { useSubscription } from '../billing';
import { flushPendingOnboarding } from '../onboarding';
import { applyTheme, type Theme } from '../theme';

const LogoMark = ({ className = 'w-8 h-8' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 256 256" fill="currentColor">
    <path d="M 0 128 C 70.692 128 128 185.308 128 256 L 64 256 C 64 220.654 35.346 192 0 192 Z M 256 192 C 220.654 192 192 220.654 192 256 L 128 256 C 128 185.308 185.308 128 256 128 Z M 128 0 C 128 70.692 70.692 128 0 128 L 0 64 C 35.346 64 64 35.346 64 0 Z M 192 0 C 192 35.346 220.654 64 256 64 L 256 128 C 185.308 128 128 70.692 128 0 Z" />
  </svg>
);

const navItems = [
  { to: '/dashboard', label: 'Home', icon: Home, end: true },
  { to: '/dashboard/ai', label: 'AI', icon: Sparkles, end: false },
  { to: '/dashboard/marketing', label: 'Marketing', icon: Megaphone, end: false },
  { to: '/dashboard/website', label: 'Website', icon: Globe, end: false },
  { to: '/dashboard/voice', label: 'Receptionist', icon: PhoneCall, end: false },
  { to: '/dashboard/checklist', label: 'Checklist', icon: ListChecks, end: false },
];

export default function DashboardLayout() {
  const navigate = useNavigate();
  const { loading, user, isActive, status, currentPeriodEnd, refresh } = useSubscription();
  const [searchParams] = useSearchParams();
  const justPaid = searchParams.get('checkout') === 'success';

  const [waitingForWebhook, setWaitingForWebhook] = useState(justPaid);
  useEffect(() => {
    if (!justPaid || isActive) {
      setWaitingForWebhook(false);
      return;
    }
    let tries = 0;
    const id = setInterval(async () => {
      tries += 1;
      await refresh();
      if (tries >= 8) {
        clearInterval(id);
        setWaitingForWebhook(false);
      }
    }, 2000);
    return () => clearInterval(id);
  }, [justPaid, isActive, refresh]);

  // Check onboarding completion and flush staged answers. We remember the saved
  // theme but only apply it once the user is a paying member on the real
  // dashboard — so the paywall handoff stays dark and never flashes.
  const [obLoading, setObLoading] = useState(true);
  const [hasOnboarded, setHasOnboarded] = useState(false);
  const [savedTheme, setSavedTheme] = useState<Theme | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (!cancelled) setObLoading(false); return; }
      await flushPendingOnboarding();
      const { data } = await supabase
        .from('onboarding')
        .select('user_id, theme')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!cancelled) {
        setSavedTheme(data?.theme === 'light' ? 'light' : 'dark');
        setHasOnboarded(!!data);
        setObLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Apply the user's saved theme once their data has loaded.
  useEffect(() => {
    if (loading || obLoading) return;
    applyTheme(savedTheme ?? 'dark');
  }, [loading, obLoading, savedTheme]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const trialDaysLeft =
    status === 'trialing' && currentPeriodEnd
      ? Math.max(0, Math.ceil((new Date(currentPeriodEnd).getTime() - Date.now()) / 86_400_000))
      : null;

  if (loading || obLoading || waitingForWebhook) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-neutral-900 dark:bg-[#0c0c0c] dark:text-white gap-4">
        <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-900 dark:border-white/20 dark:border-t-white rounded-full animate-spin" />
        <p className="text-neutral-500 dark:text-white/60 text-sm">
          {waitingForWebhook ? 'Finalizing your subscription…' : 'Loading…'}
        </p>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!hasOnboarded) return <Navigate to="/onboarding" replace />;
  // Paywall removed — app is live and open to any signed-in, onboarded user.

  return (
    <div className="flex h-screen bg-white text-neutral-900 dark:bg-[#0c0c0c] dark:text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-black/10 dark:border-white/10 bg-[#f7f8fa] dark:bg-black/40 backdrop-blur-md flex flex-col">
        <div className="flex items-center gap-3 px-5 h-16 border-b border-black/10 dark:border-white/10">
          <LogoMark className="w-7 h-7" />
          <span className="font-bold tracking-tight">Kernel</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-black/[0.06] text-neutral-900 dark:bg-white/10 dark:text-white'
                    : 'text-neutral-500 hover:bg-black/[0.04] hover:text-neutral-900 dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-black/10 dark:border-white/10 space-y-1">
          <button
            onClick={() => navigate('/dashboard/settings')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-black/[0.04] dark:hover:bg-white/5 transition-colors"
          >
            <Settings className="w-4 h-4 text-neutral-400 dark:text-white/60 shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-medium text-neutral-900 dark:text-white truncate">{user.email}</div>
              {trialDaysLeft !== null && (
                <div className="text-xs text-blue-600 dark:text-[#A4F4FD]">
                  Your trial ends in {trialDaysLeft} {trialDaysLeft === 1 ? 'day' : 'days'}
                </div>
              )}
            </div>
          </button>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-500 hover:bg-black/[0.04] hover:text-neutral-900 dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 min-w-0 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
