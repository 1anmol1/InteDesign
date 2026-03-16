import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Float } from '@react-three/drei';
import { useRef, Suspense } from 'react';
import * as THREE from 'three';

function ArchitecturalStructure({ position, color, speed, rotationSpeed }) {
    const mesh = useRef();

    useFrame((state, delta) => {
        mesh.current.rotation.x += delta * rotationSpeed;
        mesh.current.rotation.y += delta * rotationSpeed * 0.5;
    });

    return (
        <Float speed={speed} rotationIntensity={0.5} floatIntensity={0.5} position={position}>
            <mesh ref={mesh}>
                <icosahedronGeometry args={[1.5, 0]} />
                <meshStandardMaterial
                    color={color}
                    wireframe
                    transparent
                    opacity={0.3}
                    side={THREE.DoubleSide}
                />
            </mesh>
            <mesh ref={mesh} scale={0.98}>
                <icosahedronGeometry args={[1.5, 0]} />
                <meshStandardMaterial color="black" transparent opacity={0.8} />
            </mesh>
        </Float>
    );
}

function GridPlane() {
    return (
        <gridHelper args={[50, 50, 0x444444, 0x222222]} position={[0, -5, 0]} rotation={[0, 0, 0]} />
    );
}

const Scene = () => {
    return (
        <div className="absolute inset-0 -z-10 bg-[#000000]">
            <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
                <Suspense fallback={null}>
                    <fog attach="fog" args={['#000000', 5, 20]} />
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[10, 10, 5]} intensity={1} />

                    <ArchitecturalStructure position={[-3, 2, -2]} color="#ffffff" speed={1} rotationSpeed={0.1} />
                    <ArchitecturalStructure position={[3, -1, -5]} color="#aaaaaa" speed={1.5} rotationSpeed={0.05} />
                    <ArchitecturalStructure position={[0, 0, -8]} color="#444444" speed={0.5} rotationSpeed={0.02} />

                    <Stars radius={100} depth={50} count={1000} factor={4} saturation={0} fade speed={0.5} />
                    <GridPlane />

                    <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.3} />
                </Suspense>
            </Canvas>
        </div>
    );
};

export default Scene;
