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

const stripBuyerTag = (content = '') => {
    return content
        .replace(/^\[buyer:[^\]]+\]\s*/i, '')
        .replace(/^\[[^\]]+\]\s*/i, '')
        .trim();
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
        const realPavilions = allPavilions.filter(p =>
            p.seller_id === user.id && p.title !== 'Verified Pavilion (Demo)'
        );

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
            is_demo: true // Flag for UI keys
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
                        // Dedup
                        if (prev.find(m => m.id === payload.new.id)) return prev;
                        return [...prev, payload.new];
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
                if (!threads[buyerId]) threads[buyerId] = [];
                threads[buyerId].push(msg);
            });
            const threadIds = Object.keys(threads);
            if (threadIds.length > 0) setViewingThread(threadIds[threadIds.length - 1]); // pick the newest thread
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
        <div className="relative max-w-7xl mx-auto px-6 pb-16 text-white min-h-screen pt-24">
            <div className="absolute inset-0 cyber-grid opacity-20 pointer-events-none" aria-hidden />
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/25 via-[#0b1223] to-purple-900/25 pointer-events-none" aria-hidden />
            <div className="absolute inset-0 scanlines opacity-10 pointer-events-none" aria-hidden />

            {/* MESSAGES MODAL */}
            {viewingMessages && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#0f1623] border border-white/10 rounded-2xl w-full max-w-4xl overflow-hidden flex h-[600px] shadow-2xl">

                        {/* LEFT: THREADS LIST */}
                        <div className="w-1/3 border-r border-white/10 flex flex-col bg-black/20">
                            <div className="p-4 border-b border-white/10 bg-white/5">
                                <h3 className="font-bold text-cyan-400 tracking-wider text-xs uppercase">{t('seller_dashboard.inbox')}</h3>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {(() => {
                                    // Group threads by buyer id encoded in content; fallback to sender id for legacy messages
                                    const threads = {};
                                    pavilionMessages.forEach(msg => {
                                        const buyerId = extractBuyerId(msg.content) || (msg.sender_id !== user.id ? msg.sender_id : null);
                                        if (!buyerId) return;
                                        if (!threads[buyerId]) threads[buyerId] = [];
                                        threads[buyerId].push(msg);
                                    });

                                    const senderIds = Object.keys(threads);

                                    if (senderIds.length === 0) return <p className="p-4 text-xs text-slate-500 text-center">{t('seller_dashboard.conversation_empty')}</p>;

                                    return senderIds.map(senderId => {
                                        const thread = threads[senderId];
                                        const lastMsg = thread[thread.length - 1]; // Naive last message
                                        return (
                                            <button
                                                key={senderId}
                                                onClick={() => setViewingThread(senderId)}
                                                className={`w-full p-4 border-b border-white/5 text-left hover:bg-white/5 transition flex items-start gap-3 ${viewingThread === senderId ? 'bg-cyan-900/20 border-l-2 border-l-cyan-400' : 'border-l-2 border-l-transparent'}`}
                                            >
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white">
                                                    {senderId.substr(0, 2).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-baseline mb-1">
                                                        <span className="text-sm font-bold text-slate-200 truncate">{t('seller_dashboard.buyer_label', { id: senderId.substr(0, 4) })}...</span>
                                                        <span className="text-[10px] text-slate-500">{new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-400 truncate">{stripBuyerTag(lastMsg.content)}</p>
                                                </div>
                                            </button>
                                        );
                                    });
                                })()}
                            </div>
                        </div>

                        {/* RIGHT: CHAT AREA */}
                        <div className="flex-1 flex flex-col bg-[#0f1623]">
                            {/* Header */}
                            <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                                <div>
                                    <h3 className="font-bold text-sm text-white">{viewingMessages.title}</h3>
                                    {viewingThread ? (
                                        <span className="text-xs text-cyan-500">{t('seller_dashboard.replying_to', { id: viewingThread.substr(0, 6) })}...</span>
                                    ) : (
                                        <span className="text-xs text-slate-500">{t('seller_dashboard.select_conversation')}</span>
                                    )}
                                </div>
                                <button onClick={() => { setViewingMessages(null); setViewingThread(null); }} className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white"><X size={20} /></button>
                            </div>

                            {/* Messages Feed */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {!viewingThread ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
                                        <MessageSquare size={48} className="opacity-20" />
                                        <p>{t('seller_dashboard.select_conversation')}</p>
                                    </div>
                                ) : (
                                    pavilionMessages
                                        .filter(m => {
                                            const buyerId = extractBuyerId(m.content);
                                            const isBuyerMessage = buyerId ? buyerId === viewingThread : m.sender_id === viewingThread;
                                            const isSellerMessageForThread = m.sender_id === user.id && buyerId === viewingThread;
                                            return isBuyerMessage || isSellerMessageForThread;
                                        })
                                        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                                        .map((msg, i) => (
                                            <div key={i} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[70%] p-3 rounded-2xl ${msg.sender_id === user.id ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none'}`}>
                                                    <p className="text-sm leading-relaxed">{stripBuyerTag(msg.content)}</p>
                                                    <span className="text-[10px] opacity-50 mt-1 block text-right">
                                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        {msg.sender_id === user.id && ` · ${t('seller_dashboard.you')}`}
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

                                        // Optimistic
                                        const taggedContent = `[buyer:${viewingThread}] ${content}`;
                                        const fakeMsg = { id: Date.now(), content: taggedContent, sender_id: user.id, created_at: new Date().toISOString(), pavilion_id: viewingMessages.id };
                                        setPavilionMessages(prev => [...prev, fakeMsg]);
                                        input.value = '';

                                        // Send
                                        await supabase.from('messages').insert({
                                            pavilion_id: viewingMessages.id,
                                            sender_id: user.id,
                                            content: taggedContent
                                        });
                                    }}
                                    className="p-4 border-t border-white/10 bg-white/5 flex gap-2"
                                >
                                    <input
                                        name="replyInput"
                                        type="text"
                                        placeholder={t('seller_dashboard.reply_placeholder')}
                                        className="flex-1 bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition"
                                        autoComplete="off"
                                    />
                                    <button type="submit" className="p-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white transition">
                                        <MessageSquare size={18} />
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-left">
                        <div className="bg-[#0f1623] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5 sticky top-0 backdrop-blur-xl z-10">
                                <h2 className="text-xl font-bold">{t('seller_dashboard.edit_pavilion')}</h2>
                                <button onClick={() => setEditingPavilion(null)} className="p-1 hover:text-white text-slate-400"><X size={24} /></button>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">{t('seller_dashboard.pavilion_title')}</label>
                                        <input
                                            value={editingPavilion.title}
                                            onChange={e => setEditingPavilion({ ...editingPavilion, title: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs uppercase tracking-wider text-slate-500 mb-1">{t('seller_dashboard.blurb')}</label>
                                        <input
                                            value={editingPavilion.blurb}
                                            onChange={e => setEditingPavilion({ ...editingPavilion, blurb: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-slate-500 mb-2">{t('seller_dashboard.theme_color')}</label>
                                    <div className="flex gap-2">
                                        {['#22d3ee', '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#a855f7'].map(c => (
                                            <button
                                                key={c}
                                                onClick={() => setEditingPavilion({ ...editingPavilion, color: c })}
                                                className={`w-8 h-8 rounded-full border-2 ${editingPavilion.color === c ? 'border-white' : 'border-transparent'}`}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div className="border-t border-white/10 pt-6">
                                    <h3 className="font-semibold mb-4">{t('seller_dashboard.manage_products')}</h3>

                                    {/* Product List Editor */}
                                    <div className="space-y-2 mb-6">
                                        {editingPavilion.products.map(p => (
                                            <div key={p.id} className="flex justify-between items-center bg-white/5 p-3 rounded-lg">
                                                <div>
                                                    <p className="font-medium text-sm">{p.name}</p>
                                                    <p className="text-xs text-slate-400">{p.price}</p>
                                                </div>
                                                <button
                                                    onClick={() => removeProduct(p.id, (prod) => setEditingPavilion({ ...editingPavilion, products: prod }), editingPavilion.products)}
                                                    className="text-red-400 hover:text-red-300 p-2 hover:bg-white/5 rounded"
                                                >
                                                    <Trash size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Add Product Inline */}
                                    <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">{t('seller_dashboard.add_functionality')}</p>
                                        <div className="grid grid-cols-2 gap-2 mb-2">
                                            <input
                                                placeholder={t('seller_dashboard.product_name_placeholder')}
                                                value={prodName}
                                                onChange={e => setProdName(e.target.value)}
                                                className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm outline-none"
                                            />
                                            <input
                                                placeholder={t('seller_dashboard.product_price_placeholder')}
                                                value={prodPrice}
                                                onChange={e => setProdPrice(e.target.value)}
                                                className="bg-white/5 border border-white/10 rounded px-2 py-1 text-sm outline-none"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <label className="flex-1 cursor-pointer bg-white/5 border border-white/10 rounded px-2 py-1 flex items-center justify-center text-xs text-slate-400 gap-2 hover:bg-white/10">
                                                <Upload size={12} /> {prodFile ? prodFile.name : t('seller_dashboard.select_glb')}
                                                <input type="file" accept=".glb,.gltf" className="hidden" onChange={e => setProdFile(e.target.files[0])} />
                                            </label>
                                            <button
                                                onClick={() => setShowAiGenerator(true)}
                                                className="px-2 bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600/30 rounded text-purple-200"
                                                title={t('seller_dashboard.ai_generate')}
                                            >
                                                <Wand2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => stageProduct((prod) => setEditingPavilion({ ...editingPavilion, products: prod }), editingPavilion.products)}
                                                disabled={uploading}
                                                className="bg-blue-600 hover:bg-blue-500 text-white rounded px-4 py-1 text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {uploading ? t('seller_dashboard.uploading') : t('seller_dashboard.add_btn')}
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

            <div className="relative">
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_20px_80px_rgba(0,0,0,0.45)] p-8 mb-10">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/15 via-transparent to-purple-500/15" aria-hidden />
                    <div className="absolute inset-0 cyber-grid opacity-10" aria-hidden />
                    <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                        <div>
                            <p className="text-xs uppercase tracking-[0.35em] text-cyan-300 mb-2">{t('seller_dashboard.title')}</p>
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight">{t('seller_dashboard.subtitle')}</h1>
                            <p className="text-slate-300 mt-3">{t('cta')}</p>
                        </div>
                        <div className="flex gap-3 flex-wrap">
                            <div className="rounded-2xl border border-white/20 bg-black/30 px-4 py-3 shadow-[0_0_25px_rgba(0,0,0,0.35)] min-w-[120px]">
                                <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400 mb-1">{t('seller_dashboard.deploy_new')}</p>
                                <p className="text-2xl font-bold text-cyan-300">{totalPavilions}</p>
                            </div>
                            <div className="rounded-2xl border border-white/20 bg-black/30 px-4 py-3 shadow-[0_0_25px_rgba(0,0,0,0.35)] min-w-[120px]">
                                <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400 mb-1">{t('seller_dashboard.products_catalog')}</p>
                                <p className="text-2xl font-bold text-blue-200">{totalProducts}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-[350px_1fr] gap-8">

                {/* LEFT COLUMN: CREATE */}
                <div className="bg-gradient-to-b from-white/10 via-white/5 to-white/0 border border-cyan-500/20 p-6 rounded-2xl h-fit sticky top-24 shadow-[0_10px_40px_rgba(0,0,0,0.45)] backdrop-blur">
                    <h2 className="text-lg font-bold text-blue-300 mb-4">{t('seller_dashboard.deploy_new')}</h2>
                    <div className="space-y-4">
                        <input
                            placeholder={t('seller_dashboard.pavilion_title_placeholder')}
                            value={createTitle}
                            onChange={e => setCreateTitle(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                        />
                        <input
                            placeholder={t('seller_dashboard.blurb_placeholder')}
                            value={createBlurb}
                            onChange={e => setCreateBlurb(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                        />
                        <div className="flex gap-2">
                            {['#22d3ee', '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#a855f7'].map(c => (
                                <button
                                    key={c}
                                    onClick={() => setCreateColor(c)}
                                    className={`w-6 h-6 rounded-full border-2 ${createColor === c ? 'border-white' : 'border-transparent'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>

                        <div className="border-t border-white/10 pt-4">
                            <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">{t('seller_dashboard.initial_products')}</p>
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                <input
                                    placeholder={t('seller_dashboard.product_name_placeholder')}
                                    value={prodName}
                                    onChange={e => setProdName(e.target.value)}
                                    className="bg-black/20 border border-white/10 rounded px-2 py-1 text-xs outline-none"
                                />
                                <input
                                    placeholder={t('seller_dashboard.product_price_placeholder')}
                                    value={prodPrice}
                                    onChange={e => setProdPrice(e.target.value)}
                                    className="bg-black/20 border border-white/10 rounded px-2 py-1 text-xs outline-none"
                                />
                            </div>
                            <label className="cursor-pointer bg-white/5 border border-white/10 rounded px-2 py-2 flex items-center justify-center text-xs text-slate-400 gap-2 hover:bg-white/10 mb-2">
                                <Upload size={12} /> {prodFile ? prodFile.name : t('seller_dashboard.upload_glb')}
                                <input type="file" accept=".glb,.gltf" className="hidden" onChange={e => setProdFile(e.target.files[0])} />
                            </label>

                            <button
                                onClick={() => setShowAiGenerator(true)}
                                className="w-full flex items-center justify-center gap-2 py-2 bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600/30 rounded text-purple-200 text-xs font-bold mb-2 transition shadow-[0_10px_30px_rgba(88,28,135,0.35)]"
                            >
                                <Wand2 size={12} /> {t('seller_dashboard.ai_generate')}
                            </button>

                            <button
                                onClick={() => stageProduct(setCreateProducts, createProducts)}
                                disabled={uploading}
                                className="w-full py-1 bg-white/10 hover:bg-white/20 rounded text-xs font-bold mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {uploading ? t('seller_dashboard.uploading') : '+ ' + t('seller_dashboard.add_product_btn')}
                            </button>

                            {createProducts.length > 0 && (
                                <div className="space-y-1 mb-4">
                                    {createProducts.map(p => (
                                        <div key={p.id} className="flex justify-between items-center text-xs bg-black/40 p-2 rounded">
                                            <span>{p.name}</span>
                                            <button onClick={() => removeProduct(p.id, setCreateProducts, createProducts)} className="text-red-400 hover:text-white"><Trash size={12} /></button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <button
                                onClick={handleDeploy}
                                disabled={loading || createProducts.length === 0}
                                className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50"
                            >
                                {loading ? t('seller_dashboard.deploying_btn') : t('seller_dashboard.deploy_btn')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: LIST */}
                <div className="space-y-6">
                    {pavilions.length === 0 && (
                        <div className="h-64 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl text-slate-500">
                            <p>{t('seller_dashboard.no_pavilions')}</p>
                        </div>
                    )}
                    {pavilions.map(p => (
                        <div key={p.is_demo ? 'demo_' + p.id : p.id} className="bg-black/30 border border-white/10 rounded-2xl p-6 relative group hover:border-cyan-400/30 transition shadow-[0_10px_40px_rgba(0,0,0,0.45)] backdrop-blur">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl shadow-lg" style={{ backgroundColor: p.color }} />
                                    <div>
                                        <h3 className="text-xl font-bold">{p.title}</h3>
                                        <p className="text-slate-400 text-sm">{p.blurb}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleViewMessages(p)}
                                        className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300"
                                        title={t('seller_dashboard.view_messages_title')}
                                    >
                                        <MessageSquare size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleEditPavilion(p)}
                                        className="p-2 rounded-lg bg-blue-600/10 border border-blue-500/30 hover:bg-blue-600/20 text-blue-300"
                                        title={t('seller_dashboard.edit_pavilion_title')}
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDeletePavilion(p.id)}
                                        className="p-2 rounded-lg bg-red-600/10 border border-red-500/30 hover:bg-red-600/20 text-red-300"
                                        title={t('seller_dashboard.delete_pavilion_title')}
                                    >
                                        <Trash size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="bg-black/20 rounded-xl p-4">
                                <p className="text-xs uppercase tracking-wider text-slate-500 mb-3 font-semibold">{t('seller_dashboard.products_catalog')}</p>
                                <div className="grid sm:grid-cols-2 gap-3">
                                    {p.products.map(prod => (
                                        <div key={prod.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                                            <div>
                                                <p className="font-medium text-sm">{prod.name}</p>
                                                <p className="text-xs text-slate-500">{prod.price}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                </div>
            </div>
        </div>
    );
}
