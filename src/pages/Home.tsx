import { useEffect, useState } from 'react';
import {
  Home as HomeIcon, Building2, MapPin, DollarSign, Percent, Users, Calendar, Tag, Loader2,
  Sun, Cloud, CloudRain, CloudSnow, CloudDrizzle, CloudFog, CloudLightning, TrendingUp, TrendingDown,
} from 'lucide-react';
import { useOnboarding } from '../onboarding';
import { fetchWeather, forecastDay, type WeatherDay, type DayForecast } from '../insights';

// WMO weather code → icon
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

export default function Home() {
  const { loading, data } = useOnboarding();
  const [week, setWeek] = useState<{ day: WeatherDay; fc: DayForecast }[] | null>(null);
  const [wxLoading, setWxLoading] = useState(false);

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

  const rows = data ? [
    { icon: Building2, label: 'Business type', value: data.businessType },
    { icon: MapPin, label: 'Location', value: data.address },
    { icon: DollarSign, label: 'Avg daily revenue', value: data.revenue ? `$${Number(data.revenue).toLocaleString()}` : null },
    { icon: Percent, label: 'Profit margin', value: data.profitMargin ? `${data.profitMargin}%` : null },
    { icon: Users, label: 'Business model', value: data.businessModel === 'Mixed' ? data.mixedModels.join(', ') : data.businessModel },
    { icon: Calendar, label: 'Peak traffic', value: data.peakTraffic },
    { icon: Users, label: 'Customers come from', value: data.customerSource },
    { icon: Tag, label: 'Promotions', value: data.promotionStyle },
  ].filter(r => r.value) : [];

  const today = week?.[0];

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

        {/* Today: green day / red day forecast */}
        {(wxLoading || today) && (
          <div className="mb-8 rounded-2xl border border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.03] p-6">
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
                      <div className="text-xs uppercase tracking-wide text-neutral-400 dark:text-white/40 font-semibold mb-1">Today's outlook</div>
                      <div className={`text-3xl font-bold tracking-tight ${red ? 'text-red-500' : 'text-emerald-500'}`}>
                        {red ? 'Red Day' : 'Green Day'}
                      </div>
                      <div className="text-sm text-neutral-500 dark:text-white/50 mt-1">
                        {red
                          ? 'Expect lighter traffic — a good day to push a promo.'
                          : `Projected +${today.fc.percent}% vs a typical day. ${today.fc.condition}.`}
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <Icon className={`w-9 h-9 ${red ? 'text-blue-400' : 'text-yellow-400'}`} />
                      <span className="text-sm font-semibold">{today.day.tempHigh}°</span>
                    </div>
                  </div>

                  {/* 7-day strip (dots, not a graph) */}
                  {week && (
                    <div className="flex justify-between mt-6 pt-5 border-t border-black/5 dark:border-white/5">
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
                </>
              );
            })()}
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-neutral-500 dark:text-white/50 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading your setup…
          </div>
        ) : rows.length === 0 ? (
          <p className="text-neutral-500 dark:text-white/50 text-sm">No setup data found yet.</p>
        ) : (
          <div className="rounded-2xl border border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.03] divide-y divide-black/5 dark:divide-white/5">
            {rows.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-4 px-5 py-4">
                <Icon className="w-4 h-4 text-neutral-400 dark:text-white/40 shrink-0" />
                <span className="text-neutral-500 dark:text-white/50 text-sm w-44 shrink-0">{label}</span>
                <span className="text-sm text-neutral-900 dark:text-white/90">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
