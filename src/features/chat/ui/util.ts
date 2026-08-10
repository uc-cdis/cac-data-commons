import type { ChatRecord } from "../core";


export const CHAT_MAX_WIDTH = 820;

export function formatDuration(ms: number): string {
  return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`;
}

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
