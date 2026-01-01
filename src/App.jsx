// Deployment Trigger: 2026-01-02 Fix Camera & Convai
import React, { Suspense, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from './lib/supabaseClient';
import './index.css';
import AuthModal from './components/AuthModal';
import LanguageSwitcher from './components/LanguageSwitcher'; // Kept if needed, but HomePage might have its own or we pass it? The design has language switcher? The reference image doesn't explicitly show it in the header, but it's good practice. I'll probably pass t down.
import { LogOut, LayoutDashboard } from 'lucide-react';
import CalendarModal from './components/CalendarModal';
import HomePage from './components/HomePage';

// --- LAZY LOADED COMPONENTS ---
const VerifiedPavilion = React.lazy(() => import('./components/VerifiedPavilion'));
const SellerDashboard = React.lazy(() => import('./components/SellerDashboard'));
const AssetPreloader = React.lazy(() => import('./components/AssetPreloader'));

function App() {
  const { t } = useTranslation();
  const [view, setView] = useState('home'); // home | dashboard | verified_test
  const [user, setUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);



  const handleLogout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setView('home');
  };

  // --- ROUTING ---

  if (view === 'dashboard' && user?.user_metadata?.role === 'seller') {
    return (
      <div className="min-h-screen bg-[#03040a] text-white">
        <header className="fixed top-0 w-full z-50 px-8 py-4 flex justify-between items-center bg-black/20 backdrop-blur-md border-b border-white/10">
          <button onClick={() => setView('home')} className="text-sm font-bold tracking-wider text-slate-300 hover:text-white transition-colors flex items-center gap-2">
            <span className="text-cyan-400">←</span> {t('app.back_to_home', 'BACK TO HOME')}
          </button>
          <div className="flex items-center gap-6">
            <LanguageSwitcher />
            <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/10">
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e]"></div>
              <span className="text-xs font-bold tracking-wide text-white/90">{user.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 rounded-full text-red-400 hover:text-red-200 transition-all shadow-[0_0_15px_rgba(239,68,68,0.1)]"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>
        <React.Suspense fallback={<div className="flex h-screen items-center justify-center text-white font-bold tracking-widest animate-pulse">{t('app.loading_dashboard', 'LOADING DASHBOARD...')}</div>}>
          <SellerDashboard user={user} />
        </React.Suspense>
      </div>
    );
  }

  if (view === 'verified_test') {
    return (
      <React.Suspense fallback={
        <div className="flex h-screen items-center justify-center bg-black text-white flex-col gap-4">
          <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
          <div className="text-cyan-500 tracking-widest uppercase text-sm font-bold">{t('app.initializing_engine', 'Initializing Engine...')}</div>
        </div>
      }>
        <VerifiedPavilion onBack={() => setView('home')} user={user} />
      </React.Suspense>
    );
  }

  // Home View
  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden font-sans">
      {/* Cyberpunk Background Layers - Keeping these for the '3D' feel behind the homepage glass */}
      <div className="fixed inset-0 cyber-grid opacity-30 pointer-events-none"></div>
      <div className="fixed inset-0 scanlines opacity-10 pointer-events-none z-50"></div>

      {/* BACKGROUND ASSET LOADING */}
      <React.Suspense fallback={null}>
        {view === 'home' && <AssetPreloader />}
      </React.Suspense>

      <HomePage
        t={t}
        onNavigate={setView}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
      />

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      {showCalendar && <CalendarModal onClose={() => setShowCalendar(false)} />}

    </div>
  );
}

export default App;
