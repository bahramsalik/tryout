# tryout

> **Real employer tasks become paid, verified experience.**
> Students prove they're job-ready on 3–5 hour workplace challenges. Employers hire on proof, not résumés.

This is the UNHack26 prototype: **two websites on one live API**.

| | URL | For |
|---|---|---|
| **Tryout** | http://localhost:5173 | Students: explore real tasks, submit work, earn bounties, build a Proof Profile |
| **Tryout for Employers** | http://localhost:5174 | Employers: post challenges, review blind with a rubric, pay the top performers, invite them to interview |
| **Tryout API** | http://localhost:4000/api/health | The shared data and real-time events behind both sites |

## The problem

*How might we help university students build practical industry skills alongside their theoretical classroom knowledge, so they can land an entry-level job?*

Entry-level postings ask for 1–3 years of experience because hiring someone unproven is risky, and classrooms teach theory more than practice. That's the **experience paradox**: you need experience to get a job, and a job to get experience. Tryout breaks it by turning a real employer task into experience a student can earn in an afternoon and an employer can verify.

## How it works

1. **An employer posts a challenge.** It's a ≤ 5-hour task that mirrors the real job. The employer sets a weighted rubric, a bounty (winner takes all / top 3 / none), an applicant cap and the role they're hiring for. The bounty is escrowed.
2. **Students take it on.** Each task shows *From the classroom*, the course concepts it applies. Coach (a preview AI) helps students find tasks in their field and break them down. A submission is a zip, approach notes, and a disclosure of any AI use.
3. **The employer reviews blind.** They see the file tree, README and notes in the browser, score each rubric criterion 1–5, and can't publish results until every submission has scores and written feedback.
4. **The best get paid and invited.** Results, bounties and interview invites appear on the student's screen in real time. Every scored task adds employer-verified hours and placements to the student's **Proof Profile**.

## Quick start

Requires **Node 22+**.

```bash
npm run setup
```
```bash
npm run demo
```
```bash
npm run reset
```

`setup` installs all three projects. `demo` starts the API, the student site and the employer site together. `reset` restores the exact demo starting state.

The demo personas are **Maya Chen** (student) and **Jordan Park, Orbitline Logistics** (employer). Switch personas from the avatar menu on either site. The full demo walkthrough is in [demo/README.md](demo/README.md) and [SPEC.md §4](SPEC.md).

## Architecture

```
 apps/student (Vite + React :5173)        apps/employer (Vite + React :5174)
              \                                     /
               \     REST (X-Demo-User)  +  SSE    /
                v                                  v
                   server/  Express 5 API  :4000
                     ├─ state  → server/data/db.json (in memory, persisted atomically)
                     ├─ files  → zip uploads, inspected in memory (tree, README, auto-checks)
                     ├─ seed   ← shared/content (6 companies, 17 challenges, ~50 students)
                     └─ types  ← shared/types.ts (one contract, shared scoring helpers)
```

| Path | What it is |
|---|---|
| [`SPEC.md`](SPEC.md) | Product and technical spec: problem, scope, rules, API contract, design system |
| [`shared/types.ts`](shared/types.ts) | The contract shared by all three apps: types, constants, scoring and payout helpers |
| [`shared/content/`](shared/content) | Seed content: fictional companies, students, and 17 realistic tasks with briefs, rubrics, starter kits and sample submissions |
| [`server/`](server) | The API: REST + SSE, the seeder, zip inspection, dummy AI ([README](server/README.md)) |
| [`apps/student/`](apps/student) | Website 1: Tryout for students |
| [`apps/employer/`](apps/employer) | Website 2: Tryout for Employers |
| [`demo/`](demo) | Demo cheat sheet, plus Maya's submission (a working rate limiter, 28/28 tests passing) |
| [`pitch/`](pitch) | Pitch deck, demo script, judge Q&A, sources |

## What's real and what's mocked

**Real:**
- two separate web apps sharing one REST API
- real-time updates across both sites (Server-Sent Events)
- real zip uploads, inspected in the browser (file tree, README, file previews, auto-checks)
- rubric scoring, ranking and payout logic
- blind review, the feedback guarantee, results privacy and cross-employer file privacy
- persisted state

**Mocked:**
- sign-in (a persona switcher)
- payments and escrow (simulated)
- the AI Coach and rubric suggestions: canned responses, marked `// DUMMY-AI`, built to be swapped for a real LLM
- all companies and people, which are fictional

## Scripts

| Command | What it does |
|---|---|
| `npm run setup` | Installs the root, `server`, `apps/student` and `apps/employer` |
| `npm run demo` | Runs the API (:4000), student site (:5173) and employer site (:5174) together |
| `npm run reset` | Reseeds the demo data (it resets the running API if one is up) |
| `npm run smoke` | End-to-end API test on a private instance (:4100) |
| `npm run check` | Typechecks all three projects and validates the seed content |
| `npm run build` | Production builds of both websites |

## Built with

Node 22 · TypeScript · Express 5 · zod · multer · adm-zip · Vite · React · Tailwind CSS v4 · React Router · TanStack Query · Recharts · lucide-react · sonner · canvas-confetti
