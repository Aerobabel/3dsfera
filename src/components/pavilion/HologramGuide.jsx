import React, { useEffect, useRef, useMemo } from 'react';
import { useFBX, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';

const HOLOGRAM_PATH = '/objects/3dsfera.Fbx';

export default function HologramGuide({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 0.013 }) {
    const group = useRef();
    const fbx = useFBX(HOLOGRAM_PATH);

    // Clone Scene
    const clonedScene = useMemo(() => {
        const clone = SkeletonUtils.clone(fbx);

        // Apply Transparency to Original Materials
        clone.traverse((child) => {
            if (child.isMesh) {
                // Ensure material is cloned to avoid side effects
                child.material = child.material.clone();
                child.material.transparent = true;
                child.material.opacity = 0.85; // Slightly more solid
                child.material.depthWrite = true; // Fixes "inside-out" sorting issues
                child.material.side = THREE.FrontSide; // Better for characters than DoubleSide

                // Fix "Dark/Metallic" look by removing reflections
                if (child.material.metalness !== undefined) child.material.metalness = 0.1;
                if (child.material.roughness !== undefined) child.material.roughness = 0.8;

                // Add slight emission if it supports it, to prevent being pitch black
                if (child.material.emissive) {
                    child.material.emissive = new THREE.Color(0x222222);
                }
            }
        });
        return clone;
    }, [fbx]);

    const { actions, names } = useAnimations(fbx.animations, clonedScene);

    // Play Idle Animation
    useEffect(() => {
        if (actions && names.length > 0) {
            const action = actions[names[0]]; // Assume first is Idle
            if (action) {
                action.reset().fadeIn(0.5).play();
            }
        }
    }, [actions, names]);

    // No useFrame needed (Shader logic removed)

    return (
        <group ref={group} position={position} rotation={rotation} dispose={null}>
            <primitive object={clonedScene} scale={scale} />

            {/* Base Ring Hologram Projector */}
            <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.3, 0.4, 32]} />
                <meshBasicMaterial color="#00ffff" transparent opacity={0.5} side={THREE.DoubleSide} />
            </mesh>
            <pointLight position={[0, 1, 0]} color="cyan" intensity={2} distance={3} />
        </group>
    );
}
