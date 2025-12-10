/**
 * Prompt Optimization Service
 * Utility service for optimizing prompts across the codebase
 */

import {
  PromptOptimizerAgent,
  type OptimizedPrompt,
  type PromptOptimizationParams,
} from "../agents/promptOptimizerAgent.js";

/**
 * Optimize a prompt with automatic type detection
 */
export async function optimizePrompt(
  prompt: string,
  promptType: PromptOptimizationParams["promptType"],
  options?: {
    mode?: "basic" | "detail";
    context?: PromptOptimizationParams["context"];
    projectId?: string;
  }
): Promise<OptimizedPrompt | string> {
  const projectId = options?.projectId || "system";
  const optimizer = new PromptOptimizerAgent(projectId);

  if (options?.mode === "basic") {
    return optimizer.quickOptimize(prompt, promptType);
  }

  return optimizer.comprehensiveOptimize(prompt, promptType, options?.context);
}

/**
 * Batch optimize multiple prompts
 */
export async function batchOptimize(
  prompts: Array<{ prompt: string; type: PromptOptimizationParams["promptType"] }>,
  projectId: string = "system"
): Promise<OptimizedPrompt[]> {
  const optimizer = new PromptOptimizerAgent(projectId);
  const results: OptimizedPrompt[] = [];

  for (const { prompt, type } of prompts) {
    try {
      const optimized = await optimizer.optimize({
        prompt,
        promptType: type,
        mode: "basic",
      });
      results.push(optimized);
    } catch (error) {
      console.error(`Failed to optimize prompt of type ${type}:`, error);
      // Continue with next prompt
    }
  }

  return results;
}

/**
 * Compare prompt quality before and after optimization
 */
export function comparePrompts(optimized: OptimizedPrompt): {
  improvement: number;
  summary: string;
} {
  const before = optimized.metrics.before;
  const after = optimized.metrics.after;

  const avgBefore =
    (before.clarity + before.specificity + before.completeness + before.structure) / 4;
  const avgAfter = (after.clarity + after.specificity + after.completeness + after.structure) / 4;

  const improvement = avgAfter - avgBefore;

  const summary = `
Optimization Results:
- Clarity: ${before.clarity} → ${after.clarity} (+${after.clarity - before.clarity})
- Specificity: ${before.specificity} → ${after.specificity} (+${after.specificity - before.specificity})
- Completeness: ${before.completeness} → ${after.completeness} (+${after.completeness - before.completeness})
- Structure: ${before.structure} → ${after.structure} (+${after.structure - before.structure})
- Overall Improvement: ${improvement.toFixed(1)} points

Key Improvements:
${optimized.improvements.map((imp) => `• ${imp}`).join("\n")}

Techniques Applied:
${optimized.techniques.map((tech) => `• ${tech}`).join("\n")}
  `.trim();

  return { improvement, summary };
}

export const promptOptimizationService = {
  optimizePrompt,
  batchOptimize,
  comparePrompts,
};

export default promptOptimizationService;
