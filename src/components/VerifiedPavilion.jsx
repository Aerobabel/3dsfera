import React, { Suspense, useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Preload, useGLTF, useProgress, PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer, Bloom, Vignette, Noise, DepthOfField } from '@react-three/postprocessing';
import { supabase } from '../lib/supabaseClient';
import { resolveVerifiedDemoId } from '../lib/resolveVerifiedDemoId';

// Components
import SoundManager from './pavilion/SoundManager';
import MaintenanceDrone from './pavilion/MaintenanceDrone';
import KioskUnit from './pavilion/KioskUnit';
import ShowroomView from './pavilion/ShowroomView';
import InfographicOverlay from './pavilion/InfographicOverlay';
import { PAVILIONS } from './pavilion/pavilionData';
import { OrbitControls } from '@react-three/drei';
import { CameraSmoother, InspectionCard } from './pavilion/PavilionInteraction';


import ProductDisplay from './pavilion/ProductDisplay';
import { ConveyorBelt } from './pavilion/subsystems/ConveyorBelt';
import { FactoryPartition } from './pavilion/subsystems/FactoryPartition';


import WalkingMan from './pavilion/WalkingMan';
import HologramGuide from './pavilion/HologramGuide';

import { CameraManager } from './pavilion/CameraManager';
import { SceneReadyNotifier } from './pavilion/PavilionUtils';
import { PavilionArchitecture } from './pavilion/PavilionArchitecture';

// Assets

// Generated Kiosk Screens
import kioskSecurityUrl from '../assets/images/kiosk_security.png';
import kioskResearchUrl from '../assets/images/kiosk_research.png';
import kioskDataUrl from '../assets/images/kiosk_data.png';
import kioskManufacturingUrl from '../assets/images/kiosk_manufacturing.png';
import kioskAiUrl from '../assets/images/kiosk_ai.png';
import kioskQuantumUrl from '../assets/images/kiosk_quantum.png';
import kioskBiotechUrl from '../assets/images/kiosk_biotech.png';
import kioskEnergyUrl from '../assets/images/kiosk_energy.png';
import kioskLogisticsUrl from '../assets/images/kiosk_logistics.png';

// Legacy/Placeholder Assets (Required for main kiosks)
import aeroWallUrl from '../assets/images/aerowall.png';
import liftWallUrl from '../assets/images/liftwall.png';


const TURBO_ENGINE_PATH = '/objects/turbo_schaft_engine_ivchenko_al-20.glb';
const PNEUMATIC_PATH = '/objects/optimized/Pneumatic.glb';
const CRANE_PATH = '/objects/optimized/mobile_crane.glb';
const CRANE_MACHINE_PATH = '/objects/optimized/crane_machine.glb';
const ROAD_GRADER_PATH = '/objects/optimized/road_grader.glb';
const VALVE_PATH = '/objects/valve.glb';
const CAMERA_PATH = '/objects/optimized/camera.glb';
const DRONE_PATH = '/objects/drone.glb';
const ESCAVATOR_PATH = '/objects/optimized/escavator.glb';

// Pre-load assets
// Pre-load assets
// useGLTF.preload(TURBO_ENGINE_PATH);
// useGLTF.preload(CRANE_PATH);
// useGLTF.preload(CRANE_MACHINE_PATH);
// useGLTF.preload(ESCAVATOR_PATH);

export default function VerifiedPavilion({ onBack, user }) {
    const { t } = useTranslation();
    const [dpr, setDpr] = useState(1.5); // Performance Monitor State
    const [selectedObject, setSelectedObject] = useState(null);
    const [inspectMode, setInspectMode] = useState(false); // New: Inspect Mode State
    const [isTransitioning, setTransitioning] = useState(false);
    const [savedCameraState, setSavedCameraState] = useState(null); // Save cam before inspect
    const [captureReq, setCaptureReq] = useState(false); // Trigger for camera capture
    const [pendingData, setPendingData] = useState(null); // Data waiting for capture
    const [orbitTarget, setOrbitTarget] = useState(null); // New: Target for Orbit Controls
    const [cameraPosition, setCameraPosition] = useState(null); // New: Smoother Target Cam Pos
    const [isOpen, setIsOpen] = useState(false); // Pavilion info overlay state
    const controlsRef = useRef(); // Ref for OrbitControls
    const [pavilionId, setPavilionId] = useState(null);
    const [isShowroomOpen, setIsShowroomOpen] = useState(false);
    const [showroomData, setShowroomData] = useState(null);
    const { progress, active } = useProgress();
    const [visualProgress, setVisualProgress] = useState(0); // Smooth progress
    const [minHoldDone, setMinHoldDone] = useState(false);
    const [sceneReady, setSceneReady] = useState(false);
    const [showLoader, setShowLoader] = useState(true);
    const [showWelcome, setShowWelcome] = useState(true); // New Welcome State

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

    // Smooth Progress Logic: Prevent backtracking
    useEffect(() => {
        if (progress === 0 && !active) return; // Ignore reset
        setVisualProgress(prev => {
            const next = Math.max(prev, progress);
            return next > 99 ? 100 : next;
        });
    }, [progress, active]);

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

    const handleCameraCaptured = useCallback((capturedState) => {
        // 2. Camera is saved. Now transition.
        setSavedCameraState(capturedState);
        setCaptureReq(false);

        if (pendingData) {
            const { data, position } = pendingData;
            SoundManager.playClick();
            setSelectedObject(data);

            if (position) {
                setInspectMode(true);
                setOrbitTarget(position);
                const viewOffset = [position[0], position[1] + 2.5, position[2] + 8.0];
                setCameraPosition(viewOffset);
            }
        }
        setPendingData(null);
    }, [pendingData]);

    const handleObjectClick = useCallback((data, position) => {
        // 1. Request Capture first. Don't move yet.
        setPendingData({ data, position });
        setCaptureReq(true);
    }, []);

    const closeInspectMode = () => {
        if (savedCameraState) {
            setTransitioning(true);
        }
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

    const openShowroom = (pavilion) => {
        // Ensure we carry the real pavilion id for Supabase chat; preserve slug for filtering
        const resolvedId = pavilionId || pavilion?.id;
        setShowroomData({ ...pavilion, id: resolvedId, slug: pavilion?.slug || pavilion?.id });
        setIsShowroomOpen(true);
    };

    const openFullOverlay = () => {
        // Instead of opening another overlay, directly enter the showroom
        openShowroom(selectedObject);
    };

    const handleBack = () => {
        SoundManager.playClick();
        onBack();
    };





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
                            <span className="text-[11px] tracking-[0.25em] text-cyan-200/80 uppercase">{t('verified_pavilion.ui.live_link', 'LIVE LINK')}</span>
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
            <div className="absolute bottom-10 left-10 z-10 pointer-events-none">
                <div className="bg-black/70 border border-white/20 rounded-xl px-6 py-5 text-sm text-white/90 backdrop-blur-md shadow-2xl max-w-sm space-y-2">
                    <div className="text-xs uppercase tracking-[0.25em] text-cyan-300 font-bold mb-2 border-b border-white/10 pb-2">{t('verified_pavilion.ui_nav.nav_title')}</div>
                    <div className="flex items-center gap-3"><span className="font-mono text-cyan-400 font-bold">LMB</span> {t('verified_pavilion.ui_nav.nav_orbit', 'Rotate')}</div>
                    <div className="flex items-center gap-3"><span className="font-mono text-cyan-400 font-bold">RMB</span> {t('verified_pavilion.ui_nav.nav_pan', 'Pan')}</div>
                    <div className="flex items-center gap-3"><span className="font-mono text-cyan-400 font-bold">Scroll</span> {t('verified_pavilion.ui_nav.nav_zoom', 'Zoom')}</div>
                    {/* <div className="text-xs opacity-60 mt-1">{t('verified_pavilion.ui_nav.nav_inspect')}</div> */}
                </div>
            </div>


            <Canvas
                shadows
                camera={{ position: [0, 2.5, 45], fov: 60 }}
                dpr={dpr}
                gl={{
                    antialias: false,
                    toneMapping: THREE.ACESFilmicToneMapping, // MOVIE-QUALITY TONE MAPPING
                    toneMappingExposure: 1.0,
                    stencil: false,
                    depth: true
                }}
            // Removed onCreated to wait for real frames via SceneReadyNotifier
            >
                <PerformanceMonitor onIncline={() => setDpr(1.5)} onDecline={() => setDpr(0.75)}>
                    <Suspense fallback={null}>
                        <SceneReadyNotifier onReady={() => setSceneReady(true)} />

                        {/* --- ENVIRONMENT (RESTORED DARK) --- */}


                        {/* --- CINEMATIC GROUNDING --- */}


                        {/* --- ORIGINAL SCENE COMPONENTS --- */}
                        <PavilionArchitecture />
                        {/* <BackgroundBillboard /> REMOVED for depth */}
                        {/* <BackWallStructure /> REMOVED for depth */}
                        {/* <NeonCeiling /> REMOVED per user request */}
                        {/* <FloorArrows /> REMOVED */}


                        {/* --- NEW ATMOSPHERE: GLOWING SPHERE & VOID FILL --- */}

                        {/* The Sun / Sphere - Removed to debug artifacts */}



                        {/* --- DYNAMIC ELEMENETS --- */}

                        {/* Drones RESTORED */}
                        <MaintenanceDrone color="#00ffff" startAngle={0} yOffset={6} radius={12} speed={0.2} />
                        <MaintenanceDrone color="#ff00ff" startAngle={Math.PI} yOffset={8} radius={18} speed={-0.15} />

                        {/* --- PRODUCT SHOWCASE ON FLOOR --- */}
                        {/* 2. Road Grader on Right (Replacing Crane) */}
                        {/* 2. Construction Crane on Right (Restored) */}
                        <ProductDisplay
                            modelPath={CRANE_MACHINE_PATH}
                            position={[22, 0.1, 2]}
                            rotation={[0, -Math.PI / 4, 0]}
                            scale={0.35}
                            floating={true}
                            heightOffset={0.8} // Raise it up a bit from pedestal
                            onClick={(e) => {
                                const position = [22, 0.1, 2]; // Update click target matches new pos
                                if (inspectMode && orbitTarget && orbitTarget[0] === position[0] && orbitTarget[2] === position[2]) {
                                    return;
                                }
                                e.stopPropagation();
                                console.log("Clicked Crane - Taking selection");
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
                                const position = [-10, 0, 10];
                                if (inspectMode && orbitTarget && orbitTarget[0] === position[0] && orbitTarget[2] === position[2]) return;
                                e.stopPropagation();
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
                            {/* Removed HazardZone */}
                            <ConveyorBelt length={12} position={[0, 0, 0]} />
                            <ConveyorBelt length={12} position={[3, 0, 0]} />
                            {/* Partitions behind */}
                            <FactoryPartition position={[-2, 0, -3]} rotation={[0, 0, 0]} width={6} />
                            <FactoryPartition position={[4, 0, -3]} rotation={[0, 0, 0]} width={6} />
                        </group>

                        {/* 3DSFERA foyer mat: place excavator on the yellow pad to the right-front of the central kiosk */}


                        {/* Zone 3: Storage Area (Back Left) */}
                        <group position={[-20, 0, -10]}>
                            <FactoryPartition position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]} width={8} />
                            <ConveyorBelt length={8} position={[2, 0, 0]} rotation={[0, Math.PI / 2, 0]} />
                        </group>





                        {/* Zone 6: Far Left Machinery */}
                        <group position={[-25, 0, -20]}>
                            {/* Removed ConveyorBelt & Robot */}
                        </group>


                        {/* --- ANIMATED CHARACTERS --- */}
                        {/* Character 1: Wandering the main left aisle */}
                        {/* Character 1: Wandering the main left aisle (SAFE ZONE: Left of Conveyor) */}
                        {/* Character 1: Far Left Lane (Relocated: Behind Kiosks to avoid partitions entirely) */}
                        {/* Character 1: Wandering the main left aisle */}
                        {/* Character 1: Wandering the main left aisle */}
                        {sceneReady && (
                            <Suspense fallback={null}>
                                <WalkingMan
                                    startPosition={[-42, 0, 0]}
                                    bounds={{ x: [-46, -40], z: [-20, 20] }} // Adjusted Left to avoid AI Kiosk (x=-34)
                                    speed={1.0}
                                />

                                {/* Character 2: Back Crosswalk */}
                                <WalkingMan
                                    startPosition={[0, 0, -15]}
                                    bounds={{ x: [-8, 8], z: [-25, -18] }} // Narrowed center path
                                    speed={0.8}
                                />

                                {/* Character 3: Far Right Aisle */}
                                <WalkingMan
                                    startPosition={[32, 0, 0]}
                                    bounds={{ x: [30, 35], z: [-12, 25] }} // Pulled in from right wall
                                    speed={1.0}
                                />
                            </Suspense>
                        )}

                        {/* Standing on the central platform greeting users */}
                        <HologramGuide position={[0, 0.9, 12]} rotation={[0, 0, 0]} scale={0.013} />

                        {/* --- BOOTHS / KIOSKS (Default Cyberpunk) --- */}

                        {/* --- CENTRAL PLATFORM (Staired Dais) --- */}
                        <group position={[0, 0, 10]}>
                            {/* Step 1 (Bottom) */}
                            <mesh receiveShadow castShadow position={[0, 0.125, 0]}>
                                <cylinderGeometry args={[7, 7.5, 0.25, 64]} />
                                <meshStandardMaterial color="#e0e0e0" roughness={0.5} metalness={0.1} />
                            </mesh>
                            {/* Step 2 (Middle) */}
                            <mesh receiveShadow castShadow position={[0, 0.375, 0]}>
                                <cylinderGeometry args={[5, 5.5, 0.25, 64]} />
                                <meshStandardMaterial color="#e0e0e0" roughness={0.5} metalness={0.1} />
                            </mesh>
                            {/* Step 3 (Top) */}
                            <mesh receiveShadow castShadow position={[0, 0.625, 0]}>
                                <cylinderGeometry args={[3, 3.5, 0.25, 64]} />
                                <meshStandardMaterial color="#e0e0e0" roughness={0.5} metalness={0.1} />
                            </mesh>
                        </group>

                        {/* Center Hero Booth (3dsfera) */}
                        {/* Center Hero Booth (3dsfera) - Now Info Desk */}
                        <KioskUnit
                            position={[0, 0, -5]}
                            rotation={[0, 0, 0]}
                            title={t('pavilion_content.pavilions.3dsfera.name', "3DSFERA")}
                            glowColor="#00ffff"
                            roofColor="white"
                            type="info-desk"
                            interactable={false}
                        />

                        {/* 2. Mid Left: AERO DYNAMICS */}
                        <KioskUnit
                            position={[-25, 0, -5]}
                            rotation={[0, Math.PI / 4, 0]}
                            title={t('pavilion_content.pavilions.aero.name', "W&T ENGINEERING")}
                            glowColor="#ff0055"
                            roofColor="white"
                            imageUrl={aeroWallUrl} // Static Image
                            modelPath={PNEUMATIC_PATH} // Swapped to Pneumatic per request
                            productScale={1.2} // Adjusted scale for Pneumatic (matches Logistics)
                            hideSideModels={true} // Only one per request
                            heightOffset={1} // Safely above pedestal
                            onClick={(e) => {
                                const target = [-25, 1.5, -5]; // True Kiosk Product Center
                                if (inspectMode && orbitTarget && orbitTarget[0] === target[0] && orbitTarget[2] === target[2]) return;
                                e.stopPropagation();
                                SoundManager.playClick();
                                setSelectedObject(PAVILIONS['aero']);
                                setInspectMode(true);
                                setOrbitTarget(target);
                                setCameraPosition([-20, 3.5, 0]); // Comfortable viewing angle
                            }}
                            onProductClick={(e) => {
                                e.stopPropagation();
                                if (inspectMode && selectedObject === PAVILIONS['aero']) return;
                                SoundManager.playClick();
                                const target = [-25, 1.5, -5];
                                setSelectedObject(PAVILIONS['aero']);
                                setInspectMode(true);
                                setOrbitTarget(target);
                                setCameraPosition([-20, 3.5, 0]);
                            }}
                        />

                        {/* 3. Mid Right: HEAVY MACHINERY */}
                        <KioskUnit
                            position={[25, 0, -5]}
                            rotation={[0, -Math.PI / 4, 0]}
                            title={t('pavilion_content.pavilions.heavy.name', "TITAN HEAVY INDUSTRIES")}
                            glowColor="#00aaff"
                            roofColor="white"
                            imageUrl={liftWallUrl}
                            modelPath={ROAD_GRADER_PATH} // Replaced Crane with Road Grader
                            productScale={0.5} // Increased scale to make it visible
                            modelRotation={[0, Math.PI / 2, 0]} // Rotated 90 deg anticlockwise
                            modelPosition={[0, 1, 0]} // Center and lift
                            hideSideModels={true}
                            // hideMainPedestal={true} 
                            heightOffset={0} // Reset offset
                            useEscavator={false}
                            onClick={(e) => {
                                const position = [25, 1, -5]; // Focus on the Kiosk itself (Road Grader)
                                if (inspectMode && orbitTarget && orbitTarget[0] === position[0] && orbitTarget[2] === position[2]) {
                                    return; // Allow propagation if already selected
                                }
                                e.stopPropagation(); // Stop only if taking action
                                SoundManager.playClick();
                                setSelectedObject(PAVILIONS['heavy']);
                                setInspectMode(true);
                                setOrbitTarget(position);
                                setCameraPosition([position[0], position[1] + 2, position[2] + 8]);
                            }}
                            onProductClick={(e) => {
                                e.stopPropagation();
                                const position = [25, 1, -5];
                                if (inspectMode && orbitTarget && orbitTarget[0] === position[0] && orbitTarget[2] === position[2]) return;
                                SoundManager.playClick();
                                setSelectedObject(PAVILIONS['heavy']);
                                setInspectMode(true);
                                setOrbitTarget(position);
                                setCameraPosition([position[0], position[1] + 2, position[2] + 8]);
                            }}
                        />







                        {/* 4. Rear Left Corner: ENERGY */}
                        <KioskUnit
                            position={[-21, 0, -38]}
                            rotation={[0, Math.PI / 6, 0]}
                            title={t('pavilion_content.pavilions.energy.name', "VOLT ENERGY")}
                            glowColor="#ffaa00"
                            interactable={false}
                            roofColor="white"
                            videoUrl={null}
                            imageUrl={kioskEnergyUrl} // Inserted Energy Screen
                            modelPath={TURBO_ENGINE_PATH}
                            modelPosition={[0, 0.8, 0]}
                            productScale={0.8}
                            hideSideModels={true}
                            heightOffset={-0.95} // Place on pedestal
                            onClick={(e) => {
                                // e.stopPropagation();
                                // Restricted Entry
                            }}
                            onProductClick={(e) => {
                                // e.stopPropagation();
                                // Restricted Entry
                            }}
                        />

                        {/* 5. Rear Right Corner: LOGISTICS */}
                        <KioskUnit
                            position={[21, 0, -38]}
                            rotation={[0, -Math.PI / 6, 0]}
                            title={t('pavilion_content.pavilions.logistics.name', "VELOCITY LOGISTICS")}
                            glowColor="#00ff55"
                            interactable={false}
                            roofColor="white"
                            videoUrl={null}
                            imageUrl={kioskLogisticsUrl} // Inserted Logistics Screen
                            modelPath={PNEUMATIC_PATH}
                            productScale={1.2}
                            modelPosition={[0, 0.8, 0]}
                            hideSideModels={true}
                            heightOffset={1} // Fix floating (was -0.95)
                            onClick={(e) => {
                                const target = [21, 1.5, -38]; // True Kiosk Product Center
                                if (inspectMode && orbitTarget && orbitTarget[0] === target[0] && orbitTarget[2] === target[2]) return;
                                e.stopPropagation();
                                SoundManager.playClick();
                                setSelectedObject(PAVILIONS['logistics']); // Correct Data Key
                                setInspectMode(true);
                                setOrbitTarget(target);
                                setCameraPosition([17, 3.5, -32]); // -4, +2, +6 offset roughly
                            }}
                            onProductClick={(e) => {
                                e.stopPropagation();
                                const target = [21, 1.5, -38];
                                if (inspectMode && orbitTarget && orbitTarget[0] === target[0] && orbitTarget[2] === target[2]) return;
                                SoundManager.playClick();
                                setSelectedObject(PAVILIONS['logistics']); // Correct Data Key
                                setInspectMode(true);
                                setOrbitTarget(target);
                                setCameraPosition([17, 3.5, -32]);
                            }}
                        />


                        {/* --- WAREHOUSE STRUCTURE (Partitions & Dividers) --- */}
                        {/* Left Side Lane Dividers */}


                        {/* --- EXTRA KIOSKS (Filling Sides & Far Back as requested) --- */}

                        {/* 6. Front Left: SECURITY */}
                        <KioskUnit
                            position={[-25, 0, 20]}
                            rotation={[0, Math.PI / 2, 0]}
                            title={t('pavilion_content.pavilions.security.name', "AEGIS SECURITY")}
                            glowColor="#e63946"
                            hideSideModels={false} // Restored side models
                            videoUrl={null}
                            imageUrl={kioskSecurityUrl}
                            modelPath={CAMERA_PATH}
                            sideModelPath={DRONE_PATH}
                            productScale={2.0} // Reduced to 2.0 (Double the 'very small' 1.0) to fix hitbox
                            sideModelScale={0.035} // Reduced by 30% from 0.05
                            onClick={(e) => {
                                const target = [-25, 1, 20]; // Center
                                if (inspectMode && orbitTarget && orbitTarget[0] === target[0] && orbitTarget[2] === target[2]) return;
                                e.stopPropagation();
                                SoundManager.playClick();
                                SoundManager.playClick();
                                setSelectedObject(PAVILIONS['security']);
                                setInspectMode(true);
                                setOrbitTarget(target);
                                setCameraPosition([-18, 2, 20]);
                            }}
                            onSideClick={(e, side) => {
                                e.stopPropagation();
                                SoundManager.playClick();
                                setSelectedObject(PAVILIONS['security']);
                                setInspectMode(true);

                                // Calculate side positions based on rotation (PI/2)
                                // Left Global: [-23, 0.5, 25], Right Global: [-23, 0.5, 15]
                                const target = side === 'left' ? [-23, 0.5, 25] : [-23, 0.5, 15];
                                const camPos = side === 'left' ? [-16, 2, 25] : [-16, 2, 15];

                                setOrbitTarget(target);
                                setCameraPosition(camPos);
                            }}
                        />

                        {/* 7. Front Right: RESEARCH */}
                        <KioskUnit
                            position={[25, 0, 20]}
                            rotation={[0, -Math.PI / 2, 0]}
                            title="GENESIS BIO-LABS"
                            glowColor="#7209b7"
                            videoUrl={null}
                            imageUrl={kioskResearchUrl}
                            // Default to hologram for now if no model
                            onClick={() => SoundManager.playClick()}
                        />

                        {/* 8. Deep Back Center: DATA */}
                        <KioskUnit
                            position={[0, 0, -50]}
                            rotation={[0, 0, 0]}
                            title="QUANTUM DATA CORP"
                            glowColor="#4361ee"
                            interactable={false} // Disabled per request
                            hideSideModels={true}
                            modelPath={PAVILIONS['data'].products[0].modelPath}
                            productScale={PAVILIONS['data'].products[0].scale}
                            modelPosition={[0, 0.5, 0]}
                            imageUrl={kioskDataUrl}
                            onClick={(e) => {
                                // e.stopPropagation();
                                // Restricted Entry
                            }}
                        />

                        {/* 9. Deep Back Right: MANUFACTURING */}
                        <KioskUnit
                            position={[34, 0, -22]}
                            rotation={[0, -Math.PI / 4, 0]}
                            title="SYNTHETIC MINDS"
                            glowColor="#fb8500"
                            videoUrl={null}
                            hideSideModels={true}
                            imageUrl={kioskManufacturingUrl}

                            onClick={() => SoundManager.playClick()}
                        />

                        {/* 10. Deep Back Left: AI SYSTEMS */}
                        <KioskUnit
                            position={[-34, 0, -22]}
                            rotation={[0, Math.PI / 4, 0]}
                            hideSideModels={true}
                            modelPath={PNEUMATIC_PATH} // Restored model (Pneumatic)
                            productScale={1.5}
                            modelPosition={[0, 0.5, 0]}
                            modelRotation={[0, Math.PI, 0]}
                            imageUrl={kioskAiUrl}
                            onClick={(e) => {
                                const position = [-25, 0, -20];
                                if (inspectMode && orbitTarget && orbitTarget[0] === position[0] && orbitTarget[2] === position[2]) return;
                                e.stopPropagation();
                                SoundManager.playClick();
                                SoundManager.playClick();
                                setSelectedObject(PAVILIONS['ai_systems']);
                                setInspectMode(true);
                                setOrbitTarget([-30, 2, -25]); // Centered on flying drone
                                setCameraPosition([position[0] + 5, position[1] + 2, position[2] + 5]);
                            }}
                        />

                        {/* --- ENTRANCE AREA (Behind Camera Z > 15) --- */}

                        {/* 11. Entrance Left: QUANTUM */}
                        <KioskUnit
                            position={[-12, 0, 32]}
                            rotation={[0, Math.PI, 0]} // Facing forward
                            title="QUANTUM"
                            glowColor="#4cc9f0"
                            videoUrl={null}
                            imageUrl={kioskQuantumUrl}

                            onClick={() => SoundManager.playClick()}
                        />

                        {/* 12. Entrance Right: BIOTECH */}
                        <KioskUnit
                            position={[12, 0, 32]}
                            rotation={[0, Math.PI, 0]} // Facing forward
                            title="BIOTECH"
                            glowColor="#2a9d8f"
                            hideSideModels={true}
                            modelPath={PAVILIONS['biotech'].products[0].modelPath}
                            productScale={PAVILIONS['biotech'].products[0].scale}
                            modelPosition={[0, 0.5, 0]}
                            imageUrl={kioskBiotechUrl}
                            onClick={(e) => {
                                const position = [12, 0, 27];
                                if (inspectMode && orbitTarget && orbitTarget[0] === position[0] && orbitTarget[2] === position[2]) return;
                                e.stopPropagation();
                                SoundManager.playClick();
                                SoundManager.playClick();
                                setSelectedObject(PAVILIONS['biotech']);
                                setInspectMode(true);
                                setOrbitTarget([12, 1, 32]); // Centered on microscope
                                setCameraPosition([position[0], position[1] + 2, position[2] - 4]);
                            }}
                        />

                        {/* Start Wall to enclose the lobby */}


                        {/* --- WALL DETAILS (Adding depth to side walls) --- */}
                        {/* --- WALL DETAILS (Specific Extras removed, handled by RealisticWall) --- */}

                        {/* --- REALISTIC LIGHTING (Synthetic) --- */}
                        {/* Generates an environment map locally on GPU - No network fetch required (Fixes crash) */}
                        {/* --- REALISTIC LIGHTING (Synthetic) --- */}
                        {/* Generates an environment map locally on GPU - No network fetch required (Fixes crash) */}




                        <OrbitControls
                            ref={controlsRef}
                            {...(orbitTarget ? { target: orbitTarget } : {})}
                            enablePan={!inspectMode}
                            enableZoom={true}

                            // RESTRICTED CAMERA LIMITS
                            minDistance={inspectMode ? 0.5 : 5} // Prevent clipping through models
                            maxDistance={inspectMode ? 20 : 80} // Prevent leaving the hall
                            minPolarAngle={inspectMode ? Math.PI / 3 : 0.1} // Prevent looking straight up
                            maxPolarAngle={Math.PI / 2 - 0.05} // Ground level limit

                            enableDamping={true}
                            dampingFactor={0.1}
                            makeDefault
                        />

                        <CameraSmoother
                            controlsRef={controlsRef}
                            targetPosition={orbitTarget}
                            cameraPosition={cameraPosition}
                            isActive={inspectMode}
                        />



                        <Preload all />
                    </Suspense>

                    <CameraManager
                        inspectMode={inspectMode}
                        captureReq={captureReq}
                        onCapture={handleCameraCaptured}
                        savedState={savedCameraState}
                        onRestoreComplete={() => setTransitioning(false)}
                    />

                    {/* POST PROCESSING */}
                    <EffectComposer disableNormalPass multisampling={0}>
                        <Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} radius={0.4} />
                        <Noise opacity={inspectMode ? 0 : 0.02} /> {/* Disable noise in inspect for clarity */}
                        <Vignette eskil={false} offset={0.1} darkness={0.5} /> {/* Stronger Vignette for focus */}

                    </EffectComposer>
                </PerformanceMonitor>
            </Canvas>


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
                        openShowroom(selectedObject);
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
                            <span>{Math.round(visualProgress)}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-500 transition-all duration-200"
                                style={{ width: `${Math.min(Math.max(visualProgress, 5), 100)}%` }}
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

            {/* 2D HUD Inspection Card (Fixed Positioning) */}
            <InspectionCard
                visible={inspectMode && selectedObject && !isOpen && !isShowroomOpen}
                pavilionName={selectedObject?.name}
                title={selectedObject?.title}
                description={selectedObject?.description}
                stats={selectedObject?.stats}
                onDetailsClick={openFullOverlay}
                productId={selectedObject?.title ? selectedObject?.id : undefined}
                pavilionId={selectedObject?.name ? selectedObject?.id : undefined}
            />

            {/* WELCOME OVERLAY */}
            {showWelcome && !showLoader && (
                <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-700">
                    <div className="bg-[#0a0a0a] border border-white/10 p-12 max-w-2xl text-center rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-hidden">
                        {/* Decorative background glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-cyan-500/10 blur-[100px] pointer-events-none" />

                        <div className="relative z-10 flex flex-col items-center gap-6">
                            <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-2 shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                                <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] animate-pulse" />
                            </div>

                            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 font-[Orbitron] tracking-tight">
                                {t('verified_pavilion.welcome.title')}
                            </h1>

                            <p className="text-lg text-slate-400 font-light leading-relaxed max-w-lg">
                                {t('verified_pavilion.welcome.subtitle')}
                            </p>

                            <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent my-4" />

                            <button
                                onClick={() => {
                                    SoundManager.playClick();
                                    setShowWelcome(false);
                                }}
                                className="group relative px-10 py-4 bg-white text-black font-bold uppercase tracking-[0.2em] text-sm overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                            >
                                <span className="relative z-10">{t('verified_pavilion.welcome.btn_enter')}</span>
                                <div className="absolute inset-0 bg-cyan-400 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>

                            <p className="text-[10px] text-slate-600 uppercase tracking-widest mt-4">
                                {t('verified_pavilion.welcome.controls_hint')}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
