interface PendingReply {
  chatId: number;
  messageId: number;
  sessionId: string;
  project: string;
}

export type OnCleanupCallback = (chatId: number, messageId: number) => void;

const MAX_ENTRIES = 200;

export class PendingReplyStore {
  private pending = new Map<string, PendingReply>();
  private onCleanup: OnCleanupCallback | null = null;

  setOnCleanup(cb: OnCleanupCallback): void {
    this.onCleanup = cb;
  }

  set(chatId: number, messageId: number, sessionId: string, project: string): void {
    const key = PendingReplyStore.key(chatId, messageId);
    this.pending.set(key, { chatId, messageId, sessionId, project });
    this.evictOldest();
  }

  get(chatId: number, messageId: number): PendingReply | undefined {
    return this.pending.get(PendingReplyStore.key(chatId, messageId));
  }

  delete(chatId: number, messageId: number): void {
    this.pending.delete(PendingReplyStore.key(chatId, messageId));
  }

  destroy(): void {
    if (this.onCleanup) {
      for (const entry of this.pending.values()) {
        this.onCleanup(entry.chatId, entry.messageId);
      }
    }
    this.pending.clear();
  }

  private evictOldest(): void {
    if (this.pending.size <= MAX_ENTRIES) return;
    const oldest = this.pending.keys().next().value;
    if (!oldest) return;
    const entry = this.pending.get(oldest);
    this.pending.delete(oldest);
    if (entry) this.onCleanup?.(entry.chatId, entry.messageId);
  }

  private static key(chatId: number, messageId: number): string {
    return `${chatId}:${messageId}`;
  }
}
