/**
 * Redis Event Bus
 * Typed pub/sub wrapper for agent communication
 */

import { PrismaClient } from "@prisma/client";
import { getRedisClient, getSubscriberClient } from "./client.js";
import type { AgentEvent, AgentEventType } from "../types/agent.js";

const prisma = new PrismaClient();
const CHANNEL_NAME = "agent-events";

// Store event handlers
type EventHandler<T extends AgentEvent = AgentEvent> = (event: T) => Promise<void>;
const handlers = new Map<AgentEventType, EventHandler[]>();

let isSubscribed = false;

/**
 * Publish an event to the event bus
 * Also logs the event to the database
 */
export async function publish<T extends AgentEvent>(
  type: T["type"],
  payload: T["payload"]
): Promise<void> {
  const redis = await getRedisClient();

  const event = {
    type,
    payload,
    timestamp: new Date().toISOString(),
  };

  // Publish to Redis
  await redis.publish(CHANNEL_NAME, JSON.stringify(event));

  // Log to database
  try {
    const projectId =
      "projectId" in payload ? (payload as { projectId: string }).projectId : "system";

    const taskId = "taskId" in payload ? (payload as { taskId?: string }).taskId : undefined;

    await prisma.agentLog.create({
      data: {
        projectId,
        taskId,
        agentType: "EVENT_BUS",
        event: type,
        data: payload as object,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error("Failed to log event to database:", error);
  }

  console.log(`📤 Event published: ${type}`);
}

/**
 * Subscribe to a specific event type
 */
export function subscribe<T extends AgentEvent>(
  eventType: T["type"],
  handler: (event: T) => Promise<void>
): void {
  const existingHandlers = handlers.get(eventType) || [];
  existingHandlers.push(handler as EventHandler);
  handlers.set(eventType, existingHandlers);

  console.log(`📥 Subscribed to: ${eventType}`);
}

/**
 * Start listening for events
 * Must be called once to activate subscriptions
 */
export async function startListening(): Promise<void> {
  if (isSubscribed) {
    console.log("⚠️ Already listening to events");
    return;
  }

  const subscriber = await getSubscriberClient();

  await subscriber.subscribe(CHANNEL_NAME, async (message) => {
    try {
      const event = JSON.parse(message) as AgentEvent & { timestamp: string };
      const eventHandlers = handlers.get(event.type);

      if (eventHandlers && eventHandlers.length > 0) {
        console.log(`📨 Event received: ${event.type}`);

        // Execute all handlers for this event type
        for (const handler of eventHandlers) {
          try {
            await handler(event);
          } catch (error) {
            console.error(`Handler error for ${event.type}:`, error);

            // Log handler error
            const projectId =
              "projectId" in event.payload
                ? (event.payload as { projectId: string }).projectId
                : "system";

            await prisma.agentLog.create({
              data: {
                projectId,
                agentType: "EVENT_BUS",
                event: "HANDLER_ERROR",
                data: {
                  eventType: event.type,
                  error: (error as Error).message,
                },
                timestamp: new Date(),
              },
            });
          }
        }
      }
    } catch (error) {
      console.error("Failed to parse event:", error);
    }
  });

  isSubscribed = true;
  console.log("🎧 Event bus listening started");
}

/**
 * Event bus singleton with typed methods
 */
export const eventBus = {
  publish,
  subscribe,
  startListening,
};

export default eventBus;
