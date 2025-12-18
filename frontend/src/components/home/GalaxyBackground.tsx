import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const GalaxyPoints = () => {
  const pointsRef = useRef<THREE.Points>(null);

  // Create geometry with particles
  const { geometry, material, uniforms } = useMemo(() => {
    const sizes: number[] = [];
    const shift: number[] = [];
    const pts: THREE.Vector3[] = [];

    const pushShift = () => {
      shift.push(
        Math.random() * Math.PI,
        Math.random() * Math.PI * 2,
        (Math.random() * 0.9 + 0.1) * Math.PI * 0.1,
        Math.random() * 0.9 + 0.1
      );
    };

    // Create 50000 points in sphere
    for (let i = 0; i < 50000; i++) {
      sizes.push(Math.random() * 1.5 + 0.5);
      pushShift();
      pts.push(new THREE.Vector3().randomDirection().multiplyScalar(Math.random() * 0.5 + 9.5));
    }

    // Create 100000 points in disk
    for (let i = 0; i < 100000; i++) {
      const r = 10;
      const R = 40;
      const rand = Math.pow(Math.random(), 1.5);
      const radius = Math.sqrt(R * R * rand + (1 - rand) * r * r);
      pts.push(
        new THREE.Vector3().setFromCylindricalCoords(
          radius,
          Math.random() * 2 * Math.PI,
          (Math.random() - 0.5) * 2
        )
      );
      sizes.push(Math.random() * 1.5 + 0.5);
      pushShift();
    }

    const g = new THREE.BufferGeometry().setFromPoints(pts);
    g.setAttribute("sizes", new THREE.Float32BufferAttribute(sizes, 1));
    g.setAttribute("shift", new THREE.Float32BufferAttribute(shift, 4));

    const gu = {
      time: { value: 0 },
    };

    // Improved shader with violet/gold colors matching app theme
    const vertexShader = `
      uniform float time;
      attribute float sizes;
      attribute vec4 shift;
      varying vec3 vColor;
      
      void main() {
        vec3 transformed = position;
        
        // Color calculation - using app accent colors (violet #8b5cf6, gold #f59e0b)
        float d = length(abs(position) / vec3(40., 10., 40.));
        d = clamp(d, 0., 1.);
        // Core: Electric Violet (139, 92, 246), Outer: Amber/Gold (245, 158, 11)
        vColor = mix(vec3(245., 158., 11.), vec3(139., 92., 246.), d) / 255.;
        
        // Animation
        float t = time;
        float moveT = mod(shift.x + shift.z * t, 6.28318530718);
        float moveS = mod(shift.y + shift.z * t, 6.28318530718);
        transformed += vec3(cos(moveS) * sin(moveT), cos(moveT), sin(moveS) * sin(moveT)) * shift.w;
        
        vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);
        gl_PointSize = 0.15 * sizes * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const fragmentShader = `
      varying vec3 vColor;
      
      void main() {
        float d = length(gl_PointCoord.xy - 0.5);
        float alpha = smoothstep(0.5, 0.05, d);
        
        if (alpha < 0.01) discard;
        
        gl_FragColor = vec4(vColor, alpha * 0.9);
      }
    `;

    const m = new THREE.ShaderMaterial({
      uniforms: gu,
      vertexShader,
      fragmentShader,
      transparent: true,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });

    return { geometry: g, material: m, uniforms: gu };
  }, []);

  // Animation loop
  useFrame((state) => {
    const t = state.clock.getElapsedTime() * 0.5;
    uniforms.time.value = t * Math.PI;
    if (pointsRef.current) {
      pointsRef.current.rotation.y = t * 0.05;
    }
  });

  return <points ref={pointsRef} geometry={geometry} material={material} rotation={[0, 0, 0.2]} />;
};

export const GalaxyBackground = () => {
  return (
    <>
      {/* Solid glassy black background */}
      <color attach="background" args={["#0f0f0f"]} />
      <GalaxyPoints />
    </>
  );
};
