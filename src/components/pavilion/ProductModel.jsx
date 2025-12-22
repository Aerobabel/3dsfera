import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, Resize, useGLTF } from '@react-three/drei';

function ProductModel({ path, scale = 1, rotation = [0, 0, 0], size = 4, position = [0, 2.5, 0], onClick }) { // Added onClick prop
    const { scene } = useGLTF(path);
    const ref = useRef();

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
                        object={scene.clone()} // Clone to allow multiple instances
                        ref={ref}
                        rotation={rotation}
                    />
                </Resize>
            </Float>
        </group>
    );
}

export default ProductModel;
