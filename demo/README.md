# Demo cheat sheet

This is the operator's checklist for the 3-minute demo in [SPEC.md §4](../SPEC.md). The word-for-word script lives in `pitch/demo-script.md`.

## 5 minutes before

1. Start everything from the repo root:
   ```bash
   npm run demo
   ```
2. Reset to the exact demo starting state (this wipes any test data):
   ```bash
   npm run reset
   ```
3. Open two browser windows side by side, about 720 px wide each:
   - **Left:** the student site, http://localhost:5173. The persona should be **Maya Chen**.
   - **Right:** the employer site, http://localhost:5174. The persona should be **Jordan Park · Orbitline Logistics**.
4. Have these ready to drag and paste:
   - `demo/maya-rate-limiter.zip`, Maya's submission. It's a real, working solution: `npm test` gives 28/28 passing.
   - `demo/approach-notes.md`, to paste into the *Approach notes* field.
   - The AI disclosure line below.
5. Check the starting state on Maya's profile: `1st` and `3rd` badges, 11 verified hours. She has joined *Add rate limiting to our Shipment Tracking API* but hasn't submitted yet.

## Paste-ready text

**AI disclosure (student submit form):**
> Used an AI assistant to compare rate-limiting algorithms and sanity-check my Retry-After rounding; I rejected its suggestion to call Date.now() in the middleware. Code and tests are mine.

**Rubric clicks (employer review)** for a total of **88**, which puts Maya **2nd** behind Hana's 91. Her notification reads `2nd place`.

| Criterion | Weight | Click |
|---|---|---|
| Correctness | 30 | **5** |
| Design & trade-offs | 25 | **4** |
| Tests | 20 | **4** |
| Code quality | 15 | **4** |
| Communication | 10 | **5** |

**Feedback (employer review):**
> Clean token bucket with the math kept out of Express, and the minute-boundary comparison in the README is exactly the reasoning we want. Deterministic tests cover isolation, tiers and fail-open. To take first place: sketch the Redis Lua script and test Reset on a partially refilled bucket.

## If something goes wrong

- **A site shows stale data:** refresh it. Both sites refetch everything on `system.reset`.
- **A wrong click during scoring:** re-score. The live total updates before you save.
- **The live demo fails entirely:** switch to the backup recording (see `pitch/`).
- **Afterwards:** run `npm run reset` to restore the starting state for the next run.
