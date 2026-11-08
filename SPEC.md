# Tryout — Hackathon Prototype Spec

**UNHack26 · v1 (ready to build) · 2026-11-07**

> **Tryout turns real employer tasks into verified experience.**
> Students prove they're job-ready by doing 3–5 hour workplace challenges. Employers hire based on that work instead of résumés.

The prototype is **two websites sharing one live backend**:

| | URL | Audience | Tagline |
|---|---|---|---|
| **Tryout** | http://localhost:5173 | Students | *Real work. Real proof.* |
| **Tryout for Employers** | http://localhost:5174 | Recruiters & hiring managers | *Hire on proof, not résumés.* |
| **Tryout API** | http://localhost:4000 | Both sites (shared data + real-time events) | — |

---

## 0. TL;DR for builders

- The demo is a **side-by-side, real-time loop** across the two sites. The employer posts a challenge and the student sees it instantly. The student submits and the employer reviews it instantly. The employer publishes results and the student sees their scores, feedback and placement instantly.
- **P0** means that loop works flawlessly on seeded data. Everything else is P1 or P2.
- No real auth, payments or AI. Personas are switched from a dropdown. The AI is a convincing dummy called **Coach**.
- Sessions: **S1** API · **S2** Seed content · **S3** Student site · **S4** Employer site · **S5** Pitch (optional). Integration happens last, in the main session. See §9.

---

## 1. The problem

**How might we** help university students build practical industry skills alongside their theoretical classroom knowledge, so that they can land an entry-level job?

- WHY: companies prefer highly experienced people over recent grads
- WHY: companies avoid the risk of hiring untrained or inexperienced people
- WHY: so "entry-level" postings ask for 1–3 years of experience
- WHY: meanwhile, classrooms focus on theory more than on building skills
- **ROOT:** there is a broad gap between what students are taught and what the job actually needs. There is also **no trusted way to prove practical skill without already having had a job.**

That second half is the **experience paradox**: you need experience to get a job, and you need a job to get experience. Tryout breaks the paradox by letting a student earn experience in an afternoon, in a form an employer can verify.

## 2. The solution

Tryout is a two-sided marketplace of **real workplace tasks**:

- **Students** practice in a **Practice Arena** and complete employer-posted **Live Challenges**. Every scored submission becomes **employer-verified evidence** on their **Proof Profile**, which rebuilds the experience section of a résumé around proof.
- **Employers** post a 3–5 hour task that mirrors the actual job and set a rubric and an applicant cap. They review submissions blind, recognise the top performers. A strong result is a verified certificate on the candidate's Proof Profile, not a ticket to an interview.

### Why this beats what exists

| | Real job tasks | Beyond coding | Employer-verified result | Built for entry-level hiring |
|---|---|---|---|---|
| LeetCode / HackerRank | ✗ puzzles | ✗ | ✗ | partly |
| Kaggle | ✓ | ✗ data only | leaderboard only | ✗ |
| Virtual job simulations | ✓ | ✓ | ✗ self-paced, not employer-scored | partly |
| Handshake / job boards | ✗ | ✓ | ✗ résumé-based | ✓ |
| Upwork / freelancing | ✓ | ✓ | client reviews | ✗ needs a track record |
| **Tryout** | ✓ | ✓ 7 fields | ✓ rubric scores + feedback | ✓ |

### Five product pillars

1. **Real work, time-boxed.** Every task mirrors week-one work for a real entry-level role and must fit in **≤ 5 hours**.
2. **Feedback for everyone.** Every submission gets rubric scores and written feedback. Students keep their IP.
3. **Verified proof.** Employer rubric scores roll up into the Proof Profile: verified hours, placements and a skills radar.
4. **Theory → practice.** Every task shows **From the classroom**, the course concepts it applies (e.g. *Token bucket algorithm, Data Structures & Algorithms*). This is the bridge the HMW asks for.
5. **Fair hiring.** Blind review is on by default, rubrics are transparent, and applicant caps keep the odds reasonable.

## 3. What changed from the original idea, and why

| Original idea | This spec | Why it helps us win |
|---|---|---|
| One platform with two views | **Two websites + one shared live API** | Each audience gets a tailored product (playful vs. pro tool). It also enables the side-by-side real-time demo, which is the moment judges will remember. |
| Employer specifies the task | Employer also defines a **weighted rubric**, with ✨ *Suggest rubric* | Students see exactly how they'll be judged. Employers can score 15 submissions in minutes, and feedback becomes structured. |
| Winner / top 3 recognition | An **optional award**: an employer can add medals for the top 1 or top 3, and the default is no award. Every attempt still gets a **feedback guarantee**, and **IP stays with the student** | Employers can add recognition if they want it, and challenges without one are not a competition. |
| Employers view applicant profiles | **Proof Profile** with verified hours, placements and a skills radar | It answers WHY #3 directly: it replaces "1–3 years of experience" with countable, verified evidence. |
| A pool of problems for practice | Split into a **Practice Arena** (evergreen, instant Coach review) and **Live Challenges** (capped, with a deadline) | Practice builds skill and Live gets you hired. Practice content also exists on day one, which solves the cold-start problem. |
| — | **From the classroom** concept tags on every task | It addresses the ROOT cause explicitly: linking theory to practice. |
| — | **Blind review** by default | Equity story: a student from any school competes on the work alone. |
| Zip upload | Zip + required **approach notes** + **AI-use disclosure** + optional demo link. Employers see the file tree and README in the browser. | Employers evaluate thinking, not just output. We're honest about AI, and reviewing doesn't require downloading anything. |
| Tasks take 3–5 h | **Hard rule: ≤ 5 h**, enforced in the Add Challenge form | It protects students' time and keeps tasks honest. |
| Software-flavoured | **7 fields**: software, data, design, product, marketing, finance, security | It shows the gap isn't only a CS problem and widens the impact. |
| Cap the number of applicants | Kept, and shown to students as **spots left** | Students get transparency and employers control their review load. |
| — | A **Hiring for** field links a challenge to a real open role. Results become a verified certificate on the student's Proof Profile, and a score never triggers an interview by itself. | It makes the employer's value concrete: challenge → verified result → the recruiter's own decision. |
| Ask AI | **Coach** (dummy): recommendations by field on Explore, plus per-task help with quick prompts | It feels real in the demo, carries an honest "Preview" label and is easy to swap for a real LLM later. |

**Cut on purpose** (not in the prototype): real auth, a real LLM, messaging, teams, comments, plagiarism detection, mobile apps and a university portal (the portal appears in the pitch only).

## 4. Personas and the 3-minute demo

- **Maya Chen** (`stu_maya`): CS junior with a Data Science minor at Northbridge University. Three internship rejections that said "1+ years of experience required."
- **Jordan Park** (`emp_jordan`): Talent Lead at **Orbitline Logistics** (fictional), hiring a Junior Backend Engineer.

**Setup:** one laptop with the student site on the left and the employer site on the right (≈ 720 px each), a fresh seed (`npm run reset`), and `demo/maya-rate-limiter.zip` plus `demo/approach-notes.md` ready.

| Time | Screen | Action | What judges see |
|---|---|---|---|
| 0:00 | Slides | Hook: the experience paradox and the 5 whys | The problem lands |
| 0:20 | Student | Maya's Home → Explore → **Software** tile → Ask Coach: "I want to be a backend engineer" | Coach recommends 3 tasks |
| 0:40 | Student | Open **Add rate limiting to our Shipment Tracking API** (Orbitline · Top 3 · $525 · ~4 h) | Brief, rubric, *From the classroom*, "Hiring: Junior Backend Engineer" |
| 1:00 | Student | Submit: drop the zip, paste approach notes, submit | Upload progress, then confetti |
| 1:10 | Employer | A "New submission" toast appears **live** and dashboard counters tick | Real-time across both sites |
| 1:20 | Employer | Review in blind mode ("Candidate K7"): file tree, README, notes → score the rubric → 88 | A fast, fair, structured review |
| 1:45 | Employer | Leaderboard → **Publish results & award** | The candidate is revealed as Maya, in 2nd place |
| 1:55 | Student | Toast: "🥈 You placed 2nd", plus feedback | 4 hours of real work now sits on her Proof Profile |
| 2:05 | Employer | Open the candidate's **Proof Profile**: per-criterion scores, feedback and approach notes | A certificate recruiters can read, not a ticket |
| 2:15 | Employer | Open Maya's **Proof Profile**: 15 verified hours, 🥇🥈🥉, skills radar | "This is the new experience section." |
| 2:30 | Employer | **+ Add challenge** → *Use example* → ✨ *Suggest rubric* → Top 3, cap 50 → Publish | Posting takes 30 seconds |
| 2:45 | Student | The new challenge pops onto Maya's Explore **live** | The loop closes |
| 2:50 | Slides | Business model and the ask | — |

---

## 5. Product scope

### 5.1 Priorities

- **P0 (demo-critical):** everything in the §4 demo, on seeded data, with zero console errors.
- **P1 (makes it shine):** zip file tree with click-to-preview, auto-checks, blind-review toggle, ✨ Suggest rubric, Use example, talent search, skills radar, public profile link, toast/confetti polish, live card preview in the wizard.
- **P2 (only if ahead):** resubmission, a waitlist when a challenge is full, challenge settings (extend or close), keyboard shortcuts in review, dark mode.
- **Out of scope:** see "Cut on purpose" in §3.

### 5.2 Website 1 — Tryout (students) · `apps/student` · :5173

**Global:** top nav (logo · Home · Explore · My work · Profile), an **Ask Coach ✨** button, a notification bell with unread count, and a persona switcher in the avatar menu. Subscribes to SSE and turns events into toasts and data refreshes.

| Route | Pri | Requirements |
|---|---|---|
| `/` Home | P0 | Greeting. Proof snapshot: verified hours, tasks, average score, placements. **Continue** shows joined-but-not-submitted challenges with a countdown and a Submit button. **Recommended for you** lists live challenges matching the student's interests. **Practice to level up** row. Recent notifications. |
| `/explore` | P0 | **Browse by field:** 7 large tiles (icon, label, blurb, open count). This is the "view problems by type" screen, and clicking a tile filters the grid. Toggle between **Live challenges** and **Practice arena**. Type chips, filters (difficulty, ≤ 3 h / ≤ 5 h), search, and sort (newest, closing soon, most spots left). **Card:** company logo and name (or "Tryout Practice"), type chip, title, 2-line summary, ⏱ est. hours, difficulty, spots bar ("23/40 joined"), countdown, and a "Hiring" tag. Banner: "Not sure where to start? Ask Coach." |
| `/challenges/:id` | P0 | **Header:** company, title, type, est. hours, difficulty, countdown, spots ("23 of 40 spots left") and hiring role. **Sections:** Brief (markdown), Deliverables, **How you'll be judged** (rubric with weights), **From the classroom**, starter kit download. **Sticky action card**, which changes with state: *Join (claims 1 of N spots)* → *Submit your work* → *Submitted · under review* → *Result* (rank, per-criterion scores, feedback). **Fair-work box:** feedback guaranteed · you keep your IP. **Ask Coach about this task**, with 4 quick prompts. |
| `/challenges/:id/submit` | P0 | Drag-and-drop zip (validate `.zip` and ≤ 50 MB, show name and size). Approach notes (template placeholder: *What I built / Key decisions & trade-offs / What I'd do with more time*; ≥ 50 chars; counter). Optional demo/repo link and AI-use disclosure. Honor checkbox. Upload with a progress bar. **Success:** confetti and a "what happens next" timeline (Submitted → Employer review → Results & feedback). |
| `/work` My work | P0 | Tabs: **In progress** · **Submitted** · **Results** (score ring, medal, feedback). |
| `/profile` | P0 | The current persona's Proof Profile, plus a "Copy public link" button (P1). |
| `/p/:handle` | P1 | Public Proof Profile without app chrome. This is the link a student puts on LinkedIn. |
| Coach panel | P0 | A chat panel that slides in from the right. **On Explore:** recommendations by field, with mini challenge cards. **On a challenge:** quick prompts (*What is this really testing? · Break it into steps · What does great look like? · Common pitfalls*) plus free text. Typing indicator, typewriter reveal and a "Preview" badge. |

**Proof Profile** (the same concept on both sites):
- Header: avatar, name, school, major, grad year, open-to-work.
- Stat tiles: **Verified hours** · **Employer-verified tasks** · **Average score** · **Placements 🥇🥈🥉**.
- **Skills radar** across the 7 types (P1).
- History timeline: company logo, task, score, medal, feedback excerpt, and a badge reading either *Employer-verified* or *Practice · Coach review*.

### 5.3 Website 2 — Tryout for Employers · `apps/employer` · :5174

**Global:** a dark left sidebar (logo + "for employers" pill, company/persona switcher, Dashboard · Talent) and a top bar with **+ Add challenge**, the bell, and a menu containing **Reset demo data** (P1). Subscribes to SSE, shows toasts ("New submission on *Rate limiting…* — Candidate K7") and refreshes data.

| Route | Pri | Requirements |
|---|---|---|
| `/` Dashboard | P0 | KPI tiles: Active challenges · Submissions · Awaiting review. Challenges table: title, type, status, joined/cap bar, submissions, awaiting review, deadline, and a **Review** button. A live activity feed where new items animate in. |
| `/challenges/new` | P0 | A 4-step wizard (with a live preview of the student-facing card, P1). **1 · The task:** title, type (cards), skills (tags), summary ≤ 140 chars, brief (markdown + "Insert template"), deliverables list, est. hours slider 1–5 ("Platform rule: tasks must fit in 5 hours"), difficulty, classroom concepts (optional), hiring for (optional). **2 · How you'll judge:** rubric rows (name, description, weight %). Weights must total 100, with a live indicator. ✨ **Suggest rubric** (P1). **3 · Limits:** **Applicant cap** (number, presets 25/50/100, or no cap). Deadline (default +7 days). **4 · Review & publish:** the exact student-facing preview → Publish → success screen. A **Use example** button prefills a realistic challenge (P1, used in the demo). |
| `/challenges/:id` | P0 | Header stats: joined/cap, submissions, scored, average score and deadline. **Blind review** toggle (on by default). Tabs: **Submissions** (alias or name, submitted time, auto-checks, your score or *Needs review*, ⭐ shortlist; clicking a row opens the review) · **Leaderboard** (ranked by score, with **Publish results & award**) · **Brief** (read-only preview). |
| `/challenges/:id/review/:submissionId` | P0 | **Left, submission viewer:** README (rendered), a **Files** tree with click-to-preview (P1), approach notes, AI disclosure, demo link, download zip, and auto-checks (P1). **Right, sticky scoring panel:** each rubric criterion with 1–5 buttons, a **live weighted total** (`computeTotalScore`), required feedback, shortlist, and **Save & next unscored**, with progress ("12/15 scored"). |
| Award modal | P0 | Disabled until every submission has scores and feedback ("2 left to score"). Shows the top 3 and reveals identities. Confirming fires confetti and gives the top 3 placement medals. Nothing else happens automatically. |
| `/talent` | P1 | Search and filters (type, minimum average score, open to work). Cards show verified hours, average score, placements and top skills, and open the candidate profile. |
| `/candidates/:idOrHandle` | P0 | The Proof Profile. Submissions to *your* challenges link to the review page. Results from other employers show the score and a feedback excerpt only (no files). |

### 5.4 Real-time moments across the two sites (SSE)

| Action (site) | What appears instantly on the other site |
|---|---|
| Employer publishes a challenge | Student: toast "New from Orbitline: …" (if their interests match), the card appears at the top of Explore, plus a notification |
| Student joins | Employer: the joined counter and the activity feed update |
| Student submits | Employer: toast, activity feed, *Awaiting review* +1, and a new row in Submissions |
| Employer scores | Employer only. Students see results when they're published, which keeps it fair. |
| Employer publishes results | Student: "🥈 You placed 2nd" toast with confetti, and My work and Profile update. Students who didn't place get "Results and feedback are in." |

### 5.5 Business rules

1. **Time-box:** `estHours` is an integer from 1 to 5, validated on both client and server.
2. **Joining:** for a live challenge, a student must join (claim a spot) before submitting. Joining is blocked when the cap is reached, the status isn't `open`, or the deadline has passed. Practice tasks need no join (the student is auto-joined on submit).
3. **One submission** per student per challenge.
4. **Submission:** a `.zip` ≤ 50 MB (check the extension and the `PK` magic bytes) plus approach notes ≥ 50 chars. A demo URL and an AI disclosure are optional. **AI use is allowed and must be disclosed.**
5. **Scoring:** each rubric criterion is scored 1–5. `total = round(Σ score/5 × weight)` gives 0–100, and rubric weights sum to 100. Use `computeTotalScore` from `shared/types.ts` everywhere.
6. **Feedback guarantee:** results can't be published until every submission has scores **and** written feedback (≥ 20 chars).
7. **Results privacy:** students see their scores, feedback and rank only after results are published.
8. **Awarding (optional):** an employer can set an award on a challenge (`placements`: 0 = none, which is the default for new challenges; 1 or 3). When results are published and an award is set, submissions are ranked by total (ties go to the earlier submission) and the top ones become `awarded` (a medal); everyone else becomes `not_selected` and still sees feedback. With no award nobody is ranked and no one is placed. The challenge becomes `awarded`.
9. **IP:** students own their work. This is UI copy only, not enforced.
10. **Blind review** (on by default): names, schools and avatars are replaced by a stable alias (e.g. "Candidate K7") until results are published.
11. **Cross-employer privacy:** an employer can open files only for submissions to their own challenges. For other employers' challenges they see the score and a feedback excerpt.
12. **Verified hours** = Σ `estHours` of employer-scored live/past submissions with a total ≥ 60. Practice counts separately as *practice hours*.
13. **Practice review:** submitting a practice task returns an instant **Coach review** (dummy) with a score and feedback, labelled "Coach review · preview".
14. **New-challenge notifications** go to students whose `interests` include the challenge type.

### 5.6 Dummy AI ("Coach"): convincing, honest, swappable

- All dummy logic lives on the server behind `/api/ai/*` and is marked `// DUMMY-AI`, so a real LLM can replace it without touching either frontend.
- **Recommend mode** (no challenge given): match words in the message against `coachPacks[type].keywords`, falling back to the student's interests. The reply is the field intro, then the learning path, then "Here are 3 tasks that match". It returns `recommendedChallengeIds`: open live challenges first (soonest deadline), then practice.
- **Task mode** (`challengeId` given): quick prompts map to `aiHints.{testing, steps, greatLooksLike, pitfalls}`. Free text is routed by keyword (start/how → steps; judge/score/grade → greatLooksLike plus a rubric summary; mistake/avoid → pitfalls; anything else → testing + steps), with a friendly lead-in.
- **Suggest rubric** (employer) returns `rubricTemplates[type]`.
- **Use example** (employer) returns `wizardExamples[companyId]`.
- Both AI endpoints add 700–1400 ms of artificial latency. The frontends show typing dots and reveal text with a typewriter effect.

---

## 6. Seed content (the dummy tasks)

All companies and people are **fictional**. S2 writes the full text in `shared/content/`, typed by `SeedContent` in `shared/types.ts`. Deadlines are relative to seed time. Seed counts are **totals**, including scripted results.

### Companies

| id | Name | Industry | Hiring for | Employer persona |
|---|---|---|---|---|
| `co_orbitline` | Orbitline Logistics | Logistics software | Junior Backend Engineer; Associate PM | `emp_jordan`, Jordan Park, Talent Lead |
| `co_fernhill` | Fernhill Health | Digital health | Data Analyst I | `emp_priya`, Priya Nair, Analytics Manager |
| `co_kitebird` | Kitebird | Consumer social app | Associate Product Designer | `emp_sam`, Sam Ortiz, Design Director |
| `co_cobalt` | Cobalt Ridge Bank | Regional banking | Financial Analyst (Rotational) | `emp_grace`, Grace Liu, FP&A Manager |
| `co_sproutly` | Sproutly Foods | Packaged foods | Marketing Coordinator | `emp_marcus`, Marcus Bell, Brand Manager |
| `co_ironvale` | Ironvale Security | Managed security | SOC Analyst I | `emp_tomas`, Tomás Reyes, SOC Lead |

### Live challenges (`status: open`)

| id | Company | Type | Title | h | Level | Cap | Deadline | Seed joined / submitted / scored |
|---|---|---|---|---|---|---|---|---|
| `ch_rate_limiter` ★ | Orbitline | software | Add rate limiting to our Shipment Tracking API | 4 | intermediate | 40 | +1 d | 15 / 14 / 14 (incl. Maya joined, not submitted) |
| `ch_churn` | Fernhill | data | Why are patients cancelling their telehealth plans? | 4 | intermediate | 50 | +5 d | 31 / 9 / 4 |
| `ch_onboarding` | Kitebird | design | Redesign first-run onboarding to get new users to a first post | 4 | intermediate | 30 | +6 d | 19 / 6 / 0 |
| `ch_variance` | Cobalt Ridge | finance | Explain the Q3 budget miss to the CFO | 3 | beginner | 40 | +4 d | 12 / 3 / 0 |
| `ch_launch` | Sproutly | marketing | Launch plan for chickpea crisps on a $10k budget | 3 | beginner | 60 | +9 d | 27 / 5 / 0 |
| `ch_soc_triage` | Ironvale | security | Triage a night of SIEM alerts | 3 | intermediate | 35 | +3 d | 22 / 11 / 6 |
| `ch_eta_prd` | Orbitline | product | Write the PRD for live delivery-ETA notifications | 3 | beginner | 25 | +7 d | 8 / 2 / 0 |

★ **Demo challenge.** The top seeded score is ≈ 91 (Hana Sato) and the next is ≈ 84. Generated scores are capped at 85, so Maya, live-scored at ≈ 88, lands **2nd**.

### Practice arena (evergreen, no cap or deadline, `status: open`)

| id | Sponsor | Type | Title | h | Level | Seed joined / submitted / scored |
|---|---|---|---|---|---|---|
| `pr_flaky_tests` | Tryout | software | Fix a flaky test suite | 3 | beginner | 38 / 24 / 24 |
| `pr_messy_data` | Fernhill | data | Reconcile two messy clinic-visit exports | 3 | beginner | 29 / 17 / 17 |
| `pr_a11y_audit` | Tryout | design | Accessibility audit of a checkout page | 3 | beginner | 21 / 12 / 12 |
| `pr_interviews` | Tryout | product | Synthesize six user-interview transcripts into insights | 4 | intermediate | 14 / 7 / 7 |
| `pr_ab_test` | Tryout | marketing | Design and size an email A/B test | 3 | intermediate | 18 / 9 / 9 |
| `pr_3_statement` | Cobalt Ridge | finance | Build a 3-statement model for a coffee subscription startup | 5 | advanced | 11 / 4 / 4 |
| `pr_phishing` | Ironvale | security | Dissect a phishing email and write the staff advisory | 3 | beginner | 33 / 20 / 20 |

### Past challenges (`status: awarded`; these power profiles and history)

| id | Company | Type | Title | h | Ended | Seed j / s / sc | Maya's result |
|---|---|---|---|---|---|---|---|
| `past_csv_import` | Orbitline | software | Build a CSV shipment-import validator | 4 | −20 d | 30 / 22 / 22 | 🥇 1st · ≈ 92 |
| `past_wait_dashboard` | Fernhill | data | Build a clinic wait-time dashboard | 4 | −35 d | 28 / 18 / 18 | 🥉 3rd · ≈ 86 |
| `past_release_notes` | Kitebird | product | Write release notes + an in-app announcement for Groups | 3 | −50 d | 20 / 12 / 12 | ≈ 74 · not placed |

Generated submissions are capped at 85. Anyone who has to place above them must be a **scripted result scoring > 85**: the top-3 places in past challenges, and Hana on the demo challenge.

**Maya's starting state:** 🥇🥉, 11 verified hours, 2 coach-reviewed practice tasks (`pr_flaky_tests`, `pr_messy_data`), joined `ch_rate_limiter` but not submitted, and 3–5 notifications. **After the demo:** 🥇🥈🥉, 15 verified hours.

### Every challenge includes

A markdown brief (*Context · The task · Constraints · What we provide*), 3–5 deliverables, 4–5 rubric criteria (weights = 100), 2–4 *From the classroom* concepts with course names, skills, `aiHints`, realistic `starterFiles` (CSV, a tiny repo, a JSON log…) and 3 submission templates (strong / solid / weak), each with approach notes, files and feedback.

### People

- 10 named students across all 7 fields, including `stu_maya` (handle `maya-chen`) and Hana Sato (software).
- About 40 generated background students (from `background` pools), so leaderboards and talent search look populated.

---

## 7. Technical architecture

```
 apps/student  (Vite + React, :5173)        apps/employer  (Vite + React, :5174)
            \                                        /
             \    REST (X-Demo-User header)  +  SSE  /
              v                                      v
                 server/  Express API  :4000
                   ├─ state  → server/data/db.json   (in-memory, persisted atomically)
                   ├─ files  → server/uploads/*.zip
                   ├─ seeds from shared/content  (SeedContent)
                   └─ types + helpers from shared/types.ts
```

### 7.1 Repo layout and ownership

```
UNHack26/
├─ SPEC.md                  this file (main session)
├─ .claude/launch.json      dev servers "api", "student", "employer" (don't edit)
├─ shared/
│  ├─ types.ts              the contract: types, constants, scoring helpers (S1: additive changes only)
│  ├─ CHANGELOG.md          log of contract changes (S1)
│  └─ content/              seed content (S2); index.ts exports `seedContent`
├─ server/                  S1: API
├─ apps/student/            S3: Website 1
├─ apps/employer/           S4: Website 2
├─ pitch/                   S5: deck, demo script, judge Q&A
├─ demo/                    main session: demo zip + notes
└─ package.json, README.md  main session: npm run setup / demo / reset
```

### 7.2 Stack

- **API:** Node 22, TypeScript run with `tsx watch`, Express 5, zod, multer, adm-zip (read entries in memory and **never extract to disk**), cors. State lives in memory and is written atomically to `server/data/db.json` after each mutation. It's seeded on first boot, on `npm run seed`, on `POST /api/admin/reset`, and automatically when the seed content changes (content hash).
- **Frontends:** Vite + React + TypeScript, Tailwind CSS v4 (`@tailwindcss/vite`), React Router, TanStack Query, lucide-react, react-markdown + remark-gfm, recharts, sonner (toasts), canvas-confetti, `@fontsource-variable/inter`. shadcn/ui is optional.
- **No root workspace.** Each project has its own `package.json`, lockfile and `node_modules`.
- **Shared code:** frontends import `shared/types.ts` through an `@shared` alias (Vite `resolve.alias` plus `server.fs.allow`; tsconfig `paths`, with `../../shared/types.ts` added to `include`). Shared files use erasable TypeScript only (no enums).
- **Real-time:** Server-Sent Events, broadcast to every client. Each client filters events to the current persona.
- **Uploads:** use `XMLHttpRequest` on the client to get upload progress.

### 7.3 Ports and env

| Service | URL | Notes |
|---|---|---|
| API | http://localhost:4000 | CORS for :5173 and :5174 (plus the 127.0.0.1 variants); allow the `X-Demo-User` header |
| Student | http://localhost:5173 | `strictPort: true`; `VITE_API_URL` defaults to http://localhost:4000 |
| Employer | http://localhost:5174 | Same as Student |

### 7.4 Identity (demo personas)

- Every request sends `X-Demo-User: <id>`. A `stu_*` id is a student and an `emp_*` id is an employer user (the company comes from the user). Endpoints that need a persona return 401 `NO_PERSONA` without one, and the wrong role gets 403 `WRONG_ROLE`.
- Requests that can't send headers (downloads, `<a href>`) use `?as=<id>` instead.
- Persona switchers read `GET /api/personas` and persist the choice in localStorage. The defaults are `stu_maya` and `emp_jordan`.

### 7.5 Data model

`shared/types.ts` is canonical. Entities: Company, EmployerUser, Student, Challenge (+ `ChallengeView`), Participation (internal), Submission (+ `SubmissionView`), Notification. Derived: `StudentStats`, `StudentProfile`, `EmployerDashboard`. IDs are prefixed strings (`co_`, `emp_`, `stu_`, `ch_` / `pr_` / `past_`, `sub_`, `ntf_`). Dates are ISO strings.

### 7.6 API contract (base `http://localhost:4000/api`)

Errors look like `{ "error": { "code": "CAP_REACHED", "message": "…" } }`, sent with a fitting HTTP status.

| Method and path | Who | Returns / notes |
|---|---|---|
| `GET /health` | any | `{ ok: true }` |
| `GET /personas` | any | `Personas` |
| `GET /me` | persona | `Me` |
| `GET /challenges` | any | `ChallengeView[]`. Query: `kind, type, companyId, status, q, sort=newest\|deadline\|spots`. Excludes `awarded` unless `status` or `companyId` is given. |
| `GET /challenges/:id` | any | `ChallengeView`, plus `viewer` when the persona is a student |
| `GET /challenges/:id/starter` | any | Starter-kit zip |
| `POST /challenges` | employer | `CreateChallengeInput` → `ChallengeView`. Emits `challenge.created` and notifications. |
| `PATCH /challenges/:id` | owner | `{ status?: 'reviewing', deadline? }` (P2) |
| `POST /challenges/:id/join` | student | `ChallengeView`. Errors: 409 `CAP_REACHED` / `ALREADY_JOINED` / `CLOSED`. |
| `POST /challenges/:id/submissions` | student | Multipart `file, notes, demoUrl?, aiDisclosure?` → `SubmissionView`. Errors: 400 `NOT_ZIP` / `NOTES_TOO_SHORT` / `FILE_TOO_LARGE`, 403 `NOT_JOINED`, 409 `ALREADY_SUBMITTED` / `CLOSED`. Practice tasks get an instant Coach review. |
| `GET /challenges/:id/submissions` | owner | `SubmissionView[]`, newest first |
| `GET /challenges/:id/leaderboard` | owner (students only after award) | Scored `SubmissionView[]`, ranked |
| `POST /challenges/:id/award` | owner | `AwardResponse`. Error: 409 `UNSCORED_SUBMISSIONS`. Emits `challenge.awarded`. |
| `GET /submissions/:id` | owner or author | `SubmissionView` |
| `GET /submissions/:id/download` | owner or author | Zip |
| `GET /submissions/:id/file?path=` | owner or author | `FilePreview` (text files ≤ 100 KB) |
| `POST /submissions/:id/score` | owner | `ScoreSubmissionInput` → `SubmissionView`. Validates criterion ids, scores 1–5 and feedback ≥ 20 chars. |
| `POST /submissions/:id/shortlist` | owner | `{ shortlisted: boolean }` → `SubmissionView` |
| `GET /me/submissions` | student | `SubmissionView[]` (results hidden until published) |
| `GET /students` | employer | `StudentListItem[]`. Query: `q, type, minScore, openToWork, sort=hours\|score\|placements`. |
| `GET /students/:idOrHandle` | any | `StudentProfile`, with `canViewFiles` computed for the viewer |
| `GET /notifications` | persona | `Notification[]`, newest first (students by student id, employers by company id) |
| `POST /notifications/read-all` | persona | `{ ok: true }` |
| `GET /employer/dashboard` | employer | `EmployerDashboard` |
| `GET /employer/example-challenge` | employer | `CreateChallengeInput` from `wizardExamples[companyId]` |
| `POST /ai/coach` | student | `CoachRequest` → `CoachResponse` (dummy) |
| `POST /ai/rubric` | employer | `RubricSuggestRequest` → `RubricSuggestResponse` (dummy) |
| `GET /events` | any | SSE stream of `ServerEvent` (`event: <type>` with JSON `data`), heartbeat every 15 s |
| `POST /admin/reset` | any | Reseeds and emits `system.reset` |

### 7.7 Uploads and files

- Stored at `server/uploads/<submissionId>.zip`. Entries are read in memory with adm-zip to build:
  - `tree`: ≤ 300 paths, skipping `__MACOSX/` and dotfiles
  - `readme`: the first `README*` file, ≤ 20 KB
  - `fileCount`
  - **auto-checks**: README present, tests detected, setup instructions found, size reasonable
- Seeded submissions and starter kits get real zips generated from content at seed time, so the review UI and downloads work for every row.

---

## 8. Design system (one brand, two moods)

- **Brand:** a lowercase `tryout` wordmark (Inter 800, tight tracking) plus a logomark: a 28 px rounded-lg square with an `#4F46E5 → #7C3AED` gradient and a white check glyph. The employer site adds a small `for employers` pill.
- **Typography:** Inter. Headings 700–800, body 400–500, tabular numbers for stats.
- **Shared tokens:**
  - primary `#4F46E5`, accent `#7C3AED`
  - success `#10B981`, danger `#EF4444`
  - text `#0F172A` / `#475569`, border `#E2E8F0`, background `#F8FAFC`
- **Type colors and icons** come from `TYPE_META` in `shared/types.ts`. Use them everywhere so both sites match.
- **Student mood:** bright, encouraging and roomy. Gradient hero, rounded-2xl cards, soft shadows, playful micro-interactions, confetti on submit and award.
- **Employer mood:** calm, dense, "pro tool." Dark sidebar `#0F172A`, white content area, rounded-xl, crisp borders, tables, tabular numbers.
- **Components** (each app builds its own): Button, Card, TypeChip, CompanyLogo (monogram from `logoColor` / `logoInitials`), Avatar (initials), SpotsBar, Countdown, StatTile, Tabs, Dialog/Sheet, Toasts, Skeletons, EmptyState, Markdown.
- **Copy:** warm and direct for students ("You placed 2nd"); outcome-focused for employers ("15 submissions · 3 need review").
- **Quality bar:** both sites must look great at **~720 px wide** (side-by-side demo) **and** at 1440 px. Visible focus rings, AA contrast, skeletons instead of layout jumps, and no console errors.

---

## 9. Work breakdown: sub-sessions

| # | Session | Writes only in | Depends on | Done when |
|---|---|---|---|---|
| S1 | API server | `server/` (+ additive edits to `shared/types.ts`, logged in `shared/CHANGELOG.md`) | Contract (ready) | Every §7.6 endpoint works; `npm run smoke` passes on a fresh seed; typecheck is clean |
| S2 | Seed content | `shared/content/` | Contract (ready) | All §6 content exists; typecheck and the content sanity script pass |
| S3 | Student website | `apps/student/` | API (can stub at first) | Every P0 student flow works against the live API at 720 px and 1440 px |
| S4 | Employer website | `apps/employer/` | API (can stub at first) | Every P0 employer flow works against the live API at 720 px and 1440 px |
| S5 | Pitch and demo script | `pitch/` | Spec | Deck, 3-minute script and judge Q&A exist, with every stat sourced |
| — | Integration (main session) | Root, `demo/`, `README.md` | S1–S4 | `npm run demo` boots everything, and the §4 demo runs cleanly twice in a row |

**Rules for parallel sessions** (all sessions share this one folder):

1. Write only in the directories you own. You may read anything.
2. `shared/types.ts` is the contract. Only S1 changes it, and only **additively** (new optional fields or new types), with each change logged in `shared/CHANGELOG.md`. S3 and S4 work around gaps locally and list them in their report.
3. No root `package.json`, no workspaces, and never run `npm install` at the root.
4. Ports are fixed. Before starting the API, run `curl -s localhost:4000/api/health`; if it answers, reuse it. Never kill a process you didn't start. `tsx watch` reloads the API on its own.
5. Don't edit `.claude/launch.json`.
6. Don't commit, run `git init` or switch branches. Integration handles that.
7. Test destructive flows (award) on challenges **you create yourself**, not on the seeded demo challenges. Avoid `POST /api/admin/reset`, because it wipes everyone's test data. Integration resets before the demo.
8. Don't block on another session. If the API isn't ready, build against the types with a temporary fixture and switch over when it is.
9. Start your final report with the single line `S<n> <name>: DONE|PARTIAL — <summary>`.

**Integration checklist** (main session, after S1–S4 report):

- Root `package.json` with `setup` (installs all three projects), `demo` (runs all three with `concurrently`) and `reset`.
- `demo/maya-rate-limiter.zip`, `demo/approach-notes.md`, and the exact rubric clicks that land Maya in 2nd place.
- Run §4 end to end in two browser tabs at ~720 px. Fix bugs, or route them to the session that owns the code.
- README with run instructions, the architecture diagram and screenshots.
- `git init` and a first commit, with the team's OK. Optional: deploy.

## 10. Judging criteria → how we win

| Criterion | Our answer |
|---|---|
| Impact / problem fit | Hits the root cause (the theory → practice gap) and the symptom (experience requirements) with verified experience. |
| Innovation | A rubric-verified Proof Profile, theory → practice mapping and blind review, across 7 fields. |
| Technical execution | Two real web apps and one live API, with real file uploads, in-browser zip inspection and real-time SSE across both sites. |
| Design / UX | Two tailored experiences under one brand, polished demo paths and no dead ends. |
| Feasibility and business | Cold start is solved by the Practice Arena plus university partners. |
| Presentation | A 3-minute side-by-side live demo with a human story (Maya) and a closed loop. |

## 11. Pitch and business model (for S5)

- **Why employers use it:** a challenge yields a ranked shortlist with real work samples, which costs less than a bad hire or agency fees. S5 must source these numbers.
- **Go-to-market:** one university plus 5 local employers. Professors embed Practice Arena tasks into coursework (theory → practice), and employers' best past challenges become evergreen practice.
- **Roadmap:** a real AI Coach (LLM), AI-assisted triage (never auto-reject), originality checks, automated test harnesses for code tasks, team challenges, ATS integrations and a university portal.
- **Stats:** every number in the deck needs a source. For example, the often-cited TalentWorks (2018) analysis says roughly 61% of "entry-level" postings ask for 3+ years of experience; verify it before using it.

## 12. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Employers drown in submissions | Applicant cap, weighted rubric, auto-checks, Save & next, and AI triage later |
| Cheating or AI-generated work | AI is allowed but must be disclosed; approach notes are required; recruiters can probe the work in their own process; originality checks are on the roadmap |
| Bias | Blind review by default and rubric-first scoring |
| Cold start | The Practice Arena exists on day one, and employers' past challenges become practice |
| Demo failure | Offline-only stack, seeded data, `npm run reset`, a rehearsed script and a backup screen recording |

## 13. Definition of done (demo checklist)

- [ ] `npm run setup && npm run demo` boots the API and both sites from a fresh clone.
- [ ] `npm run reset` restores the exact demo starting state.
- [ ] Every step in §4 works live, side by side, at ~720 px per window.
- [ ] No console errors, no dead buttons on demo paths, and loading and empty states everywhere.
- [ ] The seed looks real: 6 companies, 17 challenges, ~50 students, populated leaderboards and profiles.
- [ ] A backup recording of the demo exists.
