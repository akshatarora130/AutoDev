/**
 * Project Analyzer Agent
 * Analyzes project structure and generates autodev.config.json with commands
 */

import { PrismaClient } from "@prisma/client";
import { BaseAgent } from "./baseAgent.js";
import { eventBus } from "../redis/eventBus.js";

const prisma = new PrismaClient();

export interface ProjectConfig {
  type: "monorepo" | "frontend" | "backend" | "fullstack";
  packageManager: "npm" | "bun" | "yarn" | "pnpm";
  commands: {
    install: string[];
    build: Record<string, string>;
    lint: string;
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
   * Analyze project and generate configuration
   */
  async execute(): Promise<ProjectConfig> {
    await this.log("PROJECT_ANALYSIS_STARTED", { projectId: this.projectId });

    // Get all project files
    const files = await prisma.file.findMany({
      where: { projectId: this.projectId },
      select: { path: true, content: true },
    });

    // Analyze project structure
    const analysis = await this.analyzeStructure(files);

    // Generate config
    const config = await this.generateConfig(analysis, files);

    // Save config as a special file
    await this.saveConfig(config);

    await this.log("PROJECT_ANALYSIS_COMPLETED", {
      projectId: this.projectId,
      type: config.type,
      frameworks: config.frameworks,
    });

    eventBus.publish("PROJECT_ANALYZED", {
      projectId: this.projectId,
      type: config.type,
      packageManager: config.packageManager,
    });

    return config;
  }

  /**
   * Analyze project structure from files
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
          if (allDeps.express) { frameworks.add("express"); hasBackend = true; }
          if (allDeps.fastify) { frameworks.add("fastify"); hasBackend = true; }
          if (allDeps.koa) { frameworks.add("koa"); hasBackend = true; }
          if (allDeps.hono) { frameworks.add("hono"); hasBackend = true; }
          if (allDeps["@prisma/client"]) frameworks.add("prisma");
          if (allDeps.tailwindcss) frameworks.add("tailwind");
          if (allDeps.playwright) frameworks.add("playwright");
          if (allDeps.jest) frameworks.add("jest");
          if (allDeps.vitest) frameworks.add("vitest");

          // Detect if this is a backend package.json based on common patterns
          const scripts = pkg.scripts as Record<string, string> | undefined;
          if (scripts) {
            const scriptStr = JSON.stringify(scripts).toLowerCase();
            if (scriptStr.includes("node ") || scriptStr.includes("ts-node") || 
                scriptStr.includes("nodemon") || scriptStr.includes("server")) {
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
        if (content.includes("express()") || content.includes("createserver") ||
            content.includes("app.listen") || content.includes("fastify(")) {
          hasBackend = true;
        }
      }
    }

    // If still no clear type, determine from file extensions ratio
    if (!hasFrontend && !hasBackend && files.length > 0) {
      const tsxJsxCount = files.filter(f => f.path.endsWith(".tsx") || f.path.endsWith(".jsx")).length;
      const tsJsCount = files.filter(f => f.path.endsWith(".ts") || f.path.endsWith(".js")).length;
      
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
   * Generate project configuration
   */
  private async generateConfig(
    analysis: Awaited<ReturnType<typeof this.analyzeStructure>>,
    files: Array<{ path: string; content: string }>
  ): Promise<ProjectConfig> {
    const { hasFrontend, hasBackend, isMonorepo, packageJsons, frameworks, packageManager } =
      analysis;

    // Determine project type
    let type: ProjectConfig["type"] = "frontend";
    if (isMonorepo) {
      type = "monorepo";
    } else if (hasFrontend && hasBackend) {
      type = "fullstack";
    } else if (hasBackend) {
      type = "backend";
    }

    // Detect structure paths
    const structure: ProjectConfig["structure"] = {};
    for (const file of files) {
      if (file.path.includes("/frontend/") && !structure.frontend) {
        structure.frontend = file.path.split("/frontend/")[0] + "/frontend";
      }
      if (file.path.includes("/backend/") && !structure.backend) {
        structure.backend = file.path.split("/backend/")[0] + "/backend";
      }
    }

    // Generate commands based on analysis
    const pm = packageManager as "npm" | "bun" | "yarn" | "pnpm";
    const runCmd = pm === "npm" ? "npm run" : `${pm} run`;

    const commands: ProjectConfig["commands"] = {
      install: this.generateInstallCommands(type, pm, structure),
      build: this.generateBuildCommands(type, runCmd, structure, packageJsons),
      lint: `${runCmd} lint`,
      test: this.generateTestCommands(runCmd, frameworks),
      start: {
        dev: `${runCmd} dev`,
        prod: `${runCmd} start`,
      },
    };

    // Collect main dependencies
    const dependencies: string[] = [];
    for (const pkg of packageJsons) {
      const deps = pkg.content.dependencies as Record<string, string> | undefined;
      if (deps) {
        dependencies.push(...Object.keys(deps).slice(0, 20)); // Top 20
      }
    }

    return {
      type,
      packageManager: pm,
      commands,
      structure,
      frameworks,
      dependencies: [...new Set(dependencies)],
    };
  }

  /**
   * Generate install commands
   */
  private generateInstallCommands(
    type: ProjectConfig["type"],
    pm: string,
    structure: ProjectConfig["structure"]
  ): string[] {
    const installCmd = pm === "npm" ? "npm install" : `${pm} install`;

    if (type === "monorepo") {
      return [installCmd]; // Root install handles all
    }

    const commands: string[] = [];

    if (structure.frontend) {
      commands.push(`cd ${structure.frontend} && ${installCmd}`);
    }
    if (structure.backend) {
      commands.push(`cd ${structure.backend} && ${installCmd}`);
    }

    if (commands.length === 0) {
      commands.push(installCmd);
    }

    return commands;
  }

  /**
   * Generate build commands
   */
  private generateBuildCommands(
    type: ProjectConfig["type"],
    runCmd: string,
    structure: ProjectConfig["structure"],
    packageJsons: Array<{ path: string; content: Record<string, unknown> }>
  ): Record<string, string> {
    const buildCmds: Record<string, string> = {};

    // Check for build scripts in package.jsons
    for (const pkg of packageJsons) {
      const scripts = pkg.content.scripts as Record<string, string> | undefined;
      if (scripts?.build) {
        const dir = pkg.path.replace("/package.json", "") || ".";
        const label = dir.includes("frontend")
          ? "frontend"
          : dir.includes("backend")
            ? "backend"
            : "main";
        buildCmds[label] = dir === "." ? `${runCmd} build` : `cd ${dir} && ${runCmd} build`;
      }
    }

    if (Object.keys(buildCmds).length === 0) {
      buildCmds.main = `${runCmd} build`;
    }

    return buildCmds;
  }

  /**
   * Generate test commands
   */
  private generateTestCommands(
    runCmd: string,
    frameworks: string[]
  ): ProjectConfig["commands"]["test"] {
    const testCmds: ProjectConfig["commands"]["test"] = {};

    if (frameworks.includes("jest") || frameworks.includes("vitest")) {
      testCmds.unit = `${runCmd} test`;
    }

    if (frameworks.includes("playwright")) {
      testCmds.e2e = `npx playwright test`;
    }

    if (Object.keys(testCmds).length === 0) {
      testCmds.unit = `${runCmd} test`;
    }

    return testCmds;
  }

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
