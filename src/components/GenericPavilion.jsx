import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, Grid, OrbitControls, useGLTF, Html, MeshReflectorMaterial } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise, SSAO } from '@react-three/postprocessing';
import * as THREE from 'three';
import { supabase } from '../lib/supabaseClient';
import { useTranslation } from 'react-i18next';

// --- CHAT COMPONENT ---
function ChatPanel({ pavilionId, user, onClose, title }) {
    const { t } = useTranslation();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const bottomRef = useRef(null);

    useEffect(() => {
        fetchMessages();
        const channel = supabase.channel('chat-room')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
                if (payload.new.pavilion_id === pavilionId) {
                    setMessages(prev => [...prev, payload.new]);
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); }
    }, [pavilionId]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchMessages = async () => {
        const { data } = await supabase.from('messages').select('*').eq('pavilion_id', pavilionId);
        if (data) setMessages(data);
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || !user) return;

        await supabase.from('messages').insert({
            pavilion_id: pavilionId,
            sender_id: user.id,
            content: input,
        });
        setInput('');
    };

    return (
        <div className="absolute top-0 right-0 h-full w-full md:w-[360px] bg-gradient-to-b from-white/10 via-black/50 to-black/80 backdrop-blur-2xl border-l border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.45)] z-30 flex flex-col">
            <div className="p-4 border-b border-white/10 flex items-start justify-between">
                <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">{t('pavilion_ui.live_chat')}</p>
                    <h3 className="text-lg font-semibold text-white mt-1">{title}</h3>
                </div>
                <button onClick={onClose} className="text-white/70 hover:text-white text-sm px-3 py-1 rounded border border-white/15">
                    {t('pavilion_ui.close')}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.length === 0 && <p className="text-center text-slate-500 text-sm">{t('pavilion_ui.start_conversation')}</p>}
                {messages.map((m, i) => {
                    const isMe = m.sender_id === user?.id;
                    return (
                        <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                            <div className={`p-3 rounded-xl max-w-[85%] ${isMe ? 'bg-blue-600/20 border border-blue-500/30 text-blue-100' : 'bg-white/10 border border-white/10 text-slate-200'}`}>
                                <p className="text-sm">{m.content}</p>
                            </div>
                            <span className="text-[10px] text-slate-500 mt-1">{isMe ? t('pavilion_ui.you') : `${t('pavilion_ui.user')} ` + m.sender_id.substr(0, 4)}</span>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSend} className="p-4 border-t border-white/10 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={user ? t('pavilion_ui.message_placeholder') : t('pavilion_ui.login_to_chat')}
                    disabled={!user}
                    className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50"
                />
                <button
                    type="submit"
                    disabled={!user}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-semibold shadow-lg shadow-blue-500/30 disabled:opacity-50"
                >
                    {t('pavilion_ui.send')}
                </button>
            </form>
        </div>
    );
}

function Annotation({ title, description, visible, position, distanceFactor = 12 }) {
    return (
        <Html position={position} center distanceFactor={distanceFactor} style={{ pointerEvents: 'none', display: visible ? 'block' : 'none' }}>
            <div className={`
        flex flex-col gap-2 w-56 p-5 rounded-lg 
        bg-black/40 backdrop-blur-xl border border-white/10 
        shadow-[0_0_40px_rgba(0,0,0,0.6)] transition-all duration-500 ease-out origin-bottom
        ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-90'}
      `}>
                <div className="absolute -bottom-28 left-1/2 w-px h-28 bg-gradient-to-t from-transparent via-white/40 to-white/10" />
                <div className="absolute -bottom-28 left-1/2 w-1.5 h-1.5 -translate-x-[3px] rounded-full bg-white shadow-[0_0_8px_white]" />
                <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                    <h3 className="text-white font-semibold tracking-widest uppercase text-xs">{title}</h3>
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                </div>
                <p className="text-gray-200 text-xs leading-relaxed font-light tracking-wide">{description}</p>
            </div>
        </Html>
    );
}

function Model({ path, scale = 1, onClick, onPointerOver, onPointerOut, isSelected }) {
    const gltf = useGLTF(path, true);
    const ref = useRef();

    useFrame((state, delta) => {
        if (ref.current && !isSelected) {
            ref.current.rotation.y += delta * 0.02;
        }
    });

    const scene = useMemo(() => {
        if (!gltf || !gltf.scene) return null;
        const clone = gltf.scene.clone();

        const box = new THREE.Box3().setFromObject(clone);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const fitScale = (1.8 / maxDim) * scale;
        clone.scale.setScalar(fitScale);

        const centeredBox = new THREE.Box3().setFromObject(clone);
        const center = new THREE.Vector3();
        centeredBox.getCenter(center);
        clone.position.sub(center);

        clone.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                    child.material = child.material.clone();
                    child.material.metalness = 0.9;
                    child.material.roughness = 0.2;
                }
            }
        });

        return clone;
    }, [gltf, path, scale]);

    if (!scene) return null;

    return (
        <group
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            onPointerOver={() => { document.body.style.cursor = 'pointer'; onPointerOver?.(); }}
            onPointerOut={() => { document.body.style.cursor = 'auto'; onPointerOut?.(); }}
        >
            <primitive object={scene} ref={ref} />
        </group>
    );
}

function BobbingGroup({ children, phase = 0, isSelected = false }) {
    const ref = useRef();
    useFrame((state) => {
        if (!ref.current) return;
        const t = state.clock.getElapsedTime() + phase;
        const amp = isSelected ? 0.06 : 0.12;
        const speed = isSelected ? 0.8 : 1.2;
        ref.current.position.y = Math.sin(t * speed) * amp;
    });
    return <group ref={ref}>{children}</group>;
}

function PlatformModel({ path = '/objects/platform.glb' }) {
    const gltf = useGLTF(path, true);
    const scene = useMemo(() => {
        if (!gltf || !gltf.scene) return null;
        const clone = gltf.scene.clone();

        const box = new THREE.Box3().setFromObject(clone);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const fitScale = 2.5 / maxDim;
        clone.scale.setScalar(fitScale);

        const centeredBox = new THREE.Box3().setFromObject(clone);
        const center = new THREE.Vector3();
        centeredBox.getCenter(center);
        clone.position.sub(center);
        clone.position.y += size.y * fitScale * 0.5;

        clone.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.material.roughness = 0.1;
                child.material.metalness = 0.8;
            }
        });
        return clone;
    }, [gltf, path]);

    if (!scene) return null;
    return <primitive object={scene} />;
}

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Model loading error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <mesh position={[0, 1.5, 0]}>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshStandardMaterial color="red" wireframe />
                </mesh>
            );
        }

        return this.props.children;
    }
}

export default function GenericPavilion({ pavilionData, onBack, user }) {
    const { t } = useTranslation();
    const [selectedObj, setSelectedObj] = useState(null);
    const [hoveredObj, setHoveredObj] = useState(null);
    const [showChat, setShowChat] = useState(false);
    const controlsRef = useRef();

    // If no products, fallback to empty array
    const products = pavilionData?.products || [];

    // Toggle chat when clicking a product or via a button
    const handleProductClick = (prod) => {
        setSelectedObj(prod.id);
        setShowChat(true);
    };

    return (
        <div className="h-[85vh] md:h-[90vh] w-full bg-black relative overflow-hidden">

            {/* HEADER */}
            <div className="absolute top-8 left-8 z-20 pointer-events-none">
                <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/20 tracking-tighter">
                    {pavilionData?.title || t('pavilion_ui.default_title')}
                </h2>
                <p className="text-cyan-400 text-xs tracking-[0.5em] mt-2 uppercase">{pavilionData?.blurb || t('pavilion_ui.default_blurb')}</p>
            </div>

            {/* CONTROL HINT */}
            <div className="absolute bottom-8 left-8 z-20 pointer-events-none text-white/40 text-xs">
                <p>{t('pavilion_ui.controls_hint')}</p>
            </div>

            {/* EXIT & CHAT BUTTONS */}
            <div className="absolute top-8 right-8 z-20 flex gap-4">
                <button
                    onClick={() => setShowChat(!showChat)}
                    className="px-6 py-3 rounded-full border border-blue-500/30 bg-blue-600/20 backdrop-blur-md text-blue-200 text-sm hover:bg-blue-600/40 transition-all font-semibold"
                >
                    {showChat ? t('pavilion_ui.hide_chat') : t('pavilion_ui.chat_with_supplier')}
                </button>
                <button
                    onClick={onBack}
                    className="px-8 py-3 rounded-full border border-white/10 hover:border-white/40 bg-black/20 backdrop-blur-md text-white text-sm transition-all hover:bg-white/10"
                >
                    {t('pavilion_ui.exit')}
                </button>
            </div>

            <Canvas
                shadows
                dpr={[1, 1.2]}
                camera={{ position: [0, 3, 9], fov: 45 }}
                gl={{ antialias: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
                onPointerMissed={() => setSelectedObj(null)}
                className="absolute inset-0"
            >
                <Environment files="/hdris/convertio.in_image.hdr" background={true} blur={0.02} environmentIntensity={1.0} />
                <ambientLight intensity={0.55} />
                <spotLight position={[8, 10, 6]} angle={0.45} penumbra={1} intensity={85} castShadow color="#ffffff" />

                <Suspense fallback={null}>
                    <group position={[0, 0, 0]}>
                        {/* RENDER PRODUCTS LEFT AND RIGHT */}
                        {products.map((prod, idx) => {
                            const isLeft = idx % 2 === 0;
                            const pos = isLeft ? [-3.5, 0, 0] : [3.5, 0, 0];
                            return (
                                <group key={prod.id} position={pos}>
                                    <PlatformModel />
                                    <Float speed={1.2} rotationIntensity={0} floatIntensity={0.12}>
                                        <BobbingGroup phase={idx * 0.5} isSelected={selectedObj === prod.id}>
                                            <group position={[0, 1.8, 0]}>
                                                <ErrorBoundary>
                                                    <Model
                                                        path={prod.modelUrl}
                                                        scale={0.9} // Slight norm
                                                        onClick={() => handleProductClick(prod)}
                                                        onPointerOver={() => setHoveredObj(prod.id)}
                                                        onPointerOut={() => setHoveredObj(null)}
                                                        isSelected={selectedObj === prod.id}
                                                    />
                                                </ErrorBoundary>
                                                <Annotation
                                                    title={prod.name}
                                                    description={`${prod.price} - ${prod.details?.[0] || t('pavilion_ui.view_details')}`}
                                                    visible={hoveredObj === prod.id && !selectedObj}
                                                    position={[isLeft ? 1.2 : -1.2, 1.8, 0]}
                                                    distanceFactor={10}
                                                />
                                            </group>
                                        </BobbingGroup>
                                    </Float>
                                </group>
                            );
                        })}

                        {/* FLOOR */}
                        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                            <planeGeometry args={[100, 100]} />
                            <MeshReflectorMaterial resolution={1024} mixBlur={0.6} mixStrength={1.5} roughness={0.22} depthScale={0.8} minDepthThreshold={0.4} maxDepthThreshold={1.4} color="#04060c" metalness={0.85} mirror={0.6} />
                        </mesh>
                        <Grid position={[0, 0, 0]} args={[100, 100]} cellSize={1.5} cellThickness={0.5} cellColor={[0.05, 0.2, 0.35]} sectionSize={3} sectionThickness={1.3} sectionColor={[4.2, 10.5, 16]} fadeDistance={40} infiniteGrid />
                    </group>
                </Suspense>

                <EffectComposer disableNormalPass>
                    <Bloom luminanceThreshold={0.6} mipmapBlur intensity={1.1} radius={0.38} />
                    <SSAO intensity={15} radius={0.2} luminanceInfluence={0.4} color="black" />
                    <Noise opacity={0.02} />
                    <Vignette eskil={false} offset={0.12} darkness={0.8} />
                </EffectComposer>
                <OrbitControls ref={controlsRef} enableDamping dampingFactor={0.12} enablePan={false} maxPolarAngle={Math.PI / 2 - 0.1} minDistance={3} maxDistance={14} />
            </Canvas>

            {/* RENDER CHAT PANEL */}
            {showChat && (
                <ChatPanel
                    pavilionId={pavilionData.id || 'default'}
                    user={user}
                    onClose={() => setShowChat(false)}
                    title={selectedObj ? products.find(p => p.id === selectedObj)?.name : pavilionData.title}
                />
            )}
        </div>
    );
}
