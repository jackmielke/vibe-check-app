import { supabase } from '../lib/supabase';
import type { VibeResult } from '../vibe/types';

export type FeedItem = {
  id: string;
  score: number;
  analysis: string;
  displayName: string;
  createdAt: string;
  mine: boolean;
};

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

export async function fetchFeed(): Promise<FeedItem[] | null> {
  if (!supabase) return null;
  const me = await currentUserId();

  const { data, error } = await supabase
    .from('vibes')
    .select('id, score, analysis, created_at, user_id, profiles(display_name)')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error || !data) return null;

  return data.map((row) => ({
    id: row.id,
    score: row.score,
    analysis: row.analysis,
    displayName: row.profiles?.display_name ?? 'anon',
    createdAt: row.created_at,
    mine: me !== null && row.user_id === me,
  }));
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
