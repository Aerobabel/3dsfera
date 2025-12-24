import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LiveChat from './LiveChat';

export default function InfographicOverlay({ data, onClose, realPavilionId, user, onEnterRoom, startMode = 'info' }) {
    const { t } = useTranslation();
    const [mode, setMode] = useState(startMode); // 'info' or 'chat'

    useEffect(() => {
        setMode('info');
    }, [data]);

    if (!data) return null;

    const isPavilion = data.products && Array.isArray(data.products);

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 md:p-10 pointer-events-none">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto" onClick={onClose}></div>

            <div className="bg-black/80 border border-cyan-500/50 rounded-2xl w-full max-w-5xl h-[70vh] flex overflow-hidden shadow-[0_0_50px_rgba(0,255,255,0.2)] pointer-events-auto relative">
                <button onClick={onClose} className="absolute top-4 right-4 z-50 text-gray-400 hover:text-white pointer-events-auto">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                <div className="w-64 bg-white/5 border-r border-white/10 flex flex-col p-6 space-y-4">
                    <h2 className="text-2xl font-bold text-white mb-6 tracking-wider">{t('pavilion_ui.pavilion_label', 'PAVILION')}</h2>

                    <button
                        onClick={() => setMode('info')}
                        className={`w-full text-left px-4 py-3 rounded-lg border transition ${mode === 'info' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'border-transparent hover:bg-white/5 text-gray-400'}`}
                    >
                        <span className="font-mono font-bold mr-2">01</span> {t('pavilion_ui.company_info', 'COMPANY INFO')}
                    </button>

                    {isPavilion && (
                        <button
                            onClick={() => {
                                onEnterRoom();
                                onClose();
                            }}
                            className="w-full text-left px-4 py-3 rounded-lg border border-cyan-400/40 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition"
                        >
                            <span className="font-mono font-bold mr-2">&gt;&gt;</span> {t('pavilion_ui.enter_pavilion', 'ENTER PAVILION')}
                        </button>
                    )}
                </div>

                <div className="flex-1 p-8 overflow-y-auto bg-[url('/assets/images/grid_bg.png')] bg-cover">
                    {mode === 'info' && (
                        <div className="space-y-6 animate-fadeIn">
                            <div>
                                <h1 className="text-4xl font-bold text-white mb-2">{data.name || data.title || t('pavilion_ui.company', 'COMPANY')}</h1>
                                <div className="h-1 w-20 bg-cyan-500 mb-4"></div>
                                <p className="text-lg text-gray-300 leading-relaxed font-light">
                                    {t(`pavilion_content.pavilions.${data?.slug || data?.id}.description`, { defaultValue: data.description || t('pavilion_ui.no_description', 'No description available.') })}
                                </p>
                            </div>

                            {data.stats && (
                                <div className="grid grid-cols-2 gap-4 mt-8">
                                    {Object.entries(data.stats).map(([key, val]) => (
                                        <div key={key} className="bg-white/5 border border-white/10 p-4 rounded-lg">
                                            <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">{key}</div>
                                            <div className="text-xl font-mono text-cyan-400">{val}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {isPavilion && data.products && (
                                <div className="mt-8 space-y-3">
                                    <h3 className="text-sm uppercase tracking-widest text-cyan-300 mb-3">{t('pavilion_ui.products_in_showroom', 'Products in Showroom')}</h3>
                                    <div className="grid grid-cols-1 gap-2">
                                        {data.products.map((product, idx) => {
                                            const translatedTitle = t(`pavilion_content.products.${product.id}.title`, { defaultValue: product.title });
                                            return (
                                                <div key={idx} className="bg-white/5 border border-white/10 px-4 py-2 rounded text-sm text-gray-300">
                                                    • {translatedTitle}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {isPavilion && (
                                <div className="pt-6">
                                    <button
                                        onClick={() => {
                                            onEnterRoom();
                                            onClose();
                                        }}
                                        className="px-6 py-3 bg-cyan-500/30 border border-cyan-400/60 rounded-lg text-cyan-100 font-semibold hover:bg-cyan-500/40 transition shadow-lg shadow-cyan-500/20"
                                    >
                                        {t('pavilion_ui.enter_pavilion', 'Enter Pavilion Showroom')}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {mode === 'chat' && (
                        <LiveChat pavilionId={realPavilionId} user={user} />
                    )}
                </div>
            </div>
        </div>
    );
}
