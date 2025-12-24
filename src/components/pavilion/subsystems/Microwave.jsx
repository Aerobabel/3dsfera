/*
* Microwave.jsx
* Procedural Microwave appliance.
*/
import React from 'react';
import { Box, Cylinder } from '@react-three/drei';

export function Microwave() {
    return (
        <group>
            {/* Main Body */}
            <Box args={[2.5, 1.4, 1.4]} position={[0, 0, 0]}>
                <meshStandardMaterial color="#e0e0e0" metalness={0.6} roughness={0.2} />
            </Box>

            {/* Door Frame */}
            <Box args={[1.5, 1.1, 0.1]} position={[-0.35, 0, 0.7]}>
                <meshStandardMaterial color="#222" metalness={0.8} roughness={0.1} />
            </Box>
            {/* Door Window */}
            <Box args={[1.2, 0.8, 0.05]} position={[-0.35, 0, 0.73]}>
                <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} transparent opacity={0.9} />
            </Box>

            {/* Control Panel Area */}
            <Box args={[0.05, 1.2, 0.02]} position={[0.65, 0, 0.71]}>
                <meshStandardMaterial color="#444" />
            </Box>

            {/* Digital Display (Clock) */}
            <Box args={[0.5, 0.3, 0.05]} position={[0.85, 0.3, 0.7]}>
                <meshBasicMaterial color="#000" />
            </Box>
            <mesh position={[0.85, 0.3, 0.73]}>
                <planeGeometry args={[0.4, 0.2]} />
                <meshBasicMaterial color="#00ff00" />
            </mesh>

            {/* Buttons / Dial */}
            <Cylinder args={[0.15, 0.15, 0.1, 32]} rotation={[Math.PI / 2, 0, 0]} position={[0.85, -0.2, 0.7]}>
                <meshStandardMaterial color="#888" metalness={0.5} roughness={0.2} />
            </Cylinder>
            <Box args={[0.4, 0.08, 0.05]} position={[0.85, 0.0, 0.7]}>
                <meshStandardMaterial color="#666" />
            </Box>
            <Box args={[0.4, 0.08, 0.05]} position={[0.85, -0.45, 0.7]}>
                <meshStandardMaterial color="#666" />
            </Box>

            {/* Feet */}
            <Cylinder args={[0.1, 0.08, 0.1, 16]} position={[-1, -0.75, 0.5]}>
                <meshStandardMaterial color="#111" />
            </Cylinder>
            <Cylinder args={[0.1, 0.08, 0.1, 16]} position={[1, -0.75, 0.5]}>
                <meshStandardMaterial color="#111" />
            </Cylinder>
            <Cylinder args={[0.1, 0.08, 0.1, 16]} position={[-1, -0.75, -0.5]}>
                <meshStandardMaterial color="#111" />
            </Cylinder>
            <Cylinder args={[0.1, 0.08, 0.1, 16]} position={[1, -0.75, -0.5]}>
                <meshStandardMaterial color="#111" />
            </Cylinder>
        </group>
    );
}
