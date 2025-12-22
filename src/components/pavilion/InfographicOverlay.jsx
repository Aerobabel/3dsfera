import React, { useEffect, useState } from 'react';
import LiveChat from './LiveChat';

export default function InfographicOverlay({ data, onClose, realPavilionId, user, onEnterRoom, startMode = 'info' }) {
    const [mode, setMode] = useState(startMode); // 'info' or 'chat'

    useEffect(() => {
        // When a new infographic opens, honor the requested starting mode (chat-first for quick buyer outreach)
        setMode(startMode);
    }, [data, startMode]);

    if (!data) return null;

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 md:p-10 pointer-events-none">
            {/* Click backdrop to close */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto" onClick={onClose}></div>

            <div className="bg-black/80 border border-cyan-500/50 rounded-2xl w-full max-w-5xl h-[70vh] flex overflow-hidden shadow-[0_0_50px_rgba(0,255,255,0.2)] pointer-events-auto relative">

                {/* Close Button */}
                <button onClick={onClose} className="absolute top-4 right-4 z-50 text-gray-400 hover:text-white pointer-events-auto">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                {/* Left Sidebar - Navigation */}
                <div className="w-64 bg-white/5 border-r border-white/10 flex flex-col p-6 space-y-4">
                    <h2 className="text-2xl font-bold text-white mb-6 tracking-wider">DATA LINK</h2>

                    <button
                        onClick={() => setMode('info')}
                        className={`w-full text-left px-4 py-3 rounded-lg border transition ${mode === 'info' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'border-transparent hover:bg-white/5 text-gray-400'}`}
                    >
                        <span className="font-mono font-bold mr-2">01</span> OVERVIEW
                    </button>

                    <button
                        onClick={() => setMode('chat')}
                        className={`w-full text-left px-4 py-3 rounded-lg border transition ${mode === 'chat' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'border-transparent hover:bg-white/5 text-gray-400'}`}
                    >
                        <span className="font-mono font-bold mr-2">02</span> LIVE COMMS
                    </button>

                </div>

                {/* Right Content Area */}
                <div className="flex-1 p-8 overflow-y-auto bg-[url('/assets/images/grid_bg.png')] bg-cover">
                    {mode === 'info' && (
                        <div className="space-y-6 animate-fadeIn">
                            <div>
                                <h1 className="text-4xl font-bold text-white mb-2">{data.title || data.name || "UNKNOWN OBJECT"}</h1>
                                <div className="h-1 w-20 bg-cyan-500 mb-4"></div>
                                <p className="text-lg text-gray-300 leading-relaxed font-light">{data.description || "No description data available."}</p>
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

                            <div className="pt-4">
                                <button
                                    onClick={() => setMode('chat')}
                                    className="px-5 py-3 bg-cyan-500/20 border border-cyan-400/40 rounded-lg text-cyan-100 font-semibold hover:bg-cyan-500/30 transition"
                                >
                                    Jump to Chat
                                </button>
                            </div>
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
