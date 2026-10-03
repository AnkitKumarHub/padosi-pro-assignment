# CLAUDE.md: rules for the AI agent working in this repo

Project: PadosiPro full-stack take-home (Express/TypeScript API + Expo React Native app).
**`padosi-pro/SPEC.md` is the source of truth.** Read it before any task. If a request conflicts with it, stop and ask; do not silently deviate. The older `Assignment/SPEC.md` (v0.1) is superseded; do not follow it. Technical design lives in `padosi-pro/DESIGN.md` and build order in `padosi-pro/IMPLEMENTATION.md`.

## Stack (do not change without asking)
- Backend: Node 22 LTS, pnpm, TypeScript, Express 5, Drizzle ORM + drizzle-kit, PostgreSQL, zod, bcryptjs, jsonwebtoken, nodemailer, Scalar (OpenAPI docs), Vitest
- Mobile: Expo (managed), Expo Router, TypeScript, expo-secure-store, Zustand (session state only), plain `fetch`, plain `StyleSheet`; APK via EAS Build
- Infra: Docker Compose (postgres, mailpit, api)

## Commands
- Start everything: `docker compose up --build`
- Backend tests: `cd backend && pnpm test`
- Backend typecheck: `cd backend && pnpm exec tsc --noEmit`
- Generate migration: `cd backend && pnpm exec drizzle-kit generate`
- Mobile dev: `cd mobile && npx expo start`
- Mobile typecheck: `cd mobile && npx tsc --noEmit`

## How to work
Follow the AI implementation protocol in `padosi-pro/IMPLEMENTATION.md` section 10 for every phase. It covers inspecting first, planning, approval before any edit (mandatory for auth, OTP, and passwords), phase scope, verification, and reporting. In addition:
1. **Tests first for risky logic** (OTP, login rules, validators). I will review the test cases before you implement.
2. **Small steps, small diffs.** Run typecheck and tests after each logical step, not only at the end of a phase. I commit; you do not run `git commit` unless I ask.
3. **Explain non-obvious choices** in one or two lines. I must be able to defend every file in an interview.
4. **Ask before adding a dependency.** Prefer the standard library or what is already installed.

## Hard rules
- Never log or print passwords, JWTs, OTP codes, or hashes. Never return them in a response, except the JWT returned by a successful login. The OTP exists only in memory and in the email.
- OTP generation uses `crypto.randomInt`, never `Math.random`. OTPs are stored as HMAC-SHA256 with a server secret and compared with `timingSafeEqual`.
- Time-dependent logic takes an injected clock (`lib/clock.ts`); never call `Date.now()` directly inside OTP or auth services.
- Each OTP verification reserves an attempt atomically in SQL *before* the code is compared, never read-modify-write in JS. Counting only wrong attempts after comparing lets parallel guesses bypass the limit.
- Every request body is validated with zod. Every error goes through the central error handler and uses the exact JSON shape and codes in SPEC section 6.
- No secrets in the repo. Only `.env.example` with placeholder values.
- No WebView anywhere. No calls to padosipro.com production APIs. Test data only.
- Do not copy code or assets from padosipro.com.

## Code conventions
- Backend modules: `routes.ts` (HTTP only), `service.ts` (business logic, no `req`/`res`), `schema.ts` (zod). Services receive their dependencies (repo, clock, mailer) as arguments so they can be tested with fakes.
- Mobile: screens stay thin; API calls live in `src/api`, session logic in `src/auth`. Every screen that touches the network handles loading, empty and error states.
- Naming: camelCase in TS, snake_case in SQL. Error codes are SCREAMING_SNAKE_CASE and match SPEC section 6.
- Comments explain *why*, not *what*.

## Definition of done (per phase)
Typecheck passes, tests pass, the feature works end to end in the running stack, no TODOs left in touched code, SPEC.md updated if a decision changed and DESIGN.md if a technical choice changed. Decisions are recorded inline in SPEC with DECISION labels; there is no DECISIONS.md.

## File encoding
Keep docs ASCII-only. Non-ASCII characters such as em dashes have been written as invalid single bytes on this machine.
