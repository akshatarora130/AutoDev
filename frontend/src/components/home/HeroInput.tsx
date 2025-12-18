import { Paperclip, ArrowUp, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { GlowingEffect } from "../ui/glowing-effect";

export const HeroInput = () => {
  const placeholderText = "Build anything you want in minutes...";
  const [placeholder, setPlaceholder] = useState("");

  useEffect(() => {
    let currentIndex = 0;
    let isDeleting = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const animatePlaceholder = () => {
      const currentFullText = placeholderText;

      setPlaceholder(currentFullText.substring(0, currentIndex));

      let typeSpeed = 100;

      if (isDeleting) {
        typeSpeed /= 2;
      }

      if (!isDeleting && currentIndex === currentFullText.length) {
        isDeleting = true;
        typeSpeed = 2000; // Pause at end
      } else if (isDeleting && currentIndex === 0) {
        isDeleting = false;
        typeSpeed = 500; // Pause at start
      }

      if (currentIndex === currentFullText.length) {
        // Add a cursor effect or just wait
      }

      const increment = isDeleting ? -1 : 1;
      currentIndex += increment;

      timeoutId = setTimeout(animatePlaceholder, typeSpeed);
    };

    timeoutId = setTimeout(animatePlaceholder, 1000);

    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto relative group">
      {/* Outer container for GlowingEffect */}
      <div className="relative rounded-xl border border-white/10 p-0.5">
        <GlowingEffect
          spread={60}
          glow={true}
          disabled={false}
          proximity={80}
          inactiveZone={0.01}
          borderWidth={2}
        />

        <div className="relative bg-[#0f0f0f]/90 backdrop-blur-xl rounded-[10px] p-2 flex flex-col gap-2 shadow-2xl">
          <div className="relative px-4 py-3 min-h-[60px] flex items-center">
            <Sparkles className="w-5 h-5 text-accent-primary mr-3 animate-pulse" />
            <span className="text-text-muted text-lg relative">
              {placeholder}
              <span className="animate-blink border-r-2 border-accent-secondary ml-1 h-5 inline-block align-middle">
                &nbsp;
              </span>
            </span>
          </div>

          <div className="flex items-center justify-between px-2 pb-1">
            <button className="flex items-center gap-2 text-xs font-medium text-text-muted hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
              <Paperclip className="w-4 h-4" />
              Attach
            </button>

            <button className="bg-white/10 hover:bg-accent-primary text-white p-2 rounded-lg transition-all duration-300">
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
