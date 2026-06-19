// Frontend helpers for subscriptions.
// - startCheckout(): turns a plan button click into a Stripe checkout redirect.
// - useSubscription(): tells a component whether the current user has paid.

import { useCallback, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export type Plan = 'pro' | 'max';
export type Interval = 'month' | 'year';

// Called when a user clicks "Choose Plan". If they are not logged in we send
// them to sign up first; otherwise we ask our Edge Function for a Stripe
// checkout page and redirect the browser to it.
export async function startCheckout(plan: Plan, interval: Interval = 'month') {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    // New visitor — send them through onboarding (which ends in sign up).
    window.location.href = '/onboarding';
    return;
  }

  const { data, error } = await supabase.functions.invoke('create-checkout', {
    body: { plan, interval },
  });

  if (error || !data?.url) {
    console.error('Checkout error:', error, data);
    alert('Sorry, we could not start checkout. Please try again.');
    return;
  }

  window.location.href = data.url as string;
}

// Opens Stripe's hosted billing portal so the user can manage or cancel.
export async function openBillingPortal() {
  const { data, error } = await supabase.functions.invoke('create-portal', { body: {} });
  if (error || !data?.url) {
    console.error('Portal error:', error, data);
    alert('Could not open billing settings. Please try again.');
    return;
  }
  window.location.href = data.url as string;
}

export interface SubState {
  loading: boolean;
  user: User | null;
  isActive: boolean;
  plan: string | null;
  status: string | null;
  currentPeriodEnd: string | null;
  refresh: () => Promise<void>;
}

// Reads the logged-in user's subscription row and reports whether it's active.
export function useSubscription(): SubState {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user ?? null);

    if (!user) {
      setIsActive(false);
      setPlan(null);
      setStatus(null);
      setCurrentPeriodEnd(null);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('subscriptions')
      .select('status, plan, current_period_end')
      .eq('user_id', user.id)
      .maybeSingle();

    const active = data?.status === 'active' || data?.status === 'trialing';
    setIsActive(!!active);
    setPlan(data?.plan ?? null);
    setStatus(data?.status ?? null);
    setCurrentPeriodEnd(data?.current_period_end ?? null);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { loading, user, isActive, plan, status, currentPeriodEnd, refresh };
}
