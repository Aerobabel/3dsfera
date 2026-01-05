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

            // FIX: "Step Back" Logic - Refined V3 (Target-Relative)
            // Use the vector from Target -> Position to define "Backwards".
            // This guarantees we move AWAY from the object we were looking at.

            const backVector = new THREE.Vector3().subVectors(savedState.position, savedState.target);
            backVector.y = 0; // Flatten

            // Safety: If somehow position and target are identical (dist=0), create a default back vector
            if (backVector.lengthSq() < 0.0001) {
                // Fallback: use camera quaternion
                const fallbackForward = new THREE.Vector3(0, 0, -1).applyQuaternion(savedState.quaternion);
                fallbackForward.y = 0;
                backVector.copy(fallbackForward).negate();
            }

            backVector.normalize();

            // Move 0.75m back (Compromise between 0.5 and 1.5)
            const steppedBackPos = savedState.position.clone().add(backVector.multiplyScalar(0.75));

            // Floor clamp
            if (steppedBackPos.y < 0.5) steppedBackPos.y = 0.5;

            // FIX: Recalculate target to be exactly 1m in front of NEW camera position
            // We use the same 'view direction' as before, just from a new spot.
            // View Dir = (Target - Position).normalize() -> basically -backVector
            const viewDir = backVector.clone().negate();
            const safeTarget = steppedBackPos.clone().add(viewDir.multiplyScalar(0.99));

            // Safety: Force finish after 1.0s
            const timer = setTimeout(() => {
                if (isRestoring.current) {
                    camera.position.copy(steppedBackPos);
                    camera.quaternion.copy(savedState.quaternion); // Keep original rotation
                    if (controls) controls.target.copy(safeTarget);
                    isRestoring.current = false;
                    if (onRestoreComplete) onRestoreComplete();
                }
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [inspectMode, savedState, captureReq, camera, controls, onRestoreComplete]);

    // 3. Smooth Restore Animation
    useFrame((state, delta) => {
        if (isRestoring.current && savedState) {

            // Re-calculate Goal (Target-Relative)
            const backVector = new THREE.Vector3().subVectors(savedState.position, savedState.target);
            backVector.y = 0;
            if (backVector.lengthSq() < 0.0001) {
                const fallbackForward = new THREE.Vector3(0, 0, -1).applyQuaternion(savedState.quaternion);
                fallbackForward.y = 0;
                backVector.copy(fallbackForward).negate();
            }
            backVector.normalize();

            const goalPos = savedState.position.clone().add(backVector.multiplyScalar(0.75));
            if (goalPos.y < 0.5) goalPos.y = 0.5;

            // Exponential Damping
            const lambda = 8;
            const t = 1 - Math.exp(-lambda * delta);

            camera.position.lerp(goalPos, t);

            // Ensure smooth rotation
            camera.quaternion.slerp(savedState.quaternion, t);

            if (controls) {
                // Synthesize safe target
                const currentForward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
                const currentSafeTarget = camera.position.clone().add(currentForward.multiplyScalar(0.99));
                controls.target.copy(currentSafeTarget);
            }

            // Distance Check
            const posDist = camera.position.distanceTo(goalPos);
            const rotDist = camera.quaternion.angleTo(savedState.quaternion);

            if (posDist < 0.1 && rotDist < 0.05) {
                camera.position.copy(goalPos);
                camera.quaternion.copy(savedState.quaternion);

                // Final Set
                // Re-calculate view dir from stored quaternion to match rotation exactly
                const finalForward = new THREE.Vector3(0, 0, -1).applyQuaternion(savedState.quaternion);
                const finalTarget = goalPos.clone().add(finalForward.multiplyScalar(0.99));

                if (controls) controls.target.copy(finalTarget);

                isRestoring.current = false;
                if (onRestoreComplete) onRestoreComplete();
            }
        }
    });

    return null;
}
