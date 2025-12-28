import React, { useState, useRef, useEffect } from 'react';
import { generateAIResponse, generateSpeech } from '../../services/aiService';

const ChatInterface = ({ visible, onClose, context }) => {
    const [messages, setMessages] = useState([
        { role: 'system', content: "Greetings! I'm SFERA-BOT. Ask me anything about this pavilion." }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const audioRef = useRef(new Audio());
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!visible) {
            audioRef.current.pause();
        }
    }, [visible]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userText = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userText }]);
        setIsLoading(true);

        // 1. Get Text Response
        const aiText = await generateAIResponse(userText, context);
        setMessages(prev => [...prev, { role: 'system', content: aiText }]);

        // 2. Get Voice (Optional - fire and forget or wait)
        generateSpeech(aiText).then(audioUrl => {
            if (audioUrl) {
                audioRef.current.src = audioUrl;
                audioRef.current.play().catch(e => console.error("Audio play error", e));
            }
        });

        setIsLoading(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSend();
    };

    if (!visible) return null;

    return (
        <div className="w-[350px] h-[450px] bg-slate-900/90 backdrop-blur-xl border border-cyan-500/50 rounded-lg flex flex-col shadow-[0_0_30px_rgba(6,182,212,0.3)] overflow-hidden font-['Exo_2'] transform transition-all origin-bottom-left">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-cyan-500/30 bg-black/20">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
                    <span className="text-cyan-400 font-bold tracking-wider">SFERA-BOT V1</span>
                </div>
                <button
                    onClick={onClose}
                    className="text-cyan-500/50 hover:text-cyan-400 font-bold"
                >
                    ×
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-cyan-900 scrollbar-track-transparent">
                {messages.map((msg, idx) => (
                    <div
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[85%] p-3 rounded-lg text-sm leading-relaxed ${msg.role === 'user'
                                    ? 'bg-cyan-900/40 text-cyan-50 border border-cyan-700/50 rounded-br-none'
                                    : 'bg-slate-800/80 text-slate-300 border border-slate-700 rounded-bl-none'
                                }`}
                        >
                            {msg.content}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-slate-800/50 p-3 rounded-lg text-xs text-cyan-500/70 animate-pulse">
                            Thinking...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-black/30 border-t border-cyan-500/30">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask me anything..."
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-full py-2 pl-4 pr-10 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors placeholder-slate-500"
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-cyan-500 hover:text-cyan-300 disabled:opacity-50 transition-colors"
                    >
                        ➤
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatInterface;
