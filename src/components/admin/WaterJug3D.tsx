import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

interface WaterJug3DProps {
  waterAmountLiters: number;
  className?: string;
}

function Jug({ fillLevel }: { fillLevel: number }) {
  const jugRef = useRef<THREE.Group>(null);
  const waterRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (jugRef.current) {
      jugRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
    if (waterRef.current) {
      waterRef.current.position.y = -1.5 + fillLevel * 3;
    }
  });

  return (
    <group ref={jugRef}>
      {/* Jug Body */}
      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[1, 1.2, 3, 32]} />
        <meshPhysicalMaterial
          color="#e0e0e0"
          transparent
          opacity={0.3}
          roughness={0.1}
          metalness={0.1}
          transmission={0.95}
          thickness={0.5}
        />
      </mesh>

      {/* Jug Neck */}
      <mesh position={[0, 1.8, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.4, 0.6, 32]} />
        <meshPhysicalMaterial
          color="#e0e0e0"
          transparent
          opacity={0.3}
          roughness={0.1}
          metalness={0.1}
          transmission={0.95}
          thickness={0.5}
        />
      </mesh>

      {/* Jug Cap */}
      <mesh position={[0, 2.3, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.35, 0.4, 32]} />
        <meshStandardMaterial color="#4A90E2" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Handle */}
      <mesh position={[1.1, 0.5, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <torusGeometry args={[0.6, 0.1, 16, 32, Math.PI]} />
        <meshStandardMaterial color="#4A90E2" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Water */}
      <mesh ref={waterRef} position={[0, -1.5, 0]} receiveShadow>
        <cylinderGeometry args={[0.95, 1.15, fillLevel * 3, 32]} />
        <meshPhysicalMaterial
          color="#4A90E2"
          transparent
          opacity={0.6}
          roughness={0.1}
          metalness={0.1}
          transmission={0.8}
        />
      </mesh>

      {/* Water Surface */}
      <mesh position={[0, -1.5 + fillLevel * 3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.95 + (fillLevel * 0.2), 32]} />
        <meshPhysicalMaterial
          color="#4A90E2"
          transparent
          opacity={0.8}
          roughness={0.05}
          metalness={0.2}
        />
      </mesh>
    </group>
  );
}

export const WaterJug3D = ({ waterAmountLiters, className = "" }: WaterJug3DProps) => {
  const maxLiters = 10;
  const fillLevel = Math.min(waterAmountLiters / maxLiters, 1);

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className="w-64 h-64 bg-gradient-to-b from-background to-muted rounded-lg">
        <Canvas
          shadows
          camera={{ position: [3, 2, 5], fov: 50 }}
          gl={{ antialias: true, alpha: true }}
        >
          <color attach="background" args={["transparent"]} />
          
          {/* Lighting */}
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[5, 5, 5]}
            intensity={1}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <pointLight position={[-5, 5, -5]} intensity={0.5} />
          
          {/* 3D Jug */}
          <Jug fillLevel={fillLevel} />
          
          {/* Controls */}
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 2}
          />
        </Canvas>
      </div>
      
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">
          {waterAmountLiters.toFixed(1)} L
        </p>
        <p className="text-xs text-muted-foreground">
          {(fillLevel * 100).toFixed(0)}% de 10 L
        </p>
      </div>
    </div>
  );
};
