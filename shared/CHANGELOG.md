# shared/ contract changelog

`shared/types.ts` is the contract between server/, apps/student and apps/employer.
Only the API session (S1) edits it, and only additively. Log every change here, newest first.

| Date/time | Change | Why | Frontends need to… |
|---|---|---|---|
| 2026-11-08 | **Removed** interview invites: `InterviewInvite`, `InviteView`, `InviteStatus`, `CreateInviteInput`, `invite.created` / `invite.updated` events, notification kinds `interview` and `invite_response`, activity kind `invite`, `kpis.interviewsSent`, and the `/invites` and `/me/invites` endpoints | A strong result is a certificate, not a ticket to an interview | Drop any invite UI |
| 2026-11-08 | **Removed** rewards: `Reward`, `RewardMode`, `rewardTotal`, `payout`, `bountiesEarned`, `kpis.bountiesOpen` / `bountiesPaid`, `PLATFORM_RULES.platformFeePct`; added `PLATFORM_RULES.placementCount` (top finishers get a medal) | Tryout is a certificate, not a bounty platform | Drop any reward or payout UI |
| 2026-11-07 (S8) | Values only: `TYPE_META` colors → Fluent palette (≥ 4.5:1 on white and on `softBg`), matching light `softBg`, `blurb` ≤ 5 words with no period | SPEC-FLUENT §6 text diet + Fluent 2 | Nothing; don't add a period after `blurb` |
| 2026-11-07 (S1) | `Challenge.awardedAt?: string \| null` (also on `ChallengeView`) | When results were published; drives "Results published 2 d ago" and the employer activity feed | Optional: show it on awarded challenges |
| 2026-11-07 (S1) | `ChallengeView.avgScore?: number \| null` | Employer challenge header needs "average score"; only sent to the owning company's employers | Employer: use it instead of averaging submissions |
| 2026-11-07 (S1) | `InviteView.student?: Student`; `GET /me/invites` also works for employers (their company's invites, with `student`) | Lets the employer UI know who was already invited (disable "Invite to interview") | Employer: optional |
| 2026-11-07 (S1) | `ApiError.error.issues?: { path; message }[]` | Field-level details for `400 VALIDATION_ERROR` (e.g. the Add-challenge wizard) | Optional: show per-field messages |
| 2026-11-07 (S1) | `challenge.updated` payload gains `reason?: 'joined' \| 'updated' \| 'shortlisted'` and `studentId?` | Employer can toast "A student joined …" without refetching first | Optional |
| 2026-11-07 | v1 created (main session) | Initial contract | — |
