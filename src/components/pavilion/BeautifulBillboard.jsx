import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture, Text } from '@react-three/drei';
import * as THREE from 'three';

export function BeautifulBillboard({ position, rotation, textureUrl, scale = 1, color = "#00ffff" }) {
    const meshRef = useRef();
    const frameRef = useRef();
    const texture = useTexture(textureUrl);

    // Animate: Floating + Pulse
    useFrame((state) => {
        if (!meshRef.current || !frameRef.current) return;

        const t = state.clock.getElapsedTime();

        // Floating
        meshRef.current.position.y = position[1] + Math.sin(t * 0.5) * 0.1;
        frameRef.current.position.y = position[1] + Math.sin(t * 0.5) * 0.1;

        // Subtle Pulse on emissive intensity
        if (meshRef.current.material) {
            meshRef.current.material.emissiveIntensity = 0.5 + Math.sin(t * 2) * 0.2;
        }
    });

    const width = 3 * scale;
    const height = 5 * scale;
    const frameThickness = 0.1 * scale;

    return (
        <group position={[position[0], 0, position[2]]} rotation={rotation}>
            {/* The Holographic Panel */}
            <mesh ref={meshRef} position={[0, position[1], 0]}>
                <boxGeometry args={[width, height, 0.05]} />
                <meshStandardMaterial
                    map={texture}
                    emissive={color}
                    emissiveMap={texture}
                    emissiveIntensity={1.0}
                    toneMapped={false}
                    color={"white"}
                />
            </mesh>

            {/* Tech Frame (Top/Bottom bars) */}
            <group ref={frameRef} position={[0, position[1], 0]}>
                {/* Top Bar */}
                <mesh position={[0, height / 2 + frameThickness / 2, 0]}>
                    <boxGeometry args={[width + 0.2 * scale, frameThickness, 0.1]} />
                    <meshStandardMaterial color="#1a1a1a" emissive={color} emissiveIntensity={2} />
                </mesh>

                {/* Bottom Bar */}
                <mesh position={[0, -height / 2 - frameThickness / 2, 0]}>
                    <boxGeometry args={[width + 0.2 * scale, frameThickness, 0.1]} />
                    <meshStandardMaterial color="#1a1a1a" emissive={color} emissiveIntensity={2} />
                </mesh>

                {/* Cyber Accents (Corners) */}
                <mesh position={[-width / 2, height / 2, 0.05]}>
                    <boxGeometry args={[0.2 * scale, 0.6 * scale, 0.05]} />
                    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} toneMapped={false} />
                </mesh>
                <mesh position={[width / 2, -height / 2, 0.05]}>
                    <boxGeometry args={[0.2 * scale, 0.6 * scale, 0.05]} />
                    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} toneMapped={false} />
                </mesh>
            </group>

            {/* Light Source (Fake Glow) */}
            <pointLight position={[0, position[1], 1]} distance={5} intensity={2} color={color} />
        </group>
    );
}
