import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Resize, useGLTF } from '@react-three/drei';

function ProductModel({ path, scale = 1, rotation = [0, 0, 0], size = 4, position = [0, 2.5, 0], onClick, opacity = 1, transparent = false }) { // Added opacity/transparent props
    const { scene } = useGLTF(path);
    const ref = useRef();

    // Clone scene to avoid mutating the cached GLTF for other instances
    const clone = React.useMemo(() => scene.clone(), [scene]);

    React.useLayoutEffect(() => {
        clone.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (transparent || opacity < 1) {
                    // Clone material to avoid affecting other instances sharing the same material
                    child.material = child.material.clone();
                    child.material.transparent = true;
                    child.material.opacity = opacity;
                    // Ensure depth write is handled correctly for ghosts (optional, but good for ghosts)
                    child.material.depthWrite = opacity > 0.5;
                }
            }
        });
    }, [clone, opacity, transparent]);

    useFrame((state) => {
        // if (ref.current) {
        //     ref.current.rotation.y += 0.005; // Slow spin showcase
        // }
    });

    return (
        <group position={position} onClick={onClick}> {/* Attach onClick */}
            <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
                <Resize scale={size}> {/* Normalize size based on size prop */}
                    <primitive
                        object={clone}
                        ref={ref}
                        rotation={rotation}
                    />
                </Resize>
            </Float>
        </group>
    );
}

export default ProductModel;
