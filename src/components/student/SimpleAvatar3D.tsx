import React, { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface SimpleAvatar3DProps {
  initialShirtColor?: string;
  initialShortsColor?: string;
  initialShoeColor?: string;
  initialShoeAccentColor?: string;
}

function Avatar({ shirtColor, shortsColor, shoeColor, shoeAccentColor }: {
  shirtColor: string;
  shortsColor: string;
  shoeColor: string;
  shoeAccentColor: string;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={[0, -1.5, 0]}>
      {/* Cabeça */}
      <mesh position={[0, 2, 0]} castShadow>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial color="#f5d0b0" />
      </mesh>

      {/* Corpo (Camiseta) */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[0.8, 0.9, 0.5]} />
        <meshStandardMaterial color={shirtColor} />
      </mesh>

      {/* Braço Esquerdo */}
      <mesh position={[-0.5, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.8, 16]} />
        <meshStandardMaterial color={shirtColor} />
      </mesh>

      {/* Braço Direito */}
      <mesh position={[0.5, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.8, 16]} />
        <meshStandardMaterial color={shirtColor} />
      </mesh>

      {/* Bermuda/Shorts */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[0.8, 0.6, 0.5]} />
        <meshStandardMaterial color={shortsColor} />
      </mesh>

      {/* Perna Esquerda */}
      <mesh position={[-0.2, -0.3, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 1, 16]} />
        <meshStandardMaterial color="#f5d0b0" />
      </mesh>

      {/* Perna Direita */}
      <mesh position={[0.2, -0.3, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 1, 16]} />
        <meshStandardMaterial color="#f5d0b0" />
      </mesh>

      {/* TÊNIS ESQUERDO - Base */}
      <mesh position={[-0.2, -0.9, 0.1]} castShadow>
        <boxGeometry args={[0.25, 0.15, 0.4]} />
        <meshStandardMaterial color={shoeColor} />
      </mesh>

      {/* TÊNIS ESQUERDO - Swoosh Nike (detalhe) */}
      <mesh position={[-0.25, -0.85, 0.15]} castShadow rotation={[0, 0, -0.3]}>
        <boxGeometry args={[0.15, 0.03, 0.02]} />
        <meshStandardMaterial color={shoeAccentColor} />
      </mesh>

      {/* TÊNIS ESQUERDO - Sola */}
      <mesh position={[-0.2, -0.98, 0.1]} castShadow>
        <boxGeometry args={[0.26, 0.04, 0.42]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>

      {/* TÊNIS DIREITO - Base */}
      <mesh position={[0.2, -0.9, 0.1]} castShadow>
        <boxGeometry args={[0.25, 0.15, 0.4]} />
        <meshStandardMaterial color={shoeColor} />
      </mesh>

      {/* TÊNIS DIREITO - Swoosh Nike (detalhe) */}
      <mesh position={[0.25, -0.85, 0.15]} castShadow rotation={[0, 0, 0.3]}>
        <boxGeometry args={[0.15, 0.03, 0.02]} />
        <meshStandardMaterial color={shoeAccentColor} />
      </mesh>

      {/* TÊNIS DIREITO - Sola */}
      <mesh position={[0.2, -0.98, 0.1]} castShadow>
        <boxGeometry args={[0.26, 0.04, 0.42]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
    </group>
  );
}

export default function SimpleAvatar3D({
  initialShirtColor = "#1565c0",
  initialShortsColor = "#3949ab",
  initialShoeColor = "#000000",
  initialShoeAccentColor = "#FF0000",
}: SimpleAvatar3DProps) {
  const [shirtColor, setShirtColor] = useState(initialShirtColor);
  const [shortsColor, setShortsColor] = useState(initialShortsColor);
  const [shoeColor, setShoeColor] = useState(initialShoeColor);
  const [shoeAccentColor, setShoeAccentColor] = useState(initialShoeAccentColor);

  return (
    <div className="w-full h-[600px] relative">
      <Canvas camera={{ position: [0, 0, 4], fov: 50 }} shadows>
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <pointLight position={[-5, 3, -5]} intensity={0.5} />

        <Avatar
          shirtColor={shirtColor}
          shortsColor={shortsColor}
          shoeColor={shoeColor}
          shoeAccentColor={shoeAccentColor}
        />

        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={2}
          maxDistance={8}
          maxPolarAngle={Math.PI / 2}
        />
      </Canvas>

      <Card className="absolute right-4 top-4 bg-background/95 backdrop-blur p-4 space-y-4 max-w-xs">
        <h3 className="font-semibold text-sm">Personalize seu Avatar</h3>
        
        <div className="space-y-2">
          <Label htmlFor="shirt-color" className="text-sm">Cor da Camiseta</Label>
          <input
            id="shirt-color"
            type="color"
            value={shirtColor}
            onChange={(e) => setShirtColor(e.target.value)}
            className="w-full h-10 rounded cursor-pointer"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="shorts-color" className="text-sm">Cor da Bermuda</Label>
          <input
            id="shorts-color"
            type="color"
            value={shortsColor}
            onChange={(e) => setShortsColor(e.target.value)}
            className="w-full h-10 rounded cursor-pointer"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="shoe-color" className="text-sm">Cor do Tênis Nike</Label>
          <input
            id="shoe-color"
            type="color"
            value={shoeColor}
            onChange={(e) => setShoeColor(e.target.value)}
            className="w-full h-10 rounded cursor-pointer"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="shoe-accent" className="text-sm">Cor do Swoosh Nike</Label>
          <input
            id="shoe-accent"
            type="color"
            value={shoeAccentColor}
            onChange={(e) => setShoeAccentColor(e.target.value)}
            className="w-full h-10 rounded cursor-pointer"
          />
        </div>

        <p className="text-xs text-muted-foreground">
          Arraste para girar • Scroll para zoom
        </p>
      </Card>
    </div>
  );
}
