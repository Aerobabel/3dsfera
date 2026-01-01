import { useEffect } from 'react';
import { useGLTF } from '@react-three/drei';

const HEAVY_MODELS = [
    // Preload lighter assets only (< 5MB)
    '/objects/optimized/escavator.glb',
    '/objects/optimized/mobile_crane.glb',
    '/objects/optimized/Pneumatic.glb',

    // DISABLED HEAVY ASSETS (Lazy Load to prevent Netlify Timeout/Crash)
    // '/objects/optimized/crane_machine.glb', // ~14MB
    // '/objects/optimized/microscope.glb', // ~14MB
    // '/objects/optimized/road_grader.glb', // ~15MB
    // '/objects/optimized/camera.glb', // ~7MB
];

export default function AssetPreloader() {
    useEffect(() => {
        // Preload heavy models into Drei cache
        HEAVY_MODELS.forEach(path => useGLTF.preload(path));

        // HDRI preloading removed to prevent network errors (Env uses Lightformers now)
        // fetch('/hdris/convertio.in_image.hdr', { mode: 'no-cors' });

    }, []);

    return null;
}
