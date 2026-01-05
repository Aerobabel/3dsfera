import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function CameraManager({ inspectMode, captureReq, onCapture, savedState, onRestoreComplete }) {
    const { camera } = useThree();
    const controls = useThree((state) => state.controls);
    const isRestoring = useRef(false);

    // 1. Capture State (Before Transition)
    useEffect(() => {
        if (captureReq) {
            // State is pure here because inspectMode hasn't fired yet
            onCapture({
                position: camera.position.clone(),
                quaternion: camera.quaternion.clone(), // Capture Rotation
                target: controls?.target ? controls.target.clone() : new THREE.Vector3(0, 0, 0)
            });
        }
    }, [captureReq, onCapture, camera, controls]);

    // 2. Trigger Restore
    useEffect(() => {
        if (!inspectMode && savedState && !captureReq) {
            isRestoring.current = true;

            // --- EMERGENCY RESTORE: Absolute Simplicity ---
            // 1. Force Height (Eye Level)
            const restorePos = savedState.position.clone();
            restorePos.y = Math.max(restorePos.y, 1.7);

            // 2. Direct Restore - No offsets, no calculations
            // Just put the user back where they were.

            // Safety: Force finish
            const timer = setTimeout(() => {
                if (isRestoring.current) {
                    camera.position.copy(restorePos);
                    camera.quaternion.copy(savedState.quaternion);
                    if (controls) controls.target.copy(savedState.target);
                    isRestoring.current = false;
                    if (onRestoreComplete) onRestoreComplete();
                }
            }, 1000); // Faster restoration
            return () => clearTimeout(timer);
        }
    }, [inspectMode, savedState, captureReq, camera, controls, onRestoreComplete]);

    // 3. Smooth Restore Animation
    useFrame((state, delta) => {
        if (isRestoring.current && savedState) {
            // Exponential Damping
            const lambda = 8; // Snappier
            const t = 1 - Math.exp(-lambda * delta);

            // Re-calculate target (locally)
            const restorePos = savedState.position.clone();
            restorePos.y = Math.max(restorePos.y, 1.7);

            camera.position.lerp(restorePos, t);

            // Prevent going underground
            if (camera.position.y < 0.5) camera.position.y = 0.5;

            // REMOVED: quaternion.slerp
            // OrbitControls dictates rotation based on (Position - Target).

            if (controls) {
                controls.target.lerp(savedState.target, t);
            }

            // Distance Check
            const posDist = camera.position.distanceTo(savedState.position);
            const rotDist = camera.quaternion.angleTo(savedState.quaternion);

            if (posDist < 0.2 && rotDist < 0.1) {
                camera.position.copy(savedState.position);
                camera.quaternion.copy(savedState.quaternion);
                if (controls) controls.target.copy(savedState.target);
                isRestoring.current = false;
                if (onRestoreComplete) onRestoreComplete();
            }
        }
    });

    return null;
}
