
import React from 'react';
import { useVideoTexture, CatmullRomLine, Text, Grid, MeshReflectorMaterial, Torus, SpotLight } from '@react-three/drei';
import * as THREE from 'three';


export function CeilingLights() {
    // Array of lights to simulate an industrial ceiling grid
    const cols = 4;
    const rows = 3;
    const lights = [];

    for (let x = -30; x <= 30; x += 20) {
        for (let z = -10; z <= 30; z += 20) {
            lights.push([x, z]);
        }
    }

    return (
        <group position={[0, 28, 0]}> {/* Raised from 18 to 28 */}
            {lights.map(([x, z], i) => (
                <group key={i} position={[x, 0, z]}>
                    {/* Physical Fixture */}
                    <mesh rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.8, 0.8, 0.5]} />
                        <meshStandardMaterial color="#111" emissive="#333" />
                    </mesh>

                    {/* Glowing Source Bulb */}
                    <mesh position={[0, -0.3, 0]}>
                        <sphereGeometry args={[0.4]} />
                        <meshBasicMaterial color="#ffffff" toneMapped={false} />
                    </mesh>

                    {/* VOLUMETRIC BEAM (God Ray) */}
                    <SpotLight
                        position={[0, -0.4, 0]}
                        distance={35}
                        angle={0.6}
                        attenuation={15}
                        anglePower={7} // Sharp edges
                        radiusTop={0.4}
                        radiusBottom={10}
                        opacity={0.2} // Subtle dust look
                        color="#cceeff"
                        volumetric
                        castShadow={false}
                    />

                    {/* Floor Illuminator (Bounce) */}
                    <pointLight
                        position={[0, -5, 0]}
                        color="#ffffff"
                        intensity={5}
                        distance={40}
                        decay={1.2}
                    />
                </group>
            ))}
        </group>
    );
}
import tractorVideoUrl from '../../assets/videos/Cyberpunk_Tractor_Video_Generation.mp4';
import logoVideoUrl from '../../assets/videos/Logo_Video_Generation.mp4';

// --------------------------------------------------------
// INDUSTRIAL CEILING DETAILS (Wires, Signs, Trusses)
// --------------------------------------------------------
export function IndustrialCeilingDetails() {
    // Hanging heavy cables
    const cablePoints1 = [[-20, 18, 10], [-10, 14, 10], [0, 16, 10], [10, 14, 10], [20, 18, 10]];
    const cablePoints2 = [[-20, 18, 25], [-5, 12, 25], [20, 18, 25]];

    // Distant Exit Signs
    return (
        <group position={[0, 10, 0]}> {/* Wrapper to raise all details */}
            {/* Creating "Negative Space" fillers in upper corners */}

            {/* Hanging Wires - Left */}
            <CatmullRomLine points={cablePoints1} color="#111" lineWidth={3} />
            <CatmullRomLine points={cablePoints2} color="#000" lineWidth={4} position={[0, 2, 0]} />

            {/* Corner Trusses - Right Top */}
            <group position={[35, 15, -10]} rotation={[0, 0, -Math.PI / 6]}>
                <boxGeometry args={[40, 1, 1]} />
                <meshStandardMaterial color="#050505" metalness={0.8} />
            </group>

            {/* Corner Trusses - Left Top */}
            <group position={[-35, 15, -10]} rotation={[0, 0, Math.PI / 6]}>
                <boxGeometry args={[40, 1, 1]} />
                <meshStandardMaterial color="#050505" metalness={0.8} />
            </group>

            {/* Distant Small Exit Sign (Red) - Adds scale */}
            <group position={[15, 6, -5.4]}>
                <Text
                    color="red"
                    fontSize={0.3}
                    letterSpacing={0.1}
                    font="https://fonts.gstatic.com/s/teko/v1/55X-sZl4g8ikwdk.woff" // Basic tech font if available, else default
                >
                    EXIT 04
                </Text>
                <mesh position={[0, 0, -0.05]}>
                    <planeGeometry args={[1.5, 0.6]} />
                    <meshBasicMaterial color="black" />
                </mesh>
            </group>
        </group>
    )
}

export function DetailedFloor() {
    return (
        <group position={[0, 0.1, 0]}>
            {/* Main Reflector Floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[80, 80]} />
                <MeshReflectorMaterial
                    blur={[300, 100]} // Spread of the blur
                    resolution={1024}
                    mixBlur={1} // How much blur matches roughness
                    mixStrength={60} // Strength of reflection
                    roughness={0.7} // Surface roughness
                    depthScale={1.2}
                    minDepthThreshold={0.4}
                    maxDepthThreshold={1.4}
                    color="#080808"
                    metalness={0.6}
                    mirror={1} // High mirror for "wet" look
                />
            </mesh>
            {/* Tech Grid Overlay - Fades out */}
            <Grid
                position={[0, 0.01, 0]}
                args={[80, 80]}
                sectionSize={4}
                sectionThickness={1}
                sectionColor="#00ffff"
                cellSize={1}
                cellThickness={0.5}
                cellColor="#111111"
                fadeDistance={30}
                infiniteGrid
            />
        </group>
    );
}



// Large Background Billboard with Fish Video
export function BackgroundBillboard() {
    const texture = useVideoTexture(logoVideoUrl, { // Swapped to Logo Video
        mute: true,
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

    return (
        <group position={[0, 12, -25]}> {/* Background position */}
            {/* Screen Wash Light - Low intensity wash for environment integration */}
            <spotLight
                color="#00ffff"
                intensity={20} // Low intensity to avoid burnout
                distance={80}  // Long reach to hit booths
                angle={1.2}    // Wide angle
                penumbra={1}   // Soft edges
                position={[0, 0, 5]}
                target-position={[0, 0, 20]}
            />
            {/* Fake Reflection Plane (Stable) */}
            <mesh position={[0, 0, 0.1]}> {/* Slight Z-offset to prevent fighting with frame */}
                <planeGeometry args={[40, 18]} /> {/* Large Canvas */}
                <meshBasicMaterial
                    map={texture}
                    toneMapped={false}
                    fog={false} // Ignore scene fog so it stays bright from far away
                />
            </mesh>
            {/* Frame for the billboard */}
            <mesh position={[0, 0, -0.5]}>
                <boxGeometry args={[41, 19, 1]} />
                <meshStandardMaterial color="#050505" roughness={0.2} metalness={0.8} />
            </mesh>

        </group>
    )
}

// --- SCENE ENVIRONMENT ---

export function BackWallStructure() {
    return (
        <group position={[0, 15, -28]}> {/* Located just behind the Billboard (Z=-25) */}
            {/* Large Dark Wall Panel */}
            <mesh position={[0, 0, 0]}>
                <planeGeometry args={[120, 80]} />
                <meshStandardMaterial color="#555555" metalness={0.5} roughness={0.8} />
            </mesh>

            {/* Vertical Pillars to give scale */}
            {[-40, -20, 20, 40].map((x, i) => (
                <mesh key={i} position={[x, 0, 0.5]}>
                    <boxGeometry args={[4, 80, 2]} />
                    <meshStandardMaterial color="#111" metalness={0.8} roughness={0.2} />
                </mesh>
            ))}

            {/* Subtle Grid Pattern on Wall */}
            <Grid
                position={[0, 0, 0.1]}
                args={[120, 80]}
                rotation={[Math.PI / 2, 0, 0]}
                cellSize={4}
                cellThickness={1}
                cellColor="#222"
                sectionSize={20}
                sectionThickness={1.5}
                sectionColor="#333"
                fadeDistance={100}
                infiniteGrid={false}
            />
        </group>
    )
}

export function NeonCeiling() {
    // Creates the horizontal neon strips seen in the image - Dense Tunnel Effect
    const count = 30; // Increased count
    const trusses = 8; // Number of perpendicular trusses

    return (
        <group position={[0, 28, -20]}> {/* Raised from 18 to 28 */}
            {/* 1. The Neon Strips (Horizontal) */}
            {Array.from({ length: count }).map((_, i) => (
                <group key={`strip-${i}`} position={[0, 0, i * 4]}>
                    <mesh position={[0, 0, 0]}>
                        <boxGeometry args={[120, 0.02, 0.05]} /> {/* Very thin laser strip */}
                        <meshStandardMaterial
                            color={[0, 10, 10]} // HDR Cyan
                            toneMapped={false}
                            emissive={[0, 10, 10]}
                            emissiveIntensity={1}
                        />
                    </mesh>
                    {/* The Dark Housing */}
                    <mesh position={[0, 0.1, 0]}>
                        <boxGeometry args={[120, 0.2, 1]} />
                        <meshStandardMaterial color="#050505" roughness={0.5} />
                    </mesh>
                </group>
            ))}

            {/* 2. The Trusses (Perpendicular / Crossing) */}
            {Array.from({ length: trusses }).map((_, i) => {
                const xOffset = (i - (trusses - 1) / 2) * 15; // Spread them out
                return (
                    <mesh key={`truss-${i}`} position={[xOffset, 1.0, 60]}>
                        {/* Long beams running the length of the hall */}
                        <boxGeometry args={[1, 0.5, 150]} />
                        <meshStandardMaterial
                            color="#020202" // Almost black
                            metalness={0.9}
                            roughness={0.1}
                        />
                    </mesh>
                )
            })}
        </group>
    )
}

export function FloorArrows() {
    // The glowing path arrows on the floor
    const count = 8;
    return (
        <group position={[0, 0.02, 15]} rotation={[-Math.PI / 2, 0, 0]}>
            {Array.from({ length: count }).map((_, i) => (
                <group key={i} position={[0, i * 6, 0]}>
                    {/* Left Line */}
                    <mesh position={[-1, 0, 0]} rotation={[0, 0, -Math.PI / 4]}>
                        <planeGeometry args={[0.015, 3]} /> {/* Ultra thin */}
                        <meshStandardMaterial
                            color={[0, 20, 20]}
                            toneMapped={false}
                            emissive={[0, 20, 20]}
                            emissiveIntensity={1}
                            transparent
                            opacity={0.8}
                        />
                    </mesh>
                    {/* Right Line */}
                    <mesh position={[1, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
                        <planeGeometry args={[0.015, 3]} /> {/* Ultra thin */}
                        <meshStandardMaterial
                            color={[0, 20, 20]}
                            toneMapped={false}
                            emissive={[0, 20, 20]}
                            emissiveIntensity={1}
                            transparent
                            opacity={0.8}
                        />
                    </mesh>
                </group>
            ))}
            {/* Central straight line */}
            <mesh position={[0, 20, 0]}>
                <planeGeometry args={[0.02, 50]} />
                <meshStandardMaterial
                    color={[0, 20, 20]}
                    toneMapped={false}
                    emissive={[0, 20, 20]}
                    emissiveIntensity={1}
                    transparent
                    opacity={0.5}
                />
            </mesh>
        </group>
    )
}


// --- NEW CEILING DETAILS ---

function VentilationDucts() {
    return (
        <group position={[0, 24, 0]}>
            {/* Main Center Duct */}
            <mesh rotation={[0, 0, Math.PI / 2]} position={[0, 2, 0]}>
                <cylinderGeometry args={[2, 2, 80, 16]} />
                <meshStandardMaterial color="#333" roughness={0.4} metalness={0.8} />
            </mesh>
            {/* Ring Brackets */}
            {[-30, -15, 0, 15, 30].map((x, i) => (
                <mesh key={i} rotation={[0, 0, Math.PI / 2]} position={[x, 2, 0]}>
                    <torusGeometry args={[2.1, 0.2, 8, 32]} />
                    <meshStandardMaterial color="#111" />
                </mesh>
            ))}
            {/* Side Intake Ducts */}
            {[-20, 20].map((x, i) => (
                <group key={i} position={[x, 0, 15]}>
                    <mesh rotation={[0, 0, Math.PI / 2]}>
                        <cylinderGeometry args={[1, 1, 40, 16]} />
                        <meshStandardMaterial color="#444" roughness={0.5} metalness={0.6} />
                    </mesh>
                </group>
            ))}
        </group>
    )
}

function StructuralBeams() {
    // Heavy X-Bracing
    return (
        <group position={[0, 26, 0]}>
            {/* X-Brace 1 */}
            <group position={[0, 0, 10]}>
                <mesh rotation={[0, 0, Math.PI / 6]} position={[0, 0, 0]}>
                    <boxGeometry args={[50, 0.5, 0.5]} />
                    <meshStandardMaterial color="#111" metalness={0.8} />
                </mesh>
                <mesh rotation={[0, 0, -Math.PI / 6]} position={[0, 0, 0]}>
                    <boxGeometry args={[50, 0.5, 0.5]} />
                    <meshStandardMaterial color="#111" metalness={0.8} />
                </mesh>
            </group>
            {/* X-Brace 2 */}
            <group position={[0, 0, -10]}>
                <mesh rotation={[0, 0, Math.PI / 6]} position={[0, 0, 0]}>
                    <boxGeometry args={[50, 0.5, 0.5]} />
                    <meshStandardMaterial color="#111" metalness={0.8} />
                </mesh>
                <mesh rotation={[0, 0, -Math.PI / 6]} position={[0, 0, 0]}>
                    <boxGeometry args={[50, 0.5, 0.5]} />
                    <meshStandardMaterial color="#111" metalness={0.8} />
                </mesh>
            </group>
        </group>
    )
}

function CeilingMonitors() {
    // Hanging screens displaying data
    return (
        <group position={[0, 22, -5]}>
            {[-10, 0, 10].map((x, i) => (
                <group key={i} position={[x, 0, 0]} rotation={[0.4, 0, 0]}> {/* Angled down */}
                    {/* Cable */}
                    <mesh position={[0, 2, 0]}>
                        <cylinderGeometry args={[0.05, 0.05, 4]} />
                        <meshBasicMaterial color="#333" />
                    </mesh>
                    {/* Monitor Body */}
                    <mesh>
                        <boxGeometry args={[3, 1.8, 0.2]} />
                        <meshStandardMaterial color="#111" />
                    </mesh>
                    {/* Screen Glow */}
                    <mesh position={[0, 0, 0.11]}>
                        <planeGeometry args={[2.8, 1.6]} />
                        <meshBasicMaterial color={i === 1 ? "#ff00ff" : "#00ffff"} />
                    </mesh>
                    {/* Fake Text Lines */}
                    <group position={[-1, 0.5, 0.12]}>
                        <mesh>
                            <planeGeometry args={[1.5, 0.1]} />
                            <meshBasicMaterial color="white" />
                        </mesh>
                    </group>
                </group>
            ))}
        </group>
    )
}

export function UltimateFloor() {
    return (
        <group position={[0, -0.01, 0]}>
            {/* COMPONENT 1: The "Pink Success" Logic (Base Layer) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow={false}>
                <planeGeometry args={[120, 120]} />
                {/* Unlit White Material - Identical physics to the "Pink" check that worked */}
                <meshStandardMaterial color="#909090" roughness={0.5} metalness={0.5} />
            </mesh>

            {/* COMPONENT 2: The Reflections */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
                <planeGeometry args={[120, 120]} />
                <MeshReflectorMaterial
                    resolution={1024}
                    mirror={0.5}
                    mixBlur={8}
                    mixStrength={1.5}
                    depthScale={1}
                    minDepthThreshold={0.4}
                    maxDepthThreshold={1.4}
                    color="#A0A0A0" // Very Light Grey
                    metalness={0.6}
                    roughness={0.4}
                    distortion={0.2}
                    distortionMap={null}
                />
            </mesh>

            {/* Grid Overlay - "Architectural White" Style */}
            <Grid
                position={[0, 0.02, 0]}
                args={[120, 120]}
                cellSize={2}
                cellThickness={1}
                cellColor="#e6e6e6" // Extremely subtle off-white
                sectionSize={10}
                sectionThickness={1.5}
                sectionColor="#d4d4d4" // Subtle grey (Removed Blue/Cyan)
                fadeDistance={100} // Soft fade out at distance
                infiniteGrid
            />
        </group>
    )
}

export function IndustrialCeilingDetailsFixed() {
    return (
        <group position={[0, 0, 0]}>
            {/* SOLID ROOF ENCLOSURE */}
            <mesh position={[0, 30, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <planeGeometry args={[200, 200]} />
                <meshStandardMaterial color="#111" roughness={0.9} metalness={0.2} side={THREE.DoubleSide} />
            </mesh>

            <VentilationDucts />
            <StructuralBeams />
            <CeilingMonitors />

            <group position={[0, 26, 0]}> {/* Main Trusses */}
                {/* Left Side Pipes */}
                <mesh position={[-15, 0, 10]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.2, 0.2, 30]} />
                    <meshStandardMaterial color="#222" metalness={0.8} />
                </mesh>
                <mesh position={[-15, -1, 10]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.1, 0.1, 30]} />
                    <meshStandardMaterial color="#111" metalness={0.8} />
                </mesh>

                {/* Right Side Pipes */}
                <mesh position={[15, 0, 10]} rotation={[0, 0, Math.PI / 2]}>
                    <cylinderGeometry args={[0.2, 0.2, 30]} />
                    <meshStandardMaterial color="#222" metalness={0.8} />
                </mesh>

                {/* Crossing Beam */}
                <mesh position={[0, 2, 20]} rotation={[0, 0, 0]}>
                    <boxGeometry args={[60, 1, 1]} />
                    <meshStandardMaterial color="#111" />
                </mesh>
            </group>
        </group>
    )
}
