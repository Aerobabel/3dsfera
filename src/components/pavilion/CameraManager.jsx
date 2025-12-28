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
            const damp = 4 * delta; // Slightly slower for heavier "retract" feel
            camera.position.lerp(savedState.position, damp);
            camera.quaternion.slerp(savedState.quaternion, damp); // Restore Rotation

            if (controls) controls.target.lerp(savedState.target, damp);

            // Distance Check
            const posDist = camera.position.distanceTo(savedState.position);
            const rotDist = camera.quaternion.angleTo(savedState.quaternion);

            if (posDist < 0.1 && rotDist < 0.05) {
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
