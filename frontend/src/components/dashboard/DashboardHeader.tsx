import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { Button } from "../common/Button";
import { useAuthStore } from "../../stores/authStore";

export const DashboardHeader = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  if (!user) return null;

  return (
    <header className="h-14 border-b border-white/5 bg-surface/80 backdrop-blur-md flex items-center justify-between px-4 z-20 shrink-0">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigate("/")}>
          <img src="/Logo.png" alt="AutoDev" className="w-8 h-8 object-contain" />
          <img src="/Logo_name.png" alt="AutoDev" className="h-5 opacity-90" />
        </div>
        <div className="h-4 w-px bg-white/10 mx-2" />
        <span className="text-sm font-medium text-text-secondary">Dashboard</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 px-3 py-1.5 rounded-full border border-white/5 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.username}
              className="w-6 h-6 rounded-full object-cover border border-white/10"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-accent-primary to-accent-secondary flex items-center justify-center text-[10px] font-bold text-white">
              {user.username.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-xs font-medium text-text-primary group-hover:text-white transition-colors leading-none">
              {user.username}
            </span>
          </div>
        </div>

        <Button
          variant="link"
          size="sm"
          onClick={handleLogout}
          className="!p-2 text-text-muted hover:text-red-400 hover:bg-white/5 transition-colors rounded-lg !no-underline"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
};
