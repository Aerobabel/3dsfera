import React, { useState, Suspense, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Float, ContactShadows, Environment, Loader, Center, Resize, Sphere, Grid } from '@react-three/drei';
import * as THREE from 'three';
import ProductModel from './ProductModel';
import SoundManager from './SoundManager';
import LiveChat from './LiveChat';

// ... imports
import { HeavyDutyRobot } from './subsystems/HeavyDutyRobot';
import { PlatformDemoModel } from './subsystems/PlatformDemoModel';
import { Microwave } from './subsystems/Microwave';
import { Television } from './subsystems/Television';

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

                    {/* Industrial Turntable Base */}
                    <group position={[0, -2.55, 0]}>
                        {/* Main Base Cylinder */}
                        <mesh receiveShadow>
                            <cylinderGeometry args={[3.2, 3.5, 0.2, 64]} />
                            <meshStandardMaterial color="#2a2a2a" metalness={0.8} roughness={0.2} />
                        </mesh>
                        {/* Inner Detail Ring */}
                        <mesh position={[0, 0.11, 0]}>
                            <cylinderGeometry args={[2.5, 2.5, 0.05, 64]} />
                            <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.8} />
                        </mesh>
                        {/* Thin Rim Light (Subtle) */}
                        <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                            <torusGeometry args={[3.2, 0.02, 16, 64]} />
                            <meshBasicMaterial color="#ffffff" opacity={0.3} transparent />
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
            <Environment preset="studio" />

            <Grid
                position={[0, -2.55, 0]}
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

    useEffect(() => {
        if (isSeller) setShowChat(false);
    }, [isSeller]);

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
                    onClick={onBack}
                    className="pointer-events-auto group flex items-center gap-3 text-white/50 hover:text-white transition-all hover:scale-105"
                >
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </div>
                    <span className="text-xs font-bold tracking-[0.2em] uppercase" style={{ fontFamily: 'Inter, "Segoe UI", Arial, sans-serif' }}>
                        {t('pavilion_ui.exit_showroom', 'Exit Showroom')}
                    </span>
                </button>

                <div className="text-right">
                    <h1 className="text-5xl font-black text-white tracking-tighter mb-1 font-[Orbitron] drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                        {pavilionData?.name?.toUpperCase() || 'SHOWROOM'}
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
                        {currentProduct.category || pavilionData?.name} // SERIES NO. {activeIndex + 1}
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
                        <button className="px-6 py-3 border border-white/20 hover:border-white text-white font-bold text-xs uppercase tracking-widest transition-colors backdrop-blur-md bg-black/30">
                            Specs
                        </button>
                    </div>
                </div>
            </div>

            {/* NAVIGATOR (Bottom Right) */}
            <div
                className="absolute bottom-12 right-12 z-50 flex items-center gap-6 pointer-events-auto"
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
                            <p className="text-sm text-white/80 font-semibold">{pavilionData?.name}</p>
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

            <Loader dataInterpolation={(p) => `Loading Collection ${p.toFixed(0)}% `} />
        </div>
    );
}
