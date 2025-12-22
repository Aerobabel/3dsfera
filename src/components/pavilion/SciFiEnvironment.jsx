import React, { useRef } from 'react';
import { useTexture, MeshReflectorMaterial, Stars, Float } from '@react-three/drei';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

// 1. HEXAGONAL FLOOR - REVERTED TO SIMPLE REFLECTIVE
export function HexSciFiFloor() {
    return (
        <group position={[0, -0.05, 0]}>
            {/* BASE: Simple Reflective White Floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
                <planeGeometry args={[60, 100]} />
                <MeshReflectorMaterial
                    blur={[300, 100]}
                    resolution={1024}
                    mixBlur={1}
                    mixStrength={40}
                    roughness={0.1}
                    depthScale={1}
                    minDepthThreshold={0.4}
                    maxDepthThreshold={1.4}
                    color="#e0e0e0" // Light Grey (Safer than pure white)
                    metalness={0.5}
                    mirror={0.5}
                />
            </mesh>

            {/* Decorative side runners */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-18, 0.02, 0]}>
                <planeGeometry args={[1, 100]} />
                <meshBasicMaterial color="#00aaff" transparent opacity={0.5} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[18, 0.02, 0]}>
                <planeGeometry args={[1, 100]} />
                <meshBasicMaterial color="#00aaff" transparent opacity={0.5} />
            </mesh>
        </group>
    );
}

// 2. TUNNEL ARCHES
export function SciFiArches() {
    const count = 8;
    const spacing = 12;
    const startZ = -30;

    return (
        <group>
            {Array.from({ length: count }).map((_, i) => (
                <group key={i} position={[0, 0, startZ + i * spacing]}>
                    <mesh rotation={[0, 0, 0]}>
                        <torusGeometry args={[22, 1.5, 16, 100, Math.PI]} />
                        <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.8} />
                    </mesh>
                    <mesh rotation={[0, 0, 0]} scale={[0.95, 0.95, 1]}>
                        <torusGeometry args={[22, 0.2, 16, 100, Math.PI]} />
                        <meshBasicMaterial color="#ffffff" toneMapped={false} />
                    </mesh>
                    <mesh position={[-22, 10, 0]}>
                        <boxGeometry args={[3, 20, 3]} />
                        <meshStandardMaterial color="#eeeeee" roughness={0.1} metalness={0.5} />
                    </mesh>
                    <mesh position={[22, 10, 0]}>
                        <boxGeometry args={[3, 20, 3]} />
                        <meshStandardMaterial color="#eeeeee" roughness={0.1} metalness={0.5} />
                    </mesh>
                </group>
            ))}
        </group>
    )
}

// 3. SPACE WINDOW (Rear Portal)
export function SpaceWindow() {
    return (
        <group position={[0, 15, -45]}>
            {/* Frame */}
            <mesh>
                <ringGeometry args={[20, 24, 64]} />
                <meshStandardMaterial color="#333" roughness={0.2} metalness={1} />
            </mesh>
            {/* Glass/Portal */}
            <mesh>
                <circleGeometry args={[19.8, 64]} />
                <meshBasicMaterial color="#000010" />
            </mesh>
            {/* Stars View */}
            <group position={[0, 0, -5]}>
                <Stars radius={50} depth={20} count={3000} factor={4} saturation={0} fade speed={0.5} />
            </group>

            {/* Floating Elements outside window */}
            <Float speed={1} rotationIntensity={0.2} floatIntensity={0.2}>
                <mesh position={[-10, 5, -10]}>
                    <icosahedronGeometry args={[2]} />
                    <meshStandardMaterial color="#444" wireframe />
                </mesh>
            </Float>
        </group>
    )
}

// 4. CEILING LIGHTS (Linear Strips)
export function LabCeilingLights() {
    return (
        <group position={[0, 20, 0]}>
            {/* Long central lighting strips */}
            <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <planeGeometry args={[4, 100]} />
                <meshBasicMaterial color="#ffffff" toneMapped={false} />
            </mesh>
            {/* Side Angled Lights */}
            <mesh position={[-10, -2, 0]} rotation={[Math.PI / 2, 0, Math.PI / 6]}>
                <planeGeometry args={[2, 100]} />
                <meshStandardMaterial color="#ccffff" emissive="#ccffff" emissiveIntensity={0.5} />
            </mesh>
            <mesh position={[10, -2, 0]} rotation={[Math.PI / 2, 0, -Math.PI / 6]}>
                <planeGeometry args={[2, 100]} />
                <meshStandardMaterial color="#ccffff" emissive="#ccffff" emissiveIntensity={0.5} />
            </mesh>
        </group>
    )
}

export default function SciFiEnvironment() {
    return (
        <group>
            <HexSciFiFloor />
            <SciFiArches />
            <SpaceWindow />
            <LabCeilingLights />

            {/* Ambient Fill for that bright lab look */}
            <ambientLight intensity={1.5} color="#ffffff" />
            <hemisphereLight intensity={1} groundColor="#e0e0e0" />
        </group>
    )
}
