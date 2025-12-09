/**
 * Agent Event Types
 * All events that can be published/subscribed to via Redis Event Bus
 */

// Story lifecycle events
export interface StorySelectedEvent {
  type: "STORY_SELECTED";
  payload: {
    storyId: string;
    projectId: string;
    selectedBy: "priority" | "llm_tiebreaker";
    reasoning?: string;
  };
}

export interface StoryDividingEvent {
  type: "STORY_DIVIDING";
  payload: {
    storyId: string;
    projectId: string;
  };
}

export interface StoryReviewingEvent {
  type: "STORY_REVIEWING";
  payload: {
    storyId: string;
    projectId: string;
  };
}

export interface StoryReadyEvent {
  type: "STORY_READY";
  payload: {
    storyId: string;
    projectId: string;
    taskCount: number;
  };
}

export interface StoryCompletedEvent {
  type: "STORY_COMPLETED";
  payload: {
    storyId: string;
    projectId: string;
  };
}

export interface StoryFailedEvent {
  type: "STORY_FAILED";
  payload: {
    storyId: string;
    projectId: string;
    phase: string;
    reason: string;
  };
}

// Queue events
export interface QueueCheckEvent {
  type: "QUEUE_CHECK";
  payload: {
    projectId: string;
  };
}

// Task lifecycle events
export interface TaskCreatedEvent {
  type: "TASK_CREATED";
  payload: {
    taskId: string;
    storyId: string;
    projectId: string;
    title: string;
  };
}

export interface TasksCreatedEvent {
  type: "TASKS_CREATED";
  payload: {
    storyId: string;
    projectId: string;
    taskIds: string[];
    count: number;
  };
}

export interface TaskReviewedEvent {
  type: "TASK_REVIEWED";
  payload: {
    taskId: string;
    storyId: string;
    projectId: string;
    approved: boolean;
    feedback?: string;
  };
}

export interface TaskSubdividedEvent {
  type: "TASK_SUBDIVIDED";
  payload: {
    originalTaskId: string;
    storyId: string;
    projectId: string;
    newTaskIds: string[];
  };
}

export interface TasksReviewedEvent {
  type: "TASKS_REVIEWED";
  payload: {
    storyId: string;
    projectId: string;
    allApproved: boolean;
  };
}

// Phase 3: Code Generation Events
export interface StoryGeneratingEvent {
  type: "STORY_GENERATING";
  payload: {
    storyId: string;
    projectId: string;
  };
}

export interface TasksPrioritizedEvent {
  type: "TASKS_PRIORITIZED";
  payload: {
    storyId: string;
    projectId: string;
    batchCount: number;
    totalTasks: number;
  };
}

export interface CodeGeneratedEvent {
  type: "CODE_GENERATED";
  payload: {
    taskId: string;
    projectId: string;
    artifactId: string;
    fileCount: number;
  };
}

export interface CodeRegeneratedEvent {
  type: "CODE_REGENERATED";
  payload: {
    taskId: string;
    projectId: string;
    artifactId: string;
  };
}

export interface ProjectAnalyzedEvent {
  type: "PROJECT_ANALYZED";
  payload: {
    projectId: string;
    type: string;
    packageManager: string;
  };
}

// Phase 4: Code Review Events
export interface StoryCodeReviewEvent {
  type: "STORY_CODE_REVIEW";
  payload: {
    storyId: string;
    projectId: string;
  };
}

export interface CodeApprovedEvent {
  type: "CODE_APPROVED";
  payload: {
    taskId: string;
    projectId: string;
    artifactId: string;
    approved: boolean;
    score: number;
  };
}

export interface CodeRejectedEvent {
  type: "CODE_REJECTED";
  payload: {
    taskId: string;
    projectId: string;
    artifactId: string;
    approved: boolean;
    score: number;
    requiredChanges: string[];
  };
}

// Phase 5: Testing Events
export interface StoryTestingEvent {
  type: "STORY_TESTING";
  payload: {
    storyId: string;
    projectId: string;
  };
}

export interface TestsGeneratedEvent {
  type: "TESTS_GENERATED";
  payload: {
    taskId: string;
    projectId: string;
    fileCount: number;
    testCommands: Record<string, string | undefined>;
  };
}

export interface TestsPassedEvent {
  type: "TESTS_PASSED";
  payload: {
    taskId: string;
    projectId: string;
    passed: boolean;
    totalTests: number;
    failedTests: number;
  };
}

export interface TestsFailedEvent {
  type: "TESTS_FAILED";
  payload: {
    taskId: string;
    projectId: string;
    passed: boolean;
    totalTests: number;
    failedTests: number;
  };
}

// Documentation Events
export interface DocumentationUpdatedEvent {
  type: "DOCUMENTATION_UPDATED";
  payload: {
    projectId: string;
    storyId: string;
    storyTitle: string;
  };
}

// Cancellation Event
export interface StoryCancelledEvent {
  type: "STORY_CANCELLED";
  payload: {
    storyId: string;
    projectId: string;
    rolledBack: boolean;
  };
}

// Union type of all events
export type AgentEvent =
  | QueueCheckEvent
  | StorySelectedEvent
  | StoryDividingEvent
  | StoryReviewingEvent
  | StoryReadyEvent
  | StoryCompletedEvent
  | StoryFailedEvent
  | StoryCancelledEvent
  | TaskCreatedEvent
  | TasksCreatedEvent
  | TaskReviewedEvent
  | TaskSubdividedEvent
  | TasksReviewedEvent
  // Phase 3
  | StoryGeneratingEvent
  | TasksPrioritizedEvent
  | CodeGeneratedEvent
  | CodeRegeneratedEvent
  | ProjectAnalyzedEvent
  // Phase 4
  | StoryCodeReviewEvent
  | CodeApprovedEvent
  | CodeRejectedEvent
  // Phase 5
  | StoryTestingEvent
  | TestsGeneratedEvent
  | TestsPassedEvent
  | TestsFailedEvent
  // Documentation
  | DocumentationUpdatedEvent;

// Event type string union
export type AgentEventType = AgentEvent["type"];

/**
 * Agent Configuration
 */
export interface AgentConfig {
  name: string;
  projectId: string;
  llmModel?: string;
}

/**
 * Task Division Types
 */
export interface GeneratedTask {
  title: string;
  description: string;
  type: "frontend" | "backend" | "database" | "integration";
  priority: number;
  dependencies: string[]; // Task titles this depends on
}

export interface TaskDivisionResult {
  tasks: GeneratedTask[];
  taskIds: string[];
}

/**
 * Task Review Types
 */
export interface TaskReviewFeedback {
  approved: boolean;
  feedback: string;
  subtasks?: GeneratedTask[];
}

export interface TaskReviewResult {
  reviewed: number;
  approved: number;
  subdivided: number;
}

/**
 * Context Types for Supermemory
 */
export interface RelevantFile {
  path: string;
  content: string;
  score: number;
}

export interface ContextResult {
  relevantFiles: RelevantFile[];
  summary: string;
}

/**
 * Story Priority Constants
 */
export const PRIORITY_ORDER = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
} as const;

export type StoryPriority = keyof typeof PRIORITY_ORDER;

/**
 * Status Types
 */
export type StoryStatus =
  | "pending"
  | "dividing"
  | "reviewing"
  | "tasks_ready"
  | "generating"
  | "code_review"
  | "testing"
  | "deploying"
  | "completed"
  | "failed";

export type TaskStatus =
  | "pending"
  | "reviewed"
  | "subdivided"
  | "in_progress"
  | "code_generated"
  | "code_approved"
  | "tests_generated"
  | "tests_passed"
  | "deployed"
  | "failed";

export type CodeArtifactStatus = "pending" | "approved" | "rejected";
