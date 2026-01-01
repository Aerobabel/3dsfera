import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFBX, useTexture, Text, Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { ConvaiManager } from '../../lib/ConvaiManager';

// Verified paths on disk: public/objects/actor/Actor/party-f-0001/
const HOLOGRAM_PATH = '/objects/actor/Actor/party-f-0001/party-f-0001.fbx';
const TEXTURE_PATH = '/objects/actor/Actor/party-f-0001/Character_Pbr_Diffuse.png';
const NORMAL_PATH = '/objects/actor/Actor/party-f-0001/Character_Pbr_Normal.jpg';

export default function HologramGuide({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 0.01 }) {
    const group = useRef();
    const [isListening, setIsListening] = useState(false);
    const convaiManager = useRef(null);

    const [isTalking, setIsTalking] = useState(false);

    // Viseme State
    const currentViseme = useRef(null);

    // CC Character Viseme Mapping (Oculus to CC Morphs)
    const VISEME_MAP = {
        0: 'sil',             // Sil
        1: 'V_Explosive',     // PP (B, M, P) -> V_Explosive
        2: 'V_Dental_Lip',    // FF (F, V) -> V_Dental_Lip
        3: 'V_Dental_Lip',    // TH -> (Approx F/V or Tongue)
        4: 'V_Lip_Open',      // DD (D, T) -> V_Lip_Open (Dental?)
        5: 'V_Tight',         // kk (K, G) -> V_Tight
        6: 'V_Affricate',     // CH (Ch, J) -> V_Affricate
        7: 'V_Dental_Lip',    // SS (S, Z) -> V_Dental_Lip
        8: 'V_Lip_Open',      // nn (N, L) -> V_Lip_Open
        9: 'V_Tight',         // RR -> V_Tight
        10: 'V_Open',         // aa (Ah) -> V_Open
        11: 'V_Lip_Open',     // E (Eh, Ae) -> V_Lip_Open
        12: 'V_Wide',         // ih (Ih, Iy) -> V_Wide
        13: 'V_Tight-O',      // oh (Oh) -> V_Tight-O
        14: 'V_Tight-O'       // ou (U, Oo) -> V_Tight-O
    };

    // Init Convai
    useEffect(() => {
        const apiKey = import.meta.env.VITE_CONVAI_API_KEY;
        const charId = import.meta.env.VITE_CONVAI_CHARACTER_ID;

        if (apiKey && charId) {
            convaiManager.current = new ConvaiManager(apiKey, charId);

            // Hook up Talking State
            convaiManager.current.setTalkingCallback((talking) => {
                setIsTalking(talking);
                if (!talking) currentViseme.current = null; // Reset silence
            });

            // Viseme Data
            convaiManager.current.setFaceDataCallback((faceData) => {
                if (faceData && faceData.visor_visemes) {
                    const visemeID = faceData.visor_visemes.viseme;
                    const morphName = VISEME_MAP[visemeID];
                    if (morphName) {
                        currentViseme.current = { name: morphName, strength: 1.0 };
                    }
                }
            });

        } else {
            console.warn("Convai Credentials Missing in .env");
        }

        const handleKeyDown = (e) => {
            if (e.code === 'KeyT' && !e.repeat && convaiManager.current) {
                setIsListening(true);
                convaiManager.current.startListening();
            }
            // DEBUG: Press Y to send text "Hello"
            if (e.code === 'KeyY' && !e.repeat && convaiManager.current) {
                console.log("Debug: 'Y' pressed, sending 'Hello'...");
                convaiManager.current.sendText("Hello");
            }
        };

        const handleKeyUp = (e) => {
            if (e.code === 'KeyT' && convaiManager.current) {
                setIsListening(false);
                convaiManager.current.stopListening();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            if (convaiManager.current) convaiManager.current.reset();
        };
    }, []);

    // Load Assets
    const sourceFbx = useFBX(HOLOGRAM_PATH);
    const textureMap = useTexture(TEXTURE_PATH);
    const normalMap = useTexture(NORMAL_PATH);
    textureMap.colorSpace = THREE.SRGBColorSpace;

    const fbx = useMemo(() => {
        const clone = SkeletonUtils.clone(sourceFbx);

        // --- BONE FINDER ---
        const bones = {
            spine: null,
            neck: null,
            leftArm: null,
            rightArm: null,
        };

        clone.traverse((child) => {
            if (child.isBone) {
                const n = child.name;
                // Spine
                if (n === 'CC_Base_Spine01' || n === 'CC_Base_Spine02' || n.includes('Spine')) {
                    if (!bones.spine) bones.spine = child;
                }
                // Head/Neck
                if (n === 'CC_Base_NeckTwist01' || n === 'CC_Base_Head' || n.includes('Neck')) {
                    if (!bones.neck) bones.neck = child;
                }
                // Arms
                if (n === 'CC_Base_L_Upperarm' || n === 'mixamorig:LeftArm' || n === 'LeftArm') {
                    bones.leftArm = child;
                }
                if (n === 'CC_Base_R_Upperarm' || n === 'mixamorig:RightArm' || n === 'RightArm') {
                    bones.rightArm = child;
                }
            }
        });

        clone.userData.bones = bones;

        // Material Surgery & Morph Target Check
        clone.traverse((child) => {
            if (child.isMesh) {
                // Find Face Mesh for Lip Sync
                if (child.morphTargetDictionary) {
                    clone.userData.morphMesh = child;
                    const dict = child.morphTargetDictionary;
                    if (dict['Mouth_Open'] !== undefined) clone.userData.mouthIndex = dict['Mouth_Open'];
                    else if (dict['A25_Jaw_Open'] !== undefined) clone.userData.mouthIndex = dict['A25_Jaw_Open'];
                    else if (dict['V_Open'] !== undefined) clone.userData.mouthIndex = dict['V_Open'];
                }

                const newMat = new THREE.MeshStandardMaterial({
                    name: 'Safe_Skin',
                    map: textureMap,
                    normalMap: normalMap,
                    color: 0xffffff,
                    metalness: 0.0,
                    roughness: 0.8,
                    side: THREE.FrontSide,
                    emissive: 0x000000,
                    emissiveIntensity: 0,
                });
                if (child.material) child.material.dispose();
                child.material = newMat;
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        // Feet Align
        const box = new THREE.Box3().setFromObject(clone);
        clone.position.y += -box.min.y;

        const center = new THREE.Vector3();
        box.getCenter(center);
        clone.position.x -= center.x;
        clone.position.z -= center.z;

        return clone;
    }, [sourceFbx, textureMap, normalMap]); // Removed isListening dependency (handled in useFrame)

    // Update material glow dynamically instead of re-memoizing
    useFrame(() => {
        if (fbx) {
            fbx.traverse((child) => {
                if (child.isMesh && child.material) {
                    child.material.emissive.setHex(isListening ? 0x00aaff : 0x000000);
                    child.material.emissiveIntensity = isListening ? 0.5 : 0;
                }
            });
        }
    });

    // PROCEDURAL ANIMATION LOOP
    useFrame((state) => {
        const t = state.clock.elapsedTime;
        const { spine, neck, leftArm, rightArm } = fbx.userData.bones;

        // Breathing
        if (spine) {
            spine.rotation.x = (Math.sin(t * 2) * 0.03);
            spine.rotation.y = (Math.cos(t * 1) * 0.03);
        }

        // Subtle neck movement (Convai friendly)
        if (neck) {
            // Base idle movement
            neck.rotation.x = -(Math.sin(t * 2) * 0.01);

            // Interaction States
            if (isListening) {
                neck.rotation.x -= 0.2; // Look up
            }
        }

        // LIP SYNC ANIMATION (Real Visemes)
        const { morphMesh } = fbx.userData;

        if (morphMesh && morphMesh.morphTargetDictionary && morphMesh.morphTargetInfluences) {

            // Lerp Speed
            const LERP_SPEED = 0.5;

            // 1. If talking and we have a target viseme (Advanced Lip Sync)
            if (isTalking && currentViseme.current) {
                const targetName = currentViseme.current.name;
                const targetIndex = morphMesh.morphTargetDictionary[targetName];

                // Iterate all mapped visemes to reset others and boost target
                Object.values(VISEME_MAP).forEach(name => {
                    const idx = morphMesh.morphTargetDictionary[name];
                    if (idx !== undefined) {
                        const targetValue = (idx === targetIndex) ? 1.0 : 0;
                        morphMesh.morphTargetInfluences[idx] = THREE.MathUtils.lerp(
                            morphMesh.morphTargetInfluences[idx],
                            targetValue,
                            LERP_SPEED
                        );
                    }
                });
            }
            // 2. Fallback: Talking but no Viseme data (Simple Sine Wave)
            else if (isTalking) {
                // Try to find a generic mouth open morph
                let mouthIdx = morphMesh.morphTargetDictionary['Mouth_Open'];
                if (mouthIdx === undefined) mouthIdx = morphMesh.morphTargetDictionary['A25_Jaw_Open'];
                if (mouthIdx === undefined) mouthIdx = morphMesh.morphTargetDictionary['V_Open'];

                if (mouthIdx !== undefined) {
                    // 15Hz Sine Wave
                    const val = (Math.sin(t * 15) + 1) * 0.3;
                    morphMesh.morphTargetInfluences[mouthIdx] = val;
                }
            }
            // 3. Not Talking: Close Mouth
            else {
                Object.values(VISEME_MAP).forEach(name => {
                    const idx = morphMesh.morphTargetDictionary[name];
                    if (idx !== undefined) {
                        morphMesh.morphTargetInfluences[idx] = THREE.MathUtils.lerp(
                            morphMesh.morphTargetInfluences[idx],
                            0,
                            0.2
                        );
                    }
                });

                // Also reset standard open just in case
                let mouthIdx = morphMesh.morphTargetDictionary['Mouth_Open'];
                if (mouthIdx === undefined) mouthIdx = morphMesh.morphTargetDictionary['A25_Jaw_Open'];
                if (mouthIdx === undefined) mouthIdx = morphMesh.morphTargetDictionary['V_Open']; // Ensure we reset the fallback morph too

                if (mouthIdx !== undefined) {
                    morphMesh.morphTargetInfluences[mouthIdx] = THREE.MathUtils.lerp(
                        morphMesh.morphTargetInfluences[mouthIdx], 0, 0.2
                    );
                }
            }
        }

        // FORCE ARMS DOWN (A-Pose maintenance)
        // Removed aggressive listening rotation to prevent mesh distortion
        if (leftArm) {
            leftArm.rotation.z = -1.4 + (Math.sin(t) * 0.02);
            leftArm.rotation.x = 0.3;
        }
        if (rightArm) {
            rightArm.rotation.z = 1.4 - (Math.sin(t) * 0.02);
            rightArm.rotation.x = 0.3;
        }
    });

    const toggleListening = (e) => {
        e.stopPropagation();
        if (!convaiManager.current) return;

        if (isListening) {
            setIsListening(false);
            convaiManager.current.stopListening();
        } else {
            setIsListening(true);
            convaiManager.current.startListening();
        }
    };

    return (
        <group
            ref={group}
            position={position}
            rotation={rotation}
            dispose={null}
            onClick={toggleListening}
            onPointerOver={() => document.body.style.cursor = 'pointer'}
            onPointerOut={() => document.body.style.cursor = 'auto'}
        >
            <primitive object={fbx} scale={scale} />

            {/* Professional Interaction Tag */}
            <Html position={[0, 1.8, 0]} center transform distanceFactor={10}>
                <div
                    onClick={toggleListening}
                    style={{
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                        opacity: 0.9,
                        transition: 'opacity 0.2s',
                        pointerEvents: 'auto' // Make clickable
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0.9'}
                >
                    {/* Circle Button */}
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: isListening ? 'rgba(0, 255, 128, 0.8)' : 'rgba(0, 0, 0, 0.6)',
                        backdropFilter: 'blur(10px)',
                        border: isListening ? '2px solid #00ff80' : '1px solid rgba(255,255,255,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: isListening ? '0 0 20px rgba(0, 255, 128, 0.6)' : '0 4px 12px rgba(0,0,0,0.3)',
                        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                        transform: isListening ? 'scale(1.1)' : 'scale(1)',
                        animation: isListening ? 'pulse-ring 2s infinite' : 'none'
                    }}>
                        {/* Mic Icon SVG */}
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isListening ? "#000" : "#fff"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                            <line x1="12" y1="19" x2="12" y2="23" />
                            <line x1="8" y1="23" x2="16" y2="23" />
                        </svg>
                    </div>

                    {/* Label/Tooltip */}
                    <div style={{
                        background: 'rgba(0,0,0,0.8)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        color: 'white',
                        fontSize: '10px',
                        fontWeight: '500',
                        opacity: isListening ? 1 : 0, // Hide label when not listening for cleaner look, or visible on hover? Let's keep it clean.
                        transform: isListening ? 'translateY(0)' : 'translateY(-10px)',
                        transition: 'all 0.3s',
                        pointerEvents: 'none',
                        whiteSpace: 'nowrap'
                    }}>
                        {isListening ? "Listening..." : "Chat"}
                    </div>
                </div>
                <style>{`
                    @keyframes pulse-ring {
                        0% { box-shadow: 0 0 0 0 rgba(0, 255, 128, 0.7); }
                        70% { box-shadow: 0 0 0 15px rgba(0, 255, 128, 0); }
                        100% { box-shadow: 0 0 0 0 rgba(0, 255, 128, 0); }
                    }
                `}</style>
            </Html>
        </group>
    );
}
