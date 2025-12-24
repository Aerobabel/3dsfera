/*
* PavilionInteraction.jsx
* Components for handling camera transitions and floating UI during product inspection.
*/
import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

// Lerps camera to target position for smooth "Zoom" effect
export function CameraSmoother({ controlsRef, targetPosition, cameraPosition, isActive }) {
    const focusRef = useRef({
        active: false,
        target: new THREE.Vector3(0, 0, 0),
        cam: new THREE.Vector3(0, 0, 0),
        startTime: 0,
    });

    useEffect(() => {
        if (isActive && targetPosition && cameraPosition) {
            focusRef.current = {
                active: true,
                target: new THREE.Vector3(...targetPosition),
                cam: new THREE.Vector3(...cameraPosition),
                startTime: performance.now(),
            };
        } else {
            // Reset logic if needed, or handle exit transition
            focusRef.current.active = false;
        }
    }, [isActive, targetPosition, cameraPosition]);

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
    if (!visible) return null;

    return (
        <Html position={position} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
            <div className={`
                flex flex-col gap-2 w-64 p-5 rounded-lg 
                bg-black/80 backdrop-blur-xl border border-white/20 
                shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-all duration-500 ease-out origin-bottom
                animate-in fade-in slide-in-from-bottom-4 pointer-events-auto
            `}>
                {/* Connection Line */}
                <div className="absolute -bottom-16 left-1/2 w-px h-16 bg-gradient-to-t from-transparent via-cyan-400/50 to-white/20 pointer-events-none" />
                <div className="absolute -bottom-16 left-1/2 w-2 h-2 -translate-x-1 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] pointer-events-none" />

                {/* Header */}
                <div className="border-b border-white/10 pb-2 mb-2 flex justify-between items-center">
                    <div>
                        {pavilionName && (
                            <div className="text-[10px] text-cyan-400/80 uppercase tracking-[0.2em] mb-1">Pavilion</div>
                        )}
                        <h3 className="text-white font-bold tracking-widest uppercase text-sm">{pavilionName || title}</h3>
                        <div className="h-0.5 w-8 bg-cyan-400 mt-1 shadow-[0_0_8px_#22d3ee]" />
                    </div>
                </div>

                {/* Description */}
                <p className="text-gray-300 text-xs leading-relaxed font-light mb-3">
                    {description}
                </p>

                {/* Stats Grid */}
                {stats && (
                    <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                        {Object.entries(stats).map(([label, value]) => (
                            <div key={label} className="bg-white/5 p-2 rounded border border-white/5">
                                <div className="text-gray-400 text-[10px] uppercase">{label}</div>
                                <div className="text-cyan-300 font-mono font-bold">{value}</div>
                            </div>
                        ))}
                    </div>
                )}

                <button
                    onClick={(e) => { e.stopPropagation(); onDetailsClick?.(); }}
                    className="w-full py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/30 rounded text-xs font-bold text-white transition flex items-center justify-center gap-2 group"
                >
                    <span>ENTER PAVILION</span>
                    <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </button>
            </div>
        </Html>
    );
}
