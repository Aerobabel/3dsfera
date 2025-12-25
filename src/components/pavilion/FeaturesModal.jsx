import React from 'react';
import { useTranslation } from 'react-i18next';

export default function FeaturesModal({ features, onClose, title }) {
    const { t } = useTranslation();

    return (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-lg bg-[#1a1a1a] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
                    <div>
                        <h3 className="text-xl font-bold text-white tracking-widest uppercase font-[Orbitron]">
                            {t('pavilion_ui.features')}
                        </h3>
                        <p className="text-xs text-cyan-400 mt-1 uppercase tracking-wider">{title}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full border border-white/20 text-white/50 hover:text-white hover:border-white transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Content */}
                <ul className="space-y-4">
                    {features && features.length > 0 ? (
                        features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-3 group">
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_#06b6d4] group-hover:scale-150 transition-transform" />
                                <span className="text-gray-300 text-sm leading-relaxed font-light tracking-wide">
                                    {feature}
                                </span>
                            </li>
                        ))
                    ) : (
                        <li className="text-gray-500 text-sm italic">
                            {t('pavilion_ui.no_features_available', 'No detailed features listed.')}
                        </li>
                    )}
                </ul>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-widest border border-white/10 transition-colors"
                    >
                        {t('pavilion_ui.close')}
                    </button>
                </div>
            </div>
        </div>
    );
}
