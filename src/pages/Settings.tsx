import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, CreditCard, Loader2, Sun, Moon, Check, AlertCircle, RefreshCw, Plug, Building2, MapPin, DollarSign, Percent, Users, Calendar, Tag } from 'lucide-react';
import { useSubscription, openBillingPortal } from '../billing';
import { saveTheme, useOnboarding } from '../onboarding';
import { applyTheme, getStoredTheme, type Theme } from '../theme';
import {
  connectSquare, disconnectSquare, getSquareStatus, fetchSquareData,
  type SquareStatus, type SquareSummary,
} from '../square';

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

  const { data: business } = useOnboarding();

  // --- Square integration state ---
  const [square, setSquare] = useState<SquareStatus>({ connected: false, connection: null });
  const [squareLoading, setSquareLoading] = useState(true);
  const [squareBusy, setSquareBusy] = useState(false);
  const [summary, setSummary] = useState<SquareSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  // Read the ?square=connected|error flag Square redirected with, once, lazily.
  const [banner] = useState<'connected' | 'error' | null>(() => {
    const flag = new URLSearchParams(window.location.search).get('square');
    return flag === 'connected' || flag === 'error' ? flag : null;
  });

  const handleManage = async () => {
    setOpening(true);
    await openBillingPortal();
    setOpening(false);
  };

  // On load: clean the ?square flag out of the URL (so a refresh doesn't re-show
  // the banner) and fetch the current connection status.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('square')) {
      window.history.replaceState({}, '', window.location.pathname);
    }
    getSquareStatus().then((s) => {
      setSquare(s);
      setSquareLoading(false);
    });
  }, []);

  const handleConnectSquare = async () => {
    setSquareBusy(true);
    await connectSquare(); // redirects away on success
    setSquareBusy(false);
  };

  const handleDisconnectSquare = async () => {
    setSquareBusy(true);
    const ok = await disconnectSquare();
    if (ok) {
      setSquare({ connected: false, connection: null });
      setSummary(null);
    }
    setSquareBusy(false);
  };

  const handleRefreshSquareData = async () => {
    setSummaryLoading(true);
    setSummary(await fetchSquareData());
    setSummaryLoading(false);
  };

  const fmtMoney = (n: number | undefined, currency: string | undefined) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency: currency || 'USD' })
      .format(n ?? 0);

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

        {/* Business information */}
        {business && (() => {
          const rows = [
            { icon: Building2, label: 'Business type', value: business.businessType },
            { icon: MapPin, label: 'Location', value: business.address },
            { icon: DollarSign, label: 'Avg daily revenue', value: business.revenue ? `$${Number(business.revenue).toLocaleString()}` : null },
            { icon: Percent, label: 'Profit margin', value: business.profitMargin ? `${business.profitMargin}%` : null },
            { icon: Users, label: 'Business model', value: business.businessModel === 'Mixed' ? business.mixedModels.join(', ') : business.businessModel },
            { icon: Calendar, label: 'Peak traffic', value: business.peakTraffic },
            { icon: Users, label: 'Customers come from', value: business.customerSource },
            { icon: Tag, label: 'Promotions', value: business.promotionStyle },
          ].filter(r => r.value);
          if (!rows.length) return null;
          return (
            <div className="rounded-2xl border border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.03] p-6 mb-6">
              <h2 className="text-sm font-semibold text-neutral-500 dark:text-white/70 mb-4">Business information</h2>
              <div className="divide-y divide-black/5 dark:divide-white/5 -my-2">
                {rows.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-4 py-3">
                    <Icon className="w-4 h-4 text-neutral-400 dark:text-white/40 shrink-0" />
                    <span className="text-neutral-500 dark:text-white/50 text-sm w-40 shrink-0">{label}</span>
                    <span className="text-sm text-neutral-900 dark:text-white/90">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Integrations — Square */}
        <div className="rounded-2xl border border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.03] p-6 mb-6">
          <h2 className="text-sm font-semibold text-neutral-500 dark:text-white/70 mb-4">Integrations</h2>

          {banner === 'connected' && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-2.5 text-sm text-green-700 dark:text-green-300">
              <Check className="w-4 h-4 shrink-0" /> Square connected successfully.
            </div>
          )}
          {banner === 'error' && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0" /> Something went wrong connecting Square. Please try again.
            </div>
          )}

          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-black/[0.06] dark:bg-white/10 p-2.5">
                <Plug className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-sm">Square</p>
                {squareLoading ? (
                  <p className="text-neutral-500 dark:text-white/50 text-sm">Checking…</p>
                ) : square.connected ? (
                  <p className="text-neutral-500 dark:text-white/50 text-sm">
                    {square.connection?.business_name || 'Connected account'}
                    {square.connection?.environment === 'sandbox' && (
                      <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-300 text-[11px]">sandbox</span>
                    )}
                  </p>
                ) : (
                  <p className="text-neutral-500 dark:text-white/50 text-sm">Connect to read revenue, sales and customers.</p>
                )}
              </div>
            </div>

            {!squareLoading && (
              square.connected ? (
                <button
                  onClick={handleDisconnectSquare}
                  disabled={squareBusy}
                  className="shrink-0 rounded-xl border border-black/10 dark:border-white/15 px-4 py-2 text-sm font-medium hover:bg-black/[0.04] dark:hover:bg-white/10 transition-colors disabled:opacity-50"
                >
                  {squareBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Disconnect'}
                </button>
              ) : (
                <button
                  onClick={handleConnectSquare}
                  disabled={squareBusy}
                  className="shrink-0 flex items-center gap-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {squareBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plug className="w-4 h-4" />}
                  Connect
                </button>
              )
            )}
          </div>

          {/* Live data peek (only when connected) */}
          {square.connected && (
            <div className="mt-5 border-t border-black/10 dark:border-white/10 pt-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-neutral-500 dark:text-white/50">Live snapshot</span>
                <button
                  onClick={handleRefreshSquareData}
                  disabled={summaryLoading}
                  className="flex items-center gap-1.5 text-sm text-neutral-600 dark:text-white/70 hover:text-neutral-900 dark:hover:text-white disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${summaryLoading ? 'animate-spin' : ''}`} />
                  {summary ? 'Refresh' : 'Load data'}
                </button>
              </div>

              {summary && summary.revenue && (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500 dark:text-white/50">Revenue today</span>
                    <span className="font-medium">{fmtMoney(summary.revenue.today, summary.currency)} <span className="text-neutral-400 dark:text-white/40">({summary.revenue.today_count} sales)</span></span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500 dark:text-white/50">Revenue last 7 days</span>
                    <span className="font-medium">{fmtMoney(summary.revenue.last_7_days, summary.currency)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500 dark:text-white/50">Catalog items</span>
                    <span className="font-medium">{summary.catalog_item_count ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500 dark:text-white/50">Customers</span>
                    <span className="font-medium">{summary.customers?.count ?? 0}{summary.customers?.capped ? '+' : ''}</span>
                  </div>
                  {summary.top_items_last_30_days && summary.top_items_last_30_days.length > 0 && (
                    <div className="pt-2">
                      <p className="text-neutral-500 dark:text-white/50 mb-1.5">Top sellers (30 days)</p>
                      <ul className="space-y-1">
                        {summary.top_items_last_30_days.map((it) => (
                          <li key={it.name} className="flex items-center justify-between">
                            <span>{it.name}</span>
                            <span className="text-neutral-400 dark:text-white/40">×{it.quantity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
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
                  <span className="capitalize">{status ?? '—'}</span>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500 dark:text-white/50 text-sm">Renews on</span>
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

        {/* Support & Legal */}
        <div className="rounded-2xl border border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.03] p-6 mt-8 mb-6">
          <h2 className="text-sm font-semibold text-neutral-500 dark:text-white/70 mb-4">Support & Legal</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-neutral-500 dark:text-white/50 text-sm">Contact Support</span>
              <a href="mailto:shibe.aahish@gmail.com" className="text-sm font-medium text-neutral-900 dark:text-white hover:text-neutral-600 dark:hover:text-white/70 transition-colors">shibe.aahish@gmail.com</a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-500 dark:text-white/50 text-sm">Terms of Service</span>
              <a href="https://kerneltermsofservice.notion.site/" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-neutral-900 dark:text-white hover:text-neutral-600 dark:hover:text-white/70 transition-colors">View Terms</a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-500 dark:text-white/50 text-sm">Privacy Policy</span>
              <a href="https://kernelprivacypolicy.notion.site/" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-neutral-900 dark:text-white hover:text-neutral-600 dark:hover:text-white/70 transition-colors">View Policy</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
