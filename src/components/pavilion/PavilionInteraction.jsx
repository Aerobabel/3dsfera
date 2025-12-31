/*
* PavilionInteraction.jsx
* Components for handling camera transitions and floating UI during product inspection.
*/
import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useTranslation } from 'react-i18next';
import * as THREE from 'three';

// Lerps camera to target position for smooth "Zoom" effect
export function CameraSmoother({ controlsRef, targetPosition, cameraPosition, isActive }) {
    const { camera } = useThree();
    const focusRef = useRef({
        active: false,
        target: new THREE.Vector3(0, 0, 0),
        cam: new THREE.Vector3(0, 0, 0),
        startTime: 0,
    });
    const lastTarget = useRef(null);
    const wasActive = useRef(false);

    useEffect(() => {
        if (isActive && targetPosition && cameraPosition) {
            focusRef.current = {
                active: true,
                target: new THREE.Vector3(...targetPosition),
                cam: new THREE.Vector3(...cameraPosition),
                startTime: performance.now(),
            };
            lastTarget.current = new THREE.Vector3(...targetPosition);
        } else {
            // Stop lerp
            focusRef.current.active = false;
        }

        // Handle Exit Transition: Reset orientation to face the product
        if (wasActive.current && !isActive && lastTarget.current) {
            // Snap look-at to the last known target (but level with horizon)
            camera.lookAt(lastTarget.current.x, camera.position.y, lastTarget.current.z);
            // Ensure strictly level (no pitch/roll) so CameraRig takes over cleanly
            camera.rotation.x = 0;
            camera.rotation.z = 0;
        }

        wasActive.current = isActive;
    }, [isActive, targetPosition, cameraPosition, camera]);

    useFrame((state, delta) => {
        if (!focusRef.current.active || !controlsRef.current) return;

        const ctrl = controlsRef.current;
        const cam = state.camera;
        const target = focusRef.current;

        // Smooth Lerp
        const speed = 4 * delta; // Adjust speed here
        cam.position.lerp(target.cam, speed);
        ctrl.target.lerp(target.target, speed);
        ctrl.update();

        // Snap if close enough to stop jitter
        if (cam.position.distanceTo(target.cam) < 0.1 && ctrl.target.distanceTo(target.target) < 0.1) {
            // cam.position.copy(target.cam);
            // ctrl.target.copy(target.target);
            focusRef.current.active = false; // Disable lerp to allow user control
        }
    });

    return null;
}

// Floating UI Card
export function FloatingAnnotation({ title, description, stats, pavilionName, visible, position, onDetailsClick }) {
    const { t } = useTranslation();
    if (!visible) return null;

    return (
        <Html position={position} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
            <div className={`
                flex flex - col gap - 2 w - 64 p - 5 rounded - lg
bg - black / 80 backdrop - blur - xl border border - white / 20
shadow - [0_0_50px_rgba(0, 0, 0, 0.5)] transition - all duration - 500 ease - out origin - bottom
animate -in fade -in slide -in -from - bottom - 4 pointer - events - auto
    `}
                style={{ fontFamily: 'Inter, "Segoe UI", Arial, sans-serif' }}
            >
                {/* Connection Line */}
                <div className="absolute -bottom-16 left-1/2 w-px h-16 bg-gradient-to-t from-transparent via-cyan-400/50 to-white/20 pointer-events-none" />
                <div className="absolute -bottom-16 left-1/2 w-2 h-2 -translate-x-1 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] pointer-events-none" />

                {/* Header */}
                <div className="border-b border-white/10 pb-2 mb-2 flex justify-between items-center">
                    <div>
                        {pavilionName && (
                            <div className="text-[10px] text-cyan-400/80 uppercase tracking-[0.2em] mb-1" style={{ fontFamily: 'Inter, "Segoe UI", Arial, sans-serif' }}>
                                {t('pavilion_ui.pavilion_label', 'PAVILION')}
                            </div>
                        )}
                        <h3 className="text-white font-bold tracking-widest uppercase text-sm" style={{ fontFamily: 'Inter, "Segoe UI", Arial, sans-serif' }}>
                            {pavilionName || title}
                        </h3>
                        <div className="h-0.5 w-8 bg-cyan-400 mt-1 shadow-[0_0_8px_#22d3ee]" />
                    </div>
                </div>

                {/* Description */}
                <p className="text-gray-300 text-xs leading-relaxed font-light mb-3" style={{ fontFamily: 'Inter, "Segoe UI", Arial, sans-serif' }}>
                    {t(`pavilion_content.pavilions.${title?.toLowerCase?.()?.replace(/[^a-z0-9]+/g, '-') || ''}.description`, { defaultValue: description })}
                </p>

                {/* Stats Grid */}
                {stats && (
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                        {Object.entries(stats).map(([label, value]) => (
                            <div key={label} className="bg-white/5 p-2 rounded border border-white/5">
                                <div className="text-gray-400 text-[10px] uppercase" style={{ fontFamily: 'Inter, "Segoe UI", Arial, sans-serif' }}>
                                    {t(`pavilion_content.stats.${label} `, label)}
                                </div>
                                <div className="text-cyan-300 font-mono font-bold">{value}</div>
                            </div>
                        ))}
                    </div>
                )}

                <button
                    onClick={(e) => { e.stopPropagation(); onDetailsClick?.(); }}
                    className="w-full py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 rounded text-xs font-bold text-white transition flex items-center justify-center gap-2 group"
                    style={{ fontFamily: 'Inter, "Segoe UI", Arial, sans-serif' }}
                >
                    <span>{t('pavilion_ui.enter_pavilion', 'ENTER PAVILION')}</span>
                    <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </button>
            </div>
        </Html>
    );
}
// 2D Static HUD Card (Replaces FloatingAnnotation for reliability)
export function InspectionCard({ title, description, stats, pavilionName, visible, onDetailsClick, productId, pavilionId }) {
    const { t } = useTranslation();
    if (!visible) return null;

    // Resolve Trans keys
    // If productId is provided, use it. Otherwise, use title slug logic as fallback (or handle based on context)
    // Structure: pavilion_content.products.[id].title / description
    // Structure: pavilion_content.pavilions.[id].name / description

    let displayTitle = title;
    let displayDescription = description;
    let displayPavilionName = pavilionName;

    if (productId) {
        displayTitle = t(`pavilion_content.products.${productId}.title`, title);
        displayDescription = t(`pavilion_content.products.${productId}.description`, description);
    } else if (pavilionId) {
        // It's a pavilion description/intro
        displayPavilionName = t(`pavilion_content.pavilions.${pavilionId}.name`, pavilionName);
        displayDescription = t(`pavilion_content.pavilions.${pavilionId}.description`, description);
    }
    // Fallback for generic objects or legacy format
    // If no productId, we might try to infer from title if needed, but really we should pass productId.

    let displayStats = stats;
    if (productId) {
        const productStats = t(`pavilion_content.products.${productId}.stats`, { returnObjects: true });
        // Check if we got a real object back (not the key string or undefined)
        if (productStats && typeof productStats === 'object' && !Array.isArray(productStats)) {
            displayStats = productStats;
        }
    } else if (pavilionId) {
        const pavStats = t(`pavilion_content.pavilions.${pavilionId}.stats`, { returnObjects: true });
        if (pavStats && typeof pavStats === 'object' && !Array.isArray(pavStats)) {
            displayStats = pavStats;
        }
    }

    return (
        <div className={`
                absolute right-8 top-1/2 -translate-y-1/2 z-40
                flex flex-col gap-2 w-72 p-6 rounded-2xl
                bg-black/80 backdrop-blur-xl border border-white/20
                shadow-[0_0_50px_rgba(0,0,0,0.5)] 
                animate-in fade-in slide-in-from-right-8
            `}
            style={{ fontFamily: 'Inter, "Segoe UI", Arial, sans-serif' }}
        >
            {/* Header */}
            <div className="border-b border-white/10 pb-3 mb-3 flex justify-between items-center">
                <div>
                    {pavilionName && (
                        <div className="text-[10px] text-cyan-400/80 uppercase tracking-[0.2em] mb-1">
                            {t('pavilion_ui.pavilion_label', 'PAVILION')}
                        </div>
                    )}
                    <h3 className="text-white font-bold tracking-widest uppercase text-lg">
                        {displayPavilionName || displayTitle}
                    </h3>
                    <div className="h-0.5 w-12 bg-cyan-400 mt-2 shadow-[0_0_12px_#22d3ee]" />
                </div>
            </div>

            {/* Description */}
            <p className="text-gray-300 text-sm leading-relaxed font-light mb-4">
                {displayDescription}
            </p>

            {/* Stats Grid */}
            {displayStats && (
                <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                    {Object.entries(displayStats).map(([label, value]) => (
                        <div key={label} className="bg-white/5 p-3 rounded-lg border border-white/5">
                            <div className="text-gray-400 text-[10px] uppercase mb-1">
                                {t(`pavilion_content.stats.${label}`, label)}
                            </div>
                            <div className="text-cyan-300 font-mono font-bold text-sm">{value}</div>
                        </div>
                    ))}
                </div>
            )}

            <button
                onClick={(e) => { e.stopPropagation(); onDetailsClick?.(); }}
                className="w-full py-3 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 rounded-lg text-xs font-bold text-white transition flex items-center justify-center gap-2 group uppercase tracking-wider"
            >
                <span>{t('pavilion_ui.enter_pavilion', 'ENTER PAVILION')}</span>
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </button>
        </div>
    );
}
