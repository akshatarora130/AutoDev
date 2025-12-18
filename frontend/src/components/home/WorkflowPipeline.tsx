import { motion } from "framer-motion";
import {
  Brain,
  Workflow,
  GitBranch,
  Code2,
  Shield,
  Server,
  ArrowDown,
  ShieldCheck,
} from "lucide-react";
import { GlowingEffect } from "../ui/glowing-effect";
import { SparklesCore } from "../ui/sparkles";
import { ShootingStars } from "../ui/shooting-stars";
import { StarsBackground } from "../ui/stars-background";

const steps = [
  {
    id: "01",
    title: "Task Divider",
    description: "Breaks user stories into atomic subtasks with dependency graphs.",
    icon: Brain,
    phase: "PHASE 1",
    color: "from-violet-500 to-purple-600",
    textColor: "text-violet-400",
    dotColor: "bg-violet-500",
  },
  {
    id: "02",
    title: "Task Reviewer",
    description: "Recursively validates and subdivides complex tasks.",
    icon: Workflow,
    phase: "PHASE 2",
    color: "from-blue-500 to-cyan-500",
    textColor: "text-blue-400",
    dotColor: "bg-blue-500",
  },
  {
    id: "03",
    title: "Task Prioritizer",
    description: "Creates DAG, topologically sorts and parallelizes work.",
    icon: GitBranch,
    phase: "PHASE 3",
    color: "from-cyan-500 to-teal-500",
    textColor: "text-cyan-400",
    dotColor: "bg-cyan-500",
  },
  {
    id: "04",
    title: "Code Generator",
    description: "FE, BE, DB code in parallel with quality review loops.",
    icon: Code2,
    phase: "PHASE 4",
    color: "from-amber-500 to-orange-500",
    textColor: "text-amber-400",
    dotColor: "bg-amber-500",
  },
  {
    id: "05",
    title: "Code Reviewer",
    description: "Reviews code for quality and consistency.",
    icon: ShieldCheck,
    phase: "PHASE 5",
    color: "from-green-500 to-lime-500",
    textColor: "text-green-400",
    dotColor: "bg-green-500",
  },
  {
    id: "06",
    title: "Test Pipeline",
    description: "Generate, Unit, Integration, E2E tests in Docker containers and run them.",
    icon: Shield,
    phase: "PHASE 6",
    color: "from-purple-500 to-pink-500",
    textColor: "text-purple-400",
    dotColor: "bg-purple-500",
  },
  {
    id: "06",
    title: "Deployment",
    description: "Merge, integrate, provision infrastructure, deploy.",
    icon: Server,
    phase: "PHASE 6",
    color: "from-accent-secondary to-amber-400",
    textColor: "text-accent-secondary",
    dotColor: "bg-accent-secondary",
  },
];

export const WorkflowPipeline = () => {
  return (
    <section className="relative py-20 pb-12 bg-black overflow-hidden">
      {/* Stars Background Effect */}
      <div className="absolute inset-0 w-full h-full">
        <SparklesCore
          id="workflow-sparkles"
          background="transparent"
          minSize={0.4}
          maxSize={1.2}
          particleDensity={30}
          className="w-full h-full"
          particleColor="#8b5cf6"
        />
      </div>

      {/* Twinkling Stars Canvas */}
      <StarsBackground
        starDensity={0.0002}
        allStarsTwinkle={true}
        twinkleProbability={0.8}
        className="z-0"
      />

      {/* Shooting Stars */}
      <ShootingStars
        starColor="#8b5cf6"
        trailColor="#f59e0b"
        minSpeed={15}
        maxSpeed={35}
        minDelay={2000}
        maxDelay={5000}
        className="z-0"
      />

      {/* Animated Background Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(139,92,246,0.3) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Lamp Effect */}
      <div className="relative">
        {/* Lamp Glow Container */}
        <div className="relative flex w-full flex-1 items-center justify-center overflow-hidden">
          <div
            className="relative flex w-full items-center justify-center isolate z-0"
            style={{ minHeight: "200px" }}
          >
            {/* Left Conic Gradient Beam */}
            <motion.div
              initial={{ opacity: 0.5, width: "15rem" }}
              whileInView={{ opacity: 1, width: "30rem" }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
              className="absolute inset-auto right-1/2 h-56 overflow-visible bg-gradient-conic from-accent-primary via-transparent to-transparent text-white [--conic-position:from_70deg_at_center_top]"
              style={{
                backgroundImage: `conic-gradient(from 70deg at center top, #8b5cf6, transparent)`,
              }}
            >
              <div className="absolute w-[100%] left-0 bg-black h-40 bottom-0 z-20 [mask-image:linear-gradient(to_top,white,transparent)]" />
              <div className="absolute w-40 h-[100%] left-0 bg-black bottom-0 z-20 [mask-image:linear-gradient(to_right,white,transparent)]" />
            </motion.div>

            {/* Right Conic Gradient Beam */}
            <motion.div
              initial={{ opacity: 0.5, width: "15rem" }}
              whileInView={{ opacity: 1, width: "30rem" }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
              className="absolute inset-auto left-1/2 h-56 bg-gradient-conic from-transparent via-transparent to-accent-secondary text-white [--conic-position:from_290deg_at_center_top]"
              style={{
                backgroundImage: `conic-gradient(from 290deg at center top, transparent, #f59e0b)`,
              }}
            >
              <div className="absolute w-40 h-[100%] right-0 bg-black bottom-0 z-20 [mask-image:linear-gradient(to_left,white,transparent)]" />
              <div className="absolute w-[100%] right-0 bg-black h-40 bottom-0 z-20 [mask-image:linear-gradient(to_top,white,transparent)]" />
            </motion.div>

            {/* Background blur layer */}
            <div className="absolute top-1/2 h-48 w-full translate-y-12 scale-x-150 bg-black blur-2xl"></div>

            {/* Transparent backdrop blur */}
            <div className="absolute top-1/2 z-50 h-48 w-full bg-transparent opacity-10 backdrop-blur-md"></div>

            {/* Main glow orb - violet */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 0.5 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="absolute inset-auto z-50 h-36 w-[28rem] -translate-y-1/2 rounded-full bg-accent-primary blur-3xl"
            />

            {/* Secondary glow - amber animated */}
            <motion.div
              initial={{ width: "8rem", opacity: 0 }}
              whileInView={{ width: "16rem", opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
              className="absolute inset-auto z-30 h-36 w-64 -translate-y-[6rem] rounded-full bg-accent-secondary blur-2xl"
            />

            {/* Bright beam line - gradient */}
            <motion.div
              initial={{ width: "15rem", opacity: 0 }}
              whileInView={{ width: "30rem", opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
              className="absolute inset-auto z-50 h-0.5 w-[30rem] -translate-y-[7rem] bg-gradient-to-r from-transparent via-accent-primary to-transparent"
            />

            {/* Top mask for clean edge */}
            <div className="absolute inset-auto z-40 h-44 w-full -translate-y-[12.5rem] bg-black"></div>
          </div>
        </div>

        {/* Header Content - positioned to overlap with lamp */}
        <div className="container mx-auto px-4 relative z-50 -mt-32">
          <div className="mb-20 text-center max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-6"
            >
              <span className="w-2 h-2 rounded-full bg-accent-primary animate-pulse" />
              <span className="text-sm font-semibold tracking-wider uppercase text-violet-200 drop-shadow-sm">
                Multi-Agent Pipeline
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-5xl font-black text-white tracking-tight leading-none mb-4"
            >
              From User Story to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary via-accent-secondary to-accent-primary bg-300% animate-shimmer">
                Live Production
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-text-secondary text-base md:text-lg"
            >
              9 specialized AI agents collaborate through a centralized event bus
            </motion.p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Zigzag Pipeline with Rotated Cards */}
        <div className="relative max-w-5xl mx-auto">
          {/* Central Animated Line */}
          <div className="absolute left-1/2 top-0 bottom-24 w-0.5 -translate-x-1/2 hidden md:block">
            <motion.div
              className="w-full h-full bg-gradient-to-b from-accent-primary via-accent-secondary to-transparent"
              initial={{ scaleY: 0 }}
              whileInView={{ scaleY: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              style={{ transformOrigin: "top" }}
            />
          </div>

          {/* Steps */}
          <div className="space-y-8 md:space-y-0">
            {steps.map((step, index) => {
              const isLeft = index % 2 === 0;
              const rotation = isLeft ? -3 : 3;
              const hoverRotation = isLeft ? 0 : 0;

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: isLeft ? -100 : 100, rotate: rotation * 2 }}
                  whileInView={{ opacity: 1, x: 0, rotate: rotation }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{
                    duration: 0.6,
                    delay: index * 0.15,
                    type: "spring",
                    stiffness: 100,
                  }}
                  className={`relative flex items-center md:py-8 ${
                    isLeft ? "md:justify-start" : "md:justify-end"
                  }`}
                >
                  {/* Connection Node */}
                  <motion.div
                    className="absolute left-1/2 -translate-x-1/2 z-20 hidden md:flex flex-col items-center"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.15 + 0.3 }}
                  >
                    <div
                      className={`w-4 h-4 rounded-full ${step.dotColor} shadow-lg shadow-current/50`}
                    >
                      <div
                        className="absolute inset-0 rounded-full animate-ping opacity-30"
                        style={{ backgroundColor: "inherit" }}
                      />
                    </div>
                    {index < steps.length - 1 && (
                      <ArrowDown
                        className="w-4 h-4 text-white/30 mt-2 animate-bounce"
                        style={{ animationDelay: `${index * 200}ms` }}
                      />
                    )}
                  </motion.div>

                  {/* Card */}
                  <motion.div
                    whileHover={{
                      rotate: hoverRotation,
                      scale: 1.02,
                      y: -5,
                    }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className={`relative w-full md:w-[calc(50%-40px)] group ${
                      isLeft ? "md:mr-auto" : "md:ml-auto"
                    }`}
                  >
                    {/* Card Container with Glow */}
                    <div className="relative rounded-2xl border border-white/10 p-0.5">
                      <GlowingEffect
                        spread={50}
                        glow={true}
                        disabled={false}
                        proximity={80}
                        inactiveZone={0.01}
                        borderWidth={2}
                      />

                      {/* Card Content */}
                      <div className="relative bg-[#0a0a0a]/95 backdrop-blur-xl rounded-xl p-5 overflow-hidden">
                        {/* Gradient Accent Bar */}
                        <div
                          className={`absolute top-0 ${isLeft ? "right-0" : "left-0"} w-1 h-full bg-gradient-to-b ${step.color}`}
                        />

                        {/* Phase Number - Large Background */}
                        <div
                          className={`absolute ${isLeft ? "-right-4" : "-left-4"} -top-4 text-[80px] font-black text-white/[0.03] leading-none pointer-events-none`}
                        >
                          {step.id}
                        </div>

                        {/* Header */}
                        <div className="flex items-center gap-3 mb-3 relative">
                          <div
                            className={`p-2 rounded-lg bg-gradient-to-br ${step.color} shadow-lg`}
                          >
                            <step.icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <span className="text-[10px] font-mono text-white/40 tracking-wider block">
                              {step.phase}
                            </span>
                            <h3 className="text-lg font-bold text-white">{step.title}</h3>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-text-muted text-sm leading-relaxed pl-12">
                          {step.description}
                        </p>

                        {/* Hover Shine Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
                      </div>
                    </div>

                    {/* Connection Line to Center */}
                    <div
                      className={`absolute top-1/2 hidden md:block ${
                        isLeft ? "right-0 translate-x-full" : "left-0 -translate-x-full"
                      } w-10 h-0.5 bg-gradient-to-r ${
                        isLeft ? "from-white/20 to-transparent" : "from-transparent to-white/20"
                      }`}
                    />
                  </motion.div>
                </motion.div>
              );
            })}
          </div>

          {/* Bottom Flow Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.8 }}
            className="flex justify-center mt-12"
          >
            <div className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm font-medium text-white">Pipeline Active</span>
              <span className="text-text-muted">•</span>
              <span className="text-xs font-mono text-text-muted">
                Stories → Sequential | Tasks → Parallel
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
