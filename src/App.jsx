import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from './lib/supabaseClient';
import './index.css';
import AuthModal from './components/AuthModal';
import LanguageSwitcher from './components/LanguageSwitcher';
import SellerDashboard from './components/SellerDashboard';
import VerifiedPavilion from './components/VerifiedPavilion';
import { LogIn, LogOut, LayoutDashboard, ShieldCheck, Calendar } from 'lucide-react';
import CalendarModal from './components/CalendarModal';

// --- PARTICLE COMPONENT ---
function ReactiveParticleFooter() {
  const canvasRef = React.useRef(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // State
    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;
    let particles = [];
    let mouse = { x: -9999, y: -9999 };

    // Resize
    const handleResize = () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    // Mouse
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

    // Particle Class
    class Particle {
      constructor() {
        this.reset();
      }

      reset() {
        this.x = Math.random() * width;
        this.y = height + Math.random() * 50; // Start below
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = -Math.random() * 1 - 0.5; // Float up
        this.size = Math.random() * 2 + 1;
        this.life = 1; // Opacity
        this.decay = Math.random() * 0.005 + 0.002;
        this.color = Math.random() > 0.5 ? '#00ffff' : '#0088ff'; // Cyan/Blue variants
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;

        // Mouse Repulsion
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          const force = (100 - dist) / 100;
          const angle = Math.atan2(dy, dx);
          this.vx += Math.cos(angle) * force * 0.5;
          this.vy += Math.sin(angle) * force * 0.5;
        }

        // Reset Check
        if (this.life <= 0 || this.y < 0) {
          this.reset();
        }
      }

      draw() {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.size, this.size); // Square pixels for digital look
      }
    }

    // Init Particles
    for (let i = 0; i < 150; i++) {
      particles.push(new Particle());
    }

    // Loop
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => {
        p.update();
        p.draw();
      });
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute bottom-0 left-0 w-full h-64 pointer-events-auto z-20 opacity-80"
      style={{ maskImage: 'linear-gradient(to top, black, transparent)' }}
    />
  );
}


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
        <header className="fixed top-0 w-full z-50 p-6 flex justify-between items-center bg-black/50 backdrop-blur">
          <button onClick={() => setView('home')} className="text-sm text-slate-400 hover:text-white">← Back to Home</button>
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold">{user.email}</span>
            <button onClick={handleLogout} className="p-2 border border-white/10 rounded-lg hover:bg-white/10"><LogOut size={16} /></button>
          </div>
        </header>
        <SellerDashboard user={user} />
      </div>
    );
  }

  if (view === 'verified_test') {
    return <VerifiedPavilion onBack={() => setView('home')} user={user} />;
  }

  return (
    <div className="min-h-screen bg-black text-cyan-50 relative overflow-hidden font-mono selection:bg-cyan-500/30">
      {/* Cyberpunk Background Layers */}
      <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none"></div>
      <div className="absolute inset-0 scanlines opacity-10 pointer-events-none z-50"></div>

      {/* REACTIVE FOOTER */}
      <ReactiveParticleFooter />

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      {showCalendar && <CalendarModal onClose={() => setShowCalendar(false)} />}

      {/* TOP GLOW EFFECT */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-cyan-500/10 to-transparent pointer-events-none z-0" />

      <header className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-12 flex flex-col md:flex-row md:items-center md:justify-between gap-10">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <p className="text-xs uppercase tracking-[0.45em] text-cyan-300">3Dsfera</p>
            <LanguageSwitcher />
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold mt-2">{t('title')}</h1>
          <p className="text-slate-300 mt-3 max-w-2xl">
            {t('subtitle')}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => setView('verified_test')}
              className="px-6 py-4 rounded-none clip-path-slant bg-blue-900/20 border border-blue-500/50 hover:bg-blue-500/20 hover:border-blue-400 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition text-blue-200 tracking-wider font-bold"
            >
              {t('launch_tour')}
            </button>

            {/* CALENDAR BUTTON */}
            <button
              onClick={() => setShowCalendar(true)}
              className="px-6 py-4 rounded-none border border-white/10 hover:border-cyan-400/50 text-slate-400 hover:text-cyan-300 transition tracking-wider flex items-center gap-2 group"
            >
              <Calendar size={18} className="group-hover:text-cyan-400 transition-colors" />
              <span>{t('calendar', 'Calendar')}</span>
            </button>

            <button className="px-6 py-4 rounded-none border border-white/10 hover:border-white/30 text-slate-400 hover:text-white transition tracking-wider">
              {t('learn_more')}
            </button>
            {/* THE GLARING BUTTON */}
            <button
              onClick={() => setView('verified_test')}
              className="group relative px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold tracking-[0.2em] transform hover:scale-105 transition-all duration-100 animate-pulse border-2 border-white shadow-[0_0_50px_rgba(0,255,255,0.6)] hover:shadow-[0_0_80px_rgba(0,255,255,1)] flex items-center gap-3 overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/50 mix-blend-overlay opacity-0 group-hover:opacity-100 transition"></div>
              <ShieldCheck size={24} className="animate-bounce" />
              <span>{t('verified_pavilion.test_btn')}</span>
              <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
            </button>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {/* DASHBOARD BUTTON FOR SELLERS */}
                {user.user_metadata?.role === 'seller' && (
                  <button
                    onClick={() => setView('dashboard')}
                    className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-purple-600/20 border border-purple-500/40 hover:bg-purple-600/30 text-purple-200 transition"
                  >
                    <LayoutDashboard size={18} />
                    <span className="text-sm font-semibold">Dashboard</span>
                  </button>
                )}
                <div className="text-right">
                  <div className="text-xs text-slate-400">{t('auth.welcome')}</div>
                  <div className="text-sm font-medium text-blue-300 truncate max-w-[150px]">{user.email}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition text-slate-300"
                  title={t('auth.logout')}
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthOpen(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition text-white"
              >
                <LogIn size={18} />
                <span>{t('auth.login')}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 mt-2">
            <div className="h-12 w-12 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center shadow-[0_0_25px_rgba(59,130,246,0.35)]">
              <span className="text-blue-200 text-sm font-semibold">3D</span>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <span className="text-slate-200 text-sm font-semibold">{t('live')}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pb-16">
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard title={t('features.floating.title')} body={t('features.floating.body')} />
          <FeatureCard title={t('features.lighting.title')} body={t('features.lighting.body')} />
          <FeatureCard title={t('features.guided.title')} body={t('features.guided.body')} />
        </div>
        <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-glass backdrop-blur">
          <p className="text-sm text-slate-300">
            {t('cta')}
          </p>
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ title, body }) {
  return (
    <div className="relative border border-cyan-900/30 bg-black/40 p-6 backdrop-blur-sm hover:border-cyan-500/50 transition group overflow-hidden">
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500"></div>
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500"></div>
      <p className="text-xs uppercase tracking-[0.3em] text-cyan-400 mb-3 font-bold group-hover:text-shadow-glow transition-all">{title}</p>
      <p className="text-slate-400 text-sm leading-relaxed group-hover:text-cyan-100 transition-colors">{body}</p>
    </div>
  );
}

export default App;
