/*
* Microwave.jsx
* High-fidelity procedural microwave with interior details.
*/
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Cylinder, RoundedBox, Text } from '@react-three/drei';
import * as THREE from 'three';

export function Microwave({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }) {
    const turntableRef = useRef();

    // Animate Turntable
    useFrame((state) => {
        if (turntableRef.current) {
            turntableRef.current.rotation.y += 0.01;
        }
    });

    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: "#d0d0d0",
        metalness: 0.7,
        roughness: 0.2
    });

    const glassMaterial = new THREE.MeshPhysicalMaterial({
        color: "#111",
        roughness: 0.05,
        metalness: 0.9,
        transparent: true,
        opacity: 0.7,
        transmission: 0.2, // Slight see-through
        thickness: 0.5
    });

    return (
        <group position={position} rotation={rotation} scale={scale}>
            {/* --- MAIN BODY --- */}
            <RoundedBox args={[2.8, 1.6, 1.8]} radius={0.1} smoothness={4} position={[0, 0, 0]}>
                <primitive object={bodyMaterial} />
            </RoundedBox>

            {/* --- INTERIOR CAVITY (Visual Hack: Black box slightly smaller) --- */}
            <mesh position={[-0.4, 0, 0.05]}>
                <boxGeometry args={[1.8, 1.2, 1.6]} />
                <meshStandardMaterial color="#222" side={THREE.BackSide} />
            </mesh>

            {/* Internal Light */}
            <pointLight position={[0, 0.5, 0]} intensity={2} distance={2} color="#ffde7d" />

            {/* Turntable */}
            <group position={[-0.4, -0.55, 0]}>
                <Cylinder ref={turntableRef} args={[0.7, 0.7, 0.05, 32]}>
                    <meshStandardMaterial color="#ffffff" transparent opacity={0.6} roughness={0.2} />
                </Cylinder>
                <Cylinder args={[0.1, 0.1, 0.1, 16]} position={[0, -0.05, 0]}>
                    <meshStandardMaterial color="#333" />
                </Cylinder>
            </group>


            {/* --- DOOR --- */}
            <group position={[-0.4, 0, 0.92]}>
                {/* Door Frame */}
                <RoundedBox args={[1.9, 1.4, 0.1]} radius={0.05} smoothness={4}>
                    <meshStandardMaterial color="#111" metalness={0.8} roughness={0.2} />
                </RoundedBox>
                {/* Glass Window */}
                <RoundedBox args={[1.6, 1.1, 0.11]} radius={0.02} smoothness={2}>
                    <primitive object={glassMaterial} />
                </RoundedBox>
                {/* Handle */}
                <RoundedBox args={[0.08, 1, 0.1]} radius={0.02} position={[0.75, 0, 0.15]}>
                    <meshStandardMaterial color="#e0e0e0" metalness={0.9} roughness={0.1} />
                </RoundedBox>
            </group>

            {/* --- CONTROL PANEL (Right Side) --- */}
            <group position={[1.0, 0, 0.91]}>
                <mesh position={[0, 0, 0]}>
                    <planeGeometry args={[0.7, 1.4]} />
                    <meshStandardMaterial color="#1a1a1a" />
                </mesh>

                {/* Digital Display */}
                <group position={[0, 0.45, 0.01]}>
                    <mesh>
                        <planeGeometry args={[0.55, 0.25]} />
                        <meshStandardMaterial color="#000" />
                    </mesh>
                    <Text position={[0, 0, 0.01]} fontSize={0.15} color="#00ff00" font="https://fonts.gstatic.com/s/roboto/v18/KFOmCnqEu92Fr1Mu4mxM.woff">
                        12:00
                    </Text>
                </group>

                {/* Buttons Grid */}
                {/* Row 1 */}
                <mesh position={[-0.15, 0.1, 0.01]}>
                    <boxGeometry args={[0.15, 0.1, 0.02]} />
                    <meshStandardMaterial color="#333" />
                </mesh>
                <mesh position={[0.15, 0.1, 0.01]}>
                    <boxGeometry args={[0.15, 0.1, 0.02]} />
                    <meshStandardMaterial color="#333" />
                </mesh>
                {/* Row 2 */}
                <mesh position={[-0.15, -0.05, 0.01]}>
                    <boxGeometry args={[0.15, 0.1, 0.02]} />
                    <meshStandardMaterial color="#333" />
                </mesh>
                <mesh position={[0.15, -0.05, 0.01]}>
                    <boxGeometry args={[0.15, 0.1, 0.02]} />
                    <meshStandardMaterial color="#333" />
                </mesh>
                {/* Row 3 */}
                <mesh position={[-0.15, -0.2, 0.01]}>
                    <boxGeometry args={[0.15, 0.1, 0.02]} />
                    <meshStandardMaterial color="#333" />
                </mesh>
                <mesh position={[0.15, -0.2, 0.01]}>
                    <boxGeometry args={[0.15, 0.1, 0.02]} />
                    <meshStandardMaterial color="#333" />
                </mesh>

                {/* Big Start Button */}
                <Cylinder args={[0.12, 0.12, 0.05, 32]} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.45, 0.01]}>
                    <meshStandardMaterial color="#e0e0e0" metalness={0.8} />
                </Cylinder>
            </group>

            {/* --- FEET --- */}
            <Cylinder args={[0.12, 0.1, 0.1, 16]} position={[-1.1, -0.85, 0.6]}>
                <meshStandardMaterial color="#111" />
            </Cylinder>
            <Cylinder args={[0.12, 0.1, 0.1, 16]} position={[1.1, -0.85, 0.6]}>
                <meshStandardMaterial color="#111" />
            </Cylinder>
            <Cylinder args={[0.12, 0.1, 0.1, 16]} position={[-1.1, -0.85, -0.6]}>
                <meshStandardMaterial color="#111" />
            </Cylinder>
            <Cylinder args={[0.12, 0.1, 0.1, 16]} position={[1.1, -0.85, -0.6]}>
                <meshStandardMaterial color="#111" />
            </Cylinder>
        </group>
    );
}
