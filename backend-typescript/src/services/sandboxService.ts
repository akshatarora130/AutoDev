/**
 * Sandbox Service
 * Docker-based isolated environment for running build/lint/test commands
 */

import Docker from "dockerode";
import { PassThrough } from "stream";

const docker = new Docker();

export interface SandboxConfig {
  projectId: string;
  workDir: string; // Path to project files on host
  image?: string; // Docker image (default: node:20-alpine)
  timeout?: number; // Max execution time in ms (default: 5 min)
  memory?: number; // Memory limit in bytes (default: 512MB)
}

export interface CommandResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
  timedOut: boolean;
}

export interface SandboxInstance {
  id: string;
  containerId: string;
  projectId: string;
  createdAt: Date;
}

// Active sandboxes cache
const activeSandboxes = new Map<string, SandboxInstance>();

/**
 * Create a new sandbox container
 */
export async function createSandbox(config: SandboxConfig): Promise<SandboxInstance> {
  const image = config.image || "node:20-alpine";
  const timeout = config.timeout || 5 * 60 * 1000; // 5 minutes
  const memory = config.memory || 512 * 1024 * 1024; // 512MB

  // Ensure image exists
  try {
    await docker.getImage(image).inspect();
  } catch {
    console.log(`Pulling Docker image: ${image}`);
    await pullImage(image);
  }

  // Create container
  const container = await docker.createContainer({
    Image: image,
    Cmd: ["sh", "-c", "tail -f /dev/null"], // Keep container running
    WorkingDir: "/app",
    HostConfig: {
      Binds: [`${config.workDir}:/app:rw`],
      Memory: memory,
      MemorySwap: memory * 2,
      NetworkMode: "bridge",
      AutoRemove: false,
    },
    Tty: false,
    OpenStdin: false,
  });

  await container.start();

  const sandbox: SandboxInstance = {
    id: `sandbox-${config.projectId}-${Date.now()}`,
    containerId: container.id,
    projectId: config.projectId,
    createdAt: new Date(),
  };

  activeSandboxes.set(sandbox.id, sandbox);

  // Set up auto-cleanup after timeout
  setTimeout(() => {
    destroySandbox(sandbox.id).catch(console.error);
  }, timeout);

  return sandbox;
}

/**
 * Execute a command in the sandbox
 */
export async function executeCommand(
  sandboxId: string,
  command: string,
  timeout: number = 60000 // 1 minute default
): Promise<CommandResult> {
  const sandbox = activeSandboxes.get(sandboxId);
  if (!sandbox) {
    throw new Error(`Sandbox not found: ${sandboxId}`);
  }

  const container = docker.getContainer(sandbox.containerId);
  const startTime = Date.now();

  // Create exec instance
  const exec = await container.exec({
    Cmd: ["sh", "-c", command],
    AttachStdout: true,
    AttachStderr: true,
    WorkingDir: "/app",
  });

  return new Promise((resolve, reject) => {
    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timeoutHandle = setTimeout(() => {
      timedOut = true;
      // Try to kill the exec process
      container.kill({ signal: "SIGTERM" }).catch(() => {});
    }, timeout);

    exec.start({ hijack: true, stdin: false }, (err, stream) => {
      if (err) {
        clearTimeout(timeoutHandle);
        return reject(err);
      }

      if (!stream) {
        clearTimeout(timeoutHandle);
        return reject(new Error("No stream returned from exec"));
      }

      // Demux stdout and stderr from Docker stream
      // Use PassThrough (duplex) instead of Readable
      const stdoutStream = new PassThrough();
      const stderrStream = new PassThrough();

      docker.modem.demuxStream(stream, stdoutStream, stderrStream);

      stdoutStream.on("data", (chunk: Buffer) => {
        stdout += chunk.toString();
      });

      stderrStream.on("data", (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      stream.on("end", async () => {
        clearTimeout(timeoutHandle);

        try {
          const inspectData = await exec.inspect();
          const duration = Date.now() - startTime;

          resolve({
            exitCode: inspectData.ExitCode ?? (timedOut ? 124 : 1),
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            duration,
            timedOut,
          });
        } catch (inspectErr) {
          reject(inspectErr);
        }
      });

      stream.on("error", (streamErr) => {
        clearTimeout(timeoutHandle);
        reject(streamErr);
      });
    });
  });
}

/**
 * Execute multiple commands sequentially
 */
export async function executeCommands(
  sandboxId: string,
  commands: string[],
  timeout: number = 60000
): Promise<CommandResult[]> {
  const results: CommandResult[] = [];

  for (const command of commands) {
    const result = await executeCommand(sandboxId, command, timeout);
    results.push(result);

    // Stop on first failure
    if (result.exitCode !== 0) {
      break;
    }
  }

  return results;
}

/**
 * Install dependencies in sandbox
 */
export async function installDependencies(
  sandboxId: string,
  packageManager: "npm" | "bun" | "yarn" | "pnpm" = "npm"
): Promise<CommandResult> {
  const commands: Record<string, string> = {
    npm: "npm install --legacy-peer-deps",
    bun: "bun install",
    yarn: "yarn install",
    pnpm: "pnpm install",
  };

  return executeCommand(sandboxId, commands[packageManager], 120000); // 2 min timeout
}

/**
 * Run a build command
 */
export async function runBuild(
  sandboxId: string,
  buildCommand: string = "npm run build"
): Promise<CommandResult> {
  return executeCommand(sandboxId, buildCommand, 180000); // 3 min timeout
}

/**
 * Run linting
 */
export async function runLint(
  sandboxId: string,
  lintCommand: string = "npm run lint"
): Promise<CommandResult> {
  return executeCommand(sandboxId, lintCommand, 60000); // 1 min timeout
}

/**
 * Run tests
 */
export async function runTests(
  sandboxId: string,
  testCommand: string = "npm test",
  timeout: number = 300000 // 5 min default for tests
): Promise<CommandResult> {
  return executeCommand(sandboxId, testCommand, timeout);
}

/**
 * Destroy a sandbox and cleanup
 */
export async function destroySandbox(sandboxId: string): Promise<void> {
  const sandbox = activeSandboxes.get(sandboxId);
  if (!sandbox) {
    return; // Already destroyed
  }

  try {
    const container = docker.getContainer(sandbox.containerId);

    // Try to stop gracefully first
    try {
      await container.stop({ t: 5 }); // 5 second grace period
    } catch {
      // Container might already be stopped
    }

    // Remove container
    await container.remove({ force: true });
  } catch (error) {
    console.error(`Error destroying sandbox ${sandboxId}:`, error);
  } finally {
    activeSandboxes.delete(sandboxId);
  }
}

/**
 * Get active sandbox by ID
 */
export function getSandbox(sandboxId: string): SandboxInstance | undefined {
  return activeSandboxes.get(sandboxId);
}

/**
 * Get all active sandboxes for a project
 */
export function getProjectSandboxes(projectId: string): SandboxInstance[] {
  return Array.from(activeSandboxes.values()).filter((s) => s.projectId === projectId);
}

/**
 * Cleanup all sandboxes (for graceful shutdown)
 */
export async function cleanupAllSandboxes(): Promise<void> {
  const sandboxIds = Array.from(activeSandboxes.keys());
  await Promise.all(sandboxIds.map((id) => destroySandbox(id)));
}

/**
 * Pull a Docker image
 */
async function pullImage(image: string): Promise<void> {
  return new Promise((resolve, reject) => {
    docker.pull(image, (err: Error | null, stream: NodeJS.ReadableStream) => {
      if (err) return reject(err);

      docker.modem.followProgress(stream, (pullErr: Error | null) => {
        if (pullErr) return reject(pullErr);
        resolve();
      });
    });
  });
}

/**
 * Check if Docker is available
 */
export async function isDockerAvailable(): Promise<boolean> {
  try {
    await docker.ping();
    return true;
  } catch {
    return false;
  }
}

// Export the service as a singleton-like object
export const sandboxService = {
  createSandbox,
  executeCommand,
  executeCommands,
  installDependencies,
  runBuild,
  runLint,
  runTests,
  destroySandbox,
  getSandbox,
  getProjectSandboxes,
  cleanupAllSandboxes,
  isDockerAvailable,
};

export default sandboxService;
