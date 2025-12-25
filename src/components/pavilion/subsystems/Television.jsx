/*
* Television.jsx
* High-fidelity procedural OLED TV with Ambilight effect.
*/
import React from 'react';
import { Box, Cylinder, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

export function Television({ scale = 1, position = [0, 0, 0], rotation = [0, 0, 0] }) {
    return (
        <group scale={scale} position={position} rotation={rotation}>
            {/* --- SCREEN PANEL --- */}
            <group position={[0, 0.3, 0]}>
                {/* Main Body (Ultra thin) */}
                <RoundedBox args={[3.4, 2.0, 0.05]} radius={0.02} smoothness={4}>
                    <meshStandardMaterial color="#111" metalness={0.8} roughness={0.2} />
                </RoundedBox>

                {/* The Display Surface (OLED Black) */}
                <group position={[0, 0, 0.026]}>
                    <mesh>
                        <planeGeometry args={[3.35, 1.95]} />
                        <meshPhysicalMaterial
                            color="#000"
                            roughness={0.05}
                            metalness={0.2}
                            clearcoat={1}
                            clearcoatRoughness={0}
                        />
                    </mesh>
                    {/* Fake Reflection / Glint */}
                    <mesh position={[0.5, 0.5, 0.001]} rotation={[0, 0, -0.5]}>
                        <planeGeometry args={[2, 0.1]} />
                        <meshBasicMaterial color="#ffffff" opacity={0.03} transparent />
                    </mesh>
                </group>

                {/* Back Electronics Bump (Lower half) */}
                <RoundedBox args={[1.5, 1.2, 0.1]} radius={0.05} position={[0, -0.3, -0.08]}>
                    <meshStandardMaterial color="#1a1a1a" roughness={0.6} />
                </RoundedBox>

                {/* Ambilight Glow (Back) */}
                <pointLight position={[0, 0, -0.5]} color="#4444ff" intensity={1} distance={3} decay={2} />
            </group>

            {/* --- STAND --- */}
            <group position={[0, -0.8, -0.1]}>
                {/* Stem */}
                <Box args={[0.4, 0.4, 0.05]} position={[0, 0.2, 0]} rotation={[-0.2, 0, 0]}>
                    <meshStandardMaterial color="#222" metalness={0.7} roughness={0.3} />
                </Box>
                {/* Base Plate */}
                <RoundedBox args={[1.2, 0.04, 0.6]} radius={0.02} position={[0, 0, 0.1]}>
                    <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
                </RoundedBox>
            </group>
        </group>
    );
}
