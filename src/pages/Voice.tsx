import { useEffect, useState } from 'react';
import {
  Phone, PhoneCall, Loader2, Check, Clock, ChevronDown, ChevronUp, User, Voicemail, Copy,
} from 'lucide-react';
import {
  loadVoiceAgent, enableVoiceAgent, disableVoiceAgent,
  loadHours, saveHours, loadCalls,
  DAY_KEYS, DAY_LABELS,
  type VoiceAgentState, type BusinessHours, type CallRecord, type DayKey,
} from '../voice';

const card = 'rounded-2xl border border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.03]';

const DEFAULT_SLOT = { open: '09:00', close: '17:00' };

function fmtDuration(s: number | null) {
  if (!s) return '';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m ? `${m}m ${sec}s` : `${sec}s`;
}

export default function Voice() {
  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState<VoiceAgentState>({ enabled: false, phone_number: null, phone_number_pretty: null });
  const [hours, setHours] = useState<BusinessHours>({});
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [busy, setBusy] = useState(false);
  const [savingHours, setSavingHours] = useState(false);
  const [hoursSaved, setHoursSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [a, h, c] = await Promise.all([loadVoiceAgent(), loadHours(), loadCalls()]);
        setAgent(a); setHours(h); setCalls(c);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleAgent = async () => {
    setBusy(true); setError(null);
    try {
      if (agent.enabled) {
        await disableVoiceAgent();
        setAgent((p) => ({ ...p, enabled: false }));
      } else {
        const next = await enableVoiceAgent();
        setAgent(next);
      }
    } catch (e: any) {
      setError(e.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const toggleDay = (day: DayKey) => {
    setHours((p) => ({ ...p, [day]: (p[day]?.length ? [] : [{ ...DEFAULT_SLOT }]) }));
  };
  const setSlot = (day: DayKey, field: 'open' | 'close', value: string) => {
    setHours((p) => {
      const slot = p[day]?.[0] ?? { ...DEFAULT_SLOT };
      return { ...p, [day]: [{ ...slot, [field]: value }] };
    });
  };

  const onSaveHours = async () => {
    setSavingHours(true); setError(null);
    try {
      await saveHours(hours);
      setHoursSaved(true);
      setTimeout(() => setHoursSaved(false), 2000);
    } catch (e: any) {
      setError(e.message || 'Could not save your hours.');
    } finally {
      setSavingHours(false);
    }
  };

  const copyNumber = () => {
    if (!agent.phone_number) return;
    navigator.clipboard.writeText(agent.phone_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Carrier "forward on no answer" code, e.g. *61*15082045839#
  const forwardCode = agent.phone_number ? `*61*${agent.phone_number.replace(/\D/g, '')}#` : '';
  const copyCode = () => {
    if (!forwardCode) return;
    navigator.clipboard.writeText(forwardCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 1500);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-neutral-400" /></div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-1 py-2 space-y-6">
      <header>
        <div className="flex items-center gap-2.5">
          <PhoneCall className="w-6 h-6 text-blue-500" />
          <h1 className="text-2xl font-bold tracking-tight">AI Receptionist</h1>
        </div>
        <p className="text-sm text-neutral-500 dark:text-white/50 mt-1.5">
          When you can't pick up, an AI answers for you — it knows your hours and menu, and takes messages.
        </p>
      </header>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Enable / status */}
      <div className={`${card} p-5`}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-semibold">{agent.enabled ? 'AI call answering is on' : 'Turn on AI call answering'}</div>
            <div className="text-sm text-neutral-500 dark:text-white/50 mt-0.5">
              {agent.enabled ? 'Your AI is ready to take missed calls.' : 'We\'ll give you a number to forward missed calls to.'}
            </div>
          </div>
          <button
            onClick={toggleAgent}
            disabled={busy}
            className={`relative shrink-0 w-14 h-8 rounded-full transition-colors disabled:opacity-60 ${agent.enabled ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-white/15'}`}
            aria-pressed={agent.enabled}
          >
            <span className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow flex items-center justify-center transition-transform ${agent.enabled ? 'translate-x-6' : ''}`}>
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-500" /> : null}
            </span>
          </button>
        </div>

        {agent.enabled && agent.phone_number && (
          <div className="mt-5 rounded-xl bg-blue-500/[0.07] border border-blue-500/20 p-4">
            <div className="text-xs uppercase tracking-wide text-blue-600/80 dark:text-blue-400/80 font-semibold">Your AI number</div>
            <div className="flex items-center gap-3 mt-1.5">
              <Phone className="w-5 h-5 text-blue-500" />
              <span className="text-xl font-bold tracking-tight">{agent.phone_number_pretty || agent.phone_number}</span>
              <button onClick={copyNumber} className="ml-auto inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:opacity-80">
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-sm text-neutral-600 dark:text-white/60 mt-4 leading-relaxed">
              <span className="font-semibold text-neutral-800 dark:text-white/80">One-time setup:</span> on your business
              phone, open the dialer, type the code below, and press call. From then on, any call you don't answer
              rings to your AI automatically.
            </p>
            <div className="mt-3 flex items-center gap-3 rounded-xl bg-black/[0.05] dark:bg-white/[0.07] border border-black/10 dark:border-white/10 px-4 py-3">
              <Phone className="w-4 h-4 text-blue-500 shrink-0" />
              <code className="text-lg font-bold tracking-wider">{forwardCode}</code>
              <button onClick={copyCode} className="ml-auto inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:opacity-80">
                {codeCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {codeCopied ? 'Copied' : 'Copy code'}
              </button>
            </div>
            <p className="text-xs text-neutral-400 dark:text-white/40 mt-2">
              Works on most U.S. carriers. To turn it off later, dial <code className="font-semibold">##61#</code>.
            </p>
          </div>
        )}
      </div>

      {/* Business hours */}
      <div className={`${card} p-5`}>
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-4 h-4 text-neutral-500 dark:text-white/50" />
          <h2 className="font-semibold">Business hours</h2>
        </div>
        <p className="text-sm text-neutral-500 dark:text-white/50 mb-4">
          So the AI can answer “are you open tomorrow?” correctly.
        </p>
        <div className="space-y-2">
          {DAY_KEYS.map((day) => {
            const slot = hours[day]?.[0];
            const open = !!hours[day]?.length;
            return (
              <div key={day} className="flex items-center gap-3">
                <button
                  onClick={() => toggleDay(day)}
                  className={`shrink-0 w-10 h-6 rounded-full transition-colors ${open ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-white/15'}`}
                >
                  <span className={`block w-4 h-4 rounded-full bg-white shadow ml-1 transition-transform ${open ? 'translate-x-4' : ''}`} />
                </button>
                <span className="w-24 text-sm font-medium">{DAY_LABELS[day]}</span>
                {open ? (
                  <div className="flex items-center gap-2 text-sm">
                    <input type="time" value={slot?.open ?? DEFAULT_SLOT.open} onChange={(e) => setSlot(day, 'open', e.target.value)}
                      className="rounded-lg px-2 py-1 bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 outline-none" />
                    <span className="text-neutral-400">to</span>
                    <input type="time" value={slot?.close ?? DEFAULT_SLOT.close} onChange={(e) => setSlot(day, 'close', e.target.value)}
                      className="rounded-lg px-2 py-1 bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 outline-none" />
                  </div>
                ) : (
                  <span className="text-sm text-neutral-400 dark:text-white/30">Closed</span>
                )}
              </div>
            );
          })}
        </div>
        <button
          onClick={onSaveHours}
          disabled={savingHours}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-black text-sm font-semibold px-4 py-2 hover:opacity-90 disabled:opacity-60"
        >
          {savingHours ? <Loader2 className="w-4 h-4 animate-spin" /> : hoursSaved ? <Check className="w-4 h-4" /> : null}
          {hoursSaved ? 'Saved' : 'Save hours'}
        </button>
      </div>

      {/* Recent calls */}
      <div className={`${card} p-5`}>
        <div className="flex items-center gap-2 mb-4">
          <Voicemail className="w-4 h-4 text-neutral-500 dark:text-white/50" />
          <h2 className="font-semibold">Calls your AI handled</h2>
        </div>
        {calls.length === 0 ? (
          <p className="text-sm text-neutral-400 dark:text-white/30 py-6 text-center">
            No calls yet. Once a caller reaches your AI number, their call shows up here.
          </p>
        ) : (
          <div className="divide-y divide-black/5 dark:divide-white/5">
            {calls.map((c) => {
              const isOpen = expanded === c.id;
              return (
                <div key={c.id} className="py-3">
                  <button onClick={() => setExpanded(isOpen ? null : c.id)} className="w-full flex items-start gap-3 text-left">
                    <div className="mt-0.5 w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{c.lead?.caller_name || c.caller_number || 'Unknown caller'}</span>
                        {c.lead?.wants_callback && <span className="text-[10px] font-semibold uppercase tracking-wide bg-amber-500/15 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded">Wants callback</span>}
                        <span className="ml-auto text-xs text-neutral-400 dark:text-white/30">{new Date(c.created_at).toLocaleString()}</span>
                      </div>
                      <div className="text-sm text-neutral-500 dark:text-white/50 mt-0.5 line-clamp-2">
                        {c.summary || 'Call handled.'}
                      </div>
                      <div className="text-xs text-neutral-400 dark:text-white/30 mt-1 flex items-center gap-2">
                        {c.duration_seconds ? <span>{fmtDuration(c.duration_seconds)}</span> : null}
                        {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="mt-3 ml-11 space-y-3">
                      {(c.lead?.callback_number || c.lead?.reason) && (
                        <div className="text-sm rounded-lg bg-black/[0.03] dark:bg-white/5 p-3 space-y-1">
                          {c.lead?.callback_number && <div><span className="text-neutral-500 dark:text-white/50">Callback:</span> {c.lead.callback_number}</div>}
                          {c.lead?.reason && <div><span className="text-neutral-500 dark:text-white/50">Reason:</span> {c.lead.reason}</div>}
                        </div>
                      )}
                      {c.recording_url && (
                        <audio controls src={c.recording_url} className="w-full h-9" />
                      )}
                      {c.transcript?.length ? (
                        <div className="space-y-1.5">
                          {c.transcript.map((t, i) => (
                            <div key={i} className="text-sm">
                              <span className={`font-semibold ${t.role === 'agent' ? 'text-blue-500' : 'text-neutral-500 dark:text-white/50'}`}>
                                {t.role === 'agent' ? 'AI' : 'Caller'}:
                              </span>{' '}
                              <span className="text-neutral-700 dark:text-white/70">{t.content}</span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
