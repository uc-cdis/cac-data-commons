import { useCallback, useEffect, useState } from "react";
import { type ChatRecord, listChats, renameChat, deleteChat, clearAllChats } from "./db";
import { reportError } from "./errors"


export interface UseChatList {
  chats: ChatRecord[];
  loading: boolean;
  refresh: () => Promise<void>;
  rename: (id: string, title: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  clear: () => Promise<void>;
}

// Sidebar chat history. Re-reads metadata after every mutation rather than
// maintaining a client cache - fewer ways for the list to drift.
export function useChatList(): UseChatList {
  const [chats, setChats] = useState<ChatRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setChats(await listChats());
    } catch (err) {
      reportError("db", err)
    } finally {
      setLoading(false);
    }
  }, []);


  // Client-side only - IndexedDB doesn't exist during the server render.
  useEffect(() => {
    void refresh();
  }, [refresh]);

  const rename = useCallback(async (id: string, title: string) => {
    try {
      await renameChat(id, title);
      await refresh();
    } catch (err) {
      reportError("db", err);
    }
  }, [refresh]);

  const remove = useCallback(
    async (id: string) => {
      try {
        await deleteChat(id); // TODO: surface the returned boolean as a notification
        await refresh();
      }
      catch (err) {
        reportError("db", err);
      }

    },
    [refresh],
  );

  const clear = useCallback(async () => {
     try {
    await clearAllChats();
    await refresh();
     }
     catch (err) {
 reportError("db", err);
     }
  }, [refresh]);

  return { chats, loading, refresh, rename, remove, clear };
}
