import React from 'react';
import { Environment, Lightformer, ContactShadows, Grid } from '@react-three/drei';
import * as THREE from 'three';
import {
    UltimateFloor,
    IndustrialCeilingDetailsFixed,
    CeilingLights,
    RealisticWall,
    NeonCeiling
} from './PavilionEnvironment';
import { FactoryPartition } from './subsystems/FactoryPartition';

export function PavilionArchitecture() {
    return (
        <group>
            {/* --- ENVIRONMENT (RESTORED DARK) --- */}
            <color attach="background" args={['#2a2a2a']} />
            <fogExp2 attach="fog" args={['#2a2a2a', 0.015]} />
            <Environment resolution={256} background={false} blur={0.6}>
                <Lightformer intensity={1.5} rotation-x={Math.PI / 2} position={[0, 5, -9]} scale={[10, 10, 1]} />
                <Lightformer intensity={2} rotation-y={Math.PI / 2} position={[-5, 1, -1]} scale={[20, 0.1, 1]} />
                <Lightformer intensity={2} rotation-y={Math.PI / 2} position={[-5, -1, -1]} scale={[20, 0.1, 1]} />
                <Lightformer intensity={1} rotation-y={-Math.PI / 2} position={[10, 1, 0]} scale={[20, 1, 1]} />
                {/* Cyan Industrial Tint */}
                <Lightformer intensity={0.5} rotation-y={Math.PI / 2} position={[-5, -1, -1]} scale={[20, 0.5, 1]} color="cyan" />
            </Environment>

            {/* REALISTIC LIGHTING RATIOS */}
            <ambientLight intensity={0.4} />

            <directionalLight
                position={[20, 30, 10]}
                intensity={4}
                castShadow
                shadow-mapSize={[4096, 4096]}
                shadow-bias={-0.0001}
                shadow-radius={4}
            />
            {/* Fill Lights */}
            <pointLight position={[30, 20, 0]} intensity={10} distance={50} decay={2} color="#e0e0ff" />
            <pointLight position={[-30, 20, 0]} intensity={5} distance={50} decay={2} color="#e0e0ff" />

            {/* --- CINEMATIC GROUNDING --- */}
            <ContactShadows
                position={[0, 0.01, 0]}
                opacity={0.6}
                scale={80}
                blur={2.5}
                far={2}
                resolution={1024}
                color="#000000"
            />

            <UltimateFloor />
            <IndustrialCeilingDetailsFixed height={14} width={150} depth={150} />
            <UltimateFloor />
            <IndustrialCeilingDetailsFixed height={14} width={150} depth={150} />
            <CeilingLights />
            <NeonCeiling />

            {/* The Sun / Sphere */}
            <group position={[0, 25, 0]}>
                <mesh>
                    <sphereGeometry args={[6, 64, 64]} />
                    <meshStandardMaterial emissive="white" emissiveIntensity={2} color="white" toneMapped={false} />
                </mesh>
                <pointLight intensity={4} distance={300} decay={2} color="cyan" />
            </group>

            {/* Deep Back Wall (Blocking the void at Z = -90) */}
            <group position={[0, 20, -90]}>
                <mesh>
                    <planeGeometry args={[300, 120]} />
                    <meshStandardMaterial color="#080808" />
                </mesh>
                <Grid
                    position={[0, 0, 0.5]}
                    args={[300, 120]}
                    rotation={[Math.PI / 2, 0, 0]}
                    cellSize={5}
                    cellThickness={1}
                    cellColor="#333"
                    sectionSize={25}
                    sectionThickness={2}
                    sectionColor="#00ffff"
                />
            </group>

            {/* --- WAREHOUSE STRUCTURE (Partitions & Dividers) --- */}
            <FactoryPartition position={[-15, 0, 10]} rotation={[0, Math.PI / 2, 0]} width={6} />
            <FactoryPartition position={[-15, 0, -15]} rotation={[0, Math.PI / 2, 0]} width={6} />
            <FactoryPartition position={[15, 0, 10]} rotation={[0, Math.PI / 2, 0]} width={6} />
            <FactoryPartition position={[15, 0, -15]} rotation={[0, Math.PI / 2, 0]} width={6} />
            <FactoryPartition position={[-10, 0, -45]} width={8} />
            <FactoryPartition position={[10, 0, -45]} width={8} />

            {/* Start Wall to enclose the lobby */}
            <group>
                {/* Left Wall Partitions */}
                {Array.from({ length: 5 }).map((_, i) => (
                    <RealisticWall
                        key={`lw-${i}`}
                        position={[-68, 0, -30 + (i * 15)]}
                        rotation={[0, Math.PI / 2, 0]}
                        width={15}
                    />
                ))}
                {/* Right Wall Partitions */}
                {Array.from({ length: 5 }).map((_, i) => (
                    <RealisticWall
                        key={`rw-${i}`}
                        position={[68, 0, -30 + (i * 15)]}
                        rotation={[0, -Math.PI / 2, 0]}
                        width={15}
                    />
                ))}
            </group>
            {/* BACK WALL */}
            <group position={[0, 0, 48]}>
                {Array.from({ length: 8 }).map((_, i) => (
                    <RealisticWall
                        key={`bw-${i}`}
                        position={[(i - 3.5) * 15, 0, 0]}
                        rotation={[0, Math.PI, 0]}
                        width={15}
                    />
                ))}
            </group>
        </group>
    );
}
