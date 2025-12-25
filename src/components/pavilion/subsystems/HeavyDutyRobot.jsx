/*
* HeavyDutyRobot.jsx
* High-fidelity industrial robot arm with procedural details, cables, and animation.
*/
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Cylinder, Sphere, Torus, RoundedBox, CubicBezierLine, CatmullRomLine } from '@react-three/drei';
import * as THREE from 'three';

export function HeavyDutyRobot({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }) {
    const groupRef = useRef();
    const arm1Ref = useRef();
    const arm2Ref = useRef();
    const gripperRef = useRef();

    // Industrial Materials
    const industrialYellow = "#dda000"; // Darker, wealthier yellow
    const darkMetal = "#1a1a1a";
    const steel = "#b0b0b0";
    const chrome = "#e0e0e0";
    const warningStripes = "#222";

    // Idle Animation
    useFrame((state) => {
        const t = state.clock.getElapsedTime();
        if (groupRef.current) {
            // Gentle base rotation
            groupRef.current.rotation.y = rotation[1] + Math.sin(t * 0.5) * 0.15;
        }
        if (arm1Ref.current) {
            // Breathing motion for lower arm
            arm1Ref.current.rotation.x = 0.4 + Math.sin(t * 0.7) * 0.05;
        }
        if (arm2Ref.current) {
            // Counter-balance motion
            arm2Ref.current.rotation.x = -0.8 + Math.sin(t * 0.7 + 1) * 0.05;
        }
        if (gripperRef.current) {
            // Subtle seeking motion
            gripperRef.current.rotation.z = Math.sin(t * 2) * 0.05;
        }
    });

    // Cable Curves (Dynamic)
    const cablePoints1 = useMemo(() => [
        new THREE.Vector3(0, 1.2, -0.4),
        new THREE.Vector3(0, 2, -0.8),
        new THREE.Vector3(0, 2.5, -0.2)
    ], []);

    return (
        <group position={position} rotation={rotation} scale={scale}>
            <group ref={groupRef}>

                {/* --- BASE --- */}
                <group position={[0, 0, 0]}>
                    {/* Mounting Plate */}
                    <Cylinder args={[2.2, 2.4, 0.2, 8]} position={[0, 0.1, 0]}>
                        <meshStandardMaterial color={darkMetal} roughness={0.7} metalness={0.5} />
                    </Cylinder>
                    {/* Main Motor Housing */}
                    <Cylinder args={[1.8, 2, 0.8, 32]} position={[0, 0.6, 0]}>
                        <meshStandardMaterial color={industrialYellow} metalness={0.6} roughness={0.4} />
                    </Cylinder>
                    {/* Base Detail Ring */}
                    <Torus args={[1.85, 0.1, 16, 32]} position={[0, 0.9, 0]} rotation={[Math.PI / 2, 0, 0]}>
                        <meshStandardMaterial color={darkMetal} />
                    </Torus>
                </group>

                {/* --- TURRET --- */}
                <group position={[0, 1, 0]} rotation={[0, 0, 0]}>
                    {/* Rotating Platform */}
                    <Box args={[2.5, 0.8, 2]} position={[0, 0.4, 0]}>
                        <meshStandardMaterial color={industrialYellow} metalness={0.6} roughness={0.4} />
                    </Box>
                    {/* Servo Housings on Sides */}
                    <Cylinder args={[0.8, 0.8, 2.6, 32]} rotation={[0, 0, Math.PI / 2]} position={[0, 1, 0]}>
                        <meshStandardMaterial color={darkMetal} metalness={0.8} roughness={0.2} />
                    </Cylinder>
                    {/* Logo/Text Panel */}
                    <mesh position={[0, 0.5, 1.01]}>
                        <planeGeometry args={[1, 0.4]} />
                        <meshStandardMaterial color="#111" />
                    </mesh>

                    {/* --- LOWER ARM (ARM 1) --- */}
                    <group ref={arm1Ref} position={[0, 1, 0]} rotation={[0.4, 0, 0]}>
                        {/* Main Spars */}
                        <group position={[0, 1.8, 0]}>
                            <Box args={[1.2, 4, 0.8]}>
                                <meshStandardMaterial color={industrialYellow} metalness={0.6} roughness={0.4} />
                            </Box>
                            {/* Detailed Cutouts */}
                            <Box args={[1.21, 1, 0.4]} position={[0, 0, 0]}>
                                <meshStandardMaterial color={darkMetal} />
                            </Box>
                        </group>

                        {/* Hydraulic Piston (Visual) */}
                        <group position={[0, 0.5, 0.8]} rotation={[-0.1, 0, 0]}>
                            <Cylinder args={[0.2, 0.2, 2, 16]} position={[0, 1, 0]}>
                                <meshStandardMaterial color={steel} metalness={0.9} roughness={0.1} />
                            </Cylinder>
                            <Cylinder args={[0.3, 0.3, 1.5, 16]} position={[0, 0.5, 0]}>
                                <meshStandardMaterial color={darkMetal} />
                            </Cylinder>
                        </group>

                        {/* Cables */}
                        <CatmullRomLine points={cablePoints1} color="black" lineWidth={3} />

                        {/* --- UPPER ARM (ARM 2) --- */}
                        <group ref={arm2Ref} position={[0, 3.8, 0]} rotation={[-0.8, 0, 0]}>
                            {/* Elbow Joint */}
                            <Cylinder args={[0.7, 0.7, 1.4, 32]} rotation={[0, 0, Math.PI / 2]}>
                                <meshStandardMaterial color={darkMetal} metalness={0.8} />
                            </Cylinder>
                            {/* Arm Geometry */}
                            <group position={[0, 1.5, 0]}>
                                <Box args={[0.8, 3, 0.6]} position={[0, 0, 0]}>
                                    <meshStandardMaterial color={industrialYellow} metalness={0.6} roughness={0.4} />
                                </Box>
                                <Box args={[0.9, 0.2, 0.7]} position={[0, 1, 0]}>
                                    <meshStandardMaterial color={warningStripes} />
                                </Box>
                            </group>

                            {/* --- WRIST & GRIPPER --- */}
                            <group position={[0, 3, 0]} rotation={[0.4, 0, 0]}>
                                {/* Wrist Rotation Servo */}
                                <Cylinder args={[0.5, 0.4, 0.6, 16]} rotation={[Math.PI / 2, 0, 0]}>
                                    <meshStandardMaterial color={darkMetal} />
                                </Cylinder>

                                <group ref={gripperRef} position={[0, 0, 0.4]}>
                                    {/* Gripper Base */}
                                    <Cylinder args={[0.4, 0.4, 0.2, 16]} rotation={[Math.PI / 2, 0, 0]}>
                                        <meshStandardMaterial color={chrome} metalness={1} roughness={0} />
                                    </Cylinder>

                                    {/* Finger 1 */}
                                    <group position={[0, 0.3, 0.2]} rotation={[0.2, 0, 0]}>
                                        <Box args={[0.1, 0.6, 0.1]} position={[0, 0.3, 0]}>
                                            <meshStandardMaterial color={steel} />
                                        </Box>
                                        <Box args={[0.15, 0.2, 0.05]} position={[0, 0.6, -0.05]}>
                                            <meshStandardMaterial color="#333" />
                                        </Box>
                                    </group>
                                    {/* Finger 2 */}
                                    <group position={[0.25, -0.2, 0.2]} rotation={[0.2, 0, 2.1]}>
                                        <Box args={[0.1, 0.6, 0.1]} position={[0, 0.3, 0]}>
                                            <meshStandardMaterial color={steel} />
                                        </Box>
                                        <Box args={[0.15, 0.2, 0.05]} position={[0, 0.6, -0.05]}>
                                            <meshStandardMaterial color="#333" />
                                        </Box>
                                    </group>
                                    {/* Finger 3 */}
                                    <group position={[-0.25, -0.2, 0.2]} rotation={[0.2, 0, -2.1]}>
                                        <Box args={[0.1, 0.6, 0.1]} position={[0, 0.3, 0]}>
                                            <meshStandardMaterial color={steel} />
                                        </Box>
                                        <Box args={[0.15, 0.2, 0.05]} position={[0, 0.6, -0.05]}>
                                            <meshStandardMaterial color="#333" />
                                        </Box>
                                    </group>
                                </group>
                            </group>
                        </group>
                    </group>
                </group>
            </group>
        </group>
    );
}
