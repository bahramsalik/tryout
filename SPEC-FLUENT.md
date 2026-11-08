# Tryout cleanup spec: less text, fewer controls, Fluent 2

**v1 · 2026-11-07 · branch `fluent2-cleanup`**

**Goal:** both sites should read as designed, not generated. The owner's #1 complaint is **too much text**. We also adopt **Microsoft Fluent 2** and remove buttons and options that don't serve the demo.

**Must not change:** the data flow, API routes, the contract in `shared/types.ts` (except the additive changes S8 is allowed below), seed numbers, or the 3-minute demo in `SPEC.md` §4. Every step of that demo must still work afterwards.

---

## 1. Audit: the five "vibe-coded" signs in Tryout today

| # | Sign | What we found |
|---|---|---|
| 1 | Generic AI aesthetic | 34 gradient uses in the student site and 14 in the employer site; a purple hero; Inter everywhere; 57 emoji in the UI (✨🎉👋🥇…); rounded-2xl cards with soft shadows |
| 2 | Model-sounding copy | Taglines ("Real work. Real proof."), a subtitle under every heading ("Countable, employer-verified evidence. This is your new experience section."), helper text under every wizard field, and Coach replies with lead-ins and learning paths. Word counts: challenge page **888**, Explore **527**, Home **454**, wizard step 1 **254**. |
| 3 | Breadth without depth | 12 stacked sections on the challenge page; Explore has field tiles *and* field chips *and* 4 more filters *and* sort *and* search (48 controls) |
| 4 | Inconsistency | The student site runs Vite 8 and lucide 1.x; the employer site runs Vite 7 and lucide 0.577; the two sites have different card and button styles |
| 5 | Decoration over interaction | Confetti on join, submit, publish and award (7 calls); 54 toasts, including toasts for the user's own actions; keyboard-shortcut legends; "View as a student", "Save without moving on", "Use a feedback template", "Start over" and "Show student card preview" |

## 2. Text budget (the main rule)

1. **Page header:** a title only. At most one meta line of numbers (e.g. `2 active · 38 submissions · 2 to review`). Never an explanatory subtitle.
2. **Section header:** a noun, with no description line under it.
3. **Forms:** label + placeholder. Helper text only for a hard limit (shown as a counter, e.g. `42/140`) or a validation error (Fluent field validation message, shown only when invalid).
4. **Cards:** title + one meta row of icon + value pairs (hours · spots · time left). No summary paragraph on list cards.
5. **No taglines, no emoji, no exclamation marks.** Medals become a small `1st` / `2nd` / `3rd` badge or a Fluent `Trophy` icon colored gold/silver/bronze.
6. **Empty states:** one short line + at most one button.
7. **Toasts:** only for events that come from the *other* site (new submission, results published, new challenge). Your own action shows its result in place (button state, row update) instead of a toast.
8. **Confetti:** one moment only, on the student site when a placement arrives. Remove all other confetti.
9. **Buttons:** one primary button per view. Delete duplicates and any link to the same place twice on a screen.
10. If a sentence explains what the UI already shows, delete it. Target **≥ 50% fewer words** on every page in §1 (measure with `main.innerText`).

## 3. Fluent 2 rules

Reference: https://fluent2.microsoft.design (read the Color, Typography, Shape, Elevation, Layout and Iconography pages). Tokens come from `shared/fluent-tokens.css`, exported from `@fluentui/tokens` `webLightTheme`. Import that file and map Tailwind's theme onto the CSS variables. Don't hand-type hex values.

| Area | Rule |
|---|---|
| Font | `var(--fontFamilyBase)` (Segoe UI, with system fallbacks). Remove Inter / `@fontsource`. Use only the type ramp in the token file (Caption 12/16, Body1 14/20, Subtitle 16–20, Title 24–32; the largest on any page is Title2 28/36). Weights 400 and 600 only. |
| Color | Neutral greys for 90% of the UI. Brand `--colorBrandBackground` (#0F6CBD) for primary buttons, selected states, links and focus. Status colors only for status (success = placed / passed, danger = errors, warning = deadline < 24 h). No gradients anywhere. App background `--colorNeutralBackground2`; cards `--colorNeutralBackground1`. |
| Shape | Controls `--borderRadiusMedium` (4px); cards and dialogs `--borderRadiusLarge` (8px)/`XLarge`; avatars circular; badges `--borderRadiusCircular` or 4px. |
| Elevation | Cards `--shadow4` (or a 1px `--colorNeutralStroke2` border, not both); flyouts and menus `--shadow16`; dialogs `--shadow64`. |
| Spacing | 4px grid. Page padding 24px (16px under 760px wide), card padding 16–20px, gaps 8/12/16/24. |
| Controls | Buttons 32px tall (medium), with appearances primary / secondary (outline) / subtle (transparent). Inputs 32px with a bottom accent stroke on focus. Use a TabList (underline indicator) instead of segmented pills. Checkboxes 16px. Focus = 2px `--colorStrokeFocus2` ring. |
| Icons | **`@fluentui/react-icons`** (Fluent System Icons), 20px Regular, Filled for selected nav. Replace lucide-react completely. Map challenge types locally: software `Code20Regular`, data `DataBarVertical20Regular`, design `DesignIdeas20Regular`, product `Lightbulb20Regular`, marketing `Megaphone20Regular`, finance `Money20Regular`, security `Shield20Regular`. Ignore `TYPE_META.icon`. |
| Motion | `--durationNormal` with `--curveEasyEase` / `--curveDecelerateMid` for hover and press. No page-enter fade, no count-up numbers, no pulsing dots. |
| Brand mark | Wordmark `tryout` in 600 weight next to a 24px `--colorBrandBackground` square with radius 4px and a white checkmark icon. The employer site adds a plain grey `Employers` label. Same mark on both sites. |
| Toolchain | Align both apps on the same versions (Vite 7, React 19, Tailwind 4, `@fluentui/react-icons` 2.x). |

We use Fluent tokens + Fluent icons + Tailwind, **not** the `@fluentui/react-components` library, so both sites stay light and consistent. Build the few primitives each app needs (Button, Card, Badge, TabList, Field, Dialog, MessageBar, Avatar) to Fluent specs.

## 4. Student site (`apps/student`): cuts

| Area | Keep | Remove / change |
|---|---|---|
| Top bar | Logo, Explore, My work, Profile, bell, avatar menu (persona switch) | Home stays as the logo target. A single **Coach** button (subtle, with icon) in the top bar. |
| Home | Title `Hi, Maya`; one **Continue** card for the joined challenge (title, time left, Submit); 4 stat tiles (Verified hours, Tasks, Avg score, Placements); **Recommended** (3 cards) | Gradient hero, hero Coach button, "Practice to level up" row, recent-notifications list (the bell has them), every subtitle. |
| Explore | TabList `Live 7` / `Practice 7`; field filter as one row of toggle pills with counts; search box | The 7 big field tiles, the Coach banner, difficulty / length filters, the sort select (default sort = soonest deadline, practice = newest), the page subtitle. Cards: company logo + name, title, meta row, `Joined` badge. No summary. |
| Challenge | Header: company, title, meta row (~hours, level, spots, time left), primary action (Join → Submit → Submitted → Result), secondary `Starter kit` button. TabList: **Brief** · **Rubric** · **Rules**. Brief = markdown + deliverables checklist + a "Uses" tag row of classroom concepts. Rubric = criteria with weight bars, no descriptions until expanded. Rules = the 4 fair-work items as 4 short lines. | The "Fair work, guaranteed" box, the "Skills you'll show" section, the About company card, step lists in the action card, and the 12 stacked sections |
| Submit | Zip drop zone, Approach notes (placeholder template), AI use (optional), pledge checkbox, Submit (disabled until valid; inline field errors) | Demo link field, the "Still needed …" sentence, the deliverables / rubric repeated below the form. **Success:** `Submitted` + 2 buttons (My work, Explore). No timeline, no auto-check list, no confetti. |
| My work | TabList `In progress` / `Submitted` / `Results` | Per-tab descriptions |
| Profile | Avatar, name, school · major · year, 4 stat tiles, radar, history list (task, company, score, place badge, a 1-line feedback excerpt) | "New experience section" text, bio paragraph (one line max), the "Top verified skills" block |
| Coach panel | Input, 3 quick prompts, replies, recommendation cards | The "Preview" explainer paragraph (keep a small `Preview` badge in the header) |

## 5. Employer site (`apps/employer`): cuts

| Area | Keep | Remove / change |
|---|---|---|
| Shell | Left nav (Dashboard, Talent) with Fluent icons, company switcher at top; top bar with **Add challenge** (primary), bell, menu (Reset demo data) | The header talent search (Talent page has it), the "Active challenges" list in the nav, "Open the student site", the "Live" indicator text, the skip-link stays (a11y). |
| Dashboard | Title `Orbitline Logistics`; 3 stat tiles (Submissions, To review, Active challenges); challenges table; activity feed | The meta line under the title, extra tiles, section descriptions, the duplicate `New` button |
| Challenge | Header meta + Blind review switch; TabList Submissions / Leaderboard / Brief; **Publish results** only on the Leaderboard tab | "View as a student", the header Publish button, the All/Needs review/Scored/⭐ filter chips (one `To review` toggle instead), per-row shortlist stars |
| Review | Submission viewer (README collapsed to ~12 lines with "Show all", file tree + preview, notes, AI use, download), scoring panel (criterion name + 1–5 buttons + live total), feedback (required), **Save & next** | Keyboard legend, "Save without moving on", "Use a feedback template", prev/next arrows, shortlist button, criterion description text (put it in a tooltip) |
| Wizard | 3 steps: **Task** · **Judging** · **Limits** (publish from step 3). **Use example** stays (demo). Fields: title, field, summary (counter), brief, deliverables, hours (1–5), level, hiring for, classroom concepts. Limits step: cap (number + "No cap") and deadline. | Every helper paragraph, the "Show student card preview" toggle, "Start over", the separate Review step (the limits step shows the student card on the right at ≥ 1100px only) |
| Publish success | `Challenge is live` + card + `View challenge` / `Dashboard` | The 3 explanation bullets, confetti |
| Award dialog | Top 3 + 1 line ("Reveals names and sends feedback to students.") → `Publish` | The long warning paragraph |
| Talent | Search + field filter + list | Other filters |
| Candidate | Same profile as the student site | Text blocks as in §4 Profile |

## 6. Server and content (`server/`, `shared/`): text diet

- **Coach replies ≤ 60 words.**
  - Recommend mode: one sentence (e.g. "Backend roles start with changing existing services. Start here:") + the 3 cards. Drop the learning path and the "already joined" paragraph, but keep the joined challenge first in the list.
  - Task mode: the requested list only (steps / pitfalls / rubric), with no lead-ins.
- **Notifications:** title ≤ 6 words, body ≤ 8 words (e.g. `2nd place · $150` / `Add rate limiting…`). Same for activity-feed `text`.
- **Auto-check labels:** `README`, `Tests`, `Setup steps`, `Size OK`.
- **Seed content:** challenge `summary` ≤ 90 characters, rubric-template and wizard-example descriptions ≤ 12 words, `fieldIntro` 1 sentence. Leave briefs, starter files and submission files alone (they're the substance).
- **`TYPE_META`:** colors become Fluent palette values with ≥ 4.5:1 contrast on white (software `#0F6CBD`, data `#00727C`, design `#B4009E`, product `#5C2E91`, marketing `#BC4B09`, finance `#107C10`, security `#C50F1F`); `softBg` = the matching light palette background; `blurb` ≤ 5 words.
- Keep `npm run smoke` passing, and keep the demo numbers (Maya 11 h / $325 / 1st + 3rd; 5/4/4/4/5 = 88 → 2nd).
- Update `demo/README.md` if any on-screen wording it quotes changes.

## 7. Sessions

| Session | Branch / worktree | Writes only | Test ports (never 4000/5173/5174: the owner's demo is running there) |
|---|---|---|---|
| **S6 Student** | own worktree from `fluent2-cleanup` | `apps/student/` | API `PORT=4110`, site `--port 5183` |
| **S7 Employer** | own worktree from `fluent2-cleanup` | `apps/employer/` | API `PORT=4120`, site `--port 5184` |
| **S8 Server + content** | own worktree from `fluent2-cleanup` | `server/`, `shared/` (types: additive / value changes only), `demo/README.md` | `SMOKE_PORT=4130`; for manual checks API `PORT=4130` |

Each session commits on its own branch: small commits, with the message ending in the co-author line. The main session merges the three branches into `fluent2-cleanup`, then runs typecheck + build for both sites, the server smoke test, the content check and the full §4 demo side by side at 720 px, then commits and merges to `main`.

To run a site against your own API in a worktree:

```bash
PORT=4110 CORS_ORIGINS=http://localhost:5183 npm --prefix server run dev
```
```bash
VITE_API_URL=http://localhost:4110 npm --prefix apps/student run dev -- --port 5183 --strictPort
```

## 8. Definition of done

- [ ] Word counts on Home, Explore, Challenge and the Wizard are at least halved (report before → after).
- [ ] No gradients, emoji, Inter, lucide, or confetti outside the placement moment. `grep` proves it.
- [ ] Both sites use `shared/fluent-tokens.css`, Fluent icons, the same brand mark, the same button / card / tab primitives.
- [ ] One primary button per view. Every control listed under "Remove" is gone.
- [ ] Typecheck and production build pass, with no console errors, at 720 px and 1440 px.
- [ ] The §4 demo still works end to end.
