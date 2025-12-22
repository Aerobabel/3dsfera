/*
* HeavyDutyRobot.jsx
* Large industrial robot arm for factory floor.
*/
import React from 'react';
import { Box, Cylinder, Sphere } from '@react-three/drei';

export function HeavyDutyRobot({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }) {
    const industrialYellow = "#ffcc00";
    const darkMetal = "#333";
    const steel = "#888";

    return (
        <group position={position} rotation={rotation} scale={scale}>
            {/* Base Platform */}
            <Cylinder args={[2, 2.2, 0.4, 32]} position={[0, 0.2, 0]}>
                <meshStandardMaterial color={darkMetal} />
            </Cylinder>
            <Cylinder args={[1.5, 1.5, 0.5, 32]} position={[0, 0.6, 0]}>
                <meshStandardMaterial color={industrialYellow} metalness={0.6} roughness={0.3} />
            </Cylinder>

            {/* Turret */}
            <group position={[0, 0.8, 0]} rotation={[0, 0.5, 0]}>
                <Box args={[1.2, 1, 1.2]} position={[0, 0.5, 0]}>
                    <meshStandardMaterial color={industrialYellow} metalness={0.6} roughness={0.3} />
                </Box>

                {/* Arm Segment 1 (Lower) */}
                <group position={[0, 1, 0]} rotation={[0.4, 0, 0]}>
                    {/* Joint */}
                    <Cylinder args={[0.6, 0.6, 1.4, 16]} rotation={[0, 0, Math.PI / 2]}>
                        <meshStandardMaterial color={darkMetal} />
                    </Cylinder>
                    {/* Arm Structure */}
                    <Box args={[0.8, 3.5, 0.6]} position={[0, 1.5, 0]}>
                        <meshStandardMaterial color={industrialYellow} metalness={0.6} roughness={0.3} />
                    </Box>
                    {/* Piston Detail */}
                    <Cylinder args={[0.15, 0.15, 2]} position={[0, 1.5, 0.5]} rotation={[0.1, 0, 0]}>
                        <meshStandardMaterial color={steel} metalness={0.9} />
                    </Cylinder>

                    {/* Arm Segment 2 (Upper) */}
                    <group position={[0, 3.2, 0]} rotation={[-0.8, 0, 0]}>
                        {/* Elbow Joint */}
                        <Cylinder args={[0.5, 0.5, 1.2, 16]} rotation={[0, 0, Math.PI / 2]}>
                            <meshStandardMaterial color={darkMetal} />
                        </Cylinder>
                        {/* Arm Structure */}
                        <Box args={[0.6, 2.5, 0.5]} position={[0, 1, 0]}>
                            <meshStandardMaterial color={industrialYellow} metalness={0.6} roughness={0.3} />
                        </Box>
                        {/* Wrist/Head */}
                        <group position={[0, 2.2, 0]} rotation={[0.4, 0, 0]}>
                            <Cylinder args={[0.4, 0.3, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
                                <meshStandardMaterial color={darkMetal} />
                            </Cylinder>
                            {/* Claw */}
                            <group position={[0, 0, 0.3]}>
                                <Box args={[0.2, 0.6, 0.1]} position={[0.2, 0, 0.2]} rotation={[0, 0, -0.2]}>
                                    <meshStandardMaterial color={steel} />
                                </Box>
                                <Box args={[0.2, 0.6, 0.1]} position={[-0.2, 0, 0.2]} rotation={[0, 0, 0.2]}>
                                    <meshStandardMaterial color={steel} />
                                </Box>
                            </group>
                        </group>
                    </group>
                </group>
            </group>
        </group>
    );
}
