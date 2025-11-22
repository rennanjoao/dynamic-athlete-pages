import React, { useRef, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, PresentationControls } from "@react-three/drei";
import * as THREE from "three";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface AvatarModelProps {
  modelPath: string;
  hairScale: number;
  shirtColor: string;
  shortsColor: string;
  onLoadedNames?: (info: any) => void;
}

function AvatarModel({ modelPath, hairScale, shirtColor, shortsColor, onLoadedNames }: AvatarModelProps) {
  const group = useRef<THREE.Group>(null);
  const { scene } = useGLTF(modelPath);
  const headRef = useRef<THREE.Object3D | null>(null);
  const hairRef = useRef<THREE.Object3D | null>(null);
  const shirtRef = useRef<THREE.Mesh | null>(null);
  const shortsRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    if (onLoadedNames) onLoadedNames({ scene });
  }, [scene, onLoadedNames]);

  useEffect(() => {
    if (hairRef.current) hairRef.current.scale.setScalar(hairScale);
  }, [hairScale]);

  useEffect(() => {
    if (shirtRef.current && shirtRef.current.material) {
      (shirtRef.current.material as THREE.MeshStandardMaterial).color.set(shirtColor);
    }
  }, [shirtColor]);

  useEffect(() => {
    if (shortsRef.current && shortsRef.current.material) {
      (shortsRef.current.material as THREE.MeshStandardMaterial).color.set(shortsColor);
    }
  }, [shortsColor]);

  useEffect(() => {
    if (!group.current) return;
    const head = group.current.getObjectByName("Head");
    const hair = group.current.getObjectByName("Hair");
    const shirt = group.current.getObjectByName("Shirt");
    const shorts = group.current.getObjectByName("Shorts");

    if (head) headRef.current = head;
    if (hair) hairRef.current = hair;
    if (shirt) shirtRef.current = shirt as THREE.Mesh;
    if (shorts) shortsRef.current = shorts as THREE.Mesh;

    if (shortsRef.current) shortsRef.current.scale.multiplyScalar(1.06);
  }, [scene]);

  return <primitive ref={group} object={scene} dispose={null} />;
}

function LookAtMouse({ headName = "Head" }: { headName?: string }) {
  useFrame((state) => {
    const scene = state.scene;
    const headMesh = scene.getObjectByName(headName);
    if (!headMesh) return;

    const x = state.pointer.x;
    const y = state.pointer.y;

    const vector = new THREE.Vector3(x, y, 0.5);
    vector.unproject(state.camera);

    headMesh.lookAt(vector);
  });

  return null;
}

interface StudentAvatar3DProps {
  modelPath?: string;
  initialShirt?: string;
  initialShorts?: string;
  initialHairScale?: number;
}

export default function StudentAvatar3D({
  modelPath = "/models/avatar.glb",
  initialShirt = "#1565c0",
  initialShorts = "#3949ab",
  initialHairScale = 1,
}: StudentAvatar3DProps) {
  const [shirtColor, setShirtColor] = useState(initialShirt);
  const [shortsColor, setShortsColor] = useState(initialShorts);
  const [hairScale, setHairScale] = useState(initialHairScale);
  const [modelError, setModelError] = useState(false);

  useEffect(() => {
    // Check if model file exists
    fetch(modelPath, { method: 'HEAD' })
      .catch(() => setModelError(true));
  }, [modelPath]);

  if (modelError) {
    return (
      <Card className="p-8 text-center space-y-4">
        <div className="text-6xl">🎮</div>
        <h3 className="text-xl font-semibold">Modelo 3D não encontrado</h3>
        <p className="text-muted-foreground">
          Para usar o avatar 3D interativo, adicione um arquivo GLB/GLTF em:
        </p>
        <code className="block bg-muted p-2 rounded text-sm">
          /public/models/avatar.glb
        </code>
        <p className="text-sm text-muted-foreground">
          O modelo deve conter meshes nomeadas: Head, Hair, Shirt, Shorts
        </p>
      </Card>
    );
  }

  return (
    <div className="w-full h-[600px] relative">
      <Canvas camera={{ position: [0, 1.6, 3], fov: 50 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 10, 7]} intensity={1} />

        <PresentationControls
          global={false}
          polar={[-0.2, Math.PI / 2]}
          azimuth={[-Math.PI / 4, Math.PI / 4]}
          config={{ mass: 2, tension: 200 }}
          snap={{ mass: 4, tension: 400 }}
        >
          <Suspense fallback={null}>
            <AvatarModel
              modelPath={modelPath}
              hairScale={hairScale}
              shirtColor={shirtColor}
              shortsColor={shortsColor}
            />
          </Suspense>
        </PresentationControls>

        <OrbitControls enablePan={false} enableZoom={true} minDistance={1.6} maxDistance={6} />
        <LookAtMouse headName="Head" />
      </Canvas>

      <Card className="absolute right-4 top-4 bg-background/95 backdrop-blur p-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="shirt-color" className="text-sm">Cor da camiseta</Label>
          <input
            id="shirt-color"
            type="color"
            value={shirtColor}
            onChange={(e) => setShirtColor(e.target.value)}
            className="w-full h-10 rounded cursor-pointer"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="shorts-color" className="text-sm">Cor da bermuda</Label>
          <input
            id="shorts-color"
            type="color"
            value={shortsColor}
            onChange={(e) => setShortsColor(e.target.value)}
            className="w-full h-10 rounded cursor-pointer"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hair-scale" className="text-sm">
            Tamanho do cabelo: {hairScale.toFixed(2)}
          </Label>
          <Slider
            id="hair-scale"
            min={0.6}
            max={1.8}
            step={0.01}
            value={[hairScale]}
            onValueChange={(values) => setHairScale(values[0])}
          />
        </div>

        <p className="text-xs text-muted-foreground">
          Dica: arraste com o mouse para girar. Use a roda para dar zoom.
        </p>
      </Card>
    </div>
  );
}
