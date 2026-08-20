import { supabase } from '../lib/supabase';
import type { VibeResult } from '../vibe/types';

export type FeedItem = {
  id: string;
  userId: string;
  score: number;
  analysis: string;
  displayName: string;
  createdAt: string;
  mine: boolean;
};

export type ModerationOutcome = 'done' | 'offline' | 'failed';

export type ShareOutcome = 'shared' | 'offline' | 'auth-unavailable' | 'failed';

const NAME_MOODS = [
  'golden',
  'quiet',
  'velvet',
  'amber',
  'wild',
  'dusk',
  'misty',
  'honey',
  'slow',
  'electric',
];

const NAME_THINGS = [
  'fern',
  'meadow',
  'lantern',
  'ember',
  'river',
  'moth',
  'orchard',
  'signal',
  'grove',
  'halo',
];

function inventDisplayName(): string {
  const mood = NAME_MOODS[Math.floor(Math.random() * NAME_MOODS.length)]!;
  const thing = NAME_THINGS[Math.floor(Math.random() * NAME_THINGS.length)]!;
  return `${mood} ${thing}`;
}

async function currentUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}

// Signs in anonymously on first use and claims a generated display name.
export async function ensureSession(): Promise<string | 'auth-unavailable' | null> {
  if (!supabase) return null;
  const existing = await currentUserId();
  if (existing) return existing;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.session) {
    return error?.code === 'anonymous_provider_disabled' ? 'auth-unavailable' : null;
  }

  const userId = data.session.user.id;
  await supabase
    .from('profiles')
    .upsert({ id: userId, display_name: inventDisplayName() });
  return userId;
}

export async function shareVibe(result: VibeResult): Promise<ShareOutcome> {
  if (!supabase) return 'offline';
  const session = await ensureSession();
  if (session === 'auth-unavailable') return 'auth-unavailable';
  if (!session) return 'failed';

  const { error } = await supabase.from('vibes').insert({
    user_id: session,
    score: result.score,
    analysis: result.analysis,
    factors: result.factors,
  });
  return error ? 'failed' : 'shared';
}

/** Ids this user has blocked. Empty when signed out, since blocks are per-user. */
export async function fetchBlockedIds(): Promise<Set<string>> {
  if (!supabase) return new Set();
  const me = await currentUserId();
  if (!me) return new Set();

  const { data, error } = await supabase
    .from('blocks')
    .select('blocked_id')
    .eq('blocker_id', me);
  if (error || !data) return new Set();
  return new Set(data.map((row) => row.blocked_id));
}

export async function fetchFeed(): Promise<FeedItem[] | null> {
  if (!supabase) return null;
  const me = await currentUserId();

  // Over-fetch a little so hiding blocked authors does not leave a short page.
  const { data, error } = await supabase
    .from('vibes')
    .select('id, score, analysis, created_at, user_id, profiles(display_name)')
    .order('created_at', { ascending: false })
    .limit(80);
  if (error || !data) return null;

  const blocked = await fetchBlockedIds();

  return data
    .filter((row) => !blocked.has(row.user_id))
    .slice(0, 50)
    .map((row) => ({
      id: row.id,
      userId: row.user_id,
      score: row.score,
      analysis: row.analysis,
      displayName: row.profiles?.display_name ?? 'anon',
      createdAt: row.created_at,
      mine: me !== null && row.user_id === me,
    }));
}

/**
 * Apple requires a reporting path for user-generated content, so a report must
 * be recordable by anyone who can see the feed — including a first-time viewer
 * who has no session yet.
 */
export async function reportVibe(
  vibeId: string,
  reason: string
): Promise<ModerationOutcome> {
  if (!supabase) return 'offline';
  const session = await ensureSession();
  if (session === 'auth-unavailable' || !session) return 'failed';

  const { error } = await supabase
    .from('reports')
    .insert({ vibe_id: vibeId, reporter_id: session, reason });
  return error ? 'failed' : 'done';
}

export async function blockUser(userId: string): Promise<ModerationOutcome> {
  if (!supabase) return 'offline';
  const session = await ensureSession();
  if (session === 'auth-unavailable' || !session) return 'failed';
  if (session === userId) return 'failed';

  // Re-blocking someone is a no-op rather than a primary key error.
  const { error } = await supabase
    .from('blocks')
    .upsert(
      { blocker_id: session, blocked_id: userId },
      { onConflict: 'blocker_id,blocked_id' }
    );
  return error ? 'failed' : 'done';
}

export async function unblockUser(userId: string): Promise<ModerationOutcome> {
  if (!supabase) return 'offline';
  const me = await currentUserId();
  if (!me) return 'failed';

  const { error } = await supabase
    .from('blocks')
    .delete()
    .eq('blocker_id', me)
    .eq('blocked_id', userId);
  return error ? 'failed' : 'done';
}

/** Deleting your own post is required alongside reporting and blocking. */
export async function deleteVibe(vibeId: string): Promise<ModerationOutcome> {
  if (!supabase) return 'offline';
  const me = await currentUserId();
  if (!me) return 'failed';

  const { error } = await supabase
    .from('vibes')
    .delete()
    .eq('id', vibeId)
    .eq('user_id', me);
  return error ? 'failed' : 'done';
}

export function timeAgo(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
