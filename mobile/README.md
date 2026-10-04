# PadosiPro mobile

Expo SDK 55 app using **Expo Router** (`src/app/`). Session JWT and optional API base URL are stored with **expo-secure-store**. Network calls live in `src/api/`.

**Start here for the big picture:** [repository README](../README.md) (reviewer flow, architecture, APK).  
**API on your machine:** [backend/README.md](../backend/README.md).

## On this page

- [Development](#development)
- [API base URL](#api-base-url)
- [Manual test flow](#manual-test-flow)
- [EAS Build (Android APK)](#eas-build-android-apk)
- [App structure](#app-structure)

---

## Development

```bash
pnpm install
pnpm start
```

| Command | Purpose |
| --- | --- |
| `pnpm start` | Expo dev server (Metro) |
| `npx expo start --dev-client` | Use with an EAS **development** build instead of Expo Go |
| `pnpm exec tsc --noEmit` | Typecheck |
| `pnpm run lint` | ESLint (expo) |

Press **`a`** for Android emulator. The dev server prints a LAN URL (often `http://<PC-IP>:8081`) for physical devices.

**Metro (port 8081)** loads JavaScript. It is not the API.

---

## API base URL

Default when nothing is saved on device (`src/api/client.ts`):

| Where the app runs | Default base URL |
| --- | --- |
| Android emulator on same PC as API | `http://10.0.2.2:3000/api/v1` |
| Physical device / sideloaded APK | Set in app: **Login** (or bootstrap) -> **Server URL** |

Example for a phone on Wi-Fi (replace with your PC IPv4 from `ipconfig` or the Metro banner):

```text
http://192.168.1.3:3000/api/v1
```

Always include the **`/api/v1`** path. Tap **Save** after editing.

Optional env at build time:

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | Overrides the built-in default when SecureStore has no saved URL |

Cleartext HTTP is enabled for Android local testing via `expo-build-properties` in `app.json`. The API must be reachable from the device (firewall: allow inbound TCP **3000** on private networks).

**Sanity check:** open `http://<PC-IP>:3000/api/v1/health` in the phone browser before debugging the app.

---

## Manual test flow

1. Start API: [backend README](../backend/README.md) (`docker compose up --build`).
2. Start Metro: `pnpm start` (or `--dev-client`).
3. Register -> OTP in Mailpit (http://localhost:8025 on the PC).
4. Verify email -> login -> profile -> task selection -> confirm -> home.
5. Force-quit and reopen (session persists while JWT is valid).
6. Log out.

---

## EAS Build (Android APK)

Configuration: [`eas.json`](./eas.json). Project id: `app.json` -> `expo.extra.eas.projectId`.

```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile preview
```

| Profile | Use |
| --- | --- |
| **preview** | Submission-style **APK** (`buildType: apk`, internal distribution) |
| **development** | Dev client; pair with `npx expo start --dev-client` |

Install the artifact from the Expo dashboard, or use the submission APK: [Google Drive (`padosipro.apk`)](https://drive.google.com/file/d/1hjVPTLAa79-mT7oc4EHzJEQnpnmMtfky/view?usp=sharing). Walkthrough: [demo video on Drive](https://drive.google.com/file/d/1DdRpN9acnBiLgTV_FxVdNzJuhOsH_6kM/view?usp=sharing). Reviewers run their own API locally and set **Server URL** on a physical device.

### EAS upload on Windows

If build fails with `EPERM` on symlinks under `.agents` or `.aider-desk`, remove those folders or build outside OneDrive. [`/.easignore`](./.easignore) excludes agent tooling from the upload bundle.

---

## App structure

```text
src/
  app/           Routes (Expo Router): (auth), (onboarding), (app)
  api/           fetch client, auth/profile/tasks API modules
  auth/          SecureStore helpers (token, server URL)
  components/    Shared UI and icons
  store/         Zustand session summary (token stays in SecureStore)
  lib/           Validation, onboarding helpers
```

Further UI notes (optional): [`UI-DESIGN.md`](./UI-DESIGN.md) if present in your tree.
