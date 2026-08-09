import type { ChatRecord } from "../core";

/**
 * Reading width for the conversation column. Set on the three containers - message
 * stack, composer, error banner - rather than per card, so there's one number.
 */
export const CHAT_MAX_WIDTH = 820;

export function formatDuration(ms: number): string {
  return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Pretty-print a tool result, one key per line. Returns the input untouched when
 * it isn't JSON - a denied approval puts plain feedback text in the result slot.
 */
export function formatJson(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

const DAY_MS = 86_400_000;

export function groupChatsByDay(
  chats: ChatRecord[],
): { label: string; chats: ChatRecord[] }[] {
  const todayStart = new Date().setHours(0, 0, 0, 0);
  const yesterdayStart = todayStart - DAY_MS;

  const groups = [
    { label: "TODAY", chats: [] as ChatRecord[] },
    { label: "YESTERDAY", chats: [] as ChatRecord[] },
    { label: "EARLIER", chats: [] as ChatRecord[] },
  ];

  for (const chat of chats) {
    const bucket =
      chat.updatedAt >= todayStart ? 0 : chat.updatedAt >= yesterdayStart ? 1 : 2;
    groups[bucket].chats.push(chat);
  }

  return groups.filter((group) => group.chats.length > 0);
}
