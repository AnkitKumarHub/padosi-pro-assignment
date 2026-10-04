# PadosiPro (take-home)

Full-stack assignment: Express API + Expo mobile app. Product rules are in [`SPEC.md`](./SPEC.md). Submission design summary is in [`DESIGN.md`](./DESIGN.md).

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Compose)
- [Node.js 22 LTS](https://nodejs.org/)
- [pnpm](https://pnpm.io/) 11+
- Android Studio emulator or a physical Android device
- [Expo account](https://expo.dev/signup) for EAS Build (APK)

## 1. Backend (one command)

From the repository root:

```bash
cp .env.example .env
```

Edit `.env`: set `JWT_SECRET` and `OTP_SECRET` to different random strings (at least 32 characters each). Other values can stay as in the example for local use.

```bash
docker compose up --build
```

When healthy:

- API health: `http://localhost:3000/api/v1/health`
- OpenAPI docs: `http://localhost:3000/api/v1/docs`
- Mailpit UI (OTP emails): `http://localhost:8025`

Migrations and task catalogue seed run on API startup.

### Backend checks

```bash
cd backend
pnpm install
pnpm run typecheck
```

## 2. Mobile app (development)

```bash
cd mobile
pnpm install
pnpm start
```

Press `a` for Android emulator, or scan the QR code with a dev client.

**API URL**

| Where you run the app | Default base URL |
| --- | --- |
| Android emulator on same PC as Docker | `http://10.0.2.2:3000/api/v1` (built in) |
| Physical device or APK on LAN | Login -> **Server URL** -> `http://<your-PC-LAN-IP>:3000/api/v1` |

Ensure Windows firewall allows inbound TCP 3000 on your LAN if using a phone or APK.

```bash
cd mobile
pnpm exec tsc --noEmit
```

## 3. Manual flow (reviewer checklist)

1. Register with a new email.
2. Open Mailpit, copy the 6-digit code, verify email.
3. Log in.
4. Complete profile (optional business name).
5. Select tasks (search and multi-select; zero tasks allowed) -> confirm -> save.
6. Home shows tasks or empty state with **Choose tasks**.
7. Force-quit the app and reopen (session and home data persist).
8. Log out.

## 4. Android APK (EAS Build)

Configuration lives in `mobile/eas.json`. Cleartext HTTP is enabled in `app.json` for local API testing.

**Submission APK (preview, installable `.apk`):**

```bash
cd mobile
npx eas-cli@latest build --platform android --profile preview
```

Install the artifact from the Expo build page. On a real device, set **Server URL** to your machine's LAN address as above.

**Development client** (optional, for `expo start` with native modules):

```bash
cd mobile
npx eas-cli@latest build --platform android --profile development
```

### EAS upload on Windows

If `eas build` fails with `EPERM` on symlinks under `mobile/.agents` or `mobile/.aider-desk`, remove those folders or build from a copy outside OneDrive. `mobile/.easignore` excludes agent and design paths from the upload bundle.

## Project layout

```text
backend/          Express API, Drizzle, migrations, seed
mobile/           Expo Router app
docker-compose.yml
.env.example      placeholders only; copy to .env at repo root
```

## Documentation

| File | Purpose |
| --- | --- |
| `SPEC.md` | Product and API contract |
| `DESIGN.md` | One-page architecture and trade-offs (submission) |
| `IMPLEMENTATION.md` | Phase plan and done criteria |
