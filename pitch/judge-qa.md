# Tryout: likely judge questions

Each answer starts with a one-sentence version, followed by a detail line in case the judge follows up. Every number is sourced in [sources.md](sources.md).

---

### 1. What does a recruiter actually learn from a Proof Profile?
**That this person completed the specific project the role needs, and how they work.** Every Live Challenge is posted by an employer for a real open role, with a weighted rubric. The Proof Profile shows only results the employer has published: verified hours, average score, placements, and per-criterion scores with the reviewer's written feedback. Approach notes and the AI-use disclosure show how the candidate worked. Practice Arena results are labelled as Coach reviews so they're never confused with employer-verified work.

### 2. Can't employers just post their real backlog and harvest the solutions?
**Tasks are time-boxed simulations of week-one work, not production tickets, and students keep their IP.** Challenges go through a 5-hour cap and a "Hiring for" role link. If an employer posts repeatedly without ever hiring or publishing results, that shows up in their public history, and we'd moderate it.

### 3. What stops cheating, or someone just using ChatGPT?
**AI use is allowed but must be disclosed, because that's how the job works now. We grade thinking, and recruiters can probe the work themselves.** Every submission requires approach notes and an AI-use disclosure. The rubric weights design reasoning, not just output. Recruiters can probe the work in their own process, where someone who copied it gets found out quickly. Originality checks and automated test harnesses are on the roadmap.

### 4. Cold start: why would students come before employers do, or vice versa?
**Students come first, because the Practice Arena is useful on day one with no employers at all.** Practice tasks get instant Coach feedback. We launch at one university with five local employers, and professors embed Practice Arena tasks into coursework, so students arrive through their classes. Every past employer challenge becomes evergreen practice, so content grows with each one.

### 5. Why would an employer use this?
**It gives them a ranked shortlist of real work samples for a specific open role.** SHRM's 2022 benchmark puts the average US cost per hire at nearly $4,700. We don't claim to replace all of that. We cut the riskiest part, screening unproven grads, with evidence instead of résumés. NACE's Job Outlook 2026 says employers' top tiebreaker between equal candidates is internship experience in their organization or industry. Tryout gives them that signal without a 12-week internship.

### 6. Doesn't this favor students who have free time, or penalize those who work jobs?
**Five hours, done whenever you like, beats a 12-week internship for exactly those students.** The 5-hour cap is enforced and deadlines are days long, so it fits around a job or classes. Blind review means a student from a less-known school competes on the work alone.

### 7. How do you handle bias in review?
**Blind review is on by default, and scoring is rubric-first.** Reviewers see "Candidate K7": no name, school or photo until results are published. The rubric is weighted, set before submissions arrive and visible to students, so reviewers score against criteria rather than going on gut feel. Later, structured scores also let us audit placements for skew.

### 8. IP and legal: who owns the code? Are these employees? Isn't this a contest?
**Students keep ownership of their work, and tasks are time-boxed skill demonstrations.** The cap and the deadline are fixed up front, and employers can't claim the submissions as theirs. For launch we'd have counsel review the terms for contest and worker-classification rules in each jurisdiction. That's a real to-do, and we won't pretend otherwise.

### 9. How can a recruiter trust the results?
**The scores come from the employer's own rubric, applied blind, and only published results count.** The rubric is weighted and visible to students before they start. Reviewers score "Candidate K7", with no name or school, until results are published. A Proof Profile only counts live results after the employer publishes them, and every score is shown per criterion with written feedback, so a recruiter can read why a candidate scored what they did.

### 10. Employers can't review 200 submissions. How does review scale?
**Applicant caps bound the load, and the weighted rubric makes each review take minutes.** Employers set the cap (40 on the demo challenge). The review screen shows the file tree, README and notes in the browser, with no downloads, and "Save & next" moves straight to the next one. Auto-checks flag missing deliverables. Next comes AI-assisted triage that sorts the queue but **never auto-rejects**.

### 11. How is this different from LeetCode or HackerRank?
**They test puzzles. We test the job.** Algorithm puzzles are coding-only and not tied to a role. Tryout tasks mirror week-one work in seven fields, the employer scores them, and they end in a verified Proof Profile that recruiters can read.

### 12. How is this different from Kaggle?
**Kaggle is real work, but only for data, and it's built for leaderboards, not entry-level hiring.** The "verification" is a leaderboard score, and the competitions aren't scoped to 5 hours. We cover seven fields, every submitter gets feedback, and the result goes straight into hiring.

### 13. Aren't virtual job simulations (like Forage) the same thing?
**They're the closest neighbour, but they're self-paced and nobody at the company scores you.** Simulations are great practice, and our Practice Arena is similar. The difference is Live Challenges: an employer with an open role reviews your work and ranks it. That turns the work from practice into verified experience.

### 14. Why not just use Handshake or a job board?
**Job boards still screen on résumés, which is exactly where the experience paradox bites.** Handshake is great for distribution, and we'd happily integrate. But a résumé can't show whether a junior can ship a rate limiter. A Proof Profile can. Longer term, Proof Profiles could be what students attach on those boards.

### 15. What's real and what's mocked in this prototype?
**The loop is real. The login and the AI are not.**
- **Real:** two separate web apps on one live API, real zip uploads, in-browser file tree and README viewing, real-time updates across both sites (server-sent events), rubric scoring, leaderboards, placements and Proof Profiles computed from the scores.
- **Mocked:** auth (personas come from a dropdown), the Coach (a convincing dummy labelled "Preview", built to swap for an LLM) and the companies and people (fictional seed data). There's no plagiarism detection yet.

---

**Quick-fire extras**
- *Why "≤ 5 hours"?* Long enough for real work and short enough to be fair alongside classes and jobs.
- *Why seven fields?* The theory → practice gap isn't only a CS problem, so the same loop works for design, marketing, finance and more.
- *What do universities get?* Practice tasks that slot into coursework now, and a career-center dashboard later.
