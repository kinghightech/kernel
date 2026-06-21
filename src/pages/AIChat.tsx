import React, { useEffect, useRef, useState } from 'react';
import { supabase, supabaseUrl, supabaseAnonKey } from '../supabase';
import { motion } from 'motion/react';
import { Sparkles, ArrowUp } from 'lucide-react';

type Message = { role: 'user' | 'assistant'; content: string };

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bizContext, setBizContext] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading, streamingMessage]);

  // Load the user's business profile + catalog once, so the AI has real context.
  useEffect(() => {
    (async () => {
      const [{ data: ob }, { data: products }] = await Promise.all([
        supabase.from('onboarding').select('*').maybeSingle(),
        supabase.from('products').select('name, price, description'),
      ]);
      if (!ob) return;
      const menu = (products ?? [])
        .map((p) => `- ${p.name}${p.price ? ` (${p.price})` : ''}${p.description ? `: ${p.description}` : ''}`)
        .join('\n');
      const facts = [
        ob.business_name && `Business name: ${ob.business_name}`,
        ob.business_type && `Type: ${ob.business_type}`,
        ob.address && `Location: ${ob.address}`,
        ob.revenue && `Average daily revenue: $${ob.revenue}`,
        ob.profit_margin && `Profit margin: ${ob.profit_margin}%`,
        ob.business_model && `Business model: ${ob.business_model}`,
        ob.peak_traffic && `Peak traffic: ${ob.peak_traffic}`,
        ob.customer_source && `Customers come from: ${ob.customer_source}`,
        ob.promotion_style && `Promotion style: ${ob.promotion_style}`,
      ].filter(Boolean).join('\n');
      setBizContext(
        `You are Kernel AI, a practical business assistant. You are helping the owner of this specific business:\n${facts}` +
        (menu ? `\n\nProducts / menu:\n${menu}` : '') +
        `\n\nUse these real details to give specific, relevant advice for their business. Keep answers concise and actionable.`
      );
    })();
  }, []);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setError(null);
    const nextMessages: Message[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      // Use the signed-in user's access token (falls back to anon for the gateway).
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? supabaseAnonKey;

      const res = await fetch(`${supabaseUrl}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          apikey: supabaseAnonKey,
        },
        body: JSON.stringify({
          messages: bizContext ? [{ role: 'system', content: bizContext }, ...nextMessages] : nextMessages,
        }),
      });

      if (!res.ok || !res.body) {
        let msg = `Request failed (${res.status})`;
        try { const j = await res.json(); if (j?.error) msg = j.error; } catch { /* ignore */ }
        throw new Error(msg);
      }

      // Initialize streaming message state
      setLoading(false);
      setStreamingMessage('');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Parse Server-Sent Events: lines beginning with "data: ".
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine.startsWith('data:')) continue;
          const payload = trimmedLine.slice(5).trim();
          if (payload === '[DONE]') continue;
          try {
            const parsed = JSON.parse(payload);
            const delta = parsed?.choices?.[0]?.delta?.content;
            if (delta) {
              assistantText += delta;
              setStreamingMessage(assistantText);
            }
          } catch { /* partial JSON across chunks — ignore, will retry next chunk */ }
        }
      }
      
      // When done streaming, commit to the messages array
      setMessages([...nextMessages, { role: 'assistant', content: assistantText }]);
      setStreamingMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="relative h-full flex flex-col bg-white text-neutral-900 dark:bg-[#0c0c0c] dark:text-white overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-30 hidden dark:block" style={{ background: 'radial-gradient(800px circle at 50% 0%, #0B2551, transparent 70%)' }} />
      <div className="absolute inset-0 pointer-events-none opacity-20 hidden dark:block" style={{ background: 'radial-gradient(400px circle at 50% -20%, #A4F4FD, transparent 80%)' }} />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-black/10 dark:border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="font-semibold tracking-tight">Kernel AI</span>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center text-center pt-24">
              <div className="w-16 h-16 rounded-full bg-black/[0.05] border border-black/10 dark:bg-white/10 dark:border-white/20 flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8 text-blue-600 dark:text-[#A4F4FD]" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">How can I help you today?</h1>
              <p className="text-neutral-500 dark:text-white/60 max-w-sm">Ask Kernel AI anything — draft a reply, summarize a thread, or brainstorm ideas.</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-black'
                    : 'bg-black/[0.04] border border-black/10 text-neutral-800 dark:bg-white/[0.06] dark:border-white/10 dark:text-white/90'
                }`}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}

          {streamingMessage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex justify-start"
            >
              <div className="max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap bg-black/[0.04] border border-black/10 text-neutral-800 dark:bg-white/[0.06] dark:border-white/10 dark:text-white/90">
                {streamingMessage}
              </div>
            </motion.div>
          )}

          {loading && !streamingMessage && (
            <div className="flex justify-start">
              <div className="bg-black/[0.04] border border-black/10 dark:bg-white/[0.06] dark:border-white/10 rounded-2xl px-4 py-3 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-white/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-white/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-white/60 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl">{error}</div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="relative z-10 border-t border-black/10 dark:border-white/10 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="bg-black/[0.04] border border-black/10 dark:bg-white/[0.06] dark:border-white/10 flex items-end gap-2 rounded-2xl p-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Message Kernel AI..."
              className="flex-1 resize-none bg-transparent px-3 py-2 text-sm focus:outline-none placeholder:text-neutral-400 dark:placeholder:text-white/40 max-h-40"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="w-9 h-9 shrink-0 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-black flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-30"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
          </div>
          <p className="text-center text-xs text-neutral-400 dark:text-white/30 mt-2">Kernel AI can make mistakes. Verify important information.</p>
        </div>
      </div>
    </div>
  );
}
