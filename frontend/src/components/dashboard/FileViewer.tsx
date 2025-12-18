/**
 * FileViewer Component
 * Read-only syntax-highlighted file viewer with file tree
 */

import { useState, useEffect, useMemo } from "react";
import { Highlight, themes } from "prism-react-renderer";
import {
  X,
  FileCode,
  Folder,
  FolderOpen,
  ChevronRight,
  Copy,
  Check,
  Search,
  FileText,
} from "lucide-react";
import type { File } from "../../types";

interface FileViewerProps {
  projectId: string;
  files: File[];
  isOpen: boolean;
  onClose: () => void;
}

interface TreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children: TreeNode[];
  file?: File;
}

// Language detection from file extension
const getLanguage = (path: string): string => {
  const ext = path.split(".").pop()?.toLowerCase() || "";
  const langMap: Record<string, string> = {
    ts: "typescript",
    tsx: "tsx",
    js: "javascript",
    jsx: "jsx",
    py: "python",
    json: "json",
    md: "markdown",
    css: "css",
    scss: "scss",
    html: "html",
    sql: "sql",
    yaml: "yaml",
    yml: "yaml",
    prisma: "graphql",
    go: "go",
    rs: "rust",
    java: "java",
    c: "c",
    cpp: "cpp",
    sh: "bash",
    bash: "bash",
    zsh: "bash",
  };
  return langMap[ext] || "text";
};

// Build tree structure from flat file list
const buildFileTree = (files: File[]): TreeNode[] => {
  const root: TreeNode[] = [];

  for (const file of files) {
    const parts = file.path.split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const existingNode = current.find((n) => n.name === part);

      if (existingNode) {
        if (!isLast) {
          current = existingNode.children;
        }
      } else {
        const newNode: TreeNode = {
          name: part,
          path: parts.slice(0, i + 1).join("/"),
          isDirectory: !isLast,
          children: [],
          file: isLast ? file : undefined,
        };
        current.push(newNode);
        if (!isLast) {
          current = newNode.children;
        }
      }
    }
  }

  // Sort: directories first, then alphabetically
  const sortTree = (nodes: TreeNode[]): TreeNode[] => {
    return nodes
      .sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      })
      .map((node) => ({
        ...node,
        children: sortTree(node.children),
      }));
  };

  return sortTree(root);
};

export const FileViewer = ({ projectId: _projectId, files, isOpen, onClose }: FileViewerProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter files by search query
  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files;
    const query = searchQuery.toLowerCase();
    return files.filter(
      (f) => f.path.toLowerCase().includes(query) || f.content.toLowerCase().includes(query)
    );
  }, [files, searchQuery]);

  const filteredTree = useMemo(() => buildFileTree(filteredFiles), [filteredFiles]);

  // Auto-expand directories containing search results
  useEffect(() => {
    if (searchQuery.trim()) {
      const newExpanded = new Set<string>();
      filteredFiles.forEach((f) => {
        const parts = f.path.split("/");
        for (let i = 0; i < parts.length - 1; i++) {
          newExpanded.add(parts.slice(0, i + 1).join("/"));
        }
      });
      setExpandedDirs(newExpanded);
    }
  }, [searchQuery, filteredFiles]);

  // Toggle directory expansion
  const toggleDir = (path: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  // Copy file content to clipboard
  const copyToClipboard = async () => {
    if (!selectedFile) return;
    await navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative m-4 flex flex-1 overflow-hidden rounded-2xl border border-white/10 bg-surface shadow-2xl">
        {/* File Tree Sidebar */}
        <div className="w-72 flex-shrink-0 border-r border-white/5 flex flex-col bg-surface/50">
          {/* Header */}
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm text-text-primary flex items-center gap-2">
                <FileCode className="w-4 h-4 text-accent-primary" />
                Project Files
              </h3>
              <span className="text-xs text-text-muted bg-white/5 px-2 py-0.5 rounded-full">
                {files.length}
              </span>
            </div>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-xs text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-1 focus:ring-accent-primary/50"
              />
            </div>
          </div>

          {/* Tree */}
          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
            <FileTreeNode
              nodes={filteredTree}
              expandedDirs={expandedDirs}
              selectedPath={selectedFile?.path || null}
              onToggleDir={toggleDir}
              onSelectFile={setSelectedFile}
              depth={0}
            />
          </div>
        </div>

        {/* Code View */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-surface/30">
            {selectedFile ? (
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-text-muted flex-shrink-0" />
                <span className="text-sm text-text-primary truncate">{selectedFile.path}</span>
                <span className="text-xs text-text-muted bg-white/5 px-2 py-0.5 rounded">
                  {getLanguage(selectedFile.path)}
                </span>
              </div>
            ) : (
              <span className="text-sm text-text-muted">Select a file to view</span>
            )}
            <div className="flex items-center gap-2">
              {selectedFile && (
                <button
                  onClick={copyToClipboard}
                  className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
                  title="Copy content"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Code Content */}
          <div className="flex-1 overflow-auto custom-scrollbar bg-[#0d1117]">
            {selectedFile ? (
              <CodeHighlight
                code={selectedFile.content}
                language={getLanguage(selectedFile.path)}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-text-muted">
                <div className="text-center">
                  <FileCode className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Select a file from the tree to view its contents</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// File Tree Node Component
interface FileTreeNodeProps {
  nodes: TreeNode[];
  expandedDirs: Set<string>;
  selectedPath: string | null;
  onToggleDir: (path: string) => void;
  onSelectFile: (file: File) => void;
  depth: number;
}

const FileTreeNode = ({
  nodes,
  expandedDirs,
  selectedPath,
  onToggleDir,
  onSelectFile,
  depth,
}: FileTreeNodeProps) => {
  return (
    <div className="space-y-0.5">
      {nodes.map((node) => {
        const isExpanded = expandedDirs.has(node.path);
        const isSelected = selectedPath === node.path;

        return (
          <div key={node.path}>
            <button
              onClick={() => {
                if (node.isDirectory) {
                  onToggleDir(node.path);
                } else if (node.file) {
                  onSelectFile(node.file);
                }
              }}
              className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs transition-all ${
                isSelected
                  ? "bg-accent-primary/20 text-accent-primary"
                  : "text-text-muted hover:bg-white/5 hover:text-text-primary"
              }`}
              style={{ paddingLeft: `${depth * 12 + 8}px` }}
            >
              {node.isDirectory ? (
                <>
                  <ChevronRight
                    className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                  />
                  {isExpanded ? (
                    <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Folder className="w-3.5 h-3.5 text-amber-400" />
                  )}
                </>
              ) : (
                <>
                  <span className="w-3" />
                  <FileIcon filename={node.name} />
                </>
              )}
              <span className="truncate">{node.name}</span>
            </button>

            {node.isDirectory && isExpanded && node.children.length > 0 && (
              <FileTreeNode
                nodes={node.children}
                expandedDirs={expandedDirs}
                selectedPath={selectedPath}
                onToggleDir={onToggleDir}
                onSelectFile={onSelectFile}
                depth={depth + 1}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

// File icon based on extension
const FileIcon = ({ filename }: { filename: string }) => {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const colorMap: Record<string, string> = {
    ts: "text-blue-400",
    tsx: "text-blue-400",
    js: "text-yellow-400",
    jsx: "text-yellow-400",
    py: "text-green-400",
    json: "text-amber-400",
    md: "text-slate-400",
    css: "text-pink-400",
    html: "text-orange-400",
    prisma: "text-indigo-400",
  };
  return <FileText className={`w-3.5 h-3.5 ${colorMap[ext] || "text-text-muted"}`} />;
};

// Code syntax highlighting component
interface CodeHighlightProps {
  code: string;
  language: string;
}

const CodeHighlight = ({ code, language }: CodeHighlightProps) => {
  return (
    <Highlight theme={themes.nightOwl} code={code} language={language}>
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <pre className={`${className} p-4 text-sm leading-relaxed`} style={style}>
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })} className="table-row">
              <span className="table-cell pr-4 text-right text-text-muted/40 select-none w-12">
                {i + 1}
              </span>
              <span className="table-cell">
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </span>
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  );
};

export default FileViewer;
