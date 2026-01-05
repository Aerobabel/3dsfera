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

            // FIX: "Step Back" Logic - Refined V2
            // Previous 1.5m was too aggressive and pushed user into walls behind.
            // New logic: 0.5m setback, strictly horizontal, maintaining safe height.

            // 1. Calculate Horizontal Back Vector
            const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(savedState.quaternion);
            forward.y = 0; // Flatten
            forward.normalize();
            const backVector = forward.negate();

            // 2. Calculate New Position (Conservative 0.5m step back)
            const steppedBackPos = savedState.position.clone().add(backVector.multiplyScalar(0.5));

            // 3. Robust Height Safety
            // Don't force 1.7m if they were crouching. Just ensure they aren't underground.
            // But if they were flying high, keep them high.
            // Use savedState Y, but clamp min to 1.6m (standing eye level) 
            // ONLY if they were already near that height, to avoid snapping up from a crouch.
            // Actually, safer to just clamp min 0.5m (floor) to avoid bugs.
            if (steppedBackPos.y < 0.5) steppedBackPos.y = 0.5;

            // FIX: Recalculate target to be exactly 1m in front of NEW camera position
            // to satisfy OrbitControls maxDistance={1.0} constraint
            // We use the same 'forward' direction as the saved state rotation
            const viewDir = new THREE.Vector3(0, 0, -1).applyQuaternion(savedState.quaternion);
            const safeTarget = steppedBackPos.clone().add(viewDir.multiplyScalar(0.99));

            // Safety: Force finish after 1.0s
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

            // Re-calculate Goal Position (Conservative V2)
            const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(savedState.quaternion);
            forward.y = 0;
            forward.normalize();
            const backVector = forward.negate();
            const goalPos = savedState.position.clone().add(backVector.multiplyScalar(0.5));
            if (goalPos.y < 0.5) goalPos.y = 0.5;

            // Exponential Damping
            const lambda = 8;
            const t = 1 - Math.exp(-lambda * delta);

            camera.position.lerp(goalPos, t);

            // Ensure smooth rotation
            camera.quaternion.slerp(savedState.quaternion, t);

            if (controls) {
                // Synthesize target on the fly to match current rotation
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
