import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";

import { paths } from "../../utils/paths.js";

export interface CodexNotifyEvent {
  threadId: string;
  turnId: string;
  cwd: string;
  lastAssistantMessage: string;
}

export interface RolloutSummary {
  model: string;
}

const EMPTY_ROLLOUT: RolloutSummary = { model: "" };

export function isValidNotifyEvent(data: unknown): data is Record<string, unknown> {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  return obj["type"] === "agent-turn-complete" && typeof obj["thread-id"] === "string";
}

export function parseNotifyEvent(raw: Record<string, unknown>): CodexNotifyEvent {
  return {
    threadId: typeof raw["thread-id"] === "string" ? raw["thread-id"] : "",
    turnId: typeof raw["turn-id"] === "string" ? raw["turn-id"] : "",
    cwd: typeof raw["cwd"] === "string" ? raw["cwd"] : "",
    lastAssistantMessage:
      typeof raw["last-assistant-message"] === "string" ? raw["last-assistant-message"] : "",
  };
}

export function parseRolloutFile(threadId: string): RolloutSummary {
  try {
    if (!existsSync(paths.codexSessionsDir)) return EMPTY_ROLLOUT;

    const files = readdirSync(paths.codexSessionsDir).filter(
      (f) => f.startsWith("rollout-") && f.endsWith(".jsonl") && f.includes(threadId)
    );
    if (files.length === 0) return EMPTY_ROLLOUT;

    const filePath = join(paths.codexSessionsDir, files[files.length - 1]!);
    const content = readFileSync(filePath, "utf-8");
    const lines = content.split("\n").filter((l) => l.trim());

    let model = "";

    for (const line of lines) {
      let obj: Record<string, unknown>;
      try {
        obj = JSON.parse(line);
      } catch {
        continue;
      }

      if (typeof obj.model === "string" && obj.model) model = obj.model;
    }

    return { model };
  } catch {
    return EMPTY_ROLLOUT;
  }
}

export function extractProjectName(cwd: string): string {
  return basename(cwd) || "unknown";
}
