import { useCallback, useSyncExternalStore } from "react";
import type { Id } from "../convex/_generated/dataModel";

export const PLAYTHROUGH_STORAGE_KEY = "taxmap.playthroughId";
const PLAYTHROUGH_CHANGE_EVENT = "taxmap:playthrough-change";

export function readPlaythroughId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(PLAYTHROUGH_STORAGE_KEY);
}

export function writePlaythroughId(id: string): void {
  window.localStorage.setItem(PLAYTHROUGH_STORAGE_KEY, id);
  window.dispatchEvent(new Event(PLAYTHROUGH_CHANGE_EVENT));
}

export function clearPlaythroughId(): void {
  window.localStorage.removeItem(PLAYTHROUGH_STORAGE_KEY);
  window.dispatchEvent(new Event(PLAYTHROUGH_CHANGE_EVENT));
}

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(PLAYTHROUGH_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(PLAYTHROUGH_CHANGE_EVENT, onStoreChange);
  };
}

/** False during SSR + hydration; true only after the client store attaches. */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

/** SSR + hydration snapshot is always null; client then reads localStorage. */
export function usePlaythroughId(): Id<"playthroughs"> | null {
  const getSnapshot = useCallback(() => readPlaythroughId(), []);
  const getServerSnapshot = useCallback(() => null, []);
  const id = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return id as Id<"playthroughs"> | null;
}
