/**
 * Prompt Optimizer Agent
 * Applies 4-D methodology (Deconstruct, Diagnose, Develop, Deliver) to optimize prompts
 * for maximum AI effectiveness across all agent types
 */

import { BaseAgent } from "./baseAgent.js";

export interface PromptAnalysis {
  clarity: number; // 0-100
  specificity: number; // 0-100
  completeness: number; // 0-100
  structure: number; // 0-100
  issues: string[];
  strengths: string[];
}

export interface OptimizedPrompt {
  original: string;
  optimized: string;
  improvements: string[];
  techniques: string[];
  metrics: {
    before: PromptAnalysis;
    after: PromptAnalysis;
  };
}

export interface PromptOptimizationParams {
  prompt: string;
  promptType:
    | "code_generation"
    | "test_generation"
    | "code_review"
    | "task_division"
    | "task_review"
    | "documentation"
    | "story_priority"
    | "other";
  context?: {
    taskType?: string;
    projectType?: string;
    constraints?: string[];
    examples?: string[];
  };
  mode?: "basic" | "detail";
}

/**
 * Prompt Optimizer Agent
 * Optimizes prompts using 4-D methodology
 */
export class PromptOptimizerAgent extends BaseAgent {
  constructor(projectId: string) {
    super(projectId, "PROMPT_OPTIMIZER");
  }

  /**
   * Execute the agent's main task (required by BaseAgent)
   */
  async execute(input: unknown): Promise<unknown> {
    if (typeof input === "object" && input !== null && "prompt" in input) {
      const params = input as PromptOptimizationParams;
      return this.optimize(params);
    }
    throw new Error("Invalid input: expected PromptOptimizationParams");
  }

  /**
   * Optimize a prompt using 4-D methodology
   */
  async optimize(params: PromptOptimizationParams): Promise<OptimizedPrompt> {
    await this.log("OPTIMIZATION_STARTED", {
      promptType: params.promptType,
      mode: params.mode || "basic",
      promptLength: params.prompt.length,
    });

    // Step 1: DECONSTRUCT
    const deconstruction = await this.deconstruct(params);

    // Step 2: DIAGNOSE
    const diagnosis = await this.diagnose(params.prompt, deconstruction);

    // Step 3: DEVELOP
    const optimization = await this.develop(params, deconstruction, diagnosis);

    // Step 4: DELIVER
    const optimized = await this.deliver(optimization);

    // Analyze optimized prompt
    const afterAnalysis = await this.analyzePrompt(optimized.prompt);

    await this.log("OPTIMIZATION_COMPLETED", {
      promptType: params.promptType,
      improvements: optimized.improvements.length,
      clarityImprovement: afterAnalysis.clarity - diagnosis.clarity,
      specificityImprovement: afterAnalysis.specificity - diagnosis.specificity,
    });

    return {
      original: params.prompt,
      optimized: optimized.prompt,
      improvements: optimized.improvements,
      techniques: optimized.techniques,
      metrics: {
        before: diagnosis,
        after: afterAnalysis,
      },
    };
  }

  /**
   * Step 1: DECONSTRUCT
   * Extract core intent, entities, context, and requirements
   */
  private async deconstruct(params: PromptOptimizationParams): Promise<{
    intent: string;
    entities: string[];
    context: string[];
    requirements: string[];
    constraints: string[];
    missing: string[];
  }> {
    const analysisPrompt = `Analyze this prompt and extract key information:

PROMPT:
${params.prompt}

PROMPT TYPE: ${params.promptType}
${params.context ? `CONTEXT: ${JSON.stringify(params.context, null, 2)}` : ""}

Extract and return JSON:
{
  "intent": "Core purpose/goal of the prompt",
  "entities": ["Key entities, concepts, or objects mentioned"],
  "context": ["Contextual information provided"],
  "requirements": ["Explicit requirements or instructions"],
  "constraints": ["Limitations or constraints mentioned"],
  "missing": ["What seems to be missing or unclear"]
}`;

    const result = await this.callLLMJSON<{
      intent: string;
      entities: string[];
      context: string[];
      requirements: string[];
      constraints: string[];
      missing: string[];
    }>(analysisPrompt, {
      model: process.env.LLM_MODEL,
    });

    return result;
  }

  /**
   * Step 2: DIAGNOSE
   * Audit for clarity, specificity, completeness, and structure
   */
  private async diagnose(
    prompt: string,
    deconstruction: Awaited<ReturnType<typeof this.deconstruct>>
  ): Promise<PromptAnalysis> {
    const diagnosisPrompt = `Evaluate this prompt on clarity, specificity, completeness, and structure:

PROMPT:
${prompt}

DECONSTRUCTION:
${JSON.stringify(deconstruction, null, 2)}

Rate each dimension (0-100) and identify issues:

{
  "clarity": <score>,
  "specificity": <score>,
  "completeness": <score>,
  "structure": <score>,
  "issues": ["List of specific problems"],
  "strengths": ["List of what works well"]
}`;

    const analysis = await this.callLLMJSON<PromptAnalysis>(diagnosisPrompt, {
      model: process.env.LLM_MODEL,
    });

    return analysis;
  }

  /**
   * Step 3: DEVELOP
   * Select optimal techniques and create optimized version
   */
  private async develop(
    params: PromptOptimizationParams,
    deconstruction: Awaited<ReturnType<typeof this.deconstruct>>,
    diagnosis: PromptAnalysis
  ): Promise<{
    prompt: string;
    improvements: string[];
    techniques: string[];
  }> {
    const techniques = this.selectTechniques(params.promptType, diagnosis);
    const role = this.assignRole(params.promptType);

    const optimizationPrompt = `Optimize this prompt using advanced prompt engineering techniques.

ORIGINAL PROMPT:
${params.prompt}

PROMPT TYPE: ${params.promptType}
${params.context ? `CONTEXT: ${JSON.stringify(params.context, null, 2)}` : ""}

DIAGNOSIS:
- Clarity: ${diagnosis.clarity}/100
- Specificity: ${diagnosis.specificity}/100
- Completeness: ${diagnosis.completeness}/100
- Structure: ${diagnosis.structure}/100
- Issues: ${diagnosis.issues.join(", ")}

TECHNIQUES TO APPLY:
${techniques.map((t) => `- ${t}`).join("\n")}

ASSIGNED ROLE: ${role}

OPTIMIZATION REQUIREMENTS:
1. Fix all identified issues
2. Apply the specified techniques
3. Maintain original intent and requirements
4. Improve clarity, specificity, and structure
5. Add missing context or constraints
6. Use clear section headers and formatting
7. Include explicit output format requirements
8. Add examples if helpful
9. Include error prevention rules
10. Make constraints explicit

Generate the optimized prompt that addresses all issues and applies the techniques:`;

    const optimizedPrompt = await this.callLLM(optimizationPrompt, {
      model: process.env.LLM_MODEL,
    });

    // Extract improvements
    const improvementsPrompt = `List the key improvements made to the prompt:

ORIGINAL ISSUES:
${diagnosis.issues.join("\n")}

OPTIMIZED PROMPT:
${optimizedPrompt}

Return JSON array of improvements:
["Improvement 1", "Improvement 2", ...]`;

    const improvements = await this.callLLMJSON<string[]>(improvementsPrompt, {
      model: process.env.LLM_MODEL,
    });

    return {
      prompt: optimizedPrompt.trim(),
      improvements: improvements || [],
      techniques,
    };
  }

  /**
   * Step 4: DELIVER
   * Finalize and format the optimized prompt
   */
  private async deliver(
    optimization: Awaited<ReturnType<typeof this.develop>>
  ): Promise<Awaited<ReturnType<typeof this.develop>>> {
    // Clean up and format the prompt
    let cleaned = optimization.prompt;

    // Remove markdown code blocks if present (keep content)
    cleaned = cleaned.replace(/```[\w]*\n?/g, "").trim();

    // Ensure proper formatting
    cleaned = this.formatPrompt(cleaned);

    return {
      ...optimization,
      prompt: cleaned,
    };
  }

  /**
   * Select appropriate optimization techniques based on prompt type
   */
  private selectTechniques(
    promptType: PromptOptimizationParams["promptType"],
    diagnosis: PromptAnalysis
  ): string[] {
    const techniques: string[] = [];

    // Foundation techniques (always apply)
    techniques.push("Role assignment with specific expertise");
    techniques.push("Clear output format specification");
    techniques.push("Explicit constraints and rules");

    // Type-specific techniques
    switch (promptType) {
      case "code_generation":
      case "test_generation":
        techniques.push("Few-shot examples");
        techniques.push("Constraint-based optimization");
        techniques.push("Precision focus on requirements");
        if (diagnosis.completeness < 70) {
          techniques.push("Context layering");
        }
        break;

      case "code_review":
        techniques.push("Multi-perspective analysis");
        techniques.push("Systematic evaluation framework");
        techniques.push("Chain-of-thought reasoning");
        break;

      case "task_division":
      case "task_review":
        techniques.push("Task decomposition framework");
        techniques.push("Dependency mapping");
        techniques.push("Priority-based structuring");
        break;

      case "documentation":
        techniques.push("Structured output format");
        techniques.push("Tone and style guidelines");
        techniques.push("Content organization framework");
        break;

      default:
        techniques.push("General optimization");
    }

    // Add techniques based on diagnosis
    if (diagnosis.clarity < 70) {
      techniques.push("Clarity enhancement with examples");
    }
    if (diagnosis.specificity < 70) {
      techniques.push("Specificity improvement with concrete details");
    }
    if (diagnosis.structure < 70) {
      techniques.push("Structural reorganization with clear sections");
    }

    return [...new Set(techniques)]; // Remove duplicates
  }

  /**
   * Assign appropriate AI role based on prompt type
   */
  private assignRole(promptType: PromptOptimizationParams["promptType"]): string {
    const roles: Record<string, string> = {
      code_generation:
        "Expert software developer with 10+ years of experience in production-quality code",
      test_generation: "Expert test engineer specializing in comprehensive test coverage",
      code_review:
        "Senior code reviewer with expertise in code quality, security, and best practices",
      task_division: "Expert software architect and technical lead specializing in task breakdown",
      task_review: "Senior project manager and technical reviewer",
      documentation: "Technical writer and documentation specialist",
      story_priority: "Product manager and project prioritization expert",
      other: "Expert AI assistant",
    };

    return roles[promptType] || roles.other;
  }

  /**
   * Analyze prompt quality metrics
   */
  private async analyzePrompt(prompt: string): Promise<PromptAnalysis> {
    const analysisPrompt = `Analyze this prompt and provide quality metrics:

PROMPT:
${prompt}

Rate each dimension (0-100):
{
  "clarity": <score>,
  "specificity": <score>,
  "completeness": <score>,
  "structure": <score>,
  "issues": ["Any remaining issues"],
  "strengths": ["What works well"]
}`;

    return this.callLLMJSON<PromptAnalysis>(analysisPrompt, {
      model: process.env.LLM_MODEL,
    });
  }

  /**
   * Format prompt with proper structure
   */
  private formatPrompt(prompt: string): string {
    // Ensure proper markdown formatting
    let formatted = prompt;

    // Add spacing around headers if missing
    formatted = formatted.replace(/(##+[^\n]+)\n([^\n#])/g, "$1\n\n$2");

    // Ensure code blocks are properly formatted
    formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      return `\`\`\`${lang || ""}\n${code.trim()}\n\`\`\``;
    });

    return formatted.trim();
  }

  /**
   * Quick optimization (basic mode)
   */
  async quickOptimize(
    prompt: string,
    promptType: PromptOptimizationParams["promptType"]
  ): Promise<string> {
    const result = await this.optimize({
      prompt,
      promptType,
      mode: "basic",
    });

    return result.optimized;
  }

  /**
   * Comprehensive optimization (detail mode)
   */
  async comprehensiveOptimize(
    prompt: string,
    promptType: PromptOptimizationParams["promptType"],
    context?: PromptOptimizationParams["context"]
  ): Promise<OptimizedPrompt> {
    return this.optimize({
      prompt,
      promptType,
      context,
      mode: "detail",
    });
  }
}

export default PromptOptimizerAgent;
