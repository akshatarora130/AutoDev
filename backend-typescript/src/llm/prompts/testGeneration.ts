/**
 * Test Generation Prompt Templates
 */

interface TestGenParams {
  taskTitle: string;
  taskType: string;
  codeContent: string;
  projectContext: string;
  frameworks: string[];
}

/**
 * Build prompt for test generation
 */
export function buildTestGenerationPrompt(params: TestGenParams): string {
  const testFramework = params.frameworks.includes("jest")
    ? "Jest"
    : params.frameworks.includes("vitest")
      ? "Vitest"
      : "Jest";

  const hasPlaywright = params.frameworks.includes("playwright");

  return `You are an expert test engineer. Generate comprehensive tests for the following code.

## Task
**Title**: ${params.taskTitle}
**Type**: ${params.taskType}

## Code to Test
\`\`\`
${params.codeContent}
\`\`\`

## Project Context
${params.projectContext}

## Testing Frameworks Available
- Unit/Integration: ${testFramework}
${hasPlaywright ? "- E2E: Playwright" : ""}
- React Testing: @testing-library/react (if applicable)

## Test Requirements
1. **Unit Tests**: Test individual functions and components in isolation
2. **Integration Tests**: Test interactions between modules
${params.taskType === "frontend" ? "3. **Component Tests**: Test React components with React Testing Library" : ""}
${hasPlaywright && params.taskType === "frontend" ? "4. **E2E Tests**: Basic Playwright tests for critical user flows" : ""}

## Output Format
Respond with a JSON object:

\`\`\`json
{
  "files": [
    {
      "path": "tests/unit/example.test.ts",
      "content": "// test file content",
      "testType": "unit"
    },
    {
      "path": "tests/e2e/example.spec.ts", 
      "content": "// e2e test content",
      "testType": "e2e"
    }
  ],
  "testCommands": {
    "unit": "npm test",
    "e2e": "npx playwright test"
  },
  "coverage": ["List of what's covered by tests"]
}
\`\`\`

## Test Best Practices
1. Test happy paths and edge cases
2. Mock external dependencies
3. Use descriptive test names (describe/it structure)
4. Follow AAA pattern (Arrange, Act, Assert)
5. Keep tests independent and deterministic
6. Aim for meaningful coverage, not just high numbers

Generate the tests:`;
}

export default { buildTestGenerationPrompt };
