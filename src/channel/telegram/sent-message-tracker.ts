import TelegramBot from "node-telegram-bot-api";

import { t } from "../../i18n/index.js";
import { MINI_APP_BASE_URL } from "../../utils/constants.js";
import { logDebug, logWarn } from "../../utils/log.js";

/** Max messages to track for URL updates (oldest are pruned) */
const MAX_TRACKED = 50;
/** Only update messages sent within this window (4 hours) */
const MAX_AGE_MS = 4 * 60 * 60 * 1000;

interface TrackedMessage {
  chatId: number;
  messageId: number;
  responseId: string;
  sessionId?: string;
  sentAt: number;
}

/**
 * Tracks recently sent Telegram notification messages (with web_app buttons)
 * so their inline keyboard can be updated when tunnel URL changes.
 */
export class SentMessageTracker {
  private messages: TrackedMessage[] = [];

  /** Record a sent message for later URL update */
  track(chatId: number, messageId: number, responseId: string, sessionId?: string): void {
    this.prune();
    this.messages.push({ chatId, messageId, responseId, sessionId, sentAt: Date.now() });
    // Keep bounded
    if (this.messages.length > MAX_TRACKED) {
      this.messages = this.messages.slice(-MAX_TRACKED);
    }
  }

  /**
   * Edit all tracked messages to replace old tunnel URL with new one.
   * Called when TunnelManager detects a URL change after reconnect.
   */
  async updateAllForNewTunnelUrl(bot: TelegramBot, newTunnelUrl: string): Promise<void> {
    this.prune();
    if (this.messages.length === 0) return;

    logDebug(
      `[SentTracker] updating ${this.messages.length} messages with new tunnel: ${newTunnelUrl}`
    );

    const toUpdate = [...this.messages];
    for (const msg of toUpdate) {
      try {
        const responseUrl = buildResponseUrl(msg.responseId, newTunnelUrl);
        const markup = buildReplyMarkup(responseUrl, msg.sessionId);
        await bot.editMessageReplyMarkup(markup, {
          chat_id: msg.chatId,
          message_id: msg.messageId,
        });
        logDebug(`[SentTracker] updated msg ${msg.messageId}`);
      } catch (err: unknown) {
        // Message may have been deleted or too old to edit (48h Telegram limit)
        logWarn(`[SentTracker] failed to update msg ${msg.messageId}: ${err}`);
        // Remove failed messages from tracker
        this.messages = this.messages.filter((m) => m.messageId !== msg.messageId);
      }
    }
  }

  /** Remove expired entries */
  private prune(): void {
    const cutoff = Date.now() - MAX_AGE_MS;
    this.messages = this.messages.filter((m) => m.sentAt > cutoff);
  }
}

/** Build mini app response URL with given tunnel base */
function buildResponseUrl(responseId: string, apiBase: string): string {
  const params = new URLSearchParams({ id: responseId, api: apiBase });
  return `${MINI_APP_BASE_URL}/response/?${params.toString()}`;
}

/** Build inline keyboard markup for response button */
function buildReplyMarkup(
  responseUrl: string,
  sessionId?: string
): TelegramBot.InlineKeyboardMarkup {
  const viewText = `📖 ${t("bot.viewDetails")}`;
  const viewButton = responseUrl.startsWith("https://")
    ? { text: viewText, web_app: { url: responseUrl } }
    : { text: viewText, url: responseUrl };

  const buttons: TelegramBot.InlineKeyboardButton[] = [viewButton];
  if (sessionId) {
    buttons.push({ text: "💬 Chat", callback_data: `chat:${sessionId}` });
  }

  return { inline_keyboard: [buttons] };
}
