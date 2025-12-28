import React, { Suspense, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, Grid, Html, MeshReflectorMaterial, PointerLockControls, Sparkles, OrbitControls } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise, ChromaticAberration } from '@react-three/postprocessing';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import { useTranslation } from 'react-i18next';

const DEFAULT_ROOMS = [
  { id: 'industrial', title: 'IRON FOUNDRY', blurb: 'Robotics, pneumatics, and precision tooling.', color: '#22d3ee' },
  { id: 'techno', title: 'NEXUS SYSTEMS', blurb: 'Neon prototypes and immersive control decks.', color: '#6366f1' },
  { id: 'lux', title: 'AURUM PRESTIGE', blurb: 'Glass displays for premium accessories.', color: '#f59e0b' },
  { id: 'mobility', title: 'VORTEX MOTORS', blurb: 'EV drivetrains, aero drones, smart transit.', color: '#10b981' },
  { id: 'sustain', title: 'ECO SYNERGY', blurb: 'Clean tech, recycled composites, bio materials.', color: '#a855f7' },
];

function WalkingControls({ speed = 3, bounds = { x: 11, z: 10 }, onLockChange, controlsRef, orbitRef, cameraRef }) {
  const keys = useRef({});
  const velocity = useRef(new THREE.Vector3());
  const [isLocked, setIsLocked] = useState(false);

  React.useEffect(() => {
    const down = (e) => {
      keys.current[e.key.toLowerCase()] = true;
    };
    const up = (e) => {
      keys.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  useFrame((state, delta) => {
    if (!isLocked) {
      velocity.current.multiplyScalar(0.86);
      return;
    }

    const cam = state.camera;
    const forward = new THREE.Vector3();
    cam.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    const dir = new THREE.Vector3();
    if (keys.current['w'] || keys.current['arrowup']) dir.add(forward);
    if (keys.current['s'] || keys.current['arrowdown']) dir.sub(forward);
    if (keys.current['a'] || keys.current['arrowleft']) dir.sub(right);
    if (keys.current['d'] || keys.current['arrowright']) dir.add(right);

    if (dir.lengthSq() > 0) dir.normalize().multiplyScalar(speed);

    velocity.current.lerp(dir, 1 - Math.exp(-delta * 8));
    cam.position.add(velocity.current.clone().multiplyScalar(delta));
    velocity.current.multiplyScalar(0.92);

    cam.position.x = THREE.MathUtils.clamp(cam.position.x, -bounds.x, bounds.x);
    cam.position.z = THREE.MathUtils.clamp(cam.position.z, -bounds.z, bounds.z);
    cam.position.y = 1.6;
  });

  return (
    <>
      <PointerLockControls
        ref={controlsRef}
        onLock={() => {
          setIsLocked(true);
          onLockChange?.(true);
        }}
        onUnlock={() => {
          setIsLocked(false);
          onLockChange?.(false);
        }}
      />
      {!isLocked && (
        <OrbitControls
          ref={orbitRef}
          enablePan={false}
          enableZoom
          maxDistance={18}
          minDistance={6}
          maxPolarAngle={Math.PI / 2 - 0.05}
          minPolarAngle={Math.PI / 4}
          rotateSpeed={0.6}
          zoomSpeed={0.8}
          enableDamping
          dampingFactor={0.08}
          target={[0, 1.6, 0]}
          onChange={() => {
            // Keep camera Y at eye level after orbit
            if (cameraRef?.current) cameraRef.current.position.y = 1.6;
          }}
        />
      )}
    </>
  );
}

function Booth({ booth, position, index = 0, isActive = false }) {
  const group = useRef();
  const frameColor = new THREE.Color(booth.color);
  const glowColor = frameColor.clone().offsetHSL(0, 0, 0.1);
  const accent = frameColor.clone().offsetHSL(0, 0.1, 0.25);
  const emissiveBoost = isActive ? 2 : 1.2;

  React.useEffect(() => {
    if (group.current) {
      group.current.lookAt(0, 1.6, 0);
    }
  }, []);

  return (
    <group position={position} ref={group}>
      {/* Outer frame */}
      <mesh position={[0, 1.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.8, 3.4, 0.35]} />
        <meshStandardMaterial color={frameColor} metalness={1} roughness={0.18} emissive={glowColor} emissiveIntensity={0.55 * emissiveBoost} />
      </mesh>
      {/* Inner inset */}
      <mesh position={[0, 1.6, -0.2]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 2.8, 0.05]} />
        <meshStandardMaterial color="#0b0f16" metalness={0.55} roughness={0.35} />
      </mesh>
      {/* Angled pylons */}
      <mesh position={[2.05, 1.4, 0]} rotation={[0, 0, THREE.MathUtils.degToRad(8)]} castShadow>
        <boxGeometry args={[0.35, 2.6, 0.35]} />
        <meshStandardMaterial color={accent} metalness={0.9} roughness={0.2} emissive={accent} emissiveIntensity={0.5 * emissiveBoost} />
      </mesh>
      <mesh position={[-2.05, 1.4, 0]} rotation={[0, 0, THREE.MathUtils.degToRad(-8)]} castShadow>
        <boxGeometry args={[0.35, 2.6, 0.35]} />
        <meshStandardMaterial color={accent} metalness={0.9} roughness={0.2} emissive={accent} emissiveIntensity={0.5 * emissiveBoost} />
      </mesh>
      {/* Header canopy */}
      <mesh position={[0, 3.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.6, 0.28, 0.7]} />
        <meshStandardMaterial color="#101521" metalness={0.85} roughness={0.25} emissive={glowColor} emissiveIntensity={0.4 * emissiveBoost} />
      </mesh>
      {/* Overhead trim */}
      <mesh position={[0, 3.25, 0.05]}>
        <boxGeometry args={[3.8, 0.08, 0.12]} />
        <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={1.15 * emissiveBoost} metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Base plinth */}
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <boxGeometry args={[3.4, 0.12, 1.3]} />
        <meshStandardMaterial color="#090b12" metalness={0.85} roughness={0.3} emissive={glowColor} emissiveIntensity={0.28} />
      </mesh>
      {/* Decorative light bars */}
      <mesh position={[0, 1.6, 0.18]}>
        <boxGeometry args={[3.5, 0.08, 0.08]} />
        <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={1.2 * emissiveBoost} metalness={0.9} roughness={0.15} />
      </mesh>
      <mesh position={[0, 0.32, 0.25]}>
        <boxGeometry args={[2.2, 0.06, 0.12]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1} metalness={0.9} roughness={0.2} />
      </mesh>
      {/* Floor halo */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[1.4, 1.6, 32]} />
        <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={1} metalness={0.9} roughness={0.2} side={THREE.DoubleSide} />
      </mesh>
      {/* Label */}
      <Float speed={1} rotationIntensity={0} floatIntensity={0.2}>
        <Html center position={[0, 3.45, 0]} style={{ pointerEvents: 'none', textAlign: 'center' }}>
          <div className="px-4 py-2 rounded-2xl bg-black/60 border border-white/10 backdrop-blur-lg shadow-[0_0_25px_rgba(0,0,0,0.4)] w-40">
            <p className="text-[10px] uppercase tracking-[0.35em] text-white/70 mb-1">{booth.label}</p>
            <p className="text-white font-semibold text-sm">{booth.title}</p>
          </div>
        </Html>
      </Float>
      {/* Booth light */}
      <pointLight position={[0, 2.8, 1]} color={booth.color} intensity={isActive ? 7 : 3.5} distance={8} decay={2} />
      {/* Floor marker */}
      <Float speed={1.4} rotationIntensity={0} floatIntensity={0.1}>
        <Html center position={[0, 0.06, 0.85]} style={{ pointerEvents: 'none' }}>
          <div className="px-2 py-1 rounded-lg bg-black/70 border border-white/10 text-[11px] text-white/80">
            {index + 1}
          </div>
        </Html>
      </Float>
    </group>
  );
}

function ProximityTrigger({ booths, setNearby, rotationY = 0 }) {
  const rotationMatrix = useMemo(() => new THREE.Matrix4().makeRotationY(rotationY), [rotationY]);
  const boothVec = useMemo(
    () => booths.map((b) => new THREE.Vector3(...b.trigger).applyMatrix4(rotationMatrix)),
    [booths, rotationMatrix]
  );

  useFrame((state) => {
    const camPos = state.camera.position;
    let nearest = null;
    let nearestDist = Infinity;

    boothVec.forEach((vec, idx) => {
      const dist = camPos.distanceTo(vec);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = booths[idx];
      }
    });

    if (nearestDist < 3 && nearest) {
      setNearby({ id: nearest.id, distance: nearestDist });
    } else {
      setNearby(null);
    }
  });

  return null;
}

function CeilingGrid() {
  return (
    <group position={[0, 5.8, 0]}>
      <mesh receiveShadow>
        <boxGeometry args={[14, 0.2, 10]} />
        <meshStandardMaterial color="#0a0c12" roughness={0.45} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[13.6, 0.05, 9.6]} />
        <meshStandardMaterial color="#0d101a" metalness={0.6} roughness={0.35} emissive="#0f1624" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[12.5, 0.02, 8.5]} />
        <meshStandardMaterial color="#111827" metalness={0.6} roughness={0.35} emissive="#111827" emissiveIntensity={0.35} />
      </mesh>
    </group>
  );
}

function CenterBeacon() {
  const { t } = useTranslation();
  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.6, 0.8, 48]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={1.1} metalness={0.85} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 1.2, 24]} />
        <meshStandardMaterial color="#7dd3fc" emissive="#22d3ee" emissiveIntensity={1} metalness={0.9} roughness={0.2} />
      </mesh>
      <pointLight position={[0, 1.4, 0]} color="#22d3ee" intensity={3} distance={8} decay={2} />
      <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.6}>
        <Html center position={[0, 1.9, 0]} style={{ pointerEvents: 'none', textAlign: 'center' }}>
          <div className="px-3 py-1.5 rounded-full bg-black/60 border border-white/10 text-[10px] uppercase tracking-[0.35em] text-white/70">
            {t('hub.center_label')}
          </div>
        </Html>
      </Float>
    </group>
  );
}

function CenterBenches() {
  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, 0.18, -1.6]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 0.36, 0.9]} />
        <meshStandardMaterial color="#0b0f16" metalness={0.75} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.18, 1.6]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 0.36, 0.9]} />
        <meshStandardMaterial color="#0b0f16" metalness={0.75} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[0.4, 0.8, 0.4]} />
        <meshStandardMaterial color="#111827" metalness={0.65} roughness={0.35} />
      </mesh>
    </group>
  );
}

function SceneLayout({ rooms, setNearbyRoom, highlightId }) {
  const { t } = useTranslation();
  const rotationY = Math.PI / 2;
  const booths = useMemo(() => {
    return rooms.map((room, idx) => {
      const isLeft = idx % 2 === 0;
      // Zig-zag pattern:
      // Index 0: Left, z=-7
      // Index 1: Right, z=-5
      // Index 2: Left, z=-2 (+5)
      // Index 3: Right, z=0 (+5) -> actually original was -5, 1 (diff 6)
      // Let's standardize the gap to 5 units for simplicity and infinite scaling
      const row = Math.floor(idx / 2);
      const zBase = isLeft ? -7 : -5;
      const z = zBase + (row * 6); // 6 unit spacing between rows

      const x = isLeft ? -7.5 : 7.5;
      return {
        ...room,
        label: room.label || t('hub.pavilion_label'),
        position: [x, 0, z],
        trigger: [x + (isLeft ? 1.6 : -1.6), 1.6, z + (isLeft ? 0.2 : -0.2)],
      };
    });
  }, [rooms, t]);

  return (
    <group rotation={[0, rotationY, 0]}>
      <fog attach="fog" args={['#05070f', 8, 32]} />
      <Environment files="/hdris/convertio.in_image.hdr" background blur={0.015} environmentIntensity={0.9} />
      <ambientLight intensity={0.6} />
      <spotLight position={[8, 12, 6]} angle={0.45} penumbra={1} intensity={70} castShadow color="#ffffff" />
      <spotLight position={[-8, 12, -6]} angle={0.45} penumbra={1} intensity={60} castShadow color="#88c0ff" />

      <CeilingGrid />
      <CenterBeacon />
      <CenterBenches />

      <Suspense fallback={null}>
        {booths.map((booth, idx) => (
          <Booth key={booth.id} booth={booth} position={booth.position} index={idx} isActive={booth.id === highlightId} />
        ))}
      </Suspense>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[40, 30]} />
        <MeshReflectorMaterial
          resolution={768}
          mixBlur={0.25}
          mixStrength={1}
          roughness={0.28}
          depthScale={0.6}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.2}
          color="#03050b"
          metalness={0.82}
          mirror={0.52}
        />
      </mesh>
      <Grid
        position={[0, 0, 0]}
        args={[40, 30]}
        cellSize={1.2}
        cellThickness={0.45}
        cellColor={[0.05, 0.2, 0.35]}
        sectionSize={3}
        sectionThickness={1}
        sectionColor={[4.2, 10.5, 16]}
        fadeDistance={24}
        infiniteGrid
      />

      <ProximityTrigger booths={booths} setNearby={setNearbyRoom} rotationY={rotationY} />

      {/* Post-Processing Effects */}
      <EffectComposer disableNormalPass>
        <Bloom luminanceThreshold={1} mipmapBlur intensity={1.5} radius={0.4} />
        <Noise opacity={0.03} />
        <Vignette eskil={false} offset={0.1} darkness={0.9} />
        <ChromaticAberration offset={[0.0005, 0.0005]} radialModulation={false} modulationOffset={0} />
      </EffectComposer>
    </group>
  );
}

export default function HubScene({ rooms = DEFAULT_ROOMS, onEnterRoom, onBack }) {
  const { t } = useTranslation();
  const [nearbyRoom, setNearbyRoom] = useState(null);
  const [isFading, setIsFading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const pointerLockRef = useRef(null);
  const orbitRef = useRef(null);
  const cameraRef = useRef(null);

  const resetView = React.useCallback(() => {
    if (!cameraRef.current) return;
    cameraRef.current.position.set(10, 1.6, 0);
    cameraRef.current.lookAt(new THREE.Vector3(0, 1.6, 0));
    if (orbitRef.current) {
      orbitRef.current.target.set(0, 1.6, 0);
      orbitRef.current.update();
    }
  }, []);

  React.useEffect(() => {
    const handleKey = (e) => {
      if (e.key.toLowerCase() === 'e' && nearbyRoom?.id && nearbyRoom.distance < 2) {
        setIsFading(true);
        setTimeout(() => {
          onEnterRoom(nearbyRoom.id);
          setIsFading(false);
        }, 180);
      }
      if (e.key.toLowerCase() === 'f') {
        if (document.pointerLockElement) {
          pointerLockRef.current?.unlock?.();
        } else {
          pointerLockRef.current?.lock?.();
        }
      }
      if (e.key.toLowerCase() === 'r') {
        resetView();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [nearbyRoom, onEnterRoom, resetView]);

  return (
    <div className="h-[85vh] md:h-[90vh] w-full bg-black relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="absolute top-8 left-8 z-20 pointer-events-none"
      >
        <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/10 tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
          {t('hub.title')}
        </h2>
        <div className="flex items-center gap-3 mt-2">
          <div className="h-[1px] w-12 bg-cyan-500/50" />
          <p className="text-cyan-400 text-[10px] font-bold tracking-[0.5em] uppercase">{t('hub.tagline')}</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="absolute bottom-8 left-8 z-20 pointer-events-none text-white/40 text-[10px] font-mono tracking-wider"
      >
        <p>{t('hub.instructions')}</p>
      </motion.div>

      <div className="absolute top-8 right-8 z-20 flex flex-col items-end gap-3">
        <AnimatePresence>
          {nearbyRoom && (
            <motion.div
              initial={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: 20, filter: 'blur(10px)' }}
              className="group flex flex-col items-end"
            >
              <div className="px-6 py-3 rounded-lg bg-black/40 border border-white/10 text-white backdrop-blur-xl shadow-2xl">
                <p className="text-[10px] text-cyan-400 mb-1 uppercase tracking-widest text-right">{t('hub.approaching')}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-white/50">{t('hub.press')}</span>
                  <span className="text-xl font-bold text-white bg-white/10 px-2 rounded">E</span>
                  <span className="text-sm font-medium tracking-wide">
                    {t('hub.enter', { room: rooms.find((r) => r.id === nearbyRoom.id)?.title })}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="px-8 py-3 rounded-full border border-white/10 hover:border-white/40 bg-black/20 backdrop-blur-md text-white text-sm transition-all hover:bg-white/10 flex items-center gap-2 group"
        >
          <span>{t('hub.exit')}</span>
        </motion.button>
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2"
        >
          <button
            onClick={() => pointerLockRef.current?.lock?.()}
            className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-xs text-white/70 hover:text-white hover:border-white/30 transition"
          >
            {isLocked ? t('hub.unlock_cursor', 'ESC to unlock') : t('hub.lock_cursor', 'F to explore')}
          </button>
          <button
            onClick={resetView}
            className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-xs text-white/70 hover:text-white hover:border-white/30 transition"
          >
            {t('hub.reset_view', 'Reset (R)')}
          </button>
        </motion.div>
      </div>

      <Canvas
        shadows
        dpr={[1, 1.2]}
        camera={{ position: [10, 1.6, 0], fov: 55 }}
        onCreated={({ camera }) => {
          cameraRef.current = camera;
          camera.lookAt(new THREE.Vector3(0, 1.6, 0));
        }}
        gl={{ antialias: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
        className="absolute inset-0"
      >
        <SceneLayout rooms={rooms} setNearbyRoom={setNearbyRoom} highlightId={nearbyRoom?.id} />
        <WalkingControls
          onLockChange={setIsLocked}
          controlsRef={pointerLockRef}
          orbitRef={orbitRef}
          cameraRef={cameraRef}
        />
      </Canvas>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20"
      >
        <div className="px-4 py-2 rounded-full bg-black/60 backdrop-blur border border-white/10 text-[11px] text-white/70 font-mono tracking-[0.25em]">
          {isLocked
            ? 'WASD to move · Mouse look · E to enter · ESC to unlock'
            : 'Drag to orbit · Scroll to zoom · Press F for free-move · R to reset'}
        </div>
      </motion.div>
    </div>
  );
}











