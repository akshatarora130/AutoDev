"use client";
import React, { useId, useMemo, useEffect, useState, useRef } from "react";
import { motion, useAnimation } from "framer-motion";

type SparklesCoreProps = {
  id?: string;
  background?: string;
  minSize?: number;
  maxSize?: number;
  speed?: number;
  particleColor?: string;
  particleDensity?: number;
  className?: string;
};

export const SparklesCore = ({
  id,
  background = "transparent",
  minSize = 0.4,
  maxSize = 1,
  speed = 1,
  particleColor = "#FFF",
  particleDensity = 100,
  className,
}: SparklesCoreProps) => {
  const [isReady, setIsReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const uniqueId = id || generatedId;

  useEffect(() => {
    setIsReady(true);
  }, []);

  const particles = useMemo(() => {
    return Array.from({ length: particleDensity }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * (maxSize - minSize) + minSize,
      duration: (Math.random() * 2 + 1) / speed,
      delay: Math.random() * 2,
    }));
  }, [particleDensity, minSize, maxSize, speed]);

  if (!isReady) {
    return <div ref={containerRef} className={className} style={{ background }} />;
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ background, position: "relative", overflow: "hidden" }}
    >
      {particles.map((particle) => (
        <motion.span
          key={`${uniqueId}-${particle.id}`}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: particleColor,
          }}
          animate={{
            opacity: [0, 1, 0.5, 1, 0],
            scale: [0, 1, 1.2, 1, 0],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

export default SparklesCore;
