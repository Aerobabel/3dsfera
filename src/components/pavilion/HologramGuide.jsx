import React, { useEffect, useMemo, useRef } from 'react';
import { useFBX, useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SkeletonUtils } from 'three-stdlib';

// Verified paths on disk: public/objects/actor/Actor/party-f-0001/party-f-0001.fbm/
const HOLOGRAM_PATH = '/objects/actor/Actor/party-f-0001/party-f-0001.fbx';
const TEXTURE_PATH = '/objects/actor/Actor/party-f-0001/party-f-0001.fbm/Character_Pbr_Diffuse.png';
const NORMAL_PATH = '/objects/actor/Actor/party-f-0001/party-f-0001.fbm/Character_Pbr_Normal.jpg';

export default function HologramGuide({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 0.01 }) {
    const group = useRef();

    // Load Assets
    const sourceFbx = useFBX(HOLOGRAM_PATH);
    const textureMap = useTexture(TEXTURE_PATH);
    const normalMap = useTexture(NORMAL_PATH);
    textureMap.colorSpace = THREE.SRGBColorSpace;

    const fbx = useMemo(() => {
        const clone = SkeletonUtils.clone(sourceFbx);

        // --- BONE FINDER ---
        const bones = {
            spine: null,
            neck: null,
            leftArm: null,
            rightArm: null,
        };

        clone.traverse((child) => {
            if (child.isBone) {
                const n = child.name;
                // Spine
                if (n === 'CC_Base_Spine01' || n === 'CC_Base_Spine02' || n.includes('Spine')) {
                    if (!bones.spine) bones.spine = child;
                }
                // Head/Neck
                if (n === 'CC_Base_NeckTwist01' || n === 'CC_Base_Head' || n.includes('Neck')) {
                    if (!bones.neck) bones.neck = child;
                }
                // Arms
                if (n === 'CC_Base_L_Upperarm' || n === 'mixamorig:LeftArm' || n === 'LeftArm') {
                    bones.leftArm = child;
                }
                if (n === 'CC_Base_R_Upperarm' || n === 'mixamorig:RightArm' || n === 'RightArm') {
                    bones.rightArm = child;
                }
            }
        });

        clone.userData.bones = bones;

        // Material Surgery
        clone.traverse((child) => {
            if (child.isMesh) {
                const newMat = new THREE.MeshStandardMaterial({
                    name: 'Safe_Skin',
                    map: textureMap,
                    normalMap: normalMap,
                    color: 0xffffff,
                    metalness: 0.0,
                    roughness: 0.8,
                    side: THREE.FrontSide,
                });
                if (child.material) child.material.dispose();
                child.material = newMat;
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        // Feet Align
        const box = new THREE.Box3().setFromObject(clone);
        clone.position.y += -box.min.y;

        const center = new THREE.Vector3();
        box.getCenter(center);
        clone.position.x -= center.x;
        clone.position.z -= center.z;

        return clone;
    }, [sourceFbx, textureMap, normalMap]);

    // PROCEDURAL ANIMATION LOOP
    useFrame((state) => {
        const t = state.clock.elapsedTime;
        const { spine, neck, leftArm, rightArm } = fbx.userData.bones;

        // Breathing
        if (spine) {
            spine.rotation.x = (Math.sin(t * 2) * 0.03);
            spine.rotation.y = (Math.cos(t * 1) * 0.03);
        }

        // Subtle neck movement (Convai friendly)
        if (neck) {
            neck.rotation.x = -(Math.sin(t * 2) * 0.01);
        }

        // FORCE ARMS DOWN (A-Pose)
        if (leftArm) {
            leftArm.rotation.z = -1.4 + (Math.sin(t) * 0.02);
            leftArm.rotation.x = 0.3;
        }
        if (rightArm) {
            rightArm.rotation.z = 1.4 - (Math.sin(t) * 0.02);
            rightArm.rotation.x = 0.3;
        }
    });

    return (
        <group ref={group} position={position} rotation={rotation} dispose={null}>
            <primitive object={fbx} scale={scale} />
        </group>
    );
}
