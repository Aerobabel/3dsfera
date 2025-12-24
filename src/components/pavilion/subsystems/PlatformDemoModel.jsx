/*
* PlatformDemoModel.jsx
* Procedural visualization of the 3DSFERA platform.
* Concept: Global connectivity network, glowing core, orbiting data streams.
*/
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, Icosahedron, Ring, Torus } from '@react-three/drei';
import * as THREE from 'three';

export function PlatformDemoModel() {
    const groupRef = useRef();
    const coreRef = useRef();
    const ringsRef = useRef();

    useFrame((state, delta) => {
        if (coreRef.current) {
            coreRef.current.rotation.y += delta * 0.5;
            coreRef.current.rotation.x += delta * 0.2;
        }
        if (ringsRef.current) {
            ringsRef.current.rotation.z -= delta * 0.2;
            ringsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
        }
        if (groupRef.current) {
            groupRef.current.rotation.y += delta * 0.1;
        }
    });

    return (
        <group ref={groupRef} dispose={null}>
            {/* CORE: The Digital Brain */}
            <mesh ref={coreRef}>
                <icosahedronGeometry args={[1, 1]} />
                <meshStandardMaterial
                    color="#00ffff"
                    wireframe
                    emissive="#00aaaa"
                    emissiveIntensity={2}
                />
            </mesh>

            {/* SHELL: The Glass Interface */}
            <Sphere args={[1.4, 32, 32]}>
                <meshPhysicalMaterial
                    roughness={0}
                    transmission={0.6} // Glass-like
                    thickness={1}
                    color="#0066ff"
                    ior={1.5}
                    clearcoat={1}
                />
            </Sphere>

            {/* DATA RINGS */}
            <group ref={ringsRef}>
                {/* Ring 1 */}
                <group rotation={[Math.PI / 3, 0, 0]}>
                    <Torus args={[2.2, 0.02, 16, 100]}>
                        <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
                    </Torus>
                </group>
                {/* Ring 2 */}
                <group rotation={[-Math.PI / 3, 0, 0]}>
                    <Torus args={[1.8, 0.03, 16, 100]}>
                        <meshBasicMaterial color="#00ffff" transparent opacity={0.8} />
                    </Torus>
                    {/* Satellites */}
                    <mesh position={[1.8, 0, 0]}>
                        <sphereGeometry args={[0.08, 16, 16]} />
                        <meshBasicMaterial color="#fff" />
                    </mesh>
                    <mesh position={[-1.8, 0, 0]}>
                        <sphereGeometry args={[0.08, 16, 16]} />
                        <meshBasicMaterial color="#fff" />
                    </mesh>
                </group>
                {/* Ring 3 (flat) */}
                <Torus args={[2.8, 0.01, 16, 100]}>
                    <meshBasicMaterial color="#4444ff" transparent opacity={0.3} />
                </Torus>
            </group>

            {/* FLOATING PARTICLES */}
            <points>
                <sphereGeometry args={[3, 32, 32]} />
                <pointsMaterial color="#00ffff" size={0.02} sizeAttenuation transparent opacity={0.5} />
            </points>
        </group>
    );
}
