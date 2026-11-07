import type { ChallengeModule } from '../lib.ts';

const brief = `## Context
This practice task is set at **Fernway Plant Co.**, a fictional online plant shop that ships houseplants across the US. Every new subscriber gets a welcome email within an hour of signing up, and about 2,500 are delivered in a typical week. The current version (\`welcome_v3\`) has the subject line "Welcome to Fernway: 15% off your first plant inside." Over the last 12 weeks it was delivered 31,567 times and drove 988 orders (3.1% of recipients) and $47,063 in revenue.

Dana Whitfield, Fernway's lifecycle marketing lead, wants to test a personalized subject line, "Your care guide for the {plant you browsed}", against the current one. She launches on Monday and has one question: **"Can we know by Friday?"**

## The task
Design and size the test, then answer Dana honestly.
1. **Hypothesis:** one hypothesis, one primary metric and at least one guardrail metric.
2. **Sample size:** the sample size per variant for a two-sided test at α = 0.05 and 80% power. Show the formula, the baseline and your minimum detectable effect (MDE).
3. **Duration:** turn the sample size into a run time using the actual weekly volume in the data.
4. **Design:** the randomization unit, the split, what stays identical between variants and what you'll exclude.
5. **Decision rule:** written before the test starts, covering what you'll do if B wins, loses or ties.
6. **Reply to Dana:** in plain language, can she know by Friday, and if not, what are her options?

## Constraints
- Time box: about 3 hours.
- Use a spreadsheet, Python, R or an online calculator, but show the formula and inputs so someone can check your numbers.
- Out of scope: writing the email body, tests with more than two variants, and any email other than the welcome email.
- AI use is allowed if you disclose how you used it. Coach reviews your submission as soon as you submit.

## What we provide
- \`data/past-sends.csv\`: the last 12 weekly sends of the welcome email, with list size, delivered, opens, clicks, orders, revenue and unsubscribes.
- \`request.md\`: Dana's message, with details about the email platform and the variants.
- \`README.md\`: what to submit.
`;

const pastSendsCsv = `send_week,email,list_size,delivered,opens,clicks,orders,revenue_usd,unsubscribes
2026-07-27,welcome_v3,2480,2418,1115,222,71,3466.43,10
2026-08-03,welcome_v3,2610,2538,1206,214,80,3570.30,9
2026-08-10,welcome_v3,2395,2337,1141,200,71,3524.93,13
2026-08-17,welcome_v3,2550,2492,1173,239,73,3776.01,10
2026-08-24,welcome_v3,2705,2633,1210,231,89,4060.76,12
2026-08-31,welcome_v3,4120,4028,1893,365,118,5255.30,16
2026-09-07,welcome_v3,2590,2533,1196,222,82,3942.45,10
2026-09-14,welcome_v3,2470,2418,1168,210,78,3800.69,13
2026-09-21,welcome_v3,2640,2583,1205,247,77,3677.76,13
2026-09-28,welcome_v3,2525,2458,1166,208,81,4121.37,11
2026-10-05,welcome_v3,2580,2528,1182,233,82,4035.96,11
2026-10-12,welcome_v3,2655,2601,1282,233,86,3830.96,13
`;

const requestMd = `# Request from Dana Whitfield (Lifecycle Marketing Lead)

**To:** analytics@fernway.example
**Subject:** Welcome email test: can we know by Friday?

Hi!

We'd like to test a new subject line on the welcome email starting Monday.

- **A (current, welcome_v3):** "Welcome to Fernway: 15% off your first plant inside"
- **B (new):** "Your care guide for the {plant you browsed}"

The idea behind B: people sign up while browsing a specific plant, and our post-purchase survey says "I was worried I'd kill it" is the #1 reason people hesitate. A care guide might feel more helpful than another discount.

The body of the email can be anything you need it to be. Right now it has the 15% code (WELCOME15), three bestsellers and a link to our care library.

**Why Friday:** I'm presenting Q4 lifecycle plans to our founders on Friday afternoon and would love to say which subject line won. What I really care about is first orders.

A few things that might help:
- Our email platform (Postbloom) can randomly assign new subscribers to A or B at sign-up, at any split we choose. It shows opens, clicks, unsubscribes and attributed orders (7-day window) per variant.
- The welcome email is sent automatically within 1 hour of sign-up, 7 days a week.
- The big week starting Aug 31 was the Fall Plant Swap pop-up, when we collected sign-ups in person at the event. That doesn't happen again this year.
- About 18% of new subscribers sign up from the footer form without browsing a plant first.

Thanks!
Dana
`;

const starterReadme = `# Practice: design and size an email A/B test

You're the analyst Dana emailed. Read \`request.md\`, then use \`data/past-sends.csv\` for your baselines and volume.

## Files
| File | What's in it |
|---|---|
| \`request.md\` | Dana's request, the two subject lines and the platform's capabilities |
| \`data/past-sends.csv\` | 12 weekly sends of welcome_v3 (week starting Monday) |

### Column notes for past-sends.csv
- \`delivered\`: emails that reached an inbox (list_size minus bounces)
- \`opens\`: unique opens (note that some mail apps auto-open messages)
- \`clicks\`: unique clickers
- \`orders\`: first orders attributed within 7 days of the send
- \`revenue_usd\`: revenue from those orders
- \`unsubscribes\`: unsubscribes from this email

## What to submit
A zip with:
1. **README.md**: a short summary of your test plan and your answer to Dana.
2. **Test plan**: hypothesis, metrics, design and the decision rule.
3. **Sample-size work**: the formula, inputs and result, as a markdown file, spreadsheet or notebook.
4. **Reply to Dana**: a few plain-language paragraphs she could forward to the founders.

Then add short approach notes in the submission form.
`;

/* ───────────── Strong template ───────────── */

const strongReadme = `# Welcome email subject-line test: plan and answer

## Short answer for Dana
**No, not by Friday.** By Friday we'd have about 1,800 delivered emails (about 900 per variant), which can only detect a 42% jump in clicks. With orders, the metric Dana cares about, detecting even a 10% lift would take about 102,000 emails, or roughly 41 weeks at our volume.

**What we can do:** run a 4-week test with **click rate** as the primary metric (sized to detect a 20% relative lift) and orders and revenue as secondary and guardrail metrics. Results would be in hand on the Monday after week 4. On Friday Dana can present the test, its timing and what each outcome will mean.

## The test at a glance
| | |
|---|---|
| Hypothesis | A care-guide subject line makes more new subscribers click into the shop than a 15%-off subject line, because fear of killing the plant is the #1 purchase hesitation. |
| Primary metric | Click rate = unique clickers / delivered (baseline 8.95%) |
| Secondary | First-order rate per delivered (baseline 3.13%) |
| Guardrails | Unsubscribe rate (baseline 0.45%), revenue per recipient (baseline $1.49) |
| Design | 50/50 random split by subscriber at sign-up; subject line and preheader are the only differences |
| Sample size | 4,345 delivered per variant (8,690 total), two-sided α = 0.05, 80% power, MDE 20% relative |
| Duration | 4 full weeks (about 10,000 delivered at 2,500 per week) |
| Decision | Pre-registered; see \`test-plan.md\` |

## Files
- \`test-plan.md\`: hypothesis, metrics, design, exclusions and decision rule
- \`sample-size.md\`: baselines, formula, worked math and the options table
- \`reply-to-dana.md\`: plain-language reply she can forward

## Why not open rate?
Opens are inflated by mail apps that auto-open messages, and a subject line test that "wins" on opens can still lose on orders. Clicks are the first behavior that's both reliably measured and close to purchase.
`;

const strongTestPlan = `# Test plan

## Hypothesis
**If** new subscribers see a subject line offering a care guide for the plant they browsed (B) instead of a 15%-off subject line (A), **then** more of them will click into the shop, **because** "I was worried I'd kill it" is the top purchase hesitation, and a guide addresses it directly.

## Metrics
| Role | Metric | Definition | Baseline (12 weeks) |
|---|---|---|---|
| **Primary** | Click rate | unique clickers / delivered | 2,824 / 31,567 = **8.95%** |
| Secondary | First-order rate | 7-day attributed first orders / delivered | 988 / 31,567 = 3.13% |
| Guardrail | Unsubscribe rate | unsubscribes / delivered | 141 / 31,567 = 0.45% |
| Guardrail | Revenue per recipient | revenue / delivered | $47,062.92 / 31,567 = $1.49 |
| Not used | Open rate | | Inflated by auto-opens; not a decision metric |

## Design
- **Randomization unit:** the subscriber (email address), assigned by Postbloom at sign-up, 50/50. Each person only ever sees one variant.
- **Only the subject line and preheader change.** Both bodies keep the 15% code (WELCOME15), the bestsellers and the care-library link. Otherwise we'd be testing "discount vs no discount", not the subject line.
- **Footer sign-ups with no browsed plant (about 18%):** B falls back to "Your houseplant care guide is inside." They stay in the test (randomized like everyone else) and I'll report them as a segment.
- **Run whole weeks only** (4 Monday-to-Sunday weeks) so weekday and weekend sign-ups are balanced.
- **Exclusions:** internal and test addresses, and anyone who re-subscribes during the test (they keep their first assignment).
- **Sample ratio check:** after week 1, confirm the split is within 48–52%. If it's not, assignment is broken and we fix it before going on.

## Decision rule (pre-registered)
Read once, after 4 full weeks (target: 4,345+ delivered per variant). No early stopping on peeks.
1. **Ship B** if its click rate is higher with two-sided p < 0.05 **and** unsubscribes are no more than 0.2 points higher than A's **and** revenue per recipient is not lower by more than 10%.
2. **Keep A** if B is significantly worse on clicks or fails a guardrail.
3. **No significant difference:** keep A (cheaper to keep, no change risk), and test the care guide as email 2 of the welcome series instead.
4. Orders are reported with a confidence interval but **don't decide** the test. At about 5,000 per variant we can only detect a 31% or larger change in orders.
`;

const strongSampleSize = `# Sample size and duration

## Inputs from past-sends.csv (12 weeks, 31,567 delivered)
- Click rate p1 = 2,824 / 31,567 = **0.0895**
- First-order rate = 988 / 31,567 = **0.0313**
- Weekly volume: 31,567 / 12 = 2,631, but that includes the Fall Plant Swap week (4,028), which won't recur. **Without it: 27,539 / 11 = 2,504 delivered per week.** I use 2,500.

## Formula (two proportions, two-sided)
n per variant = (z₁₋α/₂ + z₁₋β)² × [p1(1 − p1) + p2(1 − p2)] / (p2 − p1)²

α = 0.05 two-sided → z = 1.960 · power 80% → z = 0.842 · (1.960 + 0.842)² = **7.849**

## Primary: click rate, MDE 20% relative
p1 = 0.0895, p2 = 0.0895 × 1.20 = 0.1074, p2 − p1 = 0.0179

- p1(1 − p1) = 0.0895 × 0.9105 = 0.08149
- p2(1 − p2) = 0.1074 × 0.8926 = 0.09587
- sum = 0.17736 · (0.0179)² = 0.00032041
- n = 7.849 × 0.17736 / 0.00032041 = **4,345 per variant**
- Total = 2 × 4,345 = **8,690 delivered**
- Duration = 8,690 / 2,500 = 3.5 weeks → **4 full weeks** (about 10,000 delivered)

## Options for Dana
| Primary metric | MDE (relative) | n per variant | Total | Weeks at 2,500/wk |
|---|---|---|---|---|
| First-order rate (3.13%) | 10% | 50,926 | 101,852 | 40.7 |
| First-order rate (3.13%) | 20% | 13,314 | 26,628 | 10.7 |
| **Click rate (8.95%)** | **20%** | **4,345** | **8,690** | **3.5 → run 4** |
| Click rate (8.95%) | 10% | 16,682 | 33,364 | 13.3 |

## What "by Friday" buys
Monday to Friday ≈ 5/7 × 2,504 ≈ 1,790 delivered, about 895 per variant. The smallest click-rate lift detectable at 80% power is then 2.802 × √(2 × 0.08149 / 895) / 0.0895 ≈ **42% relative**. That's a lift we shouldn't expect from a subject line, so a Friday read would most likely be noise.

## Sanity checks
- Is a 20% lift on clicks plausible? It's ambitious for a subject line, so a null result is a real possibility. That's why the decision rule says what to do on a tie.
- I didn't apply a one-sided test. Dana would want to know if B is worse, too.
`;

const strongReply = `# Reply to Dana

Hi Dana,

Short version: **we can't know by Friday, but we can know in four weeks**, and you can present the test on Friday.

**Why not Friday.** By Friday about 1,800 people will have received the welcome email, roughly 900 per version. With groups that small, the care-guide version would have to beat the current one by more than 40% before we could tell it apart from luck. Subject lines rarely move results that much, so a Friday "winner" would most likely be noise.

**Why not orders.** Only about 3 in 100 recipients place a first order. To reliably spot even a 10% improvement in orders we'd need about 100,000 recipients, which is around 40 weeks of sign-ups.

**What I recommend.**
- Run the test for 4 full weeks, 50/50, starting Monday.
- Judge it on **clicks** (about 9 in 100 recipients click today), sized to catch a 20% improvement.
- Keep the 15% code in both emails so we're only testing the subject line.
- Watch unsubscribes and revenue per recipient so a "win" on clicks can't hide a loss.
- We'll read the result once, on the Monday after week 4, using rules we write down now.

**For Friday's meeting:** "We're testing whether a care-guide subject line beats a discount subject line. Results in four weeks. If it wins, we roll it out; if it ties, we move the care guide into the second welcome email."

Happy to walk through any of this before Friday.
`;

/* ───────────── Solid template ───────────── */

const solidReadme = `# Welcome Email A/B Test Plan

## Summary
We'll test Dana's new care-guide subject line (B) against the current 15%-off subject line (A) on the welcome email, with click rate as the primary metric. Based on my sample-size calculation, we need about **3,422 delivered emails**, which at our average of 2,631 per week is about **9–10 days**. So we can't know by this Friday, but we'll have an answer by **Wednesday of next week**.

## Hypothesis
A care-guide subject line will increase the click rate of the welcome email compared to the 15%-off subject line, because new subscribers' biggest hesitation is worrying they'll kill the plant, and a guide speaks to that directly.

## Metrics
- **Primary:** click rate (clicks / delivered), baseline 8.95%
- **Secondary:** first-order rate (orders / delivered), baseline 3.13%
- **Guardrail:** unsubscribe rate, baseline 0.45%

## Design
- Postbloom randomly assigns each new subscriber to A or B at sign-up (50/50)
- Only the subject line changes; the body (including the 15% code) stays the same
- Exclude internal test addresses

## Decision rule
After 10 days, if B's click rate is higher than A's at p < 0.05 and the unsubscribe rate isn't meaningfully higher, roll out B. Otherwise keep A.

## Files
- \`test-plan.md\`: full plan
- \`sample-size.md\`: calculation

## Message for Dana
Not by Friday, sorry! But it's close: we'll have a reliable answer by the middle of next week, so you could share it as a follow-up to the founders.
`;

const solidTestPlan = `# Test plan

## Background
The welcome email (welcome_v3) is delivered to about 2,631 new subscribers per week. Over the last 12 weeks it averaged a 47.3% open rate, 8.95% click rate and 3.13% order rate per delivered email.

## Hypothesis
Changing the subject line from "Welcome to Fernway: 15% off your first plant inside" to "Your care guide for the {plant you browsed}" will increase click rate.

## Why click rate
Open rate isn't reliable because some mail apps auto-open emails. Orders are what matter most, but they're rare (3.13%), so a test on orders would take much longer. Clicks are a good middle ground.

## Variants
| | Subject | Body |
|---|---|---|
| A | Welcome to Fernway: 15% off your first plant inside | Current |
| B | Your care guide for the {plant you browsed} | Current |

## Randomization
Subscriber-level random assignment at sign-up, 50/50, handled by Postbloom.

## Duration
10 days (see sample-size.md).

## Decision rule
- B wins if click rate is significantly higher (p < 0.05) and unsubscribes don't increase meaningfully.
- Otherwise keep A.

## Risks
- Personalization might break if the plant name is missing. We should check what B looks like for people who didn't browse a plant.
`;

const solidSampleSize = `# Sample size

**Baseline click rate:** 2,824 / 31,567 = 8.95%
**MDE:** 20% relative, so 8.95% → 10.74%
**Significance:** α = 0.05 (one-sided, since we expect B to be better)
**Power:** 80%

Formula:
n = (z_α + z_β)² × [p1(1 − p1) + p2(1 − p2)] / (p2 − p1)²

- z_α = 1.645 (one-sided 0.05), z_β = 0.842
- (1.645 + 0.842)² = 6.183
- p1(1 − p1) + p2(1 − p2) = 0.08149 + 0.09587 = 0.17736
- (p2 − p1)² = 0.0179² = 0.00032041
- n = 6.183 × 0.17736 / 0.00032041 = **3,422**

**Duration:** 3,422 / 2,631 delivered per week = 1.3 weeks, about **9–10 days**.
`;

/* ───────────── Weak template ───────────── */

const weakReadme = `# A/B Test Plan: Welcome Email

## Goal
Find out which subject line works better for the welcome email.

## Test
- **A:** "Welcome to Fernway: 15% off your first plant inside"
- **B:** "Your care guide for the {plant you browsed}"

## Metric
**Open rate**, since we're testing the subject line and the subject line is what makes people open the email. Our current open rate is about 47%.

## Plan
Send half of new subscribers A and half B starting Monday. On Friday, look at the open rates in Postbloom and pick whichever is higher. Since we get about 2,600 new subscribers a week, that's over 1,000 people per version, which should be plenty. Postbloom reports open rates in real time, so we won't need to wait for orders to come in.

## Answer for Dana
Yes, we can know by Friday! We'll just compare the open rates on Friday morning and send her the winner before her meeting.

## Files
- \`test-plan.md\`: test details
`;

const weakTestPlan = `# Test details

| | Subject line |
|---|---|
| A | Welcome to Fernway: 15% off your first plant inside |
| B | Your care guide for the {plant you browsed} |

- Start: Monday
- End: Friday morning
- Split: 50/50
- Metric: open rate
- Winner: highest open rate

If B wins on opens, it probably also wins on orders, because more people will see the email.
`;

const weakEmailCopy = `# Email copy (both versions)

**From:** Fernway Plant Co.
**Preview text:** Fresh roots, fresh start.

## Version A
Subject: Welcome to Fernway: 15% off your first plant inside

Hi there! Thanks for joining the Fernway family. Use code **ROOTED15** for 15% off your first order. Shop now →

## Version B
Subject: Your care guide for the {plant you browsed}

Hi there! Here's how to keep your new favorite plant happy: bright, indirect light and water when the top inch is dry. Shop now →

Both emails use the same layout, hero image and button so the only difference is the subject line and first paragraph.
`;

const mod: ChallengeModule = {
  challenge: {
    id: 'pr_ab_test',
    kind: 'practice',
    companyId: null,
    title: 'Design and size an email A/B test',
    summary: 'Size a welcome-email subject test properly and give an honest answer on timing.',
    type: 'marketing',
    skills: ['A/B testing', 'Sample size & power', 'Email marketing', 'Experiment design', 'Stakeholder communication'],
    classroomConcepts: [
      { concept: 'Two-proportion z-test and statistical power', course: 'Intro to Statistics' },
      { concept: 'Randomization and pre-registration', course: 'Experimental Design' },
      { concept: 'Lifecycle and email marketing metrics', course: 'Digital Marketing' },
    ],
    difficulty: 'intermediate',
    estHours: 3,
    brief,
    deliverables: [
      'README summarizing the plan and the answer to "by Friday?"',
      'Test plan with hypothesis, metrics, design and decision rule',
      'Sample-size calculation with formula, inputs and duration',
      'Plain-language reply to the marketing lead',
    ],
    rubric: [
      { id: 'hypothesis', name: 'Hypothesis', weight: 20, description: 'One falsifiable hypothesis with a mechanism, a single primary metric chosen for good reasons (not open rate) and at least one guardrail.' },
      { id: 'sample_size', name: 'Sample size & power', weight: 30, description: 'A correct two-sided, per-variant sample size at α = 0.05 and 80% power from the real baseline, with the math shown and a duration based on actual weekly volume.' },
      { id: 'test_design', name: 'Test design', weight: 20, description: 'Subscriber-level randomization with only the subject line changing, whole-week run time, sensible exclusions and a plan for subscribers without a browsed plant.' },
      { id: 'decision_rule', name: 'Decision rule', weight: 15, description: 'A pre-registered rule with one read at a fixed sample, guardrail thresholds and a stated action for a win, a loss and a tie.' },
      { id: 'communication', name: 'Communication', weight: 15, description: 'A plain-language answer to "by Friday?" that is honest, gives the stakeholder real options and could be forwarded as-is.' },
    ],
    reward: { mode: 'none', amounts: [] },
    applicantCap: null,
    status: 'open',
    hiringFor: null,
    starterFiles: [
      { path: 'README.md', content: starterReadme },
      { path: 'request.md', content: requestMd },
      { path: 'data/past-sends.csv', content: pastSendsCsv },
    ],
    aiHints: {
      testing:
        'Whether you can size an experiment honestly and say no to a deadline with good reasons. The welcome email gets about 2,500 sends a week, which is far too few to detect a modest lift in orders by Friday. The real skill is choosing a metric and minimum detectable effect that make the test feasible, then explaining the trade-off to a non-technical stakeholder.',
      steps: [
        'Compute baselines from past-sends.csv (click rate, order rate, unsubscribes) and the typical weekly volume, excluding the one-off spike week.',
        'Write one hypothesis and pick a primary metric plus guardrails, and say why not open rate.',
        'Calculate n per variant with the two-sided formula (z = 1.96 and 0.84) for a few metric and MDE options.',
        'Double n for the two variants and divide by weekly volume to get a duration in whole weeks.',
        'Write the design and the pre-registered decision rule, then draft a plain-language reply to Dana.',
      ],
      greatLooksLike:
        'A plan that says plainly "not by Friday": orders at a 10% lift would need about 102,000 emails (around 41 weeks), so it switches the primary metric to click rate at a 20% MDE (4,345 per variant, 4 full weeks) and keeps orders and unsubscribes as secondary and guardrail metrics. The math is shown step by step, the subject line is the only thing that changes, and the reply gives Dana something useful to say on Friday.',
      pitfalls: [
        'Using open rate as the primary metric, even though auto-opens inflate it and it\'s far from purchase.',
        'Treating the per-variant sample size as the total, which halves the real run time.',
        'Using a one-sided test to shrink the sample when you\'d also want to know if B is worse.',
        'Counting the Fall Plant Swap spike week in the weekly volume.',
        'Peeking daily and stopping the moment one variant looks ahead.',
      ],
    },
    deadlineInDays: null,
    createdDaysAgo: 75,
    seed: { participants: 18, submissions: 9, scored: 9 },
  },
  templates: [
    {
      quality: 'strong',
      notes: `### What I built
A full test plan for the welcome-email subject line: hypothesis, metrics, design and a pre-registered decision rule, plus a sample-size workup with an options table and a plain-language reply Dana can forward.

### Key decisions & trade-offs
- **Primary metric = click rate, not orders.** Orders are what Dana cares about, but at a 3.13% baseline a 10% lift needs about 51,000 per variant (around 41 weeks). Click rate at a 20% MDE needs 4,345 per variant, so 4 full weeks. The trade-off is that clicks are a proxy, so orders and revenue per recipient are reported, and revenue is a guardrail.
- **Two-sided test.** We'd want to know if the care guide hurts, too.
- **Volume of 2,500 a week, not 2,631.** The Fall Plant Swap week inflated the average and won't happen again.
- **Body stays identical** (including the 15% code), so the test isolates the subject line.

### What I'd do with more time
Check whether the 7-day order attribution double-counts people who click several emails, and look at a sequential design that would allow a safe early stop.`,
      files: [
        { path: 'README.md', content: strongReadme },
        { path: 'test-plan.md', content: strongTestPlan },
        { path: 'sample-size.md', content: strongSampleSize },
        { path: 'reply-to-dana.md', content: strongReply },
      ],
      feedback:
        'Great work. Your sample-size math is correct and fully shown, and switching the primary metric to clicks (4,345 per variant, 4 full weeks) after showing that orders would take around 41 weeks is exactly the trade-off this task is about. Excluding the Fall Plant Swap week from the volume is a nice catch. To push it further, say what happens if clicks win but orders trend down, and tighten the guardrail thresholds with a reason for each.',
      aiDisclosure:
        'I asked an AI assistant to check my z-values and the arithmetic in the sample-size table. I chose the metrics, MDE and design myself.',
    },
    {
      quality: 'solid',
      notes: `### What I built
A test plan with a clear hypothesis, click rate as the primary metric, unsubscribes as a guardrail, a sample-size calculation, a decision rule and a short message for Dana.

### Key decisions & trade-offs
- I chose click rate over open rate because auto-opens make opens unreliable, and over orders because orders are too rare for a quick test.
- I used a one-sided test because the hypothesis is directional (we expect B to be better), which keeps the sample smaller.
- I kept the email body identical so only the subject line changes.
- I set the MDE at 20% relative, since a smaller lift probably wouldn't change our decision.

### What I'd do with more time
Look at whether results differ for people who browsed a plant versus footer sign-ups, and build a dashboard to track the test daily.`,
      files: [
        { path: 'README.md', content: solidReadme },
        { path: 'test-plan.md', content: solidTestPlan },
        { path: 'sample-size.md', content: solidSampleSize },
      ],
      feedback:
        'Your hypothesis and metric choice are strong, and the write-up is clear enough to forward. The sample size is the weak spot: 3,422 comes from a one-sided test, and it\'s the size of each variant, not the total. A two-sided test needs 4,345 per variant, or 8,690 emails in all, which is closer to four weeks than ten days. Planning a daily dashboard also invites peeking, so commit to one read at the planned sample.',
      aiDisclosure: 'Used an AI chatbot to explain the sample-size formula, then did the calculation myself in a spreadsheet.',
    },
    {
      quality: 'weak',
      notes: `### What I built
A simple A/B test plan comparing the two subject lines on open rate, with an answer for Dana.

### Key decisions & trade-offs
- I picked open rate because the subject line is what gets people to open the email, so it's the most direct measure.
- I kept the test to one week so Dana gets her answer by Friday.
- With about 1,300 people per version, the sample should be big enough to see a difference.
- I didn't change anything in the email body, so the only difference people see is the subject line.
- Postbloom shows open rates right away, which makes it easy to report the result on Friday morning.

### What I'd do with more time
Test more subject lines, like ones with emojis or questions, and try different send times to see if that changes the open rate.`,
      files: [
        { path: 'README.md', content: weakReadme },
        { path: 'test-plan.md', content: weakTestPlan },
        { path: 'email-copy.md', content: weakEmailCopy },
      ],
      feedback:
        'Good instinct to keep it simple and give Dana a direct answer, but the plan would most likely crown a winner by chance. Open rate is inflated by auto-opens and doesn\'t tell you who buys, and "pick whichever is higher on Friday" has no sample-size math or significance test behind it. By Friday you\'d have about 900 per variant, enough to detect only a lift of roughly 40% in clicks. Try sizing the test with the two-proportion formula and see how long it really needs.',
    },
  ],
  scripted: [
    {
      challengeId: 'pr_ab_test',
      studentId: 'stu_malik',
      templateIndex: 0,
      submittedDaysAgo: 18,
      scores: { hypothesis: 5, sample_size: 5, test_design: 4, decision_rule: 4, communication: 4 },
      feedback:
        'Your hypothesis and sample-size work are excellent: a clear mechanism, the correct two-sided 4,345 per variant, and an options table showing why orders would take around 41 weeks. The design is solid, but the fallback subject means B is a different email for the 18% of footer sign-ups, so say up front whether the browsed-plant group is your main comparison. The decision rule doesn\'t cover the case where clicks win but orders slip. Your reply to Dana is honest and kind; lead with the four-week date before the explanation so it skims faster.',
    },
    {
      challengeId: 'pr_ab_test',
      studentId: 'stu_sofia',
      templateIndex: 1,
      submittedDaysAgo: 40,
      scores: { hypothesis: 5, sample_size: 3, test_design: 4, decision_rule: 4, communication: 5 },
      feedback:
        'Your hypothesis is excellent, and your write-up is the kind of thing a marketing lead can forward without edits. The sample size cost the most: you used a one-sided z of 1.645 and then treated 3,422 as the total, when a two-sided test needs 4,345 per variant (8,690 in all). That turns your 10-day estimate into about four weeks. Design and decision rule are sensible, but run whole weeks and decide in advance what a tie means.',
    },
  ],
};

export default mod;
