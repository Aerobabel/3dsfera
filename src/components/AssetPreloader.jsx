import { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';

const HEAVY_MODELS = [
    '/objects/crane_machine.glb',
    '/objects/Pneumatic.glb',
    '/objects/turbo_schaft_engine_ivchenko_al-20.glb',
    '/objects/mobile_crane.glb'
];

export default function AssetPreloader() {
    useEffect(() => {
        // Preload heavy models into Drei cache
        HEAVY_MODELS.forEach(path => useGLTF.preload(path));

        // Preload HDRI by fetching it (browser disk cache)
        fetch('/hdris/convertio.in_image.hdr', { mode: 'no-cors' });

    }, []);

    return null;
}
