import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useVideoTexture, RoundedBox, Text, Sparkles, Torus, Float, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import ProductModel from './ProductModel';
import ProductDisplay from './ProductDisplay';
import VolumetricBeam from './VolumetricBeam';
import videoUrlDefault from '../../assets/videos/Cyberpunk_Holographic_Girl_Video_Generation.mp4';

// The screen inside the booth
// 1. Static Screen Component (Image)
function StaticScreen({ imageUrl }) {
    const texture = useTexture(imageUrl);
    return (
        <group position={[0, 0, 0.31]}>
            <mesh rotation={[0, 0, 0]}>
                <planeGeometry args={[16, 5.5]} />
                <meshBasicMaterial map={texture} toneMapped={false} />
            </mesh>
            {/* Overlay Sparkles for depth */}
            <group position={[0, 0, 0.1]}>
                <Sparkles count={20} scale={[14, 4, 0]} size={3} speed={0.2} opacity={0.3} color="#ffffff" />
            </group>
        </group>
    );
}

// 2. Dynamic Screen Component (Video)
function DynamicScreen({ videoUrl }) {
    // START MUTED to ensure autoplay works on all browsers
    const [muted, setMuted] = useState(true);

    // Load the video texture
    const texture = useVideoTexture(videoUrl || videoUrlDefault, {
        mute: muted,
        loop: true,
        start: true
    });

    // Fix for blurriness: Disable mipmaps for video textures
    React.useEffect(() => {
        if (texture) {
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.generateMipmaps = false;
            texture.needsUpdate = true;
        }
    }, [texture]);

    const toggleAudio = (e) => {
        e.stopPropagation();
        if (texture && texture.image) {
            const video = texture.image;
            video.muted = !video.muted; // Toggle actual video element
            setMuted(video.muted); // Update React state
            if (!video.muted) {
                video.play().catch(e => console.log("Play failed", e));
            }
        }
    };

    return (
        <group position={[0, 0, 0.31]}>
            <mesh
                rotation={[0, 0, 0]}
                onClick={toggleAudio}
                onPointerOver={() => document.body.style.cursor = 'pointer'}
                onPointerOut={() => document.body.style.cursor = 'auto'}
            >
                <planeGeometry args={[16, 5.5]} />
                <meshBasicMaterial
                    map={texture}
                    toneMapped={false} // Keep colors vivid
                    fog={false} // Ignore fog
                />
            </mesh>
            {/* Overlay Sparkles for depth */}
            <group position={[0, 0, 0.1]}>
                <Sparkles
                    count={30}
                    scale={[14, 4, 0]}
                    size={4}
                    speed={0.4}
                    opacity={0.5}
                    color="#00ffff"
                />
            </group>

            {/* Audio Indicator / Toggle Button */}
            <group position={[7, -2.2, 0.2]} onClick={toggleAudio}>
                <mesh>
                    <planeGeometry args={[2.5, 0.6]} />
                    <meshBasicMaterial color="black" transparent opacity={0.6} />
                </mesh>
                <Text
                    position={[0, 0, 0.1]}
                    fontSize={0.25}
                    color={muted ? "white" : "#00ff00"}
                    anchorX="center"
                    anchorY="middle"
                >
                    {muted ? "SOUND OFF" : "SOUND ON"}
                </Text>
            </group>
        </group>
    );
}

// Main Wrapper that decides which screen to show
function TechScreen({ videoUrl, imageUrl }) {
    if (imageUrl) {
        return <StaticScreen imageUrl={imageUrl} />;
    }
    return <DynamicScreen videoUrl={videoUrl} />;
}

// The animated globe/brain in the center booth
function Hologram({ color = "#00ffff" }) {
    const groupRef = useRef();
    useFrame((state) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += 0.005;
            groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
        }
    });

    return (
        <group ref={groupRef}>
            <Float speed={4} rotationIntensity={0.5} floatIntensity={0.5}>
                {/* Wireframe Sphere */}
                <mesh>
                    <icosahedronGeometry args={[1.2, 2]} />
                    <meshBasicMaterial color={color} wireframe transparent opacity={0.3} />
                </mesh>
                {/* Inner Core */}
                <mesh scale={0.5}>
                    <dodecahedronGeometry args={[1]} />
                    <meshBasicMaterial color="white" transparent opacity={0.8} blending={THREE.AdditiveBlending} />
                </mesh>
                {/* Orbiting Rings */}
                <Torus args={[1.6, 0.01, 16, 100]} rotation={[Math.PI / 2, 0, 0]}>
                    <meshBasicMaterial color={color} transparent opacity={0.6} />
                </Torus>
            </Float>
        </group>
    )
}

function KioskUnit({ position, rotation, title = "PREMIUM SUPPLIER", glowColor = "#00ffff", hasHologram = false, platformColor = "#111", roofColor, videoUrl, imageUrl, modelPath, modelPosition, hideSideModels = false, isTv = false, isRoboticArm = false, hideMainPedestal = false, productScale = 0.8, hideRoof = false, onClick = () => { }, onProductClick, style = "cyberpunk" }) {
    const isSciFi = style === "scifi";

    // Sci-Fi Theme Colors (White/Silver/Clean) vs Cyberpunk (Dark/Neon)
    const baseColor = isSciFi ? "#ffffff" : platformColor;
    const detailsColor = isSciFi ? "#ffffff" : "#050505";
    const metalness = isSciFi ? 0.6 : 0.8;
    const roughness = isSciFi ? 0.2 : 0.1;

    // Use a cleaner blue for sci-fi text/glows if not overridden
    const effectiveGlow = isSciFi ? "#00aaff" : glowColor;
    const titleColor = isSciFi ? "#222222" : "white";

    const handlePointerOver = (e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; };
    const handlePointerOut = (e) => { e.stopPropagation(); document.body.style.cursor = 'auto'; };


    const isLuminent = platformColor === "white";

    // --- SCI-FI PEDESTAL VARIANT ---
    if (isSciFi) {
        return (
            <group position={position} rotation={rotation} onClick={onClick}>
                {/* Top Down Spot */}
                <spotLight position={[0, 8, 0]} angle={0.4} penumbra={1} intensity={15} color={effectiveGlow} distance={20} />

                {/* 1. Main Pedestal Base */}
                <mesh position={[0, 0.5, 0]}>
                    <cylinderGeometry args={[2.5, 3, 1, 64]} />
                    <meshStandardMaterial color="#e0e0e0" roughness={0.2} metalness={0.8} />
                </mesh>

                {/* 2. Glowing Ring Insert */}
                <mesh position={[0, 0.8, 0]}>
                    <cylinderGeometry args={[2.55, 2.55, 0.1, 64]} />
                    <meshBasicMaterial color={effectiveGlow} toneMapped={false} />
                </mesh>

                {/* 3. Pedestal Top Cap */}
                <mesh position={[0, 1.01, 0]}>
                    <cylinderGeometry args={[2.5, 2.5, 0.05, 64]} />
                    <meshStandardMaterial color="white" roughness={0.1} metalness={0.5} />
                </mesh>

                {/* 4. Floor Ring (Grounding) */}
                <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[3.2, 3.5, 64]} />
                    <meshBasicMaterial color={effectiveGlow} toneMapped={false} opacity={0.5} transparent />
                </mesh>

                {/* 5. Floating Title */}
                <group position={[0, 4.5, 0]}>
                    <Text
                        position={[0, 0, 0]}
                        fontSize={0.6}
                        letterSpacing={0.1}
                        color={titleColor}
                        anchorX="center"
                        anchorY="middle"
                    >
                        {title}
                        <meshStandardMaterial
                            color={titleColor}
                            emissive={titleColor}
                            emissiveIntensity={1.5}
                            toneMapped={false}
                        />
                    </Text>
                    <Text
                        position={[0, -0.5, 0]}
                        fontSize={0.25}
                        color={effectiveGlow}
                        anchorX="center"
                        anchorY="middle"
                    >
                        VERIFIED SUPPLIER
                        <meshStandardMaterial
                            color={effectiveGlow}
                            emissive={effectiveGlow}
                            emissiveIntensity={2}
                            toneMapped={false}
                        />
                    </Text>
                </group>

                {/* 6. Content (Model or Hologram) */}
                <group position={[0, 0, 0]}> {/* Lowered from 0.4 to 0 so pedestal sits on floor */}
                    {modelPath || isTv ? (
                        <ProductDisplay
                            modelPath={modelPath}
                            isTv={isTv}
                            hidePedestal={hideMainPedestal}
                            position={[0, 0, 0]}
                            scale={0.8} // Scaled to fit in kiosk
                        />
                    ) : hasHologram ? (
                        <group position={[0, 1, 0]}>
                            <Hologram color={effectiveGlow} />
                            <VolumetricBeam color={effectiveGlow} />
                        </group>
                    ) : null}
                </group>

                {/* 7. Side Satellites (Optional - floating minis) */}
                {modelPath && !hideSideModels && (
                    <>
                        <group position={[4, 0, 1]}>
                            <ProductDisplay modelPath={modelPath} scale={0.5} />
                        </group>
                        <group position={[-4, 0, 1]}>
                            <ProductDisplay modelPath={modelPath} scale={0.5} />
                        </group>
                    </>
                )}

            </group>
        )
    }

    // --- ORIGINAL CYBERPUNK BOOTH VARIANT ---
    return (
        <group position={position} rotation={rotation}>
            {/* Top Down Spot */}
            <spotLight position={[0, 10, 0]} angle={0.6} penumbra={0.5} intensity={5} color={effectiveGlow} distance={20} />

            {/* Fake Shadow Plane */}
            <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[11, 32]} />
                <meshBasicMaterial color="#000000" transparent opacity={0.3} toneMapped={false} />
            </mesh>

            {/* 1. Main Platform */}
            <group position={[0, 0.1, 0]} onClick={onClick}>
                <RoundedBox args={[18, 0.2, 12]} radius={0.05} smoothness={4}>
                    <meshStandardMaterial
                        color={baseColor}
                        roughness={roughness}
                        metalness={metalness}
                        emissive={isLuminent ? "#ffffff" : "#000000"}
                        emissiveIntensity={isLuminent ? 0.8 : 0}
                    />
                </RoundedBox>

                {/* Borders / Accents - 3D Neon Tubes */}
                <mesh position={[0, 0, 6.05]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.04, 0.04, 18.2, 16]} />
                    <meshStandardMaterial
                        color={effectiveGlow}
                        emissive={effectiveGlow}
                        emissiveIntensity={2}
                        toneMapped={false}
                    />
                </mesh>
                <mesh position={[0, 0, -6.05]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.04, 0.04, 18.2, 16]} />
                    <meshStandardMaterial
                        color={effectiveGlow}
                        emissive={effectiveGlow}
                        emissiveIntensity={2}
                        toneMapped={false}
                    />
                </mesh>

                {/* Vertical Pillars */}
                <mesh position={[-9, 3, 6]}>
                    <boxGeometry args={[0.02, 6, 0.02]} />
                    <meshStandardMaterial color={isSciFi ? "#ccc" : detailsColor} />
                </mesh>
                <mesh position={[9, 3, 6]}>
                    <boxGeometry args={[0.02, 6, 0.02]} />
                    <meshStandardMaterial color={isSciFi ? "#ccc" : detailsColor} />
                </mesh>
            </group>

            {/* 2. Back Structure */}
            <group position={[0, 3, -5.8]} onClick={onClick}>
                <RoundedBox args={[18, 6, 0.5]} radius={0.1} smoothness={4}>
                    <meshStandardMaterial color={detailsColor} roughness={0.2} metalness={metalness} />
                </RoundedBox>
                <TechScreen videoUrl={videoUrl} imageUrl={imageUrl} />
            </group>

            {/* 3. Roof Structure - Conditionally Hidden in Inspection Mode */}
            {!hideRoof && (
                <group position={[0, 5.8, 0]} onClick={onClick}>
                    <RoundedBox args={[18, 0.4, 12]} radius={0.05} smoothness={4}>
                        <meshStandardMaterial
                            color={roofColor || detailsColor}
                            roughness={0.2}
                            metalness={metalness}
                            emissive={roofColor === "white" ? "#ffffff" : "#000000"}
                            emissiveIntensity={roofColor === "white" ? 0.8 : 0}
                        />
                    </RoundedBox>
                    {/* Border */}
                    <mesh position={[0, 0, 6.05]} rotation={[0, 0, Math.PI / 2]}>
                        <cylinderGeometry args={[0.04, 0.04, 18.2, 16]} />
                        <meshStandardMaterial
                            color={effectiveGlow}
                            emissive={effectiveGlow}
                            emissiveIntensity={2}
                            toneMapped={false}
                        />
                    </mesh>

                    {/* Floating Signage */}
                    <group position={[0, 0.8, 6]}>
                        {/* Sign Backing */}
                        <mesh position={[0, 0, 0]}>
                            <boxGeometry args={[16, 2.5, 0.1]} />
                            <meshStandardMaterial color={isSciFi ? "#ffffff" : "#000"} metalness={0.5} roughness={0.2} />
                        </mesh>

                        {/* Line 1: VERIFIED SUPPLIER */}

                        <Text
                            position={[0, 0.6, 0.11]}
                            fontSize={0.5}
                            letterSpacing={0.2}
                            anchorX="center"
                            anchorY="middle"
                        >
                            VERIFIED SUPPLIER
                            <meshStandardMaterial
                                color={effectiveGlow}
                                emissive={effectiveGlow}
                                emissiveIntensity={1.5}
                                toneMapped={false}
                            />
                        </Text>

                        {/* Line 2: FIRM NAME */}
                        <Text
                            position={[0, -0.3, 0.11]}
                            fontSize={1.2}
                            letterSpacing={0.1}
                            anchorX="center"
                            anchorY="middle"
                        >
                            {title}
                            <meshStandardMaterial
                                color={titleColor}
                                emissive={titleColor}
                                emissiveIntensity={1.5}
                                toneMapped={false}
                            />
                        </Text>
                    </group>
                </group>
            )}


            {/* 4. Product Pods */}
            {
                modelPath && !hideSideModels && (
                    <>
                        <group position={[5, 1.5, 2]} onClick={onProductClick || onClick} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
                            <ProductDisplay modelPath={modelPath} scale={0.6} />
                        </group>

                        <group position={[-5, 1.5, 2]} onClick={onProductClick || onClick} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
                            <ProductDisplay modelPath={modelPath} scale={0.6} />
                        </group>
                    </>
                )
            }

            {/* 5. Center Showcase */}
            {
                modelPath || isTv || isRoboticArm ? (
                    <group position={[0, 0.2, 0]} onClick={onProductClick || onClick} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}> {/* Lowered to 0.2 to sit on the 0.2m high platform */}
                        <ProductDisplay
                            modelPath={modelPath}
                            isTv={isTv}
                            isRoboticArm={isRoboticArm}
                            hidePedestal={hideMainPedestal}
                            position={[0, 0, 0]}
                            scale={productScale}
                        />
                    </group>
                ) : hasHologram ? (
                    <group position={[0, 4, 0]} onClick={onClick} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
                        <Hologram color={effectiveGlow} />
                        <VolumetricBeam color={effectiveGlow} />
                    </group>
                ) : null
            }

        </group >
    );
}

export default KioskUnit;
