import { motion, AnimatePresence } from 'framer-motion';
import { Orbit, MoveRight, Mouse, ZoomIn, MousePointerClick } from 'lucide-react';

const controls = [
  { title: 'Rotation', hint: 'Hold left mouse', icon: Orbit },
  { title: 'Pan', hint: 'Hold right mouse', icon: MoveRight },
  { title: 'Fly', hint: 'Double click floor', icon: MousePointerClick },
  { title: 'Zoom', hint: 'Mouse wheel', icon: ZoomIn },
];

export function TutorialModal({ open, onStart }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-[540px] max-w-full rounded-3xl bg-gradient-to-br from-cosmic-800/90 via-cosmic-900/90 to-cosmic-800/90 border border-white/10 shadow-glass px-8 py-10"
          >
            <div className="text-center space-y-2 mb-7">
              <p className="text-xs uppercase tracking-[0.4em] text-blue-300">Cosmo Tech Expo</p>
              <h2 className="text-3xl font-semibold text-white">Navigation Guide</h2>
              <p className="text-slate-300">Welcome to the interactive 3D exhibition hall.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {controls.map(({ title, hint, icon: Icon }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-5 flex items-center gap-3 hover:border-blue-400/40 transition-colors"
                >
                  <div className="h-11 w-11 rounded-xl bg-blue-500/15 text-blue-300 flex items-center justify-center">
                    <Icon size={22} strokeWidth={1.75} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm text-slate-200 font-semibold">{title}</p>
                    <p className="text-xs text-slate-400">{hint}</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={onStart}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-glow hover:shadow-glow transition-all"
            >
              Start Overview
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
