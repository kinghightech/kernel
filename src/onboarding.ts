// Stores and loads a user's onboarding answers in Supabase.
// While a user is filling out onboarding before they have an account, the
// answers are staged in localStorage and flushed to Supabase once they log in.

import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { Theme } from './theme';

export interface OnboardingData {
  businessType: string | null;
  address: string;
  lat: number | null;
  lng: number | null;
  revenue: string;
  profitMargin: string;
  businessModel: string | null;
  mixedModels: string[];
  peakTraffic: string | null;
  customerSource: string | null;
  promotionStyle: string | null;
  businessName: string;
  theme: Theme;
}

const PENDING_KEY = 'kernel_pending_onboarding';

// Stage answers locally (before the account exists, or as a safety net).
export function stageOnboardingLocal(data: OnboardingData) {
  try { localStorage.setItem(PENDING_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}
export function clearPendingOnboarding() {
  try { localStorage.removeItem(PENDING_KEY); } catch { /* ignore */ }
}

// Write the answers to Supabase for the logged-in user.
export async function saveOnboarding(data: OnboardingData) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not logged in' as const };

  const { error } = await supabase.from('onboarding').upsert(
    {
      user_id: user.id,
      business_type: data.businessType,
      address: data.address,
      lat: data.lat,
      lng: data.lng,
      revenue: data.revenue,
      profit_margin: data.profitMargin,
      business_model: data.businessModel,
      mixed_models: data.mixedModels,
      peak_traffic: data.peakTraffic,
      customer_source: data.customerSource,
      promotion_style: data.promotionStyle,
      business_name: data.businessName,
      theme: data.theme,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
  return { error };
}

// Update just the saved theme for the current user.
export async function saveTheme(theme: Theme) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase
    .from('onboarding')
    .update({ theme, updated_at: new Date().toISOString() })
    .eq('user_id', user.id);
}

// If there are staged answers and the user is now logged in, push them up.
export async function flushPendingOnboarding() {
  let raw: string | null = null;
  try { raw = localStorage.getItem(PENDING_KEY); } catch { /* ignore */ }
  if (!raw) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  try {
    const data = JSON.parse(raw) as OnboardingData;
    const { error } = await saveOnboarding(data);
    if (!error) clearPendingOnboarding();
  } catch { /* ignore malformed */ }
}

// Load the saved answers back from Supabase (null if none yet).
export async function loadOnboarding(): Promise<OnboardingData | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('onboarding')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!data) return null;
  return {
    businessType: data.business_type ?? null,
    address: data.address ?? '',
    lat: data.lat ?? null,
    lng: data.lng ?? null,
    revenue: data.revenue ?? '',
    profitMargin: data.profit_margin ?? '',
    businessModel: data.business_model ?? null,
    mixedModels: data.mixed_models ?? [],
    peakTraffic: data.peak_traffic ?? null,
    customerSource: data.customer_source ?? null,
    promotionStyle: data.promotion_style ?? null,
    businessName: data.business_name ?? '',
    theme: data.theme === 'light' ? 'light' : 'dark',
  };
}

// Hook for components that want to show the saved onboarding data.
export function useOnboarding() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OnboardingData | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadOnboarding().then(d => {
      if (!cancelled) { setData(d); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, []);

  return { loading, data, hasOnboarded: !!data };
}
