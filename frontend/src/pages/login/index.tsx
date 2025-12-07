import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuthStore } from "../../stores/authStore";
import { Github, Lock } from "lucide-react";
import { cn } from "../../utils/cn";
import { Button } from "../../components/common/Button";

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
      {/* 1. Background Grid & Depth */}
      <div className="absolute inset-0 z-0">
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
        {/* Glow behind card */}
        <div className="absolute inset-0 bg-accent-primary/10 rounded-3xl blur-3xl opacity-0 transition-opacity duration-1000 group-hover:opacity-100" />

        <div className="relative bg-surface/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-8 md:p-10 shadow-2xl ring-1 ring-white/5">
          {/* Top: Branding */}
          <div className="flex flex-col items-center justify-center mb-10">
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
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-medium text-white tracking-tight">Welcome back</h1>
              <p className="text-sm text-text-muted/60 leading-relaxed max-w-[280px] mx-auto">
                Enter the autonomous development environment.
              </p>
            </div>

            {/* Action Button */}
            <Button
              onClick={handleGitHubLogin}
              className="relative w-full group h-14 !rounded-xl overflow-hidden !bg-white !text-[#050B14] font-semibold text-[15px] tracking-wide shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all duration-300 border-none"
            >
              <div className="absolute inset-0 flex items-center justify-center gap-3 z-10">
                <Github className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                <span>Continue with GitHub</span>
              </div>

              {/* Shine Effect */}
              <div
                className={cn(
                  "absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0"
                )}
              />
            </Button>

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-2 pt-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
              <span className="text-[10px] uppercase tracking-widest text-text-muted/40 font-mono">
                System Secure & Encrypted
              </span>
              <Lock className="w-3 h-3 text-text-muted/30 ml-1" />
            </div>
          </div>

          {/* Decorative corner accents */}
          <div className="absolute top-0 left-0 w-16 h-16 border-l border-t border-white/5 rounded-tl-2xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-16 h-16 border-r border-b border-white/5 rounded-br-2xl pointer-events-none" />
        </div>
      </motion.div>
    </div>
  );
};
