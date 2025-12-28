import React, { useState, useEffect } from 'react';
import { LayoutDashboard, User, LogIn, LogOut, ArrowRight, Globe, Shield, Zap, ChevronRight } from 'lucide-react';
import HomeBackground3D from './HomeBackground3D';
import { useTranslation, Trans } from 'react-i18next';

const HomePage = ({ t, onNavigate, user, onOpenAuth, onLogout }) => {
    const { i18n } = useTranslation();
    const [scrolled, setScrolled] = useState(false);

    // Scroll effect for navbar
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const changeLang = (lng) => i18n.changeLanguage(lng);

    return (
        <div className="relative min-h-screen bg-[#050914] text-white selection:bg-cyan-500/30 font-sans overflow-x-hidden">
            {/* --- BACKGROUND LAYER --- */}
            {/* 3D Background Component */}
            <div className="fixed inset-0 z-0">
                <HomeBackground3D />
            </div>

            {/* Dark Overlay Gradient (Top to Bottom) - Stronger for contrast */}
            <div className="fixed inset-0 z-0 bg-gradient-to-b from-[#050914]/95 via-[#050914]/70 to-[#050914] pointer-events-none" />

            {/* Cyber Grid Overlay */}
            <div className="fixed inset-0 z-0 opacity-20 bg-[linear-gradient(rgba(34,211,238,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.05)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />

            {/* Vignette */}
            <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050914_100%)] pointer-events-none" />

            {/* --- NAVIGATION --- */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#050914]/90 backdrop-blur-md border-b border-white/5 py-4' : 'bg-transparent py-8'}`}>
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    {/* Brand */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cyan-500/10 border border-cyan-500/20 rounded flex items-center justify-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-cyan-400/20 animate-pulse" />
                            <span className="font-['Orbitron'] font-bold text-cyan-400 relative z-10">3D</span>
                        </div>
                        <div>
                            <h1 className="font-['Orbitron'] font-bold text-2xl tracking-[0.2em] text-white leading-none">3DSFERA</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse shadoow-[0_0_8px_cyan]" />
                                <span className="text-[10px] uppercase tracking-widest text-cyan-500/80 font-mono">{t('homepage.system_online')}</span>
                            </div>
                        </div>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-1">
                        {['exhibitions', 'marketplace', 'solutions', 'about'].map((item) => (
                            <button key={item} className="px-5 py-2 text-xs font-['Exo_2'] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors relative group">
                                {t ? t(`homepage.nav.${item}`, item) : item}
                                <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-cyan-500 transition-all duration-300 group-hover:w-full" />
                            </button>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-6">
                        {/* Language */}
                        <div className="hidden md:flex items-center gap-2 text-[10px] font-bold tracking-wider text-slate-500">
                            {['en', 'ru', 'zh'].map((lng, i) => (
                                <React.Fragment key={lng}>
                                    <button
                                        onClick={() => changeLang(lng)}
                                        className={`transition-colors uppercase ${i18n.language === lng ? 'text-cyan-400 shadow-glow' : 'hover:text-white'}`}
                                    >
                                        {lng}
                                    </button>
                                    {i < 2 && <span className="text-slate-700">/</span>}
                                </React.Fragment>
                            ))}
                        </div>

                        {/* Auth */}
                        {user ? (
                            <div className="flex items-center gap-4 pl-6 border-l border-white/10">
                                {user.user_metadata?.role === 'seller' && (
                                    <button
                                        onClick={() => onNavigate('dashboard')}
                                        className="hidden md:flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 rounded-sm text-xs font-bold tracking-wider transition-all"
                                    >
                                        <LayoutDashboard size={14} />
                                        <span>DASHBOARD</span>
                                    </button>
                                )}
                                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:border-white/30 transition-all cursor-pointer">
                                    <User size={18} />
                                </div>
                                <button onClick={onLogout} className="text-slate-500 hover:text-red-400 transition-colors">
                                    <LogOut size={20} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={onOpenAuth}
                                className="group relative px-6 py-2 bg-white text-black text-xs font-bold uppercase tracking-widest overflow-hidden hover:bg-cyan-400 transition-colors duration-300"
                            >
                                <div className="relative z-10 flex items-center gap-2">
                                    <LogIn size={14} />
                                    <span>Access Terminal</span>
                                </div>
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            {/* --- HERO SECTION --- */}
            <header className="relative z-10 pt-40 pb-20 px-6 min-h-screen flex flex-col justify-center items-center text-center">
                <div className="max-w-5xl mx-auto space-y-8">
                    {/* Eyebrow */}
                    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm animate-fadeIn">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs font-['Exo_2'] font-bold tracking-[0.2em] text-cyan-300 uppercase">
                            {t('homepage.hero.eyebrow')}
                        </span>
                    </div>

                    {/* Main Title */}
                    <h1 className="text-6xl md:text-8xl lg:text-9xl font-['Orbitron'] font-black tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-slate-500 drop-shadow-[0_0_30px_rgba(255,255,255,0.15)]">
                        {t('homepage.hero.title_1')} <br />
                        <span className="text-stroke-1 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 opacity-90">{t('homepage.hero.title_2')}</span>
                    </h1>

                    <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 font-['Exo_2'] leading-relaxed">
                        <Trans i18nKey="homepage.hero.description" components={{ 1: <span className="text-cyan-400 font-bold" /> }} />
                    </p>

                    {/* CTA Group */}
                    <div className="flex flex-col md:flex-row items-center justify-center gap-6 mt-12">
                        <button
                            onClick={() => onNavigate('verified_test')}
                            className="group relative px-10 py-5 bg-cyan-500 hover:bg-cyan-400 text-black font-['Exo_2'] font-bold text-sm tracking-[0.2em] uppercase transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_40px_rgba(34,211,238,0.5)] skew-x-[-10deg]"
                        >
                            <div className="skew-x-[10deg] flex items-center gap-3">
                                <span>{t('homepage.hero.cta_enter')}</span>
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </button>

                        <button className="px-8 py-5 border border-white/20 hover:border-white/50 text-white font-['Exo_2'] font-bold text-sm tracking-[0.2em] uppercase transition-all backdrop-blur-sm hover:bg-white/5 skew-x-[-10deg]">
                            <div className="skew-x-[10deg]">
                                {t('homepage.hero.cta_demo')}
                            </div>
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 pt-16 border-t border-white/5 max-w-4xl mx-auto mt-20">
                        {[
                            { label: t('homepage.stats.countries'), value: "140+" },
                            { label: t('homepage.stats.suppliers'), value: "50k+" },
                            { label: t('homepage.stats.products'), value: "2.4M" },
                            { label: t('homepage.stats.trade_vol'), value: "$40B" },
                        ].map((stat, i) => (
                            <div key={i} className="text-center group cursor-default">
                                <div className="text-3xl md:text-4xl font-['Orbitron'] font-bold text-white group-hover:text-cyan-400 transition-colors">{stat.value}</div>
                                <div className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-500 mt-2">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </header>

            {/* --- FEATURES SCROLL --- */}
            <section className="relative z-10 py-32 border-t border-white/5 bg-[#050914]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-cyan-500/50 hover:bg-white/10 transition-all group">
                            <div className="w-14 h-14 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-110 transition-transform">
                                <Globe size={32} />
                            </div>
                            <h3 className="text-xl font-['Orbitron'] font-bold text-white mb-4">{t('homepage.features.global_access.title')}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                {t('homepage.features.global_access.desc')}
                            </p>
                            <div className="mt-6 flex items-center text-cyan-500 text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                {t('homepage.features.global_access.link')} <ChevronRight size={14} />
                            </div>
                        </div>

                        {/* Feature 2 */}
                        <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-white/10 transition-all group">
                            <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition-transform">
                                <Zap size={32} />
                            </div>
                            <h3 className="text-xl font-['Orbitron'] font-bold text-white mb-4">{t('homepage.features.real_time_3d.title')}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                {t('homepage.features.real_time_3d.desc')}
                            </p>
                            <div className="mt-6 flex items-center text-purple-500 text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                {t('homepage.features.real_time_3d.link')} <ChevronRight size={14} />
                            </div>
                        </div>

                        {/* Feature 3 */}
                        <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-green-500/50 hover:bg-white/10 transition-all group">
                            <div className="w-14 h-14 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 mb-6 group-hover:scale-110 transition-transform">
                                <Shield size={32} />
                            </div>
                            <h3 className="text-xl font-['Orbitron'] font-bold text-white mb-4">{t('homepage.features.verified_trust.title')}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                {t('homepage.features.verified_trust.desc')}
                            </p>
                            <div className="mt-6 flex items-center text-green-500 text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                                {t('homepage.features.verified_trust.link')} <ChevronRight size={14} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HomePage;
