import { useEffect, useState } from 'react';
import {
  Home as HomeIcon, Loader2, Sun, Cloud, CloudRain, CloudSnow, CloudDrizzle, CloudFog, CloudLightning,
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, Package, Users, Check, ListChecks,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useOnboarding } from '../onboarding';
import { fetchWeather, forecastDay, type WeatherDay, type DayForecast } from '../insights';
import { fetchSquareData, type SquareSummary } from '../square';
import { loadTodayTodos, toggleTodo, type Todo } from '../todos';

function weatherIcon(code: number) {
  if (code <= 1) return Sun;
  if (code <= 3) return Cloud;
  if (code >= 45 && code <= 48) return CloudFog;
  if (code >= 51 && code <= 57) return CloudDrizzle;
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return CloudRain;
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return CloudSnow;
  if (code >= 95) return CloudLightning;
  return Cloud;
}

const card = 'rounded-2xl border border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.03]';

export default function Home() {
  const { data } = useOnboarding();
  const [week, setWeek] = useState<{ day: WeatherDay; fc: DayForecast }[] | null>(null);
  const [wxLoading, setWxLoading] = useState(false);
  const [square, setSquare] = useState<SquareSummary | null>(null);
  const [todos, setTodos] = useState<Todo[]>([]);

  useEffect(() => {
    const lat = data?.lat, lng = data?.lng;
    if (lat == null || lng == null) return;
    let cancelled = false;
    // Run the fetch (and its loading flag) inside an async function so no
    // setState is called synchronously in the effect body — avoids cascading renders.
    (async () => {
      setWxLoading(true);
      try {
        const days = await fetchWeather(lat, lng);
        if (!cancelled) setWeek(days.map((d) => ({ day: d, fc: forecastDay(d) })));
      } catch (e) {
        console.error('weather failed', e);
      } finally {
        if (!cancelled) setWxLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [data?.lat, data?.lng]);

  useEffect(() => { fetchSquareData().then(setSquare).catch(() => {}); }, []);
  useEffect(() => { loadTodayTodos().then(setTodos); }, []);

  const handleToggle = async (t: Todo) => {
    setTodos((p) => p.map((x) => x.id === t.id ? { ...x, done: !x.done } : x));
    await toggleTodo(t.id, !t.done);
  };

  const today = week?.[0];
  const sq = square?.connected ? square : null;
  const fmtMoney = (n: number | undefined) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency: sq?.currency || 'USD', maximumFractionDigits: 0 }).format(n ?? 0);

  return (
    <div className="relative h-full overflow-y-auto bg-white text-neutral-900 dark:bg-[#0c0c0c] dark:text-white">
      <div className="relative z-10 max-w-5xl mx-auto px-8 py-10">
        <div className="flex items-center gap-3.5 mb-9">
          <div className="w-12 h-12 rounded-2xl bg-black/[0.05] border border-black/10 dark:bg-white/10 dark:border-white/20 flex items-center justify-center shrink-0">
            <HomeIcon className="w-6 h-6 text-neutral-900 dark:text-white" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {data?.businessName ? `Welcome back, ${data.businessName}` : 'Welcome back'}
            </h1>
            <p className="text-neutral-500 dark:text-white/50 text-sm">Here's how today's shaping up.</p>
          </div>
        </div>

        {/* Today's outlook: green day / red day (no numbers) */}
        {(wxLoading || today) && (
          <div className={`${card} p-8 mb-8`}>
            {wxLoading && !today ? (
              <div className="flex items-center gap-2 text-neutral-500 dark:text-white/50 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Reading today's conditions…
              </div>
            ) : today && (() => {
              const Icon = weatherIcon(today.day.weatherCode);
              const red = today.fc.isRedDay;
              return (
                <>
                  <div className="flex items-center justify-between gap-6">
                    <div>
                      <div className="text-[11px] uppercase tracking-wide text-neutral-400 dark:text-white/40 font-medium mb-1.5">Today's outlook</div>
                      <div className={`text-3xl font-semibold tracking-tight ${red ? 'text-red-500' : 'text-emerald-500'}`}>
                        {red ? 'Red Day' : 'Green Day'}
                      </div>
                      <div className="text-sm text-neutral-500 dark:text-white/60 mt-2 max-w-lg">
                        {red
                          ? 'Expect lighter foot traffic — a good day to run a promo.'
                          : `Conditions look good for business today. ${today.fc.condition}.`}
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <Icon className={`w-12 h-12 ${red ? 'text-neutral-400 dark:text-white/50' : 'text-yellow-400'}`} strokeWidth={1.75} />
                      <span className="text-xl font-semibold">{today.day.tempHigh}°</span>
                    </div>
                  </div>

                  {/* 7-day strip (dots, not a graph) */}
                  {week && (
                    <div className="flex justify-between mt-9 pt-8 border-t border-black/5 dark:border-white/5">
                      {week.map(({ day, fc }) => {
                        const DIcon = weatherIcon(day.weatherCode);
                        return (
                          <div key={day.date} className="flex flex-col items-center gap-2">
                            <span className="text-sm text-neutral-400 dark:text-white/40">{day.dayName}</span>
                            <DIcon className="w-5 h-5 text-neutral-400 dark:text-white/40" />
                            <span className="text-sm text-neutral-500 dark:text-white/50">{day.tempHigh}°</span>
                            {fc.isRedDay
                              ? <TrendingDown className="w-4 h-4 text-red-500" />
                              : <TrendingUp className="w-4 h-4 text-emerald-500" />}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <p className="text-xs leading-relaxed text-neutral-400 dark:text-white/30 mt-6">
                    This outlook is an estimate based on local weather and is provided for general informational
                    and planning purposes only — it may not be accurate and is not a guarantee of business results.
                  </p>
                </>
              );
            })()}
          </div>
        )}

        {/* Lower row: Square performance + Today's to-do */}
        <div className={`grid gap-8 ${sq ? 'lg:grid-cols-3' : 'lg:grid-cols-1'}`}>
          {/* Square performance (only if connected) */}
          {sq && (
            <div className={`${card} p-8 lg:col-span-2`}>
              <div className="flex items-center gap-2 mb-6">
                <DollarSign className="w-5 h-5 text-emerald-500" />
                <h2 className="text-lg font-semibold">Your Square performance</h2>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Stat label="Today" value={fmtMoney(sq.revenue?.today)} sub={`${sq.revenue?.today_count ?? 0} orders`} />
                <Stat label="Last 7 days" value={fmtMoney(sq.revenue?.last_7_days)} sub={`${sq.revenue?.last_7_days_count ?? 0} orders`} />
                <Stat label="Catalog" value={`${sq.catalog_item_count ?? 0}`} sub="items" icon={Package} />
                <Stat label="Customers" value={`${sq.customers?.count ?? 0}${sq.customers?.capped ? '+' : ''}`} sub="total" icon={Users} />
              </div>

              {sq.top_items_last_30_days && sq.top_items_last_30_days.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-neutral-400 dark:text-white/40 font-semibold mb-3">
                    <ShoppingBag className="w-3.5 h-3.5" /> Top sellers (30 days)
                  </div>
                  <div className="space-y-2.5">
                    {sq.top_items_last_30_days.slice(0, 5).map((item, i) => (
                      <div key={item.name} className="flex items-center gap-3 text-sm">
                        <span className="w-6 h-6 rounded-md bg-black/5 dark:bg-white/10 flex items-center justify-center text-neutral-500 dark:text-white/50 font-semibold text-xs">{i + 1}</span>
                        <span className="flex-1 truncate">{item.name}</span>
                        <span className="text-neutral-500 dark:text-white/50">{item.quantity} sold</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Today's to-do (check-off only; add tasks from the Checklist page) */}
          <div className={`${card} p-8`}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">Today's to-do</h2>
              <Link to="/dashboard/checklist" className="text-xs font-medium text-neutral-900 dark:text-white hover:opacity-80 flex items-center gap-1">
                <ListChecks className="w-3.5 h-3.5" /> Edit
              </Link>
            </div>

            {todos.length === 0 ? (
              <p className="text-sm text-neutral-400 dark:text-white/30 py-2">
                Nothing for today. Add tasks in the <Link to="/dashboard/checklist" className="underline">Checklist</Link>.
              </p>
            ) : (
              <div className="space-y-1.5">
                {todos.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 py-1.5">
                    <button
                      onClick={() => handleToggle(t)}
                      className={`shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                        t.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-black/20 dark:border-white/20 hover:border-emerald-500'
                      }`}
                    >
                      {t.done && <Check className="w-3.5 h-3.5" />}
                    </button>
                    <span className={`flex-1 text-sm ${t.done ? 'line-through text-neutral-400 dark:text-white/30' : ''}`}>{t.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, icon: Icon }: { label: string; value: string; sub: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-xl bg-black/[0.03] dark:bg-white/[0.04] p-4">
      <div className="flex items-center gap-1.5 text-xs text-neutral-400 dark:text-white/40 mb-1.5">
        {Icon && <Icon className="w-3.5 h-3.5" />} {label}
      </div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <div className="text-xs text-neutral-400 dark:text-white/30 mt-0.5">{sub}</div>
    </div>
  );
}
