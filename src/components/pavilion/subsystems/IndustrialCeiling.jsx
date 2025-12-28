/*
* IndustrialCeiling.jsx
* Repeatable ceiling structure with trusses and strip lighting.
*/
import React from 'react';
import { Box, Instance, Instances } from '@react-three/drei';

export default function IndustrialCeiling({ height = 12, width = 140, depth = 140 }) {
    const beamCount = 10;
    const beamSpacing = depth / beamCount;

    return (
        <group position={[0, height, 0]}>
            {/* Main Trusses (X-Axis) */}
            {Array.from({ length: beamCount + 1 }).map((_, i) => {
                const z = -depth / 2 + i * beamSpacing;
                return (
                    <group key={`truss-${i}`} position={[0, 0, z]}>
                        {/* Horizontal Beam */}
                        <Box args={[width, 0.5, 0.5]} position={[0, 0, 0]}>
                            <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.4} />
                        </Box>

                        {/* Vertical Supports (Detailing) */}
                        {Array.from({ length: 8 }).map((_, j) => {
                            const x = -width / 2 + 10 + (j * (width - 20) / 7);
                            return (
                                <Box key={`sup-${j}`} args={[0.2, 2, 0.2]} position={[x, 1, 0]}>
                                    <meshStandardMaterial color="#222" metalness={0.8} roughness={0.4} />
                                </Box>
                            )
                        })}

                        {/* Light Strips attached to beams */}
                        <Box args={[width, 0.1, 0.2]} position={[0, -0.3, 0]}>
                            <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={0.5} toneMapped={false} />
                        </Box>
                    </group>
                );
            })}

            {/* Cross Beams (Z-Axis) -> Less frequent */}
            {[-width / 3, 0, width / 3].map((x, i) => (
                <Box key={`cross-${i}`} args={[0.5, 0.4, depth]} position={[x, 0.5, 0]}>
                    <meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.5} />
                </Box>
            ))}
        </group>
    );
}
