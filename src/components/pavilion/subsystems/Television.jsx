/*
* Television.jsx
* Procedural Flat Screen TV.
*/
import React from 'react';
import { Box, Cylinder } from '@react-three/drei';

export function Television() {
    return (
        <group>
            {/* Screen Bezel */}
            <Box args={[3.2, 1.9, 0.1]} position={[0, 0, 0]}>
                <meshStandardMaterial color="#111" metalness={0.7} roughness={0.3} />
            </Box>

            {/* The Actual Screen */}
            <Box args={[3.1, 1.8, 0.02]} position={[0, 0, 0.05]}>
                <meshStandardMaterial color="#050510" metalness={0.9} roughness={0.1} />
            </Box>
            {/* Reflection/Image Placeholder (Blue Glint) */}
            <mesh position={[0, 0, 0.061]}>
                <planeGeometry args={[3.0, 1.7]} />
                <meshBasicMaterial color="#000044" opacity={0.3} transparent />
            </mesh>

            {/* Stand Stem */}
            <Cylinder args={[0.1, 0.1, 0.6, 16]} position={[0, -1.0, -0.1]}>
                <meshStandardMaterial color="#222" metalness={0.5} roughness={0.5} />
            </Cylinder>

            {/* Stand Base */}
            <Box args={[1.2, 0.05, 0.6]} position={[0, -1.3, -0.1]}>
                <meshStandardMaterial color="#222" metalness={0.5} roughness={0.5} />
            </Box>

            {/* Back Panel Electronics bump */}
            <Box args={[1.5, 1.0, 0.3]} position={[0, -0.2, -0.2]}>
                <meshStandardMaterial color="#111" />
            </Box>
        </group>
    );
}
