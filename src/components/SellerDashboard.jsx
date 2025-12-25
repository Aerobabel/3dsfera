import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useTranslation } from 'react-i18next';
import { Plus, Trash, Upload, Edit, MessageSquare, X, Save, Wand2 } from 'lucide-react';
import AiModelGenerator from './AiModelGenerator';
import { resolveVerifiedDemoId } from '../lib/resolveVerifiedDemoId';

const extractBuyerId = (content = '') => {
    const match = content.match(/\[buyer:([^\]]+)\]/);
    return match ? match[1] : null;
};

const extractPavilionTag = (content = '') => {
    const match = content.match(/\[pv:([^\]]+)\]/);
    return match ? match[1] : null;
};

const stripBuyerTag = (content = '') => {
    return content
        .replace(/^\[buyer:[^\]]+\]\s*/i, '')
        .replace(/^\[[^\]]+\]\s*/i, '')
        .trim();
};

const stripPavilionTag = (content = '') => {
    return content.replace(/^\[pv:[^\]]+\]\s*/i, '').trim();
};

const parseThreadKey = (key = '') => {
    const [pavilionKey = '', buyerId = ''] = key.split('::');
    return { pavilionKey, buyerId };
};

export default function SellerDashboard({ user }) {
    const { t } = useTranslation();

    // Main State
    const [pavilions, setPavilions] = useState([]);
    const [loading, setLoading] = useState(false);

    // Creation Form State
    const [createTitle, setCreateTitle] = useState('');
    const [createBlurb, setCreateBlurb] = useState('');
    const [createColor, setCreateColor] = useState('#22d3ee');
    const [createProducts, setCreateProducts] = useState([]);

    // Staging Product State (for both create and edit)
    const [prodName, setProdName] = useState('');
    const [prodPrice, setProdPrice] = useState('');
    const [prodFile, setProdFile] = useState(null);

    // Management State
    const [editingPavilion, setEditingPavilion] = useState(null); // Pavilion object being edited
    const [viewingMessages, setViewingMessages] = useState(null); // Pavilion object to view messages for
    const [viewingThread, setViewingThread] = useState(null); // Sender ID of the active conversation
    const [pavilionMessages, setPavilionMessages] = useState([]);
    const deriveSlug = (title, fallback) => {
        if (!title) return fallback;
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        return slug || fallback;
    };

    useEffect(() => {
        fetchPavilions();

        const channel = supabase.channel('table-db-admin')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'pavilions' }, (payload) => {
                if (payload.eventType === 'DELETE' || (payload.new && payload.new.seller_id === user.id)) {
                    fetchPavilions();
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); }
    }, [user]);

    const fetchPavilions = async () => {
        // Broad fetch to debug visibility. 
        // We fetch the most recent 20 pavilions and filter in JS.
        const { data, error } = await supabase
            .from('pavilions')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) console.error("Error fetching pavilions:", error);

        console.log("RAW PAVILIONS FETCH:", data); // DEBUG: Check what we actually see

        const allPavilions = data || [];

        // Filter logic: Keep MY pavilions (non-demo)
        const realPavilions = allPavilions
            .filter(p => p.seller_id === user.id && p.title !== 'Verified Pavilion (Demo)')
            .map(p => ({ ...p, slug: p.slug || deriveSlug(p.title, p.id) }));

        // Resolve the shared Verified Pavilion id (create if missing)
        const demoId = await resolveVerifiedDemoId(supabase, user.id, { createIfMissing: true });

        // Mock "Verified Pavilion" for Demo Linkage
        const verifiedMock = {
            id: demoId, // Uses REAL ID if available
            title: t('seller_dashboard.verified_demo_title'),
            blurb: t('seller_dashboard.verified_demo_blurb'),
            color: '#00ffff',
            products: [],
            seller_id: user.id,
            is_demo: true, // Flag for UI keys
            slug: 'verified-demo'
        };

        setPavilions([verifiedMock, ...realPavilions]);
    };

    // Realtime Message Subscription for Dashboard
    useEffect(() => {
        if (!viewingMessages) return;

        const channel = supabase.channel(`dashboard-messages-${viewingMessages.id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
                if (payload.new.pavilion_id === viewingMessages.id) {
                    setPavilionMessages(prev => {
                        const incoming = payload.new;
                        const strippedIncoming = stripPavilionTag(stripBuyerTag(incoming.content));
                        const withoutTemp = prev.filter(m => {
                            const isTemp = (m.id || '').toString().startsWith('temp-');
                            const sameSender = m.sender_id === incoming.sender_id;
                            const sameContent = stripPavilionTag(stripBuyerTag(m.content)) === strippedIncoming;
                            return !(isTemp && sameSender && sameContent);
                        });
                        if (withoutTemp.find(m => m.id === incoming.id)) return withoutTemp;
                        return [...withoutTemp, incoming];
                    });
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [viewingMessages]);

    // --- ACTIONS ---

    const handleDeletePavilion = async (id) => {
        if (!confirm(t('seller_dashboard.delete_confirm'))) return;
        await supabase.from('pavilions').delete().eq('id', id);
        fetchPavilions();
    };

    const handleEditPavilion = (pavilion) => {
        setEditingPavilion({ ...pavilion }); // Clone to avoid direct mutation
    };

    const handleSaveEdit = async () => {
        if (!editingPavilion) return;
        setLoading(true);
        const { error } = await supabase.from('pavilions').update(editingPavilion).eq('id', editingPavilion.id);
        if (!error) {
            setEditingPavilion(null);
            fetchPavilions();
        }
        setLoading(false);
    };

    const handleViewMessages = async (pavilion) => {
        setViewingMessages(pavilion);
        const { data } = await supabase
            .from('messages')
            .select('*')
            .eq('pavilion_id', pavilion.id)
            .order('created_at', { ascending: true });
        if (data) {
            setPavilionMessages(data);
            // Auto-select the newest buyer thread if none chosen
            const threads = {};
            data.forEach(msg => {
                const buyerId = extractBuyerId(msg.content) || (msg.sender_id !== user.id ? msg.sender_id : null);
                if (!buyerId) return;
                const pavilionKey = extractPavilionTag(msg.content) || pavilion.slug || pavilion.id;
                const threadKey = `${pavilionKey}::${buyerId}`;
                if (!threads[threadKey]) threads[threadKey] = [];
                threads[threadKey].push(msg);
            });
            const threadKeys = Object.keys(threads);
            if (threadKeys.length > 0) setViewingThread(threadKeys[threadKeys.length - 1]); // pick the newest thread
        }
    };

    // --- PRODUCT MANAGEMENT ---

    const [uploading, setUploading] = useState(false);

    const stageProduct = async (listDispatcher, currentList) => {
        if (!prodName || !prodPrice || !prodFile) return;

        let publicUrl = null;
        setUploading(true);

        try {
            const fileName = `${Date.now()}_${prodFile.name.replace(/\s+/g, '_')}`;
            const { error: uploadError } = await supabase.storage
                .from('pavilions')
                .upload(fileName, prodFile);

            if (uploadError) {
                console.error('Upload error:', uploadError);
                throw uploadError;
            }

            const { data } = supabase.storage.from('pavilions').getPublicUrl(fileName);
            publicUrl = data.publicUrl;

        } catch (error) {
            alert(`${t('seller_dashboard.upload_failed')} ${error.message || ''}`.trim());
            setUploading(false);
            return;
        }

        const newProd = {
            id: 'prod_' + Math.random().toString(36).substr(2, 5),
            name: prodName || t('seller_dashboard.custom_product_label'),
            price: prodPrice || '',
            details: [t('seller_dashboard.custom_product_label')],
            modelUrl: publicUrl,
            fileName: prodFile.name
        };
        listDispatcher([...currentList, newProd]);
        setProdName('');
        setProdPrice('');
        setProdFile(null);
        setUploading(false);
    };

    const removeProduct = (id, listDispatcher, currentList) => {
        listDispatcher(currentList.filter(p => p.id !== id));
    };

    // --- DEPLOYMENT ---

    const [showAiGenerator, setShowAiGenerator] = useState(false);

    // --- DEPLOYMENT ---

    const handleDeploy = async (e) => {
        e.preventDefault();
        if (createProducts.length === 0) {
            alert(t('seller_dashboard.products_alert'));
            return;
        }
        setLoading(true);
        const newPav = {
            title: createTitle,
            blurb: createBlurb,
            color: createColor,
            seller_id: user.id,
            products: createProducts
        };
        const { error } = await supabase.from('pavilions').insert(newPav);

        if (error) {
            console.error('Deploy Error:', error);
            alert(`${t('seller_dashboard.deploy_failed')}: ${error.message}`);
        } else {
            setCreateTitle('');
            setCreateBlurb('');
            setCreateProducts([]);
            fetchPavilions();
            alert(t('seller_dashboard.deploy_success'));
        }
        setLoading(false);
    };

    const handleAiSuccess = (glbUrl) => {
        // Automatically stage the generated product
        // We might need a random name if none provided, or ask user? 
        // For now, let's use a default name + date
        const newProd = {
            id: 'prod_' + Math.random().toString(36).substr(2, 5),
            name: prodName || t('seller_dashboard.ai_generated_name'),
            price: prodPrice || '$0',
            details: [t('seller_dashboard.ai_generated_via')],
            modelUrl: glbUrl,
            fileName: 'ai_model.glb'
        };

        // Decide where to add it (Create List vs Edit List)
        // This is tricky because we don't know which button opened the modal if we don't track it.
        // Let's assume for now we are adding to the 'create' list if not editing, else edit list.
        if (editingPavilion) {
            setEditingPavilion(prev => ({ ...prev, products: [...prev.products, newProd] }));
        } else {
            setCreateProducts(prev => [...prev, newProd]);
        }

        setShowAiGenerator(false);
        setProdName('');
        setProdPrice('');
    };

    const totalPavilions = pavilions.length;
    const totalProducts = pavilions.reduce((sum, pav) => sum + (pav.products?.length || 0), 0);

    return (
        <div className="relative max-w-7xl mx-auto px-6 pb-16 text-white min-h-screen pt-32">
            {/* Background Layers - Matches Homepage Vibe */}
            <div className="fixed inset-0 cyber-grid opacity-30 pointer-events-none" aria-hidden />
            <div className="fixed inset-0 bg-gradient-to-b from-transparent via-[#050b14] to-[#02040a] pointer-events-none" aria-hidden />
            {/* Vivid Orbs */}
            <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
            <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />

            {/* MESSAGES MODAL */}
            {viewingMessages && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200">
                    <div className="bg-[#0f1623]/80 border border-white/10 rounded-3xl w-full max-w-4xl overflow-hidden flex h-[650px] shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-xl">

                        {/* LEFT: THREADS LIST */}
                        <div className="w-[300px] border-r border-white/5 flex flex-col bg-black/40">
                            <div className="p-5 border-b border-white/5 bg-white/5 backdrop-blur-sm">
                                <h3 className="font-bold text-white tracking-widest text-xs uppercase drop-shadow-md">{t('seller_dashboard.inbox')}</h3>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                {(() => {
                                    // Group threads by pavilion + buyer
                                    const threads = {};
                                    pavilionMessages.forEach(msg => {
                                        const buyerId = extractBuyerId(msg.content) || (msg.sender_id !== user.id ? msg.sender_id : null);
                                        if (!buyerId) return;
                                        const pavilionKey = extractPavilionTag(msg.content) || viewingMessages?.slug || viewingMessages?.id;
                                        const threadKey = `${pavilionKey}::${buyerId}`;
                                        if (!threads[threadKey]) threads[threadKey] = [];
                                        threads[threadKey].push(msg);
                                    });

                                    const threadKeys = Object.keys(threads);

                                    if (threadKeys.length === 0) return <div className="p-8 text-xs text-slate-500 text-center font-medium">{t('seller_dashboard.conversation_empty')}</div>;

                                    return threadKeys.map(threadId => {
                                        const thread = threads[threadId];
                                        const { pavilionKey, buyerId } = parseThreadKey(threadId);
                                        const lastMsg = thread[thread.length - 1]; // Naive last message
                                        const pavilionLabel = pavilionKey ? pavilionKey.toUpperCase() : (viewingMessages?.title || t('seller_dashboard.inbox'));
                                        const isActive = viewingThread === threadId;
                                        return (
                                            <button
                                                key={threadId}
                                                onClick={() => setViewingThread(threadId)}
                                                className={`w-full p-4 border-b border-white/5 text-left transition-all duration-300 flex items-start gap-3 group ${isActive ? 'bg-cyan-500/10 border-l-2 border-l-cyan-400' : 'hover:bg-white/5 border-l-2 border-l-transparent'}`}
                                            >
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white text-center leading-3 shadow-lg ${isActive ? 'bg-gradient-to-br from-cyan-400 to-blue-500 scale-110' : 'bg-white/10 group-hover:bg-white/20'}`}>
                                                    {pavilionLabel.slice(0, 2)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-baseline mb-1">
                                                        <span className={`text-xs font-bold truncate transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>{pavilionLabel}</span>
                                                        <span className="text-[10px] text-slate-600">{new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    <p className={`text-[11px] truncate ${isActive ? 'text-cyan-200/80' : 'text-slate-500 group-hover:text-slate-400'}`}>{stripBuyerTag(lastMsg.content)}</p>
                                                </div>
                                            </button>
                                        );
                                    });
                                })()}
                            </div>
                        </div>

                        {/* RIGHT: CHAT AREA */}
                        <div className="flex-1 flex flex-col bg-black/20 relative">
                            {/* Header */}
                            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/5 backdrop-blur-sm z-10">
                                <div>
                                    <h3 className="font-bold text-sm text-white tracking-wide">{viewingMessages.title}</h3>
                                    {viewingThread ? (
                                        (() => {
                                            const { buyerId } = parseThreadKey(viewingThread);
                                            return <span className="text-xs text-cyan-400 font-medium flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" /> Reply to {buyerId.substr(0, 6)}...</span>;
                                        })()
                                    ) : (
                                        <span className="text-xs text-slate-500">{t('seller_dashboard.select_conversation')}</span>
                                    )}
                                </div>
                                <button onClick={() => { setViewingMessages(null); setViewingThread(null); }} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all"><X size={18} /></button>
                            </div>

                            {/* Messages Feed */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[url('/assets/grid_pattern.png')] bg-repeat opacity-80">
                                <div className="absolute inset-0 pointer-events-none opacity-5 bg-gradient-to-b from-cyan-500/10 to-transparent"></div>
                                {!viewingThread ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-6">
                                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                                            <MessageSquare size={32} className="opacity-40" />
                                        </div>
                                        <p className="font-light tracking-wide text-sm">{t('seller_dashboard.select_conversation')}</p>
                                    </div>
                                ) : (
                                    pavilionMessages
                                        .filter(m => {
                                            const { pavilionKey, buyerId: selectedBuyer } = parseThreadKey(viewingThread);
                                            const messageBuyer = extractBuyerId(m.content) || (m.sender_id !== user.id ? m.sender_id : null);
                                            const messagePavilion = extractPavilionTag(m.content) || viewingMessages?.slug || viewingMessages?.id;
                                            const isBuyerMessage = messageBuyer === selectedBuyer && messagePavilion === pavilionKey;
                                            const isSellerMessageForThread = m.sender_id === user.id && messageBuyer === selectedBuyer && messagePavilion === pavilionKey;
                                            return isBuyerMessage || isSellerMessageForThread;
                                        })
                                        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                                        .map((msg, i) => (
                                            <div key={i} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`relative max-w-[75%] p-4 rounded-2xl shadow-lg ${msg.sender_id === user.id ? 'bg-gradient-to-br from-cyan-600 to-blue-700 text-white rounded-tr-sm border border-cyan-400/30' : 'bg-white/10 text-slate-200 rounded-tl-sm border border-white/10 backdrop-blur-md'}`}>
                                                    <p className="text-sm leading-relaxed font-medium">{stripBuyerTag(msg.content)}</p>
                                                    <span className={`text-[10px] mt-2 block text-right font-bold tracking-wider ${msg.sender_id === user.id ? 'text-cyan-200' : 'text-slate-500'}`}>
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                )}
                            </div>

                            {/* Reply Input */}
                            {viewingThread && (
                                <form
                                    onSubmit={async (e) => {
                                        e.preventDefault();
                                        const input = e.target.elements.replyInput;
                                        const content = input.value.trim();
                                        if (!content) return;
                                        const { pavilionKey, buyerId } = parseThreadKey(viewingThread);
                                        const pvTag = pavilionKey ? `[pv:${pavilionKey}] ` : '';
                                        const taggedContent = `[buyer:${buyerId}] ${pvTag}${content}`;

                                        // Optimistic
                                        const fakeMsg = { id: `temp-${Date.now()}`, content: taggedContent, sender_id: user.id, created_at: new Date().toISOString(), pavilion_id: viewingMessages.id };
                                        setPavilionMessages(prev => [...prev, fakeMsg]);
                                        input.value = '';

                                        // Send
                                        await supabase.from('messages').insert({
                                            pavilion_id: viewingMessages.id,
                                            sender_id: user.id,
                                            content: taggedContent
                                        });
                                    }}
                                    className="p-5 border-t border-white/10 bg-black/40 backdrop-blur-xl flex gap-3 z-10"
                                >
                                    <input
                                        name="replyInput"
                                        type="text"
                                        placeholder={t('seller_dashboard.reply_placeholder')}
                                        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-5 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all font-medium placeholder-slate-500"
                                        autoComplete="off"
                                    />
                                    <button type="submit" className="p-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl text-white transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)]">
                                        <MessageSquare size={20} />
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}


            {/* AI GENERATOR MODAL */}
            {
                showAiGenerator && (
                    <AiModelGenerator
                        onClose={() => setShowAiGenerator(false)}
                        onModelGenerated={handleAiSuccess}
                    />
                )
            }

            {/* EDIT MODAL */}
            {
                editingPavilion && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 text-left">
                        <div className="bg-[#0f1623]/90 border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-[0_0_80px_rgba(0,0,0,0.6)] backdrop-blur-xl">
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 sticky top-0 backdrop-blur-xl z-10">
                                <h2 className="text-xl font-bold tracking-widest uppercase text-white drop-shadow-md">{t('seller_dashboard.edit_pavilion')}</h2>
                                <button onClick={() => setEditingPavilion(null)} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-all"><X size={20} /></button>
                            </div>

                            <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold uppercase tracking-widest text-cyan-400 ml-1">{t('seller_dashboard.pavilion_title')}</label>
                                        <input
                                            value={editingPavilion.title}
                                            onChange={e => setEditingPavilion({ ...editingPavilion, title: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all text-white placeholder-slate-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-xs font-bold uppercase tracking-widest text-cyan-400 ml-1">{t('seller_dashboard.blurb')}</label>
                                        <input
                                            value={editingPavilion.blurb}
                                            onChange={e => setEditingPavilion({ ...editingPavilion, blurb: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-cyan-500/50 focus:bg-white/10 transition-all text-white placeholder-slate-500"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-xs font-bold uppercase tracking-widest text-cyan-400 ml-1">{t('seller_dashboard.theme_color')}</label>
                                    <div className="flex gap-4 p-4 bg-black/20 rounded-xl border border-white/5">
                                        {['#22d3ee', '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#a855f7'].map(c => (
                                            <button
                                                key={c}
                                                onClick={() => setEditingPavilion({ ...editingPavilion, color: c })}
                                                className={`w-10 h-10 rounded-full border-2 transition-all duration-300 ${editingPavilion.color === c ? 'border-white scale-110 shadow-[0_0_15px_' + c + ']' : 'border-transparent hover:scale-110 opacity-70 hover:opacity-100'}`}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="border-t border-white/10 pt-6">
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-white mb-6">{t('seller_dashboard.manage_products')}</h3>

                                    {/* Product List Editor */}
                                    <div className="space-y-3 mb-8">
                                        {editingPavilion.products.map(p => (
                                            <div key={p.id} className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center font-bold text-white/50 border border-white/5">3D</div>
                                                    <div>
                                                        <p className="font-bold text-sm text-white group-hover:text-cyan-300 transition-colors">{p.name}</p>
                                                        <p className="text-xs text-slate-400 font-mono mt-0.5">{p.price}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => removeProduct(p.id, (prod) => setEditingPavilion({ ...editingPavilion, products: prod }), editingPavilion.products)}
                                                    className="text-slate-500 hover:text-red-400 p-2 hover:bg-red-500/10 rounded-lg transition-all"
                                                >
                                                    <Trash size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Add Product Inline */}
                                    <div className="bg-gradient-to-br from-white/5 to-transparent p-6 rounded-2xl border border-white/10">
                                        <p className="text-xs text-cyan-400 font-bold uppercase tracking-widest mb-4 flex items-center gap-2"><Plus size={14} /> {t('seller_dashboard.add_functionality')}</p>
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <input
                                                placeholder={t('seller_dashboard.product_name_placeholder')}
                                                value={prodName}
                                                onChange={e => setProdName(e.target.value)}
                                                className="bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-cyan-500/50 transition-colors"
                                            />
                                            <input
                                                placeholder={t('seller_dashboard.product_price_placeholder')}
                                                value={prodPrice}
                                                onChange={e => setProdPrice(e.target.value)}
                                                className="bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-cyan-500/50 transition-colors"
                                            />
                                        </div>
                                        <div className="flex gap-3">
                                            <label className="flex-1 cursor-pointer bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 flex items-center justify-center text-xs font-bold tracking-wide text-slate-300 gap-2 hover:bg-white/10 hover:border-white/20 transition-all group">
                                                <Upload size={14} className="group-hover:text-cyan-400 transition-colors" /> {prodFile ? <span className="text-cyan-400">{prodFile.name}</span> : t('seller_dashboard.select_glb')}
                                                <input type="file" accept=".glb,.gltf" className="hidden" onChange={e => setProdFile(e.target.files[0])} />
                                            </label>
                                            <button
                                                onClick={() => setShowAiGenerator(true)}
                                                className="px-4 bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600/30 rounded-xl text-purple-200 hover:text-purple-100 transition-colors hover:shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                                                title={t('seller_dashboard.ai_generate')}
                                            >
                                                <Wand2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => stageProduct((prod) => setEditingPavilion({ ...editingPavilion, products: prod }), editingPavilion.products)}
                                                disabled={uploading}
                                                className="bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl px-6 py-2.5 text-xs font-bold tracking-wider uppercase shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {uploading ? <span className="animate-pulse">UPLOADING...</span> : t('seller_dashboard.add_btn')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-3 sticky bottom-0 backdrop-blur-xl">
                                <button onClick={() => setEditingPavilion(null)} className="px-4 py-2 rounded-lg border border-white/10 hover:bg-white/10 text-sm">{t('seller_dashboard.cancel')}</button>
                                <button onClick={handleSaveEdit} className="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-bold flex items-center gap-2">
                                    <Save size={16} /> {t('seller_dashboard.save_changes')}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            <div className="relative z-10">
                {/* Hero Dashboard Card */}
                <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.5)] p-10 mb-12 group">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-purple-500/10 opacity-50 group-hover:opacity-70 transition-opacity duration-700" aria-hidden />
                    <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

                    <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-8">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] animate-pulse"></div>
                                <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300 drop-shadow-glow">Live Dashboard</p>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4 drop-shadow-xl">{t('seller_dashboard.subtitle')}</h1>
                            <p className="text-lg text-slate-300 font-light tracking-wide max-w-xl">{t('cta')}</p>
                        </div>
                        <div className="flex gap-4 flex-wrap">
                            <div className="rounded-2xl border border-white/10 bg-black/40 px-6 py-5 shadow-lg min-w-[140px] backdrop-blur-md hover:border-cyan-500/30 transition-colors group/card">
                                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 mb-2 group-hover/card:text-cyan-400 transition-colors">{t('seller_dashboard.deploy_new')}</p>
                                <p className="text-3xl font-black text-white drop-shadow-md">{totalPavilions}</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-black/40 px-6 py-5 shadow-lg min-w-[140px] backdrop-blur-md hover:border-purple-500/30 transition-colors group/card">
                                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 mb-2 group-hover/card:text-purple-400 transition-colors">{t('seller_dashboard.products_catalog')}</p>
                                <p className="text-3xl font-black text-white drop-shadow-md">{totalProducts}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-[380px_1fr] gap-10">

                    {/* LEFT COLUMN: CREATE */}
                    <div className="bg-[#0f1623]/60 border border-white/10 p-8 rounded-[2rem] h-fit sticky top-32 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-xl">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]"></div>
                            <h2 className="text-sm font-bold tracking-[0.2em] text-white uppercase drop-shadow-md">{t('seller_dashboard.deploy_new')}</h2>
                        </div>

                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Title & Concept</label>
                                <input
                                    placeholder={t('seller_dashboard.pavilion_title_placeholder')}
                                    value={createTitle}
                                    onChange={e => setCreateTitle(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500/50 focus:bg-white/5 transition-all"
                                />
                                <textarea
                                    placeholder={t('seller_dashboard.blurb_placeholder')}
                                    value={createBlurb}
                                    onChange={e => setCreateBlurb(e.target.value)}
                                    rows={3}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-cyan-500/50 focus:bg-white/5 transition-all resize-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 ml-1">Theme Aesthetic</label>
                                <div className="flex gap-3 p-3 bg-black/20 rounded-xl border border-white/5 justify-between">
                                    {['#22d3ee', '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#a855f7'].map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setCreateColor(c)}
                                            className={`w-6 h-6 rounded-full border-2 transition-all duration-300 ${createColor === c ? 'border-white scale-125 shadow-[0_0_15px_' + c + ']' : 'border-transparent hover:scale-125 opacity-70 hover:opacity-100'}`}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="border-t border-white/10 pt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest">{t('seller_dashboard.initial_products')}</p>
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-white font-mono">{createProducts.length}</span>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <input
                                        placeholder={t('seller_dashboard.product_name_placeholder')}
                                        value={prodName}
                                        onChange={e => setProdName(e.target.value)}
                                        className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500/50 transition-colors"
                                    />
                                    <input
                                        placeholder={t('seller_dashboard.product_price_placeholder')}
                                        value={prodPrice}
                                        onChange={e => setProdPrice(e.target.value)}
                                        className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-cyan-500/50 transition-colors"
                                    />
                                </div>

                                <label className="cursor-pointer bg-white/5 border border-white/10 rounded-xl px-3 py-3 flex items-center justify-center text-xs font-bold text-slate-400 gap-2 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all mb-3 group">
                                    <Upload size={14} className="group-hover:text-cyan-400 transition-colors" />
                                    {prodFile ? <span className="text-cyan-400 truncate max-w-[150px]">{prodFile.name}</span> : t('seller_dashboard.upload_glb')}
                                    <input type="file" accept=".glb,.gltf" className="hidden" onChange={e => setProdFile(e.target.files[0])} />
                                </label>

                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <button
                                        onClick={() => setShowAiGenerator(true)}
                                        className="flex items-center justify-center gap-2 py-2.5 bg-purple-600/10 border border-purple-500/20 hover:bg-purple-600/20 rounded-xl text-purple-300 text-xs font-bold transition-all hover:shadow-[0_0_15px_rgba(168,85,247,0.15)]"
                                    >
                                        <Wand2 size={12} /> {t('seller_dashboard.ai_generate')}
                                    </button>

                                    <button
                                        onClick={() => stageProduct(setCreateProducts, createProducts)}
                                        disabled={uploading}
                                        className="flex items-center justify-center py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white text-xs font-bold transition-all disabled:opacity-50"
                                    >
                                        {uploading ? '...' : '+ ' + t('seller_dashboard.add_btn')}
                                    </button>
                                </div>

                                {createProducts.length > 0 && (
                                    <div className="space-y-2 mb-6 max-h-[150px] overflow-y-auto custom-scrollbar pr-1">
                                        {createProducts.map(p => (
                                            <div key={p.id} className="flex justify-between items-center text-xs bg-black/40 p-3 rounded-lg border border-white/5 hover:border-white/10 transition-colors group">
                                                <span className="text-slate-200 font-medium">{p.name}</span>
                                                <button onClick={() => removeProduct(p.id, setCreateProducts, createProducts)} className="text-slate-500 hover:text-red-400 transition-colors"><Trash size={12} /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <button
                                    onClick={handleDeploy}
                                    disabled={loading || createProducts.length === 0}
                                    className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-xl text-sm font-bold tracking-widest uppercase text-white shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_0_40px_rgba(6,182,212,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {t('seller_dashboard.deploying_btn')}
                                        </>
                                    ) : (
                                        <>
                                            {t('seller_dashboard.deploy_btn')} <span className="group-hover:translate-x-1 transition-transform">→</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: LIST */}
                    <div className="space-y-6">
                        {pavilions.length === 0 && (
                            <div className="h-64 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-[2rem] text-slate-500 bg-white/5 backdrop-blur">
                                <p className="font-light tracking-wide">{t('seller_dashboard.no_pavilions')}</p>
                            </div>
                        )}
                        {pavilions.map(p => (
                            <div key={p.is_demo ? 'demo_' + p.id : p.id} className="bg-[#0f1623]/80 border border-white/10 rounded-[2rem] p-8 relative group hover:border-cyan-400/30 transition-all duration-300 shadow-[0_20px_50px_rgba(0,0,0,0.4)] backdrop-blur-xl hover:-translate-y-1">
                                <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-6">
                                        <div
                                            className="w-16 h-16 rounded-2xl shadow-lg border border-white/10 flex-shrink-0 relative overflow-hidden group-hover:scale-105 transition-transform duration-500"
                                            style={{ backgroundColor: p.color }}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold tracking-wide text-white group-hover:text-cyan-400 transition-colors drop-shadow-sm">{p.title}</h3>
                                            <p className="text-slate-400 text-sm mt-1 font-light leading-relaxed max-w-md">{p.blurb}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleViewMessages(p)}
                                            className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white transition-all hover:scale-105 hover:shadow-lg"
                                            title={t('seller_dashboard.view_messages_title')}
                                        >
                                            <MessageSquare size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleEditPavilion(p)}
                                            className="p-3 rounded-xl bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600/20 text-blue-300 transition-all hover:scale-105 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                                            title={t('seller_dashboard.edit_pavilion_title')}
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDeletePavilion(p.id)}
                                            className="p-3 rounded-xl bg-red-600/10 border border-red-500/20 hover:bg-red-600/20 text-red-300 transition-all hover:scale-105 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                                            title={t('seller_dashboard.delete_pavilion_title')}
                                        >
                                            <Trash size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-black/30 rounded-2xl p-5 border border-white/5">
                                    <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-4 font-bold flex items-center gap-2">
                                        <span className="w-1 h-1 rounded-full bg-slate-500" /> {t('seller_dashboard.products_catalog')}
                                    </p>
                                    {p.products.length === 0 ? (
                                        <p className="text-sm text-slate-600 italic pl-2">No products added yet.</p>
                                    ) : (
                                        <div className="grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                                            {p.products.map(prod => (
                                                <div key={prod.id} className="flex items-center justify-between p-3.5 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors group/prod">
                                                    <div>
                                                        <p className="font-bold text-sm text-slate-200 group-hover/prod:text-white transition-colors">{prod.name}</p>
                                                        <p className="text-[10px] text-cyan-400 font-mono mt-1">{prod.price}</p>
                                                    </div>
                                                    <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover/prod:opacity-100 transition-opacity">
                                                        <span className="text-[10px] text-white">→</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
