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

    // Preload all 3 versions
    useGLTF.preload(highPath);
    useGLTF.preload(medPath);
    useGLTF.preload(lowPath);

    // Load geometry
    const { scene: highScene } = useGLTF(highPath);
    const { scene: medScene } = useGLTF(medPath);
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

    const high = useMemo(() => prepareScene(highScene), [highScene]);
    const med = useMemo(() => prepareScene(medScene), [medScene]);
    const low = useMemo(() => prepareScene(lowScene), [lowScene]);

    return (
        <Detailed distances={[0, ...distances]} {...props}>
            <primitive object={high} />
            <primitive object={med} />
            <primitive object={low} />
        </Detailed>
    );
}
