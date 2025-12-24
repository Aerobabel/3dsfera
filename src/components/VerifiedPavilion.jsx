import React, { Suspense, useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Canvas } from '@react-three/fiber';
import { useKeyboardControls, KeyboardControls, Preload, useGLTF, Environment, useProgress } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { supabase } from '../lib/supabaseClient';
import { resolveVerifiedDemoId } from '../lib/resolveVerifiedDemoId';

// Components
import SoundManager from './pavilion/SoundManager';
import MaintenanceDrone from './pavilion/MaintenanceDrone';
import KioskUnit from './pavilion/KioskUnit';
import ShowroomView from './pavilion/ShowroomView';
import InfographicOverlay from './pavilion/InfographicOverlay';
import { PAVILIONS } from './pavilion/pavilionData';
// RESTORED: Original Environment Imports
import { BackWallStructure, NeonCeiling, FloorArrows, IndustrialCeilingDetailsFixed, BackgroundBillboard, ReflectiveGridFloor, CeilingLights } from './pavilion/PavilionEnvironment';
import { ControlsWrapper, CameraPitchClamp } from './pavilion/PavilionControls';
import { CameraSmoother, FloatingAnnotation } from './pavilion/PavilionInteraction';
import { OrbitControls } from '@react-three/drei';

import ProductDisplay from './pavilion/ProductDisplay';
import { ConveyorBelt } from './pavilion/subsystems/ConveyorBelt';
import { FactoryPartition } from './pavilion/subsystems/FactoryPartition';
import { HeavyDutyRobot } from './pavilion/subsystems/HeavyDutyRobot';
import { HazardZone } from './pavilion/subsystems/HazardZone';
import CrateStack from './pavilion/subsystems/CrateStack';

// Assets
import tractorVideoUrl from '../assets/videos/Cyberpunk_Tractor_Video_Generation.mp4';
import logoVideoUrl from '../assets/videos/Logo_Video_Generation.mp4';
import aeroScreenUrl from '../assets/images/aero_screen.png'; // Static Screen Image
import aeroWallUrl from '../assets/images/aerowall.png';
import liftWallUrl from '../assets/images/liftwall.png';
const TURBO_ENGINE_PATH = '/objects/turbo_schaft_engine_ivchenko_al-20.glb';
const PNEUMATIC_PATH = '/objects/Pneumatic.glb';
const CRANE_PATH = '/objects/mobile_crane.glb';
const CRANE_MACHINE_PATH = '/objects/crane_machine.glb';
const VALVE_PATH = '/objects/valve.glb';

// Pre-load assets
useGLTF.preload(TURBO_ENGINE_PATH);
useGLTF.preload(CRANE_PATH);
useGLTF.preload(CRANE_MACHINE_PATH);

export default function VerifiedPavilion({ onBack, user }) {
    const { t } = useTranslation();
    const [selectedObject, setSelectedObject] = useState(null);
    const [inspectMode, setInspectMode] = useState(false); // New: Inspect Mode State
    const [orbitTarget, setOrbitTarget] = useState(null); // New: Target for Orbit Controls
    const [cameraPosition, setCameraPosition] = useState(null); // New: Smoother Target Cam Pos
    const [isOpen, setIsOpen] = useState(false); // Pavilion info overlay state
    const controlsRef = useRef(); // Ref for OrbitControls
    const [pavilionId, setPavilionId] = useState(null);
    const [isShowroomOpen, setIsShowroomOpen] = useState(false);
    const [showroomData, setShowroomData] = useState(null);
    const { progress, active } = useProgress();
    const [minHoldDone, setMinHoldDone] = useState(false);
    const [sceneReady, setSceneReady] = useState(false);
    const [showLoader, setShowLoader] = useState(true);

    // Tank Controls don't need pointer lock state for navigation
    const cameraRef = useRef();
    const velocityRef = useRef(new THREE.Vector3());

    // Resolve Pavilion ID
    useEffect(() => {
        if (user) {
            resolveVerifiedDemoId(supabase, user.id).then(setPavilionId);
        } else {
            // Fallback if no user, still needs supabase
            resolveVerifiedDemoId(supabase, null).then(setPavilionId);
        }
    }, [user]);

    // Init Audio
    useEffect(() => {
        const handleInteraction = () => {
            SoundManager.init();
            window.removeEventListener('click', handleInteraction);
        };
        window.addEventListener('click', handleInteraction);
        return () => window.removeEventListener('click', handleInteraction);
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => setMinHoldDone(true), 1200);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!active && minHoldDone && sceneReady) {
            const t = setTimeout(() => setShowLoader(false), 500);
            return () => clearTimeout(t);
        }
    }, [active, minHoldDone, sceneReady]);


    // --- HANDLERS ---

    const handleObjectClick = useCallback((data, position) => {
        SoundManager.playClick();
        setSelectedObject(data);

        // If position provided, enter inspect mode
        if (position) {
            setInspectMode(true);
            setOrbitTarget(position);
            // Calculate viewing angle: look from slightly above and back
            const viewOffset = [position[0], position[1] + 2.5, position[2] + 8.0]; // Better camera distance for visibility
            setCameraPosition(viewOffset);
        }
    }, []);

    const closeInspectMode = () => {
        setInspectMode(false);
        setSelectedObject(null);
        setOrbitTarget(null);
        setCameraPosition(null);
        setIsOpen(false);
    };

    const closeOverlayOnly = () => {
        setIsOpen(false);
        // Keep inspect mode active after closing overlay
    };

    const openFullOverlay = () => {
        // Instead of opening another overlay, directly enter the showroom
        setShowroomData(selectedObject);
        setIsShowroomOpen(true);
    };

    const handleBack = () => {
        SoundManager.playClick();
        onBack();
    };

    // Keyboard Map
    const keyboardMap = useMemo(() => [
        { name: 'forward', keys: ['ArrowUp', 'w', 'W'] },
        { name: 'backward', keys: ['ArrowDown', 's', 'S'] },
        { name: 'left', keys: ['ArrowLeft', 'a', 'A'] },
        { name: 'right', keys: ['ArrowRight', 'd', 'D'] },
        { name: 'jump', keys: ['Space'] },
        { name: 'run', keys: ['Shift'] },
    ], []);



    return (
        <div id="game-container" className="w-full h-screen bg-black relative select-none overflow-hidden">

            {/* Header / HUD */}
            <div className="absolute top-0 left-0 w-full p-6 z-10 flex justify-between items-start pointer-events-none">
                <div className="pointer-events-auto">
                    <button
                        onClick={handleBack}
                        onMouseEnter={() => SoundManager.playHover()}
                        className="px-6 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded text-white font-bold hover:bg-white/20 transition flex items-center gap-2 group"
                    >
                        <svg className="w-5 h-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        {t('pavilion_ui.back')}
                    </button>
                </div>

                <div className="pointer-events-auto flex gap-4">
                    <div className="text-right px-5 py-4 bg-gradient-to-br from-[#0a192f]/70 via-[#0c223d]/60 to-[#0a1020]/70 backdrop-blur-xl border border-cyan-400/15 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.55)] animate-fadeIn">
                        <div className="flex items-center justify-end gap-2">
                            <div className="w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.9)]" />
                            <span className="text-[11px] tracking-[0.25em] text-cyan-200/80 uppercase">live link</span>
                        </div>
                        <div className="mt-2 text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-blue-300 to-indigo-400 tracking-tight drop-shadow-[0_0_12px_rgba(56,189,248,0.45)] font-[Orbitron]">
                            3DSFERA
                        </div>
                        <div className="text-[11px] text-slate-200/80 tracking-[0.18em] font-semibold mt-1">
                            Verified Supplier Pavilion
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation hint (bottom-left) */}
            <div className="absolute bottom-6 left-6 z-10 pointer-events-none">
                <div className="bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white/80 backdrop-blur-md shadow-lg max-w-sm space-y-1">
                    <div className="text-[10px] uppercase tracking-[0.25em] text-cyan-300 font-semibold">{t('verified_pavilion.ui_nav.nav_title')}</div>
                    <div>{t('verified_pavilion.ui_nav.nav_forward')}</div>
                    <div>{t('verified_pavilion.ui_nav.nav_backward')}</div>
                    <div>{t('verified_pavilion.ui_nav.nav_orbit')}</div>
                    <div>{t('verified_pavilion.ui_nav.nav_inspect')}</div>
                </div>
            </div>

            <KeyboardControls map={keyboardMap}>
                <Canvas
                    shadows
                    camera={{ position: [0, 1.7, 15], fov: 60 }}
                    dpr={[1, 1.5]}
                    gl={{
                        antialias: false,
                        toneMapping: THREE.ReinhardToneMapping,
                        toneMappingExposure: 1.5,
                        stencil: false,
                        depth: true
                    }}
                    onCreated={() => setSceneReady(true)}
                >
                    <Suspense fallback={null}>
                        {/* --- ENVIRONMENT (RESTORED DARK) --- */}
                        <color attach="background" args={['#2a2a2a']} />
                        <fogExp2 attach="fog" args={['#2a2a2a', 0.015]} />
                        <Environment preset="city" />

                        <ambientLight intensity={1.5} />
                        <directionalLight
                            position={[20, 30, 10]}
                            intensity={2}
                            castShadow
                            shadow-mapSize={[2048, 2048]}
                            shadow-bias={-0.0001}
                        />

                        {/* --- ORIGINAL SCENE COMPONENTS --- */}
                        <ReflectiveGridFloor />
                        <BackgroundBillboard />
                        <BackWallStructure />
                        <NeonCeiling />
                        {/* <FloorArrows /> REMOVED */}
                        <IndustrialCeilingDetailsFixed />
                        <CeilingLights />

                        {/* --- DYNAMIC ELEMENETS --- */}

                        {/* Drones */}
                        <MaintenanceDrone color="#00ffff" startAngle={0} yOffset={6} radius={12} speed={0.2} />
                        <MaintenanceDrone color="#ff00ff" startAngle={Math.PI} yOffset={8} radius={18} speed={-0.15} />

                        {/* --- PRODUCT SHOWCASE ON FLOOR --- */}
                        {/* 2. Construction Crane on Right (Yellow) */}
                        <ProductDisplay
                            modelPath={CRANE_MACHINE_PATH}
                            position={[15, 0.1, 18]}
                            rotation={[0, -Math.PI / 4, 0]}
                            scale={0.35}
                            floating={true}
                            heightOffset={0.8} // Raise it up a bit from pedestal
                            onClick={(e) => {
                                e.stopPropagation();
                                const position = [15, 0.1, 18];
                                if (inspectMode && orbitTarget && orbitTarget[0] === position[0] && orbitTarget[2] === position[2]) return;
                                SoundManager.playClick();
                                setSelectedObject(PAVILIONS['heavy']);
                                setInspectMode(true);
                                setOrbitTarget(position);
                                setCameraPosition([position[0], position[1] + 2.5, position[2] + 8.0]);
                            }}
                            onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
                            onPointerOut={(e) => { e.stopPropagation(); document.body.style.cursor = 'auto'; }}
                        />

                        {/* 3. Valve on Floor */}
                        <ProductDisplay
                            modelPath={VALVE_PATH}
                            position={[-10, 0, 10]} // Ground level
                            rotation={[0, Math.PI / 3, 0]}
                            scale={0.15} // Reduced size by a lot
                            heightOffset={-0.9} // Reduce distance to pedestal
                            onClick={(e) => {
                                e.stopPropagation();
                                const position = [-10, 0, 10];
                                if (inspectMode && orbitTarget && orbitTarget[0] === position[0] && orbitTarget[2] === position[2]) return;
                                SoundManager.playClick();
                                setSelectedObject(PAVILIONS['aero']);
                                setInspectMode(true);
                                setOrbitTarget(position);
                                setCameraPosition([position[0], position[1] + 2.5, position[2] + 8.0]);
                            }}
                            onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
                            onPointerOut={(e) => { e.stopPropagation(); document.body.style.cursor = 'auto'; }}
                        />

                        {/* --- FACTORY FLOOR EXPANSION --- */}

                        {/* Zone 1: Assembly Line (Left) */}
                        <group position={[-10, 0, 8]} rotation={[0, 0.2, 0]}>
                            <HazardZone width={8} length={14} position={[1.5, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} />
                            <ConveyorBelt length={12} position={[0, 0, 0]} />
                            <ConveyorBelt length={12} position={[3, 0, 0]} />
                            {/* Partitions behind */}
                            <FactoryPartition position={[-2, 0, -3]} rotation={[0, 0, 0]} width={6} />
                            <FactoryPartition position={[4, 0, -3]} rotation={[0, 0, 0]} width={6} />
                        </group>

                        {/* Zone 2: Heavy Robotics (Right Foreground) */}
                        <group position={[12, 0, 12]} rotation={[0, -Math.PI / 3, 0]}>
                            <HazardZone width={5} length={5} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} />
                            <HeavyDutyRobot scale={1.2} />
                        </group>

                        {/* Zone 3: Storage Area (Back Left) */}
                        <group position={[-20, 0, -10]}>
                            <FactoryPartition position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]} width={8} />
                            <ConveyorBelt length={8} position={[2, 0, 0]} rotation={[0, Math.PI / 2, 0]} />
                        </group>

                        {/* Zone 4: Logistics Staging (Front Left - NEW) */}
                        <group position={[-25, 0, 15]} rotation={[0, 0.4, 0]}>
                            <HazardZone width={10} length={10} position={[0, 0.02, 0]} />
                            <CrateStack position={[-2, 0, -2]} rotation={[0, 0.1, 0]} />
                            <CrateStack position={[3, 0, 2]} rotation={[0, -0.2, 0]} />
                            <HeavyDutyRobot position={[4, 0, -3]} scale={0.8} rotation={[0, Math.PI, 0]} />
                        </group>

                        {/* --- BOOTHS / KIOSKS (Default Cyberpunk) --- */}

                        {/* Center Hero Booth (3dsfera) */}
                        <KioskUnit
                            position={[0, 0, -5]}
                            rotation={[0, 0, 0]}
                            title="3DSFERA"
                            glowColor="#00ffff"
                            videoUrl={logoVideoUrl}
                            roofColor="white"
                            isTv={true} // Enable TV display inside kiosk
                            onClick={(e) => {
                                e.stopPropagation();
                                const position = [0, 0, -5];
                                if (inspectMode && orbitTarget && orbitTarget[0] === position[0] && orbitTarget[2] === position[2]) return;
                                SoundManager.playClick();
                                setSelectedObject(PAVILIONS['3dsfera']);
                                setInspectMode(true);
                                setOrbitTarget(position);
                                setCameraPosition([position[0], position[1] + 2.5, position[2] + 8.0]);
                            }}
                            onProductClick={(e) => {
                                e.stopPropagation();
                                if (inspectMode && selectedObject === PAVILIONS['3dsfera']) return;
                                SoundManager.playClick();
                                const position = [0, 0, -5];
                                setSelectedObject(PAVILIONS['3dsfera']);
                                setInspectMode(true);
                                setOrbitTarget(position);
                                setCameraPosition([position[0], position[1] + 2.5, position[2] + 8.0]);
                            }}
                        />

                        {/* Left Booth (Turbo Engine) */}
                        <KioskUnit
                            position={[-22, 0, 0]}
                            rotation={[0, Math.PI / 6, 0]}
                            title="AERO DYNAMICS"
                            glowColor="#ff0055"
                            roofColor="white"
                            imageUrl={aeroWallUrl} // Static Image
                            modelPath={VALVE_PATH} // Changed to Valve per request
                            modelPosition={[0, 0.4, 0]} // Reduced height (was 0.8)
                            productScale={0.15} // Way smaller per request
                            hideSideModels={true} // Only one per request
                            // hideMainPedestal={true} // Restored pedestal per "on the custom pedestals" request
                            onClick={(e) => {
                                e.stopPropagation();
                                const position = [-22, 0, 0];
                                if (inspectMode && orbitTarget && orbitTarget[0] === position[0] && orbitTarget[2] === position[2]) return;
                                SoundManager.playClick();
                                setSelectedObject(PAVILIONS['aero']);
                                setInspectMode(true);
                                setOrbitTarget(position);
                                setCameraPosition([position[0], position[1] + 2.5, position[2] + 8.0]);
                            }}
                            onProductClick={(e) => {
                                e.stopPropagation();
                                if (inspectMode && selectedObject === PAVILIONS['aero']) return;
                                SoundManager.playClick();
                                const position = [-22, 0, 0];
                                setSelectedObject(PAVILIONS['aero']);
                                setInspectMode(true);
                                setOrbitTarget(position);
                                setCameraPosition([position[0], position[1] + 2.5, position[2] + 8.0]);
                            }}
                        />

                        {/* Right Booth (Heavy Machinery) */}
                        <KioskUnit
                            position={[22, 0, 0]}
                            rotation={[0, -Math.PI / 6, 0]}
                            title="HEAVY LIFT"
                            glowColor="#ffaa00"
                            roofColor="white"
                            imageUrl={liftWallUrl} // Custom wall image
                            // modelPath={CRANE_MACHINE_PATH} 
                            isRoboticArm={true} // Restored Industrial Robot
                            modelPosition={[0, 0.5, 0]}
                            hideSideModels={true}
                            onClick={(e) => {
                                e.stopPropagation();
                                const position = [22, 0, 0];
                                if (inspectMode && orbitTarget && orbitTarget[0] === position[0] && orbitTarget[2] === position[2]) return;
                                SoundManager.playClick();
                                setSelectedObject(PAVILIONS['heavy']);
                                setInspectMode(true);
                                setOrbitTarget(position);
                                setCameraPosition([position[0], position[1] + 2.5, position[2] + 8.0]);
                            }}
                            onProductClick={(e) => {
                                e.stopPropagation();
                                if (inspectMode) return;
                                SoundManager.playClick();
                                const position = [22, 0, 0];
                                setSelectedObject(PAVILIONS['heavy']);
                                setInspectMode(true);
                                setOrbitTarget(position);
                                setCameraPosition([position[0], position[1] + 2.5, position[2] + 8.0]);
                            }}
                        />


                        {/* --- CONTROLS SWITCH --- */}
                        {!inspectMode ? (
                            <ControlsWrapper
                                velocityRef={velocityRef}
                                cameraRef={cameraRef}
                            />
                        ) : (
                            <OrbitControls
                                ref={controlsRef}
                                target={orbitTarget}
                                enablePan={false}
                                enableZoom={true}
                                minDistance={2}
                                maxDistance={10}
                                maxPolarAngle={Math.PI / 2 - 0.1} // Don't go below floor
                                minPolarAngle={Math.PI / 3} // Restrict top-down view (60 degrees from top)
                            />
                        )}

                        <CameraSmoother
                            controlsRef={controlsRef}
                            targetPosition={orbitTarget}
                            cameraPosition={cameraPosition}
                            isActive={inspectMode}
                        />

                        {/* 3D Floating UI - Offset to the SIDE */}
                        <FloatingAnnotation
                            visible={inspectMode && selectedObject && !isOpen && !isShowroomOpen}
                            pavilionName={selectedObject?.name}
                            title={selectedObject?.title}
                            description={selectedObject?.description}
                            stats={selectedObject?.stats}
                            // Move UI 3.5 units to the Right (X) and slightly up (Y) relative to target
                            position={orbitTarget ? [orbitTarget[0] + 3.5, orbitTarget[1] + 1.0, orbitTarget[2]] : [0, 0, 0]}
                            onDetailsClick={openFullOverlay}
                        />

                        <Preload all />
                    </Suspense>

                    {/* POST PROCESSING */}
                    <EffectComposer disableNormalPass>
                        <Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} radius={0.4} />
                        <Noise opacity={0.05} />
                        <Vignette eskil={false} offset={0.1} darkness={0.6} />
                    </EffectComposer>
                </Canvas>
            </KeyboardControls>

            {/* OVERLAYS */}
            {isOpen && !isShowroomOpen && (
                <InfographicOverlay
                    data={selectedObject}
                    isOpen={isOpen}
                    onClose={closeOverlayOnly} // Close overlay but keep inspect mode
                    realPavilionId={pavilionId}
                    user={user}
                    startMode="info"
                    onEnterRoom={() => {
                        setShowroomData(selectedObject);
                        setIsShowroomOpen(true);
                    }}
                />
            )}

            {/* Exit Inspect Button (visible when not in overlay) */}
            {inspectMode && !isOpen && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-auto animate-fadeIn">
                    <button
                        onClick={closeInspectMode}
                        className="px-6 py-2 bg-black/60 border border-white/20 rounded-full text-white text-xs tracking-widest hover:bg-white/10 transition backdrop-blur-md"
                    >
                        {t('verified_pavilion.loader.exit_inspection')}
                    </button>
                    <p className="text-center text-[10px] text-white/40 mt-2 uppercase tracking-widest">
                        {t('verified_pavilion.ui_nav.nav_hint')}
                    </p>
                </div>
            )}

            {showLoader && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md text-white">
                    <div className="relative w-full max-w-lg px-8 py-10 border border-cyan-400/20 rounded-3xl bg-white/5 shadow-[0_20px_80px_rgba(0,0,0,0.65)]">
                        <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-cyan-200/80 mb-4">
                            <span>{t('verified_pavilion.loader.title')}</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500 transition-all duration-200"
                                style={{ width: `${Math.min(Math.max(progress, 5), 100)}%` }}
                            />
                        </div>
                        <div className="mt-6 text-sm text-slate-200/80 space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-cyan-300 animate-pulse" />
                                <span>{t('verified_pavilion.loader.asset')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-cyan-300 animate-pulse" />
                                <span>{t('verified_pavilion.loader.chat')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-cyan-300 animate-pulse" />
                                <span>{t('verified_pavilion.loader.standby', { state: active ? t('verified_pavilion.loader.state_streaming') : t('verified_pavilion.loader.state_priming') })}</span>
                            </div>
                        </div>

                        <div className="mt-8 border border-white/10 rounded-2xl p-4 bg-black/30">
                            <div className="text-[10px] uppercase tracking-[0.3em] text-cyan-200 mb-2">{t('verified_pavilion.loader.controls')}</div>
                            <div className="grid grid-cols-2 gap-2 text-xs text-slate-100">
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-1 rounded bg-white/10 border border-white/10">W / Up</span>
                                    <span>{t('verified_pavilion.loader.forward')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-1 rounded bg-white/10 border border-white/10">S / Down</span>
                                    <span>{t('verified_pavilion.loader.backward')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-1 rounded bg-white/10 border border-white/10">A / Left</span>
                                    <span>{t('verified_pavilion.loader.orbit_left')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-1 rounded bg-white/10 border border-white/10">D / Right</span>
                                    <span>{t('verified_pavilion.loader.orbit_right')}</span>
                                </div>
                                <div className="col-span-2 text-slate-300 text-xs mt-1">{t('verified_pavilion.loader.inspect_hint')}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Showroom Overlay - Renders ON TOP of Canvas so scene doesn't unmount */}
            {isShowroomOpen && (
                <div className="absolute inset-0 z-50 bg-black animate-in fade-in duration-300">
                    <ShowroomView
                        pavilionData={showroomData}
                        onBack={() => {
                            setIsShowroomOpen(false);
                            closeInspectMode();
                        }}
                        user={user}
                    />
                </div>
            )}
        </div >
    );
}












