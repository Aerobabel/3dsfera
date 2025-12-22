import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';

function ClickArrow({ onClick }) {
    const ref = useRef();

    useFrame((state) => {
        if (ref.current) {
            // Bobbing animation
            ref.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.2;
        }
    });

    return (
        <group ref={ref} onClick={onClick}>
            {/* The Arrow Geometry */}
            <mesh rotation={[Math.PI, 0, 0]} position={[0, 0.5, 0]}>
                <coneGeometry args={[0.5, 1, 4]} />
                <meshBasicMaterial color="#00ffff" wireframe />
            </mesh>
            {/* CLICK ME Text */}
            <Text
                position={[0, 1.2, 0]}
                fontSize={0.4}
                color="#00ffff"
                anchorX="center"
                anchorY="bottom"
            >
                CLICK
            </Text>
        </group>
    );
}

export default ClickArrow;
