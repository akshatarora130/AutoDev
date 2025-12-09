/**
 * Supermemory Client
 * SDK client for memory operations
 */

import Supermemory from "supermemory";

let client: Supermemory | null = null;

/**
 * Get or create the Supermemory client
 */
export function getSupermemoryClient(): Supermemory {
  if (client) {
    return client;
  }

  const apiKey = process.env.SUPERMEMORY_API_KEY;

  if (!apiKey) {
    throw new Error("SUPERMEMORY_API_KEY is not set in environment variables");
  }

  client = new Supermemory({
    apiKey,
  });

  console.log("✅ Supermemory client initialized");
  return client;
}

/**
 * Check if Supermemory is configured
 */
export function isSupermemoryConfigured(): boolean {
  return !!process.env.SUPERMEMORY_API_KEY;
}

export default getSupermemoryClient;
