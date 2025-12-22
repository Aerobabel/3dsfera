import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Cylinder } from '@react-three/drei';
import * as THREE from 'three';

function MaintenanceDrone({ radius = 10, speed = 1, yOffset = 2, color = "#00ffff", startAngle = 0 }) {
    const groupRef = useRef();
    const droneRef = useRef();
    const rotorRefs = useRef([]);
    const lightRef = useRef();
    const pointLightRef = useRef();

    // Animation Loop
    useFrame((state) => {
        const time = state.clock.getElapsedTime();
        const t = time * speed + startAngle;

        // 1. Orbital Path
        const x = Math.sin(t) * radius;
        const z = Math.cos(t) * radius;
        const y = Math.sin(t * 2) * 2 + yOffset; // Bobbing

        if (groupRef.current) {
            groupRef.current.position.set(x, y, z);
            groupRef.current.lookAt(0, y, 0); // Face center
        }

        // 2. Drone Banking (Tilting into the turn)
        if (droneRef.current) {
            droneRef.current.rotation.z = -0.3; // Constant banking for orbital turn
            droneRef.current.rotation.x = Math.sin(time * 3) * 0.1; // Subtle pitch wobble
        }

        // 3. Spin Rotors
        rotorRefs.current.forEach((rotor, i) => {
            if (rotor) rotor.rotation.y += (i % 2 === 0 ? 0.8 : -0.8); // Counter-rotating props
        });

        // 4. Blinking Lights (Performance Optimized - No React State)
        const isBlink = Math.floor(time * 2) % 2 === 0;

        if (lightRef.current) {
            lightRef.current.opacity = isBlink ? 1 : 0.1;
        }
        if (pointLightRef.current) {
            pointLightRef.current.intensity = isBlink ? 5 : 0;
        }
    });

    return (
        <group ref={groupRef}>
            <group ref={droneRef}>
                {/* -- CENTRAL CHASSIS -- */}
                <group>
                    {/* Main Body */}
                    <RoundedBox args={[0.8, 0.4, 1.2]} radius={0.1} smoothness={4}>
                        <meshStandardMaterial color="#222" metalness={0.8} roughness={0.2} />
                    </RoundedBox>
                    {/* Top Dome */}
                    <mesh position={[0, 0.2, 0]} scale={[1, 0.5, 1]}>
                        <sphereGeometry args={[0.3]} />
                        <meshStandardMaterial color="#111" metalness={1} roughness={0} />
                    </mesh>
                    {/* Front Sensor Array */}
                    <mesh position={[0, 0, 0.6]}>
                        <boxGeometry args={[0.6, 0.2, 0.1]} />
                        <meshStandardMaterial color="#333" />
                    </mesh>
                    {/* Front Camera Eye */}
                    <mesh position={[0, 0, 0.65]}>
                        <circleGeometry args={[0.1]} />
                        <meshBasicMaterial color="cyan" />
                    </mesh>
                </group>

                {/* -- ARMS & ROTORS -- */}
                {[[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([mx, mz], i) => (
                    <group key={i} position={[mx * 0.6, 0, mz * 0.6]}>
                        {/* Arm */}
                        <mesh rotation={[0, 0, Math.PI / 2]} position={[-mx * 0.3, 0, -mz * 0.3]}>
                            <cylinderGeometry args={[0.05, 0.05, 0.8]} />
                            <meshStandardMaterial color="#111" metalness={0.5} />
                        </mesh>
                        {/* Motor Housing */}
                        <mesh position={[0, 0.1, 0]}>
                            <cylinderGeometry args={[0.15, 0.12, 0.2]} />
                            <meshStandardMaterial color="#222" metalness={0.8} roughness={0.2} />
                        </mesh>
                        {/* Propeller Blade */}
                        <mesh
                            ref={el => rotorRefs.current[i] = el}
                            position={[0, 0.25, 0]}
                        >
                            <boxGeometry args={[1.2, 0.02, 0.1]} />
                            <meshStandardMaterial color="#111" transparent opacity={0.8} />
                        </mesh>

                        {/* Navigation Lights (Aviation Standard) */}
                        {mz > 0 && (
                            <mesh position={[0, 0, 0.15]}>
                                <sphereGeometry args={[0.05]} />
                                <meshBasicMaterial color={mx < 0 ? "#ff0000" : "#00ff00"} toneMapped={false} />
                                <pointLight color={mx < 0 ? "#ff0000" : "#00ff00"} distance={1} intensity={2} decay={2} />
                            </mesh>
                        )}
                    </group>
                ))}

                {/* -- UNDERBELLY GIMBAL -- */}
                <group position={[0, -0.3, 0.3]}>
                    <mesh>
                        <sphereGeometry args={[0.2]} />
                        <meshStandardMaterial color="#000" metalness={0.9} roughness={0.1} />
                    </mesh>
                    {/* Camera Lens */}
                    <mesh position={[0, 0, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.08, 0.08, 0.1]} />
                        <meshStandardMaterial color="#222" metalness={0.8} />
                    </mesh>
                    {/* Spotlight - Realistic White Searchlight */}
                    <spotLight
                        position={[0, 0, 0]}
                        target-position={[0, -5, 5]}
                        color="#ffffff"
                        intensity={20} // High intensity but narrow
                        distance={25}
                        angle={0.4} // Narrower beam
                        penumbra={0.5} // Softer edge
                        castShadow={false}
                    />
                </group>

                {/* -- REAR STROBE LIGHT -- */}
                <mesh position={[0, 0.1, -0.6]}>
                    <boxGeometry args={[0.1, 0.1, 0.05]} />
                    <meshBasicMaterial ref={lightRef} color="white" transparent opacity={0.1} toneMapped={false} />
                    <pointLight ref={pointLightRef} color="white" distance={5} intensity={0} decay={2} />
                </mesh>
            </group>
        </group>
    );
}

export default MaintenanceDrone;
