import { Sphere, MeshDistortMaterial } from "@react-three/drei";

export const AnimatedSphere = () => {
  return (
    <Sphere visible args={[1, 100, 200]} scale={2.5}>
      <MeshDistortMaterial
        color="#8b5cf6"
        attach="material"
        distort={0.4}
        speed={2}
        roughness={0.4}
        metalness={0.1}
        emissive="#5b21b6"
        emissiveIntensity={0.5}
      />
    </Sphere>
  );
};
