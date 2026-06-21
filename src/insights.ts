// Local-signal insights ported from CashCast: a weather-driven "green day /
// red day" revenue forecast, and Ticketmaster local events. Both run client-
// side off the business's onboarding location (lat/lng).

export interface WeatherDay {
  date: string;
  dayName: string;
  tempHigh: number;
  tempLow: number;
  weatherCode: number;
  precipitation: number;
  snowfallCm: number;
  windspeedKmh: number;
}

// --- Weather ---------------------------------------------------------------

export async function fetchWeather(lat: number, lng: number): Promise<WeatherDay[]> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum,snowfall_sum,windspeed_10m_max&temperature_unit=fahrenheit&windspeed_unit=kmh&timezone=auto&forecast_days=7`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather request failed (${res.status})`);
  const data = await res.json();
  const d = data.daily;
  return (d.time as string[]).map((date, i) => ({
    date,
    dayName: new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }),
    tempHigh: Math.round(d.temperature_2m_max[i]),
    tempLow: Math.round(d.temperature_2m_min[i]),
    weatherCode: d.weathercode[i],
    precipitation: d.precipitation_sum[i] ?? 0,
    snowfallCm: d.snowfall_sum[i] ?? 0,
    windspeedKmh: d.windspeed_10m_max[i] ?? 0,
  }));
}

export interface DayForecast {
  isRedDay: boolean;
  percent: number;     // projected revenue change, e.g. +12 or -15
  condition: string;   // short weather/demand summary
}

// Day-of-week + weather model (from CashCast generateAIForecast). Returns a
// decimal impact turned into a percent. Red day = projected below baseline.
export function forecastDay(day: WeatherDay): DayForecast {
  let impact = 0;
  const dow = new Date(day.date + 'T00:00:00').getDay(); // 0 = Sun
  if (dow === 1 || dow === 2) impact -= 0.06;
  else if (dow === 5) impact += 0.05;
  else if (dow === 6) impact += 0.03;

  const code = day.weatherCode;
  const precip = day.precipitation;
  const snowIn = day.snowfallCm * 0.393701;
  const wind = day.windspeedKmh;
  const temp = day.tempHigh;
  let wAdj = 0;
  let condition = 'Stable conditions';

  if ((code >= 71 && code <= 86) || snowIn > 1) {
    if (snowIn > 6) { wAdj = -0.55; condition = 'Heavy snow'; }
    else if (snowIn > 4) { wAdj = -0.35; condition = 'Significant snow'; }
    else if (snowIn > 1) { wAdj = -0.15; condition = 'Light snow'; }
    else { wAdj = -0.20; condition = 'Snow expected'; }
  } else if (code >= 95) { wAdj = -0.50; condition = 'Thunderstorms'; }
  else if (precip > 20) { wAdj = -0.30; condition = 'Heavy rain'; }
  else if (precip > 5) { wAdj = -0.15; condition = 'Rain'; }
  else if (precip > 0) { wAdj = -0.05; condition = 'Light rain'; }
  else if (wind > 60) { wAdj = -0.20; condition = 'High winds'; }
  else if (temp > 70) { wAdj = 0.12; condition = 'Warm & clear'; }
  else if (temp > 60) { wAdj = 0.08; condition = 'Mild & clear'; }
  else if (temp > 50) { wAdj = 0.05; condition = 'Cool & clear'; }
  else if (temp < 20) { wAdj = -0.10; condition = 'Extreme cold'; }
  else if (temp < 30) { wAdj = -0.05; condition = 'Very cold'; }
  else if (temp < 40) { wAdj = -0.02; condition = 'Cold'; }
  else { wAdj = 0; condition = 'Neutral conditions'; }

  impact += wAdj;
  return {
    isRedDay: impact < 0,
    percent: Math.round(impact * 100),
    condition,
  };
}

// --- Ticketmaster local events ---------------------------------------------

export interface LocalEvent {
  id: string;
  name: string;
  date: string | null;     // ISO date of the event
  venue: string | null;
  url: string | null;
  image: string | null;
}

const TM_KEY = 'CbWqLGxPJkOnKoYFneIykAlLzOromtCl'; // public Ticketmaster discovery key

function mapEvents(raw: any[]): LocalEvent[] {
  return raw.map((e) => ({
    id: e.id,
    name: e.name,
    date: e.dates?.start?.localDate ?? null,
    venue: e._embedded?.venues?.[0]?.name ?? null,
    url: e.url ?? null,
    image: (e.images || []).sort((a: any, b: any) => (b.width || 0) - (a.width || 0))[0]?.url ?? null,
  }));
}

export async function fetchLocalEvents(lat: number, lng: number, address?: string): Promise<LocalEvent[]> {
  const run = async (params: URLSearchParams): Promise<any[]> => {
    const res = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?${params}`);
    if (!res.ok) throw new Error(`Ticketmaster request failed (${res.status})`);
    const data = await res.json();
    return data?._embedded?.events || [];
  };

  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 14);
  const startDate = today.toISOString().split('.')[0] + 'Z';
  const endDate = nextWeek.toISOString().split('.')[0] + 'Z';

  // Pass 1: strict local + date window.
  let events = await run(new URLSearchParams({
    apikey: TM_KEY, latlong: `${lat},${lng}`, radius: '35', unit: 'miles',
    startDateTime: startDate, endDateTime: endDate, size: '40', sort: 'date,asc',
  }));

  // Pass 2: broader local, no date window.
  if (!events.length) {
    events = await run(new URLSearchParams({
      apikey: TM_KEY, latlong: `${lat},${lng}`, radius: '60', unit: 'miles',
      size: '40', sort: 'date,asc',
    }));
  }

  // Pass 3: city fallback.
  if (!events.length && address) {
    const city = (address.split(',')[1] || address.split(',')[0] || '').trim();
    if (city) {
      events = await run(new URLSearchParams({
        apikey: TM_KEY, city, countryCode: 'US', size: '40', sort: 'date,asc',
      }));
    }
  }

  return mapEvents(events);
}
