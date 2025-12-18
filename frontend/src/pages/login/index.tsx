import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "../../stores/authStore";
import { Github, Lock } from "lucide-react";
import { cn } from "../../utils/cn";
import { Button } from "../../components/common/Button";
import { Boxes } from "../../components/ui/background-boxes";
import { CardSpotlight } from "../../components/ui/card-spotlight";
import { EncryptedText } from "../../components/ui/encrypted-text";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleGitHubLogin = () => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    window.location.href = `${apiUrl}/api/auth/github`;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden selection:bg-accent-secondary/30 selection:text-white">
      {/* 0. Background Boxes Effect */}
      <div className="absolute inset-0 w-full h-full overflow-hidden z-0">
        <Boxes />
        {/* Radial mask to fade boxes towards edges */}
        <div className="absolute inset-0 w-full h-full bg-background [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black_70%)] pointer-events-none" />
      </div>

      {/* 1. Background Grid & Depth */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Subtle Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] opacity-20"></div>
        {/* Ambient Glows */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-accent-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-accent-secondary/5 rounded-full blur-[120px]" />
      </div>

      {/* 2. Main Login Card 'Obsidian Glass' */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[420px]"
      >
        <CardSpotlight className="relative bg-surface/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 md:p-10 shadow-2xl ring-1 ring-white/5 w-full">
          {/* Top: Branding */}
          <div className="flex flex-col items-center justify-center mb-10 relative z-20">
            <div className="relative mb-6 group">
              {/* Logo Glow */}
              <div className="absolute inset-0 bg-accent-secondary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <img
                src="/Logo.png"
                alt="Logo"
                className="w-16 h-16 object-contain relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
              />
            </div>
            <img src="/Logo_name.png" alt="AutoDev" className="h-6 opacity-90 object-contain" />
          </div>

          {/* Content */}
          <div className="space-y-8 relative z-20">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-medium text-white tracking-tight">Welcome back</h1>
              <p className="text-sm text-text-muted/60 leading-relaxed max-w-[280px] mx-auto">
                <EncryptedText
                  text="Enter the autonomous development environment."
                  className="font-mono text-xs"
                  revealDelayMs={30}
                />
              </p>
            </div>

            {/* Action Button */}
            <button
              onClick={handleGitHubLogin}
              className="w-full relative group overflow-hidden px-8 py-3 border-2 border-white uppercase bg-white text-black transition duration-200 text-sm font-bold tracking-widest shadow-[1px_1px_rgba(255,255,255),2px_2px_rgba(255,255,255),3px_3px_rgba(255,255,255),4px_4px_rgba(255,255,255),5px_5px_0px_0px_rgba(255,255,255)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none active:translate-x-[5px] active:translate-y-[5px] active:shadow-none"
            >
              <div className="relative z-10 flex items-center justify-center gap-3">
                <Github className="w-5 h-5" />
                <span>Continue with GitHub</span>
              </div>
            </button>

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-2 pt-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
              <span className="text-[10px] uppercase tracking-widest text-text-muted/40 font-mono flex items-center gap-1">
                <EncryptedText text="System Secure & Encrypted" revealDelayMs={50} />
                <Lock className="w-3 h-3 text-text-muted/30 ml-1 inline-block" />
              </span>
            </div>
          </div>
        </CardSpotlight>
      </motion.div>
    </div>
  );
};
