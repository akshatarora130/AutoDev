/**
 * Prompt Optimizer Utility
 * CLI-friendly interface for optimizing prompts
 */

import { promptOptimizationService } from "../services/promptOptimizationService.js";
import type { PromptOptimizationParams } from "../agents/promptOptimizerAgent.js";

/**
 * Optimize a single prompt (CLI usage)
 */
export async function optimizePromptCLI(
  prompt: string,
  type: PromptOptimizationParams["promptType"] = "other",
  mode: "basic" | "detail" = "basic"
): Promise<void> {
  console.log("🔍 Analyzing prompt...");
  console.log(`Type: ${type}`);
  console.log(`Mode: ${mode}\n`);

  try {
    const result = await promptOptimizationService.optimizePrompt(prompt, type, {
      mode,
    });

    if (typeof result === "string") {
      // Basic mode - just return optimized prompt
      console.log("\n✅ Optimized Prompt:\n");
      console.log("=".repeat(60));
      console.log(result);
      console.log("=".repeat(60));
    } else {
      // Detail mode - show full analysis
      console.log("\n✅ Optimization Complete!\n");
      console.log("=".repeat(60));
      console.log("OPTIMIZED PROMPT:");
      console.log("=".repeat(60));
      console.log(result.optimized);
      console.log("\n" + "=".repeat(60));
      console.log("IMPROVEMENT METRICS:");
      console.log("=".repeat(60));
      const comparison = promptOptimizationService.comparePrompts(result);
      console.log(comparison.summary);
    }
  } catch (error) {
    console.error("❌ Optimization failed:", error);
    throw error;
  }
}

/**
 * Example usage patterns
 */
export const examples = {
  codeGeneration: `You are an expert software developer. Generate production-quality code for the following task.

## Task
**Title**: Create user authentication API
**Description**: Implement JWT-based authentication with login and registration endpoints

Generate the code:`,

  testGeneration: `Generate tests for this code:
\`\`\`typescript
export function add(a: number, b: number): number {
  return a + b;
}
\`\`\``,

  codeReview: `Review this code for quality and security:
\`\`\`typescript
function getUser(id: string) {
  return db.query(\`SELECT * FROM users WHERE id = \${id}\`);
}
\`\`\``,
};

/**
 * Interactive prompt optimizer
 */
export async function interactiveOptimizer(): Promise<void> {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║          Prompt Optimizer - Interactive Mode                 ║
╚══════════════════════════════════════════════════════════════╝

This tool uses the 4-D methodology:
1. DECONSTRUCT - Extract intent, entities, context
2. DIAGNOSE - Audit clarity, specificity, completeness
3. DEVELOP - Apply optimization techniques
4. DELIVER - Finalize optimized prompt

Available prompt types:
- code_generation
- test_generation
- code_review
- task_division
- task_review
- documentation
- story_priority
- other

Modes:
- basic: Quick optimization
- detail: Comprehensive analysis with metrics
  `);

  // In a real CLI, you would use readline or similar
  // For now, this is a template
}

export default {
  optimizePromptCLI,
  examples,
  interactiveOptimizer,
};
