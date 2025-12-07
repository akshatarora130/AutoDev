import { motion } from "framer-motion";

export const VideoDemo = () => {
  return (
    <section className="-mt-24 relative z-20 container mx-auto px-4 mb-32">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="rounded-2xl p-2 bg-gradient-to-b from-white/10 to-transparent backdrop-blur-sm border border-white/10 shadow-2xl"
      >
        <div className="relative aspect-[21/9] bg-black/90 rounded-xl overflow-hidden border border-white/5 group">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center mb-4 group-hover:scale-110 transition-transform cursor-pointer border border-white/20">
                <div className="w-0 h-0 border-t-8 border-t-transparent border-l-[16px] border-l-white border-b-8 border-b-transparent ml-1"></div>
              </div>
              <p className="text-sm font-mono text-text-muted">WATCH SYSTEM DEMO</p>
            </div>
          </div>
          {/* Simulation of a terminal interface/video placeholder */}
          <div className="absolute top-4 left-4 flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-accent-primary/50">
            <div className="h-full w-1/3 bg-accent-primary animate-pulse"></div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};
