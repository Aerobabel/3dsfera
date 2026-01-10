import React from 'react';
import { Gltf } from '@react-three/drei';
import { LODModel } from '../LODModel';

export function TableWithEquipment({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, castShadow = true }) {
    // LOD Base Paths
    const TABLE_LOD = '/objects/optimized_lods/industrial_table';
    const BALL_VALVE_LOD = '/objects/optimized_lods/ball_valve';
    const WATER_VALVE_LOD = '/objects/optimized_lods/water_pipe_valve';
    const VALVE_LOD = '/objects/optimized_lods/valve';

    // Non-optimized assets
    const PNEUMATIC_PATH = '/objects/optimized/Pneumatic.glb';

    return (
        <group position={position} rotation={rotation} scale={scale}>
            {/* Industrial Table - LOD Enabled */}
            <LODModel
                basePath={TABLE_LOD}
                position={[0, 0, 0]}
                rotation={[0, 0, 0]}
                scale={2.8}
                castShadow={castShadow}
                receiveShadow
            />

            {/* Detailed Valves on Table - LOD Enabled */}
            <LODModel
                basePath={BALL_VALVE_LOD}
                position={[-0.3, -0.35, 0.2]} // Raised from -1.5 (hidden) to -0.35 (visible bottom shelf)
                rotation={[0, Math.PI / 4, 0]}
                scale={0.01}
                castShadow={castShadow}
                receiveShadow
            />

            <LODModel
                basePath={WATER_VALVE_LOD}
                position={[0.3, 2.4, -0.2]}
                rotation={[0, -Math.PI / 4, 0]}
                scale={0.01}
                castShadow={castShadow}
                receiveShadow
            />

            {/* Pneumatic - Kept as Gltf (not in optimization list) */}
            <Gltf
                src={PNEUMATIC_PATH}
                position={[-0.3, 1.7, 0.2]}
                rotation={[0, Math.PI / 2, Math.PI / 2]}
                scale={0.9}
                castShadow={castShadow}
            />

            {/* High-Temp Valve - LOD Enabled - TARGET FIX */}
            <LODModel
                basePath={VALVE_LOD}
                position={[0.5, 0.15, 1.0]} // Lowered aggressively from 0.5 to 0.15
                rotation={[-Math.PI / 2, 0, 0]}
                scale={0.15}
                castShadow={castShadow}
                receiveShadow
            />
        </group>
    );
}
