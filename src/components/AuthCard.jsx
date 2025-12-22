import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Shield, Send } from 'lucide-react';

export function AuthCard({ onAuthenticated }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('magic');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supabase) {
      setMessage('Missing Supabase env keys.');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      if (mode === 'magic') {
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) throw error;
        setMessage('Magic link sent. Check your inbox.');
      } else {
        const { error, data } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuthenticated?.(data.session);
      }
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto mt-12 rounded-3xl bg-gradient-to-br from-cosmic-800/90 via-cosmic-900/90 to-cosmic-800/90 border border-white/10 shadow-glass">
      <div className="px-8 py-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-11 w-11 rounded-2xl bg-blue-500/20 border border-blue-500/30 text-blue-300 flex items-center justify-center shadow-glow">
            <Shield size={22} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-blue-300">Access</p>
            <h3 className="text-xl font-semibold text-white">EXPO HALL 3D</h3>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-slate-300">Work Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-blue-400"
              placeholder="you@company.com"
            />
          </div>
          {mode === 'password' && (
            <div>
              <label className="text-sm text-slate-300">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none focus:border-blue-400"
                placeholder="••••••••"
              />
            </div>
          )}
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>Use {mode === 'magic' ? 'magic link' : 'password'} sign-in</span>
            <button
              type="button"
              onClick={() => setMode(mode === 'magic' ? 'password' : 'magic')}
              className="text-blue-300 hover:text-blue-200"
            >
              Switch
            </button>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-glow hover:shadow-glow disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? 'Sending…' : mode === 'magic' ? 'Send Magic Link' : 'Sign In'}
            <Send size={18} />
          </button>
          {message && <p className="text-sm text-blue-200">{message}</p>}
        </form>
      </div>
    </div>
  );
}
