# PadosiPro - Design

One-page summary for reviewers. HTTP routes, request bodies, and error codes: OpenAPI at `http://localhost:3000/api/v1/docs` (with `docker compose up`).

## Architecture

**Shape:** Modular monolith API + native Expo client. One Docker Compose command runs PostgreSQL, Mailpit, and the API. The mobile app runs on a device or emulator and talks to the API over HTTP (not bundled in Compose).

```text
  Expo (Android)          Express API              PostgreSQL
       |    HTTP JSON         |                        |
       +--------------------->+------------------------>
                            |
                            +---- SMTP ----> Mailpit (local inbox)
```

**Backend (`backend/`):** Three feature areas - `auth`, `profile`, `tasks`. Each has `routes.ts` (HTTP + Zod parse), `service.ts` (rules, no `req`/`res`), and `repo.ts` (SQL). Dependencies (DB, clock, mailer) are passed into services for testability. A single error middleware maps `ApiError` and validation failures to the shared JSON error envelope documented in OpenAPI. OpenAPI is generated from the same Zod schemas used at runtime; Scalar serves it at `/api/v1/docs`. Migrations and task-catalogue seed run when the API process starts so reviewers only run `docker compose up`.

**Mobile (`mobile/`):** Expo Router file-based screens. Network calls live in `src/api` (plain `fetch`). The JWT lives only in `expo-secure-store`. Zustand holds in-memory session (user summary); onboarding progress comes from `GET /auth/me`, not local flags. Default base URL targets the Android emulator host (`10.0.2.2`); **Server URL** on the login flow persists a LAN override for physical devices and sideloaded APKs.

**Auth flow (high level):** Register -> OTP email -> verify -> login returns JWT -> profile replace -> task selection replace -> home. Protected routes use bearer middleware. OTP codes are hashed (HMAC) in the database; verification reserves an attempt in SQL before comparing.

## Main trade-offs

| Choice | Why | Cost |
| --- | --- | --- |
| Stateless JWT (7 days) | Simple reviewer flow; no session store | No server-side logout or revoke before expiry |
| Migrations at API startup | Single documented command to a fresh DB | Bad migration blocks the container until fixed |
| HMAC OTP + atomic SQL attempts | Meets security rules; resists parallel guess races | More SQL than a naive read-modify-write in JS |
| Injected clock in services | OTP expiry and cooldowns are testable | Small wiring overhead |
| Client-side task search | ~20 seeded tasks; no pagination needed | Would not scale to a large catalogue |
| Zustand for session only | Shared auth state across routes; forms stay local | Another concept vs. React Context only |
| No edit after task save | Home stays read-only once selection is saved (assignment scope) | Wrong picks need support tooling or a new account in this build |
| Cleartext HTTP on Android APK | Local assignment API is HTTP | Unacceptable for production; dev-only via `expo-build-properties` |
| Manual / limited automated tests for OTP races | Time-boxed take-home | Less CI confidence than Postgres integration tests |

## Left out (deliberately)

- Calls to or assets from **padosipro.com** production
- **WebViews** for any screen
- Password reset, refresh tokens, server-side token revocation
- **iOS** ship (TestFlight / IPA) - Android APK only
- Admin UI to edit the task catalogue
- Payments, notifications push, chat, or marketplace features
- Post-onboarding profile editor and **re-select tasks** after the first save
- E2E UI automation in CI
- Production hosting, managed SMTP, and separate migration jobs

## With another week

1. **Continue onboarding after verification:** After successful email verification, take the user directly into the authenticated onboarding flow instead of requiring a separate login. The current flow works, but asking the user to log in immediately after verifying their email is an unnecessary extra step.

2. **Password reset:** Add password recovery using the existing OTP challenge pattern, including expiry, attempt limits and resend cooldown.

3. **Stronger session management:** Introduce refresh tokens or shorter-lived access tokens with server-side revocation so logout can invalidate sessions immediately.

4. **More complete account editing:** Add profile editing and a supported way to change task selections after onboarding instead of limiting these actions to the initial setup flow.

5. **Stronger abuse protection:** Add login rate limiting and a daily cap on OTP resends in addition to the existing OTP attempt and cooldown protections.

6. **Broader automated testing:** Add a test PostgreSQL environment to cover OTP attempt accounting, concurrency and task-selection transactions more realistically.

7. **Mobile smoke testing:** Add a Maestro or Detox smoke test covering the critical journey from registration through email verification, onboarding and the home screen.

8. **Production readiness:** Move migrations to an explicit deployment step, add environment-specific configuration, use managed email infrastructure and require HTTPS for production mobile builds.
