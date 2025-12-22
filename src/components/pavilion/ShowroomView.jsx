import React, { useState, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Canvas } from '@react-three/fiber';
import { Loader, OrbitControls, Environment, MeshReflectorMaterial } from '@react-three/drei';
import * as THREE from 'three';
import ProductModel from './ProductModel';

// ASSET PATHS (Hardcoded here for now, could be props or shared constants)
const TURBO_ENGINE_PATH = '/objects/turbo_schaft_engine_ivchenko_al-20.glb';
const PNEUMATIC_PATH = '/objects/Pneumatic.glb';
const CRANE_PATH = '/objects/mobile_crane.glb';

function ShowroomView({ pavilionData, onBack, user }) {
    const { t } = useTranslation();
    const [selectedProduct, setSelectedProduct] = useState(null);

    return (
        <div className="w-full h-screen bg-[#111] relative">
            <button
                onClick={onBack}
                className="absolute top-8 left-8 z-50 px-4 py-2 bg-white/10 backdrop-blur border border-white/20 rounded-lg text-white font-bold hover:bg-white/20 transition"
            >
                {t('verified_pavilion.ui.back_to_expo')}
            </button>

            {selectedProduct && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 md:p-10">
                    <div className="bg-gray-900 border border-cyan-500/50 p-6 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col relative shadow-[0_0_50px_rgba(0,255,255,0.2)]">
                        <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white font-bold text-xl">Close</button>
                        <h2 className="text-2xl text-cyan-400 font-bold mb-1">{selectedProduct.name}</h2>
                        <p className="text-sm text-gray-400 mb-4">{selectedProduct.description}</p>
                        <div className="flex-1 bg-black/50 rounded-lg overflow-hidden relative border border-white/10">
                            <Canvas camera={{ position: [0, 2, 5], fov: 45 }}>
                                <ambientLight intensity={1.5} />
                                <spotLight position={[10, 10, 10]} intensity={20} angle={0.5} penumbra={1} />
                                <OrbitControls autoRotate enableZoom={true} />
                                <Suspense fallback={<Loader />}>
                                    <ProductModel path={selectedProduct.path} size={3} position={[0, -0.5, 0]} />
                                    <Environment preset="city" />
                                </Suspense>
                            </Canvas>
                        </div>
                    </div>
                </div>
            )}

            <Canvas camera={{ position: [0, 5, 12], fov: 45 }}>
                <color attach="background" args={['#1a1a1a']} />
                <ambientLight intensity={1.5} />
                <spotLight position={[5, 15, 5]} intensity={30} angle={0.6} penumbra={0.5} castShadow />
                <pointLight position={[-5, 5, -5]} intensity={5} color="#00ffff" />
                <OrbitControls maxPolarAngle={Math.PI / 2 - 0.1} maxDistance={20} minDistance={5} enablePan={false} />

                {/* Room Shell */}
                <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[15, 64]} />
                    <MeshReflectorMaterial
                        blur={[300, 100]}
                        resolution={1024}
                        mixBlur={1}
                        mixStrength={50}
                        roughness={0.4}
                        depthScale={1.2}
                        minDepthThreshold={0.4}
                        maxDepthThreshold={1.4}
                        color="#222"
                        metalness={0.6}
                    />
                </mesh>
                <mesh position={[0, 10, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[15, 64]} />
                    <meshStandardMaterial color="#111" />
                </mesh>
                {/* Curved Walls */}
                <mesh position={[0, 5, 0]}>
                    <cylinderGeometry args={[15, 15, 10, 32, 1, true]} />
                    <meshStandardMaterial color="#111" side={THREE.BackSide} />
                </mesh>


                {/* Pedestals */}
                <group position={[0, 0, 0]}>
                    {/* Center Product */}
                    <group position={[0, 0, 0]}>
                        <cylinderGeometry args={[1.5, 1.2, 1]} />
                        <meshStandardMaterial color="#222" roughness={0.2} metalness={0.8} />
                        <mesh position={[0, 0.51, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                            <circleGeometry args={[1.2]} />
                            <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2} toneMapped={false} />
                        </mesh>
                        <ProductModel path={TURBO_ENGINE_PATH} position={[0, 1.5, 0]} size={2} onClick={() => setSelectedProduct({ name: 'Turbo Engine X1', description: 'High performance industrial turbine engine.', path: TURBO_ENGINE_PATH })} />
                    </group>

                    {/* Left Product */}
                    <group position={[-5, 0, 2]} rotation={[0, Math.PI / 4, 0]}>
                        <cylinderGeometry args={[1, 0.8, 1]} />
                        <meshStandardMaterial color="#222" roughness={0.2} metalness={0.8} />
                        <mesh position={[0, 0.51, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                            <circleGeometry args={[0.8]} />
                            <meshStandardMaterial color="#00cccc" emissive="#00cccc" emissiveIntensity={1} toneMapped={false} />
                        </mesh>
                        <ProductModel path={PNEUMATIC_PATH} position={[0, 1.2, 0]} size={1.5} onClick={() => setSelectedProduct({ name: 'Pneumatic Control System', description: 'Precision pneumatic automation unit.', path: PNEUMATIC_PATH })} />
                    </group>

                    {/* Right Product */}
                    <group position={[5, 0, 2]} rotation={[0, -Math.PI / 4, 0]}>
                        <cylinderGeometry args={[1, 0.8, 1]} />
                        <meshStandardMaterial color="#222" roughness={0.2} metalness={0.8} />
                        <mesh position={[0, 0.51, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                            <circleGeometry args={[0.8]} />
                            <meshStandardMaterial color="#00cccc" emissive="#00cccc" emissiveIntensity={1} toneMapped={false} />
                        </mesh>
                        <ProductModel path={CRANE_PATH} position={[0, 1.2, 0]} size={3} onClick={() => setSelectedProduct({ name: 'Mobile Crane Support', description: 'Heavy lifting support infrastructure.', path: CRANE_PATH })} />
                    </group>
                </group>

                <Environment preset="warehouse" />
            </Canvas>
        </div>
    )
}

export default ShowroomView;
