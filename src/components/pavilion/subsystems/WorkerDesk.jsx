import React from 'react';
import { Box } from '@react-three/drei';

export function WorkerDesk(props) {
    return (
        <group {...props}>
            {/* Desktop */}
            <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
                <boxGeometry args={[1.6, 0.05, 0.8]} />
                <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.1} />
            </mesh>

            {/* Legs */}
            <mesh position={[-0.7, 0.375, -0.3]} castShadow receiveShadow>
                <boxGeometry args={[0.05, 0.75, 0.05]} />
                <meshStandardMaterial color="#cccccc" roughness={0.5} />
            </mesh>
            <mesh position={[0.7, 0.375, -0.3]} castShadow receiveShadow>
                <boxGeometry args={[0.05, 0.75, 0.05]} />
                <meshStandardMaterial color="#cccccc" roughness={0.5} />
            </mesh>
            <mesh position={[-0.7, 0.375, 0.3]} castShadow receiveShadow>
                <boxGeometry args={[0.05, 0.75, 0.05]} />
                <meshStandardMaterial color="#cccccc" roughness={0.5} />
            </mesh>
            <mesh position={[0.7, 0.375, 0.3]} castShadow receiveShadow>
                <boxGeometry args={[0.05, 0.75, 0.05]} />
                <meshStandardMaterial color="#cccccc" roughness={0.5} />
            </mesh>

            {/* Simple Monitor */}
            <group position={[0, 0.78, -0.2]}>
                <mesh position={[0, 0.25, 0]} castShadow>
                    <boxGeometry args={[0.6, 0.4, 0.02]} />
                    <meshStandardMaterial color="#111111" roughness={0.2} />
                </mesh>
                <mesh position={[0, 0, 0]} castShadow>
                    <boxGeometry args={[0.1, 0.1, 0.05]} />
                    <meshStandardMaterial color="#111111" />
                </mesh>
                {/* Screen Glow */}
                <mesh position={[0, 0.25, 0.015]}>
                    <planeGeometry args={[0.55, 0.35]} />
                    <meshStandardMaterial color="#00aaff" emissive="#00aaff" emissiveIntensity={0.5} />
                </mesh>
            </group>
        </group>
    );
}
