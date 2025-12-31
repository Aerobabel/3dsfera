import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFrame } from '@react-three/fiber';
import { useVideoTexture, RoundedBox, Text, Sparkles, Torus, Float, useTexture, Gltf, Center } from '@react-three/drei';
import * as THREE from 'three';
import ProductModel from './ProductModel';
import ProductDisplay from './ProductDisplay';
import VolumetricBeam from './VolumetricBeam';
import videoUrlDefault from '../../assets/videos/Cyberpunk_Holographic_Girl_Video_Generation.mp4';

// The screen inside the booth
// The screen inside the booth
const DataDashboardScreen = ({ width, height }) => {
    const { t } = useTranslation();
    const fontUrl = "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff";

    // Centered label, clean look
    const Ticker = ({ label, value, position, color = "#00ffff" }) => (
        <group position={position}>
            <Text position={[0, 0.2, 0]} fontSize={0.25} color="#888888" font={fontUrl} anchorX="center">
                {label}
            </Text>
            <Text position={[0, -0.15, 0]} fontSize={0.45} color={color} font={fontUrl} anchorX="center" letterSpacing={0.05} fontWeight="bold">
                {value}
                <meshBasicMaterial color={color} toneMapped={false} />
            </Text>
        </group>
    )

    return (
        <group position={[0, 0, 0.05]}>
            {/* Background */}
            <mesh position={[0, 0, -0.01]}>
                <planeGeometry args={[width, height]} />
                <meshBasicMaterial color="#050510" />
            </mesh>

            {/* Left Data Column */}
            <Ticker label={t('pavilion_ui.stats.active_nodes', 'ACTIVE NODES')} value="8,492" position={[-width / 3.2, height / 4, 0]} />
            <Ticker label={t('pavilion_ui.stats.btc_usd', 'BTC / USD')} value="$98,420" position={[-width / 3.2, -height / 4, 0]} />

            {/* Right Data Column */}
            <Ticker label={t('pavilion_ui.stats.network_latency', 'NETWORK LATENCY')} value="12ms" position={[width / 3.2, height / 4, 0]} />
            <Ticker label={t('pavilion_ui.stats.system_status', 'SYSTEM STATUS')} value={t('pavilion_ui.stats.online', 'ONLINE')} position={[width / 3.2, -height / 4, 0]} color="#00ff00" />

            {/* Aesthetic Divider Lines */}
            <mesh position={[0, 0, 0]}>
                <planeGeometry args={[width * 0.9, 0.02]} />
                <meshBasicMaterial color="#111111" />
            </mesh>
        </group>
    )
};

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
    const { t } = useTranslation();
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
                    {muted ? t('verified_pavilion.ui.sound_off', "SOUND OFF") : t('verified_pavilion.ui.sound_on', "SOUND ON")}
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

// 3. Info Desk Component with Hologram
// 3. Info Desk Component with Hologram
// 3. Info Desk Component with Hologram
// 3. Info Desk Component with Hologram (V2: Neural Command Center)
// 3. Info Desk Component - Reference Style (White & Blue)
function InfoDesk() {
    return (
        <group position={[0, 0, 1.5]}>
            {/* Main Desk Body - Solid White Curve */}
            <mesh position={[0, 0.55, 0]}>
                <cylinderGeometry args={[2.0, 2.0, 1.1, 64, 1, false, Math.PI, Math.PI]} />
                <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.1} />
            </mesh>

            {/* Blue Accent Groove - REMOVED per user request */}

            {/* Counter Top */}
            <mesh position={[0, 1.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[1.5, 2.2, 64, 1, Math.PI, Math.PI]} />
                <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.1} />
            </mesh>

            {/* Hologram Projector Base (Hidden inside desk) */}
            <mesh position={[0, 0.5, -0.5]}>
                <cylinderGeometry args={[0.5, 0.5, 0.1, 32]} />
                <meshBasicMaterial color="#0055ff" />
            </mesh>
        </group>
    )
}




// 4. Corporate Pavilion Structure (Match Reference)
// 4. Corporate Pavilion Structure (Match Reference)
function CorporatePavilion({ width = 14, height = 7, depth = 8 }) {
    const { t } = useTranslation();
    const fontUrl = "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff";

    const logoRef = useRef();

    // Rotation animation removed per user request

    // Angular Shard Panel Helper
    const ShardPanel = ({ position, rotation, mirror = false }) => (
        <group position={position} rotation={rotation}>
            {/* Frame */}
            <mesh position={[0, height / 2, 0]}>
                <boxGeometry args={[0.2, height, depth]} />
                <meshStandardMaterial color="#111111" roughness={0.2} metalness={0.8} />
            </mesh>
            {/* Blue Geometric Inset (Simulated) */}
            <mesh position={[mirror ? -0.15 : 0.15, height / 2, 0]} rotation={[0, 0, mirror ? -0.1 : 0.1]}>
                <boxGeometry args={[0.1, height * 0.8, depth * 0.8]} />
                <meshStandardMaterial color="#0044aa" roughness={0.2} metalness={0.8} />
            </mesh>
            {/* Accent Line */}
            <mesh position={[mirror ? -0.16 : 0.16, height / 2, 0]} rotation={[0, 0, mirror ? 0.3 : -0.3]}>
                <boxGeometry args={[0.12, height, 0.5]} />
                <meshBasicMaterial color="#00aaff" toneMapped={false} />
            </mesh>
        </group>
    )

    return (
        <group>
            {/* 1. Floor Base - Premium Dark Obsidian */}
            <group position={[0, 0.1, 0]}>
                <RoundedBox args={[width + 2, 0.2, depth + 2]} radius={1} smoothness={4}>
                    <meshPhysicalMaterial
                        color="#050505"
                        roughness={0.1}
                        metalness={0.9}
                        clearcoat={1}
                        clearcoatRoughness={0.1}
                    />
                </RoundedBox>
            </group>

            {/* 2. Back Wall - High-End Display Surface */}
            <group position={[0, height / 2, -depth / 2 + 0.5]}>
                <mesh receiveShadow>
                    <boxGeometry args={[width, height, 0.5]} />
                    <meshStandardMaterial color="#080808" roughness={0.2} metalness={0.8} />
                </mesh>

                {/* NEW: Data Dashboard Background */}
                <group position={[0, 0, 0.26]}>
                    <DataDashboardScreen width={width * 0.8} height={height * 0.7} />
                </group>

                {/* 3D Kinetic Brand Centerpiece REMOVED per user request */}
                {/* 3D Kinetic Brand Centerpiece REMOVED per user request */}

                {/* Minimalist Brand Signature - LARGER */}
                <Text
                    position={[0, -2.8, 0]}
                    fontSize={2.0}
                    color="#ffffff"
                    anchorX="center"
                    anchorY="middle"
                    font={fontUrl}
                    letterSpacing={0.15}
                    fontWeight="normal"
                    outlineWidth={0.01}
                    outlineColor="#00aaff"
                >
                    {t('pavilion_content.pavilions.3dsfera.name', '3DSFERA')}
                </Text>
                <mesh position={[0, -3.8, 0]}>
                    <planeGeometry args={[1.5, 0.05]} />
                    <meshBasicMaterial color="#00aaff" toneMapped={false} />
                </mesh>
                {/* </group> */}
            </group>

            {/* 3. Roof Canopy - Suspended Dark Structure */}
            <group position={[0, height, 0]}>
                <RoundedBox args={[width + 2, 0.3, depth + 2]} radius={1} smoothness={8}>
                    <meshStandardMaterial color="#111111" roughness={0.2} metalness={0.8} />
                </RoundedBox>
                {/* Subtle Downlighting */}
                <rectAreaLight position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]} args={[width - 2, depth - 2]} intensity={1} color="#ffffff" />
                <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[width - 1, depth - 1]} />
                    <meshBasicMaterial color="#222222" />
                </mesh>

                {/* Top Branding Strip - SPLIT */}
                <group position={[0, 0, depth / 2 + 1.1]}>
                    <Text
                        position={[-2.5, 0, 0]} // Shift left
                        fontSize={0.6}
                        color="#00ffff"
                        anchorX="center"
                        anchorY="middle"
                        font={fontUrl}
                        letterSpacing={0.1}
                    >
                        {t('pavilion_ui.welcome_to', 'WELCOME TO')}
                        <meshBasicMaterial color="#00ffff" toneMapped={false} />
                    </Text>
                    <Text
                        position={[3.0, 0, 0]} // Shift right and BIGGER
                        fontSize={1.0} // Increased size
                        color="#ffffff" // White
                        anchorX="center"
                        anchorY="middle"
                        font={fontUrl}
                        letterSpacing={0.1}
                        fontWeight="bold"
                    >
                        {t('pavilion_content.pavilions.3dsfera.name', '3DSFERA')}
                        <meshBasicMaterial color="#ffffff" toneMapped={false} />
                    </Text>
                </group>
            </group>

            {/* 4. Side Wing Panels - REMOVED */}

            {/* 5. Reception Desk (Central Element) */}
            <InfoDesk />

        </group >
    );
}

function KioskUnit({
    position,
    rotation,
    title = "KIOSK",
    glowColor = "#00ffff",
    hasHologram = false,
    platformColor = "#111",
    roofColor,
    videoUrl,
    imageUrl,
    modelPath,
    sideModelPath,
    sideModelScale,
    modelPosition,
    hideSideModels = false,
    isTv = false,
    isRoboticArm = false,
    isMicrowave = false,
    type = 'standard',
    hideMainPedestal = false,
    productScale = 0.8,
    floatingProduct = true,
    hideRoof = false,
    heightOffset = 0,
    useEscavator = false,
    modelRotation = [0, 0, 0],
    onClick = () => { },
    onProductClick,
    onSideClick,
    style = "cyberpunk",
    interactable = true
}) {
    const { t } = useTranslation();
    const isSciFi = style === "scifi";

    // Sci-Fi Theme Colors (White/Silver/Clean) vs Cyberpunk (Dark/Neon)
    const baseColor = isSciFi ? "#ffffff" : platformColor;
    const detailsColor = isSciFi ? "#ffffff" : "#050505";
    const metalness = isSciFi ? 0.6 : 0.8;
    const roughness = isSciFi ? 0.2 : 0.1;

    // Use a cleaner blue for sci-fi text/glows if not overridden
    const effectiveGlow = isSciFi ? "#00aaff" : glowColor;
    const titleColor = isSciFi ? "#222222" : "white";

    const handleInteraction = (e) => {
        if (!interactable) return;
        if (onClick) onClick(e);
    };

    const handlePointerOver = (e) => {
        e.stopPropagation();
        if (interactable) document.body.style.cursor = 'pointer';
    };
    const handlePointerOut = (e) => { e.stopPropagation(); document.body.style.cursor = 'auto'; };


    // const isLuminent = platformColor === "white"; // Unused in new design

    // --- SCI-FI PEDESTAL VARIANT ---
    if (isSciFi) {
        return (
            <group position={position} rotation={rotation} onClick={onClick}>
                {/* Top Down Spot */}
                <spotLight position={[0, 8, 0]} angle={0.4} penumbra={1} intensity={15} color={effectiveGlow} distance={20} />

                {/* 1. Main Pedestal Base */}
                <mesh position={[0, 0.5, 0]}>
                    <cylinderGeometry args={[2.5, 3, 1, 64]} />
                    <meshStandardMaterial color="#333" roughness={0.3} metalness={0.9} />
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
                        {t('verified_pavilion.ui.verified_supplier', 'VERIFIED SUPPLIER')}
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
                    {modelPath || isTv || useEscavator ? (
                        <ProductDisplay
                            modelPath={modelPath}
                            isTv={isTv}
                            hidePedestal={hideMainPedestal}
                            position={[0, 0, 0]}
                            scale={0.8} // Scaled to fit in kiosk
                            heightOffset={heightOffset}
                            useEscavator={useEscavator}
                            isRoboticArm={isRoboticArm}
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

    const groupRef = useRef();
    const backWallMatRef = useRef();
    const roofMatRef = useRef();

    // Use refs instead of state to avoid re-renders inside useFrame
    const isBackOccludedRef = useRef(false);
    const isRoofOccludedRef = useRef(false);

    // Group refs for traversal
    const backWallGroupRef = useRef();
    const roofGroupRef = useRef();

    useFrame((state) => {
        if (!groupRef.current) return;

        // Calculate camera position relative to the kiosk
        const localCameraPos = groupRef.current.worldToLocal(state.camera.position.clone());

        const shouldHideBack = localCameraPos.z < -4;
        const shouldHideRoof = localCameraPos.y > 4 && localCameraPos.length() < 8;

        const targetBackOpacity = shouldHideBack ? 0.1 : 1;
        const targetRoofOpacity = shouldHideRoof ? 0.2 : 1;

        // 1. Raycast Swapping Logic (Back Wall)
        if (shouldHideBack !== isBackOccludedRef.current) {
            isBackOccludedRef.current = shouldHideBack;
            if (backWallGroupRef.current) {
                backWallGroupRef.current.traverse((obj) => {
                    if (obj.isMesh) {
                        // Swap raycast method: Null if hidden, default if visible
                        obj.raycast = shouldHideBack ? () => null : THREE.Mesh.prototype.raycast;
                    }
                });
            }
        }

        // 2. Raycast Swapping Logic (Roof)
        if (shouldHideRoof !== isRoofOccludedRef.current) {
            isRoofOccludedRef.current = shouldHideRoof;
            if (roofGroupRef.current) {
                roofGroupRef.current.traverse((obj) => {
                    if (obj.isMesh) {
                        obj.raycast = shouldHideRoof ? () => null : THREE.Mesh.prototype.raycast;
                    }
                });
            }
        }

        // 3. Opacity Animation
        if (backWallMatRef.current) {
            backWallMatRef.current.opacity = THREE.MathUtils.lerp(backWallMatRef.current.opacity, targetBackOpacity, 0.1);
            backWallMatRef.current.transparent = true;
        }

        if (roofMatRef.current) {
            roofMatRef.current.opacity = THREE.MathUtils.lerp(roofMatRef.current.opacity, targetRoofOpacity, 0.1);
            roofMatRef.current.transparent = true;
        }
    });

    // --- HIGH-END CYBERPUNK BOOTH VARIANT ---
    return (
        <group ref={groupRef} position={position} rotation={rotation}>
            {/* Top Down Spot - Focused and cleaner */}
            <spotLight position={[0, 8, 2]} angle={0.5} penumbra={0.4} intensity={2} color={effectiveGlow} distance={15} />

            {type === 'info-desk' ? (
                <CorporatePavilion />
            ) : (
                <>
                    {/* 0. Floor Reflection/Shadow Blob */}
                    <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                        <circleGeometry args={[8, 64]} />
                        <meshBasicMaterial color="#000000" transparent opacity={0.6} toneMapped={false} />
                    </mesh>

                    {/* 1. Main Base Platform - Tiered & Detailed Design */}
                    <group position={[0, 0, 0]} onClick={onClick}>
                        {/* Lower Base (Matte dark metal) */}
                        <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
                            <boxGeometry args={[16, 0.3, 10]} />
                            <meshStandardMaterial
                                color="#111111"
                                roughness={0.7}
                                metalness={0.5}
                            />
                        </mesh>

                        {/* Tech Vents on Base Sides (Detailing) */}
                        <mesh position={[0, 0.15, 5.01]}>
                            <planeGeometry args={[14, 0.15]} />
                            <meshStandardMaterial color="black" emissive="#000000" />
                        </mesh>
                        <mesh position={[0, 0.15, -5.01]}>
                            <planeGeometry args={[14, 0.15]} />
                            <meshStandardMaterial color="black" emissive="#000000" />
                        </mesh>

                        {/* Upper Deck (Polished Obsidian/Glass look) */}
                        <RoundedBox position={[0, 0.45, 0]} args={[15, 0.3, 9]} radius={0.05} smoothness={4}>
                            <meshPhysicalMaterial
                                color="#050505"
                                roughness={0.1}
                                metalness={0.9}
                                clearcoat={1}
                                clearcoatRoughness={0.1}
                            />
                        </RoundedBox>

                        {/* Underglow Strip (Between layers) */}
                        <mesh position={[0, 0.3, 0]}>
                            <boxGeometry args={[15.2, 0.05, 9.2]} />
                            <meshBasicMaterial color={effectiveGlow} toneMapped={false} />
                        </mesh>

                        {/* Neon Channels on the floor */}
                        <mesh position={[7, 0.61, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                            <planeGeometry args={[0.2, 9]} />
                            <meshBasicMaterial color={effectiveGlow} toneMapped={false} opacity={0.8} transparent />
                        </mesh>
                        <mesh position={[-7, 0.61, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                            <planeGeometry args={[0.2, 9]} />
                            <meshBasicMaterial color={effectiveGlow} toneMapped={false} opacity={0.8} transparent />
                        </mesh>
                    </group>

                    {/* 2. Back Wall Structure - High Tech Glass */}
                    <group ref={backWallGroupRef} position={[0, 3.5, -4.5]} onClick={onClick}>
                        {/* Frame */}
                        <mesh position={[0, 0, 0]}>
                            <boxGeometry args={[16, 6, 0.2]} />
                            <meshStandardMaterial
                                ref={backWallMatRef}
                                color={type === 'info-desk' ? "#ffffff" : "#222"}
                                roughness={type === 'info-desk' ? 0.05 : 0.2}
                                metalness={type === 'info-desk' ? 0.2 : 0.8}
                                transparent
                            />
                        </mesh>

                        {/* Vertical Data Strips (V2 Overlay) */}
                        {type === 'info-desk' && (
                            <group position={[0, 0, 0.11]}>
                                <mesh position={[-4, 0, 0]}>
                                    <planeGeometry args={[0.2, 5.8]} />
                                    <meshBasicMaterial color="#00ffff" toneMapped={false} />
                                </mesh>
                                <mesh position={[4, 0, 0]}>
                                    <planeGeometry args={[0.2, 5.8]} />
                                    <meshBasicMaterial color="#00ffff" toneMapped={false} />
                                </mesh>
                                <mesh position={[0, 0, 0]}>
                                    <planeGeometry args={[0.05, 5.8]} />
                                    <meshBasicMaterial color="#00ffff" opacity={0.5} transparent toneMapped={false} />
                                </mesh>
                            </group>
                        )}

                        {/* Glass Panel Content Holder */}
                        <group position={[0, 0, 0.15]}>
                            {/* The Screen - No overlay per user request */}
                            {type !== 'info-desk' && <TechScreen videoUrl={videoUrl} imageUrl={imageUrl} />}
                        </group>

                        {/* Vertical Support Struts - TRUSS Design */}
                        <group position={[-7.8, 0, 0.5]}>
                            {/* Main Pole */}
                            <mesh>
                                <boxGeometry args={[0.2, 6, 0.2]} />
                                <meshStandardMaterial color={type === 'info-desk' ? "#ffffff" : "#333"} metalness={0.9} roughness={0.1} />
                            </mesh>
                            {/* Cross Bracing */}
                            <mesh position={[0, 1, 0]} rotation={[0, 0, 0.5]}>
                                <boxGeometry args={[0.1, 2, 0.1]} />
                                <meshStandardMaterial color={type === 'info-desk' ? "#cccccc" : "#222"} metalness={0.8} />
                            </mesh>
                            <mesh position={[0, -1, 0]} rotation={[0, 0, -0.5]}>
                                <boxGeometry args={[0.1, 2, 0.1]} />
                                <meshStandardMaterial color={type === 'info-desk' ? "#cccccc" : "#222"} metalness={0.8} />
                            </mesh>
                        </group>

                        <group position={[7.8, 0, 0.5]}>
                            {/* Main Pole */}
                            <mesh>
                                <boxGeometry args={[0.2, 6, 0.2]} />
                                <meshStandardMaterial color={type === 'info-desk' ? "#ffffff" : "#333"} metalness={0.9} roughness={0.1} />
                            </mesh>
                            {/* Cross Bracing */}
                            <mesh position={[0, 1, 0]} rotation={[0, 0, -0.5]}>
                                <boxGeometry args={[0.1, 2, 0.1]} />
                                <meshStandardMaterial color={type === 'info-desk' ? "#cccccc" : "#222"} metalness={0.8} />
                            </mesh>
                            <mesh position={[0, -1, 0]} rotation={[0, 0, 0.5]}>
                                <boxGeometry args={[0.1, 2, 0.1]} />
                                <meshStandardMaterial color={type === 'info-desk' ? "#cccccc" : "#222"} metalness={0.8} />
                            </mesh>
                        </group>
                    </group>
                </>
            )}

            {/* 3. Roof Structure - Floating & Detailed */}
            {!hideRoof && type !== 'info-desk' && (
                <group ref={roofGroupRef} position={[0, type === 'info-desk' ? 8.5 : 6.5, -0.5]} onClick={handleInteraction}>
                    {/* Main Canopy - Thin & Clean */}
                    <mesh position={[0, 0, 0]}>
                        <boxGeometry args={[16, 0.2, 10]} />
                        <meshStandardMaterial ref={roofMatRef} color="#1a1a1a" roughness={0.2} metalness={0.8} transparent />
                    </mesh>

                    {/* Integrated Ceiling Light Panel */}
                    <mesh position={[0, -0.11, 0]} rotation={[Math.PI / 2, 0, 0]}>
                        <planeGeometry args={[14, 8]} />
                        <meshStandardMaterial
                            color={effectiveGlow}
                            emissive={effectiveGlow}
                            emissiveIntensity={0.5}
                            toneMapped={false}
                        />
                    </mesh>

                    {/* Roof Greebles / Tech Modules (Top Detail) */}
                    <group position={[0, 0.2, 0]}>
                        {/* Ventilation Unit */}
                        <mesh position={[-4, 0, 2]}>
                            <boxGeometry args={[2, 0.3, 2]} />
                            <meshStandardMaterial color="#222" roughness={0.6} />
                        </mesh>
                        {/* Antenna Box */}
                        <mesh position={[5, 0, -3]}>
                            <boxGeometry args={[1, 0.4, 1.5]} />
                            <meshStandardMaterial color="#111" roughness={0.4} />
                        </mesh>
                        <mesh position={[5, 0.5, -3]}>
                            <cylinderGeometry args={[0.05, 0.05, 1]} />
                            <meshStandardMaterial color="#555" metalness={1} />
                        </mesh>
                        {/* Piping */}
                        <mesh position={[0, 0.1, -2]} rotation={[0, 0, Math.PI / 2]}>
                            <cylinderGeometry args={[0.1, 0.1, 8]} />
                            <meshStandardMaterial color="#333" metalness={0.8} />
                        </mesh>

                        {/* Info Desk Beacon - High Visibility */}
                        {type === 'info-desk' && (
                            <group position={[0, 2, 0]}>
                                {/* Glowing Spire */}
                                <mesh position={[0, 0, 0]}>
                                    <cylinderGeometry args={[0.05, 0.15, 6, 16, 1, true]} />
                                    <meshBasicMaterial color="#00ffff" toneMapped={false} />
                                </mesh>
                                {/* Beacon Light */}
                                <pointLight position={[0, 3, 0]} color="#00ffff" intensity={4} distance={20} decay={2} />
                                {/* Halo Ring */}
                                <mesh position={[0, 2.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
                                    <torusGeometry args={[0.5, 0.05, 16, 32]} />
                                    <meshBasicMaterial color="white" toneMapped={false} />
                                </mesh>
                            </group>
                        )}
                    </group>

                    {/* Front Facade / Signage Holder */}
                    <group position={[0, 0, 5.1]}>
                        {/* Sign Background */}
                        <mesh>
                            <boxGeometry args={[16, 1.2, 0.4]} />
                            <meshStandardMaterial color="#000" metalness={0.8} roughness={0.2} />
                        </mesh>

                        {/* Glowing Edge Line */}
                        <mesh position={[0, -0.65, 0]}>
                            <boxGeometry args={[16, 0.05, 0.4]} />
                            <meshBasicMaterial color={effectiveGlow} toneMapped={false} />
                        </mesh>

                        {/* Tech Detail on Sign Edge */}
                        <mesh position={[7.5, 0, 0.25]}>
                            <boxGeometry args={[0.5, 1, 0.1]} />
                            <meshStandardMaterial color={effectiveGlow} emissive={effectiveGlow} />
                        </mesh>
                        <mesh position={[-7.5, 0, 0.25]}>
                            <boxGeometry args={[0.5, 1, 0.1]} />
                            <meshStandardMaterial color={effectiveGlow} emissive={effectiveGlow} />
                        </mesh>

                        {/* Text: Title */}
                        <Text
                            position={[0, 0, 0.22]}
                            fontSize={0.7}
                            font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
                            letterSpacing={0.05}
                            anchorX="center"
                            anchorY="middle"
                        >
                            {title.toUpperCase()}
                            <meshStandardMaterial
                                color="white"
                                emissive="white"
                                emissiveIntensity={0.8}
                                toneMapped={false}
                            />
                        </Text>


                    </group>
                </group>
            )}

            {/* 4. Products positioning */}
            {
                (modelPath || sideModelPath) && !hideSideModels && (
                    <>
                        <group position={[5, 0.25, 2]} onClick={(e) => {
                            e.stopPropagation();
                            if (onSideClick) onSideClick(e, 'right');
                            else (onProductClick || onClick)(e);
                        }} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
                            <ProductDisplay modelPath={sideModelPath || modelPath} scale={sideModelScale || 0.6} heightOffset={heightOffset} useEscavator={useEscavator} />
                            {/* Small product stand */}
                            <mesh position={[0, -0.05, 0]}>
                                <cylinderGeometry args={[1.5, 1.5, 0.1, 32]} />
                                <meshStandardMaterial color="#222" metalness={0.8} roughness={0.2} />
                            </mesh>
                        </group>

                        <group position={[-5, 0.25, 2]} onClick={(e) => {
                            e.stopPropagation();
                            if (onSideClick) onSideClick(e, 'left');
                            else (onProductClick || onClick)(e);
                        }} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
                            <ProductDisplay modelPath={sideModelPath || modelPath} scale={sideModelScale || productScale} heightOffset={heightOffset} useEscavator={useEscavator} />
                            {/* Small product stand */}
                            <mesh position={[0, -0.05, 0]}>
                                <cylinderGeometry args={[1.5, 1.5, 0.1, 32]} />
                                <meshStandardMaterial color="#222" metalness={0.8} roughness={0.2} />
                            </mesh>
                        </group>
                    </>
                )
            }

            {/* 5. Center Showcase */}
            {type === 'info-desk' ? (
                <InfoDesk />
            ) : (modelPath || isTv || isRoboticArm || useEscavator) ? (
                <group position={[0, 0.6, 0]} onClick={handleInteraction} onPointerOver={handlePointerOver} onPointerOut={() => document.body.style.cursor = 'auto'}>
                    <ProductDisplay
                        modelPath={modelPath}
                        isTv={isTv}
                        isRoboticArm={isRoboticArm}
                        heightOffset={heightOffset}
                        useEscavator={useEscavator}
                        scale={productScale}
                        floating={floatingProduct}
                        hidePedestal={isMicrowave}
                        isMicrowave={isMicrowave}
                    />
                </group>
            ) : hasHologram ? (
                <group position={[0, 4, 0]} onClick={handleInteraction}>
                    <VolumetricBeam color={effectiveGlow} />
                </group>
            ) : null}

        </group>
    );
}

export default KioskUnit;
