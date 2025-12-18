import { useNavigate } from "react-router-dom";
import { ArrowRight, GitBranch } from "lucide-react";
import { HoverBorderGradient } from "../ui/hover-border-gradient";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export const Navbar = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { label: "About Us", scrollTo: null },
    { label: "Building Steps", scrollTo: null },
    { label: "Demo", scrollTo: "video-demo" },
    { label: "Docs", scrollTo: null },
  ];

  const handleNavClick = (scrollTo: string | null) => {
    if (scrollTo) {
      const element = document.getElementById(scrollTo);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled ? "py-2" : "py-4"
      }`}
    >
      {/* Background that appears on scroll */}
      <div
        className={`absolute inset-0 transition-all duration-500 ${
          scrolled
            ? "bg-black/80 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/20"
            : "bg-transparent"
        }`}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Left: Logo */}
        <motion.div
          className="flex items-center gap-3 cursor-pointer group"
          whileHover={{ scale: 1.02 }}
          onClick={() => navigate("/")}
        >
          <div className="relative">
            <div
              className={`absolute inset-0 bg-accent-primary/20 blur-lg rounded-full transition-opacity duration-300 ${scrolled ? "opacity-100" : "opacity-50"} animate-pulse-glow`}
            />
            <img
              src="/Logo.png"
              alt="AutoDev Logo"
              className="w-8 h-8 object-contain relative z-10 group-hover:rotate-12 transition-transform duration-500"
            />
          </div>
          <span className="text-lg font-bold tracking-tight text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-accent-primary group-hover:to-accent-secondary transition-all duration-300">
            AutoDev
          </span>
        </motion.div>

        {/* Center: Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <a
              key={item.label}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick(item.scrollTo);
              }}
              className="relative text-sm font-medium text-text-secondary hover:text-white transition-colors duration-300 group cursor-pointer"
            >
              {item.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-accent-primary to-accent-secondary group-hover:w-full transition-all duration-300" />
            </a>
          ))}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          <button className="hidden sm:block text-sm font-medium text-text-secondary hover:text-white transition-colors duration-300 px-4 py-2 rounded-lg hover:bg-white/5">
            Contact
          </button>

          {/* Enhanced Launch Console Button with HoverBorderGradient */}
          <HoverBorderGradient
            containerClassName="rounded-full group"
            as="button"
            className="dark:bg-black bg-black text-white flex items-center space-x-2"
            onClick={() => navigate("/login")}
          >
            <GitBranch className="h-4 w-4" />
            <span className="text-sm font-semibold">Launch Console</span>
            <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform duration-300" />
          </HoverBorderGradient>
        </div>
      </div>
    </motion.nav>
  );
};
