// AI call-answering ("voice agent"): enable/disable, business hours, and the
// log of calls the AI handled. The actual phone provisioning happens in the
// `voice-agent` edge function; this module is the thin client for the dashboard.

import { supabase } from './supabase';

export const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type DayKey = (typeof DAY_KEYS)[number];
export const DAY_LABELS: Record<DayKey, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday',
  fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
};

export interface HourSlot { open: string; close: string } // "17:00"
export type BusinessHours = Partial<Record<DayKey, HourSlot[]>>;

export interface VoiceAgentState {
  enabled: boolean;
  phone_number: string | null;
  phone_number_pretty: string | null;
}

export interface CallLead {
  caller_name?: string;
  callback_number?: string;
  reason?: string;
  wants_callback?: boolean;
}

export interface CallTurn { role: string; content: string }

export interface CallRecord {
  id: string;
  caller_number: string | null;
  transcript: CallTurn[] | null;
  summary: string | null;
  recording_url: string | null;
  duration_seconds: number | null;
  lead: CallLead | null;
  created_at: string;
}

// --- Agent on/off + number -------------------------------------------------

export async function loadVoiceAgent(): Promise<VoiceAgentState> {
  const { data } = await supabase
    .from('voice_agents')
    .select('enabled, phone_number, phone_number_pretty')
    .maybeSingle();
  return {
    enabled: data?.enabled ?? false,
    phone_number: data?.phone_number ?? null,
    phone_number_pretty: data?.phone_number_pretty ?? null,
  };
}

export async function enableVoiceAgent(): Promise<VoiceAgentState> {
  const { data, error } = await supabase.functions.invoke('voice-agent', { body: { action: 'enable' } });
  if (error || data?.error) {
    console.error('enableVoiceAgent failed:', error, data);
    throw new Error(data?.error || 'Could not turn on AI call answering. Please try again.');
  }
  return {
    enabled: true,
    phone_number: data.phone_number ?? null,
    phone_number_pretty: data.phone_number_pretty ?? null,
  };
}

export async function disableVoiceAgent(): Promise<void> {
  const { error } = await supabase.functions.invoke('voice-agent', { body: { action: 'disable' } });
  if (error) {
    console.error('disableVoiceAgent failed:', error);
    throw new Error('Could not turn off AI call answering. Please try again.');
  }
}

// --- Business hours (stored on the onboarding row) -------------------------

export async function loadHours(): Promise<BusinessHours> {
  const { data } = await supabase.from('onboarding').select('hours').maybeSingle();
  return (data?.hours as BusinessHours) ?? {};
}

export async function saveHours(hours: BusinessHours): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');
  const { error } = await supabase
    .from('onboarding')
    .update({ hours, updated_at: new Date().toISOString() })
    .eq('user_id', user.id);
  if (error) throw new Error('Could not save your hours.');
}

// --- Call log --------------------------------------------------------------

export async function loadCalls(): Promise<CallRecord[]> {
  const { data } = await supabase
    .from('calls')
    .select('id, caller_number, transcript, summary, recording_url, duration_seconds, lead, created_at')
    .order('created_at', { ascending: false })
    .limit(100);
  return (data as CallRecord[]) ?? [];
}
