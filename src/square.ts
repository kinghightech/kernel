// Frontend helpers for the Square integration.
//
// The connect flow lives in the `square-oauth` edge function and is addressed by
// sub-path (/start, /status, /disconnect), which `supabase.functions.invoke`
// can't target — so we use raw fetch and attach the user's token by hand.
// `square-data` is a normal single function, so it goes through invoke().

import { supabase, supabaseUrl, supabaseAnonKey } from './supabase';

const FN_BASE = `${supabaseUrl}/functions/v1/square-oauth`;

async function authedFetch(action: string, init: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token ?? '';
  return fetch(`${FN_BASE}/${action}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });
}

export interface SquareConnection {
  business_name: string | null;
  merchant_id: string | null;
  environment: string;
  currency: string | null;
  timezone: string | null;
  connected_at: string;
  scopes: string[];
}

export interface SquareStatus {
  connected: boolean;
  connection: SquareConnection | null;
}

// Kick off the connect flow: ask our server for the Square authorization URL,
// then send the browser there. Square brings them back to /dashboard/settings.
export async function connectSquare() {
  const res = await authedFetch('start', {
    method: 'POST',
    body: JSON.stringify({ redirect_to: `${window.location.origin}/dashboard/settings` }),
  });
  const data = await res.json();
  if (!res.ok || !data?.url) {
    console.error('Square start error:', data);
    alert('Could not start the Square connection. Please try again.');
    return;
  }
  window.location.href = data.url as string;
}

export async function getSquareStatus(): Promise<SquareStatus> {
  try {
    const res = await authedFetch('status', { method: 'GET' });
    const data = await res.json();
    if (!res.ok) return { connected: false, connection: null };
    return data as SquareStatus;
  } catch (e) {
    console.error('Square status error:', e);
    return { connected: false, connection: null };
  }
}

export async function disconnectSquare(): Promise<boolean> {
  const res = await authedFetch('disconnect', { method: 'POST' });
  return res.ok;
}

export interface SquareSummary {
  connected: boolean;
  currency?: string;
  timezone?: string;
  revenue?: {
    today: number;
    today_count: number;
    last_7_days: number;
    last_7_days_count: number;
  };
  top_items_last_30_days?: { name: string; quantity: number }[];
  catalog_item_count?: number;
  customers?: { count: number; capped: boolean };
}

// Pull the live business summary (revenue, top sellers, etc.) for dashboards/AI.
export async function fetchSquareData(): Promise<SquareSummary | null> {
  const { data, error } = await supabase.functions.invoke('square-data', { body: {} });
  if (error) {
    console.error('Square data error:', error);
    return null;
  }
  return data as SquareSummary;
}
