import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshReflectorMaterial, Circle, Html, Float } from '@react-three/drei';
import * as THREE from 'three';

// --- HOTSPOTS (Chat, Spin, Info) ---
// --- HOTSPOTS (Chat, Spin, Info) ---
function Hotspots({ radius = 2, visible }) {
    if (!visible) return null;
    return (
        <group>
            {/* Chat Hotspot (Left) */}
            <Float speed={2} rotationIntensity={0} floatIntensity={0.5} floatingRange={[0, 0.2]}>
                <group position={[-radius, 1.5, 0]}>
                    <Html center distanceFactor={10} zIndexRange={[100, 0]}>
                        <div className="flex flex-col items-center pointer-events-none">
                            <div className="w-10 h-10 rounded-full border border-white bg-black/50 backdrop-blur-md flex items-center justify-center text-white mb-2 shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                            </div>
                            <span className="text-white text-xs font-bold tracking-widest uppercase">Chat</span>
                            {/* Connecting Line */}
                            <div className="w-0.5 h-16 bg-gradient-to-b from-cyan-400 to-transparent mt-1" />
                        </div>
                    </Html>
                </group>
            </Float>

            {/* Spin Hotspot (Top Right) */}
            <Float speed={1.5} rotationIntensity={0} floatIntensity={0.5} floatingRange={[0, 0.2]}>
                <group position={[radius * 0.8, 2.5, -0.5]}>
                    <Html center distanceFactor={10} zIndexRange={[100, 0]}>
                        <div className="flex flex-col items-center pointer-events-none">
                            <div className="w-10 h-10 rounded-full border border-white bg-black/50 backdrop-blur-md flex items-center justify-center text-white mb-2 shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                                <span className="text-xs font-bold">360°</span>
                            </div>
                            <span className="text-white text-xs font-bold tracking-widest uppercase">Spin</span>
                            <div className="w-0.5 h-12 bg-gradient-to-b from-blue-500 to-transparent mt-1" />
                        </div>
                    </Html>
                </group>
            </Float>

            {/* Info Hotspot (Right) */}
            <Float speed={2.5} rotationIntensity={0} floatIntensity={0.5} floatingRange={[0, 0.2]}>
                <group position={[radius, 1.2, 0.5]}>
                    <Html center distanceFactor={10} zIndexRange={[100, 0]}>
                        <div className="flex flex-col items-center pointer-events-none">
                            <div className="w-10 h-10 rounded-full border border-white bg-black/50 backdrop-blur-md flex items-center justify-center text-white mb-2 shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                                <span className="font-serif italic font-bold text-lg">i</span>
                            </div>
                            <span className="text-white text-xs font-bold tracking-widest uppercase">Info</span>
                            <div className="w-0.5 h-10 bg-gradient-to-b from-cyan-400 to-transparent mt-1" />
                        </div>
                    </Html>
                </group>
            </Float>
        </group>
    )
}

function NeonGridFloor() {
    return (
        <group position={[0, -0.1, 0]}> {/* Lowered to avoid Z-fighting with Podium */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
                <planeGeometry args={[50, 50]} />
                <MeshReflectorMaterial
                    blur={[250, 80]}
                    resolution={1024}
                    mixBlur={1}
                    mixStrength={40}
                    roughness={0.3}
                    depthScale={1}
                    minDepthThreshold={0.35}
                    maxDepthThreshold={1.2}
                    color="#1a1f27"
                    metalness={0.65}
                    mirror={0.65}
                />
            </mesh>

            {/* Grid Helper Overlay - Raised slightly above reflector */}
            <gridHelper args={[50, 50, 0x9ca3af, 0x4b5563]} position={[0, 0.01, 0]} />
        </group>
    );
}

function Podium() {
    return (
        <group>
            {/* Glowing Ring - Raised to avoid fighting grid */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                <ringGeometry args={[2.5, 2.6, 64]} />
                <meshBasicMaterial color="#ffffff" toneMapped={false} />
            </mesh>

            {/* Outer Glow Ring */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
                <ringGeometry args={[2.3, 3.5, 64]} />
                <meshBasicMaterial color="#00aaff" transparent opacity={0.3} toneMapped={false} />
            </mesh>

            {/* Base Cylinder - Lowered */}
            <mesh position={[0, -0.25, 0]}>
                <cylinderGeometry args={[2.5, 2.5, 0.5, 64]} />
                <meshStandardMaterial color="#111" roughness={0.2} metalness={0.8} />
            </mesh>
        </group>
    )
}

export default function NeonShowroomEnvironment() {
    return (
        <group>
            <NeonGridFloor />
            {/* Removed central podium to avoid giant ring overlay; pedestals handled per product */}

            {/* Industrial Lighting: brighter white with warm/cool accents */}
            <hemisphereLight intensity={0.9} groundColor="#2f3540" color="#e6f1ff" />
            <spotLight
                position={[6, 9, 6]}
                angle={0.55}
                penumbra={0.7}
                intensity={35}
                color="#ffd79a"
                castShadow
            />
            <spotLight
                position={[-6, 9, 6]}
                angle={0.55}
                penumbra={0.7}
                intensity={32}
                color="#b8d8ff"
                castShadow
            />
            <pointLight position={[0, 5, 0]} intensity={8} color="#ffffff" />
            <ambientLight intensity={0.7} />
        </group>
    )
}
