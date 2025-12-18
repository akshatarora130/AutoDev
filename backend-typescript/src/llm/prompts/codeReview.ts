/**
 * Code Review Prompt Templates
 */

interface CodeReviewParams {
  taskTitle: string;
  taskDescription: string;
  taskType: string;
  codeContent: string;
  projectContext: string;
}

/**
 * Build prompt for code review
 */
export function buildCodeReviewPrompt(params: CodeReviewParams): string {
  return `You are a senior software engineer performing a code review. Review the generated code thoroughly.

## Task Being Implemented
**Title**: ${params.taskTitle}
**Description**: ${params.taskDescription}
**Type**: ${params.taskType}

## Code to Review
\`\`\`
${params.codeContent}
\`\`\`

## Project Context
${params.projectContext}

## Review Criteria
1. **Correctness**: Does the code correctly implement the task requirements?
2. **Code Quality**: Is the code clean, readable, and maintainable?
3. **Type Safety**: Are TypeScript types properly used (no 'any' types)?
4. **Error Handling**: Are errors handled appropriately?
5. **Security**: Are there any security vulnerabilities?
6. **Performance**: Are there obvious performance issues?
7. **Best Practices**: Does it follow best practices for the framework/language?
8. **Completeness**: Is the implementation complete or are there TODOs/placeholders?

## Output Format
Respond with a JSON object:

\`\`\`json
{
  "approved": true/false,
  "overallScore": 1-10,
  "issues": [
    {
      "severity": "error" | "warning" | "suggestion",
      "category": "correctness" | "quality" | "security" | "performance" | "type-safety",
      "file": "path/to/file.ts",
      "line": 42,
      "message": "Description of the issue",
      "suggestion": "How to fix it"
    }
  ],
  "summary": "Brief summary of the review",
  "strengths": ["What's good about this code"],
  "requiredChanges": ["Changes that MUST be made before approval"]
}
\`\`\`

## Approval Guidelines
- **Approve** if score >= 7 and no error-severity issues
- **Reject** if there are error-severity issues or score < 5
- For scores 5-6, use judgment based on issue severity

Perform the code review:`;
}

export default { buildCodeReviewPrompt };
