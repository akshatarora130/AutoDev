/**
 * Project Analyzer Agent
 * Analyzes project structure and generates autodev.config.json with commands
 */

import { PrismaClient } from "@prisma/client";
import { BaseAgent } from "./baseAgent.js";
import { eventBus } from "../redis/eventBus.js";

const prisma = new PrismaClient();

export interface LanguageInfo {
  language: string; // "typescript", "python", "java", "go", "rust", etc.
  runtime?: string; // "node", "python3", "java", "go", etc.
  packageManager?: string; // "npm", "pip", "maven", "go", "cargo", etc.
  frameworks: string[];
  dependencies: string[];
  directory: string; // Where this language is located
  type: "frontend" | "backend" | "shared";
}

export interface ProjectConfig {
  type: "monorepo" | "frontend" | "backend" | "fullstack";
  languages: LanguageInfo[]; // Multiple languages supported
  commands: {
    install: string[];
    build: Record<string, string>;
    lint: Record<string, string>;
    test: {
      unit?: string;
      integration?: string;
      e2e?: string;
    };
    start: {
      dev: string;
      prod?: string;
    };
  };
  structure: {
    frontend?: string;
    backend?: string;
    shared?: string;
  };
  frameworks: string[];
  dependencies: string[];
}

export class ProjectAnalyzerAgent extends BaseAgent {
  constructor(projectId: string) {
    super(projectId, "PROJECT_ANALYZER");
  }

  /**
   * Analyze project and generate configuration using LLM
   */
  async execute(): Promise<ProjectConfig> {
    await this.log("PROJECT_ANALYSIS_STARTED", { projectId: this.projectId });

    // Get all project files
    const files = await prisma.file.findMany({
      where: { projectId: this.projectId },
      select: { path: true, content: true },
      take: 500, // Limit for LLM context
    });

    // Use LLM to analyze project structure and detect languages
    const analysis = await this.analyzeWithLLM(files);

    // Generate config using LLM
    const config = await this.generateConfigWithLLM(analysis, files);

    // Save config as a special file
    await this.saveConfig(config);

    await this.log("PROJECT_ANALYSIS_COMPLETED", {
      projectId: this.projectId,
      type: config.type,
      languages: config.languages.map((l) => l.language),
      frameworks: config.frameworks,
    });

    eventBus.publish("PROJECT_ANALYZED", {
      projectId: this.projectId,
      type: config.type,
      packageManager: config.languages[0]?.packageManager || "unknown",
    });

    return config;
  }

  /**
   * Analyze project structure using LLM to detect languages and frameworks
   */
  private async analyzeWithLLM(files: Array<{ path: string; content: string }>): Promise<{
    type: "monorepo" | "frontend" | "backend" | "fullstack";
    languages: LanguageInfo[];
    structure: {
      frontend?: string;
      backend?: string;
      shared?: string;
    };
  }> {
    // Prepare file summary for LLM (include key files only)
    const fileSummary = files
      .filter((f) => {
        const path = f.path.toLowerCase();
        return (
          path.includes("package.json") ||
          path.includes("requirements.txt") ||
          path.includes("pom.xml") ||
          path.includes("go.mod") ||
          path.includes("cargo.toml") ||
          path.includes("pyproject.toml") ||
          path.includes("setup.py") ||
          path.includes("tsconfig.json") ||
          path.includes("vite.config") ||
          path.includes("next.config") ||
          path.includes("dockerfile") ||
          path.includes("docker-compose") ||
          path.endsWith(".py") ||
          path.endsWith(".ts") ||
          path.endsWith(".tsx") ||
          path.endsWith(".js") ||
          path.endsWith(".jsx") ||
          path.endsWith(".java") ||
          path.endsWith(".go") ||
          path.endsWith(".rs")
        );
      })
      .slice(0, 100) // Limit to 100 files for context
      .map((f) => ({
        path: f.path,
        preview: f.content.substring(0, 500), // First 500 chars
      }));

    const analysisPrompt = `You are an expert software architect. Analyze this project structure and detect all programming languages, frameworks, and project organization.

PROJECT FILES:
${JSON.stringify(fileSummary, null, 2)}

Analyze and return JSON:
{
  "type": "monorepo" | "frontend" | "backend" | "fullstack",
  "languages": [
    {
      "language": "typescript" | "python" | "java" | "go" | "rust" | "javascript" | "other",
      "runtime": "node" | "python3" | "java" | "go" | "cargo" | "other",
      "packageManager": "npm" | "yarn" | "pnpm" | "bun" | "pip" | "poetry" | "maven" | "gradle" | "go" | "cargo" | "other",
      "frameworks": ["list of frameworks detected"],
      "dependencies": ["list of key dependencies"],
      "directory": "path/to/language/directory or . for root",
      "type": "frontend" | "backend" | "shared"
    }
  ],
  "structure": {
    "frontend": "path/to/frontend or null",
    "backend": "path/to/backend or null",
    "shared": "path/to/shared or null"
  }
}

DETECTION RULES:
1. Check file extensions (.py = Python, .ts/.tsx = TypeScript, .java = Java, .go = Go, .rs = Rust)
2. Check for config files (package.json, requirements.txt, pom.xml, go.mod, Cargo.toml, etc.)
3. Detect frameworks from dependencies and file patterns:
   - Express.js, Fastify, Koa, Hono = Backend TypeScript/JavaScript
   - React, Vue, Next.js = Frontend TypeScript/JavaScript
   - Django, Flask, FastAPI = Backend Python
   - Spring Boot, Quarkus = Backend Java
4. Identify project structure:
   - "monorepo" if multiple languages in separate directories
   - "fullstack" if frontend + backend in same or different directories
   - "backend" if only backend code
   - "frontend" if only frontend code
5. Determine package managers from lock files and config files
6. Map directories to languages - use actual directory paths, not "." unless truly at root
7. **CRITICAL**: Look at actual code files, not just config files. An Express.js server in TypeScript should be detected as backend TypeScript, not Python/Django

Return ONLY valid JSON, no markdown, no explanations:`;

    const analysis = await this.callLLMJSON<{
      type: "monorepo" | "frontend" | "backend" | "fullstack";
      languages: LanguageInfo[];
      structure: {
        frontend?: string | null;
        backend?: string | null;
        shared?: string | null;
      };
    }>(analysisPrompt, {
      model: process.env.LLM_MODEL,
    });

    // Clean up structure (remove null values)
    const structure: ProjectConfig["structure"] = {};
    if (analysis.structure.frontend) structure.frontend = analysis.structure.frontend;
    if (analysis.structure.backend) structure.backend = analysis.structure.backend;
    if (analysis.structure.shared) structure.shared = analysis.structure.shared;

    return {
      type: analysis.type,
      languages: analysis.languages,
      structure,
    };
  }

  /**
   * Legacy method - kept for reference but not used
   */
  private async analyzeStructure(files: Array<{ path: string; content: string }>): Promise<{
    hasFrontend: boolean;
    hasBackend: boolean;
    isMonorepo: boolean;
    packageJsons: Array<{ path: string; content: Record<string, unknown> }>;
    frameworks: string[];
    packageManager: string;
    folderStructure: string[];
  }> {
    const packageJsons: Array<{ path: string; content: Record<string, unknown> }> = [];
    let hasFrontend = false;
    let hasBackend = false;
    let isMonorepo = false;
    const frameworks: Set<string> = new Set();
    let packageManager = "npm";
    const folderStructure: Set<string> = new Set();

    for (const file of files) {
      // Track folder structure (first level directories)
      const parts = file.path.split("/");
      if (parts.length > 1) {
        folderStructure.add(parts[0]);
      }

      // Detect package.json files
      if (file.path.endsWith("package.json")) {
        try {
          const pkg = JSON.parse(file.content);
          packageJsons.push({ path: file.path, content: pkg });

          // Check for workspaces (monorepo)
          if (pkg.workspaces) {
            isMonorepo = true;
          }

          // Detect frameworks from dependencies
          const allDeps = {
            ...(pkg.dependencies || {}),
            ...(pkg.devDependencies || {}),
          };

          if (allDeps.react) frameworks.add("react");
          if (allDeps.vue) frameworks.add("vue");
          if (allDeps.next) frameworks.add("nextjs");
          if (allDeps.express) {
            frameworks.add("express");
            hasBackend = true;
          }
          if (allDeps.fastify) {
            frameworks.add("fastify");
            hasBackend = true;
          }
          if (allDeps.koa) {
            frameworks.add("koa");
            hasBackend = true;
          }
          if (allDeps.hono) {
            frameworks.add("hono");
            hasBackend = true;
          }
          if (allDeps["@prisma/client"]) frameworks.add("prisma");
          if (allDeps.tailwindcss) frameworks.add("tailwind");
          if (allDeps.playwright) frameworks.add("playwright");
          if (allDeps.jest) frameworks.add("jest");
          if (allDeps.vitest) frameworks.add("vitest");

          // Detect if this is a backend package.json based on common patterns
          const scripts = pkg.scripts as Record<string, string> | undefined;
          if (scripts) {
            const scriptStr = JSON.stringify(scripts).toLowerCase();
            if (
              scriptStr.includes("node ") ||
              scriptStr.includes("ts-node") ||
              scriptStr.includes("nodemon") ||
              scriptStr.includes("server")
            ) {
              hasBackend = true;
            }
          }
        } catch {
          // Invalid JSON, skip
        }
      }

      // Detect package manager from lock files
      if (file.path.includes("bun.lockb") || file.path.includes("bun.lock")) {
        packageManager = "bun";
      } else if (file.path.includes("yarn.lock") && packageManager !== "bun") {
        packageManager = "yarn";
      } else if (file.path.includes("pnpm-lock.yaml") && packageManager !== "bun") {
        packageManager = "pnpm";
      }

      // Detect frontend/backend by path - expanded patterns
      const lowerPath = file.path.toLowerCase();
      if (
        lowerPath.includes("/frontend/") ||
        lowerPath.includes("/client/") ||
        lowerPath.includes("/web/") ||
        lowerPath.includes("/app/") ||
        lowerPath.startsWith("frontend/") ||
        lowerPath.startsWith("client/")
      ) {
        hasFrontend = true;
      }
      if (
        lowerPath.includes("/backend/") ||
        lowerPath.includes("/server/") ||
        lowerPath.includes("/api/") ||
        lowerPath.includes("/src/routes/") ||
        lowerPath.includes("/src/controllers/") ||
        lowerPath.startsWith("backend/") ||
        lowerPath.startsWith("server/")
      ) {
        hasBackend = true;
      }

      // Detect by file types/content
      if (file.path.endsWith(".tsx") || file.path.endsWith(".jsx")) {
        hasFrontend = true;
      }

      // Detect backend by Node.js server patterns
      if (file.path.endsWith(".ts") || file.path.endsWith(".js")) {
        const content = file.content.toLowerCase();
        if (
          content.includes("express()") ||
          content.includes("createserver") ||
          content.includes("app.listen") ||
          content.includes("fastify(")
        ) {
          hasBackend = true;
        }
      }
    }

    // If still no clear type, determine from file extensions ratio
    if (!hasFrontend && !hasBackend && files.length > 0) {
      const tsxJsxCount = files.filter(
        (f) => f.path.endsWith(".tsx") || f.path.endsWith(".jsx")
      ).length;
      const tsJsCount = files.filter(
        (f) => f.path.endsWith(".ts") || f.path.endsWith(".js")
      ).length;

      // If mostly .tsx/.jsx files, it's frontend. Otherwise check for backend patterns
      if (tsxJsxCount > tsJsCount * 0.3) {
        hasFrontend = true;
      } else if (frameworks.has("express") || frameworks.has("fastify") || frameworks.has("koa")) {
        hasBackend = true;
      }
    }

    return {
      hasFrontend,
      hasBackend,
      isMonorepo,
      packageJsons,
      frameworks: Array.from(frameworks),
      packageManager,
      folderStructure: Array.from(folderStructure),
    };
  }

  /**
   * Generate project configuration using LLM to create appropriate commands
   */
  private async generateConfigWithLLM(
    analysis: Awaited<ReturnType<typeof this.analyzeWithLLM>>,
    files: Array<{ path: string; content: string }>
  ): Promise<ProjectConfig> {
    // Get key config files for context
    const configFiles = files
      .filter((f) => {
        const path = f.path.toLowerCase();
        return (
          path.includes("package.json") ||
          path.includes("requirements.txt") ||
          path.includes("pom.xml") ||
          path.includes("go.mod") ||
          path.includes("cargo.toml") ||
          path.includes("pyproject.toml") ||
          path.includes("setup.py") ||
          path.includes("tsconfig.json") ||
          path.includes("vite.config") ||
          path.includes("next.config")
        );
      })
      .slice(0, 20)
      .map((f) => ({ path: f.path, content: f.content.substring(0, 1000) }));

    const commandPrompt = `You are an expert DevOps engineer. Generate appropriate commands for this project based on detected languages and frameworks.

PROJECT ANALYSIS:
${JSON.stringify(analysis, null, 2)}

CONFIG FILES:
${JSON.stringify(configFiles, null, 2)}

Generate commands for each detected language. Return JSON with FLAT structure (NOT nested by frontend/backend):
{
  "commands": {
    "install": ["command1", "command2", ...],
    "build": {
      "main": "command for main build",
      "frontend": "command for frontend build (if exists)",
      "backend": "command for backend build (if exists)"
    },
    "lint": {
      "main": "command for linting",
      "frontend": "command for frontend lint (if exists)",
      "backend": "command for backend lint (if exists)"
    },
    "test": {
      "unit": "command for unit tests with directory changes",
      "integration": "command for integration tests (optional)",
      "e2e": "command for e2e tests (optional)"
    },
    "start": {
      "dev": "command to start dev server",
      "prod": "command to start production server (optional)"
    }
  }
}

CRITICAL: The commands structure must be FLAT. Do NOT nest by "frontend" or "backend". Use labels in build/lint objects instead.

COMMAND GENERATION RULES:
1. **Install commands**: 
   - TypeScript/JavaScript: "npm install" or "yarn install" or "pnpm install" or "bun install"
   - Python: "pip install -r requirements.txt" or "poetry install" or "pipenv install"
   - Java: "mvn install" or "gradle build"
   - Go: "go mod download" or "go get ./..."
   - Rust: "cargo build"
   - Include directory changes: "cd backend && pip install -r requirements.txt"

2. **Build commands**:
   - TypeScript/JavaScript: "npm run build" or "yarn build" (check package.json scripts)
   - Python: Usually no build, but "python setup.py build" if setup.py exists
   - Java: "mvn package" or "gradle build"
   - Go: "go build ./..."
   - Rust: "cargo build --release"
   - Include directory changes: "cd frontend && npm run build"

3. **Lint commands**:
   - TypeScript/JavaScript: "npm run lint" or "eslint ." or "prettier --check ."
   - Python: "pylint ." or "flake8 ." or "black --check ."
   - Java: "mvn checkstyle:check"
   - Go: "golangci-lint run"
   - Rust: "cargo clippy"
   - Include directory changes: "cd backend && pylint ."

4. **Test commands**:
   - TypeScript/JavaScript: "npm test" or "jest" or "vitest"
   - Python: "pytest" or "python -m pytest" or "python -m unittest"
   - Java: "mvn test" or "gradle test"
   - Go: "go test ./..."
   - Rust: "cargo test"
   - Include directory changes: "cd backend && pytest" or "cd backend && python -m pytest"

5. **Start commands**:
   - TypeScript/JavaScript: "npm run dev" or "npm start"
   - Python: "python app.py" or "uvicorn main:app --reload" or "flask run"
   - Java: "mvn spring-boot:run" or "java -jar target/app.jar"
   - Go: "go run main.go"
   - Rust: "cargo run"
   - Include directory changes: "cd backend && python app.py"

6. **Directory changes**: Always use "cd directory && command" format when needed
7. **Multiple languages**: Generate separate commands for each language/directory
8. **Monorepo**: Generate commands for each part (frontend, backend, etc.)

Return ONLY valid JSON, no markdown, no explanations:`;

    const commandResult = await this.callLLMJSON<{
      commands: {
        install: string[];
        build: Record<string, string>;
        lint: Record<string, string>;
        test: {
          unit?: string;
          integration?: string;
          e2e?: string;
        };
        start: {
          dev: string;
          prod?: string;
        };
      };
    }>(commandPrompt, {
      model: process.env.LLM_MODEL,
    });

    // Validate and fix command structure - ensure it's flat, not nested
    const fixedCommands = this.fixCommandStructure(commandResult.commands, analysis);

    // Collect all frameworks and dependencies
    const allFrameworks = new Set<string>();
    const allDependencies = new Set<string>();
    for (const lang of analysis.languages) {
      lang.frameworks.forEach((f) => allFrameworks.add(f));
      lang.dependencies.forEach((d) => allDependencies.add(d));
    }

    return {
      type: analysis.type,
      languages: analysis.languages,
      commands: fixedCommands,
      structure: analysis.structure,
      frameworks: Array.from(allFrameworks),
      dependencies: Array.from(allDependencies),
    };
  }

  /**
   * Fix command structure to ensure it's flat (not nested by frontend/backend)
   */
  private fixCommandStructure(
    commands: {
      install: string[];
      build: Record<string, string>;
      lint: Record<string, string>;
      test: {
        unit?: string;
        integration?: string;
        e2e?: string;
      };
      start: {
        dev: string;
        prod?: string;
      };
    },
    analysis: Awaited<ReturnType<typeof this.analyzeWithLLM>>
  ): ProjectConfig["commands"] {
    // If commands are nested incorrectly, flatten them
    const fixed: ProjectConfig["commands"] = {
      install: Array.isArray(commands.install) ? commands.install : [],
      build: {},
      lint: {},
      test: {
        unit: commands.test?.unit,
        integration: commands.test?.integration,
        e2e: commands.test?.e2e,
      },
      start: {
        dev: commands.start?.dev || "npm run dev",
        prod: commands.start?.prod,
      },
    };

    // Fix build commands - ensure flat structure
    if (commands.build) {
      // If nested, extract
      if ("frontend" in commands.build && typeof commands.build.frontend === "object") {
        // Nested structure detected, flatten it
        const nested = commands.build.frontend as Record<string, string>;
        fixed.build = { ...nested };
      } else {
        fixed.build = commands.build;
      }
    }

    // Fix lint commands - ensure flat structure
    if (commands.lint) {
      if ("frontend" in commands.lint && typeof commands.lint.frontend === "object") {
        const nested = commands.lint.frontend as Record<string, string>;
        fixed.lint = { ...nested };
      } else {
        fixed.lint = commands.lint;
      }
    }

    // If build/lint are empty, generate defaults based on languages
    if (Object.keys(fixed.build).length === 0) {
      for (const lang of analysis.languages) {
        const dir = lang.directory === "." ? "" : `cd ${lang.directory} && `;
        if (lang.language === "typescript" || lang.language === "javascript") {
          const pm = lang.packageManager || "npm";
          const runCmd = pm === "npm" ? "npm run" : `${pm} run`;
          fixed.build[lang.type] = dir ? `${dir}${runCmd} build` : `${runCmd} build`;
        } else if (lang.language === "python") {
          fixed.build[lang.type] = dir ? `${dir}python setup.py build` : "python setup.py build";
        }
      }
      if (Object.keys(fixed.build).length === 0) {
        fixed.build.main = "npm run build";
      }
    }

    if (Object.keys(fixed.lint).length === 0) {
      for (const lang of analysis.languages) {
        const dir = lang.directory === "." ? "" : `cd ${lang.directory} && `;
        if (lang.language === "typescript" || lang.language === "javascript") {
          fixed.lint[lang.type] = dir ? `${dir}eslint .` : "eslint .";
        } else if (lang.language === "python") {
          fixed.lint[lang.type] = dir ? `${dir}pylint .` : "pylint .";
        }
      }
      if (Object.keys(fixed.lint).length === 0) {
        fixed.lint.main = "npm run lint";
      }
    }

    return fixed;
  }

  // Legacy methods removed - now using LLM-based generation

  /**
   * Save configuration to project files
   */
  private async saveConfig(config: ProjectConfig): Promise<void> {
    const configContent = JSON.stringify(config, null, 2);

    await prisma.file.upsert({
      where: {
        projectId_path: {
          projectId: this.projectId,
          path: "autodev.config.json",
        },
      },
      create: {
        projectId: this.projectId,
        path: "autodev.config.json",
        content: configContent,
        encoding: "utf-8",
        size: Buffer.byteLength(configContent, "utf-8"),
      },
      update: {
        content: configContent,
        size: Buffer.byteLength(configContent, "utf-8"),
        updatedAt: new Date(),
      },
    });
  }
}

export default ProjectAnalyzerAgent;
