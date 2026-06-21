import { useEffect, useState } from 'react';
import {
  Home as HomeIcon, Loader2, Sun, Cloud, CloudRain, CloudSnow, CloudDrizzle, CloudFog, CloudLightning,
  TrendingUp, TrendingDown, DollarSign, ShoppingBag, Package, Users, Plus, Trash2, Check,
} from 'lucide-react';
import { useOnboarding } from '../onboarding';
import { fetchWeather, forecastDay, type WeatherDay, type DayForecast } from '../insights';
import { fetchSquareData, type SquareSummary } from '../square';
import { loadTodos, addTodo, toggleTodo, deleteTodo, type Todo } from '../todos';

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
  const [newTodo, setNewTodo] = useState('');

  useEffect(() => {
    if (data?.lat == null || data?.lng == null) return;
    let cancelled = false;
    setWxLoading(true);
    fetchWeather(data.lat, data.lng)
      .then((days) => { if (!cancelled) setWeek(days.map((d) => ({ day: d, fc: forecastDay(d) }))); })
      .catch((e) => console.error('weather failed', e))
      .finally(() => { if (!cancelled) setWxLoading(false); });
    return () => { cancelled = true; };
  }, [data?.lat, data?.lng]);

  useEffect(() => { fetchSquareData().then(setSquare).catch(() => {}); }, []);
  useEffect(() => { loadTodos().then(setTodos); }, []);

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newTodo.trim();
    if (!text) return;
    setNewTodo('');
    const created = await addTodo(text);
    if (created) setTodos((p) => [...p, created]);
  };

  const handleToggle = async (t: Todo) => {
    setTodos((p) => p.map((x) => x.id === t.id ? { ...x, done: !x.done } : x));
    await toggleTodo(t.id, !t.done);
  };

  const handleDeleteTodo = async (id: string) => {
    setTodos((p) => p.filter((x) => x.id !== id));
    await deleteTodo(id);
  };

  const today = week?.[0];
  const sq = square?.connected ? square : null;
  const fmtMoney = (n: number | undefined) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency: sq?.currency || 'USD', maximumFractionDigits: 0 }).format(n ?? 0);

  return (
    <div className="relative h-full overflow-y-auto bg-white text-neutral-900 dark:bg-[#0c0c0c] dark:text-white">
      <div className="absolute inset-0 pointer-events-none opacity-30 hidden dark:block" style={{ background: 'radial-gradient(800px circle at 50% 0%, #0B2551, transparent 70%)' }} />

      <div className="relative z-10 max-w-2xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-full bg-black/[0.05] border border-black/10 dark:bg-white/10 dark:border-white/20 flex items-center justify-center">
            <HomeIcon className="w-6 h-6 text-blue-600 dark:text-[#A4F4FD]" />
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
          <div className={`${card} p-8 mb-6`}>
            {wxLoading && !today ? (
              <div className="flex items-center gap-2 text-neutral-500 dark:text-white/50 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Reading today's conditions…
              </div>
            ) : today && (() => {
              const Icon = weatherIcon(today.day.weatherCode);
              const red = today.fc.isRedDay;
              return (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-neutral-400 dark:text-white/40 font-semibold mb-2">Today's outlook</div>
                      <div className={`text-5xl font-bold tracking-tight ${red ? 'text-red-500' : 'text-emerald-500'}`}>
                        {red ? 'Red Day' : 'Green Day'}
                      </div>
                      <div className="text-base text-neutral-500 dark:text-white/60 mt-2">
                        {red
                          ? 'Expect lighter foot traffic — a good day to run a promo.'
                          : `Conditions look good for business today. ${today.fc.condition}.`}
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <Icon className={`w-12 h-12 ${red ? 'text-blue-400' : 'text-yellow-400'}`} />
                      <span className="text-lg font-semibold">{today.day.tempHigh}°</span>
                    </div>
                  </div>

                  {/* 7-day strip (dots, not a graph) */}
                  {week && (
                    <div className="flex justify-between mt-7 pt-6 border-t border-black/5 dark:border-white/5">
                      {week.map(({ day, fc }) => {
                        const DIcon = weatherIcon(day.weatherCode);
                        return (
                          <div key={day.date} className="flex flex-col items-center gap-1.5">
                            <span className="text-xs text-neutral-400 dark:text-white/40">{day.dayName}</span>
                            <DIcon className="w-4 h-4 text-neutral-400 dark:text-white/40" />
                            <span className="text-xs text-neutral-500 dark:text-white/50">{day.tempHigh}°</span>
                            {fc.isRedDay
                              ? <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                              : <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <p className="text-[11px] leading-relaxed text-neutral-400 dark:text-white/30 mt-5">
                    This outlook is an estimate based on local weather and is provided for general informational
                    and planning purposes only — it may not be accurate and is not a guarantee of business results.
                  </p>
                </>
              );
            })()}
          </div>
        )}

        {/* Square performance (only if connected) */}
        {sq && (
          <div className={`${card} p-6 mb-6`}>
            <div className="flex items-center gap-2 mb-5">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <h2 className="font-semibold">Your Square performance</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
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
                <div className="space-y-2">
                  {sq.top_items_last_30_days.slice(0, 5).map((item, i) => (
                    <div key={item.name} className="flex items-center gap-3 text-sm">
                      <span className="w-5 text-neutral-400 dark:text-white/30 font-semibold">{i + 1}</span>
                      <span className="flex-1 truncate">{item.name}</span>
                      <span className="text-neutral-500 dark:text-white/50">{item.quantity} sold</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Today's to-do */}
        <div className={`${card} p-6`}>
          <h2 className="font-semibold mb-4">Today's to-do</h2>
          <form onSubmit={handleAddTodo} className="flex gap-2 mb-4">
            <input
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Add a task…"
              className="flex-1 rounded-xl px-4 py-2.5 text-sm bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 outline-none focus:border-black/30 dark:focus:border-white/30 transition-colors placeholder:text-neutral-400 dark:placeholder:text-white/30"
            />
            <button type="submit" className="shrink-0 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-black px-4 flex items-center justify-center hover:opacity-90 transition-opacity">
              <Plus className="w-4 h-4" />
            </button>
          </form>

          {todos.length === 0 ? (
            <p className="text-sm text-neutral-400 dark:text-white/30 py-2">Nothing yet — add your first task above.</p>
          ) : (
            <div className="space-y-1">
              {todos.map((t) => (
                <div key={t.id} className="flex items-center gap-3 group py-1.5">
                  <button
                    onClick={() => handleToggle(t)}
                    className={`shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                      t.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-black/20 dark:border-white/20 hover:border-emerald-500'
                    }`}
                  >
                    {t.done && <Check className="w-3.5 h-3.5" />}
                  </button>
                  <span className={`flex-1 text-sm ${t.done ? 'line-through text-neutral-400 dark:text-white/30' : ''}`}>{t.text}</span>
                  <button onClick={() => handleDeleteTodo(t.id)} className="shrink-0 text-neutral-300 hover:text-red-500 dark:text-white/20 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, icon: Icon }: { label: string; value: string; sub: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-xl bg-black/[0.03] dark:bg-white/[0.04] p-3">
      <div className="flex items-center gap-1.5 text-xs text-neutral-400 dark:text-white/40 mb-1">
        {Icon && <Icon className="w-3 h-3" />} {label}
      </div>
      <div className="text-lg font-bold tracking-tight">{value}</div>
      <div className="text-xs text-neutral-400 dark:text-white/30">{sub}</div>
    </div>
  );
}
