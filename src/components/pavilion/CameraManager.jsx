import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function CameraManager({ inspectMode, captureReq, triggerRestore, onCapture, savedState, onRestoreComplete }) {
    const { camera } = useThree();
    const controls = useThree((state) => state.controls);
    const isRestoring = useRef(false);

    // 1. Capture State (Before Transition)
    useEffect(() => {
        if (captureReq) {
            onCapture({
                position: camera.position.clone(),
                quaternion: camera.quaternion.clone(),
                target: controls?.target ? controls.target.clone() : new THREE.Vector3(0, 0, 0)
            });
        }
    }, [captureReq, onCapture, camera, controls]);

    // 2. Trigger Restore (Manual Trigger via Prop)
    useEffect(() => {
        if (triggerRestore && savedState) {
            isRestoring.current = true;

            // FIX Step-Back V3: Target-Relative
            // Move AWAY from the object
            const backVector = new THREE.Vector3().subVectors(savedState.position, savedState.target);
            backVector.y = 0; // Flatten

            if (backVector.lengthSq() < 0.0001) {
                const fallbackForward = new THREE.Vector3(0, 0, -1).applyQuaternion(savedState.quaternion);
                fallbackForward.y = 0;
                backVector.copy(fallbackForward).negate();
            }
            backVector.normalize();

            // 0.75m Step Back
            const steppedBackPos = savedState.position.clone().add(backVector.multiplyScalar(0.75));
            if (steppedBackPos.y < 0.5) steppedBackPos.y = 0.5;

            // Recalculate Safe Target
            const viewDir = backVector.clone().negate();
            const safeTarget = steppedBackPos.clone().add(viewDir.multiplyScalar(0.99));

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
    }, [triggerRestore, savedState, camera, controls, onRestoreComplete]);

    // 3. Smooth Restore Animation
    useFrame((state, delta) => {
        if (isRestoring.current && savedState) {

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

            // Damping
            const lambda = 8;
            const t = 1 - Math.exp(-lambda * delta);

            camera.position.lerp(goalPos, t);
            camera.quaternion.slerp(savedState.quaternion, t);

            if (controls) {
                const currentForward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
                const currentSafeTarget = camera.position.clone().add(currentForward.multiplyScalar(0.99));
                controls.target.copy(currentSafeTarget);
            }

            const posDist = camera.position.distanceTo(goalPos);
            const rotDist = camera.quaternion.angleTo(savedState.quaternion);

            if (posDist < 0.1 && rotDist < 0.05) {
                camera.position.copy(goalPos);
                camera.quaternion.copy(savedState.quaternion);

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
