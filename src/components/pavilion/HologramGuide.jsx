import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFBX, useTexture, Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';
import { ConvaiManager } from '../../lib/ConvaiManager';
import { useTranslation } from 'react-i18next';

// Verified paths
const HOLOGRAM_PATH = '/objects/actor/Actor/party-f-0001/party-f-0001.fbx';
const TEXTURE_PATH = '/objects/actor/Actor/party-f-0001/Character_Pbr_Diffuse.png';
const NORMAL_PATH = '/objects/actor/Actor/party-f-0001/Character_Pbr_Normal.jpg';

export default function HologramGuide({
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    scale = 0.01,
    showUI = true,
    isActive = false,
    onActivate = () => { }
}) {
    const { t } = useTranslation();
    const group = useRef();
    const [isListening, setIsListening] = useState(false);
    const [hasError, setHasError] = useState(false);
    const convaiManager = useRef(null);
    const [isTalking, setIsTalking] = useState(false);
    const currentViseme = useRef(null);

    // CC Character Viseme Mapping
    const VISEME_MAP = {
        0: 'sil', 1: 'V_Explosive', 2: 'V_Dental_Lip', 3: 'V_Dental_Lip',
        4: 'V_Lip_Open', 5: 'V_Tight', 6: 'V_Affricate', 7: 'V_Dental_Lip',
        8: 'V_Lip_Open', 9: 'V_Tight', 10: 'V_Open', 11: 'V_Lip_Open',
        12: 'V_Wide', 13: 'V_Tight-O', 14: 'V_Tight-O'
    };

    // --- CONVAI MANAGER LIFECYCLE ---
    useEffect(() => {
        if (!isActive) {
            if (convaiManager.current) {
                convaiManager.current.reset();
                convaiManager.current = null;
            }
            setIsListening(false);
            setIsTalking(false);
            return;
        }

        const apiKey = import.meta.env.VITE_CONVAI_API_KEY;
        const charId = import.meta.env.VITE_CONVAI_CHARACTER_ID;

        if (apiKey && charId) {
            convaiManager.current = new ConvaiManager(apiKey, charId);

            convaiManager.current.setTalkingCallback((talking) => {
                setIsTalking(talking);
                if (!talking) currentViseme.current = null;
            });

            convaiManager.current.setFaceDataCallback((faceData) => {
                if (faceData && faceData.visor_visemes) {
                    const visemeID = faceData.visor_visemes.viseme;
                    const morphName = VISEME_MAP[visemeID];
                    if (morphName) currentViseme.current = { name: morphName, strength: 1.0 };
                }
            });
        } else {
            console.warn("Convai Credentials Missing");
            setHasError(true);
        }

        return () => {
            if (convaiManager.current) {
                convaiManager.current.reset();
                convaiManager.current = null;
            }
        };
    }, [isActive]);

    // --- KEYBOARD LISTENERS ---
    useEffect(() => {
        if (!isActive) return;

        const handleKeyDown = (e) => {
            if (e.code === 'KeyT' && !e.repeat && convaiManager.current) {
                setIsListening(true);
                convaiManager.current.startListening();
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
        };
    }, [isActive]);


    // --- 3D LOADING & ANIMATION ---
    const sourceFbx = useFBX(HOLOGRAM_PATH);
    const textureMap = useTexture(TEXTURE_PATH);
    const normalMap = useTexture(NORMAL_PATH);
    textureMap.colorSpace = THREE.SRGBColorSpace;

    // NOTE: Native Animations removed. Using manual rotation.

    const fbx = useMemo(() => {
        const clone = SkeletonUtils.clone(sourceFbx);
        const bones = { spine: null, neck: null, leftClav: null, rightClav: null, leftArm: null, rightArm: null, leftForeArm: null, rightForeArm: null };

        clone.traverse((child) => {
            if (child.isBone) {
                const n = child.name;

                // --- ROBUST REGEX MATCHING ---
                if (/Spine/i.test(n)) { if (!bones.spine) bones.spine = child; }
                if (/(Neck|Head)/i.test(n)) { if (!bones.neck) bones.neck = child; }

                // Clavicles (Shoulders)
                const isLeftClav = /(L_Clavicle|LeftShoulder|L_Collar)/i.test(n);
                if (isLeftClav) bones.leftClav = child;

                const isRightClav = /(R_Clavicle|RightShoulder|R_Collar)/i.test(n);
                if (isRightClav) bones.rightClav = child;

                // Upper Arms - Smart Selection
                // 1. Match ANY upper arm like bone.
                // 2. If it's a "Twist" bone, only take it if we haven't found a real one yet.
                // 3. If it's a "Real" bone (no Twist), ALWAYS take it/overwrite.
                const isLeftArmGeneric = /(L_UpperArm|LeftUpArm|LeftArm)/i.test(n) && !/Fore/i.test(n) && !/Shoulder/i.test(n) && !/Clavicle/i.test(n);
                if (isLeftArmGeneric) {
                    const isTwist = /Twist/i.test(n);
                    if (!isTwist || !bones.leftArm) {
                        bones.leftArm = child;
                    }
                }

                const isRightArmGeneric = /(R_UpperArm|RightUpArm|RightArm)/i.test(n) && !/Fore/i.test(n) && !/Shoulder/i.test(n) && !/Clavicle/i.test(n);
                if (isRightArmGeneric) {
                    const isTwist = /Twist/i.test(n);
                    if (!isTwist || !bones.rightArm) {
                        bones.rightArm = child;
                    }
                }

                // Forearms (Elbows) - Same Logic
                const isLeftForeArmGeneric = /(L_ForeAre|LeftForeArm|LeftLowArm|L_LowerArm)/i.test(n);
                if (isLeftForeArmGeneric) {
                    const isTwist = /Twist/i.test(n);
                    if (!isTwist || !bones.leftForeArm) {
                        bones.leftForeArm = child;
                    }
                }

                const isRightForeArmGeneric = /(R_ForeArm|RightForeArm|RightLowArm|R_LowerArm)/i.test(n);
                if (isRightForeArmGeneric) {
                    const isTwist = /Twist/i.test(n);
                    if (!isTwist || !bones.rightForeArm) {
                        bones.rightForeArm = child;
                    }
                }
            }
        });

        console.log("--- BONE DEBUG ---");
        console.log("LeftClav:", bones.leftClav?.name);
        console.log("RightClav:", bones.rightClav?.name);
        console.log("LeftArm:", bones.leftArm?.name);
        console.log("RightArm:", bones.rightArm?.name);
        console.log("------------------");

        clone.userData.bones = bones;

        clone.traverse((child) => {
            if (child.isMesh) {
                if (child.morphTargetDictionary) {
                    clone.userData.morphMesh = child;
                }
                child.material = new THREE.MeshStandardMaterial({
                    map: textureMap,
                    normalMap: normalMap,
                    roughness: 0.8,
                    metalness: 0.0,
                    side: THREE.FrontSide,
                    emissive: 0x000000,
                    emissiveIntensity: 0,
                });
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        // Center Pivot
        const box = new THREE.Box3().setFromObject(clone);
        clone.position.y -= box.min.y;
        const center = new THREE.Vector3();
        box.getCenter(center);
        clone.position.x -= center.x;
        clone.position.z -= center.z;

        return clone;
    }, [sourceFbx, textureMap, normalMap]);

    useFrame((state) => {
        // Glow effect
        if (fbx) {
            fbx.traverse((c) => {
                if (c.isMesh && c.material) {
                    const isGlow = isListening || isTalking;
                    const color = isListening ? 0x00aaff : (isTalking ? 0x222222 : 0x000000);
                    c.material.emissive.setHex(color);
                    c.material.emissiveIntensity = isListening ? 0.5 : (isTalking ? 0.2 : 0);
                }
            });
        }

        // Animation
        const t = state.clock.elapsedTime;
        const { spine, neck, leftClav, rightClav, leftArm, rightArm, leftForeArm, rightForeArm } = fbx.userData.bones;

        // 1. Procedural Breathing (Spine)
        if (spine) {
            spine.rotation.x = Math.sin(t * 2) * 0.03;
            spine.rotation.y = Math.cos(t * 1) * 0.03;
        }

        // SYMMETRY RESTORATION
        // Right Arm (User Approved)
        // Clav: 0.82, 0.70, 1.94 | Arm: 0.29, 0.57, 0.21 | Fore: 0.18, -0.17, 0

        if (rightClav) rightClav.rotation.set(0.82, 0.70, 1.94);
        if (rightArm) rightArm.rotation.set(0.29, 0.57, 0.21);
        if (rightForeArm) rightForeArm.rotation.set(0.18, -0.17, 0);

        // Left Arm (Mirrored from Right)
        // Negating Y and Z for symmetry to match the other side
        if (leftClav) leftClav.rotation.set(0.82, -0.70, -1.94);
        if (leftArm) leftArm.rotation.set(0.29, -0.57, -0.21);
        if (leftForeArm) leftForeArm.rotation.set(0.18, 0.17, 0);

        // Lip Sync
        const { morphMesh } = fbx.userData;
        if (morphMesh && morphMesh.morphTargetDictionary && morphMesh.morphTargetInfluences) {
            const LERP_SPEED = 0.5;

            if (isTalking && currentViseme.current) {
                const targetName = currentViseme.current.name;
                const targetIndex = morphMesh.morphTargetDictionary[targetName];
                Object.values(VISEME_MAP).forEach(name => {
                    const idx = morphMesh.morphTargetDictionary[name];
                    if (idx !== undefined) {
                        const val = (idx === targetIndex) ? 1.0 : 0;
                        morphMesh.morphTargetInfluences[idx] = THREE.MathUtils.lerp(morphMesh.morphTargetInfluences[idx], val, LERP_SPEED);
                    }
                });
            } else if (isTalking) {
                let mouthIdx = morphMesh.morphTargetDictionary['Mouth_Open'];
                if (mouthIdx === undefined) mouthIdx = morphMesh.morphTargetDictionary['A25_Jaw_Open'];
                if (mouthIdx !== undefined) morphMesh.morphTargetInfluences[mouthIdx] = (Math.sin(t * 15) + 1) * 0.3;
            } else {
                Object.values(VISEME_MAP).forEach(name => {
                    const idx = morphMesh.morphTargetDictionary[name];
                    if (idx !== undefined) morphMesh.morphTargetInfluences[idx] = THREE.MathUtils.lerp(morphMesh.morphTargetInfluences[idx], 0, 0.2);
                });
                let mouthIdx = morphMesh.morphTargetDictionary['Mouth_Open'] || morphMesh.morphTargetDictionary['A25_Jaw_Open'];
                if (mouthIdx !== undefined) morphMesh.morphTargetInfluences[mouthIdx] = THREE.MathUtils.lerp(morphMesh.morphTargetInfluences[mouthIdx], 0, 0.2);
            }
        }
    });

    // --- INTERACTION ---
    const handleClick = (e) => {
        e.stopPropagation();

        if (!isActive) {
            onActivate();
            return;
        }

        if (convaiManager.current) {
            if (isListening) {
                setIsListening(false);
                convaiManager.current.stopListening();
            } else {
                setIsListening(true);
                convaiManager.current.startListening();
            }
        }
    };

    return (
        <group
            ref={group}
            position={position}
            rotation={rotation}
            onClick={handleClick}
            onPointerOver={() => document.body.style.cursor = 'pointer'}
            onPointerOut={() => document.body.style.cursor = 'auto'}
        >
            <primitive object={fbx} scale={scale} />

            {/* UI TAG */}
            {showUI && (
                <Html position={[0, 1.85, 0]} center transform scale={0.25} style={{ pointerEvents: 'none' }}>
                    <div style={{
                        cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'auto',
                        transform: 'scale(0.5)'
                    }} onClick={handleClick}>

                        {/* Main Button Circle */}
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '50%',
                            background: isActive
                                ? (isListening ? 'rgba(0, 255, 128, 0.8)' : 'rgba(0, 0, 0, 0.6)') // Active Colors
                                : 'rgba(0, 200, 255, 0.6)', // Inactive Color (Blue)
                            border: isActive
                                ? (isListening ? '4px solid #00ff80' : '2px solid rgba(255,255,255,0.2)')
                                : '2px solid rgba(0,255,255, 0.5)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: isListening ? '0 0 30px rgba(0, 255, 128, 0.5)' : '0 5px 15px rgba(0,0,0,0.3)',
                            animation: isListening ? 'pulse-ring 2s infinite' : (isActive ? 'none' : 'float 3s infinite ease-in-out')
                        }}>
                            {isActive ? (
                                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={isListening ? "#000" : "#fff"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                    <line x1="12" y1="19" x2="12" y2="23" />
                                    <line x1="8" y1="23" x2="16" y2="23" />
                                </svg>
                            ) : (
                                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                </svg>
                            )}
                        </div>

                        <div style={{
                            background: 'rgba(0,0,0,0.85)', padding: '4px 12px', borderRadius: '6px',
                            color: 'white', fontSize: '20px', fontWeight: '600', marginTop: '6px',
                            opacity: 1, transition: 'all 0.2s', whiteSpace: 'nowrap'
                        }}>
                            {!isActive ? t('hologram.connect', "Connect") : (isListening ? t('hologram.listening', "Listening") : t('hologram.chat', "Chat"))}
                        </div>

                        <div style={{
                            color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginTop: '4px',
                            fontWeight: '400', textTransform: 'uppercase', letterSpacing: '1px'
                        }}>
                            {!isActive ? t('hologram.click_to_talk', "Click to Talk") : t('hologram.press_to_talk', "Press T to talk")}
                        </div>
                    </div>
                    <style>{`
                        @keyframes pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(0, 255, 128, 0.7); } 70% { box-shadow: 0 0 0 20px rgba(0, 255, 128, 0); } 100% { box-shadow: 0 0 0 0 rgba(0, 255, 128, 0); } }
                        @keyframes float { 0% { transform: translateY(0px) scale(1); } 50% { transform: translateY(-5px) scale(1.05); } 100% { transform: translateY(0px) scale(1); } }
                    `}</style>
                </Html>
            )}
        </group>
    );
}
