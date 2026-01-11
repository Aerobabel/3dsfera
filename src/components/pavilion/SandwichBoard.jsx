import React, { useMemo } from 'react';
import { Text, useTexture } from '@react-three/drei';
import * as THREE from 'three';

export function SandwichBoard({ position, rotation, text = "Welcome", scale = 1 }) {

    // Aesthetic constants
    const BOARD_WIDTH = 0.8;
    const BOARD_HEIGHT = 1.2;
    const FRAME_THICKNESS = 0.08;
    const OPENING_ANGLE = Math.PI / 12; // 15 degrees

    // Materials
    const woodMaterial = useMemo(() => new THREE.MeshStandardMaterial({
        color: '#3d251e', // Dark wood
        roughness: 0.8,
        metalness: 0
    }), []);

    const chalkboardMaterial = useMemo(() => new THREE.MeshStandardMaterial({
        color: '#1a1a1a', // Almost black
        roughness: 0.9, // Matte
        metalness: 0,
    }), []);

    // Reusable Board Side Component
    const BoardSide = ({ isFront }) => (
        <group rotation={[isFront ? OPENING_ANGLE : -OPENING_ANGLE, 0, 0]}>
            {/* Wooden Frame */}
            <mesh position={[0, BOARD_HEIGHT / 2, 0]} castShadow receiveShadow material={woodMaterial}>
                <boxGeometry args={[BOARD_WIDTH, BOARD_HEIGHT, FRAME_THICKNESS]} />
            </mesh>

            {/* Chalkboard Surface (Inset) */}
            <mesh position={[0, BOARD_HEIGHT / 2, isFront ? FRAME_THICKNESS / 2 + 0.001 : -FRAME_THICKNESS / 2 - 0.001]} material={chalkboardMaterial}>
                <planeGeometry args={[BOARD_WIDTH - 0.15, BOARD_HEIGHT - 0.2]} />
            </mesh>

            {/* Content (Text) */}
            <Text
                position={[0, BOARD_HEIGHT / 2 + 0.1, isFront ? FRAME_THICKNESS / 2 + 0.01 : -FRAME_THICKNESS / 2 - 0.01]}
                rotation={[0, isFront ? 0 : Math.PI, 0]} // Flip text for back side
                fontSize={0.09}
                color="white"
                // font="/fonts/Inter-Bold.woff" // Removed: Font file not present
                anchorX="center"
                anchorY="middle"
                maxWidth={BOARD_WIDTH - 0.2}
                textAlign="center"
                // Hand-written aesthetic tweaks
                outlineWidth={0.002}
                outlineColor="#dddddd"
                fillOpacity={0.9}
            >
                {text.replace(/\\n/g, '\n')}
            </Text>
        </group>
    );

    return (
        <group position={position} rotation={rotation} scale={scale}>
            {/* Hinge/Top */}
            <mesh position={[0, BOARD_HEIGHT * Math.cos(OPENING_ANGLE) - 0.02, 0]} material={woodMaterial}>
                <cylinderGeometry args={[FRAME_THICKNESS / 2, FRAME_THICKNESS / 2, BOARD_WIDTH, 16]} rotation={[0, 0, Math.PI / 2]} />
            </mesh>

            <BoardSide isFront={true} />
            <BoardSide isFront={false} />

            {/* Feet (Simple physics/grounding look) */}
            {/* (Implicit in the board length, just need to make sure y=0 is floor) */}
        </group>
    );
}
