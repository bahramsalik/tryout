import type { ChallengeModule } from '../lib.ts';

const brief = `## Context

Fernhill Anywhere is our telehealth membership: video visits plus async messaging with a care team, for about 48,000 members in Minnesota and Wisconsin. Monthly cancellations averaged 2.8% from May through July and 4.6% from August through October. That's roughly 860 more members leaving every month than in the spring, or about $30,000 a month in recurring revenue.

Leadership has three competing theories. Finance points to the July 1 price increase for new members (Core $29 → $35, Plus $49 → $55), and "Price" is the most common answer in our exit survey. Product suspects app v5.0, which shipped August 19. Clinical Operations thinks members wait too long to be seen. Each implies a different, expensive fix, so we need to know which one the data supports before Q1 planning.

## The task

1. Compare cancellation **rates** across segments: price cohort, plan, channel, first-visit timing, care-team reply time, app rating, and anything else you think matters.
2. Test each of the three theories and tell us which hold up, with numbers.
3. Read the survey comments, not just the dropdown, and say whether they agree with the member data.
4. Recommend up to three actions in priority order, each with a rough expected impact and a metric we'd track.

## Constraints

- Time box: about 4 hours. We're judging judgment, not volume.
- Use any tools you like (Python, R, SQL, a spreadsheet or a BI tool), and include your code or steps so we can rerun your numbers.
- AI assistants are allowed if you tell us how you used them.
- The file oversamples cancellations (see the data dictionary), so compare segments with each other rather than against the 4.6% headline.
- Out of scope: predictive models, survival curves and pricing-elasticity studies. A clear segmented analysis beats a fancy model.

## What we provide

- \`data/members.csv\`: 75 members who joined May–September 2026, one row each.
- \`data/exit_survey.csv\`: 26 cancellation-survey responses with the dropdown reason and a free-text comment.
- \`data_dictionary.md\`: column definitions, the sampling note and known quirks.
- \`README.md\`: the question, a quick-start snippet and how to submit.
`;

const membersCsv = `member_id,plan,monthly_price,signup_date,cancel_date,acquisition_channel,age_band,state,days_to_first_visit,visits_first_30d,messages_sent,median_response_hrs,avg_video_wait_min,app_rating
FA-20417,Core,29,2026-05-03,,paid_social,30-44,WI,3,1,0,,15,5
FA-20454,Core,29,2026-05-05,,employer_benefit,30-44,MN,14,1,7,13.9,7,2
FA-20491,Plus,49,2026-05-06,,employer_benefit,30-44,MN,5,1,1,7.5,13,3
FA-20528,Core,29,2026-05-12,2026-09-30,paid_search,18-29,WI,,0,13,4.1,10,
FA-20565,Core,29,2026-05-14,2026-09-11,referral,45-64,MN,1,1,8,15.8,7,3
FA-20602,Plus,49,2026-05-16,2026-09-27,paid_social,30-44,MN,8,1,5,32.5,6,2
FA-20639,Core,29,2026-05-19,2026-08-26,paid_social,30-44,MN,,0,2,43.1,10,4
FA-20676,Core,29,2026-05-21,,paid_social,45-64,MN,8,1,7,19.3,11,3
FA-20713,Core,29,2026-05-22,,referral,45-64,MN,6,1,14,7.2,15,
FA-20750,Plus,49,2026-05-23,,employer_benefit,65+,MN,6,1,1,13.6,5,1
FA-20787,Core,29,2026-05-24,,paid_search,18-29,WI,,0,9,2.3,10,
FA-20824,Core,29,2026-05-25,2026-08-09,paid_social,45-64,MN,,0,1,9.8,10,4
FA-20861,Core,29,2026-05-26,,paid_social,30-44,MN,8,1,8,57.3,15,5
FA-20898,Core,29,2026-05-29,,employer_benefit,30-44,WI,2,3,4,5.3,4,5
FA-20935,Plus,49,2026-06-01,,paid_social,65+,MN,7,1,9,6.8,8,
FA-20972,Plus,49,2026-06-03,,paid_social,30-44,WI,11,2,3,12.8,6,4
FA-21009,Plus,49,2026-06-06,,employer_benefit,18-29,MN,3,1,14,5.5,16,5
FA-21046,Core,29,2026-06-07,2026-09-23,employer_benefit,30-44,MN,,0,11,25.6,10,3
FA-21083,Core,29,2026-06-12,2026-08-07,paid_search,18-29,MN,7,1,13,46.7,10,
FA-21120,Core,29,2026-06-15,,referral,45-64,MN,25,3,0,,13,4
FA-21157,Core,29,2026-06-15,,paid_social,30-44,MN,1,1,7,1.5,11,
FA-21194,Core,29,2026-06-16,,referral,18-29,MN,11,1,3,7.7,14,2
FA-21231,Core,29,2026-06-18,2026-08-28,paid_search,45-64,WI,3,2,9,6.7,7,4
FA-21268,Core,29,2026-06-19,,employer_benefit,30-44,MN,11,1,4,16.8,7,5
FA-21305,Core,29,2026-06-19,2026-10-26,paid_social,65+,WI,4,2,0,,6,3
FA-21342,Core,29,2026-06-20,,paid_social,18-29,WI,5,2,4,11.3,4,4
FA-21379,Core,29,2026-06-21,,paid_social,18-29,MN,7,2,4,9.1,15,3
FA-21416,Core,29,2026-06-22,2026-09-20,paid_social,30-44,MN,,0,9,24.9,10,2
FA-21453,Plus,49,2026-06-24,,referral,18-29,MN,7,1,11,9.9,4,5
FA-21490,Core,29,2026-06-25,2026-08-08,paid_social,30-44,WI,,0,7,27.9,10,
FA-21527,Core,29,2026-06-26,2026-08-31,referral,30-44,MN,,0,7,41.9,10,2
FA-21564,Core,29,2026-06-26,,employer_benefit,45-64,WI,10,1,8,9.5,15,5
FA-21601,Core,29,2026-06-30,,paid_search,18-29,MN,26,2,9,43.7,14,3
FA-21638,Plus,49,2026-06-30,2026-08-27,paid_search,65+,MN,10,2,8,17.5,10,4
FA-21675,Core,35,2026-07-01,2026-08-12,paid_search,45-64,WI,4,2,13,18.7,5,3
FA-21712,Plus,55,2026-07-04,2026-09-14,paid_social,18-29,MN,,0,7,42.3,10,4
FA-21749,Core,35,2026-07-04,,paid_social,30-44,MN,11,1,1,4.0,4,3
FA-21786,Core,35,2026-07-06,2026-09-24,paid_social,30-44,WI,2,1,12,30.5,11,1
FA-21823,Core,35,2026-07-10,,employer_benefit,30-44,MN,4,1,11,5.5,13,5
FA-21860,Core,35,2026-07-11,,referral,45-64,MN,2,2,7,5.0,14,4
FA-21897,Core,35,2026-07-12,2026-10-30,paid_social,30-44,MN,11,3,2,6.8,13,4
FA-21934,Core,35,2026-07-15,2026-08-28,referral,30-44,MN,12,1,10,39.8,15,5
FA-21971,Core,35,2026-07-16,,paid_social,30-44,MN,10,1,13,14.4,8,5
FA-22008,Core,35,2026-07-17,,paid_search,18-29,MN,10,2,3,16.9,16,4
FA-22045,Core,35,2026-07-18,,paid_social,30-44,WI,3,2,12,13.4,4,3
FA-22082,Core,35,2026-07-19,,employer_benefit,30-44,MN,14,2,9,4.5,7,
FA-22119,Plus,55,2026-07-19,,employer_benefit,45-64,MN,,0,2,5.1,10,4
FA-22156,Core,35,2026-07-22,,paid_social,65+,MN,32,0,13,12.1,15,5
FA-22193,Plus,55,2026-07-24,,paid_search,18-29,WI,40,0,9,45.6,10,3
FA-22230,Core,35,2026-07-24,2026-08-21,employer_benefit,30-44,MN,,0,7,40.9,10,
FA-22267,Core,35,2026-07-25,2026-10-21,employer_benefit,18-29,WI,4,1,14,10.2,14,2
FA-22304,Core,35,2026-07-28,,paid_social,45-64,MN,14,3,10,9.5,15,4
FA-22341,Core,35,2026-08-02,2026-10-09,paid_social,30-44,MN,,0,6,44.9,10,3
FA-22378,Plus,55,2026-08-06,,paid_search,45-64,WI,11,1,3,9.5,5,1
FA-22415,Core,35,2026-08-07,,paid_search,65+,MN,11,3,14,8.5,13,3
FA-22452,Plus,55,2026-08-14,,employer_benefit,18-29,MN,4,2,13,2.1,12,4
FA-22489,Core,35,2026-08-15,,paid_search,30-44,MN,6,2,8,10.9,16,
FA-22526,Core,35,2026-08-21,,referral,18-29,WI,13,3,1,9.5,7,4
FA-22563,Core,35,2026-08-21,,referral,45-64,WI,3,3,14,14.5,12,3
FA-22600,Core,35,2026-08-22,,paid_search,45-64,MN,42,0,3,8.6,13,4
FA-22637,Plus,55,2026-08-23,2026-10-15,referral,18-29,MN,13,2,6,15.5,12,4
FA-22674,Core,35,2026-08-25,2026-09-22,employer_benefit,18-29,MN,,0,5,28.1,10,5
FA-22711,Core,35,2026-08-26,2026-10-12,paid_social,45-64,MN,,0,6,44.7,10,4
FA-22748,Core,35,2026-08-27,,referral,30-44,MN,5,3,11,49.0,16,2
FA-22785,Plus,55,2026-08-27,2026-10-20,paid_search,65+,MN,27,2,4,59.9,16,5
FA-22822,Core,35,2026-08-31,,paid_search,30-44,MN,12,2,8,11.8,6,
FA-22859,Core,35,2026-09-02,2026-09-30,referral,45-64,WI,3,1,10,2.7,5,5
FA-22896,Plus,55,2026-09-04,,paid_search,18-29,WI,6,1,13,9.7,16,3
FA-22933,Plus,55,2026-09-06,2026-10-16,referral,18-29,MN,,0,8,1.4,10,1
FA-22970,Core,35,2026-09-10,,paid_social,45-64,WI,3,1,11,14.3,13,3
FA-23007,Plus,55,2026-09-13,2026-10-30,employer_benefit,18-29,MN,44,0,9,1.3,15,
FA-23044,Core,35,2026-09-15,,paid_social,45-64,WI,13,1,12,2.3,9,3
FA-23081,Plus,55,2026-09-18,2026-10-11,paid_search,45-64,WI,1,1,10,1.2,5,5
FA-23118,Plus,55,2026-09-21,,employer_benefit,30-44,MN,2,2,9,4.8,9,1
FA-23155,Core,35,2026-09-24,2026-10-26,employer_benefit,45-64,MN,28,3,8,52.9,8,4
`;

const exitSurveyCsv = `member_id,survey_date,primary_reason,comment
FA-21083,2026-08-07,Price,"Cost. Also slow answers from the nurses, which made the cost harder to justify."
FA-20824,2026-08-09,Care access,I tried to book my intake visit twice and the earliest opening was three weeks out. Never ended up seeing anyone.
FA-21675,2026-08-12,Price,Found a cheaper plan through my new employer.
FA-22230,2026-08-21,Care access,"Response times were really slow, sometimes 2 days. I needed a refill and ended up going elsewhere."
FA-20639,2026-08-26,Care access,"Never got past the ""we will reach out to schedule"" step. Gave up after a few weeks."
FA-21638,2026-08-27,Moving or insurance change,Got new insurance through my job that includes virtual care.
FA-21934,2026-08-28,Price,Too pricey. Honestly if the care team answered faster I would have stayed.
FA-21527,2026-08-31,Care access,Took forever to hear back from anyone. I signed up for fast access and it was slower than calling my old clinic.
FA-20565,2026-09-11,App problems,Notifications did not work on my phone so I kept missing replies.
FA-21712,2026-09-14,Care access,Sent a question about a rash on a Monday and got an answer Wednesday. That is not what I am paying for.
FA-21416,2026-09-20,Care access,Could not get a first visit scheduled. Messages sat unanswered overnight every time.
FA-21046,2026-09-23,Care access,The whole point was not having to wait. I waited more than a day for every response.
FA-21786,2026-09-24,Price,Too expensive for what you get. Replies took over a day so I was basically paying $35 to wait.
FA-20602,2026-09-27,Price,Not worth $49 a month. I could not get timely answers and ended up using my insurance clinic anyway.
FA-20528,2026-09-30,Moving or insurance change,Moving to Arizona for work.
FA-22341,2026-10-09,Care access,Messaged to set up my first appointment and heard back almost two days later. By then I had already gone to urgent care.
FA-23081,2026-10-11,Price,Plus is too expensive for our household. Might come back on Core.
FA-22711,2026-10-12,Care access,I never actually got a visit. Every reply from the care team took a day or more and the slots they offered were gone by the time I answered.
FA-22637,2026-10-15,App problems,Video kept dropping during my visit with the provider. Had to finish by phone.
FA-22933,2026-10-16,App problems,"App kept freezing on the scheduling screen so I could never book a video visit. Support said someone would call me, nobody did."
FA-22785,2026-10-20,Price,$55 a month is a lot when it takes two and a half days to get a message back. Not worth it.
FA-22267,2026-10-21,Price,Budget is tight right now and $35 a month adds up. The service itself was fine.
FA-23155,2026-10-26,Price,Paying monthly for a service where my first appointment was a month after I joined and messages took 2+ days.
FA-21305,2026-10-26,Other,Only signed up for one sinus issue and that is resolved. Nothing wrong with the service.
FA-21897,2026-10-30,Price,Price went up compared to what my friend pays. Did not feel fair.
FA-23007,2026-10-30,App problems,The app logged me out constantly and two-factor codes came late.
`;

const dataDictionary = `# Data dictionary: Fernhill Anywhere cancellation extract

Pulled from the membership warehouse (\`anywhere.member_daily\`) and the care-team messaging log on 2026-11-02 by Analytics.

## Sample

- 75 members who joined Fernhill Anywhere between 2026-05-01 and 2026-09-30.
- **Cancellations are oversampled.** The file holds all 30 cancelled members from a random draw plus 45 active members, so 40% of rows are cancellations, versus roughly 12% for this signup cohort overall. Compare rates *between segments*; don't read the overall rate in this file as our real churn rate.
- Observation window ends 2026-11-01. A blank \`cancel_date\` means the member was still active on that date.

## \`data/members.csv\` (one row per member)

| Column | Type | Meaning |
|---|---|---|
| \`member_id\` | string | Pseudonymous member key (\`FA-\` + 5 digits). Joins to \`exit_survey.csv\`. |
| \`plan\` | string | \`Core\` (video visits + async messaging) or \`Plus\` (Core + behavioral health visits). |
| \`monthly_price\` | int (USD) | Price the member pays. Members who joined before 2026-07-01 pay the old price (Core $29, Plus $49). Members who joined on or after 2026-07-01 pay the new price (Core $35, Plus $55). |
| \`signup_date\` | date | Membership start date. |
| \`cancel_date\` | date | Date the cancellation took effect. Blank = active. |
| \`acquisition_channel\` | string | \`paid_social\`, \`paid_search\`, \`referral\`, \`employer_benefit\`. |
| \`age_band\` | string | \`18-29\`, \`30-44\`, \`45-64\`, \`65+\`. |
| \`state\` | string | \`MN\` or \`WI\`. |
| \`days_to_first_visit\` | int | Days from signup to the first **completed** video visit. Blank = no completed visit before cancelling or before 2026-11-01. |
| \`visits_first_30d\` | int | Completed video visits in the first 30 days after signup. |
| \`messages_sent\` | int | Async messages the member sent to the care team while a member. |
| \`median_response_hrs\` | float | Median hours from a member message to the first care-team reply. Blank when \`messages_sent\` = 0. |
| \`avg_video_wait_min\` | int | Average minutes in the virtual waiting room before a video visit started (only meaningful for members with a visit; we impute the clinic-wide average of 10 for members with no visits). |
| \`app_rating\` | int 1–5 | Most recent in-app star rating. Blank = never rated. |

## \`data/exit_survey.csv\` (one row per survey response)

Shown in the app when a member cancels. Optional: 26 of the 30 cancelled members responded.

| Column | Type | Meaning |
|---|---|---|
| \`member_id\` | string | Joins to \`members.csv\`. |
| \`survey_date\` | date | Same day as \`cancel_date\`. |
| \`primary_reason\` | string | Single-choice dropdown: \`Price\`, \`App problems\`, \`Care access\`, \`Moving or insurance change\`, \`Other\`. \`Price\` is the first option in the list. |
| \`comment\` | string | Optional free text. |

## Known quirks

- New members book their first video visit by messaging the care team; self-scheduling isn't available until 2027.
- \`median_response_hrs\` counts clock hours, including nights and weekends. The care team's posted goal is a reply within 24 hours.
- The new app release (v5.0) shipped 2026-08-19. Ratings before and after the release are not separated in this extract.
`;

const starterReadme = `# Fernhill Anywhere: cancellation deep-dive (starter kit)

Thanks for taking this on. This kit has everything you need for the challenge.

## What's here

~~~
README.md            this file
data_dictionary.md   every column, the sampling note and known quirks (read this first)
data/members.csv     75 members who joined May–Sep 2026, one row each
data/exit_survey.csv 26 cancellation-survey responses (dropdown + free text)
~~~

## The question

Monthly cancellations of Fernhill Anywhere rose from 2.8% (May–Jul average) to 4.6% (Aug–Oct average). Leadership has three theories:

1. **Price.** We raised prices for new members on July 1 (Core $29 → $35, Plus $49 → $55).
2. **App quality.** App v5.0 shipped August 19 and app-store reviews got louder.
3. **Wait times.** Members say they wait too long to see someone.

Tell us which of these the data supports, what's really driving cancellations, and what we should do first.

## Getting started

Any tool works. Two lines will get you going in Python:

~~~python
import pandas as pd
members = pd.read_csv("data/members.csv", parse_dates=["signup_date", "cancel_date"])
~~~

Or load both CSVs into SQLite or DuckDB and work in SQL.

## Please submit

A zip with your README (findings first), the code or queries you ran, and any charts. Write for Priya Nair (Analytics Manager), who will forward your summary to the VP of Member Experience.

Questions during the challenge: analytics-challenges@fernhill.example
`;

/* ── Strong template ── */

const strongReadme = `# Why Fernhill Anywhere members are cancelling

**Bottom line:** slow care-team replies, and the missed first visits that follow, drive most cancellations. The July price increase barely moves the rate.

## Findings

1. **Reply time is the driver.** Members whose median reply took over 24 hours cancelled at **80% (16 of 20)**, versus **25% (13 of 52)** for members who heard back within a day: 3.2× the rate. Members with no completed visit in their first 14 days cancelled at **70% (16 of 23)** versus 27% (14 of 52). The two overlap: 14 of the 20 slow-reply members never got an early visit (the first visit is booked by messaging the care team).
2. **The survey agrees once you read the comments.** "Price" is the top dropdown answer (10 of 26), but 6 of those 10 comments are about waiting ("basically paying $35 to wait"). Overall, **16 of 26** comments describe slow replies or not getting a first visit.
3. **Price, the app and video waits don't separate cancellers from stayers.** New-price members cancel at 41% (17 of 41) vs. 38% (13 of 34) at the old price, and within each reply-time bucket the gap is noise (82% vs. 78% when replies are slow). App rating: 3.4 vs. 3.6. Video waiting room: 9.7 vs. 10.8 min.
4. **Red herring:** paid social has the most cancellations (11) because it's the biggest channel; its rate (42%) matches referral (43%).

**Size of the prize:** if the 29 members with a slow reply *or* no early visit cancelled at everyone else's rate (22%), this sample would have **~14 fewer cancellations out of 30**.

## Recommendations (in priority order)

1. **Reply SLA for new members:** first reply within 12 h during a member's first 30 days, via a new-member queue. Measure: share of new-member messages answered within 24 h (target 95%).
2. **Book the first visit at signup** instead of "the care team will reach out." Measure: completed visit by day 14 (69% in this sample; target 90%).
3. **Hold the price; fix the survey.** A rollback costs $6/month per Core member for a ~3-point effect at most. Add "It took too long to get care" to the dropdown and stop listing "Price" first.

## Caveats

Cancellations are oversampled, so I compare segments rather than estimate a company-wide rate. n = 75; small segments (65+, the 3 members who never messaged) are directional.

## Files

\`analysis.py\`, \`survey_coding.csv\` (theme per comment), \`segment_rates.csv\`, \`cancel_rate_by_segment.svg\`.
`;

const strongAnalysis = `"""Fernhill Anywhere cancellation analysis.

Run from the starter-kit root:  python analysis.py
Writes segment_rates.csv next to this file. Needs pandas only.
"""
import pandas as pd

m = pd.read_csv("data/members.csv", parse_dates=["signup_date", "cancel_date"])
s = pd.read_csv("data/exit_survey.csv")
coded = pd.read_csv("survey_coding.csv")  # my hand coding of the 26 comments

m["cancelled"] = m["cancel_date"].notna()

# Response time: members with no messages have no response time. Keep them
# as their own group instead of letting NaN fall into the "fast" bucket.
m["reply_bucket"] = pd.cut(
    m["median_response_hrs"], [0, 12, 24, 1000],
    labels=["<=12h", "12-24h", ">24h"],
)
m["reply_bucket"] = m["reply_bucket"].cat.add_categories("no messages").fillna("no messages")

# First completed visit within 14 days (blank = never had one).
m["first_visit_14d"] = m["days_to_first_visit"].le(14)

m["price_cohort"] = m["signup_date"].ge("2026-07-01").map(
    {True: "new price (Jul+)", False: "old price (May-Jun)"}
)
m["slow_or_no_visit"] = (m["reply_bucket"] == ">24h") | ~m["first_visit_14d"]


def rates(col):
    g = m.groupby(col, observed=True)["cancelled"].agg(members="size", cancelled="sum")
    g["cancel_rate"] = (g["cancelled"] / g["members"]).round(3)
    g.insert(0, "segment", col)
    return g.reset_index().rename(columns={col: "value"})


cols = ["reply_bucket", "first_visit_14d", "slow_or_no_visit", "price_cohort",
        "plan", "acquisition_channel", "age_band", "state"]
table = pd.concat([rates(c) for c in cols], ignore_index=True)
table.to_csv("segment_rates.csv", index=False)
print(table.to_string(index=False))

# Price within the reply buckets: does the new price matter once we hold
# reply time fixed?
print(m.groupby(["reply_bucket", "price_cohort"], observed=True)["cancelled"]
       .agg(["size", "mean"]).round(2))

# Red herrings: app rating and video waiting room.
print("app rating (mean):", m.groupby("cancelled")["app_rating"].mean().round(2).to_dict())
had_visit = m[m["days_to_first_visit"].notna()]  # imputed 10 for no-visit members
print("video wait, members with a visit:",
      had_visit.groupby("cancelled")["avg_video_wait_min"].mean().round(1).to_dict())

# Survey: dropdown vs. what people actually wrote.
sv = s.merge(coded[["member_id", "theme"]], on="member_id")
print(pd.crosstab(sv["primary_reason"], sv["theme"], margins=True))

# Excess cancellations: if the slow-or-no-visit group cancelled at the
# rate of everyone else, how many cancellations in this sample go away?
base = m.loc[~m["slow_or_no_visit"], "cancelled"].mean()
grp = m[m["slow_or_no_visit"]]
excess = grp["cancelled"].sum() - base * len(grp)
print(f"excess cancellations: {excess:.1f} of {m['cancelled'].sum()}")
`;

const strongCoding = `member_id,theme
FA-22341,slow reply / no first visit
FA-22711,slow reply / no first visit
FA-21712,slow reply / no first visit
FA-21527,slow reply / no first visit
FA-21416,slow reply / no first visit
FA-21046,slow reply / no first visit
FA-20639,slow reply / no first visit
FA-22230,slow reply / no first visit
FA-20824,slow reply / no first visit
FA-22785,slow reply / no first visit
FA-21786,slow reply / no first visit
FA-21083,slow reply / no first visit
FA-20602,slow reply / no first visit
FA-23155,slow reply / no first visit
FA-21934,slow reply / no first visit
FA-22933,slow reply / no first visit
FA-22267,price only
FA-21675,price only
FA-23081,price only
FA-21897,price only
FA-23007,app
FA-22637,app
FA-20565,app
FA-20528,moved / insurance
FA-21638,moved / insurance
FA-21305,need met
`;

const strongRates = `value,segment,members,cancelled,cancel_rate
<=12h,reply_bucket,37,9,0.243
12-24h,reply_bucket,15,4,0.267
>24h,reply_bucket,20,16,0.8
no messages,reply_bucket,3,1,0.333
False,first_visit_14d,23,16,0.696
True,first_visit_14d,52,14,0.269
False,slow_or_no_visit,46,10,0.217
True,slow_or_no_visit,29,20,0.69
new price (Jul+),price_cohort,41,17,0.415
old price (May-Jun),price_cohort,34,13,0.382
Core,plan,55,22,0.4
Plus,plan,20,8,0.4
employer_benefit,acquisition_channel,18,6,0.333
paid_search,acquisition_channel,17,7,0.412
paid_social,acquisition_channel,26,11,0.423
referral,acquisition_channel,14,6,0.429
18-29,age_band,20,8,0.4
30-44,age_band,28,11,0.393
45-64,age_band,20,8,0.4
65+,age_band,7,3,0.429
MN,state,52,21,0.404
WI,state,23,9,0.391
`;

const strongChart = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 300" font-family="Helvetica, Arial, sans-serif" font-size="12">
<text x="10" y="22" font-size="15" font-weight="bold" fill="#0F172A">Cancellation rate by segment</text>
<text x="10" y="40" fill="#475569">Share of members in each segment who cancelled (sample of 75, cancellations oversampled)</text>
<text x="190" y="77" text-anchor="end" fill="#0F172A">Care-team reply > 24 h</text>
<rect x="200" y="62" width="240" height="22" fill="#C2410C"/>
<text x="446" y="77" fill="#0F172A">80% (n=20)</text>
<text x="190" y="109" text-anchor="end" fill="#0F172A">Reply within 24 h</text>
<rect x="200" y="94" width="75" height="22" fill="#94A3B8"/>
<text x="281" y="109" fill="#0F172A">25% (n=52)</text>
<text x="190" y="151" text-anchor="end" fill="#0F172A">No visit in first 14 days</text>
<rect x="200" y="136" width="209" height="22" fill="#C2410C"/>
<text x="415" y="151" fill="#0F172A">70% (n=23)</text>
<text x="190" y="183" text-anchor="end" fill="#0F172A">Visit in first 14 days</text>
<rect x="200" y="168" width="81" height="22" fill="#94A3B8"/>
<text x="287" y="183" fill="#0F172A">27% (n=52)</text>
<text x="190" y="225" text-anchor="end" fill="#0F172A">New price (joined Jul+)</text>
<rect x="200" y="210" width="124" height="22" fill="#64748B"/>
<text x="330" y="225" fill="#0F172A">42% (n=41)</text>
<text x="190" y="257" text-anchor="end" fill="#0F172A">Old price (joined May-Jun)</text>
<rect x="200" y="242" width="115" height="22" fill="#94A3B8"/>
<text x="321" y="257" fill="#0F172A">38% (n=34)</text>
<text x="10" y="288" fill="#475569">Price moves the rate 3 points; a slow first reply moves it 55.</text>
</svg>
`;

/* ── Solid template ── */

const solidReadme = `# Fernhill Anywhere cancellation analysis

## Summary

The biggest factor I found is **care-team response time**. Members whose median reply time was over 24 hours cancelled 80% of the time, compared with 25% for everyone else. Members who didn't have a visit in their first 14 days also cancelled much more (70% vs. 27%).

## Other findings

- **Paid social drives the most cancellations:** 11 of the 30 cancellations came from paid social, more than any other channel. Paid search is next with 7.
- **Price is the top reason in the exit survey** (10 of 26 responses, 38%), with care access close behind (9). So price looks like a secondary driver, especially for the $35 Core plan, which has as many cancellations (11) as the $29 plan.
- Plan type, age and state don't seem to matter much. Core has 22 cancellations and Plus has 8, which is in line with how many members are on each plan.

## Recommendations

1. Improve care-team response times, ideally to under 24 hours.
2. Make it easier for new members to get their first visit.
3. Review paid social targeting, since that channel produces the most cancellations.
4. Consider a discount or promo for price-sensitive members.

## How to run

~~~
python churn_analysis.py
~~~

This prints the breakdowns and writes \`cancellations_by_segment.csv\`. \`charts.svg\` has the two charts I'd show leadership.

## Limitations

The sample is small (75 members), and the data dictionary says cancellations are oversampled, so the 40% overall cancel rate here isn't our real rate. I didn't have time to read through all of the survey comments.
`;

const solidAnalysis = `import pandas as pd

members = pd.read_csv("data/members.csv")
survey = pd.read_csv("data/exit_survey.csv")
members["cancelled"] = members["cancel_date"].notna()
cancelled = members[members["cancelled"]]

print("Total cancelled:", len(cancelled), "of", len(members))

# Where do cancellations come from?
for col in ["acquisition_channel", "plan", "monthly_price", "age_band", "state"]:
    print(cancelled[col].value_counts(), "\\n")

# Response time
members["slow_reply"] = members["median_response_hrs"] > 24
print(members.groupby("slow_reply")["cancelled"].agg(["count", "sum", "mean"]))

# First visit
members["no_visit_14d"] = ~(members["days_to_first_visit"] <= 14)
print(members.groupby("no_visit_14d")["cancelled"].agg(["count", "sum", "mean"]))

# Survey reasons
print(survey["primary_reason"].value_counts())

out = pd.concat([
    cancelled["acquisition_channel"].value_counts().rename("cancellations"),
    cancelled["monthly_price"].astype(str).value_counts().rename("cancellations"),
    survey["primary_reason"].value_counts().rename("cancellations"),
])
out.index.name = "segment"
out.to_csv("cancellations_by_segment.csv", header=True)
`;

const solidCounts = `segment,cancellations
paid_social,11
paid_search,7
referral,6
employer_benefit,6
29,11
35,11
55,6
49,2
Price,10
Care access,9
App problems,4
Moving or insurance change,2
Other,1
`;

const solidCharts = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 250" font-family="Helvetica, Arial, sans-serif" font-size="12">
<text x="10" y="22" font-size="15" font-weight="bold" fill="#111827">Cancellations by acquisition channel</text>
<rect x="150" y="45" width="330" height="22" fill="#2563EB"/><text x="140" y="60" text-anchor="end">paid_social</text><text x="486" y="60">11</text>
<rect x="150" y="75" width="210" height="22" fill="#2563EB"/><text x="140" y="90" text-anchor="end">paid_search</text><text x="366" y="90">7</text>
<rect x="150" y="105" width="180" height="22" fill="#2563EB"/><text x="140" y="120" text-anchor="end">referral</text><text x="336" y="120">6</text>
<rect x="150" y="135" width="180" height="22" fill="#2563EB"/><text x="140" y="150" text-anchor="end">employer_benefit</text><text x="336" y="150">6</text>
<text x="10" y="190" font-size="15" font-weight="bold" fill="#111827">Cancel rate by care-team reply time</text>
<rect x="150" y="205" width="240" height="18" fill="#DC2626"/><text x="140" y="218" text-anchor="end">reply &gt; 24 h</text><text x="396" y="218">80%</text>
<rect x="150" y="227" width="76" height="18" fill="#9CA3AF"/><text x="140" y="240" text-anchor="end">reply &lt;= 24 h</text><text x="232" y="240">25%</text>
</svg>
`;

/* ── Weak template ── */

const weakReadme = `# Telehealth cancellations: what members are telling us

## Summary

Members are telling us directly why they leave, and the number one answer is **price**. In the exit survey, 10 of 26 cancelling members (38.5%) chose "Price" as their main reason, more than any other option.

| Reason | Responses | Percent |
|---|---|---|
| Price | 10 | 38.5% |
| Care access | 9 | 34.6% |
| App problems | 4 | 15.4% |
| Moving or insurance change | 2 | 7.7% |
| Other | 1 | 3.8% |

The timing lines up as well: we raised prices on July 1, and cancellations went up in the following quarter, from 2.8% to 4.6%. Several comments mention cost directly, for example "$35 a month adds up" and "Too pricey."

App problems are a smaller factor (15%), which suggests the v5.0 release isn't the main issue.

## Recommendation

Roll the price increase back for new members, or offer the old $29 Core price to members who start the cancellation flow. Since price is the most common reason, this should have the biggest impact on cancellations. We could also look at an annual plan with a discount.

Care access is the second reason, so the care team could also try to respond faster where possible.

## Method

I loaded \`exit_survey.csv\` in pandas and counted the \`primary_reason\` column (\`survey_counts.py\`). The output is in \`survey_counts.csv\`.

## Next steps

- A/B test the old price in the cancellation flow.
- Look at the member data in more detail.
`;

const weakScript = `import pandas as pd

survey = pd.read_csv("data/exit_survey.csv")
counts = survey["primary_reason"].value_counts()
pct = (counts / counts.sum() * 100).round(1)
summary = pd.DataFrame({"responses": counts, "percent": pct})
summary.index.name = "primary_reason"
summary.to_csv("survey_counts.csv")
print(summary)
`;

const weakCounts = `primary_reason,responses,percent
Price,10,38.5
Care access,9,34.6
App problems,4,15.4
Moving or insurance change,2,7.7
Other,1,3.8
`;

const mod: ChallengeModule = {
  challenge: {
    id: 'ch_churn',
    kind: 'live',
    companyId: 'co_fernhill',
    title: 'Why are patients cancelling their telehealth plans?',
    summary: 'Cancellations rose from 2.8% to 4.6% a month. Find the real driver and what to fix.',
    type: 'data',
    skills: ['Python', 'pandas', 'SQL', 'Segmentation', 'Survey analysis', 'Data storytelling'],
    classroomConcepts: [
      { concept: 'Rates vs. counts and conditional probability', course: 'Intro to Statistics' },
      { concept: 'Confounding and stratified comparisons', course: 'Statistical Inference' },
      { concept: 'Coding open-ended survey responses', course: 'Research Methods' },
    ],
    difficulty: 'intermediate',
    estHours: 4,
    brief,
    deliverables: [
      'A findings-first README (about one page)',
      'A table of cancellation rates by segment, with member counts',
      'At least one chart that supports your main finding',
      'The code, queries or spreadsheet steps behind every number',
      'Up to three prioritized recommendations with expected impact',
    ],
    rubric: [
      {
        id: 'analysis_rigor',
        name: 'Analytical rigor',
        description: 'Compares cancellation rates (not counts) with group sizes shown, handles blanks and the oversampling correctly, and checks whether one factor explains another.',
        weight: 30,
      },
      {
        id: 'insight',
        name: 'Insight',
        description: 'Identifies what actually separates members who cancel from those who stay, and tests each leadership theory against both the member data and the survey.',
        weight: 25,
      },
      {
        id: 'recommendations',
        name: 'Recommendations',
        description: 'Up to three prioritized, specific actions, each tied to the evidence with an expected impact and a metric to track.',
        weight: 20,
      },
      {
        id: 'visualization',
        name: 'Visualization',
        description: 'One or two honestly labeled charts that make the main finding obvious at a glance.',
        weight: 10,
      },
      {
        id: 'communication',
        name: 'Communication',
        description: 'A README a VP could act on in five minutes: bottom line first, numbers in plain language, caveats stated plainly.',
        weight: 15,
      },
    ],
    reward: { mode: 'top3', amounts: [250, 125, 75] },
    applicantCap: 50,
    status: 'open',
    hiringFor: 'Data Analyst I · Full-time · Minneapolis, MN (hybrid)',
    starterFiles: [
      { path: 'README.md', content: starterReadme },
      { path: 'data_dictionary.md', content: dataDictionary },
      { path: 'data/members.csv', content: membersCsv },
      { path: 'data/exit_survey.csv', content: exitSurveyCsv },
    ],
    aiHints: {
      testing:
        'Whether you can tell a real driver from a loud one. Leadership already has three stories; this task checks that you compare cancellation rates across segments, test each story against the data, and treat survey comments as evidence rather than a vote count.',
      steps: [
        'Read the data dictionary first, especially the sampling note and what a blank value means in each column.',
        'For each segment (price cohort, plan, channel, first-visit timing, reply time, app rating), compute members, cancellations and the cancellation rate.',
        'Test each leadership theory directly: does the rate really differ, and does the gap hold when you keep another factor fixed?',
        'Code the 26 survey comments into themes yourself and compare them with the dropdown answers.',
        'Size the biggest driver: how many cancellations in the sample would go away if that group cancelled like everyone else?',
        'Write the README findings first, then up to three prioritized recommendations, each with a metric.',
      ],
      greatLooksLike:
        'A great submission has a small table of cancellation rates with group sizes and makes one clear call about what drives cancellations, backed by both files. It tests the price, app and wait-time theories explicitly and says how big each effect is. It then turns the main finding into two or three concrete operational changes, each with a target and a way to measure it.',
      pitfalls: [
        'Reporting cancellation counts by segment instead of rates: the biggest channel will always have the most cancellations.',
        'Taking the survey dropdown at face value without reading the comments.',
        'Letting blanks land in the wrong group, for example treating members who never sent a message as having fast replies.',
        "Comparing this file's overall cancel rate to the 4.6% headline even though cancellations are oversampled.",
        "Recommendations like 'improve the experience' with no target, owner or metric.",
      ],
    },
    deadlineInDays: 5,
    createdDaysAgo: 9,
    seed: { participants: 31, submissions: 9, scored: 4 },
  },
  templates: [
    {
      quality: 'strong',
      notes: `### What I built
A pandas script (\`analysis.py\`) that computes cancellation rates for every segment in the member file, a hand-coded theme for each of the 26 survey comments, one chart, and a findings-first README with three recommendations.

### Key decisions & trade-offs
- **Rates with group sizes everywhere.** Channels differ in size, so counts mislead: paid social has the most cancellations (11) but the same rate as referral.
- **Blanks get their own bucket.** The 3 members who never messaged have no reply time, so I kept them separate instead of letting them count as fast replies.
- **I coded the comments myself** instead of trusting the dropdown. 16 of 26 describe slow replies or no first visit, including 6 of the 10 who picked "Price."
- **I tested price inside each reply-time bucket.** With slow replies, new-price and old-price members cancel at 82% and 78%, so price isn't hiding behind reply time.
- With n = 75 I skipped significance tests and labeled small segments as directional.

### What I'd do with more time
Pull reply times by week to pin down when the slowdown started, and rerun on the full cohort so the excess-cancellation estimate becomes a company-wide number.`,
      files: [
        { path: 'README.md', content: strongReadme },
        { path: 'analysis.py', content: strongAnalysis },
        { path: 'survey_coding.csv', content: strongCoding },
        { path: 'segment_rates.csv', content: strongRates },
        { path: 'cancel_rate_by_segment.svg', content: strongChart },
      ],
      feedback:
        "Rigorous and clear. You show cancellation rates with group sizes for every segment, keep the never-messaged members separate, and test price inside each reply-time bucket, which settles the price question. Hand-coding the comments to show that 6 of the 10 'Price' answers are really about waiting is exactly the insight we needed. To go further, put a rough staffing cost next to the reply SLA you recommend.",
      aiDisclosure:
        'Used an AI assistant to remind me of the pandas syntax for pd.cut and crosstab. The survey coding, analysis and recommendations are my own.',
    },
    {
      quality: 'solid',
      notes: `**What I built**
A Python script that breaks cancellations down by channel, plan, price, age, state, reply time and first-visit timing, plus a count of the exit-survey reasons. I wrote up the results and four recommendations in the README and drew two charts.

**Key decisions & trade-offs**
- I used counts for most breakdowns because they're easy to explain to leadership: "11 of our 30 cancellations came from paid social" is a sentence anyone understands.
- For reply time and first visits I used rates, because those groups are very different sizes. That's where the biggest difference showed up: 80% vs. 25% for replies over 24 hours.
- I used the survey dropdown as-is to rank reasons. Price came out on top, so I treated it as a secondary driver.
- I kept everything in one script so it reruns in a few seconds.

**What I'd do with more time**
Read through all of the survey comments, look at reply times by month, and test whether paid social members behave differently after their first visit.`,
      files: [
        { path: 'README.md', content: solidReadme },
        { path: 'churn_analysis.py', content: solidAnalysis },
        { path: 'cancellations_by_segment.csv', content: solidCounts },
        { path: 'charts.svg', content: solidCharts },
      ],
      feedback:
        "You found the main driver: members who wait more than 24 hours for a reply cancel at 80% vs. 25%, and that's the right headline. Elsewhere the analysis uses counts where it needs rates; paid social has the most cancellations because it's our biggest channel, and its rate (42%) is no worse than referral's. Reading the comments would have shown that most 'Price' answers are really about waiting, and the recommendations need targets and metrics to be actionable.",
      aiDisclosure: 'Asked an AI chatbot how to group and count rows in pandas. Everything else is my own work.',
    },
    {
      quality: 'weak',
      notes: `**What I built**
A summary of the exit survey: I counted the primary reasons members gave for cancelling and turned them into a table and a recommendation.

**Key decisions & trade-offs**
- I focused on the exit survey because it's the most direct evidence. Members are telling us in their own words why they leave, so we don't need to guess from behavior data.
- "Price" was the top reason (38.5%), and the timing matches the July 1 price increase, so I recommended rolling the price back or offering the old price as a save offer in the cancellation flow.
- I didn't break the member file into segments because the survey already answers the "why" question.

**What I'd do with more time**
Run an A/B test of the old price in the cancellation flow, and look at the member data in more detail to see which plans are most affected.`,
      files: [
        { path: 'README.md', content: weakReadme },
        { path: 'survey_counts.py', content: weakScript },
        { path: 'survey_counts.csv', content: weakCounts },
      ],
      feedback:
        "Clear writing and a tidy summary of the exit survey, but the conclusion rests on the dropdown alone. 'Price' is the first option in the list, and 6 of the 10 members who chose it wrote about slow replies in their comments. The member file shows new-price and old-price members cancel at almost the same rate (41% vs. 38%), so a rollback would likely cost revenue without fixing churn. Next time, compute cancellation rates by segment before recommending a fix.",
      aiDisclosure: 'None.',
    },
  ],
  scripted: [
    {
      challengeId: 'ch_churn',
      studentId: 'stu_diego',
      scores: { analysis_rigor: 5, insight: 4, recommendations: 4, visualization: 5, communication: 4 },
      feedback:
        "The most rigorous analysis we've received: rates with group sizes throughout, the never-messaged members handled separately, and the price check inside each reply-time bucket settled a debate we've been having for weeks. The segment chart is exactly what we'd put in front of the VP. For insight, we'd have liked you to look at when replies slowed down (reply time by signup month) so we can tie the jump to a specific change. The reply SLA is the right first move, but it needs a rough staffing cost beside the expected impact, and the bottom line could be a single sentence a VP can forward as-is.",
      templateIndex: 0,
      submittedDaysAgo: 2,
    },
    {
      challengeId: 'ch_churn',
      studentId: 'stu_malik',
      scores: null,
      feedback: null,
      templateIndex: 1,
      submittedDaysAgo: 1,
    },
  ],
};

export default mod;
