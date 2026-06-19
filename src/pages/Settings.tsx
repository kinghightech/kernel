import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, CreditCard, Loader2, Sun, Moon } from 'lucide-react';
import { useSubscription, openBillingPortal } from '../billing';
import { saveTheme } from '../onboarding';
import { applyTheme, getStoredTheme, type Theme } from '../theme';

const PLAN_NAMES: Record<string, string> = { pro: 'Kernel Pro', max: 'Kernel Max' };

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function Settings() {
  const navigate = useNavigate();
  const { loading, user, plan, status, currentPeriodEnd } = useSubscription();
  const [opening, setOpening] = useState(false);
  const [theme, setThemeState] = useState<Theme>(getStoredTheme());

  const isTrial = status === 'trialing';

  const handleManage = async () => {
    setOpening(true);
    await openBillingPortal();
    setOpening(false);
  };

  const changeTheme = (next: Theme) => {
    setThemeState(next);
    applyTheme(next);
    saveTheme(next);
  };

  return (
    <div className="relative h-full overflow-y-auto bg-white text-neutral-900 dark:bg-[#0c0c0c] dark:text-white">
      <div className="absolute inset-0 pointer-events-none opacity-20 hidden dark:block" style={{ background: 'radial-gradient(800px circle at 50% 0%, #0B2551, transparent 70%)' }} />

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-12">
        <button onClick={() => navigate('/dashboard')} className="text-neutral-500 hover:text-neutral-900 dark:text-white/50 dark:hover:text-white transition-colors text-sm flex items-center gap-2 mb-8">
          <ChevronRight className="w-4 h-4 rotate-180" /> Back to dashboard
        </button>

        <h1 className="text-3xl font-bold tracking-tight mb-2">Settings</h1>
        <p className="text-neutral-500 dark:text-white/60 mb-10">Manage your account and subscription.</p>

        {/* Appearance */}
        <div className="rounded-2xl border border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.03] p-6 mb-6">
          <h2 className="text-sm font-semibold text-neutral-500 dark:text-white/70 mb-4">Appearance</h2>
          <div className="flex items-center justify-between">
            <span className="text-neutral-500 dark:text-white/50 text-sm">Theme</span>
            <div className="flex rounded-xl border border-black/10 dark:border-white/10 p-1 gap-1">
              {([['light', 'Light', Sun], ['dark', 'Dark', Moon]] as const).map(([id, label, Icon]) => (
                <button
                  key={id}
                  onClick={() => changeTheme(id)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    theme === id
                      ? 'bg-black/[0.06] text-neutral-900 dark:bg-white/15 dark:text-white'
                      : 'text-neutral-500 hover:text-neutral-900 dark:text-white/50 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Account */}
        <div className="rounded-2xl border border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.03] p-6 mb-6">
          <h2 className="text-sm font-semibold text-neutral-500 dark:text-white/70 mb-4">Account</h2>
          <div className="flex items-center justify-between">
            <span className="text-neutral-500 dark:text-white/50 text-sm">Email</span>
            <span className="text-sm">{user?.email ?? '—'}</span>
          </div>
        </div>

        {/* Subscription */}
        <div className="rounded-2xl border border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.03] p-6">
          <h2 className="text-sm font-semibold text-neutral-500 dark:text-white/70 mb-4">Subscription</h2>

          {loading ? (
            <div className="flex items-center gap-2 text-neutral-500 dark:text-white/50 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 dark:text-white/50 text-sm">Plan</span>
                <span className="text-sm font-medium">{plan ? PLAN_NAMES[plan] ?? plan : '—'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 dark:text-white/50 text-sm">Status</span>
                <span className="text-sm">
                  {isTrial ? (
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:bg-[#00d2ff]/10 dark:border-[#00d2ff]/30 dark:text-[#A4F4FD] text-xs">Free trial</span>
                  ) : (
                    <span className="capitalize">{status ?? '—'}</span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 dark:text-white/50 text-sm">{isTrial ? 'Trial ends' : 'Renews on'}</span>
                <span className="text-sm">{formatDate(currentPeriodEnd)}</span>
              </div>

              <button
                onClick={handleManage}
                disabled={opening}
                className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black font-semibold py-3 text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {opening ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                {opening ? 'Opening…' : 'Manage or cancel subscription'}
              </button>
              <p className="text-xs text-neutral-400 dark:text-white/40 text-center">
                Opens Stripe's secure billing page to update your card, view invoices, or cancel.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
