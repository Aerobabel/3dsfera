import React, { useState, Suspense, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Float, ContactShadows, Environment, Loader, Center, Resize, Sphere, Grid } from '@react-three/drei';
import * as THREE from 'three';
import ProductModel from './ProductModel';
import SoundManager from './SoundManager';
import LiveChat from './LiveChat';
import FeaturesModal from './FeaturesModal';

// ... imports
import { HeavyDutyRobot } from './subsystems/HeavyDutyRobot';
import { PlatformDemoModel } from './subsystems/PlatformDemoModel';
import { Microwave } from './subsystems/Microwave';
import { Television } from './subsystems/Television';
import { Escavator } from './subsystems/Escavator';

// --- COMPONENTS ---

function CameraHandler({ trigger }) {
    const { camera, controls } = useThree();
    useEffect(() => {
        camera.position.set(0, 1.0, 9);
        if (controls) {
            controls.target.set(0, 0, 0);
            controls.update();
        }
    }, [trigger, camera, controls]);
    return null;
}

function ShowroomStage({ currentProduct, isHeavy }) {
    // Fallback for missing models (Holographic Placeholder)
    const PlaceholderModel = () => (
        <group>
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshBasicMaterial color="#00ffff" wireframe transparent opacity={0.3} />
            </mesh>
            <Sphere args={[0.4, 16, 16]}>
                <meshBasicMaterial color="#00ffff" wireframe transparent opacity={0.2} />
            </Sphere>
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[0.8, 0.8, 0.8]} />
                <meshBasicMaterial color="#00ffff" transparent opacity={0.05} />
            </mesh>
        </group>
    );

    // Smooth floating animation
    return (
        <group>
            <Float
                speed={2}
                rotationIntensity={0.1}
                floatIntensity={0.2}
                floatingRange={[-0.1, 0.1]}
            >
                {/* CINEMATIC LIGHTING attached to the camera/scene scope */}
                <group position={[0, 0, 0]}>
                    {/* Centered & RESIZED Content */}
                    <Center key={currentProduct.id} position={[0, 0, 0]}>
                        <Resize key={currentProduct.id} scale={4.5}>
                            {/* Product Rendering Switch */}
                            {currentProduct.isMicrowave ? (
                                <Microwave />
                            ) : currentProduct.isTelevision ? (
                                <Television />
                            ) : currentProduct.isPlatformDemo ? (
                                <PlatformDemoModel />
                            ) : currentProduct.isRoboticArm ? (
                                <HeavyDutyRobot />
                            ) : currentProduct.modelPath ? (
                                <ProductModel
                                    path={currentProduct.modelPath}
                                    rotation={currentProduct.rotation || [0, 0, 0]}
                                />
                            ) : (
                                <PlaceholderModel />
                            )}
                        </Resize>
                    </Center>

                    {/* Ground Shadows for realism */}
                    <ContactShadows
                        opacity={0.7}
                        scale={20}
                        blur={2}
                        far={4}
                        resolution={512}
                        color="#000000"
                        position={[0, -2.5, 0]} // Shadow at bottom of 5-unit box
                    />

                    {/* Premium Industrial Platform - Sleek & Realistic */}
                    <group position={[0, -2.55, 0]}>
                        {/* 1. Main Base Block (Heavy Dark Metal) */}
                        <mesh receiveShadow>
                            <cylinderGeometry args={[3.2, 3.4, 0.25, 64]} />
                            <meshStandardMaterial
                                color="#151515"
                                roughness={0.3}
                                metalness={0.8}
                                envMapIntensity={1}
                            />
                        </mesh>

                        {/* 2. Glassy Rim (The "Radiant" Element) */}
                        <mesh position={[0, 0.13, 0]}>
                            <cylinderGeometry args={[3.2, 3.2, 0.02, 64]} />
                            <meshPhysicalMaterial
                                color="#ffffff"
                                transmission={0.9} // Glass-like
                                opacity={1}
                                metalness={0}
                                roughness={0}
                                ior={1.5}
                                thickness={0.1}
                                emissive="#ffffff"
                                emissiveIntensity={2}
                                toneMapped={false}
                            />
                        </mesh>

                        {/* 3. Inner Surface (Matte Tech) */}
                        <mesh position={[0, 0.126, 0]}>
                            <cylinderGeometry args={[3.15, 3.15, 0.02, 64]} />
                            <meshStandardMaterial
                                color="#0a0a0a"
                                roughness={0.8}
                                metalness={0.5}
                            />
                        </mesh>

                        {/* 4. Floor Reflection/Glow (Soft Ambient) */}
                        <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                            <ringGeometry args={[3.3, 5, 64]} />
                            <meshBasicMaterial
                                color="#ffffff"
                                transparent
                                opacity={0.08}
                            />
                        </mesh>
                    </group>
                </group>
            </Float>

            {/* AMBIENCE - Grey Technical Studio */}
            <color attach="background" args={['#202020']} />
            <fog attach="fog" args={['#202020', 10, 40]} />

            <ambientLight intensity={1.0} />
            <spotLight position={[10, 15, 10]} angle={0.3} penumbra={0.5} intensity={15} castShadow />
            <spotLight position={[-10, 10, -5]} angle={0.4} penumbra={1} intensity={10} color="#eef" />

            {/* Environment Reflection Map (Abstract Studio) */}
            {/* Environment Reflection Map (Local) */}
            <Environment
                files="/hdris/convertio.in_image.hdr"
                background={false}
                environmentIntensity={0.6}
            />

            <Grid
                position={[0, -2.60, 0]} // Kept lowered for Z-fighting fix
                args={[40, 40]}
                cellSize={1}
                cellThickness={0.5}
                cellColor="#555555"
                sectionSize={5}
                sectionThickness={1.2}
                sectionColor="#888888"
                fadeDistance={25}
                infiniteGrid
            />
        </group>
    );
}

// --- MAIN VIEW ---

export default function ShowroomView({ pavilionData, onBack, user }) {
    const { t } = useTranslation();
    const [activeIndex, setActiveIndex] = useState(0);
    const [showChat, setShowChat] = useState(false);
    const [showFeatures, setShowFeatures] = useState(false);
    const products = useMemo(() => pavilionData?.products || [], [pavilionData]);
    const currentProduct = products[activeIndex] || {};
    const pavilionSlug = pavilionData?.slug || pavilionData?.id;
    const isHeavy = pavilionSlug === 'heavy';
    const isSeller = user?.user_metadata?.role === 'seller';
    const productTitle = t(`pavilion_content.products.${currentProduct.id}.title`, {
        defaultValue: currentProduct.title || currentProduct.name || 'Unnamed Artifact'
    });
    const productDescription = t(`pavilion_content.products.${currentProduct.id}.description`, {
        defaultValue: currentProduct.description || 'A masterpiece of engineering. Select to view details.'
    });

    const productFeatures = t(`pavilion_content.products.${currentProduct.id}.features`, {
        returnObjects: true,
        defaultValue: currentProduct.features || []
    });

    useEffect(() => {
        if (isSeller) setShowChat(false);
    }, [isSeller]);

    // CART & CHECKOUT LOGIC
    const [cart, setCart] = useState([]);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [orderSubmitted, setOrderSubmitted] = useState(false);
    const [checkoutForm, setCheckoutForm] = useState({ name: '', phone: '', email: '' });

    const addToCart = (e, product) => {
        e.stopPropagation();
        if (cart.find(item => item.id === product.id)) return;
        SoundManager.playClick();
        setCart(prev => [...prev, product]);
    };

    const removeFromCart = (id) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const handleCheckoutSubmit = (e) => {
        e.preventDefault();
        // Here you would send data to backend
        setOrderSubmitted(true);
        setTimeout(() => {
            // Auto close logic could go here, but user might want to read message
        }, 500);
    };

    const resetCheckout = () => {
        setIsCheckoutOpen(false);
        setOrderSubmitted(false);
        setCart([]);
        setCheckoutForm({ name: '', phone: '', email: '' });
    };

    // VIEW MODE LOGIC
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'detail'

    // Reset to list when data changes
    useEffect(() => {
        setViewMode('list');
    }, [pavilionData]);

    // Carousel Navigation
    const nextProduct = () => {
        if (products.length === 0) return;
        SoundManager.playClick();
        setActiveIndex((prev) => (prev + 1) % products.length);
    };

    const prevProduct = () => {
        if (products.length === 0) return;
        SoundManager.playClick();
        setActiveIndex((prev) => (prev - 1 + products.length) % products.length);
    };

    if (!pavilionData) return null;

    // --- LIST VIEW ---
    if (viewMode === 'list') {
        return (
            <div className="relative w-full h-full bg-[#111] overflow-hidden flex flex-col">
                {/* Background Grid */}
                <div className="absolute inset-0 bg-[url('/assets/images/grid_bg.png')] bg-cover opacity-20 pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/80 pointer-events-none" />

                {/* Header */}
                <div className="relative z-10 w-full p-8 flex justify-between items-center bg-black/40 backdrop-blur-md border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="group flex items-center gap-3 transition-all hover:opacity-80"
                        >
                            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-red-500/20 group-hover:border-red-500/50 transition-colors text-white">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            </div>
                            <span className="text-xs font-bold tracking-[0.2em] uppercase text-white/60 group-hover:text-white">
                                {t('pavilion_ui.close', 'Close')}
                            </span>
                        </button>

                        {/* Cart Button */}
                        <button
                            onClick={() => {
                                if (cart.length > 0) {
                                    SoundManager.playClick();
                                    setIsCheckoutOpen(true);
                                }
                            }}
                            className={`group flex items-center gap-3 transition-all ${cart.length > 0 ? 'opacity-100 hover:scale-105' : 'opacity-40 cursor-not-allowed'}`}
                        >
                            <div className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors text-white ${cart.length > 0 ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-white/5 border-white/10'}`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                            </div>
                            <span className={`text-xs font-bold tracking-[0.2em] uppercase ${cart.length > 0 ? 'text-cyan-400' : 'text-white/40'}`}>
                                {t('pavilion_ui.order', 'Order')} ({cart.length})
                            </span>
                        </button>
                    </div>

                    <div className="text-right">
                        <h1 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 font-[Orbitron] tracking-tighter">
                            {t(`pavilion_content.pavilions.${pavilionSlug}.name`, { defaultValue: pavilionData.name })}
                        </h1>
                        <p className="text-cyan-400 text-[10px] font-bold tracking-[0.3em] uppercase mt-1">
                            {t('pavilion_ui.products_catalog', 'Product Catalog')}
                        </p>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="relative z-10 flex-1 overflow-y-auto p-4 md:p-12 custom-scrollbar">
                    <div className="max-w-7xl mx-auto space-y-12">
                        {/* Intro Blurb */}
                        <div className="max-w-3xl">
                            <p className="text-xl md:text-2xl text-slate-300 font-light leading-relaxed">
                                {t(`pavilion_content.pavilions.${pavilionSlug}.description`, { defaultValue: pavilionData.description })}
                            </p>
                        </div>

                        {/* Product Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {products.map((product, idx) => (
                                <div
                                    key={product.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => {
                                        if (product.modelPath) {
                                            SoundManager.playClick();
                                            setActiveIndex(idx);
                                            setViewMode('detail');
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        if ((e.key === 'Enter' || e.key === ' ') && product.modelPath) {
                                            SoundManager.playClick();
                                            setActiveIndex(idx);
                                            setViewMode('detail');
                                        }
                                    }}
                                    className={`group relative flex flex-col text-left h-full bg-white/5 border border-white/10 transition-all duration-300 rounded-xl overflow-hidden shadow-lg 
                                        ${product.modelPath ? 'hover:border-cyan-500/50 hover:bg-white/10 hover:shadow-cyan-500/10 cursor-pointer' : 'opacity-80 cursor-default'}`}
                                >
                                    {/* Image Placeholder area */}
                                    <div className="h-72 w-full bg-black/50 relative overflow-hidden group-hover:opacity-90 transition-opacity">
                                        {product.image ? (
                                            <img
                                                src={product.image}
                                                alt={product.title}
                                                className="w-full h-full object-contain p-4 opacity-80 group-hover:opacity-100 transition-opacity grayscale group-hover:grayscale-0 duration-500"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-white/10 group-hover:text-cyan-500/20 transition-colors">
                                                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" /></svg>
                                            </div>
                                        )}
                                        <div className={`absolute bottom-3 left-3 px-2 py-1 bg-black/60 rounded text-[10px] font-mono border ${product.modelPath ? 'text-cyan-400 border-cyan-500/30' : 'text-slate-400 border-slate-500/30'}`}>
                                            {product.modelPath ? '3D MODEL' : 'CATALOGUE ITEM'}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-6 flex flex-col flex-1">
                                        <h3 className="text-xl font-bold text-white mb-2 font-[Orbitron] group-hover:text-cyan-400 transition-colors">
                                            {t(`pavilion_content.products.${product.id}.title`, { defaultValue: product.title })}
                                        </h3>
                                        <p className="text-sm text-slate-400 leading-relaxed mb-6 line-clamp-3 flex-1">
                                            {t(`pavilion_content.products.${product.id}.description`, { defaultValue: product.description })}
                                        </p>

                                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Stop bubble to parent div
                                                    addToCart(e, product);
                                                }}
                                                className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest border transition-all ${cart.find(c => c.id === product.id)
                                                    ? 'bg-cyan-500 text-black border-cyan-500 cursor-default'
                                                    : 'bg-transparent text-white/60 border-white/20 hover:border-cyan-400 hover:text-cyan-400'
                                                    }`}
                                            >
                                                {cart.find(c => c.id === product.id)
                                                    ? t('pavilion_ui.showroom.added', 'Added')
                                                    : t('pavilion_ui.showroom.add_to_order', 'Add to Order')}
                                            </button>

                                            <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                                                {product.modelPath ? (
                                                    <>
                                                        {t('pavilion_ui.view_details', 'View 3D')} <span className="text-lg">→</span>
                                                    </>
                                                ) : (
                                                    <span className="text-slate-500 cursor-default opacity-50">View Only</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* CHECKOUT MODAL */}
                {isCheckoutOpen && (
                    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-[#151515] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                            {!orderSubmitted ? (
                                <>
                                    <div className="p-6 border-b border-white/5 flex justify-between items-center">
                                        <h2 className="text-xl font-bold text-white font-[Orbitron]">{t('pavilion_ui.showroom.request_quote', 'REQUEST QUOTE')}</h2>
                                        <button onClick={() => setIsCheckoutOpen(false)} className="text-white/40 hover:text-white">✕</button>
                                    </div>
                                    <div className="p-6 space-y-6">
                                        <div className="space-y-2">
                                            <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-widest">{t('pavilion_ui.showroom.selected_items', 'Selected Items')} ({cart.length})</h3>
                                            <div className="max-h-32 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                                                {cart.map(item => (
                                                    <div key={item.id} className="flex justify-between items-center bg-white/5 p-2 rounded">
                                                        <span className="text-sm text-white">{item.title}</span>
                                                        <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-300 text-xs">{t('pavilion_ui.showroom.remove', 'Remove')}</button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                                            <div>
                                                <label className="block text-xs uppercase text-white/60 mb-1">{t('pavilion_ui.showroom.form_name', 'Full Name')}</label>
                                                <input
                                                    required
                                                    type="text"
                                                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:border-cyan-500 focus:outline-none transition-colors"
                                                    value={checkoutForm.name}
                                                    onChange={e => setCheckoutForm({ ...checkoutForm, name: e.target.value })}
                                                    placeholder={t('pavilion_ui.showroom.form_name_placeholder', 'Enter your name')}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs uppercase text-white/60 mb-1">{t('pavilion_ui.showroom.form_phone', 'Phone Number')}</label>
                                                <input
                                                    required
                                                    type="tel"
                                                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:border-cyan-500 focus:outline-none transition-colors"
                                                    value={checkoutForm.phone}
                                                    onChange={e => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
                                                    placeholder={t('pavilion_ui.showroom.form_phone_placeholder', '+1 (555) 000-0000')}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs uppercase text-white/60 mb-1">{t('pavilion_ui.showroom.form_email', 'Email Address')}</label>
                                                <input
                                                    required
                                                    type="email"
                                                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-white focus:border-cyan-500 focus:outline-none transition-colors"
                                                    value={checkoutForm.email}
                                                    onChange={e => setCheckoutForm({ ...checkoutForm, email: e.target.value })}
                                                    placeholder={t('pavilion_ui.showroom.form_email_placeholder', 'name@company.com')}
                                                />
                                            </div>

                                            <button
                                                type="submit"
                                                className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold uppercase tracking-widest rounded transition-colors shadow-[0_0_20px_rgba(34,211,238,0.3)] mt-2"
                                            >
                                                {t('pavilion_ui.showroom.submit', 'Submit Request')}
                                            </button>
                                        </form>
                                    </div>
                                </>
                            ) : (
                                <div className="p-12 flex flex-col items-center text-center space-y-6">
                                    <div className="w-16 h-16 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center border border-green-500/50">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white mb-2">{t('pavilion_ui.showroom.order_completed', 'Order Completed!')}</h2>
                                        <p className="text-white/60">{t('pavilion_ui.showroom.order_contact_msg', 'Company manager will contact you soon.')}</p>
                                    </div>
                                    <button
                                        onClick={resetCheckout}
                                        className="px-6 py-2 border border-white/10 hover:bg-white/10 rounded text-white text-sm transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (!currentProduct.id && products.length > 0) return null; // Safety

    return (
        <div className="relative w-full h-full bg-[#202020] overflow-hidden">
            {/* BACKGROUND GRADIENTS */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 z-0 pointer-events-none" />

            {/* 3D SCENE */}
            <div className="absolute inset-0 z-10">
                <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 1.0, 9], fov: 35 }}>
                    <Suspense fallback={null}>
                        <ShowroomStage currentProduct={currentProduct} isHeavy={isHeavy} />
                        <CameraHandler trigger={currentProduct.id} />
                        <OrbitControls
                            makeDefault
                            autoRotate
                            autoRotateSpeed={0.5}
                            enableDamping
                            dampingFactor={0.05}
                            minDistance={4}
                            maxDistance={15}
                            minPolarAngle={0}
                            maxPolarAngle={Math.PI / 1.7}
                            target={[0, 0, 0]}
                        />
                    </Suspense>
                </Canvas>
            </div>

            {/* --- UI LAYER (HUD) --- */}

            {/* Header */}
            <div className="absolute top-0 left-0 w-full p-8 z-50 flex justify-between items-start pointer-events-none">
                <button
                    onClick={() => {
                        SoundManager.playClick();
                        setViewMode('list');
                    }}
                    className="pointer-events-auto group flex items-center gap-3 transition-all hover:scale-105"
                >
                    <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-full pl-1 pr-6 py-1 hover:bg-black/60 hover:border-white/30 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-colors text-white">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        </div>
                        <span className="text-xs font-bold tracking-[0.2em] uppercase text-white/80 group-hover:text-white" style={{ fontFamily: 'Inter, "Segoe UI", Arial, sans-serif' }}>
                            {t('pavilion_ui.back', 'Back to List')}
                        </span>
                    </div>
                </button>

                <div className="text-right">
                    <h1 className="text-5xl font-black text-white tracking-tighter mb-1 font-[Orbitron] drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                        {t(`pavilion_content.pavilions.${pavilionSlug}.name`, { defaultValue: pavilionData?.name?.toUpperCase() || 'SHOWROOM' })}
                    </h1>
                    <div className="flex items-center justify-end gap-2 text-cyan-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] animate-pulse" />
                        <span className="text-[10px] font-bold tracking-[0.3em] uppercase">Premium Selection</span>
                    </div>
                </div>
            </div>

            {/* PRODUCT INFO PANEL (Bottom Left) */}
            <div className="absolute bottom-12 left-12 z-50 max-w-md pointer-events-none">
                <div
                    className="pointer-events-auto animate-in slide-in-from-left-10 fade-in duration-700"
                    style={{ fontFamily: 'Inter, "Segoe UI", Arial, sans-serif' }}
                >
                    <h2 className="text-4xl font-bold text-white mb-2 leading-none tracking-tight">
                        {productTitle}
                    </h2>
                    <p className="text-cyan-400 text-sm tracking-widest mb-4 uppercase" style={{ fontFamily: 'Inter, "Segoe UI", Arial, sans-serif' }}>
                        {currentProduct.category || t(`pavilion_content.pavilions.${pavilionSlug}.name`, { defaultValue: pavilionData?.name })} // SERIES NO. {activeIndex + 1}
                    </p>
                    <div className="h-px w-24 bg-gradient-to-r from-cyan-500 to-transparent mb-4" />
                    <p
                        className="text-gray-400 text-sm leading-relaxed mb-6 border-l-2 border-white/10 pl-4"
                        style={{ fontFamily: 'Inter, "Segoe UI", Arial, sans-serif' }}
                    >
                        {productDescription}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => {
                                if (isSeller) return;
                                SoundManager.playClick();
                                setShowChat(true);
                            }}
                            disabled={isSeller}
                            className={`px-6 py-3 text-black font-bold text-xs uppercase tracking-widest transition-colors shadow-[0_0_20px_rgba(34,211,238,0.4)] ${isSeller ? 'bg-gray-500 cursor-not-allowed opacity-60' : 'bg-cyan-500 hover:bg-cyan-400'}`}
                            title={isSeller ? t('pavilion_ui.seller_dashboard_only') : undefined}
                        >
                            {isSeller ? t('pavilion_ui.buyer_only_here') : t('pavilion_ui.inquire_now')}
                        </button>
                        <button
                            onClick={() => {
                                SoundManager.playClick();
                                setShowFeatures(true);
                            }}
                            className="px-6 py-3 border border-white/20 hover:border-white text-white font-bold text-xs uppercase tracking-widest transition-colors backdrop-blur-md bg-black/30"
                        >
                            {t('pavilion_ui.features')}
                        </button>
                    </div>
                </div>
            </div>

            {/* NAVIGATOR (Bottom Right) */}
            <div
                className="absolute bottom-24 right-12 z-50 flex items-center gap-6 pointer-events-auto"
                style={showChat ? { right: 'calc(420px + 3rem)' } : undefined}
            >
                <button
                    onClick={prevProduct}
                    className="w-14 h-14 rounded-full border border-white/10 bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-white hover:text-black transition-all hover:scale-110 active:scale-95"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>

                <div className="flex flex-col items-center">
                    <span className="text-2xl font-bold text-white font-[Orbitron]">
                        {(activeIndex + 1).toString().padStart(2, '0')}
                    </span>
                    <span className="text-[10px] text-white/40 tracking-[0.2em]">
                        / {products.length.toString().padStart(2, '0')}
                    </span>
                </div>

                <button
                    onClick={nextProduct}
                    className="w-14 h-14 rounded-full border border-white/10 bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-white hover:text-black transition-all hover:scale-110 active:scale-95"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
            </div>

            {/* Center Hint */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/20 text-[10px] uppercase tracking-[0.3em] font-medium pointer-events-none animate-pulse">
                Drag to Rotate • Scroll to Zoom
            </div>

            {!isSeller && showChat && (
                <div className="absolute inset-y-0 right-0 w-full md:w-[420px] z-50 bg-black/80 backdrop-blur-xl border-l border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] animate-in slide-in-from-right-8">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5">
                        <div>
                            <p className="text-[11px] uppercase tracking-[0.25em] text-cyan-300">{t('pavilion_ui.chat_with_supplier')}</p>
                            <p className="text-sm text-white/80 font-semibold">{t(`pavilion_content.pavilions.${pavilionSlug}.name`, { defaultValue: pavilionData?.name })}</p>
                        </div>
                        <button
                            onClick={() => setShowChat(false)}
                            className="text-white/70 hover:text-white px-3 py-1 rounded border border-white/15 text-sm"
                        >
                            {t('pavilion_ui.hide_chat')}
                        </button>
                    </div>
                    <div className="h-[calc(100%-56px)] p-4">
                        <LiveChat pavilionId={pavilionData?.id} pavilionSlug={pavilionSlug} user={user} />
                    </div>
                </div>
            )}

            {showFeatures && (
                <FeaturesModal
                    features={productFeatures}
                    title={productTitle}
                    onClose={() => setShowFeatures(false)}
                />
            )}

            <Loader dataInterpolation={(p) => `Loading Collection ${p.toFixed(0)}% `} />
        </div>
    );
}
