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

// Union type of all events
export type AgentEvent =
  | QueueCheckEvent
  | StorySelectedEvent
  | StoryDividingEvent
  | StoryReviewingEvent
  | StoryReadyEvent
  | StoryCompletedEvent
  | StoryFailedEvent
  | TaskCreatedEvent
  | TasksCreatedEvent
  | TaskReviewedEvent
  | TaskSubdividedEvent
  | TasksReviewedEvent;

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
