import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Highlight, themes } from "prism-react-renderer";
import { projectApi } from "../../utils/api";
import type { File, Project } from "../../types";
import { Folder, FileText, ChevronDown, ChevronRight, Copy, Search, ArrowLeft } from "lucide-react";

interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children: FileNode[];
  content?: string;
}

const getLanguageFromPath = (path: string): string => {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  const langMap: Record<string, string> = {
    ts: "typescript",
    tsx: "tsx",
    js: "javascript",
    jsx: "jsx",
    css: "css",
    html: "html",
    json: "json",
    md: "markdown",
    py: "python",
    prisma: "graphql",
    yml: "yaml",
    yaml: "yaml",
  };
  return langMap[ext] || "text";
};

const buildFileTree = (files: File[]): FileNode[] => {
  const root: FileNode[] = [];
  const nodeMap = new Map<string, FileNode>();

  const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path));

  for (const file of sortedFiles) {
    const parts = file.path.split("/");
    let currentPath = "";

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const parentPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isFile = i === parts.length - 1;

      if (!nodeMap.has(currentPath)) {
        const node: FileNode = {
          name: part,
          path: currentPath,
          isDirectory: !isFile,
          children: [],
          content: isFile ? file.content : undefined,
        };
        nodeMap.set(currentPath, node);

        if (parentPath && nodeMap.has(parentPath)) {
          nodeMap.get(parentPath)!.children.push(node);
        } else if (!parentPath) {
          root.push(node);
        }
      }
    }
  }

  return root;
};

const FileTreeItem = ({
  node,
  depth,
  onSelect,
  selectedPath,
}: {
  node: FileNode;
  depth: number;
  onSelect: (node: FileNode) => void;
  selectedPath: string | null;
}) => {
  const [isOpen, setIsOpen] = useState(depth < 2);

  const handleClick = () => {
    if (node.isDirectory) {
      setIsOpen(!isOpen);
    } else {
      onSelect(node);
    }
  };

  const isSelected = selectedPath === node.path;

  return (
    <div>
      <button
        onClick={handleClick}
        className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-surface-hover transition-colors ${
          isSelected ? "bg-primary/20 text-primary" : "text-gray-300"
        }`}
        style={{ paddingLeft: `${depth * 16 + 12}px` }}
      >
        {node.isDirectory ? (
          <>
            {isOpen ? (
              <ChevronDown className="w-3 h-3 text-gray-500" />
            ) : (
              <ChevronRight className="w-3 h-3 text-gray-500" />
            )}
            <Folder className="w-4 h-4 text-yellow-500" />
          </>
        ) : (
          <>
            <span className="w-3" />
            <FileText className="w-4 h-4 text-gray-400" />
          </>
        )}
        <span className="truncate">{node.name}</span>
      </button>
      {node.isDirectory && isOpen && (
        <div>
          {node.children
            .sort((a, b) => {
              if (a.isDirectory && !b.isDirectory) return -1;
              if (!a.isDirectory && b.isDirectory) return 1;
              return a.name.localeCompare(b.name);
            })
            .map((child) => (
              <FileTreeItem
                key={child.path}
                node={child}
                depth={depth + 1}
                onSelect={onSelect}
                selectedPath={selectedPath}
              />
            ))}
        </div>
      )}
    </div>
  );
};

export const FilesPage = () => {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId");
  const projectName = searchParams.get("projectName") || "Project";

  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState(false);
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    if (projectId) {
      loadFiles(projectId);
      loadProject(projectId);
    }
  }, [projectId]);

  const loadFiles = async (id: string) => {
    try {
      setLoading(true);
      const data = await projectApi.getFiles(id);
      setFiles(data);
    } catch (error) {
      console.error("Failed to load files:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadProject = async (id: string) => {
    try {
      const data = await projectApi.get(id);
      setProject(data);
    } catch (error) {
      console.error("Failed to load project:", error);
    }
  };

  const handleCopy = async () => {
    if (selectedFile?.content) {
      await navigator.clipboard.writeText(selectedFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const filteredFiles = searchQuery
    ? files.filter((f) => f.path.toLowerCase().includes(searchQuery.toLowerCase()))
    : files;

  const fileTree = buildFileTree(filteredFiles);

  if (!projectId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">No Project Selected</h1>
          <Link
            to="/dashboard"
            className="text-primary hover:text-primary/80 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-surface border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </Link>
            <div className="h-6 w-px bg-gray-700" />
            <div>
              <h1 className="text-xl font-semibold text-white">{project?.name || projectName}</h1>
              <p className="text-sm text-gray-400">{files.length} files in project</p>
            </div>
          </div>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-background border border-gray-700 rounded-md text-white text-sm focus:border-primary focus:outline-none w-64"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* File Tree Sidebar */}
        <div className="w-72 bg-surface border-r border-gray-800 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
            </div>
          ) : fileTree.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No files found</div>
          ) : (
            <div className="py-2">
              {fileTree.map((node) => (
                <FileTreeItem
                  key={node.path}
                  node={node}
                  depth={0}
                  onSelect={setSelectedFile}
                  selectedPath={selectedFile?.path || null}
                />
              ))}
            </div>
          )}
        </div>

        {/* Code Viewer */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {selectedFile ? (
            <>
              {/* File Header */}
              <div className="bg-surface border-b border-gray-800 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-white font-medium">{selectedFile.path}</span>
                </div>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>

              {/* Code Content */}
              <div className="flex-1 overflow-auto bg-[#1e1e2e]">
                <Highlight
                  theme={themes.vsDark}
                  code={selectedFile.content || ""}
                  language={getLanguageFromPath(selectedFile.path)}
                >
                  {({ className, style, tokens, getLineProps, getTokenProps }) => (
                    <pre
                      className={`${className} text-sm leading-relaxed p-4 min-h-full`}
                      style={{ ...style, margin: 0, background: "transparent" }}
                    >
                      {tokens.map((line, i) => (
                        <div key={i} {...getLineProps({ line })} className="flex">
                          <span className="select-none text-gray-600 text-right w-10 pr-4 flex-shrink-0">
                            {i + 1}
                          </span>
                          <span>
                            {line.map((token, key) => (
                              <span key={key} {...getTokenProps({ token })} />
                            ))}
                          </span>
                        </div>
                      ))}
                    </pre>
                  )}
                </Highlight>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-[#1e1e2e]">
              <div className="text-center text-gray-500">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Select a file to view its contents</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilesPage;
