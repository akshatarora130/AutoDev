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

${params.existingFiles?.length ? `## Existing Project Files (DO NOT RECREATE THESE)\nThe following files already exist in the project. DO NOT create files with these paths:\n${params.existingFiles.map((f) => `- ${f}`).join("\n")}\n\n**IMPORTANT**: If you need to modify any of these files, use the "modify" action, NOT "create".` : ""}

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
      "path": "package.json",
      "content": "{\"name\": \"project\", \"dependencies\": {...}, \"scripts\": {...}}",
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

**IMPORTANT**: Always include package.json, tsconfig.json, and other necessary config files when creating new projects or adding new dependencies.

## Supported Actions
- **create**: Create a new file with the provided content
- **modify**: Modify an existing file (use patch mode for this)
- **delete**: Delete an existing file from the project

## CRITICAL RULES - READ CAREFULLY
1. **DO NOT CREATE DUPLICATE FILES**: Check the existing files list above. If a file already exists, use "modify" action or skip it entirely
2. **Each file path must be UNIQUE**: Do not generate multiple files with the same path
3. **Check existing files before creating**: Review the "Existing Project Files" list - do not recreate files that already exist
4. **ALWAYS INCLUDE CONFIG FILES**: You MUST generate ALL necessary configuration files:
   - **package.json** (for TypeScript/JavaScript projects) - include ALL dependencies, scripts, and metadata. This is REQUIRED.
   - **tsconfig.json** (for TypeScript projects) - include proper compiler options
   - **requirements.txt** (for Python projects) - list all dependencies
   - **Dockerfile** (if needed)
   - **.gitignore** (if not exists)
   - **README.md** (if creating a new project)
5. Generate complete, working code - no placeholders or TODOs
6. Follow the project's existing code style and conventions
7. Include proper TypeScript types (no 'any')
8. Add appropriate error handling
9. Keep files under 500 lines - split into multiple files if needed
10. Use meaningful variable and function names
11. Include brief comments for complex logic
12. For DELETE tasks: List all files to delete with action: "delete", content can be empty
13. When removing a feature, ensure you delete ALL related files
14. **If a file path already exists in the project, you MUST use "modify" action, not "create"**
15. **Include ALL files**: Even small files like package.json, .env.example, tsconfig.json must be included

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

## CRITICAL RULES - READ CAREFULLY
1. **DO NOT CREATE DUPLICATE FILES**: Only modify the file specified in the path. Do not create new files with similar names
2. Make MINIMAL changes - don't rewrite entire files
3. Use exact string matching for search/replace
4. Preserve existing code style
5. Each patch should be self-contained
6. **Ensure file path matches exactly** - do not create variations or duplicates

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
