# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Running the app

Use the local simulator for design work. Fast Refresh applies edits instantly.

```sh
npx expo run:ios
```

Two host requirements, both easy to misdiagnose from the build output:

- **Xcode 26.4 or newer.** `expo-modules-jsi` and `@expo/expo-modules-macros-plugin`
  ship `Package.swift` manifests declaring `swift-tools-version: 6.2`, which only
  Xcode 26+ can resolve. On older Xcode the build dies with
  `Could not resolve package dependencies: package 'apple' is using Swift tools
  version 6.2.0 but the installed version is X` after several minutes of successful
  compilation, which reads like a dependency problem rather than a toolchain one.
- **An installed simulator runtime.** Xcode does not include one. Check with
  `xcrun simctl list runtimes`; if empty, run `xcodebuild -downloadPlatform iOS`.

EAS Build is unaffected by the first one — its images already run a new enough Xcode,
so the cloud can build commits the local machine cannot.

CocoaPods must be on a modern Ruby (`brew install cocoapods`), and `pod install`
needs a UTF-8 locale — without `LANG=en_US.UTF-8` it fails with
`Unicode Normalization not appropriate for ASCII-8BIT`.

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
