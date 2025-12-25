import React from 'react';
import { useTranslation } from 'react-i18next';

export default function CalendarModal({ onClose }) {
    const { t, i18n } = useTranslation();
    const today = new Date();
    // Use the current i18n language, fallback to 'default' (browser locale)
    const currentMonth = today.toLocaleString(i18n.language, { month: 'long' });
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, today.getMonth() + 1, 0).getDate();
    // Simple mock calendar grid
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-sm bg-[#1a1a1a] border border-white/20 shadow-[0_0_50px_rgba(0,0,0,0.8)] p-6 font-sans">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-white tracking-wide capitalize">
                            {currentMonth} {currentYear}
                        </h3>
                        <p className="text-xs text-cyan-400 mt-1 uppercase tracking-wider">{t('calendar_ui.schedule')}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full border border-white/20 text-white/50 hover:text-white hover:border-white transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-2 text-center mb-6">
                    {/* Minimal day headers - could be localized too but for now basic letters are standard enough or we could use moment/date-fns */}
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                        <div key={i} className="text-xs text-gray-500 font-bold">{d}</div>
                    ))}
                    {/* Padding for first day - simplistic assumption for demo start on Monday */}
                    <div />
                    {days.map(d => (
                        <div key={d} className={`
                            w-8 h-8 flex items-center justify-center rounded-lg text-sm
                            ${d === today.getDate()
                                ? 'bg-cyan-500 text-black font-bold shadow-[0_0_10px_#22d3ee]'
                                : 'text-gray-300 hover:bg-white/10 cursor-pointer'}
                        `}>
                            {d}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="border-t border-white/10 pt-4 text-center">
                    <p className="text-xs text-gray-500 italic">{t('calendar_ui.no_events')}</p>
                </div>
            </div>
        </div>
    );
}
