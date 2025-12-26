/*
* FactoryPartition.jsx
* Procedural glass partition with metal frame.
*/
import React from 'react';
import { Box } from '@react-three/drei';

export function FactoryPartition({ width = 4, height = 3, position = [0, 0, 0], rotation = [0, 0, 0] }) {
    const frameThickness = 0.1;

    return (
        <group position={position} rotation={rotation}>
            {/* Glass Panel */}
            <mesh position={[0, height / 2, 0]} raycast={() => null}>
                <boxGeometry args={[width - frameThickness * 2, height - frameThickness * 2, 0.05]} />
                <meshPhysicalMaterial
                    color="#aaddff"
                    transparent
                    opacity={0.3}
                    roughness={0}
                    metalness={0.1}
                    transmission={0.8}
                    thickness={0.1}
                />
            </mesh>

            {/* Frame - Top */}
            <Box args={[width, frameThickness, 0.1]} position={[0, height - frameThickness / 2, 0]} castShadow>
                <meshStandardMaterial color="#555" metalness={0.8} roughness={0.2} />
            </Box>
            {/* Frame - Bottom */}
            <Box args={[width, frameThickness, 0.1]} position={[0, frameThickness / 2, 0]} castShadow>
                <meshStandardMaterial color="#555" metalness={0.8} roughness={0.2} />
            </Box>
            {/* Frame - Left */}
            <Box args={[frameThickness, height, 0.1]} position={[-width / 2 + frameThickness / 2, height / 2, 0]} castShadow>
                <meshStandardMaterial color="#555" metalness={0.8} roughness={0.2} />
            </Box>
            {/* Frame - Right */}
            <Box args={[frameThickness, height, 0.1]} position={[width / 2 - frameThickness / 2, height / 2, 0]} castShadow>
                <meshStandardMaterial color="#555" metalness={0.8} roughness={0.2} />
            </Box>
        </group>
    );
}
