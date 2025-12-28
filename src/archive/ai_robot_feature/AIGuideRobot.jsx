import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Float, RoundedBox, Cylinder } from '@react-three/drei';
import ChatInterface from './ChatInterface';
import * as THREE from 'three';

const AIGuideRobot = ({ position = [0, 1.5, 0], scale = 1, context = "" }) => {
    const groupRef = useRef();
    const [hovered, setHover] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);
    const [blink, setBlink] = useState(false);

    // Blink Logic
    useEffect(() => {
        const interval = setInterval(() => {
            setBlink(true);
            setTimeout(() => setBlink(false), 150);
        }, 3000 + Math.random() * 2000); // Random blink every 3-5s
        return () => clearInterval(interval);
    }, []);

    // Animation
    useFrame((state) => {
        if (!groupRef.current) return;
        const t = state.clock.getElapsedTime();

        // Idle: Subtle bounce + rotation
        groupRef.current.position.y = Math.sin(t * 1.5) * 0.05;
        groupRef.current.rotation.y = Math.sin(t * 0.5) * 0.1;
    });

    const handleClick = (e) => {
        e.stopPropagation();
        setChatOpen(!chatOpen);
    };

    return (
        <group position={position} scale={scale}>
            <group
                ref={groupRef}
                onClick={handleClick}
                onPointerOver={() => setHover(true)}
                onPointerOut={() => setHover(false)}
                className="cursor-pointer"
            >
                {/* --- RETRO ROBOT GEOMETRY --- */}

                {/* Body: Orange Plastic Box */}
                <RoundedBox args={[0.8, 0.7, 0.6]} radius={0.1} smoothness={4} castShadow>
                    <meshStandardMaterial
                        color="#fb923c" // Orange-400
                        roughness={0.3}
                        metalness={0.1}
                        emissive={hovered ? "#fb923c" : "#000000"}
                        emissiveIntensity={hovered ? 0.3 : 0}
                    />
                </RoundedBox>

                {/* Face: Black Screen Area */}
                <mesh position={[0, 0.1, 0.31]}>
                    <planeGeometry args={[0.6, 0.4]} />
                    <meshStandardMaterial color="#1e293b" roughnes={0.2} />
                </mesh>

                {/* Eyes: Glowing Cyan/White */}
                <group position={[0, 0.1, 0.32]}>
                    {!blink && (
                        <>
                            {/* Left Eye */}
                            <mesh position={[-0.15, 0, 0]}>
                                <planeGeometry args={[0.1, 0.1]} />
                                <meshBasicMaterial color="#06b6d4" />
                            </mesh>
                            {/* Right Eye */}
                            <mesh position={[0.15, 0, 0]}>
                                <planeGeometry args={[0.1, 0.1]} />
                                <meshBasicMaterial color="#06b6d4" />
                            </mesh>
                        </>
                    )}
                    {/* Blinking just hides them, or we could show flat lines */}
                </group>

                {/* Antenna */}
                <group position={[0.2, 0.35, 0]}>
                    <mesh position={[0, 0.15, 0]}>
                        <cylinderGeometry args={[0.02, 0.02, 0.3]} />
                        <meshStandardMaterial color="#94a3b8" metalness={0.8} />
                    </mesh>
                    <mesh position={[0, 0.3, 0]}>
                        <sphereGeometry args={[0.05]} />
                        <meshStandardMaterial
                            color="#ef4444" // Red Tip
                            emissive={chatOpen ? "#ef4444" : "#000000"}
                            emissiveIntensity={chatOpen ? 1 : 0}
                        />
                    </mesh>
                </group>

                {/* Wheels: Stubby Cylinders */}
                {[
                    [-0.45, -0.3, 0.2], // FL
                    [0.45, -0.3, 0.2],  // FR
                    [-0.45, -0.3, -0.2], // BL
                    [0.45, -0.3, -0.2]   // BR
                ].map((pos, i) => (
                    <group key={i} position={pos} rotation={[0, 0, Math.PI / 2]}>
                        <mesh castShadow>
                            <cylinderGeometry args={[0.15, 0.15, 0.1, 16]} />
                            <meshStandardMaterial color="#334155" roughness={0.8} />
                        </mesh>
                        {/* Wheel Hub */}
                        <mesh position={[0, 0.06, 0]}>
                            <circleGeometry args={[0.08]} />
                            <meshStandardMaterial color="#fb923c" />
                        </mesh>
                    </group>
                ))}

            </group>

            {/* --- CHAT UI --- */}
            {chatOpen && (
                <Html
                    position={[-2, 1.5, 0]} // Offset to the Left
                    center
                    distanceFactor={12} // Adjusted for non-transform mode
                    zIndexRange={[100, 0]}
                // transform prop REMOVED
                >
                    <ChatInterface
                        visible={chatOpen}
                        onClose={() => setChatOpen(false)}
                        context={context}
                    />
                </Html>
            )}

            {!chatOpen && hovered && (
                <Html position={[0, 1, 0]} center distanceFactor={6}>
                    <div className="bg-slate-900/80 text-orange-400 px-3 py-1 rounded-md text-xs font-bold border border-orange-500/50 backdrop-blur-sm whitespace-nowrap shadow-lg">
                        HELLO! CLICK ME
                    </div>
                </Html>
            )}
        </group>
    );
};

export default AIGuideRobot;
