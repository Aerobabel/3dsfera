import React, { useState } from 'react';
import { Search, ChevronDown, Facebook, Twitter, Youtube, Instagram, ArrowRight, LogIn, LogOut, LayoutDashboard, User } from 'lucide-react';
import HomeBackground3D from './HomeBackground3D';
import LanguageSwitcher from './LanguageSwitcher';

const HomePage = ({ t, onNavigate, user, onOpenAuth, onLogout }) => {
    // Add hover state for the hero button for extra juice
    const [isHoveringCTA, setIsHoveringCTA] = useState(false);

    return (
        <div className="relative min-h-screen flex flex-col font-sans text-slate-900 overflow-hidden bg-zinc-50 selection:bg-cyan-500/30">
            {/* 3D Background */}
            <HomeBackground3D />

            {/* --- HUD OVERLAY LAYER --- */}
            {/* Light Vignette */}
            <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(255,255,255,0.8)_100%)] pointer-events-none"></div>
            <div className="absolute inset-0 z-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-multiply pointer-events-none"></div>

            {/* Decorative HUD Lines - Darker for contrast */}
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent z-10"></div>
            <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent z-10"></div>
            <div className="absolute left-8 top-0 h-32 w-px bg-gradient-to-b from-cyan-500/30 to-transparent z-10 hidden md:block"></div>
            <div className="absolute right-8 bottom-0 h-32 w-px bg-gradient-to-t from-cyan-500/30 to-transparent z-10 hidden md:block"></div>


            {/* --- TOP NAVIGATION BAR (HUD HEADER) --- */}
            <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 py-6 w-full">
                {/* Logo Section - Technical */}
                <div className="flex items-center gap-4 group cursor-pointer">
                    <div className="w-10 h-10 border border-slate-300 bg-white/50 flex items-center justify-center relative overflow-hidden rounded-sm shadow-sm">
                        <div className="absolute inset-0 bg-cyan-400/10 animate-pulse"></div>
                        <span className="font-['Orbitron'] font-bold text-cyan-600 text-lg relative z-10">3D</span>
                    </div>
                    <div className="flex flex-col justify-center">
                        <span className="text-2xl font-['Orbitron'] font-bold tracking-[0.2em] text-slate-900">
                            SFERA
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="h-px w-4 bg-cyan-500"></span>
                            <span className="text-[10px] tracking-widest text-slate-500 uppercase">System Online</span>
                        </div>
                    </div>
                </div>

                {/* Center Nav - Holographic Buttons (Light Mode) */}
                <div className="hidden lg:flex items-center gap-1">
                    {['home', 'exhibitions', 'products', 'services', 'contact'].map((item) => (
                        <button key={item} className="relative px-6 py-2 group overflow-hidden">
                            {/* Hover BG */}
                            <div className="absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/10 transition-all duration-300 transform skew-x-[-15deg]"></div>
                            {/* Text */}
                            <span className="relative z-10 font-['Exo_2'] text-xs font-bold tracking-widest text-slate-600 group-hover:text-cyan-700 uppercase transition-colors">
                                {t ? t(`homepage.nav.${item}`) : item}
                            </span>
                            {/* Underline Tech */}
                            <div className="absolute bottom-0 left-0 w-full h-[1px] bg-cyan-500/0 group-hover:bg-cyan-500/50 transition-all duration-300"></div>
                            {/* Corner bits */}
                            <div className="absolute top-0 right-0 w-1 h-1 border-t border-r border-slate-300/0 group-hover:border-slate-400/50 transition-all"></div>
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-6">
                    {/* Language Switcher - Minimal Slate */}
                    <div className="flex border border-slate-300 rounded-sm overflow-hidden">
                        <button className="px-3 py-1 text-[10px] font-bold text-slate-500 hover:bg-slate-100 transition-colors">EN</button>
                        <button className="px-3 py-1 text-[10px] font-bold bg-slate-900 text-white">RU</button>
                        <button className="px-3 py-1 text-[10px] font-bold text-slate-500 hover:bg-slate-100 transition-colors">ZH</button>
                    </div>

                    {/* Auth Controls - Industrial */}
                    {user ? (
                        <div className="flex items-center gap-4 pl-4 border-l border-slate-300">
                            {user.user_metadata?.role === 'seller' && (
                                <button
                                    onClick={() => onNavigate('dashboard')}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-sm text-slate-700 text-xs font-['Exo_2'] font-bold tracking-wider transition-all"
                                >
                                    <LayoutDashboard size={14} />
                                    <span>{t ? t('app.dashboard', 'DASHBOARD') : 'DASHBOARD'}</span>
                                </button>
                            )}

                            <div className="h-9 w-9 border border-slate-300 bg-white flex items-center justify-center text-slate-600 shadow-sm hover:border-slate-400 transition-colors" title={user.email}>
                                <User size={16} />
                            </div>

                            <button onClick={onLogout} className="text-slate-400 hover:text-red-500 transition-colors">
                                <LogOut size={20} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={onOpenAuth}
                            className="flex items-center gap-3 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-900 text-white text-xs font-['Exo_2'] font-bold tracking-widest shadow-md hover:shadow-lg transition-all"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                <LogIn size={14} />
                                {t ? t('app.login_signup', 'ACCESS TERMINAL') : 'ACCESS TERMINAL'}
                            </span>
                        </button>
                    )}
                </div>
            </nav>

            {/* --- MAIN CONTENT LAYOUT --- */}
            <main className="relative z-10 flex-1 flex flex-col justify-end pb-12 md:pb-24 px-6 md:px-12 w-full max-w-[1920px] mx-auto">
                <div className="grid md:grid-cols-12 gap-12 items-end">

                    {/* --- LEFT COLUMN: HERO TEXT (Span 7) --- */}
                    <div className="md:col-span-8 lg:col-span-7 relative">
                        <div className="relative z-10 max-w-4xl">
                            <div className="mb-2 flex items-center gap-3">
                                <div className="h-[2px] w-12 bg-cyan-500"></div>
                                <span className="text-cyan-600 font-['Exo_2'] font-bold tracking-widest text-sm uppercase">
                                    {t ? t('homepage.hero.welcome_exhibition', 'WELCOME TO ONLINE 3D-EXHIBITION') : 'WELCOME TO ONLINE 3D-EXHIBITION'}
                                </span>
                            </div>

                            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-slate-900 leading-[0.9] tracking-tight mb-8">
                                <span className="block text-4xl md:text-5xl lg:text-6xl text-slate-500 font-['Exo_2'] mb-2 tracking-wide drop-shadow-sm">
                                    {t ? t('homepage.hero.title_prefix', 'WELCOME TO') : 'WELCOME TO'}
                                </span>
                                <span className="block font-['Orbitron'] relative drop-shadow-xl">
                                    3DSFERA
                                    <span className="absolute -top-4 -right-16 md:-top-8 md:-right-24 text-2xl md:text-4xl text-cyan-500 font-['Exo_2'] font-bold opacity-80">
                                        V.1
                                    </span>
                                </span>
                            </h1>

                            <p className="max-w-xl text-lg md:text-xl text-slate-600 font-['Exo_2'] mb-10 border-l-4 border-cyan-500 pl-6 py-2 bg-white/50 backdrop-blur-sm rounded-r-md">
                                {t ? t('homepage.hero.subtitle', 'Utilizing cutting-edge 3D technology from anywhere in the world.') : 'Utilizing cutting-edge 3D technology from anywhere in the world.'}
                            </p>

                            <div className="mt-10 flex flex-wrap gap-6">
                                <button
                                    onClick={() => onNavigate('verified_test')}
                                    onMouseEnter={() => setIsHoveringCTA(true)}
                                    onMouseLeave={() => setIsHoveringCTA(false)}
                                    className="group relative px-10 py-5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-['Exo_2'] font-bold text-lg tracking-[0.15em] transition-all duration-300 overflow-hidden shadow-lg"
                                >
                                    <span className="relative z-10 flex items-center gap-4">
                                        {t ? t('homepage.hero.cta_visit', 'ENTER PAVILION') : 'ENTER PAVILION'}
                                        <ArrowRight size={20} className={`transform transition-transform duration-300 ${isHoveringCTA ? 'translate-x-2' : ''}`} />
                                    </span>
                                    {/* Background scanline */}
                                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                                    {/* Shine */}
                                    <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent transform skew-x-[-20deg] group-hover:animate-shine"></div>
                                </button>

                                <button className="px-8 py-5 border border-slate-300 hover:border-slate-400 text-slate-500 hover:text-slate-800 font-['Exo_2'] font-bold text-sm tracking-[0.15em] uppercase transition-colors backdrop-blur-md bg-white/40">
                                    {t ? t('learn_more', 'SYSTEM PREVIEW') : 'SYSTEM PREVIEW'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* --- RIGHT COLUMN: DATA PANEL (Span 4) --- */}
                    <div className="md:col-span-4 lg:col-span-5 flex flex-col items-end">
                        <div className="w-full max-w-md bg-white/80 backdrop-blur-xl border border-slate-300/80 border-t-cyan-500/50 p-6 relative group hover:border-cyan-500/50 transition-colors shadow-2xl shadow-slate-300/50">
                            {/* Decorative Corner */}
                            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-cyan-500"></div>
                            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-cyan-500"></div>

                            <div className="flex justify-between items-end mb-6 border-b border-slate-200 pb-4">
                                <div>
                                    <div className="text-[10px] font-['Orbitron'] text-cyan-600 tracking-widest uppercase mb-1">DATA FEED</div>
                                    <h3 className="text-xl font-['Exo_2'] font-bold text-slate-800 tracking-wide">{t ? t('homepage.floating.title', 'EXHIBITIONS') : "EXHIBITIONS"}</h3>
                                </div>
                                <div className="flex gap-1">
                                    <span className="w-1 h-1 bg-cyan-500 rounded-full animate-ping"></span>
                                    <span className="text-[10px] font-bold text-cyan-600 font-['Exo_2']">{t ? t('homepage.floating.live_now', 'LIVE') : "LIVE"}</span>
                                </div>
                            </div>

                            {/* Data List */}
                            <div className="space-y-3">
                                {[
                                    { title: "Dubai Expo", code: "DXB-2025", status: "ACTIVE", color: "text-cyan-600" },
                                    { title: "Beijing Tech", code: "BJ-TECH", status: "STANDBY", color: "text-slate-400" },
                                    { title: "Global Export", code: "GLB-EXP", status: "OFFLINE", color: "text-slate-400" },
                                ].map((item, i) => (
                                    <div key={i} className={`flex items-center justify-between p-3 border-l-2 ${item.status === 'ACTIVE' ? 'border-cyan-500 bg-cyan-50/50' : 'border-slate-100 hover:border-slate-300 hover:bg-white'} transition-all cursor-pointer group/item`}>
                                        <div>
                                            <div className={`text-xs font-bold font-['Exo_2'] uppercase tracking-wide ${item.status === 'ACTIVE' ? 'text-slate-900' : 'text-slate-500'}`}>{item.title}</div>
                                            <div className="text-[10px] font-mono text-slate-400">{item.code}</div>
                                        </div>
                                        <div className={`text-[10px] font-bold tracking-wider ${item.color} font-['Orbitron']`}>{item.status}</div>
                                    </div>
                                ))}
                            </div>

                            {/* Footer of Card */}
                            <div className="mt-6 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                                <span>SYNC_ID: #882910</span>
                                <span>NET_STABLE</span>
                            </div>
                        </div>
                    </div>

                </div>
            </main>

            {/* --- FOOTER STATUS BAR --- */}
            <footer className="relative z-20 py-4 px-6 md:px-12 border-t border-slate-200 bg-white/80 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex gap-8 text-[10px] font-['Exo_2'] font-bold text-slate-500 tracking-widest uppercase">
                    <a href="#" className="hover:text-cyan-600 transition-colors">{t ? t('homepage.footer.terms') : "Terms of Protocol"}</a>
                    <a href="#" className="hover:text-cyan-600 transition-colors">{t ? t('homepage.footer.privacy') : "Privacy Matrix"}</a>
                    <a href="#" className="hover:text-cyan-600 transition-colors">{t ? t('homepage.footer.support') : "Tech Support"}</a>
                </div>
                <div className="flex gap-2 text-[10px] font-mono text-slate-500">
                    <span>SERVER: EU-CENTRAL</span>
                    <span className="text-cyan-600">|</span>
                    <span>PING: 24ms</span>
                </div>
            </footer>
        </div >
    );
};

export default HomePage;

