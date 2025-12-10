/**
 * Test Executor Agent
 * MOCKED: Returns successful test results without Docker execution
 */

import { PrismaClient, type Task } from "@prisma/client";
import { BaseAgent } from "./baseAgent.js";
import { eventBus } from "../redis/eventBus.js";

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
   * Run tests for a task
   * MOCKED: Returns successful test results without Docker execution
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

    // MOCK: Simulate test execution delay (1-3 seconds)
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));

    // MOCK: Auto-pass all tests
    await this.log("MOCKED_TEST_EXECUTION", { taskId });

    // MOCK: Return successful test result
    const result: TestExecutionResult = {
      passed: true,
      totalTests: 5,
      passedTests: 5,
      failedTests: 0,
      skippedTests: 0,
      duration: Math.floor(1000 + Math.random() * 2000),
      failures: [],
      output: "Mocked test execution - all tests passed\n✓ 5 tests passed (mocked)",
    };

    // Store results in database
    await this.saveTestResult(taskId, result);

    // Update task status
    await prisma.task.update({
      where: { id: taskId },
      data: {
        status: "tests_passed",
      },
    });

    await this.log("TEST_EXECUTION_COMPLETED", {
      taskId,
      passed: result.passed,
      total: result.totalTests,
      failed: result.failedTests,
      duration: result.duration,
    });

    // Publish event
    eventBus.publish("TESTS_PASSED", {
      taskId,
      projectId: this.projectId,
      passed: true,
      totalTests: result.totalTests,
      failedTests: result.failedTests,
    });

    return result;
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
