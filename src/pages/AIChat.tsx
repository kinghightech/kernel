import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, supabaseUrl, supabaseAnonKey } from '../supabase';
import { motion } from 'motion/react';
import { Sparkles, ArrowUp, ChevronRight } from 'lucide-react';

const LogoMark = ({ className = 'w-8 h-8' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 256 256" fill="white">
    <path d="M 0 128 C 70.692 128 128 185.308 128 256 L 64 256 C 64 220.654 35.346 192 0 192 Z M 256 192 C 220.654 192 192 220.654 192 256 L 128 256 C 128 185.308 185.308 128 256 128 Z M 128 0 C 128 70.692 70.692 128 0 128 L 0 64 C 35.346 64 64 35.346 64 0 Z M 192 0 C 192 35.346 220.654 64 256 64 L 256 128 C 185.308 128 128 70.692 128 0 Z" />
  </svg>
);

type Message = { role: 'user' | 'assistant'; content: string };

export default function AIChat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

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
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!res.ok || !res.body) {
        let msg = `Request failed (${res.status})`;
        try { const j = await res.json(); if (j?.error) msg = j.error; } catch { /* ignore */ }
        throw new Error(msg);
      }

      // Show an empty assistant bubble that fills in as tokens stream in.
      setLoading(false);
      setMessages([...nextMessages, { role: 'assistant', content: '' }]);

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
              setMessages([...nextMessages, { role: 'assistant', content: assistantText }]);
            }
          } catch { /* partial JSON across chunks — ignore, will retry next chunk */ }
        }
      }
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
    <div className="relative min-h-screen flex flex-col bg-[#0c0c0c] text-white">
      <div className="absolute inset-0 pointer-events-none opacity-30" style={{ background: 'radial-gradient(800px circle at 50% 0%, #0B2551, transparent 70%)' }} />
      <div className="absolute inset-0 pointer-events-none opacity-20" style={{ background: 'radial-gradient(400px circle at 50% -20%, #A4F4FD, transparent 80%)' }} />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <LogoMark className="w-7 h-7" />
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-tight">Kernel AI</span>
            <span className="px-2 py-0.5 rounded-full border border-white/10 text-white/50 text-xs">deepseek-v4-flash</span>
          </div>
        </div>
        <button onClick={() => navigate('/')} className="text-white/50 hover:text-white transition-colors text-sm flex items-center gap-1">
          Home <ChevronRight className="w-4 h-4" />
        </button>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center text-center pt-24">
              <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8 text-[#A4F4FD]" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">How can I help you today?</h1>
              <p className="text-white/60 max-w-sm">Ask Kernel AI anything — draft a reply, summarize a thread, or brainstorm ideas.</p>
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
                    ? 'bg-white text-black'
                    : 'liquid-glass text-white/90'
                }`}
              >
                {msg.content}
              </div>
            </motion.div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="liquid-glass rounded-2xl px-4 py-3 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-xl">{error}</div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="relative z-10 border-t border-white/10 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="liquid-glass flex items-end gap-2 rounded-2xl p-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Message Kernel AI..."
              className="flex-1 resize-none bg-transparent px-3 py-2 text-sm focus:outline-none placeholder:text-white/40 max-h-40"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="w-9 h-9 shrink-0 rounded-full bg-white text-black flex items-center justify-center hover:bg-white/90 transition-colors disabled:opacity-30"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
          </div>
          <p className="text-center text-xs text-white/30 mt-2">Kernel AI can make mistakes. Verify important information.</p>
        </div>
      </div>
    </div>
  );
}
