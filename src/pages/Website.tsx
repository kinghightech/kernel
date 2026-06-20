import { useEffect, useRef, useState } from 'react';
import {
  Globe, ImagePlus, Loader2, Trash2, Plus, Download, Wand2, Pencil, Save,
  Code2, Monitor, Smartphone, Send, ArrowLeft, Check, ExternalLink, Info,
} from 'lucide-react';
import {
  loadBusinessProfile, uploadLogo, uploadProductImage, loadProducts, addProduct, deleteProduct,
  generateWebsite, editWebsite, saveWebsite, loadWebsite, downloadSite,
  type Product, type WebsiteInputs, type SavedWebsite, type SiteFiles,
} from '../website';

const TONES = ['Clean & modern', 'Warm & cozy', 'Bold & vibrant', 'Elegant & minimal', 'Playful', 'Luxury'];
const QUICK_FIXES = [
  'Make it more colorful and bold',
  'Make the hero section bigger and more striking',
  'Add a customer testimonials section',
  'Use a more elegant, minimal style',
];

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

type Phase = 'setup' | 'studio';
type ChatMsg = { role: 'user' | 'assistant'; content: string };

export default function Website() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [savedSite, setSavedSite] = useState<SavedWebsite | null>(null);

  // business profile + form state
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [about, setAbout] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [hours, setHours] = useState('');
  const [discounts, setDiscounts] = useState('');
  const [tone, setTone] = useState('Clean & modern');
  const [accentColor, setAccentColor] = useState('#2563eb');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [extra, setExtra] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);

  // catalog state
  const [products, setProducts] = useState<Product[]>([]);
  const [pName, setPName] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [pImage, setPImage] = useState<string | null>(null);
  const [pImageUploading, setPImageUploading] = useState(false);
  const [addingProduct, setAddingProduct] = useState(false);
  const productImgRef = useRef<HTMLInputElement>(null);

  // studio state
  const [files, setFiles] = useState<SiteFiles | null>(null);
  const [liveUrl, setLiveUrl] = useState<string | null>(null);
  const [bust, setBust] = useState(0); // cache-buster for the preview iframe
  const [activeFile, setActiveFile] = useState('index.html');
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [rightView, setRightView] = useState<'preview' | 'code'>('preview');
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const profile = await loadBusinessProfile();
      setBusinessName(profile.businessName);
      setBusinessType(profile.businessType);
      setAddress(profile.address);
      setLogoUrl(profile.logoUrl);
      setProducts(await loadProducts());
      const site = await loadWebsite();
      setSavedSite(site);
      if (site) {
        // Re-open the existing site straight into the studio.
        const i = site.inputs || ({} as WebsiteInputs);
        setAbout(i.about ?? ''); setPhone(i.phone ?? ''); setEmail(i.email ?? '');
        setHours(i.hours ?? ''); setDiscounts(i.discounts ?? '');
        setTone(i.tone ?? 'Clean & modern'); setAccentColor(i.accentColor ?? '#2563eb');
        setBackgroundColor(i.backgroundColor ?? '#ffffff');
        setExtra(i.extra ?? '');
        if (site.files) setFiles(site.files);
        else if (site.html) setFiles({ 'index.html': site.html });
        setLiveUrl(site.site_url ?? null);
        setBust(Date.now());
        setMessages([{ role: 'assistant', content: 'Here is your saved website. Tell me what you’d like to change, or edit your details and regenerate.' }]);
        setPhase('studio');
      }
    })();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  const currentInputs = (): WebsiteInputs => ({
    businessName, businessType, about, address, phone, email, hours, discounts, tone, accentColor, backgroundColor, logoUrl, extra,
    products: products.map(p => ({ name: p.name, price: p.price, description: p.description, image_url: p.image_url })),
  });

  // ---- logo + catalog handlers ----
  const handleLogoFile = async (file: File | null) => {
    if (!file) return;
    setLogoUploading(true); setError(null);
    try { setLogoUrl(await uploadLogo(file)); }
    catch (e) { setError(e instanceof Error ? `Could not upload that logo: ${e.message}` : 'Could not upload that logo.'); }
    finally { setLogoUploading(false); }
  };
  const handleProductFile = async (file: File | null) => {
    if (!file) return;
    setPImageUploading(true);
    try { setPImage(await uploadProductImage(file)); }
    catch (e) { setError(e instanceof Error ? `Could not upload that product image: ${e.message}` : 'Could not upload that product image.'); }
    finally { setPImageUploading(false); }
  };
  const handleAddProduct = async () => {
    if (!pName.trim()) { setError('Give the product a name first.'); return; }
    setAddingProduct(true); setError(null);
    try {
      const row = await addProduct({ name: pName.trim(), price: pPrice.trim(), description: pDesc.trim(), image_url: pImage });
      setProducts(prev => [...prev, row]);
      setPName(''); setPPrice(''); setPDesc(''); setPImage(null);
    } catch { setError('Could not add that product. Please try again.'); }
    finally { setAddingProduct(false); }
  };
  const handleDeleteProduct = async (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    await deleteProduct(id);
  };

  // ---- generation + chat ----
  const handleGenerate = async () => {
    if (!businessName.trim()) { setError('Tell us your business name first.'); return; }
    setError(null);
    setPhase('studio');
    setRightView('preview');
    setBusy(true);
    setMessages([{ role: 'assistant', content: `Building your first draft for ${businessName}… this takes a bit — it’s writing a real multi-page site and hosting it live.` }]);
    try {
      const { files: newFiles, url } = await generateWebsite(currentInputs());
      setFiles(newFiles);
      setLiveUrl(url);
      setActiveFile('index.html');
      setBust(Date.now());
      setMessages([{ role: 'assistant', content: `Here’s your live website for ${businessName}. Click around the pages in the preview — they’re really hosted. Tell me anything to change (colors, layout, copy, sections) and I’ll rebuild it.` }]);
    } catch (e) {
      setMessages([{ role: 'assistant', content: e instanceof Error ? e.message : 'Something went wrong building the site.' }]);
    } finally {
      setBusy(false);
    }
  };

  const sendInstruction = async (instruction: string) => {
    if (!instruction.trim() || !files || busy) return;
    setChatInput('');
    setJustSaved(false);
    setMessages(prev => [...prev, { role: 'user', content: instruction }]);
    setBusy(true);
    try {
      const { files: updated, url } = await editWebsite({ currentFiles: files, instruction, inputs: currentInputs() });
      setFiles(updated);
      setLiveUrl(url);
      setBust(Date.now());
      setMessages(prev => [...prev, { role: 'assistant', content: '✓ Done — updated and re-published. Anything else?' }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: e instanceof Error ? e.message : 'Could not apply that change. Please try again.' }]);
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async () => {
    if (!files || !liveUrl) return;
    setSaving(true);
    try {
      const row = await saveWebsite({ name: businessName || 'My website', inputs: currentInputs(), files, url: liveUrl });
      setSavedSite(row);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Could not save the website. Please try again.' }]);
    } finally {
      setSaving(false);
    }
  };

  const fakeDomain = `${(businessName || 'your-business').toLowerCase().replace(/[^a-z0-9]+/g, '')}.com`;
  const previewSrc = liveUrl ? `${liveUrl}?t=${bust}` : '';

  // ============================ STUDIO ============================
  if (phase === 'studio') {
    return (
      <div className="h-full flex flex-col bg-white text-neutral-900 dark:bg-[#0c0c0c] dark:text-white">
        {/* top bar */}
        <div className="h-14 shrink-0 flex items-center gap-3 px-4 border-b border-black/10 dark:border-white/10">
          <button
            onClick={() => setPhase('setup')}
            className="flex items-center gap-1.5 text-sm text-neutral-500 dark:text-white/60 hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Details
          </button>
          <div className="font-semibold truncate">{businessName || 'Website'}</div>

          <div className="ml-auto flex items-center gap-2">
            {/* device toggle */}
            <div className="hidden sm:flex items-center rounded-lg border border-black/10 dark:border-white/15 p-0.5">
              <button onClick={() => setDevice('desktop')} className={`p-1.5 rounded-md ${device === 'desktop' ? 'bg-black/[0.06] dark:bg-white/10' : 'text-neutral-400'}`} title="Desktop"><Monitor className="w-4 h-4" /></button>
              <button onClick={() => setDevice('mobile')} className={`p-1.5 rounded-md ${device === 'mobile' ? 'bg-black/[0.06] dark:bg-white/10' : 'text-neutral-400'}`} title="Mobile"><Smartphone className="w-4 h-4" /></button>
            </div>
            {/* preview/code toggle */}
            <div className="flex items-center rounded-lg border border-black/10 dark:border-white/15 p-0.5">
              <button onClick={() => setRightView('preview')} className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 ${rightView === 'preview' ? 'bg-black/[0.06] dark:bg-white/10' : 'text-neutral-400'}`}><Monitor className="w-3.5 h-3.5" /> Preview</button>
              <button onClick={() => setRightView('code')} className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 ${rightView === 'code' ? 'bg-black/[0.06] dark:bg-white/10' : 'text-neutral-400'}`}><Code2 className="w-3.5 h-3.5" /> Code</button>
            </div>
            <button
              onClick={() => liveUrl && window.open(previewSrc, '_blank')}
              disabled={!liveUrl}
              title="Open the live site in a new tab"
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-black/10 dark:border-white/15 hover:bg-black/[0.04] dark:hover:bg-white/5 transition-colors disabled:opacity-40"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Open live
            </button>
            <button
              onClick={() => files && downloadSite(files)}
              disabled={!files}
              title="Download all the website files"
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-black/10 dark:border-white/15 hover:bg-black/[0.04] dark:hover:bg-white/5 transition-colors disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" /> Download
            </button>
            <button
              onClick={handleSave}
              disabled={!files || saving}
              className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : justSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              {justSaved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>

        {/* two panes */}
        <div className="flex-1 flex min-h-0">
          {/* chat */}
          <div className="w-[340px] shrink-0 border-r border-black/10 dark:border-white/10 flex flex-col bg-[#f7f8fa] dark:bg-black/30">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-white dark:bg-white/10 border border-black/10 dark:border-white/10 rounded-bl-md'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {busy && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md px-3.5 py-2.5 bg-white dark:bg-white/10 border border-black/10 dark:border-white/10 flex items-center gap-2 text-sm text-neutral-500 dark:text-white/60">
                    <Loader2 className="w-4 h-4 animate-spin" /> Working on it…
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* quick fixes */}
            {files && !busy && (
              <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                {QUICK_FIXES.map(q => (
                  <button key={q} onClick={() => sendInstruction(q)} className="text-xs px-2.5 py-1.5 rounded-lg border border-black/10 dark:border-white/15 text-neutral-600 dark:text-white/60 hover:border-blue-500/50 hover:text-blue-600 transition-colors">
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* hosting note */}
            <div className="mx-3 mb-2 flex items-start gap-2 rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-2 text-[11px] leading-snug text-neutral-600 dark:text-white/60">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-500" />
              <span>This live preview is hosted for previewing only. To put it on your real website, <b>download the files</b> — we’ll help you get it live on your domain.</span>
            </div>

            {/* input */}
            <div className="p-3 border-t border-black/10 dark:border-white/10">
              <div className="flex items-end gap-2">
                <textarea
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendInstruction(chatInput); } }}
                  placeholder={files ? 'Ask for a change…' : 'Building…'}
                  disabled={!files || busy}
                  rows={2}
                  className={`${inputCls} resize-none py-2.5 disabled:opacity-60`}
                />
                <button
                  onClick={() => sendInstruction(chatInput)}
                  disabled={!files || busy || !chatInput.trim()}
                  className="h-10 w-10 shrink-0 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-colors disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* preview / code */}
          <div className="flex-1 min-w-0 relative bg-[#eef0f3] dark:bg-black/40 overflow-hidden">
            {rightView === 'code' ? (
              <div className="absolute inset-0 flex flex-col">
                {/* file tabs */}
                <div className="h-9 shrink-0 flex items-center gap-1 px-2 border-b border-black/10 dark:border-white/10 overflow-x-auto">
                  {files ? Object.keys(files).map(name => (
                    <button
                      key={name}
                      onClick={() => setActiveFile(name)}
                      className={`px-2.5 py-1 rounded-md text-xs font-mono whitespace-nowrap ${activeFile === name ? 'bg-black/[0.08] dark:bg-white/10 text-neutral-900 dark:text-white' : 'text-neutral-500 dark:text-white/50 hover:bg-black/[0.04]'}`}
                    >
                      {name}
                    </button>
                  )) : <span className="text-xs text-neutral-400 px-2">building…</span>}
                </div>
                <pre className="flex-1 overflow-auto p-4 text-xs leading-relaxed text-neutral-800 dark:text-white/80 font-mono whitespace-pre-wrap break-all">
                  {files?.[activeFile] ?? '// building…'}
                </pre>
              </div>
            ) : (
              <div className="absolute inset-0 p-3 flex">
                <div className={`flex flex-col h-full rounded-lg overflow-hidden border border-black/15 dark:border-white/10 shadow-2xl bg-white ${device === 'mobile' ? 'w-[390px] mx-auto' : 'w-full'}`}>
                  {/* browser chrome */}
                  <div className="h-9 shrink-0 flex items-center gap-2 px-3 bg-[#e9eaed] dark:bg-[#2a2a2a] border-b border-black/10">
                    <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                    <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
                    <span className="w-3 h-3 rounded-full bg-[#28c840]" />
                    <div className="ml-3 flex-1 h-5 rounded-md bg-white/70 dark:bg-black/30 text-[11px] text-neutral-500 dark:text-white/40 flex items-center px-2 truncate">
                      {fakeDomain}
                    </div>
                  </div>
                  {previewSrc ? (
                    <iframe
                      key={bust}
                      title="Website preview"
                      src={previewSrc}
                      className="flex-1 w-full bg-white"
                    />
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center gap-3 text-neutral-400">
                      <Loader2 className="w-7 h-7 animate-spin" />
                      <p className="text-sm">Building &amp; hosting your website…</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================ SETUP ============================
  return (
    <div className="relative h-full overflow-y-auto bg-white text-neutral-900 dark:bg-[#0c0c0c] dark:text-white">
      <div className="absolute inset-0 pointer-events-none opacity-30 hidden dark:block" style={{ background: 'radial-gradient(800px circle at 50% 0%, #0B2551, transparent 70%)' }} />

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shrink-0 shadow-lg shadow-blue-900/30">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Website Builder</h1>
            <p className="text-neutral-500 dark:text-white/50 text-sm">Tell us about your business and AI builds your site — then refine it by chatting.</p>
          </div>
        </div>

        {savedSite && (
          <button
            onClick={() => {
              setFiles(savedSite.files ?? (savedSite.html ? { 'index.html': savedSite.html } : null));
              setLiveUrl(savedSite.site_url ?? null);
              setBust(Date.now());
              setMessages([{ role: 'assistant', content: 'Reopened your saved website. What would you like to change?' }]);
              setPhase('studio');
            }}
            className={`${card} w-full text-left p-4 mt-6 flex items-center gap-3 hover:border-blue-500/50 transition-colors`}
          >
            <Globe className="w-5 h-5 text-blue-600" />
            <div className="flex-1">
              <div className="text-sm font-semibold">Open your current website</div>
              <div className="text-xs text-neutral-500 dark:text-white/40">Jump back into the editor</div>
            </div>
            <ArrowLeft className="w-4 h-4 rotate-180 text-neutral-400" />
          </button>
        )}

        {/* Business details */}
        <div className={`${card} p-5 mt-6 space-y-5`}>
          <div className="text-sm font-semibold flex items-center gap-2"><Pencil className="w-4 h-4" /> Business details</div>

          <div>
            <label className={labelCls}>Logo</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/5 flex items-center justify-center overflow-hidden shrink-0">
                {logoUploading ? <Loader2 className="w-5 h-5 animate-spin text-neutral-400" />
                  : logoUrl ? <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                  : <ImagePlus className="w-6 h-6 text-neutral-400" />}
              </div>
              <div>
                <button type="button" onClick={() => logoRef.current?.click()} className="text-sm font-medium px-3.5 py-2 rounded-xl border border-black/10 dark:border-white/15 hover:bg-black/[0.04] dark:hover:bg-white/5 transition-colors">
                  {logoUrl ? 'Replace logo' : 'Upload logo'}
                </button>
                <p className="text-xs text-neutral-500 dark:text-white/40 mt-1.5">PNG, JPG or SVG.</p>
              </div>
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={e => handleLogoFile(e.target.files?.[0] ?? null)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Business name</label>
              <input className={inputCls} value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Sunrise Cafe" />
            </div>
            <div>
              <label className={labelCls}>Type of business</label>
              <input className={inputCls} value={businessType} onChange={e => setBusinessType(e.target.value)} placeholder="Coffee shop" />
            </div>
          </div>

          <div>
            <label className={labelCls}>About your business</label>
            <textarea className={`${inputCls} min-h-[90px] resize-y`} value={about} onChange={e => setAbout(e.target.value)} placeholder="A neighborhood cafe serving locally roasted coffee and fresh pastries since 2019." />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={labelCls}>Address</label><input className={inputCls} value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main St, Springfield" /></div>
            <div><label className={labelCls}>Opening hours</label><input className={inputCls} value={hours} onChange={e => setHours(e.target.value)} placeholder="Mon–Sat 7am–6pm" /></div>
            <div><label className={labelCls}>Phone</label><input className={inputCls} value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 123-4567" /></div>
            <div><label className={labelCls}>Email</label><input className={inputCls} value={email} onChange={e => setEmail(e.target.value)} placeholder="hello@sunrisecafe.com" /></div>
          </div>

          <div>
            <label className={labelCls}>Current discounts / promotions</label>
            <input className={inputCls} value={discounts} onChange={e => setDiscounts(e.target.value)} placeholder="10% off your first order, happy hour 2–4pm" />
          </div>

          <div>
            <label className={labelCls}>Tone / vibe</label>
            <div className="flex flex-wrap gap-2">{TONES.map(t => <Chip key={t} active={tone === t} onClick={() => setTone(t)}>{t}</Chip>)}</div>
          </div>

          <div className="flex items-center gap-4">
            <div>
              <label className={labelCls}>Accent color</label>
              <input type="color" value={accentColor} onChange={e => setAccentColor(e.target.value)} className="w-14 h-10 rounded-lg border border-black/10 dark:border-white/10 bg-transparent cursor-pointer" />
            </div>
            <div>
              <label className={labelCls}>Background</label>
              <input type="color" value={backgroundColor} onChange={e => setBackgroundColor(e.target.value)} className="w-14 h-10 rounded-lg border border-black/10 dark:border-white/10 bg-transparent cursor-pointer" />
            </div>
            <div className="flex-1">
              <label className={labelCls}>Anything else?</label>
              <input className={inputCls} value={extra} onChange={e => setExtra(e.target.value)} placeholder="Family-owned, dog-friendly patio…" />
            </div>
          </div>
        </div>

        {/* Catalog */}
        <div className={`${card} p-5 mt-6`}>
          <div className="text-sm font-semibold mb-1">Catalog</div>
          <p className="text-xs text-neutral-500 dark:text-white/40 mb-4">
            Add the products or menu items you offer. We’ll show them with prices — visitors are told to come in to order (no online payments yet).
          </p>

          {products.length > 0 && (
            <div className="space-y-2 mb-4">
              {products.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03]">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-black/[0.04] dark:bg-white/5 flex items-center justify-center shrink-0">
                    {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : <ImagePlus className="w-4 h-4 text-neutral-400" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{p.name}</div>
                    {p.description && <div className="text-xs text-neutral-500 dark:text-white/40 truncate">{p.description}</div>}
                  </div>
                  {p.price && <div className="text-sm font-semibold shrink-0">{p.price}</div>}
                  <button onClick={() => handleDeleteProduct(p.id)} className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-xl border border-dashed border-black/15 dark:border-white/15 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <button type="button" onClick={() => productImgRef.current?.click()} className="w-16 h-16 rounded-lg border border-black/10 dark:border-white/10 bg-black/[0.03] dark:bg-white/5 flex items-center justify-center overflow-hidden shrink-0 relative">
                {pImageUploading ? <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
                  : pImage ? <img src={pImage} alt="" className="w-full h-full object-cover" />
                  : <ImagePlus className="w-5 h-5 text-neutral-400" />}
              </button>
              <input ref={productImgRef} type="file" accept="image/*" className="hidden" onChange={e => handleProductFile(e.target.files?.[0] ?? null)} />
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input className={`${inputCls} sm:col-span-2`} value={pName} onChange={e => setPName(e.target.value)} placeholder="Cappuccino" />
                <input className={inputCls} value={pPrice} onChange={e => setPPrice(e.target.value)} placeholder="$4.50" />
              </div>
            </div>
            <input className={inputCls} value={pDesc} onChange={e => setPDesc(e.target.value)} placeholder="Short description (optional)" />
            <button onClick={handleAddProduct} disabled={addingProduct} className="flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-xl bg-black/[0.05] dark:bg-white/10 hover:bg-black/[0.08] dark:hover:bg-white/15 transition-colors disabled:opacity-50">
              {addingProduct ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add product
            </button>
          </div>
        </div>

        {error && <div className="mt-5 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</div>}

        <button
          onClick={handleGenerate}
          className="mt-6 w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors shadow-lg shadow-blue-900/30"
        >
          <Wand2 className="w-5 h-5" /> {savedSite ? 'Rebuild website' : 'Generate website'}
        </button>
      </div>
    </div>
  );
}
