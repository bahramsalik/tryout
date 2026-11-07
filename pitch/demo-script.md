# Tryout: 3-minute demo script

The spoken words are what the presenter says out loud. Lines in *italics* tell the driver what to do on screen. The timings follow SPEC §4. At a calm pace this is about 420 spoken words, which leaves room for the clicks.

**Roles:** one **presenter** speaks and one **driver** clicks. A solo presenter can do both: rehearse until the clicks don't need the mouse hunting.

## Setup (before you're called)

- Run `npm run reset`, then reload both tabs. Maya should be on Home, and Jordan should be on the employer dashboard.
- Put both windows side by side at about 720 px each: **left = student** (http://localhost:5173, persona Maya Chen), **right = employer** (http://localhost:5174, persona Jordan Park).
- Have `demo/maya-rate-limiter.zip` in a Finder window you can drag from, and the text of `demo/approach-notes.md` on the clipboard.
- Open the deck on slide 1 in presenter view. Keep the backup recording loaded in a third tab.
- Check the API: `curl -s localhost:4000/api/health` should return `ok: true`. Turn off notifications and close Slack.

---

## 0:00 – 0:20 · Hook (slides 1–3)

*Slide 1: the paradox.*

> Maya is a computer-science junior. Maya's applied for three internships, and every rejection said the same thing: "one-plus years of experience required." That's not unusual. When TalentWorks looked at 95,000 job postings, 61 percent of full-time entry-level jobs asked for three or more years of experience.

*Slide 2: the five whys. Don't read the slide.*

> Companies aren't against grads. They're against risk, so they use experience as a stand-in for proof. And there's no trusted way to prove practical skill without already having had a job.

*Slide 3: the solution.*

> Tryout fixes the proof. Employers post real three-to-five-hour tasks with escrowed bounties. Students do the work and get scored blind, and the best get paid and interviewed. Let me show you.

*Slide 4 ("Live demo") flashes up; switch to the side-by-side windows.*

## 0:20 – 0:40 · Explore and Coach (student, left)

*Maya's Home → **Explore** → click the **Software** tile → open **Ask Coach** and type "I want to be a backend engineer".*

> This is Maya's side. Maya tells Coach they want to be a backend engineer, and it recommends three real tasks from real-world employers.

## 0:40 – 1:00 · The challenge (student, left)

*Open **Add rate limiting to our Shipment Tracking API**. Hover over the escrow badge, then scroll to the rubric and "From the classroom".*

> This one's from Orbitline Logistics, which is hiring a junior backend engineer. It takes about four hours and pays the top three, $525 in total, already in escrow. Maya can see exactly how the work will be graded. And here's "From the classroom": this task applies the token-bucket algorithm from Maya's data-structures course. That's theory meeting practice.

## 1:00 – 1:10 · Submit (student, left)

*Drag the zip onto the drop zone, paste the approach notes and click **Submit**. Wait for the confetti.*

> Maya's done the work, so in go the zip and the approach notes. Submit.

## 1:10 – 1:20 · Live on the employer side (employer, right)

*Point at the "New submission" toast and the dashboard counters as they tick.*

> Now look at the right-hand side. This is Jordan, Orbitline's talent lead. The submission showed up instantly. These are two separate websites on one live backend.

## 1:20 – 1:45 · Blind review (employer, right)

*Click the toast to open **Candidate K7**. Open the file tree, click `README.md`, then the approach notes. Score the rubric using the rehearsed clicks in `demo/`, so the total lands at **88**. Click **Save**.*

> Jordan reviews blind. All Jordan sees is "Candidate K7": no name, no school. Jordan can read the code, the README and the candidate's reasoning right in the browser, with no downloads. Then Jordan scores against the published rubric. That's an 88.

## 1:45 – 1:55 · Publish results (employer, right)

*Go to **Leaderboard** → **Publish results & award** → confirm.*

> Jordan publishes the results. Only now is the candidate revealed: it's Maya, in second place.

## 1:55 – 2:05 · Maya gets paid (student, left)

*Point at the toast "🥈 You placed 2nd — $150 is on its way", then open the feedback.*

> On Maya's side: second place, $150 for four hours of real work, plus written feedback Maya can actually learn from.

## 2:05 – 2:15 · Invite to interview (both)

*Employer: **Invite to interview** → send. Student: point as the invite appears.*

> And because the challenge is tied to a real open role, Jordan sends an interview invite. It lands on Maya's side live. Three rejections for "no experience" turned into an interview in one afternoon.

## 2:15 – 2:30 · Proof Profile (employer, right)

*Open Maya's **Proof Profile**: verified hours, medals and the skills radar.*

> This is Maya's Proof Profile: verified hours, placements and a skills radar, all scored by employers. This is the new experience section of a résumé.

## 2:30 – 2:45 · Posting takes 30 seconds (employer, right)

*Click **+ Add challenge** → **Use example** → **✨ Suggest rubric** → choose **Top 3** and set the cap to 50 → **Publish**.*

> For employers, posting is quick: start from an example, get a suggested rubric, choose top three, cap it at 50, and publish.

## 2:45 – 2:50 · The loop closes (student, left)

*Point as the new challenge appears on Maya's Explore.*

> And it's already on Maya's Explore page. The loop closes.

## 2:50 – 3:00 · Close (slides 7–8)

*Back to the deck. Show slide 7 (business), then slide 8 (ask).*

> Employers pay and students never do: a 15 percent fee on bounties, plus a talent subscription. That whole challenge cost Orbitline about $600 for a ranked shortlist of real work. Our ask: help us pilot with one career center and five hiring managers. Maya didn't need three years of experience. What Maya needed was one afternoon of real work that someone could verify. Thank you.

---

## If the live demo fails: the 30-second fallback

**Trigger:** anything hangs for more than 5 seconds, a toast doesn't arrive or a page errors. Don't debug on stage.

1. *The driver switches to the backup recording tab and presses play, muted. The presenter narrates over it.*
2. If there's no recording either, stay on **slide 4** and say:

> The demo gods are not with us, so here's what you would have seen, in thirty seconds. Maya opens a real Orbitline task: add rate limiting to their shipment API, four hours, $525 in escrow for the top three. Maya submits a zip and notes. On the employer site it appears instantly, and Jordan reviews it blind as "Candidate K7", scores it 88 on the rubric and publishes. Only then is the candidate revealed: Maya, second place, $150 on its way, plus written feedback. Jordan sends an interview invite, and Maya's Proof Profile now shows verified hours and a medal: experience, earned in an afternoon. Happy to run it live at our table afterwards.

3. Go straight to **slide 5** and continue with the close.

## Rehearsal checklist

- [ ] Run it twice in a row from `npm run reset`, timed, finishing under 3:00 both times.
- [ ] The rubric clicks for 88 are written on a sticky note.
- [ ] The zip is in a visible spot, and the notes are on the clipboard.
- [ ] Browser zoom is 100% and both windows are about 720 px wide.
- [ ] The backup recording plays offline.
