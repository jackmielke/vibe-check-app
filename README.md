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

### Local iOS loop (fastest — use this for design work)

Requires **Xcode 26.4+** (SDK 57 ships Swift packages needing Swift tools 6.2) and an
installed simulator runtime. Xcode alone does not include a runtime; download one with:

```sh
xcodebuild -downloadPlatform iOS
```

Then build and run natively. First run compiles the native project (a few minutes);
after that Fast Refresh applies edits instantly.

```sh
npx expo run:ios
```

The simulator cannot use the camera. For camera work, use a dev client on a real
device (see below) or the "Choose a photo" path with a photo added to the simulator.

### Dev client on a real device

One EAS build gets you a dev client on your iPhone. After it is installed, `npm run start`
serves it over wifi with Fast Refresh — including the real camera.

```sh
npm run build:dev
```

## Shipping changes

Two paths, depending on what changed.

**JS, styling, copy, assets → EAS Update (seconds).** Publishes over the air to
builds already on TestFlight. No rebuild, no Apple review.

```sh
npm run update:prod -- --message "tighten result spacing"
```

**Native changes → full build (hours).** Required when native dependencies, config
plugins, permissions, icons, or the Expo SDK change.

```sh
npm run build:ios
npm run submit:ios
```

`runtimeVersion` uses the `fingerprint` policy, so the runtime version is derived from
the native project state automatically. If a change requires a new binary, the fingerprint
changes and old builds simply stop receiving the update instead of crashing on it.

Note: a build must contain `expo-updates` to receive updates at all. Builds 15 and
earlier predate it, so the first build after this change is the one that unlocks OTA.

## Supabase Setup

Create `.env` from `.env.example` and fill in:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Those public Expo variables are expected for mobile clients. The app should rely on Supabase Row Level Security for privacy and authorization.

The live schema is documented in `supabase/schema.sql` (deployed to the "Vibe Check" Supabase project). It covers:

- profiles (anonymous auth + generated display names)
- vibes (the shared feed)
- reports and blocks (safety, required for App Store UGC review)

The first social version is intentionally simple: check your vibe, share the score and analysis to a global feed, read the room. Anonymous sign-ins must be enabled in the Supabase dashboard (Authentication → Sign In / Providers) for sharing to work.

## App Store Prep

Before public App Store review, still needed:

- final app name and subtitle
- screenshots
- privacy policy URL
- support URL
- age rating
- App Privacy answers
- real social moderation/reporting plan if public sharing ships
