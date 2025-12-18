/**
 * Task Division Prompt
 * Used by Task Divider Agent to break stories into subtasks
 */

interface Story {
  id: string;
  title: string;
  description: string;
  priority: string;
}

/**
 * Build prompt for task division
 */
export function buildTaskDivisionPrompt(story: Story, projectContext: string): string {
  return `You are a Task Divider Agent for a software development automation platform.

Your job is to break down a user story into atomic, implementable subtasks that can be assigned to specialized code generation agents.

PROJECT CONTEXT (existing code patterns and structure):
${projectContext || "No existing project context available."}

USER STORY TO BREAK DOWN:
Title: ${story.title}
Description: ${story.description}
Priority: ${story.priority}

INSTRUCTIONS:
1. Analyze the user story and identify all required implementation work
2. Break it into atomic tasks that can each be completed in 1-4 hours
3. Assign each task a type based on what layer it affects
4. Identify dependencies between tasks (which tasks must be completed first)
5. Assign priority numbers for execution order (lower = higher priority)

TASK TYPES:
- "frontend": UI components, React code, styling, client-side logic
- "backend": API endpoints, server logic, middleware, services
- "database": Schema changes, migrations, queries, models
- "integration": Connecting services, API integrations, configuration
- "deletion": Removing files, components, or features from the codebase
- "test_cleanup": Removing or updating test files that are no longer needed

For each task, provide:
- title: Short, descriptive name (e.g., "Create user registration API endpoint")
- description: Detailed implementation requirements and acceptance criteria. For deletion tasks, list the specific files to delete.
- type: One of the task types above
- priority: Number (1 = highest priority, should be done first)
- dependencies: Array of task titles this task depends on (empty if none)

IMPORTANT: You MUST respond with ONLY a valid JSON array. No other text, no markdown code blocks, no explanation before or after the JSON.

EXAMPLE RESPONSE (this is the ONLY format you should use):
[{"title": "Create User model", "description": "Create database model for User", "type": "database", "priority": 1, "dependencies": []}, {"title": "Delete old auth files", "description": "Delete files: src/old-auth.ts, src/legacy-login.tsx", "type": "deletion", "priority": 2, "dependencies": []}]

Your JSON array response (ONLY the JSON array, nothing else):`;
}

/**
 * System prompt for task division
 */
export const TASK_DIVISION_SYSTEM_PROMPT = `You are an expert software architect and technical lead. 
You excel at breaking down complex requirements into well-structured, atomic implementation tasks.
You always consider dependencies between tasks and proper ordering.
You respond only with valid JSON arrays, no additional text.`;

export default buildTaskDivisionPrompt;
