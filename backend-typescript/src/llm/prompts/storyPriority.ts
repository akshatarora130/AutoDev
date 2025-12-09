/**
 * Story Priority Prompt
 * Used by Story Queue to decide between same-priority stories
 */

interface Story {
  id: string;
  title: string;
  description: string;
  priority: string;
}

/**
 * Build prompt for LLM tie-breaking between same-priority stories
 */
export function buildStoryPriorityPrompt(stories: Story[], projectContext: string): string {
  const storiesJson = stories
    .map((s) => `ID: ${s.id}\nTitle: ${s.title}\nDescription: ${s.description}`)
    .join("\n\n---\n\n");

  return `You are a Project Manager Agent for a software development automation platform.

You need to decide which user story should be implemented FIRST when multiple stories have the same priority level.

PROJECT CONTEXT (existing implementation):
${projectContext || "No existing project context available."}

STORIES TO COMPARE (all have "${stories[0]?.priority}" priority):

${storiesJson}

DECISION CRITERIA:
1. DEPENDENCIES: Does implementing one story enable or simplify others?
2. FOUNDATION: Is one story a prerequisite? (e.g., authentication before user features)
3. RISK: Should complex/risky items be done early when there's more time?
4. VALUE: Which story delivers the most value or unblocks the most work?
5. INTEGRATION: Based on existing code, which story integrates most naturally?

Analyze each story against these criteria and select the ONE story to implement first.

Your response must be a JSON object with this structure:
{
  "selectedStoryId": "the-id-of-selected-story",
  "reasoning": "Clear explanation of why this story should be implemented first, referencing the criteria above"
}

Make your decision now:`;
}

/**
 * System prompt for story priority
 */
export const STORY_PRIORITY_SYSTEM_PROMPT = `You are an expert project manager with deep software development experience.
You excel at prioritizing work based on dependencies, risk, and value.
You make clear, defensible decisions and explain your reasoning.
You respond only with valid JSON objects, no additional text.`;

export default buildStoryPriorityPrompt;
