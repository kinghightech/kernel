// InstagramComposer — compose & publish a single-image Instagram post.
// Shown on the Marketing page once Instagram is connected. The actual post is
// the "Approve & Post" action: nothing publishes until the owner clicks Post.
//
// Image: uploaded via the existing upload-asset function (-> public URL that
// Instagram can fetch). Account id (ig_user_id) is resolved automatically
// server-side, so there's nothing to paste.

import { useRef, useState } from 'react';
import { Loader2, Check, AlertCircle, ImagePlus, X } from 'lucide-react';
import { publishInstagramPost } from '../social';
import { uploadProductImage } from '../website';

export default function InstagramComposer() {
  const [caption, setCaption] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const canPost = !!imageUrl && !posting && !uploading;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setResult(null);
    try {
      setImageUrl(await uploadProductImage(file));
    } catch (err) {
      setResult({ ok: false, msg: (err as Error).message });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handlePost = async () => {
    setPosting(true);
    setResult(null);
    try {
      await publishInstagramPost({ caption: caption.trim(), imageUrl });
      setResult({ ok: true, msg: 'Posted to Instagram 🎉' });
      setCaption('');
      setImageUrl('');
    } catch (e) {
      setResult({ ok: false, msg: (e as Error).message });
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="mt-5 border-t border-black/10 dark:border-white/10 pt-5">
      <p className="text-sm font-medium mb-3">Post to Instagram</p>

      <div className="space-y-3">
        {/* Image: upload area or preview */}
        {imageUrl ? (
          <div className="relative inline-block">
            <img src={imageUrl} alt="post" className="h-40 w-40 rounded-xl object-cover border border-black/10 dark:border-white/10" />
            <button
              onClick={() => setImageUrl('')}
              className="absolute -top-2 -right-2 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-black p-1 shadow"
              aria-label="Remove image"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex h-40 w-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-black/15 dark:border-white/20 text-neutral-500 dark:text-white/50 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
            <span className="text-xs">{uploading ? 'Uploading…' : 'Add image'}</span>
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />

        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Caption (optional, up to 2,200 chars)"
          rows={3}
          maxLength={2200}
          className="w-full rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-white/[0.04] px-3 py-2 text-sm outline-none focus:border-black/30 dark:focus:border-white/30 resize-y"
        />
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
