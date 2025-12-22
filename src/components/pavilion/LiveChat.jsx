import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabaseClient';

export default function LiveChat({ pavilionId, user }) {
    const { t } = useTranslation();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const bottomRef = useRef(null);

    useEffect(() => {
        if (!pavilionId) return;

        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('pavilion_id', pavilionId)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Failed to load chat history', error);
                return;
            }
            setMessages(data || []);
        };

        fetchMessages();

        const channel = supabase
            .channel(`public:chat:${pavilionId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages', filter: `pavilion_id=eq.${pavilionId}` },
                (payload) => {
                    setMessages((prev) => {
                        if (prev.find((m) => m.id === payload.new.id)) return prev;
                        return [...prev, payload.new];
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [pavilionId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        const content = newMessage.trim();
        if (!content || !pavilionId) return;
        if (!user) {
            alert(t('pavilion_ui.login_to_chat'));
            return;
        }

        const optimistic = {
            id: `temp-${Date.now()}`,
            pavilion_id: pavilionId,
            sender_id: user.id,
            content,
            created_at: new Date().toISOString()
        };

        setMessages((prev) => [...prev, optimistic]);
        setNewMessage('');

        const { error } = await supabase.from('messages').insert({
            pavilion_id: pavilionId,
            sender_id: user.id,
            content
        });

        if (error) {
            console.error('Failed to send message', error);
            // Roll back optimistic message if needed
            setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
            setNewMessage(content);
        }
    };

    return (
        <div className="flex flex-col h-full bg-black/50 rounded-lg overflow-hidden border border-white/10">
            <div className="bg-white/5 p-3 border-b border-white/10">
                <h3 className="text-sm font-bold text-cyan-400">{t('pavilion_ui.live_chat')}</h3>
                <p className="text-[11px] text-white/60">{t('verified_pavilion.ui.seller_chat_hint')}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                    <p className="text-center text-slate-500 text-sm">{t('pavilion_ui.start_conversation')}</p>
                )}

                {messages.map((m) => {
                    const isMe = m.sender_id === user?.id;
                    const senderLabel = isMe ? t('pavilion_ui.you') : `${t('pavilion_ui.user')} ${m.sender_id?.substr(0, 4) || '----'}`;

                    return (
                        <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            <span className="text-[11px] text-gray-500 mb-1">{senderLabel}</span>
                            <div
                                className={`px-3 py-2 rounded-lg max-w-[80%] text-sm ${isMe
                                    ? 'bg-cyan-500/20 text-cyan-100 border border-cyan-500/30'
                                    : 'bg-white/10 text-gray-200 border border-white/10'
                                    }`}
                            >
                                {m.content}
                                <div className="text-[10px] text-white/40 mt-1">
                                    {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            <div className="p-3 bg-white/5 border-t border-white/10 flex gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={user ? t('pavilion_ui.message_placeholder') : t('pavilion_ui.login_to_chat')}
                    disabled={!user}
                    className="flex-1 bg-black/50 border border-white/20 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 transition disabled:opacity-50"
                />
                <button
                    onClick={handleSend}
                    disabled={!user}
                    className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/50 rounded text-sm font-bold transition disabled:opacity-40"
                >
                    SEND
                </button>
            </div>
        </div>
    );
}
