/**
 * Rollback Service
 * Manages file snapshots and rollback operations for story-level recovery
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface SnapshotResult {
  storyId: string;
  filesSnapshotted: number;
  timestamp: Date;
}

export interface RollbackResult {
  storyId: string;
  filesRestored: number;
  filesDeleted: number;
  timestamp: Date;
}

/**
 * Create snapshots of all currently existing project files before story execution
 * This allows us to rollback to the exact state before any changes were made
 */
export async function createStorySnapshot(
  storyId: string,
  projectId: string
): Promise<SnapshotResult> {
  // Get all current project files
  const files = await prisma.file.findMany({
    where: { projectId },
    select: { path: true, content: true },
  });

  // Delete any existing snapshots for this story (in case of retry)
  await prisma.fileSnapshot.deleteMany({
    where: { storyId },
  });

  // Create snapshots for all existing files
  if (files.length > 0) {
    await prisma.fileSnapshot.createMany({
      data: files.map((file) => ({
        storyId,
        filePath: file.path,
        content: file.content,
        existed: true,
      })),
    });
  }

  console.log(`📸 Created snapshot of ${files.length} files for story ${storyId}`);

  return {
    storyId,
    filesSnapshotted: files.length,
    timestamp: new Date(),
  };
}

/**
 * Track a file that was created during story execution
 * These files will be deleted during rollback
 */
export async function trackNewFile(storyId: string, filePath: string): Promise<void> {
  // Check if we already have a snapshot for this file
  const existing = await prisma.fileSnapshot.findFirst({
    where: { storyId, filePath },
  });

  if (!existing) {
    // This is a new file - mark it as such
    await prisma.fileSnapshot.create({
      data: {
        storyId,
        filePath,
        content: "", // No previous content
        existed: false, // File didn't exist before
      },
    });
  }
}

/**
 * Rollback all changes made during a story execution
 * - Restore modified files to their original state
 * - Delete files that were created during execution
 */
export async function rollbackStory(storyId: string, projectId: string): Promise<RollbackResult> {
  // Get all snapshots for this story
  const snapshots = await prisma.fileSnapshot.findMany({
    where: { storyId },
  });

  let filesRestored = 0;
  let filesDeleted = 0;

  for (const snapshot of snapshots) {
    if (snapshot.existed) {
      // File existed before - restore it to original content
      await prisma.file.upsert({
        where: {
          projectId_path: {
            projectId,
            path: snapshot.filePath,
          },
        },
        create: {
          projectId,
          path: snapshot.filePath,
          content: snapshot.content,
          encoding: "utf-8",
          size: Buffer.byteLength(snapshot.content, "utf-8"),
        },
        update: {
          content: snapshot.content,
          size: Buffer.byteLength(snapshot.content, "utf-8"),
          updatedAt: new Date(),
        },
      });
      filesRestored++;
    } else {
      // File was created during execution - delete it
      await prisma.file.deleteMany({
        where: {
          projectId,
          path: snapshot.filePath,
        },
      });
      filesDeleted++;
    }
  }

  // Clean up snapshots
  await prisma.fileSnapshot.deleteMany({
    where: { storyId },
  });

  console.log(
    `🔄 Rolled back story ${storyId}: restored ${filesRestored} files, deleted ${filesDeleted} new files`
  );

  return {
    storyId,
    filesRestored,
    filesDeleted,
    timestamp: new Date(),
  };
}

/**
 * Clean up snapshots after successful story completion
 */
export async function cleanupSnapshots(storyId: string): Promise<void> {
  await prisma.fileSnapshot.deleteMany({
    where: { storyId },
  });
  console.log(`🧹 Cleaned up snapshots for completed story ${storyId}`);
}

/**
 * Check if a story is cancelled or should stop execution
 */
export async function isStoryCancelled(storyId: string): Promise<boolean> {
  const story = await prisma.story.findUnique({
    where: { id: storyId },
    select: { status: true },
  });
  return story?.status === "cancelled";
}

/**
 * Cancel a story and optionally rollback changes
 */
export async function cancelStory(
  storyId: string,
  projectId: string,
  rollback: boolean = true
): Promise<{ cancelled: boolean; rolledBack: boolean; rollbackResult?: RollbackResult }> {
  // Update story status
  await prisma.story.update({
    where: { id: storyId },
    data: {
      status: "cancelled",
      failedAt: new Date(),
      failedReason: "Cancelled by user",
    },
  });

  // Update all pending/in-progress tasks to cancelled
  await prisma.task.updateMany({
    where: {
      storyId,
      status: { notIn: ["completed", "failed", "tests_passed"] },
    },
    data: { status: "failed" },
  });

  let rollbackResult: RollbackResult | undefined;

  if (rollback) {
    rollbackResult = await rollbackStory(storyId, projectId);
  }

  return {
    cancelled: true,
    rolledBack: rollback,
    rollbackResult,
  };
}

// Export as a service object
export const rollbackService = {
  createStorySnapshot,
  trackNewFile,
  rollbackStory,
  cleanupSnapshots,
  isStoryCancelled,
  cancelStory,
};

export default rollbackService;
