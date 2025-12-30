import React, { useEffect, useRef, useMemo } from 'react';
import { useFBX, useAnimations } from '@react-three/drei';
import { useFrame, useGraph } from '@react-three/fiber';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';

const WALKMAN_PATH = '/objects/Walkman.fbx';

export default function WalkingMan({
    startPosition = [0, 0, 0],
    bounds = { x: [-10, 10], z: [-10, 10] },
    speed = 1.0,
    ...props
}) {
    const group = useRef();
    const fbx = useFBX(WALKMAN_PATH);

    // Correctly clone the SkinnedMesh for independent instances
    // fbx is the scene itself
    const clonedScene = useMemo(() => SkeletonUtils.clone(fbx), [fbx]);

    // Bind animations directly to the cloned scene root
    const { actions, names } = useAnimations(fbx.animations, clonedScene);

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
            // Ensure we reset and play effectively
            const action = actions[names[0]];
            if (action) {
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
            <primitive object={clonedScene} scale={0.013} rotation={[0, Math.PI, 0]} />
        </group>
    );
}

// useFBX.preload(WALKMAN_PATH);
