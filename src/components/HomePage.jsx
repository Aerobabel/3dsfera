import React, { useState } from 'react';
import { Search, ChevronDown, Facebook, Twitter, Youtube, Instagram, ArrowRight, LogIn, LogOut, LayoutDashboard, User } from 'lucide-react';
import HomeBackground3D from './HomeBackground3D';
import LanguageSwitcher from './LanguageSwitcher';

const HomePage = ({ t, onNavigate, user, onOpenAuth, onLogout }) => {
    // Add hover state for the hero button for extra juice
    const [isHoveringCTA, setIsHoveringCTA] = useState(false);

    return (
        <div className="relative min-h-screen flex flex-col font-sans text-white overflow-hidden selection:bg-cyan-500/30">
            {/* 3D Background */}
            <HomeBackground3D />

            {/* Overlay Gradient for Text Readability - Clear top for the light */}
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-black/20 to-black/90 pointer-events-none"></div>

            {/* Navigation Bar - Refined Glass */}
            <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
                <div className="flex items-center gap-2 group cursor-pointer">
                    <span className="text-2xl font-bold tracking-widest text-white group-hover:text-cyan-50 transition-colors duration-300"><span className="text-orange-500 group-hover:text-orange-400 transition-colors">3D</span>SFERA</span>
                </div>

                <div className="hidden md:flex items-center gap-10 text-sm font-semibold text-white/90 drop-shadow-md">
                    {['home', 'exhibitions', 'products', 'services', 'contact'].map((item) => (
                        <button key={item} className="relative hover:text-white transition-colors duration-300 flex items-center gap-1 group">
                            {t ? t(`homepage.nav.${item}`) : item}
                            {['home', 'exhibitions', 'products'].includes(item) && <ChevronDown size={14} className="opacity-70 group-hover:opacity-100 transition-opacity" />}
                            <span className="absolute -bottom-1 left-0 w-0 h-px bg-cyan-400 transition-all duration-300 group-hover:w-full"></span>
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-4">
                    {/* Language Switcher */}
                    <LanguageSwitcher />

                    {/* Auth Controls */}
                    {user ? (
                        <div className="flex items-center gap-3">
                            {/* SELLER DASHBOARD */}
                            {user.user_metadata?.role === 'seller' && (
                                <button
                                    onClick={() => onNavigate('dashboard')}
                                    className="flex items-center gap-2 px-3 py-2 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 rounded-lg text-purple-100 text-xs font-bold uppercase tracking-wider transition-all backdrop-blur-md"
                                >
                                    <LayoutDashboard size={14} />
                                    <span>{t ? t('app.dashboard', 'Dashboard') : 'Dashboard'}</span>
                                </button>
                            )}

                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xs font-bold shadow-lg cursor-pointer" title={user.email}>
                                <User size={14} />
                            </div>

                            <button
                                onClick={onLogout}
                                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all"
                                title="Logout"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={onOpenAuth}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/30 rounded-full text-white text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] transition-all backdrop-blur-md"
                        >
                            <LogIn size={14} />
                            <span>{t ? t('app.login_signup', 'Login / Sign Up') : 'Login / Sign Up'}</span>
                        </button>
                    )}
                </div>
            </nav >

            <main className="relative z-10 flex-1 flex flex-col justify-center px-8 text-center md:text-left max-w-7xl mx-auto w-full">
                <div className="grid md:grid-cols-2 gap-16 items-center">

                    {/* Left Column: Hero Text */}
                    <div className="space-y-10 relative">
                        {/* Left side nav list (vertical) - Refined */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-8 text-xs font-bold tracking-widest uppercase text-slate-600 -ml-32">
                            {['home', 'exhibitions', 'products', 'services', 'contact'].map((item, idx) => (
                                <a key={item} href="#" className={`hover:text-cyan-400 hover:translate-x-2 transition-all duration-300 origin-left ${idx === 0 ? 'text-white border-l-2 border-cyan-500 pl-3' : 'hover:border-l-2 hover:border-cyan-500/50 hover:pl-3'}`}>
                                    {t ? t(`homepage.nav.${item}`) : item}
                                </a>
                            ))}
                        </div>

                        <div className="space-y-8">
                            <h1 className="text-5xl md:text-6xl lg:text-[4rem] font-bold leading-[1.1] tracking-tight max-w-3xl text-white drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)]">
                                {t ? t('homepage.hero.title_prefix') : "Welcome to SFERA 3D"} {t ? t('homepage.hero.title_suffix') : "- Your Gateway to Verified Chinese Products."}
                            </h1>
                            <p className="text-xl text-slate-300 max-w-2xl font-light leading-relaxed">
                                {t ? t('homepage.hero.subtitle') : "Utilizing Cutting-Edge 3D Technology from Anywhere in the World breakdown."}
                            </p>

                            <div className="pt-6 relative inline-block">
                                <button
                                    onClick={() => onNavigate('verified_test')}
                                    onMouseEnter={() => setIsHoveringCTA(true)}
                                    onMouseLeave={() => setIsHoveringCTA(false)}
                                    className="group relative px-12 py-5 bg-transparent border border-white/20 text-white font-bold text-lg tracking-wider hover:bg-white/5 transition-all duration-500 rounded-sm overflow-hidden backdrop-blur-md shadow-[0_0_50px_rgba(0,100,255,0.1)] hover:shadow-[0_0_80px_rgba(0,255,255,0.3)]"
                                >
                                    <span className="relative z-10 flex items-center gap-3">
                                        {t ? t('homepage.hero.cta_visit', 'Visit Exhibition Hall') : 'Visit Exhibition Hall'}
                                        <ArrowRight size={20} className={`transform transition-transform duration-300 ${isHoveringCTA ? 'translate-x-1' : ''}`} />
                                    </span>

                                    {/* Tech Borders */}
                                    <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400 transition-all duration-500 group-hover:w-full group-hover:h-full group-hover:border-cyan-500/20"></div>
                                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400 transition-all duration-500 group-hover:w-full group-hover:h-full group-hover:border-cyan-500/20"></div>

                                    {/* Shine Effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
                                </button>
                            </div>
                        </div>

                        <div className="pt-16 space-y-4 max-w-lg">
                            <h2 className="text-lg font-medium text-cyan-200">{t ? t('homepage.hero.welcome_exhibition') : "Welcome to Online 3D Exhibition"}</h2>
                            <p className="text-slate-400 text-sm leading-relaxed border-l border-white/20 pl-4">
                                {t ? t('homepage.hero.description') : "Meet company as a global market leader for Chinese products and services and Chinese products and services workshop that is easily accessible press and extraction accessible for worldwide."}
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Floating Window - Premium Glass */}
                    <div className="relative mt-8 md:mt-0 flex justify-end perspective-1000">
                        <div className="w-full max-w-[28rem] bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-2xl border border-white/20 rounded-2xl overflow-hidden shadow-2xl p-8 transform transition-transform duration-700 hover:scale-[1.02] active:scale-[0.98]">
                            {/* Window Controls - Mac style but cooler */}
                            <div className="flex items-center gap-2 mb-8 opacity-60">
                                <div className="w-3 h-3 rounded-full bg-red-500 shadow-inner"></div>
                                <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-inner"></div>
                                <div className="w-3 h-3 rounded-full bg-green-500 shadow-inner"></div>
                            </div>

                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-xl font-bold tracking-wide text-white drop-shadow-md">{t ? t('homepage.floating.title') : "Upcoming Exhibitions"}</h3>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 px-3 py-1 bg-emerald-900/40 border border-emerald-500/20 rounded-full">{t ? t('homepage.floating.live_now') : "Live Now"}</span>
                            </div>

                            {/* Tabs */}
                            <div className="flex border-b border-white/10 mb-6 gap-6 text-xs font-semibold tracking-wider text-slate-500">
                                <button className="text-white border-b-2 border-cyan-500 pb-2 -mb-px px-1 transition-colors">{t ? t('homepage.floating.tab_home') : "Home"}</button>
                                <button className="hover:text-white transition-colors pb-2 px-1">{t ? t('homepage.floating.tab_next') : "Next"}</button>
                                <button className="hover:text-white transition-colors pb-2 px-1">{t ? t('homepage.floating.tab_world') : "World"}</button>
                                <button className="hover:text-white transition-colors pb-2 px-1">{t ? t('homepage.floating.tab_trade') : "Trade"}</button>
                            </div>

                            {/* List with staggered animation feeling */}
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { title: "Dubai Expo", code: "Summer Import/Export", date: "29 / 10", active: true },
                                    { title: "Drivers Meet Beijing", code: "Global Tech Summit", date: "29 / 10", active: false },
                                    { title: "China Export Ceremony", code: "Export Conference", date: "21 / 10", active: false },
                                    { title: "Latin America", code: "Trade with Partners", date: "22 / 10", active: false },
                                ].map((item, i) => (
                                    <div key={i} className={`p-4 rounded-xl transition-all duration-300 cursor-pointer border ${item.active ? 'bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)] transform scale-[1.02]' : 'bg-white/5 hover:bg-white/10 border-white/5 hover:border-white/20'}`}>
                                        <h4 className="text-sm font-bold mb-1.5 text-slate-100">{item.title}</h4>
                                        <p className="text-[10px] text-slate-400 mb-3 leading-tight">{item.code}</p>
                                        <div className="flex justify-between items-center">
                                            <p className="text-[10px] font-mono text-cyan-300">{item.date}</p>
                                            {item.active && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* "Load More" indicator */}
                            <div className="mt-6 text-center">
                                <div className="w-12 h-1 bg-white/10 rounded-full mx-auto"></div>
                            </div>
                        </div>
                    </div>

                </div>
            </main>

            {/* Footer - Minimalist */}
            <footer className="relative z-10 py-8 px-8 border-t border-white/5 mt-auto bg-black/20 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs font-medium text-slate-500 tracking-wide uppercase">
                    <div className="flex gap-8">
                        <a href="#" className="hover:text-cyan-400 transition-colors">{t ? t('homepage.footer.terms') : "Terms of Service"}</a>
                        <a href="#" className="hover:text-cyan-400 transition-colors">{t ? t('homepage.footer.privacy') : "Privacy Policy"}</a>
                        <a href="#" className="hover:text-cyan-400 transition-colors">{t ? t('homepage.footer.support') : "Support"}</a>
                    </div>

                    <div className="flex gap-6">
                        <Facebook size={18} className="hover:text-white cursor-pointer transition-transform hover:-translate-y-1" />
                        <Twitter size={18} className="hover:text-white cursor-pointer transition-transform hover:-translate-y-1" />
                        <Youtube size={18} className="hover:text-white cursor-pointer transition-transform hover:-translate-y-1" />
                        <Instagram size={18} className="hover:text-white cursor-pointer transition-transform hover:-translate-y-1" />
                    </div>
                </div>
            </footer>
        </div >
    );
};

export default HomePage;

