import type { KnownBlock } from "@slack/web-api";

import { extractProseSnippet } from "../../utils/markdown.js";
import { formatModelName } from "../../utils/stats-format.js";
import type { NotificationData } from "../types.js";

const RESPONSE_TEXT_MAX = 2800;

export function buildNotificationBlocks(
  data: NotificationData,
  responseUrl?: string
): KnownBlock[] {
  const blocks: KnownBlock[] = [];

  blocks.push({
    type: "header",
    text: { type: "plain_text", text: data.projectName, emoji: true },
  });

  const fields: { type: "mrkdwn"; text: string }[] = [
    { type: "mrkdwn", text: `*Agent*\n${data.agentDisplayName}` },
  ];

  blocks.push({ type: "section", fields });

  const summaryText = data.responseSummary
    ? extractProseSnippet(data.responseSummary, RESPONSE_TEXT_MAX)
    : "Task done";

  blocks.push({
    type: "section",
    text: { type: "mrkdwn", text: summaryText },
  });

  const contextElements: { type: "mrkdwn"; text: string }[] = [];

  if (data.model) {
    contextElements.push({ type: "mrkdwn", text: formatModelName(data.model) });
  }

  if (contextElements.length > 0) {
    blocks.push({ type: "context", elements: contextElements });
  }

  if (responseUrl) {
    blocks.push({
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "View Details", emoji: true },
          url: responseUrl,
          action_id: "view_details",
        },
      ],
    });
  }

  return blocks;
}
