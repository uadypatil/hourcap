import { liveQuery } from "dexie";
import { useEffect, useState } from "react";

/** Subscribes to a Dexie live query (called through services/repositories only). */
export function useLive<T>(query: () => Promise<T>, deps: unknown[]): { data?: T; error?: Error } {
  const [state, set] = useState<{ data?: T; error?: Error }>({});
  useEffect(() => {
    const sub = liveQuery(query).subscribe({ next: (data) => set({ data }), error: (error) => set({ error }) });
    return () => sub.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}
