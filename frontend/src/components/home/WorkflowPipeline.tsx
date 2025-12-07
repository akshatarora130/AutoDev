import { motion } from "framer-motion";
import { Brain, Workflow, Code2, Shield, Server } from "lucide-react";

export const WorkflowPipeline = () => {
  return (
    <section className="container mx-auto px-4 py-32 relative">
      {/* Section Header */}
      <div className="mb-20">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center gap-2 mb-4"
        >
          <div className="h-[1px] w-8 bg-accent-primary"></div>
          <span className="text-accent-primary font-mono text-sm tracking-widest uppercase">
            Autonomous Delivery Pipeline
          </span>
        </motion.div>

        <h2 className="text-4xl md:text-5xl font-bold text-white max-w-xl leading-tight mb-6">
          From User Story to <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500">
            Live Production.
          </span>
        </h2>

        <p className="text-text-muted text-base max-w-sm border-l border-white/10 pl-6">
          A continuous, automated event bus connecting five specialized agents.
        </p>
      </div>

      {/* Vertical Circuit Pipeline */}
      <div className="relative max-w-4xl mx-auto">
        {/* Main Bus Line */}
        <div className="absolute left-8 md:left-12 top-0 bottom-0 w-px bg-gradient-to-b from-accent-primary via-accent-secondary to-accent-tertiary/20" />

        {/* Steps */}
        <div className="space-y-12 md:space-y-16">
          {/* Step 1 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative pl-24 md:pl-32"
          >
            {/* Node Connector */}
            <div className="absolute left-6 md:left-10 top-0 p-2 bg-surface border border-accent-primary rounded-lg z-10 shadow-[0_0_20px_rgba(139,92,246,0.5)]">
              <Brain className="w-6 h-6 text-accent-primary" />
            </div>

            {/* Content Card */}
            <div className="p-6 md:p-8 rounded-xl border border-white/10 bg-surface/80 backdrop-blur-sm relative hover:border-accent-primary/50 transition-colors group">
              <div className="absolute top-0 right-0 p-4 opacity-50 font-mono text-xs text-accent-primary">
                PHASE.01
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-accent-primary transition-colors">
                Archon / Ingestion & Division
              </h3>
              <p className="text-text-muted text-sm leading-relaxed mb-4">
                Connects to Azure DevOps, fetches stories, extracts metadata, and divides them into
                ranked execution tasks.
              </p>
              <div className="flex items-center gap-4 text-xs font-mono text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full w-fit">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                ADO_CONNECTED
              </div>
            </div>
          </motion.div>

          {/* Step 2 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="relative pl-24 md:pl-32"
          >
            <div className="absolute left-6 md:left-10 top-0 p-2 bg-surface border border-white/20 rounded-lg z-10">
              <Workflow className="w-6 h-6 text-white" />
            </div>
            <div className="p-6 md:p-8 rounded-xl border border-white/10 bg-surface/80 backdrop-blur-sm relative hover:border-white/30 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-30 font-mono text-xs text-white">
                PHASE.02
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Forge / Task Review</h3>
              <p className="text-text-muted text-sm leading-relaxed mb-4">
                Recursively validates task logic, breaking down complex requirements into atomic,
                implementable units.
              </p>
              <div className="flex items-center gap-4 text-xs font-mono text-text-muted bg-white/5 px-3 py-1 rounded-full w-fit">
                RECURSIVE_DEPTH: 4
              </div>
            </div>
          </motion.div>

          {/* Step 3 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="relative pl-24 md:pl-32"
          >
            <div className="absolute left-6 md:left-10 top-0 p-2 bg-surface border border-white/20 rounded-lg z-10">
              <Code2 className="w-6 h-6 text-white" />
            </div>
            <div className="p-6 md:p-8 rounded-xl border border-white/10 bg-surface/80 backdrop-blur-sm relative hover:border-white/30 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-30 font-mono text-xs text-white">
                PHASE.03
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Nexus / Parallel Code Gen</h3>
              <p className="text-text-muted text-sm leading-relaxed mb-4">
                Generates Frontend, Backend, and DB code in parallel with self-correcting style &
                security review loops.
              </p>
              <div className="flex gap-2">
                <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-xs font-mono">
                  FE_GEN
                </span>
                <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-mono">
                  BE_GEN
                </span>
                <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-400 text-xs font-mono">
                  DB_GEN
                </span>
              </div>
            </div>
          </motion.div>

          {/* Step 4 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="relative pl-24 md:pl-32"
          >
            <div className="absolute left-6 md:left-10 top-0 p-2 bg-surface border border-white/20 rounded-lg z-10">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="p-6 md:p-8 rounded-xl border border-white/10 bg-surface/80 backdrop-blur-sm relative hover:border-white/30 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-30 font-mono text-xs text-white">
                PHASE.05
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Sentinel / Validated Testing</h3>
              <p className="text-text-muted text-sm leading-relaxed mb-4">
                Generates and executes Unit, Integration, and E2E tests in isolated Docker
                environments.
              </p>
              <div className="flex items-center gap-4 text-xs font-mono text-purple-400 bg-purple-500/10 px-3 py-1 rounded-full w-fit">
                COVERAGE &gt; 98%
              </div>
            </div>
          </motion.div>

          {/* Step 5 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="relative pl-24 md:pl-32"
          >
            {/* Final Node (Pulsing) */}
            <div className="absolute left-6 md:left-10 top-0 p-2 bg-surface border border-accent-secondary rounded-lg z-10 shadow-[0_0_20px_rgba(245,158,11,0.5)]">
              <Server className="w-6 h-6 text-accent-secondary" />
            </div>
            <div className="p-6 md:p-8 rounded-xl border border-white/10 bg-surface/80 backdrop-blur-sm relative hover:border-accent-secondary/50 transition-colors group">
              <div className="absolute top-0 right-0 p-4 opacity-50 font-mono text-xs text-accent-secondary">
                PHASE.06
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-accent-secondary transition-colors">
                Vertex / Operations
              </h3>
              <p className="text-text-muted text-sm leading-relaxed mb-4">
                Merges modules, provisions managed Postgres/AWS infrastructure, and deploys to a
                live preview URL.
              </p>
              <div className="flex items-center gap-4 text-xs font-mono text-accent-secondary bg-accent-secondary/10 px-3 py-1 rounded-full w-fit">
                <div className="w-1.5 h-1.5 bg-accent-secondary rounded-full animate-pulse" />
                DEPLOYMENT_ACTIVE
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
