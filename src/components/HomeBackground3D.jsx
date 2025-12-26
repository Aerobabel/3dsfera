import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, PerspectiveCamera, ContactShadows, Float, Stars, RoundedBox, Sparkles, MeshReflectorMaterial, SoftShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Noise, Vignette, TiltShift } from '@react-three/postprocessing';

function SceneContent() {
    return (
        <>
            {/* --- Environment & Lighting --- */}
            <Environment files="/hdris/convertio.in_image.hdr" blur={1} />
            <ambientLight intensity={0.5} color="#001533" />

            {/* Main Ceiling Light - Visible Glowing Fixture */}
            <group position={[0, 4.5, -3]}>
                {/* The fixture body */}
                <RoundedBox args={[16, 0.5, 8]} radius={0.1} smoothness={4} receiveShadow>
                    <meshStandardMaterial color="#111" metalness={0.8} roughness={0.2} />
                </RoundedBox>
                {/* The glowing panel */}
                <mesh position={[0, -0.26, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[14, 6]} />
                    <meshStandardMaterial color="#cceeff" emissive="#cceeff" emissiveIntensity={5} toneMapped={false} />
                </mesh>
            </group>
            {/* The actual light source for shadows */}
            <spotLight
                position={[0, 4, -3]}
                intensity={80}
                angle={1.2}
                penumbra={0.4}
                color="#cceeff"
                castShadow
                shadow-bias={-0.0001}
            />

            {/* Warm Accent Glows - premium amber/gold */}
            <pointLight position={[-6, 2, -2]} intensity={15} distance={12} color="#ff9900" />

            {/* Cool Fill - Cyber cyan */}
            <spotLight position={[10, 5, 5]} intensity={40} angle={0.5} penumbra={1} color="#00ffff" />


            {/* --- Geometry --- */}

            {/* Glossy Reflective Floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
                <planeGeometry args={[50, 50]} />
                <MeshReflectorMaterial
                    blur={[300, 100]}
                    resolution={1024}
                    mixBlur={1}
                    mixStrength={50} // Reduced slightly
                    roughness={0.5}
                    depthScale={1.2}
                    minDepthThreshold={0.4}
                    maxDepthThreshold={1.4}
                    color="#080c14"
                    metalness={0.5}
                    mirror={0.5}
                />
            </mesh>

            {/* Back Wall - Subtle texture */}
            <mesh position={[0, 10, -15]} receiveShadow>
                <planeGeometry args={[60, 40]} />
                <meshStandardMaterial color="#03050a" roughness={0.2} metalness={0.8} />
            </mesh>

            {/* Left Wall Structures (The glowing columns) */}
            <group position={[-7, -2, -2]}>
                {/* Monolith 1 */}
                <RoundedBox args={[2, 6, 2]} radius={0.15} smoothness={4} position={[0, 3, 0]} castShadow receiveShadow>
                    <meshStandardMaterial color="#1a2030" roughness={0.1} metalness={0.6} />
                </RoundedBox>

                {/* Floating Ember Block */}
                <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
                    <RoundedBox args={[0.8, 0.8, 0.8]} radius={0.05} smoothness={4} position={[2, 3, -1]}>
                        <meshStandardMaterial color="#111" emissive="#ff5500" emissiveIntensity={4} toneMapped={false} />
                    </RoundedBox>
                </Float>

                {/* Monolith 2 */}
                <RoundedBox args={[2.5, 4, 2.5]} radius={0.15} smoothness={4} position={[-2, 2, 3]} castShadow receiveShadow>
                    <meshStandardMaterial color="#141a26" roughness={0.1} metalness={0.6} />
                </RoundedBox>
            </group>


            {/* Central Platform - Minimal Base (No Rays) */}
            <group position={[0, -2.1, -4]}>
                <RoundedBox args={[6, 0.3, 6]} radius={0.1} smoothness={4} receiveShadow>
                    <meshStandardMaterial color="#080c14" roughness={0.2} metalness={0.8} />
                </RoundedBox>
            </group>

            {/* Right Side Structures - Sleek shelving */}
            <group position={[8, -2, -5]}>
                <RoundedBox args={[3, 9, 3]} radius={0.2} smoothness={4} position={[0, 4.5, 0]} castShadow>
                    <meshStandardMaterial color="#0f1525" roughness={0.1} metalness={0.7} />
                </RoundedBox>
                <RoundedBox args={[2, 2, 2]} radius={0.1} smoothness={4} position={[-2, 1, 2]} castShadow>
                    <meshStandardMaterial color="#0f1525" roughness={0.1} metalness={0.7} />
                </RoundedBox>
            </group>

            {/* Particles/Dust */}
            <Sparkles count={50} scale={12} size={4} speed={0.4} opacity={0.5} color="#ffffff" />
            <Sparkles count={30} scale={10} size={6} speed={0.3} opacity={0.8} color="#00ffff" position={[0, 2, 0]} />

            {/* Shadows */}
            {/* Contact shadows for grounded feel */}
            <ContactShadows resolution={1024} scale={50} blur={2} opacity={0.5} far={10} color="#000000" />

            {/* Fog for depth */}
            <fog attach="fog" args={['#050914', 2, 35]} />
        </>
    );
}

const HomeBackground3D = () => {
    return (
        <div className="absolute inset-0 w-full h-full pointer-events-none">
            <Canvas shadows dpr={[1, 1.5]} camera={{ position: [0, 1, 9], fov: 60 }}>
                <SoftShadows size={10} samples={15} focus={0} />
                <SceneContent />

                <EffectComposer disableNormalPass>
                    <Bloom luminanceThreshold={1.1} mipmapBlur intensity={1.2} radius={0.4} />
                    <Noise opacity={0.05} />
                    <Vignette eskil={false} offset={0.1} darkness={1.0} />
                    {/* TiltShift gives a miniature/premium photography look */}
                    {/* <TiltShift blur={0.1} />  May be too much, leaving out for clarity */}
                </EffectComposer>
            </Canvas>
        </div>
    );
};

export default HomeBackground3D;
