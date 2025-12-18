import { motion, useMotionValue, useSpring, useTransform, useScroll } from "framer-motion";
import { Play, Activity, CheckCircle2, Terminal, Cpu } from "lucide-react";
import { SparklesCore } from "../ui/sparkles";
import { GlowingEffect } from "../ui/glowing-effect";
import { ShootingStars } from "../ui/shooting-stars";
import { StarsBackground } from "../ui/stars-background";
import { useRef } from "react";

export const VideoDemo = () => {
  // Reference for scroll tracking on the video box
  const videoBoxRef = useRef<HTMLDivElement>(null);

  // Scroll progress for the video box
  const { scrollYProgress } = useScroll({
    target: videoBoxRef,
    offset: ["start end", "center center"],
  });

  // Scroll-based 3D transforms
  const scrollRotateX = useTransform(scrollYProgress, [0, 1], [25, 0]);
  const scrollScale = useTransform(scrollYProgress, [0, 1], [0.85, 1]);
  const scrollOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.3, 0.8, 1]);

  // Mouse tilt effect logic
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 15 });

  const mouseTiltX = useTransform(mouseY, [-0.5, 0.5], [5, -5]);
  const mouseTiltY = useTransform(mouseX, [-0.5, 0.5], [-5, 5]);

  function handleMouseMove({ clientX, clientY, currentTarget }: React.MouseEvent) {
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const xPct = (clientX - left) / width - 0.5;
    const yPct = (clientY - top) / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <section id="video-demo" className="relative py-16 pb-24 bg-black">
      {/* Background Sparkles */}
      <div className="absolute inset-0 z-0">
        <SparklesCore
          id="tsparticlesfullpage"
          background="transparent"
          minSize={0.6}
          maxSize={1.4}
          particleDensity={40}
          className="w-full h-full"
          particleColor="#FFFFFF"
        />
      </div>

      {/* Twinkling Stars Canvas */}
      <StarsBackground
        starDensity={0.00015}
        allStarsTwinkle={true}
        twinkleProbability={0.7}
        className="z-0"
      />

      {/* Shooting Stars */}
      <ShootingStars
        starColor="#f59e0b"
        trailColor="#8b5cf6"
        minSpeed={12}
        maxSpeed={28}
        minDelay={2500}
        maxDelay={6000}
        className="z-0"
      />

      {/* Gradient Overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black z-10 pointer-events-none opacity-60" />

      <div className="container mx-auto px-4 pb-8 relative z-20">
        <div className="text-center mb-16 flex flex-col items-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-bold text-white mb-2"
          >
            See it in{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary to-accent-secondary">
              Action
            </span>
          </motion.h2>

          {/* Aceternity Gradient Beam Effect */}
          <div className="w-[40rem] h-24 relative hidden md:block mt-[-10px]">
            {/* Gradients */}
            <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-[2px] w-3/4 blur-sm" />
            <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-px w-3/4" />
            <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-[5px] w-1/4 blur-sm" />
            <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-sky-500 to-transparent h-px w-1/4" />

            {/* Core component */}
            <SparklesCore
              background="transparent"
              minSize={0.4}
              maxSize={1}
              particleDensity={1200}
              className="w-full h-full"
              particleColor="#FFFFFF"
            />

            {/* Radial Gradient to prevent sharp edges */}
            <div className="absolute inset-0 w-full h-full bg-black [mask-image:radial-gradient(350px_200px_at_top,transparent_20%,white)]"></div>
          </div>

          <p className="text-text-secondary max-w-xl mx-auto md:-mt-16 relative z-20">
            Watch our agentic swarm autonomously plan, code, and deploy a full-stack application in
            real-time.
          </p>
        </div>

        {/* 3D Tilt Container with Scroll + Mouse Perspective */}
        <div
          ref={videoBoxRef}
          style={{ perspective: "1200px" }}
          className="relative max-w-5xl mx-auto"
        >
          <motion.div
            style={{
              rotateX: scrollRotateX,
              scale: scrollScale,
              opacity: scrollOpacity,
              transformStyle: "preserve-3d",
            }}
            className="will-change-transform"
          >
            <motion.div
              style={{
                rotateX: mouseTiltX,
                rotateY: mouseTiltY,
                transformStyle: "preserve-3d",
              }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="relative"
            >
              {/* Main Video Interface with GlowingEffect */}
              <div className="relative rounded-2xl border border-white/10 p-1">
                <GlowingEffect
                  spread={80}
                  glow={true}
                  disabled={false}
                  proximity={100}
                  inactiveZone={0.01}
                  borderWidth={3}
                />
                <div className="relative bg-[#1a1a1a]/80 backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden group">
                  <div className="relative aspect-video bg-black/50 overflow-hidden">
                    {/* Terminal overlay effect */}
                    <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-20 pointer-events-none" />

                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-20 h-20 bg-accent-primary/90 hover:bg-accent-primary rounded-full flex items-center justify-center backdrop-blur-md shadow-lg shadow-accent-primary/30 group-hover:shadow-accent-primary/50 transition-all"
                      >
                        <Play className="w-8 h-8 text-white ml-1 fill-white" />
                      </motion.button>
                    </div>
                  </div>

                  {/* Bottom Dashboard Bar */}
                  <div className="h-14 bg-white/5 border-t border-white/10 flex items-center justify-between px-6">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-xs font-mono text-green-400">
                        <Activity className="w-4 h-4" />
                        <span>SYSTEM ONLINE</span>
                      </div>
                      <div className="h-4 w-px bg-white/10" />
                      <div className="flex items-center gap-2 text-xs font-mono text-accent-secondary">
                        <Cpu className="w-4 h-4" />
                        <span>AGENTS: 5 ACTIVE</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-xs font-mono text-text-muted">LIVE PREVIEW</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Modules - "Looking like separate parts" */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -right-12 -top-12 hidden lg:block"
              >
                <div className="bg-[#0f0f0f]/90 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-xl w-48">
                  <div className="flex items-center gap-2 mb-2 text-accent-primary">
                    <Terminal className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Terminal</span>
                  </div>
                  <div className="space-y-1">
                    <div className="h-1.5 w-full bg-white/10 rounded-full" />
                    <div className="h-1.5 w-3/4 bg-white/10 rounded-full" />
                    <div className="h-1.5 w-1/2 bg-white/10 rounded-full" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -left-12 -bottom-8 hidden lg:block"
              >
                <div className="bg-[#0f0f0f]/90 backdrop-blur-xl border border-white/10 p-4 rounded-xl shadow-xl w-44">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="p-1.5 bg-green-500/20 rounded-lg">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs text-white font-medium">Build Success</p>
                      <p className="text-[10px] text-text-muted">24ms ago</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
