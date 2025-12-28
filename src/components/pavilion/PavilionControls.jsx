import React, { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { useKeyboardControls, Html } from '@react-three/drei';
import * as THREE from 'three';

function CameraRig({ velocityRef, active = true }) {
    const { camera } = useThree();
    const [, getKeys] = useKeyboardControls();

    // Bounds for movement (Pavilion floor area)
    const MAX_X = 70;
    const MIN_X = -70;
    const MAX_Z = 60;
    const MIN_Z = -80;

    // Rotation Speed
    const ROTATION_SPEED = 1.5;

    useFrame((state, delta) => {
        if (!active) return;

        const { forward, backward, left, right } = getKeys();

        // --- TANK CONTROLS ---

        // 1. Rotation (Yaw) - Left/Right keys
        if (left) {
            camera.rotation.y += ROTATION_SPEED * delta;
        }
        if (right) {
            camera.rotation.y -= ROTATION_SPEED * delta;
        }

        // 2. Movement - Forward/Backward keys
        // 2. Movement - Forward/Backward keys
        const accel = 120 * delta; // Tripled acceleration
        const damping = 10; // Quicker stop

        // Enforce Eye Level (Hard Clamp + Smooth)
        // If we are way off (e.g. falling/initial load), snap instantly to avoid "falling" look
        if (Math.abs(camera.position.y - 1.7) > 1.0) {
            camera.position.y = 1.7;
        } else {
            camera.position.y = THREE.MathUtils.lerp(camera.position.y, 1.7, 10 * delta);
        }

        // Direction basis - Move in the direction we are facing
        const camForward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        camForward.y = 0; // Keep movement on floor plane
        camForward.normalize();

        const move = new THREE.Vector3();

        if (forward) {
            move.add(camForward);
        }
        if (backward) {
            move.sub(camForward);
        }

        if (move.lengthSq() > 0) {
            move.normalize().multiplyScalar(accel);
            velocityRef.current.add(move);
        }

        // Stable Damping
        const dampingFactor = Math.exp(-damping * delta);
        velocityRef.current.multiplyScalar(dampingFactor);

        // Stop completely if negligible velocity (Fixes drift)
        if (velocityRef.current.lengthSq() < 0.001) {
            velocityRef.current.set(0, 0, 0);
        }

        // Cap max speed
        const maxSpeed = 20; // Increased from 8
        if (velocityRef.current.length() > maxSpeed) {
            velocityRef.current.normalize().multiplyScalar(maxSpeed);
        }

        // Apply Position
        const nextX = camera.position.x + velocityRef.current.x * delta;
        const nextZ = camera.position.z + velocityRef.current.z * delta;

        // Collision Bounds
        if (nextX <= MAX_X && nextX >= MIN_X) {
            camera.position.x = nextX;
        }
        if (nextZ <= MAX_Z && nextZ >= MIN_Z) {
            camera.position.z = nextZ;
        }
    });
    return null;
}

function CameraPitchClamp({ cameraRef, active = true, minPitch = -Math.PI / 6, maxPitch = Math.PI / 6 }) {
    // Optional: Since we removed mouse look, we might want keys for looking up/down?
    // For now, tank controls usually keep head level or use separate keys.
    // We will just clamp strictly to avoid weird angles if any other force acts on it.
    const eulerRef = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
    useFrame((state, delta) => {
        if (!active) return;
        const cam = cameraRef?.current;
        if (!cam) return;
        // Enforce Eye Level (Smoothly)
        cam.position.y = THREE.MathUtils.lerp(cam.position.y, 1.7, 10 * delta);
        // Ensure Zero Roll
        cam.rotation.z = 0;
        // We might simply lock pitch to 0 for pure "DOOM" style, or allow slight look.
        // Let's keep pitch basically level (0) for simplicity unless requested.
        // If user wants to look UP at the ceiling, we need keys for that.
        // For now, let's keep it strictly level for stability in "walking" mode.
        cam.rotation.x = 0;
    });
    return null;
}

export function ControlsWrapper({ velocityRef, cameraRef, active = true }) {
    const { camera } = useThree();

    useEffect(() => {
        if (cameraRef) cameraRef.current = camera;
    }, [camera, cameraRef]);

    return (
        <>
            <CameraRig velocityRef={velocityRef} active={active} />
            <CameraPitchClamp cameraRef={cameraRef} active={active} />
        </>
    )
}

export { CameraRig, CameraPitchClamp };
