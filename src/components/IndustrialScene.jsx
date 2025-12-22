import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, Grid, OrbitControls, useGLTF, Html, MeshReflectorMaterial } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise, SSAO } from '@react-three/postprocessing';
import * as THREE from 'three';

// --- UI / Infographic Component ---
function Annotation({ title, description, visible, position, distanceFactor = 12 }) {
  return (
    <Html position={position} center distanceFactor={distanceFactor} style={{ pointerEvents: 'none', display: visible ? 'block' : 'none' }}>
      <div className={`
        flex flex-col gap-2 w-56 p-5 rounded-lg 
        bg-black/40 backdrop-blur-xl border border-white/10 
        shadow-[0_0_40px_rgba(0,0,0,0.6)] transition-all duration-500 ease-out origin-bottom
        ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-90'}
      `}>
        {/* Animated Line */}
        <div className="absolute -bottom-28 left-1/2 w-px h-28 bg-gradient-to-t from-transparent via-white/40 to-white/10" />
        <div className="absolute -bottom-28 left-1/2 w-1.5 h-1.5 -translate-x-[3px] rounded-full bg-white shadow-[0_0_8px_white]" />
        
        <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
          <h3 className="text-white font-semibold tracking-widest uppercase text-xs">{title}</h3>
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
        </div>
        <p className="text-gray-200 text-xs leading-relaxed font-light tracking-wide">
          {description}
        </p>
      </div>
    </Html>
  );
}

// --- Cinematic Volumetric Beam ---
// This uses the Drei SpotLight which calculates volume density, not just a mesh
// --- Models ---
function Model({ path, scale = 1, onClick, onPointerOver, onPointerOut, isSelected }) {
  const gltf = useGLTF(path, true);
  const ref = useRef();
  
  // Slow rotation when idle
  useFrame((state, delta) => {
    if (ref.current && !isSelected) {
      ref.current.rotation.y += delta * 0.02;
    }
  });

  const scene = useMemo(() => {
    if (!gltf || !gltf.scene) return null;
    const clone = gltf.scene.clone();
    
    // Normalize Size
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3(); 
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const fitScale = (1.8 / maxDim) * scale;
    clone.scale.setScalar(fitScale);

    // Center geometry
    const centeredBox = new THREE.Box3().setFromObject(clone);
    const center = new THREE.Vector3();
    centeredBox.getCenter(center);
    clone.position.sub(center);
    
    // Apply darker, metallic materials for cinematic look
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        if (child.material) {
          child.material = child.material.clone();
          child.material.metalness = 0.9;
          child.material.roughness = 0.2;
        }
      }
    });

    return clone;
  }, [gltf, path, scale]);

  if (!scene) return null;

  return (
    <group
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; onPointerOver?.(); }}
      onPointerOut={() => { document.body.style.cursor = 'auto'; onPointerOut?.(); }}
    >
      <primitive object={scene} ref={ref} />
    </group>
  );
}

function BobbingGroup({ children, phase = 0, isSelected = false }) {
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime() + phase;
    const amp = isSelected ? 0.06 : 0.12;
    const speed = isSelected ? 0.8 : 1.2;
    ref.current.position.y = Math.sin(t * speed) * amp;
  });
  return <group ref={ref}>{children}</group>;
}

function PlatformModel({ path = '/objects/platform.glb' }) {
  const gltf = useGLTF(path, true);
  const scene = useMemo(() => {
    if (!gltf || !gltf.scene) return null;
    const clone = gltf.scene.clone();
    
    const box = new THREE.Box3().setFromObject(clone);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const fitScale = 2.5 / maxDim; // Make platform chunky/grounded
    clone.scale.setScalar(fitScale);
    
    const centeredBox = new THREE.Box3().setFromObject(clone);
    const center = new THREE.Vector3();
    centeredBox.getCenter(center);
    clone.position.sub(center);
    // Align bottom to 0
    clone.position.y += size.y * fitScale * 0.5;

    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.material.roughness = 0.1;
        child.material.metalness = 0.8;
      }
    });
    return clone;
  }, [gltf, path]);

  if (!scene) return null;
  return <primitive object={scene} />;
}

function CameraSmoother({ controlsRef, selectedObj }) {
  const focusRef = useRef({
    active: false,
    target: new THREE.Vector3(0, 1, 0),
    cam: new THREE.Vector3(0, 3, 9),
    start: 0,
  });

  useEffect(() => {
    const target =
      selectedObj === 'pneumatic'
        ? new THREE.Vector3(-3.5, 1.5, 0)
        : selectedObj === 'valve'
        ? new THREE.Vector3(3.5, 1.5, 0)
        : new THREE.Vector3(0, 1, 0);
    const camPos = selectedObj
      ? target.clone().add(new THREE.Vector3(0.6, 0.8, 3.2))
      : new THREE.Vector3(0, 3, 9);

    focusRef.current = { active: true, target, cam: camPos, start: performance.now() };
  }, [selectedObj]);

  useFrame(() => {
    const ctrl = controlsRef.current;
    if (!ctrl) return;
    const cam = ctrl.object;
    const focus = focusRef.current;
    if (!focus.active) return;

    cam.position.lerp(focus.cam, 0.1);
    ctrl.target.lerp(focus.target, 0.1);
    ctrl.update();

    const closeEnough =
      cam.position.distanceTo(focus.cam) < 0.02 && ctrl.target.distanceTo(focus.target) < 0.02;
    const timedOut = performance.now() - focus.start > 1000;
    if (closeEnough || timedOut) {
      focusRef.current.active = false;
    }
  });

  return null;
}

const PRODUCT_META = {
  pneumatic: {
    title: 'Pneumatic Actuator',
    supplier: 'AeroFlux Systems',
    price: '$23,900',
    details: ['Flow: 520 L/min', 'Max PSI: 5000', 'Materials: Ti/Carbon'],
  },
  valve: {
    title: 'Titanium Valve',
    supplier: 'TitanFlow Corp',
    price: '$18,600',
    details: ['Grade 5 Ti', 'Seal: Viton', 'Cycles: 10M+'],
  },
};

export default function IndustrialScene({ onBack }) {
  const [selectedObj, setSelectedObj] = useState(null);
  const [hoveredObj, setHoveredObj] = useState(null);
  const controlsRef = useRef();
  const infoDistance = selectedObj ? 8 : 12;
  const meta = selectedObj ? PRODUCT_META[selectedObj] : null;

  return (
    // FULLSCREEN CONTAINER
    <div className="h-[85vh] md:h-[90vh] w-full bg-black relative overflow-hidden">
      
      {/* FLOATING UI */}
      <div className="absolute top-8 left-8 z-20 pointer-events-none">
        <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-white/20 tracking-tighter">
          INDUSTRIAL CORE
        </h2>
        <p className="text-cyan-400 text-xs tracking-[0.5em] mt-2 uppercase">Interactive Exhibit</p>
      </div>
      
      <div className="absolute bottom-8 left-8 z-20 pointer-events-none text-white/40 text-xs">
        <p>SCROLL TO ZOOM • DRAG TO ROTATE • CLICK TO INSPECT</p>
      </div>

      <div className="absolute top-8 right-8 z-20">
        <button
          onClick={onBack}
          className="px-8 py-3 rounded-full border border-white/10 hover:border-white/40 bg-black/20 backdrop-blur-md text-white text-sm transition-all hover:bg-white/10"
        >
          Exit
        </button>
      </div>

      <Canvas
        shadows
        dpr={[1, 1.2]}
        camera={{ position: [0, 3, 9], fov: 45 }}
        gl={{ antialias: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
        onPointerMissed={() => setSelectedObj(null)}
        className="absolute inset-0" // CSS to force full size
      >
        {/* HDRI BACKGROUND */}
        <Environment 
            files="/hdris/convertio.in_image.hdr" 
            background={true}
            blur={0.02}
            environmentIntensity={1.0}
        />

        {/* Cinematic Lights */}
        <ambientLight intensity={0.55} />
        <spotLight position={[8, 10, 6]} angle={0.45} penumbra={1} intensity={85} castShadow color="#ffffff" />

        <Suspense fallback={null}>
          <group position={[0, 0, 0]}>

            {/* --- LEFT PLATFORM --- */}
            <group position={[-3.5, 0, 0]}>
              <PlatformModel />
              
              <Float speed={1.2} rotationIntensity={0} floatIntensity={0.12}>
                <BobbingGroup phase={0.2} isSelected={selectedObj === 'pneumatic'}>
                  <group position={[0, 1.8, 0]}>
                    <Model 
                      path="/objects/Pneumatic.glb" 
                      scale={1.0} 
                      onClick={() => setSelectedObj('pneumatic')}
                      onPointerOver={() => setHoveredObj('pneumatic')}
                      onPointerOut={() => setHoveredObj(null)}
                      isSelected={selectedObj === 'pneumatic'}
                    />
                  <Annotation 
                    title="Pneumatic Actuator" 
                    description="Variable pressure flow control. Click to view internal schematic and pressure ratings."
                    visible={hoveredObj === 'pneumatic' && !selectedObj}
                    position={[1.2, 1.8, 0]} // higher and offset to avoid occlusion
                    distanceFactor={infoDistance}
                  />
                  </group>
                </BobbingGroup>
              </Float>
            </group>

            {/* --- RIGHT PLATFORM --- */}
            <group position={[3.5, 0, 0]}>
              <PlatformModel />

              <Float speed={1.2} rotationIntensity={0} floatIntensity={0.12}>
                <BobbingGroup phase={0.8} isSelected={selectedObj === 'valve'}>
                  <group position={[0, 1.8, 0]}>
                    <Model 
                      path="/objects/valve.glb" 
                      scale={0.9} 
                      onClick={() => setSelectedObj('valve')}
                      onPointerOver={() => setHoveredObj('valve')}
                      onPointerOut={() => setHoveredObj(null)}
                      isSelected={selectedObj === 'valve'}
                    />
                  <Annotation 
                    title="Titanium Valve" 
                    description="Grade 5 titanium alloy. Designed for 5000 PSI operational loads in corrosive environments."
                    visible={hoveredObj === 'valve' && !selectedObj}
                    position={[-1.2, 1.8, 0]} // higher and offset
                    distanceFactor={infoDistance}
                  />
                  </group>
                </BobbingGroup>
              </Float>
            </group>

            {/* Floor + Grid */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
              <planeGeometry args={[100, 100]} />
            <MeshReflectorMaterial
              resolution={1024}
              mixBlur={0.6}
              mixStrength={1.5}
              roughness={0.22}
              depthScale={0.8}
              minDepthThreshold={0.4}
              maxDepthThreshold={1.4}
              color="#04060c"
              metalness={0.85}
              mirror={0.6}
            />
          </mesh>
          <Grid
            position={[0, 0, 0]}
            args={[100, 100]}
            cellSize={1.5}
            cellThickness={0.5}
            cellColor={[0.05, 0.2, 0.35]}
            sectionSize={3}
            sectionThickness={1.3}
            sectionColor={[4.2, 10.5, 16]} // >1 for emissive glow and reflection
            fadeDistance={40}
            infiniteGrid
          />
            
          </group>
        </Suspense>

        <CameraSmoother controlsRef={controlsRef} selectedObj={selectedObj} />

        {/* Post Processing */}
        <EffectComposer disableNormalPass>
          <Bloom luminanceThreshold={0.6} mipmapBlur intensity={1.1} radius={0.38} />
          <SSAO intensity={15} radius={0.2} luminanceInfluence={0.4} color="black" />
          <Noise opacity={0.02} />
          <Vignette eskil={false} offset={0.12} darkness={0.8} />
        </EffectComposer>

        <OrbitControls 
          ref={controlsRef}
          enableDamping
          dampingFactor={0.12}
          enablePan={false}
          enableRotate={true}
          enableZoom={true}
          maxPolarAngle={Math.PI / 2 - 0.1} // Prevent going under floor
          minDistance={3}
          maxDistance={14}
          rotateSpeed={0.35}
          zoomSpeed={0.7}
        />
      </Canvas>

      {/* Chat / Details Panel */}
      {meta && (
        <div className="absolute top-0 right-0 h-full w-full md:w-[360px] bg-gradient-to-b from-white/10 via-black/50 to-black/80 backdrop-blur-2xl border-l border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.45)] z-30 flex flex-col">
          <div className="p-4 border-b border-white/10 flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300">Supplier Chat</p>
              <h3 className="text-lg font-semibold text-white mt-1">{meta.title}</h3>
              <p className="text-sm text-slate-300">{meta.supplier}</p>
            </div>
            <button
              onClick={() => setSelectedObj(null)}
              className="text-white/70 hover:text-white text-sm px-3 py-1 rounded border border-white/15"
            >
              Close
            </button>
          </div>
          <div className="p-4 space-y-2">
            <p className="text-sm text-blue-200 font-semibold">{meta.price}</p>
            <ul className="space-y-1 text-xs text-slate-200">
              {meta.details.map((d) => (
                <li key={d}>• {d}</li>
              ))}
            </ul>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4 text-slate-200 text-sm">
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-3">
              <p className="text-xs text-slate-300">Supplier</p>
              <p>Share your spec sheet and target lead time. We can custom sleeve the actuator.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-xs text-slate-300">You</p>
              <p>Requesting MOQ and delivery for Q4. Need corrosion data and warranty terms.</p>
            </div>
          </div>
          <form
            className="p-4 border-t border-white/10 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            <input
              type="text"
              placeholder="Message supplier…"
              className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/50"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-sm font-semibold shadow-lg shadow-blue-500/30"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
