import React, { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
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

    // Generate Chalkboard Texture with Text
    const chalkboardTexture = useMemo(() => {
        const canvas = document.createElement('canvas');
        const width = 512;
        const height = 1024;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Background
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, width, height);

        // Text style
        ctx.font = 'bold 70px "Chalkboard SE", "Comic Sans MS", sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Shadow
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        // Word wrap handling
        const cleanText = text.replace(/\\n/g, '\n');
        const lines = cleanText.split('\n');
        const lineHeight = 80;
        const startY = height / 2 - ((lines.length - 1) * lineHeight) / 2;

        lines.forEach((line, i) => {
            ctx.fillText(line, width / 2, startY + (i * lineHeight));
        });

        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        return tex;
    }, [text]);

    const chalkboardMaterial = useMemo(() => new THREE.MeshStandardMaterial({
        map: chalkboardTexture,
        roughness: 0.9,
        metalness: 0,
        side: THREE.DoubleSide,
    }), [chalkboardTexture]);

    // Reusable Board Side Component
    const BoardSide = ({ isFront }) => {
        const tilt = isFront ? OPENING_ANGLE : -OPENING_ANGLE;

        // Fix: Determine "Outer" face properties based on tilt direction.
        // Tilt > 0 rotates to -Z (Back Leg). Outer face is -Z.
        // Tilt < 0 rotates to +Z (Front Leg). Outer face is +Z.
        const isBackLeg = tilt > 0;

        const zOffset = isBackLeg ? -FRAME_THICKNESS / 2 - 0.001 : FRAME_THICKNESS / 2 + 0.001;
        const textRotation = isBackLeg ? Math.PI : 0;
        const textScaleX = 1; // Always 1. Rotation 180 handles the flip, scale -1 caused mirroring.

        return (
            <group rotation={[tilt, 0, 0]}>
                <group position={[0, -BOARD_HEIGHT / 2, 0]}>
                    <mesh castShadow receiveShadow material={woodMaterial}>
                        <boxGeometry args={[BOARD_WIDTH, BOARD_HEIGHT, FRAME_THICKNESS]} />
                    </mesh>

                    {/* Chalkboard Texture Surface (Outer Face) */}
                    <mesh
                        position={[0, 0, zOffset]}
                        rotation={[0, textRotation, 0]}
                        scale={[textScaleX, 1, 1]}
                        material={chalkboardMaterial}
                    >
                        <planeGeometry args={[BOARD_WIDTH - 0.15, BOARD_HEIGHT - 0.2]} />
                    </mesh>
                </group>
            </group>
        );
    };

    const topHingeY = BOARD_HEIGHT * Math.cos(OPENING_ANGLE);

    return (
        <group position={position} rotation={rotation} scale={scale}>
            <group position={[0, topHingeY, 0]}>
                {/* Hinge */}
                <mesh material={woodMaterial}>
                    <cylinderGeometry args={[FRAME_THICKNESS / 2, FRAME_THICKNESS / 2, BOARD_WIDTH, 16]} rotation={[0, 0, Math.PI / 2]} />
                </mesh>

                <BoardSide isFront={true} />
                <BoardSide isFront={false} />
            </group>
        </group>
    );
}
