# ORENZA Android Update System

## Current rollout

The current rollout is **ORENZA Android 0.1.5**. The previous baseline was 0.1.4.

The update client is implemented in the shared ORENZA web/Capacitor shell and is intentionally enabled only for the native Android build. Normal web users do not receive an Android update prompt.

## Runtime flow

1. ORENZA starts on Android.
2. The client reads the installed version from Capacitor.
3. The client calls `/api/version` with cache-busting and no-store semantics.
4. The server returns the configured latest Android version, minimum supported version, update policy, release notes, and official Google Play URL.
5. If a newer version exists, ORENZA shows the branded update dialog.
6. **Update Now** opens the official Google Play Store listing for `com.orenzatech.orenza`.
7. **Remind Me Later** suppresses the dialog for 24 hours.
8. **Cancel** dismisses the dialog for the current session.
9. A forced/minimum-version update cannot be dismissed.
10. The client never downloads or silently installs executable packages.

The client also rechecks when the app becomes visible and on a five-minute interval while active. Unmount/cancellation guards prevent late network responses from updating destroyed UI.

## Server configuration

- `ORENZA_ANDROID_LATEST_VERSION` — optional override for the latest supported version; otherwise the application release version is used.
- `ORENZA_ANDROID_MIN_VERSION` — minimum supported version; defaults to `0.1.4` for this rollout so existing 0.1.4 installs can update.
- `ORENZA_ANDROID_FORCE_UPDATE` — set to `true` only for a deliberately enforced update.
- `ORENZA_ANDROID_PLAY_STORE_URL` — official Play Store listing URL override.

Production values belong in Vercel/server configuration, not source control.

## Android release pipeline

The Android pipeline validates:

- web production build
- smoke tests
- Capacitor Android generation/sync
- debug APK
- release APK
- release AAB
- SHA-256 checksums
- Android API 35 emulator install/launch
- GitHub Release publication for explicit Android releases

If the secret `ORENZA_GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` is configured, the release pipeline uploads the validated release AAB to the Google Play **internal** testing track. The Play Store listing must already exist for `com.orenzatech.orenza`. Google Play account/app configuration and signing/release credentials remain external prerequisites.

## Production update policy

Google Play is the authoritative production installation/update channel. GitHub APK artifacts are development/release artifacts and are not presented as the primary production update mechanism.

The release AAB must be signed with production credentials before it can be accepted as a production Play Store release. The current CI release-build validation confirms the AAB is generated and structurally valid; it does not claim production signing unless signing credentials are configured.
