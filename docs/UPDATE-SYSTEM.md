# ORENZA Android Update System

## Status

Implemented in the ORENZA web/Capacitor shell and Android CI pipeline.

## Runtime flow

1. ORENZA starts.
2. The update client reads the installed version from Capacitor when running natively.
3. The client calls `/api/version` with cache-busting and no-store semantics.
4. The server returns the configured latest Android version, minimum supported version, update policy, release notes, and official Google Play URL.
5. If a newer version exists, ORENZA shows an update dialog.
6. **Update Now** opens the official Google Play Store listing for `com.orenzatech.orenza`.
7. **Remind Me Later** suppresses the dialog for 24 hours.
8. **Cancel** dismisses the dialog for the current session.
9. A forced/minimum-version update cannot be dismissed.
10. The client never downloads or silently installs executable packages.

## Server configuration

- `ORENZA_ANDROID_LATEST_VERSION`
- `ORENZA_ANDROID_MIN_VERSION`
- `ORENZA_ANDROID_FORCE_UPDATE`
- `ORENZA_ANDROID_PLAY_STORE_URL`

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

If the secret `ORENZA_GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` is configured, the release pipeline also uploads the release AAB to the Google Play **internal** testing track. The Play Store listing must already exist for `com.orenzatech.orenza`, and Google Play account/app configuration remains an external prerequisite.

## Safety

The update system does not treat GitHub APK downloads as the production update path. Google Play is the authoritative production installation/update channel. A development APK can remain available as a test artifact without being presented as the production update mechanism.
