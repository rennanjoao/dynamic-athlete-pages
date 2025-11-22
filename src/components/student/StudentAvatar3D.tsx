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
  const [modelLoading, setModelLoading] = useState(true);

  useEffect(() => {
    // Check if model file exists
    setModelLoading(true);
    fetch(modelPath, { method: 'HEAD' })
      .then(response => {
        if (!response.ok) {
          setModelError(true);
        }
        setModelLoading(false);
      })
      .catch(() => {
        setModelError(true);
        setModelLoading(false);
      });
  }, [modelPath]);

  if (modelLoading) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">Verificando modelo 3D...</p>
      </Card>
    );
  }

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

  // Only render Canvas after we've confirmed the model exists
  return (
    <div className="w-full h-[600px] relative">
      <Card className="p-8 text-center space-y-4">
        <div className="text-6xl">🎮</div>
        <h3 className="text-xl font-semibold">Avatar 3D Interativo</h3>
        <p className="text-muted-foreground">
          Este recurso requer um modelo 3D. Para ativá-lo, adicione um arquivo GLB/GLTF em:
        </p>
        <code className="block bg-muted p-2 rounded text-sm">
          /public/models/avatar.glb
        </code>
        <div className="text-left space-y-2 text-sm text-muted-foreground">
          <p><strong>Onde encontrar modelos 3D gratuitos:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Ready Player Me - avatares personalizáveis</li>
            <li>Mixamo - modelos humanoides rigged</li>
            <li>Sketchfab - biblioteca com filtro "downloadable"</li>
          </ul>
          <p className="mt-4"><strong>Requisitos do modelo:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>Formato: GLB ou GLTF</li>
            <li>Meshes nomeadas: Head, Hair, Shirt, Shorts</li>
          </ul>
        </div>
      </Card>
    </div>
  );
}
