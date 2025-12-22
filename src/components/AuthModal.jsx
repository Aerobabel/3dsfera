import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
    const { t } = useTranslation();
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('buyer'); // 'buyer' | 'seller'
    const [msg, setMsg] = useState(null);

    if (!isOpen) return null;

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg(null);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                onClose();
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            role: role,
                        },
                    },
                });
                if (error) throw error;
                setMsg({ type: 'success', text: 'Check your email for confirmation link!' });
            }
        } catch (error) {
            setMsg({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-md bg-[#0a0f1e] border border-white/10 rounded-2xl shadow-2xl p-6">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white"
                >
                    <X size={20} />
                </button>

                <h2 className="text-2xl font-bold mb-6 text-white text-center">
                    {isLogin ? t('auth.login') : t('auth.signup')}
                </h2>

                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label className="block text-sm text-slate-400 mb-1">{t('auth.email')}</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
                            placeholder="name@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-slate-400 mb-1">{t('auth.password')}</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition"
                            placeholder="••••••••"
                        />
                    </div>

                    {!isLogin && (
                        <div className="pt-2">
                            <p className="text-sm text-slate-400 mb-2">{t('auth.role_legend')}</p>
                            <div className="flex gap-4">
                                <label className={`flex-1 cursor-pointer border rounded-xl p-3 flex items-center justify-center transition ${role === 'buyer' ? 'border-blue-500 bg-blue-500/10 text-blue-300' : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'}`}>
                                    <input
                                        type="radio"
                                        name="role"
                                        value="buyer"
                                        checked={role === 'buyer'}
                                        onChange={() => setRole('buyer')}
                                        className="hidden"
                                    />
                                    {t('auth.buyer')}
                                </label>
                                <label className={`flex-1 cursor-pointer border rounded-xl p-3 flex items-center justify-center transition ${role === 'seller' ? 'border-purple-500 bg-purple-500/10 text-purple-300' : 'border-white/10 bg-white/5 text-slate-400 hover:bg-white/10'}`}>
                                    <input
                                        type="radio"
                                        name="role"
                                        value="seller"
                                        checked={role === 'seller'}
                                        onChange={() => setRole('seller')}
                                        className="hidden"
                                    />
                                    {t('auth.seller')}
                                </label>
                            </div>
                        </div>
                    )}

                    {msg && (
                        <div className={`text-sm p-3 rounded-lg ${msg.type === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                            {msg.text}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? t('auth.loading') : (isLogin ? t('auth.login') : t('auth.signup'))}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => { setIsLogin(!isLogin); setMsg(null); }}
                        className="text-sm text-slate-400 hover:text-white underline decoration-slate-600 underline-offset-4"
                    >
                        {isLogin
                            ? "Don't have an account? Sign up"
                            : "Already have an account? Log in"}
                    </button>
                </div>
            </div>
        </div>
    );
}
