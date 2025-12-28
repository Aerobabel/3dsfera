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

            // Safety: Force finish after 1.5s if getting stuck
            const timer = setTimeout(() => {
                if (isRestoring.current) {
                    camera.position.copy(savedState.position);
                    camera.quaternion.copy(savedState.quaternion);
                    if (controls) controls.target.copy(savedState.target);
                    isRestoring.current = false;
                    if (onRestoreComplete) onRestoreComplete();
                }
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [inspectMode, savedState, captureReq, camera, controls, onRestoreComplete]);

    // 3. Smooth Restore Animation
    useFrame((state, delta) => {
        if (isRestoring.current && savedState) {
            // Exponential Damping
            const lambda = 6; // Reduced slightly for less "snap"
            const t = 1 - Math.exp(-lambda * delta);

            camera.position.lerp(savedState.position, t);

            // Prevent going underground (The "Underground" bug)
            if (camera.position.y < 0.5) camera.position.y = 0.5;

            // Ensure smooth rotation
            camera.quaternion.slerp(savedState.quaternion, t);

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
