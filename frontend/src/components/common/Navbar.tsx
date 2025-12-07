import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Button } from "./Button";

export const Navbar = () => {
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-6 bg-background/80 backdrop-blur-md border-b border-white/5 shadow-sm">
      <div className="flex items-center gap-4">
        <img
          src="/Logo.png"
          alt="AutoDev Logo"
          className="w-10 h-10 md:w-12 md:h-12 object-contain"
        />
        <img src="/Logo_name.png" alt="AutoDev" className="h-8 md:h-10 object-contain" />
      </div>
      <Button
        onClick={() => navigate("/login")}
        className="!rounded-full shadow-lg shadow-accent-primary/20 hover:shadow-accent-primary/40 transition-all flex items-center gap-2"
        size="md"
      >
        Launch Console <ChevronRight className="w-4 h-4" />
      </Button>
    </nav>
  );
};
