import React from 'react';

const ROOM_COPY = {
  techno: {
    title: 'Techno Demo',
    blurb: 'Neon-lit control decks and prototype rigs. Detailed scene coming soon.',
  },
  lux: {
    title: 'Luxury Goods',
    blurb: 'Glass podiums for premium accessories and wearables. Detailed scene coming soon.',
  },
  mobility: {
    title: 'Mobility Hub',
    blurb: 'EV drivetrains, aero drones, and transit systems. Detailed scene coming soon.',
  },
  sustain: {
    title: 'Sustain Lab',
    blurb: 'Clean tech, recycled composites, and bio materials. Detailed scene coming soon.',
  },
};

export default function PlaceholderScene({ roomId, onBack }) {
  const copy = ROOM_COPY[roomId] || { title: 'Coming Soon', blurb: 'This pavilion is being prepared.' };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050915] via-[#060a14] to-[#03040a] text-white flex items-center justify-center relative overflow-hidden px-6">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -left-10 -top-10 w-64 h-64 bg-cyan-500/10 blur-3xl rounded-full" />
        <div className="absolute -right-24 bottom-0 w-80 h-80 bg-indigo-500/10 blur-3xl rounded-full" />
      </div>
      <div className="relative z-10 max-w-xl w-full rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-[0_25px_80px_rgba(0,0,0,0.35)]">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-300 mb-3">Pavilion Preview</p>
        <h2 className="text-3xl font-semibold mb-3">{copy.title}</h2>
        <p className="text-slate-200 text-sm leading-relaxed mb-6">{copy.blurb}</p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onBack}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/40 hover:shadow-blue-400/60 transition text-sm"
          >
            Back to Hub
          </button>
          <button className="px-5 py-3 rounded-2xl border border-white/15 hover:border-white/30 bg-white/5 backdrop-blur text-sm">
            Notify Me
          </button>
        </div>
      </div>
    </div>
  );
}
