"use client";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, ReactNode } from "react";

interface ParallaxSectionProps {
  children: ReactNode;
  className?: string;
  baseVelocity?: number;
  perspective?: boolean;
}

export const ParallaxSection = ({
  children,
  className = "",
  baseVelocity = 0.5,
  perspective = true,
}: ParallaxSectionProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Parallax movement
  const y = useTransform(scrollYProgress, [0, 1], ["0%", `${baseVelocity * 100}%`]);

  // 3D Perspective rotation
  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [8, 0, -8]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.95, 1, 0.95]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.6, 1, 1, 0.6]);

  return (
    <motion.div
      ref={ref}
      style={{
        y,
        rotateX: perspective ? rotateX : 0,
        scale: perspective ? scale : 1,
        opacity,
        transformStyle: "preserve-3d",
        transformOrigin: "center center",
      }}
      className={`will-change-transform ${className}`}
    >
      <div style={{ perspective: perspective ? "1200px" : "none" }}>{children}</div>
    </motion.div>
  );
};

interface ScrollReveal3DProps {
  children: ReactNode;
  className?: string;
  direction?: "up" | "down" | "left" | "right";
  rotateAxis?: "x" | "y" | "both";
  delay?: number;
}

export const ScrollReveal3D = ({
  children,
  className = "",
  direction = "up",
  rotateAxis = "x",
  delay = 0,
}: ScrollReveal3DProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });

  // Direction-based transforms
  const directionMap = {
    up: { initial: 80, final: 0 },
    down: { initial: -80, final: 0 },
    left: { initial: 80, final: 0 },
    right: { initial: -80, final: 0 },
  };

  const translateY = useTransform(
    scrollYProgress,
    [0, 1],
    direction === "up" || direction === "down"
      ? [directionMap[direction].initial, directionMap[direction].final]
      : [0, 0]
  );

  const translateX = useTransform(
    scrollYProgress,
    [0, 1],
    direction === "left" || direction === "right"
      ? [directionMap[direction].initial, directionMap[direction].final]
      : [0, 0]
  );

  // 3D Rotation based on axis
  const rotateXValue = useTransform(
    scrollYProgress,
    [0, 1],
    rotateAxis === "x" || rotateAxis === "both" ? [15, 0] : [0, 0]
  );

  const rotateYValue = useTransform(
    scrollYProgress,
    [0, 1],
    rotateAxis === "y" || rotateAxis === "both" ? [-10, 0] : [0, 0]
  );

  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 0.8, 1]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.9, 1]);

  return (
    <div ref={ref} style={{ perspective: "1000px" }} className={className}>
      <motion.div
        style={{
          translateY,
          translateX,
          rotateX: rotateXValue,
          rotateY: rotateYValue,
          opacity,
          scale,
          transformStyle: "preserve-3d",
        }}
        transition={{ delay }}
        className="will-change-transform"
      >
        {children}
      </motion.div>
    </div>
  );
};
