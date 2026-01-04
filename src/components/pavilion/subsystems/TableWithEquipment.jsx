import React from 'react';
import { Gltf } from '@react-three/drei';

export function TableWithEquipment({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }) {
    // Original absolute positions in the group were:
    // Table: [2.5, 0.3, 1.0]
    // Ball Valve: [2.2, -1.0, 1.2] -> diff: [-0.3, -1.3, 0.2]
    // Water Pipe: [2.8, 2.7, 0.8] -> diff: [0.3, 2.4, -0.2]
    // Pneumatic: [2.2, 2.0, 1.2] -> diff: [-0.3, 1.7, 0.2]
    // Scale was 2.8 for table.

    // We will base everything on the Table's position being [0,0,0] inside this component
    // and let the parent control the actual position via the prop.
    // However, the assets need their paths.

    const INDUSTRIAL_TABLE_PATH = '/objects/industrial_table.glb';
    const BALL_VALVE_PATH = '/objects/ball_valve.glb';
    const WATER_PIPE_VALVE_PATH = '/objects/water_pipe_valve.glb';
    const PNEUMATIC_PATH = '/objects/optimized/Pneumatic.glb';
    const VALVE_PATH = '/objects/valve.glb';

    return (
        <group position={position} rotation={rotation} scale={scale}>
            {/* Industrial Table */}
            <Gltf
                src={INDUSTRIAL_TABLE_PATH}
                position={[0, 0, 0]}
                rotation={[0, 0, 0]}
                scale={2.8}
                castShadow
                receiveShadow
            />

            {/* Detailed Valves on Table */}
            <Gltf
                src={BALL_VALVE_PATH}
                position={[-0.3, -1.3, 0.2]}
                rotation={[0, Math.PI / 4, 0]}
                scale={0.01}
                castShadow
                receiveShadow
            />

            <Gltf
                src={WATER_PIPE_VALVE_PATH}
                position={[0.3, 2.4, -0.2]}
                rotation={[0, -Math.PI / 4, 0]}
                scale={0.01}
                castShadow
                receiveShadow
            />

            {/* Pneumatic */}
            <Gltf
                src={PNEUMATIC_PATH}
                position={[-0.3, 1.7, 0.2]}
                rotation={[0, Math.PI / 2, Math.PI / 2]}
                scale={0.9}
                castShadow
            />

            {/* High-Temp Valve */}
            <Gltf
                src={VALVE_PATH}
                position={[0.5, 0.55, 1.0]}
                rotation={[-Math.PI / 2, 0, 0]}
                scale={0.15}
                castShadow
                receiveShadow
            />
        </group>
    );
}
