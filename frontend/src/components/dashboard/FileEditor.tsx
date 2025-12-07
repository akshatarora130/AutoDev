import { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { Save, GitCommit } from "lucide-react";
import { Button } from "../common/Button";
import { Input } from "../common/Input";
import { Loader } from "../common/Loader";
import { githubApi } from "../../utils/api";
import type { Repository } from "../../types";

interface FileEditorProps {
  repo: Repository;
  filePath: string | null;
  onFileChange?: (path: string, hasChanges: boolean) => void;
}

interface FileState {
  content: string;
  originalContent: string;
  language: string;
  loaded: boolean;
}

export const FileEditor = ({ repo, filePath, onFileChange }: FileEditorProps) => {
  // Store file states per file path
  const fileStatesRef = useRef<Map<string, FileState>>(new Map());
  const [currentFileState, setCurrentFileState] = useState<FileState | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [commitMessage, setCommitMessage] = useState("");

  const loadFile = async () => {
    if (!filePath) return;

    try {
      setLoading(true);
      const [owner, repoName] = repo.full_name.split("/");
      const fileData = await githubApi.getFileContent(
        owner,
        repoName,
        filePath,
        repo.default_branch
      );

      // Decode base64 content
      let fileContent = "";
      if (fileData.encoding === "base64") {
        try {
          // Standard base64 decode
          fileContent = atob(fileData.content);
        } catch (e) {
          // Fallback for binary files or encoding issues
          fileContent = `// Error: Unable to decode file content\n// This file may be binary or have encoding issues`;
        }
      } else {
        fileContent = fileData.content || "";
      }

      // Detect language from file extension
      const ext = filePath.split(".").pop()?.toLowerCase() || "";
      const languageMap: Record<string, string> = {
        ts: "typescript",
        tsx: "typescript",
        js: "javascript",
        jsx: "javascript",
        json: "json",
        css: "css",
        html: "html",
        md: "markdown",
        py: "python",
        java: "java",
        cpp: "cpp",
        c: "c",
        go: "go",
        rs: "rust",
        php: "php",
        rb: "ruby",
        sh: "shell",
        yml: "yaml",
        yaml: "yaml",
        xml: "xml",
        sql: "sql",
      };

      const fileState: FileState = {
        content: fileContent,
        originalContent: fileContent,
        language: languageMap[ext] || "plaintext",
        loaded: true,
      };

      // Store in map
      fileStatesRef.current.set(filePath, fileState);
      setCurrentFileState(fileState);
    } catch (error: any) {
      console.error("Failed to load file:", error);
      const errorState: FileState = {
        content: `// Error loading file: ${error.response?.data?.error || error.message}`,
        originalContent: "",
        language: "plaintext",
        loaded: true,
      };
      fileStatesRef.current.set(filePath, errorState);
      setCurrentFileState(errorState);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (filePath) {
      // Check if file is already loaded
      const existingState = fileStatesRef.current.get(filePath);
      if (existingState && existingState.loaded) {
        setCurrentFileState(existingState);
      } else {
        loadFile();
      }
    } else {
      setCurrentFileState(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filePath, repo]);

  // Notify parent about changes
  useEffect(() => {
    if (filePath && currentFileState) {
      const hasChanges = currentFileState.content !== currentFileState.originalContent;
      onFileChange?.(filePath, hasChanges);
    }
  }, [filePath, currentFileState, onFileChange]);

  const handleContentChange = (value: string | undefined) => {
    if (!filePath || !currentFileState) return;

    const updatedState: FileState = {
      ...currentFileState,
      content: value || "",
    };

    fileStatesRef.current.set(filePath, updatedState);
    setCurrentFileState(updatedState);
  };

  const handleSave = async () => {
    if (!filePath || !currentFileState || !commitMessage.trim()) {
      alert("Please enter a commit message");
      return;
    }

    try {
      setSaving(true);
      const [owner, repoName] = repo.full_name.split("/");

      // Encode content to base64
      const encodedContent = btoa(unescape(encodeURIComponent(currentFileState.content)));

      await githubApi.commitFiles({
        owner,
        repo: repoName,
        branch: repo.default_branch,
        message: commitMessage,
        files: [
          {
            path: filePath,
            content: encodedContent,
            encoding: "base64",
          },
        ],
      });

      // Update original content to match current content
      const updatedState: FileState = {
        ...currentFileState,
        originalContent: currentFileState.content,
      };

      fileStatesRef.current.set(filePath, updatedState);
      setCurrentFileState(updatedState);
      setCommitMessage("");
      alert("File saved and committed successfully!");
    } catch (error: any) {
      console.error("Failed to save file:", error);
      alert(error.response?.data?.error || "Failed to save file");
    } finally {
      setSaving(false);
    }
  };

  if (!filePath) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center opacity-50">
          <p className="text-sm text-text-muted">Select a file to edit</p>
        </div>
      </div>
    );
  }

  if (loading || !currentFileState) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <Loader text="Loading file..." />
      </div>
    );
  }

  const hasChanges = currentFileState.content !== currentFileState.originalContent;

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={currentFileState.language}
          value={currentFileState.content}
          onChange={handleContentChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: true },
            fontSize: 14,
            wordWrap: "on",
            automaticLayout: true,
            scrollBeyondLastLine: false,
            tabSize: 2,
            insertSpaces: true,
            formatOnPaste: true,
            formatOnType: true,
          }}
        />
      </div>

      {/* Footer with commit controls */}
      <div className="px-4 py-3 border-t border-white/5 bg-surface/50 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Input
              icon={<GitCommit className="w-3.5 h-3.5" />}
              placeholder="Enter commit message..."
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              className="bg-background border-white/10 text-xs py-1.5"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  handleSave();
                }
              }}
            />
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || !commitMessage.trim() || saving}
            className="flex items-center gap-2 shrink-0"
          >
            {saving ? (
              <>
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save & Commit</span>
              </>
            )}
          </Button>
        </div>
        {hasChanges && (
          <p className="text-xs text-text-muted mt-2">
            Press <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-xs">Cmd/Ctrl + Enter</kbd>{" "}
            to save
          </p>
        )}
      </div>
    </div>
  );
};
