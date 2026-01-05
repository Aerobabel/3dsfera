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

            // FIX: "Step Back" Logic
            // Move camera 1.5m backwards from saved position to give breathing room
            // We calculate this ONCE here for the timeout fallback
            const backVector = new THREE.Vector3(0, 0, 1).applyQuaternion(savedState.quaternion);
            const steppedBackPos = savedState.position.clone().add(backVector.multiplyScalar(1.5));

            // Floor clamp to prevent going under the map
            if (steppedBackPos.y < 1.7) steppedBackPos.y = 1.7;

            // FIX: Recalculate target to be exactly 1m in front of NEW camera position
            // to satisfy OrbitControls maxDistance={1.0} constraint
            const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(savedState.quaternion);
            const safeTarget = steppedBackPos.clone().add(forward.multiplyScalar(0.99));

            // Safety: Force finish after 1.5s if getting stuck
            const timer = setTimeout(() => {
                if (isRestoring.current) {
                    camera.position.copy(steppedBackPos);
                    camera.quaternion.copy(savedState.quaternion);
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

            // Calculate Goal Position (Stepped Back)
            const backVector = new THREE.Vector3(0, 0, 1).applyQuaternion(savedState.quaternion);
            const goalPos = savedState.position.clone().add(backVector.multiplyScalar(1.5));
            if (goalPos.y < 1.7) goalPos.y = 1.7;

            // Exponential Damping
            const lambda = 8; // Snappier restore
            const t = 1 - Math.exp(-lambda * delta);

            camera.position.lerp(goalPos, t);

            // Ensure smooth rotation
            camera.quaternion.slerp(savedState.quaternion, t);

            if (controls) {
                // Synthesize target on the fly to match current rotation
                // This ensures perfectly straight interpolation of the view
                const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
                const currentSafeTarget = camera.position.clone().add(forward.multiplyScalar(0.99));
                controls.target.copy(currentSafeTarget);
            }

            // Distance Check
            const posDist = camera.position.distanceTo(goalPos);
            const rotDist = camera.quaternion.angleTo(savedState.quaternion);

            if (posDist < 0.1 && rotDist < 0.05) {
                camera.position.copy(goalPos);
                camera.quaternion.copy(savedState.quaternion);

                // Final Set
                // Re-calculate one last time to be precise
                const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(savedState.quaternion);
                const finalTarget = goalPos.clone().add(forward.multiplyScalar(0.99));

                if (controls) controls.target.copy(finalTarget);

                isRestoring.current = false;
                if (onRestoreComplete) onRestoreComplete();
            }
        }
    });

    return null;
}
