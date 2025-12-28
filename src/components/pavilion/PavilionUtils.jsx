import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Helper to ensure scene is actually rendered before hiding loader
export function SceneReadyNotifier({ onReady }) {
    const { gl } = useThree();
    const frameCount = useRef(0);

    useFrame(() => {
        if (frameCount.current < 4) { // Wait 4 frames for safety (shader compile/upload)
            frameCount.current += 1;
            return;
        }
        // Force a gl compile check or just trust the frames
        onReady();
    });
    return null;
}

export function TexturedWall({ position, rotation, args, color = "#111", textureUrl }) {
    const texture = useTexture(textureUrl);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(args[0] / 20, args[1] / 20); // Scale texture (1 repeat per 20 units)

    return (
        <mesh position={position} rotation={rotation}>
            <planeGeometry args={args} />
            <meshStandardMaterial map={texture} color={color} metalness={0.5} roughness={0.6} />
        </mesh>
    );
}
