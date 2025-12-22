import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Send, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export function ChatOverlay({ open, onClose, product, messages, onNewMessage }) {
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!content.trim()) return;
    if (!supabase) {
      onNewMessage?.({
        id: Date.now(),
        content,
        sender: 'local',
        product_id: product?.id,
        created_at: new Date().toISOString(),
      });
      setContent('');
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({ content, product_id: product?.id })
        .select()
        .single();
      if (error) throw error;
      onNewMessage?.(data);
      setContent('');
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: 420, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 420, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          className="fixed right-4 top-4 bottom-4 w-96 rounded-3xl bg-gradient-to-b from-cosmic-800/90 via-cosmic-900/90 to-cosmic-800/90 border border-white/10 shadow-glass backdrop-blur-xl z-30 flex flex-col"
        >
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-blue-300">Product</p>
              <p className="text-lg font-semibold text-white">{product?.name || 'Selection'}</p>
              <p className="text-sm text-slate-400">{product?.price || '—'}</p>
            </div>
            <button
              onClick={onClose}
              className="h-10 w-10 rounded-2xl bg-white/5 border border-white/10 text-slate-300 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-white/10">
            {messages.length === 0 && (
              <div className="text-sm text-slate-400">No messages yet. Start the conversation.</div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className="p-3 rounded-2xl bg-white/5 border border-white/5">
                <p className="text-xs text-slate-400">
                  {new Date(msg.created_at || Date.now()).toLocaleTimeString()}
                </p>
                <p className="text-sm text-white mt-1">{msg.content}</p>
              </div>
            ))}
          </div>
          <form onSubmit={handleSend} className="p-4 border-t border-white/5 space-y-3">
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Ask about specs, lead time, or pricing…"
              className="w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-blue-400"
            />
            <button
              type="submit"
              disabled={sending}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-glow hover:shadow-glow disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {sending ? 'Sending…' : 'Send'}
              <Send size={18} />
            </button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
