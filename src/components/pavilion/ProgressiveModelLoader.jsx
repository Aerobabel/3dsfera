import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const ProgressiveModelLoader = ({ children, threshold = 25 }) => {
    const group = useRef();
    const [shouldLoad, setShouldLoad] = useState(false);

    useFrame((state) => {
        if (!group.current || shouldLoad) return; // Stop checking once loaded
        const dist = state.camera.position.distanceTo(group.current.getWorldPosition(new THREE.Vector3()));
        if (dist < threshold) setShouldLoad(true);
    });

    return (
        <group ref={group}>
            {shouldLoad ? children : null}
        </group>
    );
};
