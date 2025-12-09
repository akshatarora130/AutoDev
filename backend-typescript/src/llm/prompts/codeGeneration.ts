/**
 * Code Generation Prompt Templates
 * Prompts for generating code based on task type
 */

interface CodeGenPromptParams {
  taskTitle: string;
  taskDescription: string;
  taskType: "frontend" | "backend" | "database" | "integration";
  projectContext: string;
  existingFiles?: string[];
  dependencies?: string[];
  isModification: boolean;
  existingFileContent?: string;
}

/**
 * Build prompt for new file generation
 */
export function buildNewFilePrompt(params: CodeGenPromptParams): string {
  const typeInstructions = getTypeInstructions(params.taskType);

  return `You are an expert software developer. Generate production-quality code for the following task.

## Task
**Title**: ${params.taskTitle}
**Description**: ${params.taskDescription}
**Type**: ${params.taskType}

## Project Context
${params.projectContext}

${params.existingFiles?.length ? `## Existing Project Files\n${params.existingFiles.join("\n")}` : ""}

${params.dependencies?.length ? `## Dependencies from Previous Tasks\nThis task depends on: ${params.dependencies.join(", ")}` : ""}

## Type-Specific Requirements
${typeInstructions}

## Output Format
Respond with a valid JSON object containing the files to create, modify, or delete:

\`\`\`json
{
  "files": [
    {
      "path": "relative/path/to/file.ts",
      "content": "// full file content here",
      "action": "create"
    },
    {
      "path": "relative/path/to/delete.ts",
      "content": "",
      "action": "delete"
    }
  ],
  "dependencies": ["package-name@version"],
  "notes": "Any important notes about the implementation"
}
\`\`\`

## Supported Actions
- **create**: Create a new file with the provided content
- **modify**: Modify an existing file (use patch mode for this)
- **delete**: Delete an existing file from the project

## Rules
1. Generate complete, working code - no placeholders or TODOs
2. Follow the project's existing code style and conventions
3. Include proper TypeScript types (no 'any')
4. Add appropriate error handling
5. Keep files under 500 lines - split into multiple files if needed
6. Use meaningful variable and function names
7. Include brief comments for complex logic
8. For DELETE tasks: List all files to delete with action: "delete", content can be empty
9. When removing a feature, ensure you delete ALL related files

Generate the code:`;
}

/**
 * Build prompt for modifying existing files (patch mode)
 */
export function buildPatchPrompt(params: CodeGenPromptParams): string {
  return `You are an expert software developer. Modify the existing code to implement the following task.

## Task
**Title**: ${params.taskTitle}
**Description**: ${params.taskDescription}
**Type**: ${params.taskType}

## Existing File Content
\`\`\`
${params.existingFileContent}
\`\`\`

## Project Context
${params.projectContext}

## Output Format
Respond with a JSON object containing patches to apply. Use the MINIMAL changes needed:

\`\`\`json
{
  "files": [
    {
      "path": "relative/path/to/file.ts",
      "action": "modify",
      "patches": [
        {
          "operation": "replace",
          "search": "exact string to find",
          "replace": "replacement string"
        },
        {
          "operation": "insert",
          "after": "line to insert after",
          "content": "new lines to insert"
        },
        {
          "operation": "delete",
          "search": "exact string to delete"
        }
      ]
    }
  ],
  "dependencies": ["any-new-packages"],
  "notes": "Explanation of changes"
}
\`\`\`

## Rules
1. Make MINIMAL changes - don't rewrite entire files
2. Use exact string matching for search/replace
3. Preserve existing code style
4. Each patch should be self-contained

Generate the patches:`;
}

/**
 * Get type-specific instructions based on task type
 */
function getTypeInstructions(type: string): string {
  const instructions: Record<string, string> = {
    frontend: `
- Use React functional components with TypeScript
- Use Tailwind CSS for styling
- Create reusable components
- Use proper React hooks (useState, useEffect, etc.)
- Handle loading and error states
- Make components responsive
- Use semantic HTML elements
- Add ARIA attributes for accessibility`,

    backend: `
- Use Express.js with TypeScript
- Create proper route handlers
- Implement input validation using Zod
- Use proper HTTP status codes
- Add appropriate error handling
- Use async/await for async operations
- Follow RESTful conventions
- Add proper TypeScript types for request/response`,

    database: `
- Use Prisma ORM
- Create or update Prisma schema models
- Include proper relations and indexes
- Add data validation constraints
- Consider migration strategy
- Use appropriate field types
- Add cascade delete where appropriate`,

    integration: `
- Connect frontend and backend components
- Set up API client functions
- Handle authentication/authorization
- Implement proper state management
- Add loading indicators
- Handle API errors gracefully
- Set up proper environment configuration`,
  };

  return instructions[type] || instructions.frontend;
}

/**
 * Build prompt for code review feedback implementation
 */
export function buildRevisionPrompt(
  originalCode: string,
  reviewFeedback: string[],
  taskContext: string
): string {
  return `You are an expert software developer. Revise the code based on code review feedback.

## Original Code
\`\`\`
${originalCode}
\`\`\`

## Review Feedback
${reviewFeedback.map((f, i) => `${i + 1}. ${f}`).join("\n")}

## Task Context
${taskContext}

## Output Format
Respond with patches to fix the issues:

\`\`\`json
{
  "files": [
    {
      "path": "relative/path/to/file.ts",
      "action": "modify",
      "patches": [
        {
          "operation": "replace",
          "search": "exact string to find",
          "replace": "replacement string"
        }
      ]
    }
  ],
  "notes": "What was fixed and why"
}
\`\`\`

Generate the revision patches:`;
}

export default {
  buildNewFilePrompt,
  buildPatchPrompt,
  buildRevisionPrompt,
};
