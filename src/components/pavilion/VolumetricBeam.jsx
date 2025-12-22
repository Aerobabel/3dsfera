import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Custom Shader Material for God Rays (Simplified)
const GodRayShader = {
    uniforms: {
        color: { value: new THREE.Color(0x00ffff) },
        time: { value: 0 },
        opacity: { value: 0.5 }
    },
    vertexShader: `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform vec3 color;
        uniform float time;
        uniform float opacity;
        varying vec2 vUv;

        void main() {
            // Fake beam fade out
            float gradient = 1.0 - vUv.y; 
            float noise = sin(vUv.y * 20.0 - time * 2.0) * 0.1; 
            float alpha = gradient * opacity + noise;
            
            // Edges fade
            float edgeFade = smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x);
            alpha *= edgeFade;

            gl_FragColor = vec4(color, alpha * 0.5);
        }
    `
};

export default function VolumetricBeam({ color = '#00ffff', height = 10, width = 2 }) {
    const materialRef = useRef();

    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uniforms.time.value = state.clock.elapsedTime;
            materialRef.current.uniforms.color.value.set(color);
        }
    });

    return (
        <mesh position={[0, height / 2, 0]}>
            <cylinderGeometry args={[width, width, height, 32, 1, true]} />
            <shaderMaterial
                ref={materialRef}
                args={[GodRayShader]}
                transparent
                side={THREE.DoubleSide}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </mesh>
    );
}
