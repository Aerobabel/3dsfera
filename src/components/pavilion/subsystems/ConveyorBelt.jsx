/*
* ConveyorBelt.jsx
* Procedural conveyor belt component for factory floor.
*/
import React, { useMemo } from 'react';
import { Box, Cylinder } from '@react-three/drei';

export function ConveyorBelt({ length = 10, width = 2, height = 0.8, position = [0, 0, 0], rotation = [0, 0, 0] }) {
    const rollerCount = Math.floor(length / 0.5);
    const rollers = useMemo(() => {
        return new Array(rollerCount).fill(0).map((_, i) => (i * 0.5) - (length / 2) + 0.25);
    }, [length, rollerCount]);

    return (
        <group position={position} rotation={rotation}>
            {/* Main Frame Rails */}
            <Box args={[length, 0.2, 0.1]} position={[0, height, width / 2]} castShadow receiveShadow>
                <meshStandardMaterial color="#444" metalness={0.8} roughness={0.2} />
            </Box>
            <Box args={[length, 0.2, 0.1]} position={[0, height, -width / 2]} castShadow receiveShadow>
                <meshStandardMaterial color="#444" metalness={0.8} roughness={0.2} />
            </Box>

            {/* Legs */}
            <Box args={[0.2, height, 0.2]} position={[-length / 2 + 0.5, height / 2, width / 2]} castShadow>
                <meshStandardMaterial color="#333" />
            </Box>
            <Box args={[0.2, height, 0.2]} position={[-length / 2 + 0.5, height / 2, -width / 2]} castShadow>
                <meshStandardMaterial color="#333" />
            </Box>
            <Box args={[0.2, height, 0.2]} position={[length / 2 - 0.5, height / 2, width / 2]} castShadow>
                <meshStandardMaterial color="#333" />
            </Box>
            <Box args={[0.2, height, 0.2]} position={[length / 2 - 0.5, height / 2, -width / 2]} castShadow>
                <meshStandardMaterial color="#333" />
            </Box>
            {/* Legs Middle (if long) */}
            {length > 5 && (
                <>
                    <Box args={[0.2, height, 0.2]} position={[0, height / 2, width / 2]} castShadow>
                        <meshStandardMaterial color="#333" />
                    </Box>
                    <Box args={[0.2, height, 0.2]} position={[0, height / 2, -width / 2]} castShadow>
                        <meshStandardMaterial color="#333" />
                    </Box>
                </>
            )}

            {/* Rollers */}
            {rollers.map((x, i) => (
                <Cylinder key={i} args={[0.08, 0.08, width - 0.1, 16]} rotation={[Math.PI / 2, 0, 0]} position={[x, height, 0]} castShadow>
                    <meshStandardMaterial color="#111" roughness={0.6} />
                </Cylinder>
            ))}

            {/* Belt Surface (Bottom return loop simulated) */}
            <Box args={[length, 0.02, width - 0.1]} position={[0, height - 0.15, 0]}>
                <meshStandardMaterial color="#000" roughness={0.9} />
            </Box>
        </group>
    );
}
