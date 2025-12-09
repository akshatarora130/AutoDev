/**
 * LLM Client
 * Unified client for calling LLM APIs (OpenRouter, OpenAI, Anthropic)
 */

import OpenAI from "openai";

let client: OpenAI | null = null;

/**
 * Get or create the OpenAI-compatible client
 * Works with OpenRouter, OpenAI, and Anthropic through OpenAI SDK
 */
function getClient(): OpenAI {
  if (client) {
    return client;
  }

  const provider = process.env.LLM_PROVIDER || "openrouter";
  const apiKey = process.env.LLM_API_KEY;

  if (!apiKey) {
    throw new Error("LLM_API_KEY is not set in environment variables");
  }

  // Configure base URL based on provider
  const baseURLMap: Record<string, string | undefined> = {
    openrouter: "https://openrouter.ai/api/v1",
    openai: undefined, // Uses default OpenAI URL
    anthropic: "https://api.anthropic.com/v1",
  };

  client = new OpenAI({
    apiKey,
    baseURL: baseURLMap[provider],
  });

  console.log(`✅ LLM client initialized (provider: ${provider})`);
  return client;
}

/**
 * Complete a prompt using the LLM
 */
export async function complete(
  prompt: string,
  options?: {
    model?: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
  }
): Promise<string> {
  const openai = getClient();

  const model = options?.model || process.env.LLM_MODEL || "openai/gpt-3.5-turbo";
  const temperature = options?.temperature ?? 0.7;
  const maxTokens = options?.maxTokens ?? 4096;

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

  if (options?.systemPrompt) {
    messages.push({
      role: "system",
      content: options.systemPrompt,
    });
  }

  messages.push({
    role: "user",
    content: prompt,
  });

  try {
    const response = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No response content from LLM");
    }

    return content;
  } catch (error) {
    console.error("LLM completion error:", error);
    throw error;
  }
}

/**
 * Complete and parse JSON response
 */
export async function completeJSON<T>(
  prompt: string,
  options?: {
    model?: string;
    systemPrompt?: string;
    temperature?: number;
  }
): Promise<T> {
  const response = await complete(prompt, options);

  // Try to extract JSON from the response
  let jsonStr = response.trim();

  // Handle markdown JSON blocks
  const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  // Try direct parse first (fastest path)
  try {
    return JSON.parse(jsonStr) as T;
  } catch {
    // Continue with extraction
  }

  // Find the first JSON structure (object or array)
  const objectStart = jsonStr.indexOf("{");
  const arrayStart = jsonStr.indexOf("[");

  let jsonStart = -1;
  let isArray = false;

  if (objectStart === -1 && arrayStart === -1) {
    console.error("No JSON structure found in response:", jsonStr.substring(0, 200));
    throw new Error("No JSON structure found in response");
  } else if (objectStart === -1) {
    jsonStart = arrayStart;
    isArray = true;
  } else if (arrayStart === -1) {
    jsonStart = objectStart;
    isArray = false;
  } else {
    // Both exist, take whichever comes first
    if (arrayStart < objectStart) {
      jsonStart = arrayStart;
      isArray = true;
    } else {
      jsonStart = objectStart;
      isArray = false;
    }
  }

  // Extract from the start of JSON
  jsonStr = jsonStr.slice(jsonStart);

  // Find the matching closing bracket using bracket balancing
  const openBracket = isArray ? "[" : "{";
  const closeBracket = isArray ? "]" : "}";

  let depth = 0;
  let endIndex = -1;
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === "\\") {
      escapeNext = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === openBracket) {
      depth++;
    } else if (char === closeBracket) {
      depth--;
      if (depth === 0) {
        endIndex = i + 1;
        break;
      }
    }
  }

  if (endIndex > 0) {
    jsonStr = jsonStr.slice(0, endIndex);
  }

  // Attempt to parse
  try {
    return JSON.parse(jsonStr) as T;
  } catch (error) {
    // Try to fix common issues
    console.error("Failed to parse JSON, attempting fixes:", jsonStr.substring(0, 200));

    // Try removing trailing commas
    const fixedCommas = jsonStr.replace(/,\s*([}\]])/g, "$1");
    try {
      return JSON.parse(fixedCommas) as T;
    } catch {
      // Continue
    }

    // Try adding missing closing brackets
    const openBraces = (jsonStr.match(/{/g) || []).length;
    const closeBraces = (jsonStr.match(/}/g) || []).length;
    const openBrackets = (jsonStr.match(/\[/g) || []).length;
    const closeBrackets = (jsonStr.match(/]/g) || []).length;

    let fixed = jsonStr;
    for (let i = 0; i < openBrackets - closeBrackets; i++) {
      fixed += "]";
    }
    for (let i = 0; i < openBraces - closeBraces; i++) {
      fixed += "}";
    }

    try {
      return JSON.parse(fixed) as T;
    } catch {
      // Continue
    }

    // Final attempt: extract just the JSON object properties
    if (!isArray) {
      const propsMatch = jsonStr.match(/\{([\s\S]*)/);
      if (propsMatch) {
        try {
          // Try to construct a valid object
          return JSON.parse(`{${propsMatch[1].split("}")[0]}}`) as T;
        } catch {
          // Give up
        }
      }
    }

    console.error("All JSON parse attempts failed. Raw response:", response.substring(0, 500));
    throw new Error(`Failed to parse LLM response as JSON: ${(error as Error).message}`);
  }
}

/**
 * LLM Client singleton
 */
export const llmClient = {
  complete,
  completeJSON,
};

export default llmClient;
