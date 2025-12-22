/*
* HazardZone.jsx
* Procedural hazard stripes for floor marking.
*/
import React from 'react';
import { Plane } from '@react-three/drei';

export function HazardZone({ width = 4, length = 4, position = [0, 0.01, 0], rotation = [-Math.PI / 2, 0, 0] }) {
    return (
        <group position={position} rotation={rotation}>
            {/* Base Outline */}
            <Plane args={[width, length]} position={[0, 0, 0]}>
                <meshBasicMaterial color="#ffcc00" opacity={0.8} transparent />
            </Plane>
            <Plane args={[width - 0.2, length - 0.2]} position={[0, 0, 0.001]}>
                <meshBasicMaterial color="#222" opacity={0.9} transparent />
            </Plane>

            {/* Diagonal Stripes (Simplified as a grid or texture would be better, but this is a quick procedural outline) */}
            {/* For now, just a yellow border is often enough to indicate a zone, or we can use a texture. 
                 Let's stick to a solid border for simplicity and performance. */}
        </group>
    );
}
