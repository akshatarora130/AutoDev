import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { motion } from "framer-motion";
import { GalaxyBackground } from "./GalaxyBackground";
import { TypingText } from "./TypingText";
import { HeroInput } from "./HeroInput";
import { GlowingEffect } from "../ui/glowing-effect";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-20 pb-20 bg-black">
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 4, 21], fov: 60 }} gl={{ antialias: true }}>
          <Suspense fallback={null}>
            <OrbitControls enableZoom={false} enablePan={false} enableDamping autoRotate={false} />
            <GalaxyBackground />
          </Suspense>
        </Canvas>
      </div>

      {/* Gradient Overlay for better text contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-background/90 z-0 pointer-events-none" />

      <div className="relative z-10 container mx-auto px-6 md:px-12 flex flex-col items-center text-center">
        {/* Main Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-12 max-w-4xl"
        >
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white leading-[0.95] mb-6">
            Building Software, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary via-accent-secondary to-accent-primary bg-300% animate-shimmer">
              <TypingText text="Autonomously." />
            </span>
          </h1>

          <p className="text-xl md:text-2xl font-light text-text-secondary max-w-2xl mx-auto leading-relaxed mb-8">
            Just state your intent. we handle the code.
          </p>

          {/* AI Input Simulation */}
          <HeroInput />
        </motion.div>

        {/* Feature Steps - With Glowing Effect */}
        <div className="grid md:grid-cols-3 gap-6 mt-12 w-full max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="relative rounded-2xl border border-white/10 p-1"
          >
            <GlowingEffect
              spread={40}
              glow={true}
              disabled={false}
              proximity={64}
              inactiveZone={0.01}
              borderWidth={2}
            />
            <div className="relative glass p-6 rounded-xl text-left hover:bg-white/10 transition-colors group cursor-default h-full">
              <span className="text-4xl font-mono text-accent-secondary/80 mb-4 block">01.</span>
              <h3 className="text-2xl font-bold text-white mb-2">Add task</h3>
              <p className="text-text-muted text-sm">
                Describe your feature or bug fix in plain English. No complex specs needed.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="relative rounded-2xl border border-white/10 p-1"
          >
            <GlowingEffect
              spread={40}
              glow={true}
              disabled={false}
              proximity={64}
              inactiveZone={0.01}
              borderWidth={2}
            />
            <div className="relative glass p-6 rounded-xl text-left hover:bg-white/10 transition-colors group cursor-default h-full">
              <span className="text-4xl font-mono text-text-muted/40 mb-4 block group-hover:text-text-muted/60 transition-colors">
                02.
              </span>
              <h3 className="text-2xl font-bold text-white/90 blur-[0.5px] group-hover:blur-0 transition-all duration-300 mb-2">
                Leave
              </h3>
              <p className="text-text-muted text-sm">
                Our agents plan, write, and verify code independently.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="relative rounded-2xl border border-white/10 p-1"
          >
            <GlowingEffect
              spread={40}
              glow={true}
              disabled={false}
              proximity={64}
              inactiveZone={0.01}
              borderWidth={2}
            />
            <div className="relative glass p-6 rounded-xl text-left hover:bg-white/10 transition-colors group cursor-default h-full">
              <span className="text-4xl font-mono text-accent-primary mb-4 block">03.</span>
              <h3 className="text-2xl font-bold text-white mb-2">System Output</h3>
              <p className="text-text-muted text-sm">
                We <span className="text-accent-primary font-semibold">Plan</span>,{" "}
                <span className="text-accent-secondary font-semibold">Execute</span>, and{" "}
                <span className="text-accent-tertiary font-semibold">Deploy</span> production-ready
                code.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
