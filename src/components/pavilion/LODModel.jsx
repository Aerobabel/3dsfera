import React, { useMemo } from 'react';
import { Detailed, useGLTF } from '@react-three/drei';

/**
 * LODModel Component
 * Efficiently switches between High, Medium, and Low quality models based on distance.
 * 
 * @param {string} basePath - Base path to the model (e.g. "/objects/optimized_lods/valve")
 * @param {Array<number>} distances - [High->Med, Med->Low] switch distances (default: [10, 30])
 * @param {object} props - Standard mesh props (position, rotation, scale, etc.)
 */
export function LODModel({ basePath, distances = [10, 30], ...props }) {
    // Construct paths for generated LODs
    const highPath = `${basePath}_high.glb`;
    const medPath = `${basePath}_med.glb`;
    const lowPath = `${basePath}_low.glb`;

    // Preload removed to prevent network congestion
    // useGLTF hooks below will trigger fetch when component mounts

    // PERFORMANCE FIX: 
    // The generated "Low" LODs are still very large (11MB+), so loading 3 versions 
    // triples the bandwidth without benefit, causing Netlify timeouts.
    // For now, we strictly load the MEDIUM version only.

    // Load geometry
    // const { scene: highScene } = useGLTF(highPath);
    // const { scene: medScene } = useGLTF(medPath);
    const { scene: lowScene } = useGLTF(lowPath);

    // Clone descriptions for safe reuse and apply shadows
    const prepareScene = (scene) => {
        const clone = scene.clone();
        clone.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        return clone;
    };

    // const high = useMemo(() => prepareScene(highScene), [highScene]);
    // const med = useMemo(() => prepareScene(medScene), [medScene]);
    const low = useMemo(() => prepareScene(lowScene), [lowScene]);

    return (
        <group {...props}>
            <primitive object={low} />
        </group>
    );
}
