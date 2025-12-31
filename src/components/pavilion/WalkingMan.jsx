import React, { useEffect, useRef, useMemo } from 'react';
import { useFBX, useAnimations } from '@react-three/drei';
import { useFrame, useGraph } from '@react-three/fiber';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';

const WALKMAN_PATH = '/objects/Walkman.fbx';

// --- HOLOGRAM SHADER MATERIAL ---
const HologramMaterial = {
    uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color('#00ffff') }
    },
    vertexShader: `
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
    fragmentShader: `
    uniform float time;
    uniform vec3 color;
    varying vec3 vNormal;
    varying vec3 vPosition;
    
    void main() {
      // 1. Fresnel Effect (Glowing edges)
      vec3 viewDir = normalize(cameraPosition - vPosition); // Simplified approximation
      // In view space (normalMatrix * normal) gives view space normal. 
      // Actually standard fresnel in shader material usually uses view vector.
      // Let's use a simple dot product for rim light.
      vec3 normal = normalize(vNormal);
      vec3 viewDirection = normalize(vec3(0.0, 0.0, 1.0)); // Camera is usually +Z in view space? 
      // Better approach for simple hologram:
      
      float fresnel = pow(1.0 - abs(dot(normal, vec3(0.0, 0.0, 1.0))), 2.0);

      // 2. Scanlines
      float scanline = sin((vPosition.y * 40.0) - (time * 5.0)); // Moving stripes
      float opacity = (0.3 + fresnel); 
      
      if(scanline > 0.5) opacity *= 0.5; // Darker bands

      gl_FragColor = vec4(color, opacity);
    }
  `,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false, // Important for transparency
    blending: THREE.AdditiveBlending
};


export default function WalkingMan({
    startPosition = [0, 0, 0],
    bounds = { x: [-10, 10], z: [-10, 10] },
    speed = 1.0,
    hologram = false, // Default to false (Civilian mode)
    ...props
}) {
    const group = useRef();
    const fbx = useFBX(WALKMAN_PATH);

    // Correctly clone the SkinnedMesh
    const clonedScene = useMemo(() => {
        const clone = SkeletonUtils.clone(fbx);
        // Apply Hologram Material if requested
        if (hologram) {
            clone.traverse((child) => {
                if (child.isMesh) {
                    const shaderMat = new THREE.ShaderMaterial({
                        uniforms: {
                            time: { value: 0 },
                            color: { value: new THREE.Color('cyan') }
                        },
                        vertexShader: `
                            varying vec3 vNormal;
                            varying vec3 vViewPosition;
                            void main() {
                                vNormal = normalize(normalMatrix * normal);
                                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                                vViewPosition = -mvPosition.xyz;
                                gl_Position = projectionMatrix * mvPosition;
                            }
                        `,
                        fragmentShader: `
                            uniform float time;
                            uniform vec3 color;
                            varying vec3 vNormal;
                            varying vec3 vViewPosition;
        
                            void main() {
                                vec3 normal = normalize(vNormal);
                                vec3 viewDir = normalize(vViewPosition);
                                
                                // Fresnel
                                float fresnel = pow(1.0 - abs(dot(normal, viewDir)), 3.0);
                                
                                // Scanlines
                                float scanline = sin(gl_FragCoord.y * 0.1 - time * 5.0);
                                float scanFactor = smoothstep(0.4, 0.6, scanline) * 0.3 + 0.7;

                                vec3 finalColor = color + (fresnel * vec3(1.0));
                                float alpha = fresnel * 0.8 + 0.1;
                                
                                gl_FragColor = vec4(finalColor * scanFactor, alpha);
                            }
                        `,
                        transparent: true,
                        side: THREE.FrontSide, // DoubleSide can cause artifacts on skinned meshes sometimes
                        blending: THREE.AdditiveBlending,
                        depthWrite: false
                    });
                    child.material = shaderMat;
                }
            });
        }
        return clone;
    }, [fbx, hologram]);

    // Bind animations directly to the cloned scene root
    const { actions, names } = useAnimations(fbx.animations, clonedScene);

    // Update Shader Time
    useFrame((state) => {
        if (hologram && clonedScene) {
            clonedScene.traverse((child) => {
                if (child.isMesh && child.material.uniforms) {
                    child.material.uniforms.time.value = state.clock.elapsedTime;
                }
            });
        }
    });

    // Movement State
    const target = useRef(new THREE.Vector3());
    const isMoving = useRef(true);

    // Initialize Random Target
    const pickNewTarget = () => {
        const x = THREE.MathUtils.randFloat(bounds.x[0], bounds.x[1]);
        const z = THREE.MathUtils.randFloat(bounds.z[0], bounds.z[1]);
        target.current.set(x, 0, z);
    };

    useEffect(() => {
        if (startPosition) {
            group.current.position.set(...startPosition);
            pickNewTarget();
        }
    }, []);

    useEffect(() => {
        console.log('WalkingMan: Animations load', names);
        if (actions && names.length > 0) {
            // Play the first animation (Walk)
            const action = actions[names[0]];
            if (action) {
                // Determine if it's a mixamo/CC4 animation (usually named 'mixamo.com' or specific name)
                action.reset().fadeIn(0.5).play();
                action.timeScale = 1;
            }
        }
    }, [actions, names]);

    useFrame((state, delta) => {
        if (!group.current) return;

        const currentPos = group.current.position;
        const targetPos = target.current;
        const dist = currentPos.distanceTo(targetPos);

        // 1. Revert target if close
        if (dist < 0.5) {
            pickNewTarget();
        }

        // 2. Rotate
        const lookDir = new THREE.Vector3().subVectors(targetPos, currentPos).normalize();
        const lookAtMatrix = new THREE.Matrix4().lookAt(currentPos, targetPos, new THREE.Vector3(0, 1, 0));
        const targetQuat = new THREE.Quaternion().setFromRotationMatrix(lookAtMatrix);
        group.current.quaternion.slerp(targetQuat, 4.0 * delta);

        // 3. Move
        const moveStep = lookDir.multiplyScalar(speed * delta);
        currentPos.add(moveStep);

        // Floor Clamp
        currentPos.y = 0;
    });

    return (
        <group ref={group} {...props} dispose={null}>
            {/* Rotate mesh 180 to face forward, Scale up to 0.013 */}
            {/* Reallusion exports might need 1.0 or 0.01 scale depending on unit setup. 
                Original was 0.013. Let's try 1.0 first if it's CC4 Unity export. 
                Actually, usually they are 100x too big. Let's stick to 0.013 for now and adjust.
            */}
            <primitive object={clonedScene} scale={0.013} rotation={[0, Math.PI, 0]} />
        </group>
    );
}

// useFBX.preload(WALKMAN_PATH);
