import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars } from "@react-three/drei";
import { motion } from "framer-motion";
import { AnimatedSphere } from "./AnimatedSphere";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-10 pb-8">
      <div className="absolute inset-0 z-0">
        <Canvas>
          <Suspense fallback={null}>
            <OrbitControls
              enableZoom={false}
              autoRotate
              autoRotateSpeed={0.2}
              maxPolarAngle={Math.PI / 2}
              minPolarAngle={Math.PI / 2}
            />
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} color="#8b5cf6" />
            <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#f59e0b" />
            <AnimatedSphere />
            <Stars
              radius={200}
              depth={50}
              count={2000}
              factor={4}
              saturation={0}
              fade
              speed={0.5}
            />
          </Suspense>
        </Canvas>
      </div>

      <div className="absolute inset-0 bg-gradient-to-tr from-background via-background/80 to-transparent z-0 pointer-events-none" />

      <div className="relative z-10 container mx-auto px-6 md:px-12">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start pt-0">
          {/* Left Column: Brand Statement */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="text-left lg:pt-0"
          >
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tighter text-white leading-[0.95] mb-8">
              Building Software, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-secondary">
                Autonomously.
              </span>
            </h1>

            <p className="text-lg md:text-xl font-light text-text-secondary max-w-xl leading-relaxed">
              The world's first agentic swarm for end-to-end development.
              <span className="block text-white font-normal mt-2">
                Just state your intent. We handle the code.
              </span>
            </p>
          </motion.div>

          {/* Right Column: Compact Steps */}
          <div className="flex flex-col gap-8 lg:pl-32 lg:pt-20">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="flex items-baseline gap-6"
            >
              <span className="text-2xl font-mono text-accent-secondary opacity-80">01.</span>
              <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-white leading-[0.9]">
                Add task
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="flex items-baseline gap-6"
            >
              <span className="text-2xl font-mono text-text-muted opacity-40">02.</span>
              <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-text-secondary leading-[0.9] blur-[1px] hover:blur-0 transition-all duration-500">
                Leave
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="flex flex-col gap-2 pt-4"
            >
              <div className="flex items-center gap-4 mb-2">
                <span className="text-xl font-mono text-accent-primary">03.</span>
                <span className="text-sm font-mono text-accent-primary uppercase tracking-widest">
                  System Output
                </span>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-white leading-tight">
                We <span className="text-accent-primary">Plan</span>,{" "}
                <span className="text-accent-secondary">Execute</span>, and{" "}
                <span className="text-accent-tertiary">Deploy</span>.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
