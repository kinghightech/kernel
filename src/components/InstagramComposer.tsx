// InstagramComposer — compose & publish a single-image Instagram post.
// Shown on the Marketing page once Instagram is connected. The actual post is
// the "Approve & Post" action: nothing publishes until the owner clicks Post.

import { useState } from 'react';
import { Loader2, Check, AlertCircle } from 'lucide-react';
import { publishInstagramPost } from '../social';

export default function InstagramComposer() {
  const [caption, setCaption] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [igUserId, setIgUserId] = useState('');
  const [posting, setPosting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const canPost = imageUrl.trim().length > 0 && !posting;

  const handlePost = async () => {
    setPosting(true);
    setResult(null);
    try {
      await publishInstagramPost({
        caption: caption.trim(),
        imageUrl: imageUrl.trim(),
        igUserId: igUserId.trim() || undefined,
      });
      setResult({ ok: true, msg: 'Posted to Instagram 🎉' });
      setCaption('');
      setImageUrl('');
    } catch (e) {
      setResult({ ok: false, msg: (e as Error).message });
    } finally {
      setPosting(false);
    }
  };

  const inputCls =
    'w-full rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-white/[0.04] px-3 py-2 text-sm outline-none focus:border-black/30 dark:focus:border-white/30';

  return (
    <div className="mt-5 border-t border-black/10 dark:border-white/10 pt-5">
      <p className="text-sm font-medium mb-3">Post to Instagram</p>

      <div className="space-y-3">
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Caption (optional, up to 2,200 chars)"
          rows={3}
          maxLength={2200}
          className={inputCls + ' resize-y'}
        />
        <input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="Public image URL (https://…)"
          className={inputCls}
        />
        <div>
          <input
            value={igUserId}
            onChange={(e) => setIgUserId(e.target.value)}
            placeholder="Instagram Business Account ID (first time only)"
            className={inputCls}
          />
          <p className="text-[11px] text-neutral-500 dark:text-white/40 mt-1">
            Required the first time, then saved. Find it in Meta Business Suite, or leave blank if already saved.
          </p>
        </div>
      </div>

      {result && (
        <div
          className={`mt-3 flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm ${
            result.ok
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              : 'border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300'
          }`}
        >
          {result.ok ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {result.msg}
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <button
          onClick={handlePost}
          disabled={!canPost}
          className="flex items-center gap-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-black px-4 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {posting ? 'Posting…' : 'Approve & Post'}
        </button>
      </div>
    </div>
  );
}
