/**
 * Test Executor Agent
 * Runs tests in Docker sandbox and reports results
 */

import { PrismaClient, type Task } from "@prisma/client";
import { BaseAgent } from "./baseAgent.js";
import { eventBus } from "../redis/eventBus.js";
import {
  sandboxService,
  type SandboxInstance,
  type CommandResult,
} from "../services/sandboxService.js";
import * as path from "path";
import * as fs from "fs/promises";
import * as os from "os";

const prisma = new PrismaClient();

export interface TestExecutionResult {
  passed: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  coverage?: number;
  duration: number;
  failures: Array<{
    testName: string;
    error: string;
    file?: string;
  }>;
  output: string;
}

export class TestExecutorAgent extends BaseAgent {
  constructor(projectId: string) {
    super(projectId, "TEST_EXECUTOR");
  }

  /**
   * Run tests for a task via Docker sandbox
   */
  async execute(taskId: string): Promise<TestExecutionResult> {
    await this.log("TEST_EXECUTION_STARTED", { taskId });

    // Get task
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    // Check if Docker is available
    const dockerAvailable = await sandboxService.isDockerAvailable();
    if (!dockerAvailable) {
      await this.log("DOCKER_NOT_AVAILABLE", { taskId });

      // Fail the tests - Docker is required for proper test execution
      const failResult: TestExecutionResult = {
        passed: false,
        totalTests: 0,
        passedTests: 0,
        failedTests: 1,
        skippedTests: 0,
        duration: 0,
        failures: [
          {
            testName: "Docker Availability Check",
            error: "Docker is not running. Please start Docker to run tests.",
          },
        ],
        output:
          "ERROR: Docker is not available. Tests cannot be executed without Docker.\n\nPlease ensure Docker Desktop is running and try again.",
      };

      // Save the failed result
      await this.saveTestResult(taskId, failResult);

      // Update task status
      await prisma.task.update({
        where: { id: taskId },
        data: { status: "failed" },
      });

      // Publish event
      eventBus.publish("TESTS_FAILED", {
        taskId,
        projectId: this.projectId,
        passed: false,
        totalTests: 0,
        failedTests: 1,
      });

      return failResult;
    }

    // Get project files and write to temp directory
    const workDir = await this.prepareWorkDirectory();

    let sandbox: SandboxInstance | null = null;
    let result: TestExecutionResult;

    try {
      // Create sandbox
      sandbox = await sandboxService.createSandbox({
        projectId: this.projectId,
        workDir,
        timeout: 10 * 60 * 1000, // 10 minutes max
      });

      await this.log("SANDBOX_CREATED", { taskId, sandboxId: sandbox.id });

      // Get project config for commands
      const config = await this.getProjectConfig();

      // Determine package manager from config (for install)
      const packageManager = this.determinePackageManager(config, task);

      // Install dependencies
      const installResult = await sandboxService.installDependencies(sandbox.id, packageManager);

      if (installResult.exitCode !== 0) {
        await this.log("INSTALL_FAILED", {
          taskId,
          stderr: installResult.stderr.slice(0, 500),
        });
        // Continue anyway, some tests might still work
      }

      // Determine correct test command based on task type and config
      const testCommand = this.getTestCommand(task, config);
      const testResult = await sandboxService.runTests(sandbox.id, testCommand, 180000);

      // Parse results
      result = this.parseTestOutput(testResult);

      // Store results in database
      await this.saveTestResult(taskId, result);

      // Update task status
      await prisma.task.update({
        where: { id: taskId },
        data: {
          status: result.passed ? "tests_passed" : "failed",
        },
      });

      await this.log("TEST_EXECUTION_COMPLETED", {
        taskId,
        passed: result.passed,
        total: result.totalTests,
        failed: result.failedTests,
        duration: result.duration,
      });

      eventBus.publish(result.passed ? "TESTS_PASSED" : "TESTS_FAILED", {
        taskId,
        projectId: this.projectId,
        passed: result.passed,
        totalTests: result.totalTests,
        failedTests: result.failedTests,
      });
    } catch (error) {
      await this.log("TEST_EXECUTION_ERROR", {
        taskId,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      result = {
        passed: false,
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        duration: 0,
        failures: [
          {
            testName: "Test Execution",
            error: error instanceof Error ? error.message : "Unknown error",
          },
        ],
        output: "",
      };

      await prisma.task.update({
        where: { id: taskId },
        data: { status: "failed" },
      });
    } finally {
      // Cleanup sandbox
      if (sandbox) {
        await sandboxService.destroySandbox(sandbox.id);
      }

      // Cleanup temp directory
      await this.cleanupWorkDirectory(workDir);
    }

    return result;
  }

  /**
   * Prepare work directory with project files
   */
  private async prepareWorkDirectory(): Promise<string> {
    const tempDir = path.join(os.tmpdir(), `autodev-${this.projectId}-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });

    // Get all project files
    const files = await prisma.file.findMany({
      where: { projectId: this.projectId },
    });

    // Write files to temp directory
    for (const file of files) {
      const filePath = path.join(tempDir, file.path);
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, file.content, "utf-8");
    }

    return tempDir;
  }

  /**
   * Cleanup work directory
   */
  private async cleanupWorkDirectory(workDir: string): Promise<void> {
    try {
      await fs.rm(workDir, { recursive: true, force: true });
    } catch (error) {
      console.error(`Failed to cleanup work directory: ${workDir}`, error);
    }
  }

  /**
   * Get project configuration
   */
  private async getProjectConfig(): Promise<{
    languages?: Array<{
      language: string;
      packageManager?: string;
      directory: string;
      type: "frontend" | "backend" | "shared";
    }>;
    type?: "monorepo" | "frontend" | "backend" | "fullstack";
    structure?: {
      frontend?: string;
      backend?: string;
      shared?: string;
    };
    commands: {
      test?: {
        unit?: string;
        integration?: string;
        e2e?: string;
      };
    };
  }> {
    const configFile = await prisma.file.findFirst({
      where: {
        projectId: this.projectId,
        path: "autodev.config.json",
      },
    });

    if (configFile) {
      try {
        return JSON.parse(configFile.content);
      } catch {
        // Invalid config
      }
    }

    // Default config
    return {
      commands: {
        test: { unit: "npm test" },
      },
    };
  }

  /**
   * Determine package manager from config based on task type
   */
  private determinePackageManager(
    config: Awaited<ReturnType<typeof this.getProjectConfig>>,
    task: Task
  ): "npm" | "bun" | "yarn" | "pnpm" {
    // Try to find package manager from languages array
    if (config.languages) {
      // Find language matching task type
      const matchingLang = config.languages.find(
        (lang) => lang.type === task.type || (task.type === "backend" && lang.type === "backend")
      );
      if (matchingLang?.packageManager) {
        const pm = matchingLang.packageManager.toLowerCase();
        if (pm === "npm" || pm === "yarn" || pm === "pnpm" || pm === "bun") {
          return pm as "npm" | "bun" | "yarn" | "pnpm";
        }
      }
      // Fallback to first language's package manager
      if (config.languages[0]?.packageManager) {
        const pm = config.languages[0].packageManager.toLowerCase();
        if (pm === "npm" || pm === "yarn" || pm === "pnpm" || pm === "bun") {
          return pm as "npm" | "bun" | "yarn" | "pnpm";
        }
      }
    }

    // Default to npm
    return "npm";
  }

  /**
   * Get appropriate test command based on task type and project structure
   */
  private getTestCommand(
    task: Task,
    config: Awaited<ReturnType<typeof this.getProjectConfig>>
  ): string {
    // If config has a test command, use it (it should already include directory changes)
    if (config.commands.test?.unit) {
      return config.commands.test.unit;
    }

    // Fallback: determine command based on task type and structure
    // Check if we can find a matching language for the task
    if (config.languages) {
      const matchingLang = config.languages.find(
        (lang) => lang.type === task.type || (task.type === "backend" && lang.type === "backend")
      );
      if (matchingLang) {
        // Generate command based on language
        const dir = matchingLang.directory === "." ? "" : `cd ${matchingLang.directory} && `;
        const pm = matchingLang.packageManager || "npm";

        if (matchingLang.language === "python") {
          return `${dir}python -m pytest`;
        } else if (matchingLang.language === "java") {
          return `${dir}mvn test`;
        } else if (matchingLang.language === "go") {
          return `${dir}go test ./...`;
        } else if (matchingLang.language === "rust") {
          return `${dir}cargo test`;
        } else {
          // TypeScript/JavaScript
          const runCmd = pm === "npm" ? "npm run" : `${pm} run`;
          return `${dir}${runCmd} test`;
        }
      }
    }

    // Fallback: use structure-based detection
    if (task.type === "backend" && config.structure?.backend) {
      return `cd ${config.structure.backend} && npm test`;
    } else if (task.type === "frontend" && config.structure?.frontend) {
      return `cd ${config.structure.frontend} && npm test`;
    } else if (config.type === "monorepo" || config.type === "fullstack") {
      if (config.structure?.backend) {
        return `cd ${config.structure.backend} && npm test`;
      } else if (config.structure?.frontend) {
        return `cd ${config.structure.frontend} && npm test`;
      }
    }

    // Default fallback
    return "npm test";
  }

  /**
   * Parse test output to extract results
   */
  private parseTestOutput(result: CommandResult): TestExecutionResult {
    const output = result.stdout + "\n" + result.stderr;

    // Try to parse Jest JSON output
    const jsonMatch = output.match(/\{[\s\S]*"numTotalTests"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const jestResult = JSON.parse(jsonMatch[0]);
        return {
          passed: jestResult.success || jestResult.numFailedTests === 0,
          totalTests: jestResult.numTotalTests || 0,
          passedTests: jestResult.numPassedTests || 0,
          failedTests: jestResult.numFailedTests || 0,
          skippedTests: jestResult.numPendingTests || 0,
          coverage: jestResult.coverageMap?.total?.lines?.pct,
          duration: result.duration,
          failures: (jestResult.testResults || []).flatMap(
            (tr: {
              assertionResults?: Array<{
                status: string;
                title: string;
                failureMessages: string[];
              }>;
            }) =>
              (tr.assertionResults || [])
                .filter((ar) => ar.status === "failed")
                .map((ar) => ({
                  testName: ar.title,
                  error: ar.failureMessages.join("\n"),
                }))
          ),
          output,
        };
      } catch {
        // Failed to parse JSON
      }
    }

    // Fallback: parse text output
    const passedMatch = output.match(/(\d+)\s+pass/i);
    const failedMatch = output.match(/(\d+)\s+fail/i);
    const totalMatch = output.match(/Tests:\s*(\d+)/i) || output.match(/(\d+)\s+tests?/i);

    const passed = parseInt(passedMatch?.[1] || "0", 10);
    const failed = parseInt(failedMatch?.[1] || "0", 10);
    const total = parseInt(totalMatch?.[1] || "0", 10) || passed + failed;

    return {
      passed: result.exitCode === 0 && failed === 0,
      totalTests: total,
      passedTests: passed,
      failedTests: failed,
      skippedTests: 0,
      duration: result.duration,
      failures:
        failed > 0 ? [{ testName: "Test failures detected", error: output.slice(-500) }] : [],
      output,
    };
  }

  /**
   * Save test result to database
   */
  private async saveTestResult(taskId: string, result: TestExecutionResult): Promise<void> {
    await prisma.testResult.create({
      data: {
        taskId,
        testType: "unit",
        status: result.passed ? "passed" : "failed",
        coverage: result.coverage ?? null,
        results: {
          totalTests: result.totalTests,
          passedTests: result.passedTests,
          failedTests: result.failedTests,
          skippedTests: result.skippedTests,
          duration: result.duration,
          failures: result.failures,
        },
      },
    });
  }
}

export default TestExecutorAgent;
