import { Navbar } from "../../components/common/Navbar";
import { Hero } from "../../components/home/Hero";
import { WorkflowPipeline } from "../../components/home/WorkflowPipeline";
import { VideoDemo } from "../../components/home/VideoDemo";

export function HomePage() {
  return (
    <div className="min-h-screen bg-background text-text-primary overflow-x-hidden selection:bg-accent-primary/30">
      {/* Compact Header */}
      <Navbar />

      <Hero />

      <VideoDemo />
      <WorkflowPipeline />

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#0b1120] py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-text-muted text-sm">© 2025 AutoDev Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
