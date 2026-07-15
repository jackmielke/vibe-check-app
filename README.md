# Vibe

Vibe is a Field-styled selfie vibe check app built with Expo. It is already set up for EAS iOS production builds and App Store Connect submission.

## Current Shape

- Expo SDK 57 / React Native 0.86
- Camera and photo-library vibe check flow
- Field-inspired green and gold visual system
- Local seeded scoring engine for fast iteration
- Supabase client and draft social schema ready for the next phase

## Development

```sh
npm install
npm run start
```

Run TypeScript checks with:

```sh
npm run typecheck
```

## TestFlight

The EAS project and App Store Connect app ID are already configured in `app.json` and `eas.json`.

```sh
npm run build:ios
npm run submit:ios
```

Apple will process the build in App Store Connect. After processing, testers update through the same TestFlight app listing.

## Supabase Setup

Create `.env` from `.env.example` and fill in:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Those public Expo variables are expected for mobile clients. The app should rely on Supabase Row Level Security for privacy and authorization.

The draft schema lives in `supabase/schema.sql`. It covers:

- profiles
- vibe check posts
- reactions
- follows

This keeps the first social version simple: sign in, post a vibe result, react to friends, and build a feed.

## App Store Prep

Before public App Store review, still needed:

- final app name and subtitle
- screenshots
- privacy policy URL
- support URL
- age rating
- App Privacy answers
- real social moderation/reporting plan if public sharing ships
