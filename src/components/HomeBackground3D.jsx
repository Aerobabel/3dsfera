import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, PerspectiveCamera, ContactShadows, Float, Stars, RoundedBox, Sparkles, MeshReflectorMaterial, SoftShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Noise, Vignette, TiltShift } from '@react-three/postprocessing';

function SceneContent() {
    return (
        <>
            {/* --- Environment & Lighting (Studio Setup) --- */}
            {/* Lower ambient light to reduce "whiteness" */}
            <Environment preset="city" blur={1} background={false} />
            <ambientLight intensity={0.2} color="#ffffff" />

            {/* Main Key Light - Soft White */}
            <spotLight
                position={[5, 10, 5]}
                intensity={5}
                angle={0.6}
                penumbra={1}
                color="#ffffff"
                castShadow
                shadow-bias={-0.0001}
            />

            {/* Fill Light - Cool Blueish */}
            <pointLight position={[-10, 5, -10]} intensity={8} color="#bae6fd" />

            {/* Rim Light - For separation */}
            <spotLight position={[0, 5, -8]} intensity={10} color="#e0f2fe" angle={1} />

            {/* --- Geometry --- */}

            {/* Matte Studio Floor - Slightly Darker Grey */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
                <planeGeometry args={[100, 100]} />
                <meshStandardMaterial color="#0f172a" roughness={0.7} metalness={0.2} />
            </mesh>

            {/* Back Wall (Curved Cyclorama illusion) */}
            <mesh position={[0, 10, -20]} receiveShadow>
                <planeGeometry args={[100, 60]} />
                <meshStandardMaterial color="#0f172a" roughness={1} />
            </mesh>

            {/* Left Wall Structures (Darker Silhouettes) */}
            <group position={[-7, -2, -2]}>
                <RoundedBox args={[2, 6, 2]} radius={0.1} smoothness={4} position={[0, 3, 0]} castShadow receiveShadow>
                    <meshStandardMaterial color="#475569" roughness={0.3} metalness={0.4} />
                </RoundedBox>
                <RoundedBox args={[2.5, 4, 2.5]} radius={0.1} smoothness={4} position={[-2, 2, 3]} castShadow receiveShadow>
                    <meshStandardMaterial color="#64748b" roughness={0.3} metalness={0.4} />
                </RoundedBox>
            </group>

            {/* Central Platform - Darker Base to ground the scene */}
            <group position={[0, -2.1, -4]}>
                <RoundedBox args={[8, 0.5, 8]} radius={0.2} smoothness={4} receiveShadow>
                    <meshStandardMaterial color="#334155" roughness={0.6} metalness={0.2} />
                </RoundedBox>
            </group>

            {/* Right Side Structures - Darker Silhouettes */}
            <group position={[8, -2, -5]}>
                <RoundedBox args={[3, 9, 3]} radius={0.2} smoothness={4} position={[0, 4.5, 0]} castShadow>
                    <meshStandardMaterial color="#475569" roughness={0.3} metalness={0.4} />
                </RoundedBox>
            </group>

            {/* Minimal Dust - Grey */}
            <Sparkles count={30} scale={15} size={2} speed={0.2} opacity={0.4} color="#334155" />

            {/* Soft shadows */}
            <ContactShadows resolution={1024} scale={50} blur={2.5} opacity={0.4} far={10} color="#1e293b" />

            {/* Light Blue-Grey Fog for Depth (Not basic white) */}
            {/* Light Blue-Grey Fog for Depth (Not basic white) */}
            <fog attach="fog" args={['#0f172a', 5, 45]} />
        </>
    );
}

const HomeBackground3D = () => {
    return (
        <div className="absolute inset-0 w-full h-full pointer-events-none">
            <Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 1, 9], fov: 60 }}>
                {/* Soft diffused shadows for high-key look */}
                <SoftShadows size={15} samples={10} focus={0.5} />
                <SceneContent />

                <EffectComposer disableNormalPass>
                    {/* Bloom drastically reduced */}
                    <Bloom luminanceThreshold={0.95} mipmapBlur intensity={0.1} radius={0.5} />
                    <Noise opacity={0.02} />
                </EffectComposer>
            </Canvas>
        </div>
    );
};

export default HomeBackground3D;
