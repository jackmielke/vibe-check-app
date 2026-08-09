# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Running the app

Use the local simulator for design work. Fast Refresh applies edits instantly.

```sh
npx expo run:ios
```

This needs an installed iOS simulator runtime. Xcode on its own does not include
one — check with `xcrun simctl list runtimes`, and install with
`xcodebuild -downloadPlatform iOS` if the list is empty.

The simulator has no camera, so "Take a selfie" cannot be exercised there. Use
"Choose a photo" against the simulator's photo library, or a dev client on a real
device (`npm run build:dev`).

# Shipping a change

Decide by whether the change touches native code.

- JS, styles, copy, assets → `npm run update:prod` publishes over the air in seconds.
- Native deps, config plugins, permissions, icons, SDK version → `npm run build:ios`,
  then `npm run submit:ios`. Budget hours; builds have queued 3+ hours.

`runtimeVersion` uses the `fingerprint` policy, so a native change moves the
fingerprint and older builds stop receiving updates rather than crashing on them.
Do not switch this to `appVersion`.

Builds 15 and earlier were compiled without `expo-updates` and can never receive
an update.

# Fonts

Import per-weight subpaths, not the package root:

```ts
import { Syne_700Bold } from '@expo-google-fonts/syne/700Bold';
```

The `@expo-google-fonts` root modules `require()` every weight, so importing from
them ships fonts nothing renders — and that weight rides along on every OTA update.
