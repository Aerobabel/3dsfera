import React, { Suspense, useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls, KeyboardControls, Preload, useGLTF, Environment, useProgress, Grid, ContactShadows, useTexture } from '@react-three/drei';
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
import { IndustrialCeilingDetailsFixed, UltimateFloor, CeilingLights } from './pavilion/PavilionEnvironment';
import { ControlsWrapper, CameraPitchClamp } from './pavilion/PavilionControls';
import { CameraSmoother, FloatingAnnotation } from './pavilion/PavilionInteraction';
import { OrbitControls } from '@react-three/drei';

import ProductDisplay from './pavilion/ProductDisplay';
import { ConveyorBelt } from './pavilion/subsystems/ConveyorBelt';
import { FactoryPartition } from './pavilion/subsystems/FactoryPartition';
import IndustrialCeiling from './pavilion/subsystems/IndustrialCeiling'; // New Import
import { HeavyDutyRobot } from './pavilion/subsystems/HeavyDutyRobot';
import { HazardZone } from './pavilion/subsystems/HazardZone';
import { Escavator } from './pavilion/subsystems/Escavator';

// Assets
import tractorVideoUrl from '../assets/videos/Cyberpunk_Tractor_Video_Generation.mp4';
import logoVideoUrl from '../assets/videos/Logo_Video_Generation.mp4';
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
import aeroScreenUrl from '../assets/images/aero_screen.png';
import aeroWallUrl from '../assets/images/aerowall.png';
import liftWallUrl from '../assets/images/liftwall.png';
import techWallUrl from '../assets/images/wall.png';

const TURBO_ENGINE_PATH = '/objects/turbo_schaft_engine_ivchenko_al-20.glb';
const PNEUMATIC_PATH = '/objects/Pneumatic.glb';
const CRANE_PATH = '/objects/mobile_crane.glb';
const CRANE_MACHINE_PATH = '/objects/crane_machine.glb';
const ROAD_GRADER_PATH = '/objects/road_grader_optimized.glb';
const VALVE_PATH = '/objects/valve.glb';
const CAMERA_PATH = '/objects/camera.glb';
const DRONE_PATH = '/objects/drone.glb';
const ESCAVATOR_PATH = '/objects/escavator.glb';

// Pre-load assets
useGLTF.preload(TURBO_ENGINE_PATH);
useGLTF.preload(CRANE_PATH);
useGLTF.preload(CRANE_MACHINE_PATH);
useGLTF.preload(ESCAVATOR_PATH);

// Helper to ensure scene is actually rendered before hiding loader
function SceneReadyNotifier({ onReady }) {
    const { gl } = useThree();
    const frameCount = useRef(0);

    useFrame(() => {
        if (frameCount.current < 4) { // Wait 4 frames for safety (shader compile/upload)
            frameCount.current += 1;
            return;
        }
        // Force a gl compile check or just trust the frames
        onReady();
    });
    return null;
}

function TexturedWall({ position, rotation, args, color = "#111", textureUrl }) {
    const texture = useTexture(textureUrl);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(args[0] / 20, args[1] / 20); // Scale texture (1 repeat per 20 units)

    return (
        <mesh position={position} rotation={rotation}>
            <planeGeometry args={args} />
            <meshStandardMaterial map={texture} color={color} metalness={0.5} roughness={0.6} />
        </mesh>
    );
}

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
                    <div className="flex items-center gap-3"><span className="font-mono text-cyan-400 font-bold">W/S</span> {t('verified_pavilion.ui_nav.nav_forward')}</div>
                    <div className="flex items-center gap-3"><span className="font-mono text-cyan-400 font-bold">A/D</span> {t('verified_pavilion.ui_nav.nav_orbit')}</div>
                    {/* <div className="text-xs opacity-60 mt-1">{t('verified_pavilion.ui_nav.nav_inspect')}</div> */}
                </div>
            </div>

            <KeyboardControls map={keyboardMap}>
                <Canvas
                    shadows
                    camera={{ position: [0, 2.5, 45], fov: 60 }}
                    dpr={[1, 1.5]}
                    gl={{
                        antialias: false,
                        toneMapping: THREE.ACESFilmicToneMapping, // MOVIE-QUALITY TONE MAPPING
                        toneMappingExposure: 1.0,
                        stencil: false,
                        depth: true
                    }}
                // Removed onCreated to wait for real frames via SceneReadyNotifier
                >
                    <Suspense fallback={null}>
                        <SceneReadyNotifier onReady={() => setSceneReady(true)} />

                        {/* --- ENVIRONMENT (RESTORED DARK) --- */}
                        <color attach="background" args={['#2a2a2a']} />
                        <fogExp2 attach="fog" args={['#2a2a2a', 0.015]} />
                        <Environment
                            files="/hdris/convertio.in_image.hdr"
                            background={false}
                            blur={0.02}
                            environmentIntensity={1.5} // Increased env reflection
                        />

                        {/* REALISTIC LIGHTING RATIOS */}
                        <ambientLight intensity={0.4} /> {/* Reduced from 1.5 to remove 'flatness' */}

                        <directionalLight
                            position={[20, 30, 10]}
                            intensity={4} // Sun is bright
                            castShadow
                            shadow-mapSize={[4096, 4096]} // Sharper shadows
                            shadow-bias={-0.0001}
                            shadow-radius={4} // Soften shadow edges
                        />
                        {/* Fill Light for balanced illumination (Right Side) */}
                        <pointLight position={[30, 20, 0]} intensity={10} distance={50} decay={2} color="#e0e0ff" />
                        <pointLight position={[-30, 20, 0]} intensity={5} distance={50} decay={2} color="#e0e0ff" />

                        {/* --- CINEMATIC GROUNDING --- */}
                        <ContactShadows
                            position={[0, 0.01, 0]} // Just above the grid
                            color="#000000"
                            opacity={0.6} // Strong but soft shadow
                            scale={80} // Cover the main area
                            blur={2.5} // High blur for that 'ambient occlusion' look
                            far={2} // Only affect objects close to floor
                            resolution={1024} // High quality
                        />

                        {/* --- ORIGINAL SCENE COMPONENTS --- */}
                        <UltimateFloor />
                        {/* <BackgroundBillboard /> REMOVED for depth */}
                        {/* <BackWallStructure /> REMOVED for depth */}
                        {/* <NeonCeiling /> REMOVED per user request */}
                        {/* <FloorArrows /> REMOVED */}
                        <IndustrialCeilingDetailsFixed />
                        <CeilingLights />

                        {/* --- NEW ATMOSPHERE: GLOWING SPHERE & VOID FILL --- */}

                        {/* The Sun / Sphere */}
                        <group position={[0, 25, 0]}>
                            <mesh>
                                <sphereGeometry args={[6, 64, 64]} />
                                <meshStandardMaterial
                                    emissive="white"
                                    emissiveIntensity={2}
                                    color="white"
                                    toneMapped={false}
                                />
                            </mesh>
                            <pointLight intensity={4} distance={300} decay={2} color="cyan" />
                        </group>

                        {/* Deep Back Wall (Blocking the void at Z = -90) */}
                        <group position={[0, 20, -90]}>
                            <TexturedWall
                                args={[300, 120]}
                                textureUrl={techWallUrl}
                                color="#080808" // Darkened
                            />
                            {/* Giant Grid on Back Wall */}
                            <Grid
                                position={[0, 0, 0.5]}
                                args={[300, 120]}
                                rotation={[Math.PI / 2, 0, 0]}
                                cellSize={5}
                                cellThickness={1}
                                cellColor="#333"
                                sectionSize={25}
                                sectionThickness={2}
                                sectionColor="#00ffff"
                                fadeDistance={200}
                            />
                        </group>

                        {/* Side Walls to close the box */}
                        <TexturedWall
                            position={[-70, 20, -40]}
                            rotation={[0, Math.PI / 2, 0]}
                            args={[200, 120]}
                            textureUrl={techWallUrl}
                            color="#040404" // Very Dark (Left)
                        />
                        <TexturedWall
                            position={[70, 20, -40]}
                            rotation={[0, -Math.PI / 2, 0]}
                            args={[200, 120]}
                            textureUrl={techWallUrl}
                            color="#040404" // Very Dark (Right)
                        />

                        {/* --- DYNAMIC ELEMENETS --- */}

                        {/* Drones */}
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
                        <KioskUnit
                            position={[0, 0, -5]}
                            rotation={[0, 0, 0]}
                            title="3DSFERA"
                            glowColor="#00ffff"
                            videoUrl={logoVideoUrl}
                            roofColor="white"
                            isTv={true} // Enable TV display inside kiosk
                            onClick={(e) => {
                                const position = [0, 0, -5];
                                if (inspectMode && orbitTarget && orbitTarget[0] === position[0] && orbitTarget[2] === position[2]) return;
                                e.stopPropagation();
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

                        {/* 2. Mid Left: AERO DYNAMICS */}
                        <KioskUnit
                            position={[-25, 0, -5]}
                            rotation={[0, Math.PI / 4, 0]}
                            title="W&T ENGINEERING"
                            glowColor="#ff0055"
                            roofColor="white"
                            imageUrl={aeroWallUrl} // Static Image
                            modelPath={PNEUMATIC_PATH} // Swapped to Pneumatic per request
                            productScale={1.2} // Adjusted scale for Pneumatic (matches Logistics)
                            hideSideModels={true} // Only one per request
                            heightOffset={1} // Safely above pedestal
                            onClick={(e) => {
                                const position = [-22, 0, 0];
                                if (inspectMode && orbitTarget && orbitTarget[0] === position[0] && orbitTarget[2] === position[2]) return;
                                e.stopPropagation();
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

                        {/* 3. Mid Right: HEAVY MACHINERY */}
                        <KioskUnit
                            position={[25, 0, -5]}
                            rotation={[0, -Math.PI / 4, 0]}
                            title="TITAN HEAVY INDUSTRIES"
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
                            position={[-20, 0, -35]}
                            rotation={[0, Math.PI / 6, 0]}
                            title="VOLT ENERGY"
                            glowColor="#ffaa00"
                            roofColor="white"
                            videoUrl={null}
                            imageUrl={kioskEnergyUrl} // Inserted Energy Screen
                            modelPath={TURBO_ENGINE_PATH}
                            modelPosition={[0, 0.8, 0]}
                            productScale={0.8}
                            hideSideModels={true}
                            heightOffset={-0.95} // Place on pedestal
                            onClick={(e) => {
                                const position = [-12, 0, -20];
                                if (inspectMode && orbitTarget && orbitTarget[0] === position[0] && orbitTarget[2] === position[2]) return;
                                e.stopPropagation();
                                SoundManager.playClick();
                                setSelectedObject(PAVILIONS['aero']); // Re-using data for now as placeholder
                                setInspectMode(true);
                                setOrbitTarget(position);
                                setCameraPosition([position[0], position[1] + 2.5, position[2] + 8.0]);
                            }}
                            onProductClick={(e) => {
                                e.stopPropagation();
                                if (inspectMode && selectedObject === PAVILIONS['aero']) return;
                                SoundManager.playClick();
                                const position = [-12, 0, -20];
                                setSelectedObject(PAVILIONS['aero']);
                                setInspectMode(true);
                                setOrbitTarget(position);
                                setCameraPosition([position[0], position[1] + 2.5, position[2] + 8.0]);
                            }}
                        />

                        {/* 5. Rear Right Corner: LOGISTICS */}
                        <KioskUnit
                            position={[20, 0, -35]}
                            rotation={[0, -Math.PI / 6, 0]}
                            title="VELOCITY LOGISTICS"
                            glowColor="#00ff55"
                            roofColor="white"
                            videoUrl={null}
                            imageUrl={kioskLogisticsUrl} // Inserted Logistics Screen
                            modelPath={PNEUMATIC_PATH}
                            productScale={1.2}
                            modelPosition={[0, 0.8, 0]}
                            hideSideModels={true}
                            heightOffset={1} // Fix floating (was -0.95)
                            onClick={(e) => {
                                const position = [17, 0, -32]; // Closer to kiosk [20, 0, -35]
                                if (inspectMode && orbitTarget && orbitTarget[0] === position[0] && orbitTarget[2] === position[2]) return;
                                e.stopPropagation();
                                SoundManager.playClick();
                                setSelectedObject(PAVILIONS['logistics']); // Correct Data Key
                                setInspectMode(true);
                                setOrbitTarget(position);
                                setCameraPosition([position[0], position[1] + 2.5, position[2] + 8.0]);
                            }}
                            onProductClick={(e) => {
                                e.stopPropagation();
                                const position = [17, 0, -32];
                                if (inspectMode && orbitTarget && orbitTarget[0] === position[0] && orbitTarget[2] === position[2]) return;
                                SoundManager.playClick();
                                setSelectedObject(PAVILIONS['logistics']); // Correct Data Key
                                setInspectMode(true);
                                setOrbitTarget(position);
                                setCameraPosition([position[0], position[1] + 2.5, position[2] + 8.0]);
                            }}
                        />


                        {/* --- WAREHOUSE STRUCTURE (Partitions & Dividers) --- */}
                        {/* Left Side Lane Dividers */}
                        <FactoryPartition position={[-15, 0, 10]} rotation={[0, Math.PI / 2, 0]} width={6} />
                        <FactoryPartition position={[-15, 0, -15]} rotation={[0, Math.PI / 2, 0]} width={6} />

                        {/* Right Side Lane Dividers */}
                        <FactoryPartition position={[15, 0, 10]} rotation={[0, Math.PI / 2, 0]} width={6} />
                        <FactoryPartition position={[15, 0, -15]} rotation={[0, Math.PI / 2, 0]} width={6} />

                        {/* Back Wall Details */}
                        <FactoryPartition position={[-10, 0, -45]} width={8} />
                        <FactoryPartition position={[10, 0, -45]} width={8} />

                        {/* --- EXTRA KIOSKS (Filling Sides & Far Back as requested) --- */}

                        {/* 6. Front Left: SECURITY */}
                        <KioskUnit
                            position={[-25, 0, 20]}
                            rotation={[0, Math.PI / 2, 0]}
                            title="AEGIS SECURITY"
                            glowColor="#e63946"
                            hideSideModels={false} // Show Drone on side
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
                            hideSideModels={true}
                            modelPath={PAVILIONS['data'].products[0].modelPath}
                            productScale={PAVILIONS['data'].products[0].scale}
                            modelPosition={[0, 0.5, 0]}
                            imageUrl={kioskDataUrl}
                            onClick={(e) => {
                                const position = [0, 0, -45];
                                if (inspectMode && orbitTarget && orbitTarget[0] === position[0] && orbitTarget[2] === position[2]) return;
                                e.stopPropagation();
                                SoundManager.playClick();
                                SoundManager.playClick();
                                setSelectedObject(PAVILIONS['data']);
                                setInspectMode(true);
                                setOrbitTarget([0, 1, -50]); // Centered on server rack
                                setCameraPosition([position[0], position[1] + 2, position[2] + 6]);
                            }}
                        />

                        {/* 9. Deep Back Right: MANUFACTURING */}
                        <KioskUnit
                            position={[30, 0, -25]}
                            rotation={[0, -Math.PI / 4, 0]}
                            title="SYNTHETIC MINDS"
                            glowColor="#fb8500"
                            videoUrl={null}
                            imageUrl={kioskManufacturingUrl}

                            onClick={() => SoundManager.playClick()}
                        />

                        {/* 10. Deep Back Left: AI SYSTEMS */}
                        <KioskUnit
                            position={[-30, 0, -25]}
                            rotation={[0, Math.PI / 4, 0]}
                            title="AI SYSTEMS"
                            glowColor="#caf0f8"
                            hideSideModels={true}
                            modelPath={PAVILIONS['ai_systems'].products[0].modelPath}
                            productScale={PAVILIONS['ai_systems'].products[0].scale}
                            modelPosition={[0, 1.5, 0]} // Flying drone
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
                        <group>
                            {/* Left Wall Partitions */}
                            {Array.from({ length: 5 }).map((_, i) => (
                                <FactoryPartition
                                    key={`lw-${i}`}
                                    position={[-68, 0, -30 + (i * 15)]}
                                    rotation={[0, Math.PI / 2, 0]}
                                    width={10}
                                />
                            ))}
                            {/* Right Wall Partitions */}
                            {Array.from({ length: 5 }).map((_, i) => (
                                <FactoryPartition
                                    key={`rw-${i}`}
                                    position={[68, 0, -30 + (i * 15)]}
                                    rotation={[0, -Math.PI / 2, 0]}
                                    width={10}
                                />
                            ))}
                        </group>
                        <group position={[0, 15, 45]}>
                            <mesh>
                                <planeGeometry args={[100, 50]} />
                                <meshStandardMaterial color="#111" metalness={0.9} roughness={0.2} />
                            </mesh>
                            {/* Lobby Grid */}
                            <Grid
                                position={[0, 0, 0.5]}
                                args={[100, 50]}
                                rotation={[Math.PI / 2, 0, 0]}
                                cellSize={5}
                                cellThickness={1}
                                cellColor="#333"
                                sectionSize={25}
                                sectionThickness={2}
                                sectionColor="#00ff00"
                                fadeDistance={60}
                            />
                        </group>

                        {/* --- WALL DETAILS (Adding depth to side walls) --- */}
                        <group>
                            {/* Left Wall Partitions */}
                            {Array.from({ length: 5 }).map((_, i) => (
                                <FactoryPartition
                                    key={`lw-${i}`}
                                    position={[-68, 0, -30 + (i * 15)]}
                                    rotation={[0, Math.PI / 2, 0]}
                                    width={10}
                                />
                            ))}
                            {/* Right Wall Partitions */}
                            {Array.from({ length: 5 }).map((_, i) => (
                                <FactoryPartition
                                    key={`rw-${i}`}
                                    position={[68, 0, -30 + (i * 15)]}
                                    rotation={[0, -Math.PI / 2, 0]}
                                    width={10}
                                />
                            ))}
                        </group>

                        {/* --- CEILING STRUCTURE --- */}
                        <IndustrialCeiling height={14} width={150} depth={150} />


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
                                minDistance={0.5}
                                maxDistance={20}
                                minPolarAngle={Math.PI / 4} // Limit top view so camera doesn't hit ceiling
                                maxPolarAngle={Math.PI / 2} // Restrict to ground level (no under-floor view)
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
                        <Noise opacity={inspectMode ? 0 : 0.02} /> {/* Disable noise in inspect for clarity */}
                        <Vignette eskil={false} offset={0.1} darkness={0.5} /> {/* Stronger Vignette for focus */}

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
