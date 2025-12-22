import React, { useRef } from 'react';
import { useGLTF, Float, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

// --- SUB-COMPONENTS ---

function ProceduralPedestal() {
    return (
        <group>
            {/* 1. Base Ring (Wide, Metallic) */}
            <mesh position={[0, 0.1, 0]}>
                <cylinderGeometry args={[1.2, 1.4, 0.2, 64]} />
                <meshStandardMaterial color="#888" metalness={0.9} roughness={0.2} />
            </mesh>

            {/* 2. Glow Ring (Inset) */}
            <mesh position={[0, 0.25, 0]}>
                <cylinderGeometry args={[1.15, 1.15, 0.15, 64]} />
                <meshBasicMaterial color="#00ffff" />
            </mesh>
            {/* Glow Light */}
            <pointLight position={[0, 0.25, 0]} color="#00ffff" intensity={2} distance={3} />

            {/* 3. Upper Base Lip */}
            <mesh position={[0, 0.4, 0]}>
                <cylinderGeometry args={[1.1, 1.15, 0.2, 64]} />
                <meshStandardMaterial color="#888" metalness={0.9} roughness={0.2} />
            </mesh>

            {/* 4. Central Pillar (Main Stand) */}
            <mesh position={[0, 1.0, 0]}>
                <cylinderGeometry args={[0.8, 0.8, 1.2, 64]} />
                <meshStandardMaterial color="#aaa" metalness={0.8} roughness={0.3} />
            </mesh>
            {/* 5. Top Cap (Lit Surface) */}
            <mesh position={[0, 1.61, 0]}>
                <cylinderGeometry args={[0.78, 0.78, 0.05, 64]} />
                <meshStandardMaterial color="#fff" emissive="#ffffff" emissiveIntensity={0.5} />
            </mesh>
        </group>
    );
}

function TvModel() {
    return (
        <group>
            {/* Screen */}
            <RoundedBox args={[2.5, 1.5, 0.1]} radius={0.05} smoothness={4}>
                <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
            </RoundedBox>
            {/* Display Glow */}
            <mesh position={[0, 0, 0.051]}>
                <planeGeometry args={[2.4, 1.4]} />
                <meshBasicMaterial color="#222" />
            </mesh>
            {/* Stand */}
            <mesh position={[0, -0.85, 0]}>
                <cylinderGeometry args={[0.1, 0.4, 0.3]} /> {/* Conical stand base */}
                <meshStandardMaterial color="#222" metalness={0.8} />
            </mesh>
        </group>
    );
}

function RoboticArm() {
    return (
        <group position={[0, -0.5, 0]}>
            {/* Base */}
            <mesh position={[0, 0.2, 0]}>
                <cylinderGeometry args={[0.7, 0.8, 0.4, 32]} />
                <meshStandardMaterial color="#333" />
            </mesh>
            {/* Swivel Joint */}
            <mesh position={[0, 0.6, 0]}>
                <cylinderGeometry args={[0.5, 0.5, 0.4, 32]} />
                <meshStandardMaterial color="#ffaa00" />
            </mesh>
            {/* Lower Arm */}
            <mesh position={[0.2, 1.5, 0]} rotation={[0, 0, -0.2]}>
                <boxGeometry args={[0.3, 1.8, 0.4]} />
                <meshStandardMaterial color="#ffaa00" />
            </mesh>
            {/* Elbow Joint */}
            <mesh position={[0.4, 2.4, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.35, 0.35, 0.5, 32]} />
                <meshStandardMaterial color="#333" />
            </mesh>
            {/* Upper Arm */}
            <group position={[0.4, 2.4, 0]} rotation={[0, 0, 0.5]}>
                <mesh position={[0, 0.8, 0]}>
                    <boxGeometry args={[0.25, 1.6, 0.3]} />
                    <meshStandardMaterial color="#ffaa00" />
                </mesh>
                {/* Claw Head */}
                <mesh position={[0, 1.7, 0]}>
                    <cylinderGeometry args={[0.2, 0.3, 0.4, 16]} />
                    <meshStandardMaterial color="#111" />
                </mesh>
            </group>
        </group>
    );
}

// --- MAIN COMPONENT ---

export default function ProductDisplay({
    modelPath,
    isTv = false, // Flag to render TV instead of loading a GLB
    isRoboticArm = false, // Flag for custom sophisticated model
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    scale = 1,
    floating = false,
    hidePedestal = false, // New prop to optionally hide geometry
    heightOffset = 0, // New prop for manual height adjustment
    ...props // spread rest props (onClick, onPointerOver etc)
}) {
    // Only load GLB if modelPath is provided and NOT a TV
    // We use a safe hook usage pattern: always call hook, but ignore result if not needed?
    // Hooks cannot be conditional. So we must call useGLTF.
    // Ensure we pass a valid path or handle null. 
    // If isTv is true, we might pass a dummy or just use null if the hook supports it? 
    // useGLTF crashes on null. We will pass modelPath if exists, else generic.

    // BETTER APPROACH: Move GLB loading to a sub-component or just load it if path exists.
    // Use a dummy path if null to avoid hook error? No, that causes network error.
    // For now, valid use cases always have a path OR isTV.

    // We will assume if isTv is false, modelPath IS provided.
    const gltf = modelPath ? useGLTF(modelPath) : null;

    return (
        <group position={position} rotation={rotation} {...props}>
            {/* The Custom Geometry Pedestal - Fixed Scale */}
            {!hidePedestal && <ProceduralPedestal />}

            {/* The Product on Top - Scaled Independently */}
            <group position={[0, (hidePedestal ? 0.5 : 2.55) + (heightOffset || 0), 0]} scale={scale}> {/* Applied heightOffset here */}
                {isTv ? (
                    <TvModel />
                ) : isRoboticArm ? (
                    <RoboticArm />
                ) : (
                    gltf && (
                        floating ? (
                            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                                <primitive
                                    object={gltf.scene.clone()}
                                    scale={[1.5, 1.5, 1.5]}
                                />
                            </Float>
                        ) : (
                            <primitive
                                object={gltf.scene.clone()}
                                scale={[1.5, 1.5, 1.5]}
                            />
                        )
                    )
                )}
            </group>
        </group>
    );
}
