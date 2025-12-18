import { Navbar } from "../../components/common/Navbar";
import { Hero } from "@/components/home/Hero";
import { WorkflowPipeline } from "../../components/home/WorkflowPipeline";
import { VideoDemo } from "../../components/home/VideoDemo";
import { UseCases } from "../../components/home/UseCases";
import { Footer } from "../../components/common/Footer";

export function HomePage() {
  return (
    <div className="min-h-screen bg-background text-text-primary overflow-x-hidden selection:bg-accent-primary/30">
      {/* Compact Header */}
      <Navbar />

      <Hero />

      {/* Video Demo with internal 3D perspective on the video box */}
      <VideoDemo />

      {/* Workflow Pipeline */}
      <WorkflowPipeline />

      {/* Use Cases Section */}
      <UseCases />

      {/* Footer */}
      <Footer />
    </div>
  );
}
