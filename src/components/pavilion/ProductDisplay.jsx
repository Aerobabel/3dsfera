import React, { useRef } from 'react';
import { useGLTF, Float, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

// --- SUB-COMPONENTS ---

import { HeavyDutyRobot } from './subsystems/HeavyDutyRobot';
import { Microwave } from './subsystems/Microwave';
import { Television } from './subsystems/Television';

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





// --- HELPER COMPONENT FOR GLTF LOADING ---
function GLTFModel({ path, scale, floating }) {
    const gltf = useGLTF(path);
    const scene = React.useMemo(() => gltf.scene.clone(), [gltf.scene]);

    if (floating) {
        return (
            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                <primitive object={scene} scale={[1.5, 1.5, 1.5]} />
            </Float>
        );
    }

    return <primitive object={scene} scale={[1.5, 1.5, 1.5]} />;
}

// --- MAIN COMPONENT ---

export default function ProductDisplay({
    modelPath,
    isTv = false,
    isRoboticArm = false,
    position = [0, 0, 0],
    rotation = [0, 0, 0],
    scale = 1,
    floating = false,
    hidePedestal = false,
    heightOffset = 0,
    ...props
}) {
    // Note: We no longer call useGLTF here to avoid conditional hook rules violations.
    // Instead we render GLTFModel only if we have a path.

    return (
        <group position={position} rotation={rotation} {...props}>
            {/* The Custom Geometry Pedestal - Fixed Scale */}
            {!hidePedestal && <ProceduralPedestal />}

            {/* The Product on Top - Scaled Independently */}
            <group position={[0, (hidePedestal ? 0.5 : 2.55) + (heightOffset || 0), 0]} scale={scale}>
                {isTv ? (
                    <Television scale={1.2} />
                ) : isRoboticArm ? (
                    <HeavyDutyRobot position={[0, -0.95, 0]} />
                ) : props.isMicrowave ? (
                    <Microwave scale={0.8} />
                ) : (
                    modelPath && <GLTFModel path={modelPath} floating={floating} />
                )}
            </group>
        </group>
    );
}
