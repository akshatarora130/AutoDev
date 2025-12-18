import { motion } from "framer-motion";
import { Layers, Sparkles, Zap, Terminal, ArrowRight } from "lucide-react";
import { ShootingStars } from "../ui/shooting-stars";
import { StarsBackground } from "../ui/stars-background";
import { GlowingEffect } from "../ui/glowing-effect";

const useCases = [
  {
    id: 1,
    title: "Visually build & iterate web apps faster, together",
    description:
      "Developers rapidly construct UIs with your design system, designers and PMs contribute production-ready code without waiting on dev cycles.",
    badges: [
      { label: "Developer", color: "bg-violet-500", position: "left" },
      { label: "Designer", color: "bg-cyan-500", position: "right-top" },
      { label: "PM", color: "bg-amber-500", position: "right-bottom" },
    ],
    visual: "collaboration",
    layout: "left",
  },
  {
    id: 2,
    title: "Rapidly build high-quality prototypes & MVPs",
    description: "Build fully interactive prototypes with your design system in minutes.",
    visual: "prototype",
    layout: "right",
  },
  {
    id: 3,
    title: "Convert designs to production-ready code",
    description: "Use AI to turn Figma designs into code that leverages your components.",
    visual: "code",
    layout: "left",
  },
];

// Animated Dashboard Visual Component
const DashboardVisual = () => (
  <div className="relative w-full h-full min-h-[280px] rounded-xl overflow-hidden bg-[#0a0a0a] border border-white/10">
    {/* Top Bar */}
    <div className="absolute top-0 left-0 right-0 h-8 bg-white/5 border-b border-white/10 flex items-center px-3 gap-2">
      <div className="flex gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
        <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
      </div>
      <div className="flex-1 flex justify-center">
        <div className="px-3 py-0.5 bg-white/5 rounded text-[10px] text-text-muted font-mono">
          autodev-dashboard.app
        </div>
      </div>
    </div>

    {/* Content Area */}
    <div className="pt-10 p-4 h-full">
      {/* Sidebar */}
      <div className="absolute left-0 top-8 bottom-0 w-12 bg-white/[0.02] border-r border-white/5 flex flex-col items-center py-4 gap-4">
        <div className="w-6 h-6 rounded bg-accent-primary/20 flex items-center justify-center">
          <Layers className="w-3 h-3 text-accent-primary" />
        </div>
        <div className="w-6 h-6 rounded bg-white/5" />
        <div className="w-6 h-6 rounded bg-white/5" />
        <div className="w-6 h-6 rounded bg-white/5" />
      </div>

      {/* Main Dashboard Content */}
      <div className="ml-14 space-y-3">
        {/* Stats Row */}
        <div className="flex gap-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex-1 p-3 rounded-lg bg-gradient-to-br from-accent-primary/10 to-transparent border border-accent-primary/20"
          >
            <div className="text-[10px] text-text-muted mb-1">Revenue</div>
            <div className="text-lg font-bold text-white">$285,750</div>
            <div className="flex items-center gap-1 mt-1">
              <Zap className="w-2.5 h-2.5 text-green-400" />
              <span className="text-[9px] text-green-400">+12.5%</span>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex-1 p-3 rounded-lg bg-white/5 border border-white/10"
          >
            <div className="text-[10px] text-text-muted mb-1">Users</div>
            <div className="text-lg font-bold text-white">12,847</div>
          </motion.div>
        </div>

        {/* Chart Area */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-3 rounded-lg bg-white/[0.02] border border-white/10"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] text-text-muted">Performance</span>
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-4 h-4 rounded bg-white/5" />
              ))}
            </div>
          </div>
          <div className="h-16 flex items-end gap-1">
            {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 95, 80].map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                whileInView={{ height: `${h}%` }}
                transition={{ delay: 0.5 + i * 0.05 }}
                className="flex-1 bg-gradient-to-t from-accent-primary/50 to-accent-secondary/50 rounded-t"
              />
            ))}
          </div>
        </motion.div>

        {/* Table Preview */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-1"
        >
          {[1, 2, 3].map((_, i) => (
            <div key={i} className="flex gap-2 p-2 rounded bg-white/[0.02]">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent-primary/30 to-accent-secondary/30" />
              <div className="flex-1 space-y-1">
                <div className="h-2 w-24 bg-white/10 rounded" />
                <div className="h-1.5 w-16 bg-white/5 rounded" />
              </div>
              <div className="h-4 w-12 bg-white/5 rounded" />
            </div>
          ))}
        </motion.div>
      </div>
    </div>

    {/* Floating Tooltips */}
    <motion.div
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 3, repeat: Infinity }}
      className="absolute top-16 right-4 bg-[#1a1a1a] border border-white/10 rounded-lg p-2 shadow-xl"
    >
      <div className="text-[9px] text-text-muted mb-1">Add recommended advisors based</div>
      <div className="text-[9px] text-text-muted">on holdings. Make a modal pop-up</div>
      <div className="text-[9px] text-text-muted">when one is selected.</div>
      <div className="flex gap-1 mt-2">
        {["✏️", "💬", "📎", "🔗"].map((emoji, i) => (
          <span key={i} className="text-xs">
            {emoji}
          </span>
        ))}
        <div className="ml-auto w-5 h-5 rounded bg-cyan-500 flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-white" />
        </div>
      </div>
    </motion.div>
  </div>
);

// Prototype Visual Component
const PrototypeVisual = () => (
  <div className="relative w-full h-full min-h-[280px] rounded-xl overflow-hidden bg-[#0a0a0a] border border-white/10 p-4">
    {/* Desktop Frame */}
    <div className="relative bg-[#111] rounded-lg border border-white/10 p-2 h-full">
      {/* Browser Bar */}
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5">
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500/60" />
          <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
          <div className="w-2 h-2 rounded-full bg-green-500/60" />
        </div>
        <div className="flex-1 h-4 bg-white/5 rounded" />
      </div>

      {/* App Content */}
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-center gap-2 p-2 bg-white/[0.02] rounded">
          <div className="w-6 h-6 rounded bg-violet-500/30 flex items-center justify-center">
            <Layers className="w-3 h-3 text-violet-400" />
          </div>
          <div className="text-xs text-white font-medium">Dashboard</div>
          <div className="ml-auto flex gap-1">
            <div className="w-4 h-4 rounded bg-white/5" />
            <div className="w-4 h-4 rounded bg-white/5" />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Users", value: "2.4K", color: "from-cyan-500/20 to-blue-500/20" },
            { label: "Revenue", value: "$12K", color: "from-green-500/20 to-emerald-500/20" },
            { label: "Growth", value: "+24%", color: "from-amber-500/20 to-orange-500/20" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className={`p-2 rounded bg-gradient-to-br ${stat.color} border border-white/5`}
            >
              <div className="text-[8px] text-text-muted">{stat.label}</div>
              <div className="text-sm font-bold text-white">{stat.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Table */}
        <div className="space-y-1">
          <div className="text-[10px] text-text-muted px-1">Recommended Financial Advisors</div>
          {["Jennifer Parker", "David Rodriguez", "Michelle Chang"].map((name, i) => (
            <motion.div
              key={i}
              initial={{ x: -20, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="flex items-center gap-2 p-1.5 bg-white/[0.02] rounded"
            >
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-accent-primary/40 to-accent-secondary/40" />
              <div className="flex-1">
                <div className="text-[10px] text-white">{name}</div>
                <div className="text-[8px] text-text-muted">Senior Advisor</div>
              </div>
              <div className="h-3 w-12 bg-white/10 rounded" />
              <div className="h-3 w-8 bg-white/5 rounded" />
            </motion.div>
          ))}
        </div>
      </div>
    </div>

    {/* Floating Element Indicator */}
    <motion.div
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
      className="absolute top-4 right-4 flex items-center gap-1 bg-white/10 backdrop-blur px-2 py-1 rounded text-[10px] text-white"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
      Live view
    </motion.div>
  </div>
);

// Code Conversion Visual Component
const CodeConversionVisual = () => (
  <div className="relative w-full h-full min-h-[280px] flex items-center justify-center">
    {/* Design Side - Calendar */}
    <motion.div
      initial={{ x: -50, opacity: 0 }}
      whileInView={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="relative z-10"
    >
      <div className="w-40 bg-[#1a1a1a] border border-white/10 rounded-xl p-3 shadow-2xl">
        <div className="text-[10px] font-medium text-white mb-2">January 2025</div>
        <div className="grid grid-cols-7 gap-0.5 text-[8px] text-text-muted mb-1">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} className="text-center">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {[...Array(31)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ delay: 0.3 + i * 0.01 }}
              className={`w-4 h-4 rounded text-[8px] flex items-center justify-center ${
                i === 14 ? "bg-accent-primary text-white" : "text-text-muted hover:bg-white/5"
              }`}
            >
              {i + 1}
            </motion.div>
          ))}
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          className="w-full mt-2 py-1.5 bg-cyan-500 rounded-lg text-[10px] text-white font-medium"
        >
          Choose Date
        </motion.button>
      </div>

      {/* Phone Frame */}
      <div className="absolute -bottom-4 -left-6 w-20 bg-[#0f0f0f] border border-white/10 rounded-xl p-1.5 shadow-xl">
        <div className="bg-white/5 rounded-lg p-1.5 space-y-1">
          <div className="h-1.5 w-8 bg-white/20 rounded" />
          <div className="h-1 w-12 bg-white/10 rounded" />
          <div className="h-1 w-6 bg-white/5 rounded" />
        </div>
      </div>
    </motion.div>

    {/* Arrow */}
    <motion.div
      initial={{ scale: 0 }}
      whileInView={{ scale: 1 }}
      transition={{ delay: 0.5 }}
      className="mx-4 flex items-center"
    >
      <div className="w-8 h-0.5 bg-gradient-to-r from-accent-primary to-accent-secondary" />
      <ArrowRight className="w-4 h-4 text-accent-secondary -ml-1" />
    </motion.div>

    {/* Code Side */}
    <motion.div
      initial={{ x: 50, opacity: 0 }}
      whileInView={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="relative"
    >
      <div className="w-56 bg-[#0d1117] border border-white/10 rounded-xl p-3 font-mono text-[10px] shadow-2xl">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/5">
          <Terminal className="w-3 h-3 text-accent-primary" />
          <span className="text-text-muted">DatePicker.tsx</span>
        </div>
        <div className="space-y-1">
          <div>
            <span className="text-pink-400">&lt;Card</span>{" "}
            <span className="text-cyan-400">title=</span>
            <span className="text-amber-400">{"{currentMonth}"}</span>
            <span className="text-pink-400">&gt;</span>
          </div>
          <div className="pl-3">
            <span className="text-pink-400">&lt;Calendar</span>{" "}
            <span className="text-pink-400">/&gt;</span>
          </div>
          <div className="pl-3">
            <span className="text-pink-400">&lt;Button</span>{" "}
            <span className="text-cyan-400">variant=</span>
            <span className="text-amber-400">{"{primary}"}</span>
            <span className="text-pink-400">/&gt;</span>
          </div>
          <div className="pl-6 text-green-400">Edit date</div>
          <div className="pl-3">
            <span className="text-pink-400">&lt;/Button&gt;</span>
          </div>
          <div>
            <span className="text-pink-400">&lt;/Card&gt;</span>
          </div>
        </div>
      </div>

      {/* Cursor */}
      <motion.div
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
        className="absolute top-12 right-16 w-2 h-4 bg-accent-primary rounded-sm"
      />
    </motion.div>
  </div>
);

export const UseCases = () => {
  return (
    <section className="relative pt-0 pb-24 bg-black overflow-hidden">
      {/* Background Effects */}
      <StarsBackground
        starDensity={0.00015}
        allStarsTwinkle={true}
        twinkleProbability={0.7}
        className="z-0"
      />

      <ShootingStars
        starColor="#8b5cf6"
        trailColor="#f59e0b"
        minSpeed={10}
        maxSpeed={25}
        minDelay={3000}
        maxDelay={6000}
        className="z-0"
      />

      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* Gradient Orbs */}
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-accent-primary/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-accent-secondary/10 rounded-full blur-[150px] pointer-events-none" />

      {/* Lamp Effect Header */}
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
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-accent-primary/30 mb-8 backdrop-blur-md shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:border-accent-primary/50 transition-colors duration-300"
            >
              <Sparkles className="w-4 h-4 text-accent-primary animate-pulse" />
              <span className="text-sm font-semibold tracking-wider uppercase text-violet-200 drop-shadow-sm">
                Use Cases
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4"
            >
              Accelerate your entire{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-primary via-accent-secondary to-accent-primary bg-300% animate-shimmer">
                software
              </span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-secondary to-accent-primary">
                development lifecycle
              </span>
            </motion.h2>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Use Case Cards */}
        <div className="space-y-8 max-w-6xl mx-auto">
          {useCases.map((useCase, index) => (
            <motion.div
              key={useCase.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="relative rounded-2xl border border-white/10 p-0.5 group">
                <GlowingEffect
                  spread={60}
                  glow={true}
                  disabled={false}
                  proximity={100}
                  inactiveZone={0.01}
                  borderWidth={2}
                />

                <div className="relative bg-[#0a0a0a]/90 backdrop-blur-xl rounded-xl p-6 md:p-8 overflow-hidden">
                  {/* Hover Shine */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

                  <div
                    className={`flex flex-col ${useCase.layout === "right" ? "md:flex-row-reverse" : "md:flex-row"} gap-8 items-center`}
                  >
                    {/* Text Content */}
                    <div className="flex-1 space-y-4">
                      <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                        {useCase.title}
                      </h3>
                      <p className="text-text-secondary text-base md:text-lg">
                        {useCase.description}
                      </p>

                      {/* Role Badges for first card */}
                      {useCase.badges && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {useCase.badges.map((badge, i) => (
                            <motion.span
                              key={i}
                              initial={{ scale: 0 }}
                              whileInView={{ scale: 1 }}
                              transition={{ delay: 0.3 + i * 0.1 }}
                              className={`${badge.color} px-3 py-1 rounded-full text-xs font-medium text-white shadow-lg`}
                            >
                              {badge.label}
                            </motion.span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Visual */}
                    <div className="flex-1 w-full">
                      {useCase.visual === "collaboration" && <DashboardVisual />}
                      {useCase.visual === "prototype" && <PrototypeVisual />}
                      {useCase.visual === "code" && <CodeConversionVisual />}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default UseCases;
