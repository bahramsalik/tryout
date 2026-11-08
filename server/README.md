# Tryout API (`server/`)

Express 5 + TypeScript (run by `tsx`), the shared live backend for both sites. REST under `/api` plus Server-Sent Events. Contract: `../shared/types.ts`. Seed content: `../shared/content/index.ts`.

```bash
npm install
npm run dev          # http://localhost:4000/api, tsx watch (also watches ../shared, reseeds when content changes)
npm run seed         # reseed: resets the running API if one is up on PORT, else writes DATA_DIR directly (--offline forces that)
npm run check-content  # validate shared/content and preview what the seeder generates
npm run typecheck
npm run smoke        # end-to-end test on a private instance (:4100 + temp DATA_DIR); never touches :4000 data
```

| Env | Default | |
|---|---|---|
| `PORT` | `4000` | |
| `DATA_DIR` | `server/data` | `db.json` + `uploads/` (submission zips, `starters/`) |
| `CORS_ORIGINS` | — | extra comma-separated origins (5173/5174 on localhost and 127.0.0.1 are built in) |
| `AI_LATENCY_MIN_MS` / `AI_LATENCY_MAX_MS` | `700` / `1400` | DUMMY-AI latency |
| `SMOKE_PORT` | `4100` | port for `npm run smoke` |
| `CONTENT_ENTRY` | — | tests only: load seed content from another file |

## How data works

- State lives in memory and is written atomically (temp file + rename) to `DATA_DIR/db.json` after every mutation.
- Seeding happens on first boot, on `npm run seed`, on `POST /api/admin/reset`, and automatically whenever the seed content hash changes. Reseeding wipes `uploads/` and regenerates every zip (one per seeded submission plus starter kits).
- If the content fails to import or validate, the API keeps serving the previous `db.json` and logs `SEED CONTENT ERROR` (also visible in `GET /api/health` → `content`).
- The seeder is deterministic (string-seeded PRNG): same content → same students, scores and ids. Only timestamps are relative to seed time.

## Where things are

| File | |
|---|---|
| `src/app.ts` | every route (SPEC §7.6), CORS, error format |
| `src/actions.ts` | mutations: create/join/submit/score/shortlist/award (+ notifications and SSE events) |
| `src/views.ts` | read models and the privacy rules (results hidden until published, file privacy, blind aliases) |
| `src/seed.ts` | deterministic seeder |
| `src/content.ts` | content import + zod/cross-reference validation + hash |
| `src/zip.ts` | in-memory zip inspection (tree, README, auto-checks, previews) — nothing is extracted to disk |
| `src/events.ts` | SSE hub (heartbeat 15 s; `system.reset` on reconnect after a reseed) |
| `src/ai.ts` | `// DUMMY-AI` Coach, rubric suggestions, practice reviews |
