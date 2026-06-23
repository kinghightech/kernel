// SocialConnections — connect/disconnect Instagram, TikTok & YouTube via Composio.
// Drop into the Marketing page. Mirrors the Square integration card in Settings.tsx.

import { useEffect, useState } from 'react';
// Note: Lucide v1 removed brand icons, so we use generic ones per platform.
import { Camera, Video, Music2, Plug, Check, Loader2 } from 'lucide-react';
import {
  connectPlatform, disconnectPlatform, getSocialStatus, getCachedStatus,
  type Platform, type SocialConnection,
} from '../social';
import InstagramComposer from './InstagramComposer';

const PLATFORMS: { id: Platform; label: string; icon: typeof Plug; blurb: string }[] = [
  { id: 'instagram', label: 'Instagram', icon: Camera, blurb: 'Publish posts and read comments.' },
  { id: 'tiktok', label: 'TikTok', icon: Music2, blurb: 'Post videos and track engagement.' },
  { id: 'youtube', label: 'YouTube', icon: Video, blurb: 'Upload videos and manage your channel.' },
];

export default function SocialConnections() {
  // Seed from cache so navigating back doesn't flash "Checking…" again.
  const cached = getCachedStatus();
  const [conns, setConns] = useState<SocialConnection[]>(cached ?? []);
  const [loading, setLoading] = useState(cached === null);
  const [busy, setBusy] = useState<Platform | null>(null);

  const refresh = async () => {
    setConns(await getSocialStatus(true));
    setLoading(false);
  };

  useEffect(() => {
    let active = true;
    // Warm cache → instant; cold cache → fetch. Either way revalidate quietly.
    getSocialStatus(cached === null).then((c) => {
      if (!active) return;
      setConns(c);
      setLoading(false);
    });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusOf = (p: Platform) => conns.find((c) => c.platform === p);

  const handleConnect = async (p: Platform) => {
    setBusy(p);
    await connectPlatform(p); // opens popup + polls until active
    await refresh();
    setBusy(null);
  };

  const handleDisconnect = async (p: Platform) => {
    setBusy(p);
    if (await disconnectPlatform(p)) {
      setConns((prev) => prev.filter((c) => c.platform !== p));
    }
    setBusy(null);
  };

  return (
    <div className="rounded-2xl border border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.03] p-6 mb-6">
      <h2 className="text-sm font-semibold text-neutral-500 dark:text-white/70 mb-4">Social accounts</h2>

      <div className="space-y-3">
        {PLATFORMS.map(({ id, label, icon: Icon, blurb }) => {
          const conn = statusOf(id);
          const connected = conn?.status === 'active';
          const isBusy = busy === id;

          return (
            <div key={id} className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-black/[0.06] dark:bg-white/10 p-2.5">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-sm flex items-center gap-2">
                    {label}
                    {connected && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 text-[11px] flex items-center gap-1">
                        <Check className="w-3 h-3" /> connected
                      </span>
                    )}
                  </p>
                  {loading ? (
                    <p className="text-neutral-500 dark:text-white/50 text-sm">Checking…</p>
                  ) : connected ? (
                    <p className="text-neutral-500 dark:text-white/50 text-sm">{conn?.label || 'Connected account'}</p>
                  ) : (
                    <p className="text-neutral-500 dark:text-white/50 text-sm">{blurb}</p>
                  )}
                </div>
              </div>

              {!loading && (
                connected ? (
                  <button
                    onClick={() => handleDisconnect(id)}
                    disabled={isBusy}
                    className="shrink-0 rounded-xl border border-black/10 dark:border-white/15 px-4 py-2 text-sm font-medium hover:bg-black/[0.04] dark:hover:bg-white/10 transition-colors disabled:opacity-50"
                  >
                    {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Disconnect'}
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnect(id)}
                    disabled={isBusy}
                    className="shrink-0 flex items-center gap-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plug className="w-4 h-4" />}
                    Connect
                  </button>
                )
              )}
            </div>
          );
        })}
      </div>

      {/* Composer appears once Instagram is connected */}
      {statusOf('instagram')?.status === 'active' && <InstagramComposer />}
    </div>
  );
}
