/**
 * Documentation Prompt Templates
 */

interface DocGenParams {
  existingReadme: string | null;
  storyTitle: string;
  storyDescription: string;
  implementedTasks: Array<{
    title: string;
    description: string;
    type: string;
  }>;
  generatedFiles: string[];
  projectContext: string;
}

/**
 * Build prompt for incremental README update
 */
export function buildDocumentationPrompt(params: DocGenParams): string {
  const hasExisting = params.existingReadme && params.existingReadme.length > 100;

  if (hasExisting) {
    return `You are a technical writer. Update the existing README to document a new feature.

## Existing README
\`\`\`markdown
${params.existingReadme}
\`\`\`

## New Feature Implemented
**Story**: ${params.storyTitle}
**Description**: ${params.storyDescription}

### Tasks Completed
${params.implementedTasks.map((t) => `- **${t.title}** (${t.type}): ${t.description}`).join("\n")}

### Files Generated/Modified
${params.generatedFiles.map((f) => `- ${f}`).join("\n")}

## Project Context
${params.projectContext}

## Instructions
1. Keep ALL existing content intact
2. Add the new feature to the appropriate sections:
   - Add to "Features" section if it exists
   - Add API endpoints to "API" section if applicable
   - Add to "Changelog" section with today's date
3. Update "Getting Started" if new setup steps are needed
4. Maintain consistent formatting and style

## Output Format
Respond with the complete updated README content (not patches):

\`\`\`markdown
# Updated README content here
\`\`\`

Generate the updated README:`;
  }

  // Generate new README
  return `You are a technical writer. Create a comprehensive README for this project.

## Project Overview
**Story Implemented**: ${params.storyTitle}
**Description**: ${params.storyDescription}

### Tasks Completed
${params.implementedTasks.map((t) => `- **${t.title}** (${t.type}): ${t.description}`).join("\n")}

### Files Created
${params.generatedFiles.map((f) => `- ${f}`).join("\n")}

## Project Context
${params.projectContext}

## Required Sections
1. **Project Title & Description**
2. **Features** - List main features
3. **Tech Stack** - Technologies used
4. **Getting Started**
   - Prerequisites
   - Installation
   - Running locally
5. **API Documentation** (if backend)
6. **Project Structure** - Brief overview
7. **Contributing** (optional)
8. **License** (use MIT)

## Output Format
\`\`\`markdown
# Complete README content
\`\`\`

Generate a professional README:`;
}

export default { buildDocumentationPrompt };
