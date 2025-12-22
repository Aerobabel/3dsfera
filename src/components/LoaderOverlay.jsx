import { Html, useProgress } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';

export function LoaderOverlay() {
  const { progress, active } = useProgress();
  const clamped = Math.min(100, Math.round(progress));

  return (
    <AnimatePresence>
      {active && (
        <Html fullscreen zIndexRange={[50, 50]}>
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="px-10 py-8 rounded-3xl bg-gradient-to-br from-cosmic-800/80 via-cosmic-900/80 to-cosmic-800/80 border border-white/10 shadow-glass"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center shadow-glow">
                  <div className="h-3 w-3 rounded-full bg-blue-400 animate-ping" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Initializing</p>
                  <p className="text-lg font-semibold text-white">3Dsfera Expo Hall</p>
                </div>
              </div>
              <div className="h-2 w-72 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 shadow-glow"
                  style={{ width: `${clamped}%` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${clamped}%` }}
                  transition={{ ease: 'easeOut', duration: 0.3 }}
                />
              </div>
              <p className="mt-3 text-sm text-slate-300">Calibrating experience… {clamped}%</p>
            </motion.div>
          </div>
        </Html>
      )}
    </AnimatePresence>
  );
}
