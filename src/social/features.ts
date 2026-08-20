/**
 * Photos are scored on-device and never uploaded. Turning this on would mean
 * adding Supabase Storage, rewriting the privacy policy, and taking on photo
 * moderation for App Store review — so the gate renders score tiles until that
 * is a deliberate decision.
 */
export const SHARE_PHOTOS = false;

/** How long a shared vibe keeps the feed unlocked. */
export const UNLOCK_WINDOW_HOURS = 24;
