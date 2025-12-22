/*
* CrateStack.jsx
* Procedural stack of sci-fi shipping crates to fill empty floor space.
*/
import React from 'react';
import { RoundedBox } from '@react-three/drei';

function Crate({ position, color = "#444" }) {
    return (
        <group position={position}>
            <RoundedBox args={[2.5, 2.5, 2.5]} radius={0.1} smoothness={4}>
                <meshStandardMaterial color={color} roughness={0.3} metalness={0.6} />
            </RoundedBox>
            {/* Tech details/grooves */}
            <mesh position={[0, 0, 1.3]}>
                <planeGeometry args={[2, 2]} />
                <meshStandardMaterial color="#222" />
            </mesh>
            {/* Glowing Status Light */}
            <mesh position={[1, 1, 1.31]}>
                <circleGeometry args={[0.1, 16]} />
                <meshBasicMaterial color="#00ff00" />
            </mesh>
        </group>
    );
}

export default function CrateStack({ position, rotation }) {
    return (
        <group position={position} rotation={rotation}>
            {/* Base Layer */}
            <Crate position={[0, 1.25, 0]} color="#556677" />
            <Crate position={[2.6, 1.25, 0]} color="#667788" />
            <Crate position={[0, 1.25, 2.6]} color="#445566" />

            {/* Second Layer */}
            <Crate position={[0.5, 3.8, 0.5]} rotation={[0, 0.2, 0]} color="#778899" />

            {/* Scattered Crate */}
            <Crate position={[4, 1.25, 3]} rotation={[0, 0.5, 0]} color="#556677" />
        </group>
    );
}
