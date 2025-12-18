import { useState, useEffect } from "react";
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from "lucide-react";
import { cn } from "../../utils/cn";
import { githubApi } from "../../utils/api";
import { Loader } from "../common/Loader";
import type { TreeNode, Repository } from "../../types";

interface FileTreeProps {
  repo: Repository;
  onFileClick?: (path: string) => void;
  selectedFile?: string | null;
}

interface FileTreeNodeProps {
  node: TreeNode;
  level: number;
  onFileClick?: (path: string) => void;
  repo: Repository;
  selectedFile?: string | null;
}

const FileTreeNode = ({ node, level, onFileClick, repo, selectedFile }: FileTreeNodeProps) => {
  const isDirectory = node.type === "dir";
  const children = node.children || [];
  const isSelected = !isDirectory && node.path === selectedFile;

  // Auto-expand if this directory contains the selected file
  const shouldBeExpanded =
    level === 0 || (isDirectory && selectedFile && selectedFile.startsWith(node.path + "/"));

  const [isExpanded, setIsExpanded] = useState(shouldBeExpanded);

  // Update expanded state when selectedFile changes
  useEffect(() => {
    if (shouldBeExpanded) {
      setIsExpanded(true);
    }
  }, [selectedFile, shouldBeExpanded]);

  const handleClick = () => {
    if (isDirectory) {
      setIsExpanded(!isExpanded);
    } else {
      onFileClick?.(node.path);
    }
  };

  const indent = level * 16;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 hover:bg-white/5 cursor-pointer group transition-colors",
          "text-sm",
          isSelected
            ? "bg-accent-primary/10 text-text-primary border-l-2 border-accent-primary"
            : "text-text-secondary"
        )}
        style={{ paddingLeft: `${8 + indent}px` }}
        onClick={handleClick}
      >
        {isDirectory ? (
          <>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-text-muted shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-text-muted shrink-0" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 text-accent-primary shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-accent-secondary shrink-0" />
            )}
          </>
        ) : (
          <>
            <div className="w-4 h-4 shrink-0" />
            <File className="w-4 h-4 text-text-muted/60 shrink-0" />
          </>
        )}
        <span className="truncate flex-1 group-hover:text-text-primary transition-colors">
          {node.name}
        </span>
      </div>
      {isDirectory && isExpanded && (
        <div>
          {children.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              level={level + 1}
              onFileClick={onFileClick}
              repo={repo}
              selectedFile={selectedFile}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Helper function to build nested tree structure from flat list
const buildNestedTree = (items: TreeNode[]): TreeNode[] => {
  const tree: TreeNode[] = [];
  const pathMap = new Map<string, TreeNode>();

  // Sort items: directories first, then files, then alphabetically
  const sortedItems = [...items].sort((a, b) => {
    if (a.type === "dir" && b.type === "file") return -1;
    if (a.type === "file" && b.type === "dir") return 1;
    return a.path.localeCompare(b.path);
  });

  for (const item of sortedItems) {
    const parts = item.path.split("/").filter(Boolean);
    const depth = parts.length;

    if (depth === 1) {
      // Root level item
      const node: TreeNode = {
        ...item,
        children: item.type === "dir" ? [] : undefined,
      };
      tree.push(node);
      pathMap.set(item.path, node);
    } else {
      // Nested item - find or create all parent directories
      let currentPath = "";
      let parentNode: TreeNode | undefined;

      for (let i = 0; i < depth - 1; i++) {
        const part = parts[i];
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        let dirNode = pathMap.get(currentPath);
        if (!dirNode) {
          // Create directory node
          dirNode = {
            name: part,
            path: currentPath,
            type: "dir",
            children: [],
          };
          pathMap.set(currentPath, dirNode);

          // Add to parent or root
          if (parentNode) {
            if (!parentNode.children) {
              parentNode.children = [];
            }
            parentNode.children.push(dirNode);
          } else {
            tree.push(dirNode);
          }
        }
        parentNode = dirNode;
      }

      // Add the item to its parent
      if (parentNode) {
        if (!parentNode.children) {
          parentNode.children = [];
        }
        const node: TreeNode = {
          ...item,
          children: item.type === "dir" ? [] : undefined,
        };
        parentNode.children.push(node);
        pathMap.set(item.path, node);
      }
    }
  }

  return tree;
};

export const FileTree = ({ repo, onFileClick, selectedFile }: FileTreeProps) => {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTree();
  }, [repo]);

  const loadTree = async () => {
    try {
      setLoading(true);
      setError(null);
      const [owner, repoName] = repo.full_name.split("/");
      const treeData = await githubApi.getRepoTree(owner, repoName, repo.default_branch, true);
      const nestedTree = buildNestedTree(treeData.tree);
      setTree(nestedTree);
    } catch (err: any) {
      console.error("Failed to load repository tree:", err);
      setError(err.response?.data?.error || "Failed to load repository structure");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader text="Loading repository structure..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <p className="text-sm text-text-muted mb-4">{error}</p>
        <button
          onClick={loadTree}
          className="text-xs text-accent-primary hover:text-accent-secondary transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="py-2">
        {tree.length === 0 ? (
          <div className="text-center py-8 px-4">
            <p className="text-xs text-text-muted">Repository is empty</p>
          </div>
        ) : (
          tree.map((node) => (
            <FileTreeNode
              key={node.path}
              node={node}
              level={0}
              onFileClick={onFileClick}
              repo={repo}
              selectedFile={selectedFile}
            />
          ))
        )}
      </div>
    </div>
  );
};
