import { UNLOCK_WINDOW_HOURS } from './features';
import type { FeedItem } from './api';

/**
 * Post-to-unlock: the feed stays blurred until you have shared recently.
 * Mirrors the mechanic the layout is borrowed from — you see the shape of what
 * everyone posted, but not the content, until you contribute.
 */
export function isUnlocked(feed: FeedItem[] | null): boolean {
  if (!feed) return false;
  const cutoff = Date.now() - UNLOCK_WINDOW_HOURS * 60 * 60 * 1000;
  return feed.some(
    (item) => item.mine && new Date(item.createdAt).getTime() >= cutoff
  );
}

/** Tiles behind the lock. Padded so the grid always fills the screen. */
export function gridTiles(feed: FeedItem[] | null, count: number): (FeedItem | null)[] {
  const source = feed ?? [];
  return Array.from({ length: count }, (_, i) => source[i % Math.max(1, source.length)] ?? null);
}
