import { X } from "lucide-react";
import { cn } from "../../utils/cn";

export interface OpenFile {
  path: string;
  name: string;
  hasChanges: boolean;
}

interface TabsBarProps {
  openFiles: OpenFile[];
  activeFile: string | null;
  onFileSelect: (path: string) => void;
  onFileClose: (path: string, event: React.MouseEvent) => void;
}

export const TabsBar = ({ openFiles, activeFile, onFileSelect, onFileClose }: TabsBarProps) => {
  if (openFiles.length === 0) {
    return null;
  }

  return (
    <div className="h-10 bg-surface/50 border-b border-white/5 flex items-center gap-1 overflow-x-auto custom-scrollbar shrink-0">
      {openFiles.map((file) => {
        const isActive = file.path === activeFile;
        return (
          <div
            key={file.path}
            className={cn(
              "group flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors shrink-0",
              "border-r border-white/5",
              isActive
                ? "bg-background text-text-primary"
                : "bg-surface/30 text-text-secondary hover:bg-surface/50 hover:text-text-primary"
            )}
            onClick={() => onFileSelect(file.path)}
          >
            <span className="text-xs font-medium truncate max-w-[200px]">{file.name}</span>
            {file.hasChanges && (
              <div className="w-1.5 h-1.5 rounded-full bg-accent-primary shrink-0" />
            )}
            <button
              onClick={(e) => onFileClose(file.path, e)}
              className={cn(
                "opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-white/10",
                "ml-1 shrink-0"
              )}
              title="Close"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
