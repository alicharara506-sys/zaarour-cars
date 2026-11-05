/**
 * Interactive 3D hero (lazy-loaded chunk).
 * Model: "ToyCar" from the Khronos glTF-Sample-Assets repository,
 * https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/ToyCar
 * License: CC0 (public domain dedication) per the model README — credit Guido Odendahl / Eric Chadwick.
 * It is an illustrative concept car, not an inventory vehicle.
 */
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, MeshReflectorMaterial, OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

export const MODEL_URL = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/ToyCar/glTF-Binary/ToyCar.glb';
const TARGET_LENGTH = 4.6; // world units ~ metres, realistic car length

function CarModel({ spin }: { spin: React.MutableRefObject<number> }) {
  const { scene } = useGLTF(MODEL_URL);
  const group = useRef<THREE.Group>(null);
  // Normalize arbitrary source units: scale longest horizontal side to TARGET_LENGTH, center on x/z, rest on floor.
  const model = useMemo(() => {
    const root = scene.clone(true);
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const k = TARGET_LENGTH / Math.max(size.x, size.z, 1e-6);
    root.scale.multiplyScalar(k);
    root.updateMatrixWorld(true);
    const b2 = new THREE.Box3().setFromObject(root);
    const c = b2.getCenter(new THREE.Vector3());
    root.position.x -= c.x; root.position.z -= c.z; root.position.y -= b2.min.y;
    root.traverse((o) => { if ((o as THREE.Mesh).isMesh) o.castShadow = true; });
    return root;
  }, [scene]);
  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, spin.current, 4, dt);
  });
  return <group ref={group}><primitive object={model} /></group>;
}

function CameraIntro({ onDone, skip }: { onDone: () => void; skip: boolean }) {
  const from = useMemo(() => new THREE.Vector3(-9, 5.5, 11), []);
  const to = useMemo(() => new THREE.Vector3(5.2, 1.55, 5.6), []);
  const t = useRef(skip ? 1 : 0);
  const done = useRef(false);
  useFrame((state, dt) => {
    if (done.current) return;
    t.current = Math.min(1, t.current + dt / 3.2);
    const k = 1 - Math.pow(1 - t.current, 3);
    state.camera.position.lerpVectors(from, to, k);
    state.camera.lookAt(0, 0.45, 0);
    if (t.current >= 1) { done.current = true; onDone(); }
  });
  return null;
}

function Ready({ onReady }: { onReady: () => void }) {
  useEffect(() => { onReady(); }, [onReady]);
  return null;
}

export default function HeroScene({ onReady, reduceMotion }: { onReady: () => void; reduceMotion: boolean }) {
  const spin = useRef(0);
  const [introDone, setIntroDone] = useState(false);
  return (
    <div className="absolute inset-0 outline-none" tabIndex={0} role="img" aria-label="Interactive 3D concept car in a dark showroom. Drag to orbit, or use left and right arrow keys to rotate."
      onKeyDown={(e) => { if (e.key === 'ArrowLeft') spin.current -= 0.4; if (e.key === 'ArrowRight') spin.current += 0.4; }}>
      <Canvas shadows dpr={[1, 1.6]} camera={{ position: [-9, 5.5, 11], fov: 32 }} gl={{ antialias: true, powerPreference: 'high-performance' }}>
        <color attach="background" args={['#0c0b0a']} />
        <fog attach="fog" args={['#0c0b0a', 11, 24]} />
        <ambientLight intensity={0.15} />
        <spotLight position={[0, 9, 0]} angle={0.5} penumbra={1} intensity={60} castShadow color="#fff3dc" />
        <spotLight position={[-6, 3, -4]} angle={0.6} penumbra={1} intensity={30} color="#d6b878" />
        <Suspense fallback={null}>
          <CarModel spin={spin} />
          <mesh rotation-x={-Math.PI / 2} position-y={-0.001}>
            <planeGeometry args={[60, 60]} />
            <MeshReflectorMaterial blur={[300, 80]} resolution={512} mixBlur={1} mixStrength={18} roughness={0.9} depthScale={1.1}
              minDepthThreshold={0.4} maxDepthThreshold={1.4} color="#0e0d0b" metalness={0.6} />
          </mesh>
          <ContactShadows position={[0, 0.01, 0]} opacity={0.7} scale={12} blur={2.4} far={3} />
          <Environment resolution={256} frames={1}>
            <Lightformer intensity={3} rotation-x={Math.PI / 2} position={[0, 5, -2]} scale={[10, 2, 1]} />
            <Lightformer intensity={2} rotation-x={Math.PI / 2} position={[0, 5, 2]} scale={[10, 1, 1]} />
            <Lightformer intensity={4} color="#f0dcae" rotation-y={Math.PI / 2} position={[-6, 1.5, 0]} scale={[16, 0.4, 1]} />
            <Lightformer intensity={2.5} rotation-y={-Math.PI / 2} position={[6, 1.5, 0]} scale={[16, 0.4, 1]} />
            <Lightformer form="ring" color="#d6b878" intensity={6} position={[4, 4, -8]} scale={2.5} />
          </Environment>
          <Ready onReady={onReady} />
        </Suspense>
        <CameraIntro skip={reduceMotion} onDone={() => setIntroDone(true)} />
        <OrbitControls enabled={introDone} target={[0, 0.45, 0]} enablePan={false} enableZoom={false} autoRotate={introDone && !reduceMotion} autoRotateSpeed={0.55}
          minPolarAngle={Math.PI / 3.2} maxPolarAngle={Math.PI / 2.1} enableDamping />
      </Canvas>
    </div>
  );
}
