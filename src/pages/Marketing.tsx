import { useEffect, useRef, useState } from 'react';
import {
  Megaphone, Sparkles, ArrowLeft, ThumbsUp, ThumbsDown, ImagePlus, X, Hash, Loader2, Trash2, Calendar, Wand2,
} from 'lucide-react';
import {
  generateCampaign, generateImage, saveCampaign, loadCampaigns, deleteCampaign,
  type Campaign, type CampaignInputs, type SavedCampaign,
} from '../campaigns';

const PLATFORMS = ['Instagram', 'TikTok', 'X (Twitter)', 'Facebook', 'LinkedIn', 'YouTube'];
const GOALS = ['Awareness', 'Sales', 'Engagement', 'Product launch', 'Grow followers'];
const TONES = ['Friendly', 'Professional', 'Playful', 'Bold', 'Luxury'];

const card = 'rounded-2xl border border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.03]';
const inputCls = 'w-full rounded-xl px-4 py-3 text-sm bg-black/[0.03] dark:bg-white/5 border border-black/10 dark:border-white/10 outline-none focus:border-black/30 dark:focus:border-white/30 transition-colors placeholder:text-neutral-400 dark:placeholder:text-white/30';
const labelCls = 'block text-sm font-semibold text-neutral-700 dark:text-white/70 mb-2';

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3.5 py-2 rounded-xl text-sm font-medium transition-colors border ${
        active
          ? 'bg-blue-600 border-blue-600 text-white'
          : 'bg-black/[0.03] dark:bg-white/5 border-black/10 dark:border-white/10 text-neutral-600 dark:text-white/70 hover:border-black/30 dark:hover:border-white/30'
      }`}
    >
      {children}
    </button>
  );
}

type View = 'home' | 'form' | 'result';

export default function Marketing() {
  const [view, setView] = useState<View>('home');
  const [saved, setSaved] = useState<SavedCampaign[]>([]);

  // form state
  const [product, setProduct] = useState('');
  const [platforms, setPlatforms] = useState<string[]>(['Instagram']);
  const [goal, setGoal] = useState('Awareness');
  const [tone, setTone] = useState('Friendly');
  const [postCount, setPostCount] = useState(5);
  const [audience, setAudience] = useState('');
  const [extra, setExtra] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  // generation state
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [saving, setSaving] = useState(false);
  // AI-generated images keyed by post index, plus per-post loading flags.
  const [postImages, setPostImages] = useState<Record<number, string>>({});
  const [imgLoading, setImgLoading] = useState<Record<number, boolean>>({});

  const handleGenerateImage = async (index: number, prompt: string) => {
    setImgLoading(prev => ({ ...prev, [index]: true }));
    try {
      const url = await generateImage(prompt);
      setPostImages(prev => ({ ...prev, [index]: url }));
    } catch (e: any) {
      setError(e.message || 'Could not generate that image. Please try again.');
    } finally {
      setImgLoading(prev => ({ ...prev, [index]: false }));
    }
  };

  useEffect(() => { loadCampaigns().then(setSaved); }, []);

  const togglePlatform = (p: string) =>
    setPlatforms(prev => (prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]));

  const onFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).slice(0, 6).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => setImages(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const currentInputs = (): CampaignInputs => ({ product, platforms, goal, tone, postCount, audience, extra });

  const handleGenerate = async () => {
    if (!product.trim()) { setError('Tell us what you want to promote first.'); return; }
    setError(null);
    setGenerating(true);
    setView('result');
    setPostImages({});
    setImgLoading({});
    try {
      const result = await generateCampaign(currentInputs());
      setCampaign(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDislike = () => {
    // Discard — nothing was saved.
    setCampaign(null);
    setPostImages({});
    setError(null);
    setView('form');
  };

  const handleLike = async () => {
    if (!campaign) return;
    setSaving(true);
    try {
      // Bake any generated images into the campaign so they persist.
      const content: Campaign = {
        ...campaign,
        posts: campaign.posts.map((p, i) => (postImages[i] ? { ...p, generatedImage: postImages[i] } : p)),
      };
      const allImages = [...images, ...Object.values(postImages)];
      const row = await saveCampaign({ inputs: currentInputs(), content, images: allImages });
      setSaved(prev => [row, ...prev]);
      // reset everything
      setCampaign(null);
      setPostImages({});
      setImages([]);
      setProduct(''); setAudience(''); setExtra('');
      setView('home');
    } catch {
      setError('Could not save the campaign. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSaved(prev => prev.filter(c => c.id !== id));
    await deleteCampaign(id);
  };

  return (
    <div className="relative h-full overflow-y-auto bg-white text-neutral-900 dark:bg-[#0c0c0c] dark:text-white">
      <div className="absolute inset-0 pointer-events-none opacity-30 hidden dark:block" style={{ background: 'radial-gradient(800px circle at 50% 0%, #0B2551, transparent 70%)' }} />

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-10">
        {/* ===== HOME ===== */}
        {view === 'home' && (
          <>
            <h1 className="text-2xl font-bold tracking-tight mb-1">Marketing</h1>
            <p className="text-neutral-500 dark:text-white/50 text-sm mb-8">Tools to grow your business.</p>

            <button
              onClick={() => setView('form')}
              className={`${card} w-full text-left p-6 flex items-center gap-5 hover:border-blue-500/50 transition-colors group`}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shrink-0 shadow-lg shadow-blue-900/30">
                <Megaphone className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">Social Media Campaign Generator</h2>
                  <Sparkles className="w-4 h-4 text-blue-500" />
                </div>
                <p className="text-neutral-500 dark:text-white/50 text-sm mt-0.5">Describe your idea and let AI build a full campaign — posts, captions, hashtags, and a schedule.</p>
              </div>
            </button>

            {saved.length > 0 && (
              <div className="mt-12">
                <h3 className="text-sm font-semibold text-neutral-500 dark:text-white/60 mb-4">Saved campaigns</h3>
                <div className="space-y-3">
                  {saved.map(c => (
                    <div key={c.id} className={`${card} p-5`}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{c.name || 'Campaign'}</div>
                          <p className="text-neutral-500 dark:text-white/50 text-sm mt-1 line-clamp-2">{c.content?.overview}</p>
                          <div className="text-xs text-neutral-400 dark:text-white/40 mt-2">
                            {c.content?.posts?.length ?? 0} posts · {new Date(c.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <button onClick={() => handleDelete(c.id)} className="text-neutral-400 hover:text-red-500 dark:text-white/40 dark:hover:text-red-400 transition-colors shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      {c.images?.length > 0 && (
                        <div className="flex gap-2 mt-3">
                          {c.images.slice(0, 5).map((src, i) => (
                            <img key={i} src={src} alt="" className="w-12 h-12 rounded-lg object-cover border border-black/10 dark:border-white/10" />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ===== FORM ===== */}
        {view === 'form' && (
          <>
            <button onClick={() => setView('home')} className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 dark:text-white/50 dark:hover:text-white mb-6 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <h1 className="text-2xl font-bold tracking-tight mb-1">New campaign</h1>
            <p className="text-neutral-500 dark:text-white/50 text-sm mb-8">Fill in the details — the more you give, the better the campaign.</p>

            <div className="space-y-6">
              <div>
                <label className={labelCls}>What are you promoting?</label>
                <textarea value={product} onChange={e => setProduct(e.target.value)} rows={3} placeholder="e.g. A new oat-milk latte at my downtown café, launching next week." className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map(p => <Chip key={p} active={platforms.includes(p)} onClick={() => togglePlatform(p)}>{p}</Chip>)}
                </div>
              </div>

              <div>
                <label className={labelCls}>Goal</label>
                <div className="flex flex-wrap gap-2">
                  {GOALS.map(g => <Chip key={g} active={goal === g} onClick={() => setGoal(g)}>{g}</Chip>)}
                </div>
              </div>

              <div>
                <label className={labelCls}>Tone</label>
                <div className="flex flex-wrap gap-2">
                  {TONES.map(t => <Chip key={t} active={tone === t} onClick={() => setTone(t)}>{t}</Chip>)}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <label className={labelCls}>Number of posts</label>
                  <input type="number" min={1} max={20} value={postCount} onChange={e => setPostCount(Math.max(1, Math.min(20, Number(e.target.value) || 1)))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Target audience <span className="text-neutral-400 dark:text-white/30 font-normal">(optional)</span></label>
                  <input value={audience} onChange={e => setAudience(e.target.value)} placeholder="e.g. local students" className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Anything else? <span className="text-neutral-400 dark:text-white/30 font-normal">(optional)</span></label>
                <textarea value={extra} onChange={e => setExtra(e.target.value)} rows={2} placeholder="Promo codes, dates, brand voice notes…" className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Images <span className="text-neutral-400 dark:text-white/30 font-normal">(optional)</span></label>
                <div className="flex flex-wrap gap-3">
                  {images.map((src, i) => (
                    <div key={i} className="relative w-20 h-20">
                      <img src={src} alt="" className="w-20 h-20 rounded-xl object-cover border border-black/10 dark:border-white/10" />
                      <button onClick={() => setImages(prev => prev.filter((_, j) => j !== i))} className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-black flex items-center justify-center">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button onClick={() => fileRef.current?.click()} className="w-20 h-20 rounded-xl border border-dashed border-black/20 dark:border-white/20 flex flex-col items-center justify-center text-neutral-400 dark:text-white/40 hover:border-blue-500 hover:text-blue-500 transition-colors">
                    <ImagePlus className="w-5 h-5" />
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => onFiles(e.target.files)} />
                </div>
              </div>

              {error && <div className="bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-sm p-3 rounded-xl">{error}</div>}

              <button onClick={handleGenerate} className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white font-semibold py-4 text-base hover:bg-blue-500 transition-colors">
                <Sparkles className="w-5 h-5" /> Generate campaign
              </button>
            </div>
          </>
        )}

        {/* ===== RESULT ===== */}
        {view === 'result' && (
          <>
            {generating ? (
              <div className="flex flex-col items-center justify-center text-center py-32">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
                <p className="text-neutral-500 dark:text-white/60">Building your campaign…</p>
              </div>
            ) : error ? (
              <div className="py-20 text-center">
                <p className="text-red-500 dark:text-red-400 mb-6">{error}</p>
                <button onClick={() => setView('form')} className="rounded-xl bg-blue-600 text-white font-semibold px-6 py-3 text-sm hover:bg-blue-500 transition-colors">Back to form</button>
              </div>
            ) : campaign ? (
              <>
                <h1 className="text-2xl font-bold tracking-tight mb-1">{campaign.campaignName}</h1>
                <p className="text-neutral-500 dark:text-white/60 mb-2">{campaign.overview}</p>
                <p className="text-sm text-neutral-400 dark:text-white/40 mb-6">Audience: {campaign.targetAudience}</p>

                {images.length > 0 && (
                  <div className="flex flex-wrap gap-3 mb-6">
                    {images.map((src, i) => (
                      <img key={i} src={src} alt="" className="w-20 h-20 rounded-xl object-cover border border-black/10 dark:border-white/10" />
                    ))}
                  </div>
                )}

                <div className="space-y-4">
                  {campaign.posts?.map((post, i) => (
                    <div key={i} className={`${card} p-5`}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-300 text-xs font-semibold">{post.platform}</span>
                        <span className="text-xs text-neutral-400 dark:text-white/40 flex items-center gap-1"><Calendar className="w-3 h-3" /> {post.day}</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap mb-3">{post.caption}</p>
                      {post.hashtags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {post.hashtags.map((h, j) => (
                            <span key={j} className="text-xs text-blue-600 dark:text-blue-300 bg-blue-500/10 rounded-md px-2 py-0.5 flex items-center gap-0.5">
                              <Hash className="w-2.5 h-2.5" />{h.replace(/^#/, '')}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-neutral-500 dark:text-white/50 mb-3"><span className="font-semibold">Visual:</span> {post.imageIdea}</p>

                      {postImages[i] ? (
                        <img src={postImages[i]} alt="" className="w-full max-w-xs rounded-xl border border-black/10 dark:border-white/10" />
                      ) : (
                        <button
                          onClick={() => handleGenerateImage(i, post.imageIdea)}
                          disabled={imgLoading[i]}
                          className="inline-flex items-center gap-2 rounded-lg border border-black/10 dark:border-white/15 bg-black/[0.03] dark:bg-white/5 px-3 py-2 text-xs font-medium hover:border-blue-500 hover:text-blue-500 transition-colors disabled:opacity-50"
                        >
                          {imgLoading[i] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                          {imgLoading[i] ? 'Generating image…' : 'Generate image'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {campaign.tips?.length > 0 && (
                  <div className={`${card} p-5 mt-4`}>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-blue-500" /> Tips</h3>
                    <ul className="space-y-2">
                      {campaign.tips.map((tip, i) => (
                        <li key={i} className="text-sm text-neutral-600 dark:text-white/70 flex gap-2"><span className="text-blue-500">•</span>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Like / Dislike */}
                <div className="flex gap-3 mt-8 sticky bottom-4">
                  <button onClick={handleDislike} disabled={saving} className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-black/10 dark:border-white/15 bg-white/80 dark:bg-white/5 backdrop-blur py-4 font-semibold text-sm hover:bg-black/[0.04] dark:hover:bg-white/10 transition-colors disabled:opacity-50">
                    <ThumbsDown className="w-4 h-4" /> I don't like this
                  </button>
                  <button onClick={handleLike} disabled={saving} className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white py-4 font-semibold text-sm hover:bg-blue-500 transition-colors disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />} I like this campaign
                  </button>
                </div>
              </>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
