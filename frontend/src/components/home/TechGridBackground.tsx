import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export const TechGridBackground = () => {
  const planeRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (planeRef.current) {
      // Move the plane towards camera to simulate movement
      planeRef.current.position.z = (state.clock.elapsedTime * 0.5) % 2;
    }
  });

  return (
    <group rotation={[Math.PI / 2.5, 0, 0]} position={[0, -5, -10]}>
      {/* Main Moving Grid */}
      <mesh ref={planeRef} position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 100, 40, 40]} />
        <meshBasicMaterial
          color="#4F46E5"
          wireframe
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Fog for depth fading */}
      <fog attach="fog" args={["#000000", 5, 30]} />
    </group>
  );
};
