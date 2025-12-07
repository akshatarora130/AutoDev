import { cn } from "../../utils/cn";

interface LoaderProps {
  text?: string;
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
  className?: string;
}

export const Loader = ({ text, size = "md", fullScreen = false, className }: LoaderProps) => {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16",
  };

  const content = (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <div className={cn("relative", sizeClasses[size])}>
        {/* Outer Ring - Primary Color */}
        <div className="absolute inset-0 border-2 border-accent-primary/20 border-t-accent-primary rounded-full animate-spin" />

        {/* Inner Ring - Secondary Color (Opposite direction) */}
        <div className="absolute inset-2 border-2 border-accent-secondary/20 border-b-accent-secondary rounded-full animate-[spin_1.5s_linear_infinite_reverse]" />

        {/* Core Dot - Pulsing */}
        <div className="absolute inset-[42%] bg-white rounded-full animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
      </div>

      {text && (
        <p className="text-text-muted text-xs font-mono uppercase tracking-widest animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">{content}</div>
    );
  }

  return content;
};
