/**
 * "Use example" prefills for the employer wizard, one per company. Each is a fresh challenge (not a
 * copy of a seeded one). The wizard publishes without a starter kit (CreateChallengeInput has no
 * starterFiles), so each brief carries the facts a student needs inline.
 */
import type { WizardExample } from '../types.ts';

const orbitlineBrief = `## Context
When a shipment changes status, Orbitline pushes a webhook to the shipper's system so their customers see "Out for delivery" within seconds. We send about 1.2 million of these a day. Roughly 2% fail on the first attempt, usually timeouts or 502s while a shipper is deploying, and today our dispatcher just logs the failure and moves on. Last month one shipper missed 3,400 "delivered" events during a 20-minute outage and spent two days reconciling by hand.

## The task
Add a retry queue to the webhook dispatcher:

- Retry failed deliveries (timeouts, 5xx and 429) with exponential backoff and jitter, for up to 6 attempts over about an hour. Don't retry other 4xx errors.
- After the last attempt, move the event to a dead-letter queue along with the last status code and error.
- Send an \`Idempotency-Key\` header so a shipper that receives the same event twice can safely ignore the duplicate.
- Add two small endpoints: one that lists dead-lettered events and one that replays a single event.
- Keep deliveries for the same shipment in order.

## Constraints
- About 4 hours. Use Node.js 20 or later. An in-memory queue is fine; you don't need an external broker.
- The retry schedule must be testable without waiting an hour, so inject the clock or the scheduler.
- Out of scope: auth, persistence across restarts and any UI.
- AI assistants are allowed. Tell us how you used them.

## What we provide
The event payload and the function you're extending:

~~~json
{ "eventId": "evt_8Kq2", "trackingNumber": "OLX4471902", "status": "delivered", "occurredAt": "2026-11-02T15:04:11Z" }
~~~

Today's dispatcher calls \`deliver(event, endpointUrl)\`, which resolves to \`{ status }\` or throws on a network error. Wrap it rather than rewriting it.`;

const fernhillBrief = `## Context
About 11% of booked appointments at our 14 clinics end as no-shows, and each empty slot costs us roughly $180 in idle clinician time. Patients choose how we remind them: a text 48 hours before, an email 72 hours before, or a phone call the day before. No-show rates differ a lot by channel (texts 8.9%, emails 13.6%, calls 7.2%), and our operations team wants to switch everyone to texts. Before we do, we want to know how much of that gap is the channel and how much is who chooses it: older patients prefer calls, and same-week bookings rarely get an email in time.

## The task
- Estimate the effect of each reminder channel on the no-show rate, controlling for at least visit type, lead time (days from booking to visit) and age band.
- Say plainly what this observational data can and can't tell us.
- Recommend a reminder policy, with the expected change in no-shows per month.
- Design a simple randomized test we could run next quarter to confirm it.

## Constraints
- About 4 hours. Use Python, R or SQL, whichever you're fastest in.
- Report rates with confidence intervals rather than raw counts, and don't claim more causation than the data supports.
- Out of scope: reminder wording and new channels.
- AI assistants are allowed. Tell us how you used them.

## What we provide
A de-identified extract of 9,214 appointments from the last six months, one row per appointment, with \`appointment_id\`, \`clinic\`, \`visit_type\`, \`booked_at\`, \`scheduled_for\`, \`age_band\`, \`reminder_channel\`, \`reminder_sent_at\` and \`status\` (\`completed\`, \`no_show\` or \`cancelled\`). The data is synthetic, but it behaves like the real thing.`;

const kitebirdBrief = `## Context
When someone sees harassment or spam in a Kitebird community, they can report it, but today that takes six taps, ends in an empty "Tell us what happened" box, and never says what happened next. 41% of people who start a report give up before sending it, and our trust and safety team says the reports that do arrive are often too vague to act on. People who report something and never hear back are twice as likely to leave that community within a month.

## The task
Redesign reporting for posts and comments on mobile:

- Get someone from "this isn't OK" to a sent report in three taps or fewer for the common cases: spam, harassment, hate, a fake or unsafe meetup, and "something else".
- Capture enough detail for moderators to act on, without a blank essay box.
- Offer the right next step in the moment: hide the post, mute or block the person, or find support.
- Close the loop by showing the reporter what happened to their report, while respecting the reported person's privacy.

## Constraints
- About 3 hours. Any tool is fine. Submit screens as images, a screen-by-screen spec with real copy, or a prototype link.
- Design for iOS and Android at phone width, with screen readers and large text in mind.
- Out of scope: moderator tools and the moderation policy itself.
- AI assistants are allowed. Tell us how you used them.

## What we provide
The numbers above and today's six screens, in order: the post's overflow menu, "Report", a list of 14 categories, a sub-category list, the free-text box, and a "Thanks for letting us know" screen. Our voice in one line: warm, direct and never preachy.`;

const cobaltBrief = `## Context
Our Elm Street branch in Greensboro is 1.2 miles from our Market Square branch. Elm Street holds $86M in deposits and $31M in loans, but its foot traffic is down 38% in three years as customers moved to mobile. Merging it into Market Square would save about $410k a year in rent, staffing and upkeep, after a one-time exit cost of $240k. The risk is deposit run-off: in our last two consolidations we lost 6% and 11% of the closed branch's deposits within a year, mostly from older customers and small businesses who bank in person.

## The task
- Build a simple three-year model of the consolidation: savings, one-time costs, and the net interest income we'd lose to deposit run-off (use a 2.1% net spread on deposits).
- Run three run-off scenarios (5%, 10% and 15%) and find the break-even run-off rate.
- Recommend whether to consolidate, and what we should do to keep the customers most at risk.
- Write a one-page memo for the CFO that leads with the answer.

## Constraints
- About 4 hours. A spreadsheet is ideal; export it to CSV or PDF for your zip.
- Ignore taxes and discounting beyond a simple three-year total, and say so in your assumptions.
- Out of scope: staffing plans and real-estate negotiations.
- AI assistants are allowed. Tell us how you used them.

## What we provide
The numbers above, plus the branch facts the CFO will ask about: Elm Street has 2,940 deposit customers, 41% of them aged 65 or older; 212 small-business accounts hold $19M of its deposits; and tellers handle an average of 74 transactions a day, down from 120 three years ago.`;

const sproutlyBrief = `## Context
About 6,800 people cancelled their Sproutly Snack Box subscription in the last 12 months. Exit surveys give three main reasons: "too many bags piling up" (34%), "got bored of the flavors" (27%) and price (19%). We've never tried to win anyone back. Our finance team estimates that a returning subscriber is worth about $64 in gross margin over their next six months, and our email platform supports segments, delays and simple A/B splits.

## The task
- Segment the lapsed subscribers (at least by cancel reason and by how long ago they left) and say which segment to target first, and why.
- Write a three-email win-back series for that segment, with the subject line, preview text, body copy, offer and call to action for each email, plus the timing between them.
- Choose offers that fix the reason people left (for example a slower delivery cadence or a new-flavor sampler) rather than defaulting to a discount, and estimate what they cost.
- Define how you'll measure success, including a holdout group.

## Constraints
- About 3 hours. Write the emails as text; mockups are optional.
- Keep offers and incentives across the whole series within a $2,500 budget.
- Follow email basics: an unsubscribe link in every email and no misleading subject lines.
- AI assistants are allowed. Tell us how you used them.

## What we provide
The numbers above, plus our brand voice: cheerful, a little punny and never pushy. The Snack Box costs $24 a month for six bags of our lentil puffs and pea crunchies, and subscribers can't currently change how often it ships.`;

const ironvaleBrief = `## Context
Our "impossible travel" detection fires when one account signs in from two places too far apart to travel between in the time elapsed. Last month it fired 1,140 times across our clients, and only 3 of those alerts were real account takeovers. The rest came from VPN egress changes, mobile carriers routing traffic through other states, and one client whose staff sign in through a cloud proxy. Each alert takes an analyst about 4 minutes to close, so this single rule costs us roughly 76 analyst-hours a month, and alert fatigue is how real incidents get missed.

## The task
- Analyze the 30-day alert export and group the false positives by cause, with counts.
- Propose tuning (allow-listed egress ranges, ASN and device context, a minimum distance or speed, or suppression windows) that cuts this rule's volume by at least 60%.
- Show, alert by alert, that your tuned logic still fires on all three real takeovers.
- Write the change request for our detection-engineering review: what changes, the expected volume, the residual risk and how we'd roll it back.

## Constraints
- About 4 hours. Express your logic as pseudocode or as a query in any language.
- Don't suppress whole users or whole clients; reviewers will reject that.
- Out of scope: building new data sources.
- AI assistants are allowed. Tell us how you used them.

## What we provide
The 30-day export (1,140 alerts with timestamp, user, source IP, ASN, geolocation, device ID and each client's known egress ranges) and the write-ups of the three real takeovers, so you can test your logic against them. All data is synthetic.`;

export const wizardExamples: Record<string, WizardExample> = {
  co_orbitline: {
    title: 'Add a retry queue for carrier status webhooks',
    summary: 'Make shipper webhooks reliable: retries with backoff, a dead-letter queue, no duplicates.',
    type: 'software',
    skills: ['Node.js', 'Queues', 'Reliability', 'API design', 'Testing'],
    classroomConcepts: [
      { concept: 'Exponential backoff with jitter', course: 'Computer Networks' },
      { concept: 'Idempotency and at-least-once delivery', course: 'Distributed Systems' },
      { concept: 'Queues and ordering', course: 'Data Structures & Algorithms' },
    ],
    difficulty: 'intermediate',
    estHours: 4,
    brief: orbitlineBrief,
    deliverables: [
      'Retry queue with exponential backoff, jitter and a max-attempts limit',
      'Dead-letter queue with list and replay endpoints',
      'Idempotency-Key header and per-shipment ordering',
      'Deterministic tests for the retry schedule, dead-lettering and replay',
      'README explaining your design and trade-offs',
    ],
    rubric: [
      { id: 'reliability', name: 'Reliability', description: 'Retries the right failures with backoff and never delivers twice.', weight: 30 },
      { id: 'design', name: 'Design & trade-offs', description: 'A queue design that handles ordering and idempotency, trade-offs explained.', weight: 25 },
      { id: 'tests', name: 'Tests', description: 'Deterministic tests for retries, dead-lettering and replay.', weight: 20 },
      { id: 'operability', name: 'Operability', description: 'Dead-lettered events are easy to inspect and replay.', weight: 15 },
      { id: 'communication', name: 'Communication', description: 'A README a teammate could run and review in ten minutes.', weight: 10 },
    ],
    reward: { mode: 'top3', amounts: [300, 150, 75] },
    applicantCap: 50,
    hiringFor: 'Junior Backend Engineer · Full-time · Remote (US)',
    deadlineInDays: 7,
  },
  co_fernhill: {
    title: 'Which appointment reminders actually reduce no-shows?',
    summary: 'Use 9,214 appointments to estimate which reminder channel cuts no-shows.',
    type: 'data',
    skills: ['Python', 'SQL', 'Logistic regression', 'Causal reasoning', 'Data storytelling'],
    classroomConcepts: [
      { concept: 'Confounding and stratification', course: 'Intro to Statistics' },
      { concept: 'Logistic regression', course: 'Statistical Inference' },
      { concept: 'Randomized controlled experiments', course: 'Experimental Design' },
    ],
    difficulty: 'intermediate',
    estHours: 4,
    brief: fernhillBrief,
    deliverables: [
      'Analysis notebook or script that reruns end to end',
      'Effect estimate for each channel, with confidence intervals',
      'One-page recommendation with the expected monthly impact',
      'Design for a randomized follow-up test',
    ],
    rubric: [
      { id: 'rigor', name: 'Analytical rigor', description: 'Controls for confounders and reports rates with uncertainty.', weight: 30 },
      { id: 'insight', name: 'Insight', description: 'Separates the channel effect from who chooses each channel.', weight: 25 },
      { id: 'recommendation', name: 'Recommendation', description: 'A policy with its expected impact and a follow-up test.', weight: 20 },
      { id: 'limits', name: 'Limits & honesty', description: 'Is clear about what observational data can and cannot show.', weight: 10 },
      { id: 'communication', name: 'Communication', description: 'Leads with the answer and reruns end to end.', weight: 15 },
    ],
    reward: { mode: 'top3', amounts: [250, 125, 75] },
    applicantCap: 40,
    hiringFor: 'Data Analyst I · Full-time · Minneapolis, MN (hybrid)',
    deadlineInDays: 7,
  },
  co_kitebird: {
    title: 'Design a faster, kinder way to report a post',
    summary: '41% of people give up reporting a post. Design a report flow that is fast and clear.',
    type: 'design',
    skills: ['Interaction design', 'UX writing', 'Trust & safety', 'Accessibility', 'Prototyping'],
    classroomConcepts: [
      { concept: "Fitts's law and touch targets", course: 'Human-Computer Interaction' },
      { concept: 'Recognition over recall', course: 'Cognitive Psychology' },
      { concept: 'Information architecture', course: 'Interaction Design' },
    ],
    difficulty: 'intermediate',
    estHours: 3,
    brief: kitebirdBrief,
    deliverables: [
      'Screen-by-screen flow with real copy for the common cases',
      'A "what happened to my report" status design',
      'Rationale tying each change to the drop-off and to moderator needs',
      'How you would measure success, plus one guardrail',
    ],
    rubric: [
      { id: 'speed', name: 'Speed to report', description: 'Common cases finish in three taps without losing needed detail.', weight: 25 },
      { id: 'care', name: 'Care for both people', description: "Supports the reporter and respects the reported person's privacy.", weight: 25 },
      { id: 'craft', name: 'Visual & content craft', description: 'Clear hierarchy, accessible screens and calm, specific copy.', weight: 20 },
      { id: 'rationale', name: 'Design rationale', description: 'Ties each change to the drop-off data or to what moderators need.', weight: 20 },
      { id: 'measurement', name: 'Success metrics', description: 'Measures completion and report quality, with a guardrail.', weight: 10 },
    ],
    reward: { mode: 'winner', amounts: [350] },
    applicantCap: 30,
    hiringFor: 'Associate Product Designer · Full-time · New York, NY (hybrid)',
    deadlineInDays: 7,
  },
  co_cobalt: {
    title: 'Should we consolidate the Elm Street branch? Build the case',
    summary: 'Weigh $410k a year in savings against deposit run-off: should two branches merge?',
    type: 'finance',
    skills: ['Financial modeling', 'Scenario analysis', 'Banking', 'Executive memos', 'Spreadsheet modeling'],
    classroomConcepts: [
      { concept: 'Break-even analysis', course: 'Managerial Accounting' },
      { concept: 'Net interest margin', course: 'Money & Banking' },
      { concept: 'Sensitivity and scenario analysis', course: 'Corporate Finance' },
    ],
    difficulty: 'intermediate',
    estHours: 4,
    brief: cobaltBrief,
    deliverables: [
      'Three-year consolidation model with the run-off scenarios',
      'The break-even run-off rate and how you found it',
      'Retention plan for the customer groups most at risk',
      'One-page CFO memo with a clear recommendation',
    ],
    rubric: [
      { id: 'model', name: 'Model accuracy', description: 'Savings, costs and lost interest income are right in every scenario.', weight: 30 },
      { id: 'risk', name: 'Risk analysis', description: "Finds the break-even run-off rate for the branch's customer mix.", weight: 25 },
      { id: 'recommendation', name: 'Recommendation', description: 'A clear call, with a plan to keep at-risk customers.', weight: 25 },
      { id: 'communication', name: 'Executive communication', description: 'A one-page memo that leads with the answer and states its assumptions.', weight: 20 },
    ],
    reward: { mode: 'top3', amounts: [200, 100, 50] },
    applicantCap: 40,
    hiringFor: 'Financial Analyst (Rotational) · Full-time · Charlotte, NC',
    deadlineInDays: 7,
  },
  co_sproutly: {
    title: 'Win back lapsed subscribers with a 3-email series',
    summary: 'Plan a 3-email win-back series for 6,800 cancelled Snack Box subscribers.',
    type: 'marketing',
    skills: ['Email marketing', 'Copywriting', 'Segmentation', 'Retention', 'Measurement'],
    classroomConcepts: [
      { concept: 'Market segmentation', course: 'Marketing Principles' },
      { concept: 'Customer lifetime value', course: 'Marketing Analytics' },
      { concept: 'Control groups', course: 'Intro to Statistics' },
    ],
    difficulty: 'beginner',
    estHours: 3,
    brief: sproutlyBrief,
    deliverables: [
      'Segment choice with its size and your reasoning',
      'Three emails with subject line, preview text, copy, offer and call to action',
      'Send timing and an offer-cost estimate within the $2,500 budget',
      'Measurement plan with a holdout group',
    ],
    rubric: [
      { id: 'segmentation', name: 'Segmentation', description: 'Picks a sensible first segment, sized and justified from the cancel reasons.', weight: 20 },
      { id: 'offer', name: 'Offer strategy', description: 'Offers fix the reason people left and stay within budget.', weight: 25 },
      { id: 'copy', name: 'Copy & voice', description: 'Specific, on-voice emails with honest subject lines and clear calls to action.', weight: 25 },
      { id: 'cadence', name: 'Cadence', description: 'The timing between emails suits the segment.', weight: 10 },
      { id: 'measurement', name: 'Measurement plan', description: 'A success metric, a holdout group and the expected offer return.', weight: 20 },
    ],
    reward: { mode: 'winner', amounts: [250] },
    applicantCap: 60,
    hiringFor: 'Marketing Coordinator · Full-time · Denver, CO (hybrid)',
    deadlineInDays: 7,
  },
  co_ironvale: {
    title: 'Tune our noisiest SIEM rule without missing real attacks',
    summary: "Cut an impossible-travel rule's noise by 60%+ and still catch all 3 real takeovers.",
    type: 'security',
    skills: ['Detection engineering', 'Log analysis', 'SIEM', 'Identity security', 'Technical writing'],
    classroomConcepts: [
      { concept: 'Precision and recall', course: 'Machine Learning' },
      { concept: 'IP geolocation and autonomous systems', course: 'Computer Networks' },
      { concept: 'Defense in depth', course: 'Network Security' },
    ],
    difficulty: 'intermediate',
    estHours: 4,
    brief: ironvaleBrief,
    deliverables: [
      'False-positive causes grouped, with counts',
      'Tuned detection logic as pseudocode or a query',
      'Proof that the tuned rule still catches all three real takeovers',
      'Change request with expected volume, residual risk and rollback',
    ],
    rubric: [
      { id: 'noise_reduction', name: 'Noise reduction', description: 'Cuts volume 60%+ by tuning the real false-positive causes.', weight: 30 },
      { id: 'detection_kept', name: 'Detection preserved', description: 'Shows clearly that all three real takeovers still alert.', weight: 30 },
      { id: 'residual_risk', name: 'Residual risk', description: 'Names what the tuned rule could miss and how to watch.', weight: 20 },
      { id: 'change_request', name: 'Change request', description: 'A change request a detection review board could approve as written.', weight: 20 },
    ],
    reward: { mode: 'top3', amounts: [250, 125, 75] },
    applicantCap: 35,
    hiringFor: 'SOC Analyst I · Full-time · Remote (US)',
    deadlineInDays: 7,
  },
};
