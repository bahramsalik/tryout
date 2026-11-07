import type { ChallengeModule } from '../lib.ts';

const brief = `## Context

Fernhill runs 14 primary-care clinics across Minnesota and Wisconsin, and lobby wait time is the most common complaint in our post-visit surveys. Today each clinic tracks waits in its own spreadsheet, and the numbers don't agree, mostly because people calculate "wait" differently. Renee Albright, our Director of Clinic Operations, wants a single one-page view for four pilot clinics (Midway, Northeast, Bloomington and Eau Claire) that managers can open before their weekly huddle. If it works, we'll roll it out to all 14 clinics.

Our official targets are a median wait of 15 minutes or less and a 90th-percentile wait of 30 minutes or less. Managers have strong opinions about when the lobby backs up, but nobody has looked at the data across clinics.

## The task

Build a static, one-page dashboard from a two-week visit extract that shows:

1. Wait time by clinic, using the definition in \`metric_definitions.md\`.
2. When waits happen: by day of week and by hour of check-in.
3. A short written callout of anything managers should act on.
4. How many visits couldn't be measured, and why.

Write a prep script or queries that turn \`visits.csv\` into the numbers on the page, so our team can rerun it next month on a fresh extract.

## Constraints

- Time box: about 4 hours.
- Any tools: Python, R or SQL for prep, and a static HTML page, a notebook export, or a BI tool export for the dashboard. If you use a BI tool, include screenshots plus the workbook.
- Follow \`metric_definitions.md\` exactly. Managers will compare your numbers to each other's.
- AI assistants are allowed if you tell us how you used them.
- Out of scope: live data connections, forecasting and staffing models.
- The extract is a small sample, so flag where cells are too thin to trust.

## What we provide

- \`data/visits.csv\`: 80 in-person check-ins across 4 clinics, weekdays from August 24 to September 4, 2026, with check-in, rooming, provider-start and check-out times.
- \`metric_definitions.md\`: official definitions of wait time, cycle time and left-without-being-seen, plus rules for missing timestamps.
- \`request.md\`: Renee's original request email.
- \`README.md\`: column notes and how to submit.
`;

const visitsCsv = `visit_id,clinic,visit_date,visit_type,check_in,roomed_at,provider_start,check_out,visit_status
V88140,Midway,2026-08-24,established,08:08,08:46,08:49,09:03,completed
V88147,Midway,2026-08-24,sick_visit,08:14,,,,left_without_being_seen
V88154,Midway,2026-08-24,established,08:44,09:28,09:33,09:52,completed
V88161,Midway,2026-08-24,established,08:52,09:28,09:37,10:03,completed
V88168,Midway,2026-08-24,established,09:59,10:50,10:57,11:15,completed
V88175,Midway,2026-08-24,established,10:07,10:18,10:28,10:41,completed
V88182,Bloomington,2026-08-24,established,10:10,10:17,10:26,10:47,completed
V88189,Eau Claire,2026-08-24,sick_visit,10:34,10:44,10:47,11:01,completed
V88196,Northeast,2026-08-24,annual_physical,11:43,,12:05,12:34,completed
V88203,Midway,2026-08-24,sick_visit,13:38,13:44,13:48,14:00,completed
V88210,Northeast,2026-08-24,annual_physical,13:42,13:56,13:58,14:36,completed
V88217,Eau Claire,2026-08-24,established,15:18,15:32,15:38,15:55,completed
V88224,Eau Claire,2026-08-25,sick_visit,08:45,08:57,09:00,09:17,completed
V88231,Northeast,2026-08-25,established,08:52,09:07,09:14,09:32,completed
V88238,Northeast,2026-08-25,established,09:29,09:42,09:49,10:11,completed
V88245,Northeast,2026-08-25,sick_visit,10:11,10:14,10:16,10:36,completed
V88252,Bloomington,2026-08-25,established,11:44,11:57,12:05,12:26,completed
V88259,Eau Claire,2026-08-25,established,12:19,12:27,12:32,12:59,completed
V88266,Midway,2026-08-25,sick_visit,12:48,12:59,13:01,13:28,completed
V88273,Northeast,2026-08-25,established,14:06,14:39,14:45,15:12,completed
V88280,Northeast,2026-08-25,sick_visit,15:17,15:30,15:33,16:00,completed
V88287,Bloomington,2026-08-26,sick_visit,10:13,10:21,10:23,10:41,completed
V88294,Northeast,2026-08-26,sick_visit,11:10,11:20,11:28,11:43,completed
V88301,Northeast,2026-08-26,new_patient,11:53,12:00,12:02,12:29,completed
V88308,Eau Claire,2026-08-26,established,13:05,13:39,13:41,13:54,completed
V88315,Eau Claire,2026-08-26,established,13:31,13:39,13:42,14:03,completed
V88322,Eau Claire,2026-08-26,established,13:47,13:58,14:08,14:21,completed
V88329,Bloomington,2026-08-26,established,15:19,15:32,15:42,16:09,completed
V88336,Bloomington,2026-08-27,established,08:04,08:09,08:18,08:32,completed
V88343,Bloomington,2026-08-27,established,08:17,08:26,08:36,08:53,completed
V88350,Eau Claire,2026-08-27,sick_visit,08:23,08:35,08:43,08:56,completed
V88357,Northeast,2026-08-27,sick_visit,10:04,10:10,10:18,10:45,completed
V88364,Midway,2026-08-27,sick_visit,10:47,10:58,11:08,11:31,completed
V88371,Eau Claire,2026-08-27,established,11:02,11:11,11:17,11:36,completed
V88378,Midway,2026-08-27,sick_visit,15:18,15:32,15:37,15:56,completed
V88385,Northeast,2026-08-28,established,08:32,08:50,08:53,09:14,completed
V88392,Midway,2026-08-28,annual_physical,09:19,09:29,09:37,10:06,completed
V88399,Eau Claire,2026-08-28,established,09:37,09:42,09:52,10:04,completed
V88406,Eau Claire,2026-08-28,annual_physical,10:40,10:52,11:02,11:35,completed
V88413,Eau Claire,2026-08-28,established,15:59,16:11,16:13,16:31,completed
V88420,Bloomington,2026-08-28,established,16:25,16:41,16:48,17:12,completed
V88427,Midway,2026-08-31,annual_physical,08:41,09:22,09:28,09:55,completed
V88434,Eau Claire,2026-08-31,established,08:49,09:01,09:08,09:32,completed
V88441,Midway,2026-08-31,sick_visit,09:05,09:37,09:46,10:12,completed
V88448,Midway,2026-08-31,established,09:10,09:57,10:07,10:25,completed
V88455,Midway,2026-08-31,sick_visit,09:36,10:09,10:14,10:35,completed
V88462,Midway,2026-08-31,established,09:43,,,,left_without_being_seen
V88469,Eau Claire,2026-08-31,established,09:56,10:09,10:14,10:31,completed
V88476,Midway,2026-08-31,sick_visit,10:17,10:22,10:24,10:44,completed
V88483,Midway,2026-08-31,established,11:24,11:33,11:36,11:57,completed
V88490,Northeast,2026-08-31,annual_physical,15:11,15:25,15:29,16:01,completed
V88497,Eau Claire,2026-08-31,established,15:16,15:19,15:24,15:47,completed
V88504,Bloomington,2026-08-31,new_patient,15:54,16:15,16:25,16:58,completed
V88511,Northeast,2026-08-31,established,16:12,16:21,16:27,16:51,completed
V88518,Northeast,2026-09-01,sick_visit,10:32,10:44,10:50,11:07,completed
V88525,Midway,2026-09-01,annual_physical,10:47,10:56,11:04,11:39,completed
V88532,Northeast,2026-09-01,annual_physical,12:12,12:27,12:36,13:05,completed
V88539,Bloomington,2026-09-01,sick_visit,16:06,16:22,16:29,16:48,completed
V88546,Northeast,2026-09-02,established,09:21,09:32,09:39,10:05,completed
V88553,Bloomington,2026-09-02,sick_visit,13:03,13:23,13:25,13:51,completed
V88560,Midway,2026-09-02,established,14:30,14:33,14:39,14:57,completed
V88567,Bloomington,2026-09-02,annual_physical,15:44,15:48,15:56,16:28,completed
V88574,Midway,2026-09-02,established,16:00,16:17,16:25,16:39,completed
V88581,Midway,2026-09-03,new_patient,08:11,08:30,08:37,09:09,completed
V88588,Bloomington,2026-09-03,sick_visit,08:15,08:33,08:36,09:04,completed
V88595,Bloomington,2026-09-03,established,08:56,,09:12,09:39,completed
V88602,Bloomington,2026-09-03,established,10:12,10:21,10:24,10:48,completed
V88609,Bloomington,2026-09-03,annual_physical,11:27,11:58,12:06,12:39,completed
V88616,Midway,2026-09-03,established,12:18,12:29,12:35,12:58,completed
V88623,Bloomington,2026-09-03,sick_visit,12:29,12:45,12:54,13:09,completed
V88630,Northeast,2026-09-03,sick_visit,14:09,14:13,14:23,14:45,completed
V88637,Northeast,2026-09-03,established,15:47,16:00,16:06,16:18,completed
V88644,Northeast,2026-09-04,new_patient,08:36,08:42,08:49,09:26,completed
V88651,Bloomington,2026-09-04,new_patient,09:06,09:17,09:22,09:57,completed
V88658,Midway,2026-09-04,annual_physical,09:45,09:59,10:07,10:35,completed
V88665,Bloomington,2026-09-04,sick_visit,09:54,10:07,10:15,10:38,completed
V88672,Northeast,2026-09-04,established,10:14,10:26,10:31,10:52,completed
V88679,Midway,2026-09-04,established,12:10,12:26,12:29,12:45,completed
V88686,Midway,2026-09-04,new_patient,13:17,13:20,13:24,13:55,completed
V88693,Eau Claire,2026-09-04,sick_visit,16:07,16:12,16:20,16:33,completed
`;

const metricDefinitions = `# Clinic flow metric definitions

Owner: Clinic Operations Analytics · Last reviewed 2026-07-15

These are the definitions used in the monthly Clinic Operations review. Dashboards that report wait times must use them.

## Timestamps (from the front-desk and rooming workflow in our EHR)

| Field | Recorded when |
|---|---|
| \`check_in\` | Front desk completes check-in at the kiosk or desk. |
| \`roomed_at\` | Medical assistant moves the patient into an exam room and starts vitals. |
| \`provider_start\` | Provider opens the visit note in the exam room. |
| \`check_out\` | Front desk closes the visit. |

All times are local clinic time (Central). Visits never cross midnight.

## Metrics

**Wait time (primary).** Minutes from \`check_in\` to \`roomed_at\`. This is the number patients feel in the lobby, and it's the one managers are accountable for.

- Report the **median** and the **90th percentile (p90)**. Averages are fine as a secondary number, but a handful of very long waits can hide behind a normal-looking average.
- Targets: median ≤ 15 min, p90 ≤ 30 min. A "long wait" is anything over 30 min.

**Door-to-provider (secondary).** Minutes from \`check_in\` to \`provider_start\`. Includes the time in the exam room before the provider arrives.

**Cycle time (not a wait metric).** Minutes from \`check_in\` to \`check_out\`. It includes the visit itself, so it is roughly three times the wait. Don't label it as wait time.

**Left without being seen (LWBS).** Visits with \`visit_status = left_without_being_seen\`. These patients checked in and left before rooming, so they have no \`roomed_at\`, \`provider_start\` or \`check_out\`. Report the LWBS count or rate alongside wait time; a rising LWBS rate usually means waits are worse than the timed visits show.

## Missing timestamps

- If \`roomed_at\` is blank on a completed visit, the MA skipped the rooming step in the EHR. Exclude the visit from wait-time statistics and report how many were excluded. Never treat a blank as zero.
- Don't drop LWBS visits silently. They are excluded from wait statistics (no rooming time) but must appear in the LWBS count.

## Grouping

- **Day:** weekday of \`visit_date\`. Clinics are closed on weekends.
- **Hour:** hour of \`check_in\` (8 = 8:00–8:59). Clinics check in patients from 8:00 to 16:59.
`;

const requestEmail = `**From:** Renee Albright, Director of Clinic Operations <ralbright@fernhill.example>
**To:** Priya Nair, Analytics Manager <pnair@fernhill.example>
**Subject:** One-page wait-time view for clinic managers

Hi Priya,

Following up on Tuesday's ops review. We're piloting a shared wait-time view at four clinics (Midway, Northeast, Bloomington and Eau Claire) before rolling it out to all 14. Right now each of them runs its own spreadsheet, and they don't agree with each other, mostly because people calculate "wait" differently. Managers also keep telling me different stories about when the lobby backs up, and I can't tell who's right.

What I'd like is one page that every manager can open before their weekly huddle:

1. Wait time by clinic, using the official definition (check-in to roomed).
2. When waits happen: by day of week and by hour of check-in.
3. Anything that jumps out, written in a sentence or two so I don't have to squint at charts.
4. A note on any visits that couldn't be measured, so nobody thinks we're hiding the bad ones.

It doesn't need to be live yet. A static page built from a two-week extract is fine, as long as your team can rerun it next month on fresh data without rebuilding it by hand.

If it's useful, I'd like to share it at the October Clinic Managers' meeting.

Thanks,
Renee
`;

const starterReadme = `# Clinic wait-time dashboard (starter kit)

Welcome! Clinic Operations wants a one-page view of patient wait times. Start with \`request.md\` (what they asked for) and \`metric_definitions.md\` (how we define wait time).

## What's here

~~~
README.md               this file
request.md              the request from Renee Albright, Director of Clinic Operations
metric_definitions.md   official definitions for wait time, LWBS and missing timestamps
data/visits.csv         80 in-person check-ins, 4 clinics, Aug 24 – Sep 4, 2026 (weekdays)
~~~

## \`data/visits.csv\` columns

| Column | Notes |
|---|---|
| \`visit_id\` | Unique visit key. |
| \`clinic\` | \`Midway\` (St. Paul), \`Northeast\` (Minneapolis), \`Bloomington\`, \`Eau Claire\` (WI). |
| \`visit_date\` | \`YYYY-MM-DD\`. |
| \`visit_type\` | \`established\`, \`sick_visit\`, \`annual_physical\`, \`new_patient\`. |
| \`check_in\`, \`roomed_at\`, \`provider_start\`, \`check_out\` | \`HH:MM\`, local time, 24-hour clock. Can be blank (see \`metric_definitions.md\`). |
| \`visit_status\` | \`completed\` or \`left_without_being_seen\`. |

The extract is a random sample of about 1 in 30 check-ins from those two weeks, so small cells (one clinic on one weekday) will be noisy. Say so where it matters.

## Submitting

Zip up your README, your prep script or queries, and the dashboard itself (a static HTML page, a notebook export, a PDF of a BI dashboard, or screenshots plus the workbook). We should be able to rerun your prep on next month's extract.

Questions: analytics-challenges@fernhill.example
`;

/* ── Strong template ── */

const strongReadme = `# Clinic wait-time dashboard

Open \`dashboard.html\` in any browser; no server needed.

## The headline

**Monday mornings at Midway drive most of our long waits.** Of the 10 Midway check-ins between 8 and 10 AM on the two Mondays, all 8 with a rooming time waited more than 30 minutes (median 39.5 min), and the other 2 patients left without being seen. That window accounts for **8 of the 11 waits over 30 minutes** in the whole extract. The rest of the week, Midway's median wait is 11 minutes, the same as everywhere else.

## Numbers (wait = check-in → roomed, per \`metric_definitions.md\`)

| Clinic | Timed visits | Median | p90 | Over 30 min | LWBS | No rooming time |
|---|---|---|---|---|---|---|
| Midway | 24 | 14.0 | 43.1 | 33% | 2 | 0 |
| Bloomington | 17 | 13.0 | 20.4 | 6% | 0 | 1 |
| Northeast | 19 | 12.0 | 15.6 | 5% | 0 | 1 |
| Eau Claire | 16 | 11.5 | 13.5 | 6% | 0 | 0 |
| **All** | **76** | **12.0** | **33.0** | 14% | 2 | 2 |

Every clinic meets the 15-minute median target. Only Midway misses the 30-minute p90 target, and the median alone would have hidden that.

## Decisions

- **Median and p90, not the mean.** Midway's mean (20.5) looks a bit high; its p90 (43.1) shows the real problem.
- **Missing \`roomed_at\`:** 4 visits. The 2 LWBS visits (both Midway, Monday before 10 AM) are reported as their own metric. The 2 completed visits with no rooming time (Northeast, Bloomington) are excluded and counted. Nothing is zero-filled.
- \`prep.py\` asserts that no wait is negative.

## Rerunning next month

~~~
python prep.py      # needs pandas; writes out/*.csv
~~~

\`prep.py\` produces every number on the page. I copied them into the SVG charts in \`dashboard.html\` by hand, so a fresh extract means updating those values; generating the HTML from the script is the next step.

## Caveats

This is a 1-in-30 sample, so clinic-by-weekday cells hold 2–12 visits. The Midway pattern repeats on both Mondays, so I'm confident calling it out, but confirm it on the full table before changing staffing.

## Suggested next step for Midway

Check Monday-morning MA staffing and the scheduling template (are Monday 8–10 AM slots overbooked after the weekend?).
`;

const strongPrep = `"""Prep for the clinic wait-time dashboard.

Usage (from the starter-kit root):  python prep.py
Reads data/visits.csv and writes the tables in out/. Needs pandas.

Wait time = check_in -> roomed_at, in minutes (metric_definitions.md).
"""
from pathlib import Path

import pandas as pd

OUT = Path("out")
OUT.mkdir(exist_ok=True)
WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

v = pd.read_csv("data/visits.csv")


def ts(col):
    # Blank times become NaT, never 00:00.
    return pd.to_datetime(v["visit_date"] + " " + v[col], errors="coerce")


v["wait_min"] = (ts("roomed_at") - ts("check_in")).dt.total_seconds() / 60
v["weekday"] = pd.Categorical(pd.to_datetime(v["visit_date"]).dt.day_name(), WEEKDAYS)
v["hour"] = ts("check_in").dt.hour
v["lwbs"] = v["visit_status"].eq("left_without_being_seen")
v["no_rooming_time"] = v["roomed_at"].isna() & ~v["lwbs"]

# Rows without roomed_at are excluded from wait stats but counted, so the
# dashboard can show them. LWBS is reported as its own metric.
assert (v["wait_min"].dropna() >= 0).all(), "negative wait: check the timestamps"
timed = v.dropna(subset=["wait_min"])


def summarize(df, keys):
    g = df.groupby(keys, observed=True)
    out = g["wait_min"].agg(
        timed_visits="size",
        median_wait="median",
        p90_wait=lambda s: s.quantile(0.9),
        share_over_30=lambda s: (s > 30).mean(),
    ).round(2)
    return out.reset_index()


by_clinic = summarize(timed, ["clinic"]).merge(
    v.groupby("clinic").agg(
        checked_in=("visit_id", "size"),
        left_without_being_seen=("lwbs", "sum"),
        missing_roomed_time=("no_rooming_time", "sum"),
    ).reset_index(),
    on="clinic",
)
by_clinic.to_csv(OUT / "by_clinic.csv", index=False)
summarize(timed, ["clinic", "weekday"]).to_csv(OUT / "by_clinic_weekday.csv", index=False)
summarize(timed, ["hour"]).to_csv(OUT / "by_hour.csv", index=False)

# The callout: Midway, Monday, check-ins before 10:00.
spike = (v["clinic"] == "Midway") & (v["weekday"] == "Monday") & (v["hour"] < 10)
long_waits = timed["wait_min"] > 30
print(by_clinic.to_string(index=False))
print(f"Midway Mon 8-10: {spike.sum()} check-ins, "
      f"median {v.loc[spike, 'wait_min'].median():.1f} min, "
      f"{v.loc[spike, 'lwbs'].sum()} left without being seen")
print(f"Long waits (>30 min): {long_waits.sum()} total, "
      f"{(long_waits & spike[timed.index]).sum()} at Midway Mon 8-10")
`;

const strongDashboard = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Clinic wait times · Aug 24 – Sep 4, 2026</title>
<style>
body{font-family:system-ui,sans-serif;margin:24px;color:#1f2937;max-width:900px}
h1{font-size:20px;margin:0}.sub{color:#6b7280;margin:4px 0 16px}
.kpis{display:flex;gap:12px;margin-bottom:16px}.kpi{flex:1;border:1px solid #e5e7eb;border-radius:8px;padding:10px}
.kpi b{display:block;font-size:22px}.kpi span{color:#6b7280;font-size:12px}
.callout{background:#fff7ed;border-left:4px solid #ea580c;padding:10px 12px;margin-bottom:16px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}h2{font-size:14px;margin:0 0 6px}
svg text{font-size:11px;fill:#374151}.note{color:#6b7280;font-size:12px}
</style>
</head>
<body>
<h1>Clinic wait times (check-in to roomed)</h1>
<p class="sub">4 clinics · 80 check-ins · Aug 24 – Sep 4, 2026 · source: data/visits.csv via prep.py</p>
<div class="kpis">
<div class="kpi"><b>12 min</b><span>median wait (target ≤ 15)</span></div>
<div class="kpi"><b>33 min</b><span>90th percentile (target ≤ 30)</span></div>
<div class="kpi"><b>11</b><span>waits over 30 min (of 76 timed)</span></div>
<div class="kpi"><b>2</b><span>left without being seen</span></div>
</div>
<div class="callout"><b>Midway, Monday 8–10 AM drives the long waits.</b> 10 check-ins, median wait 39.5 min, 2 patients left without being seen. 8 of the 11 waits over 30 minutes happened in that window. Outside it, Midway's median is 11 min, in line with the other clinics.</div>
<div class="grid">
<div>
<h2>Median and 90th percentile wait by clinic (min)</h2>
<svg viewBox="0 0 420 170" width="100%">
<text x="80" y="32" text-anchor="end">Midway</text><rect x="88" y="20" width="259" height="16" fill="#fdba74"/><rect x="88" y="20" width="84" height="16" fill="#c2410c"/><text x="351" y="32">14 / 43.1</text>
<text x="80" y="64" text-anchor="end">Bloomington</text><rect x="88" y="52" width="122" height="16" fill="#fdba74"/><rect x="88" y="52" width="78" height="16" fill="#c2410c"/><text x="214" y="64">13 / 20.4</text>
<text x="80" y="96" text-anchor="end">Northeast</text><rect x="88" y="84" width="94" height="16" fill="#fdba74"/><rect x="88" y="84" width="72" height="16" fill="#c2410c"/><text x="186" y="96">12 / 15.6</text>
<text x="80" y="128" text-anchor="end">Eau Claire</text><rect x="88" y="116" width="81" height="16" fill="#fdba74"/><rect x="88" y="116" width="69" height="16" fill="#c2410c"/><text x="173" y="128">11.5 / 13.5</text>
<line x1="268" y1="10" x2="268" y2="146" stroke="#6b7280" stroke-dasharray="3 3"/><text x="272" y="162">30-min p90 target</text>
</svg>
<p class="note">Dark = median, light = p90. Midway's median looks normal; its p90 does not.</p>
</div>
<div>
<h2>Median wait by clinic and weekday (min)</h2>
<svg viewBox="0 0 420 170" width="100%">
<text x="120" y="14" text-anchor="middle">Mon</text>
<text x="178" y="14" text-anchor="middle">Tue</text>
<text x="236" y="14" text-anchor="middle">Wed</text>
<text x="294" y="14" text-anchor="middle">Thu</text>
<text x="352" y="14" text-anchor="middle">Fri</text>
<text x="84" y="42" text-anchor="end">Midway</text>
<rect x="92" y="22" width="56" height="30" fill="#c2410c"/><text x="120" y="41" text-anchor="middle" fill="#fff">34.5</text>
<rect x="150" y="22" width="56" height="30" fill="#fff7ed"/><text x="178" y="41" text-anchor="middle">10</text>
<rect x="208" y="22" width="56" height="30" fill="#fff7ed"/><text x="236" y="41" text-anchor="middle">10</text>
<rect x="266" y="22" width="56" height="30" fill="#fff7ed"/><text x="294" y="41" text-anchor="middle">12.5</text>
<rect x="324" y="22" width="56" height="30" fill="#fff7ed"/><text x="352" y="41" text-anchor="middle">12</text>
<text x="84" y="76" text-anchor="end">Bloomington</text>
<rect x="92" y="56" width="56" height="30" fill="#fff7ed"/><text x="120" y="75" text-anchor="middle">14</text>
<rect x="150" y="56" width="56" height="30" fill="#fff7ed"/><text x="178" y="75" text-anchor="middle">14.5</text>
<rect x="208" y="56" width="56" height="30" fill="#fff7ed"/><text x="236" y="75" text-anchor="middle">10.5</text>
<rect x="266" y="56" width="56" height="30" fill="#fff7ed"/><text x="294" y="75" text-anchor="middle">12.5</text>
<rect x="324" y="56" width="56" height="30" fill="#fff7ed"/><text x="352" y="75" text-anchor="middle">13</text>
<text x="84" y="110" text-anchor="end">Northeast</text>
<rect x="92" y="90" width="56" height="30" fill="#fff7ed"/><text x="120" y="109" text-anchor="middle">14</text>
<rect x="150" y="90" width="56" height="30" fill="#fff7ed"/><text x="178" y="109" text-anchor="middle">13</text>
<rect x="208" y="90" width="56" height="30" fill="#fff7ed"/><text x="236" y="109" text-anchor="middle">10</text>
<rect x="266" y="90" width="56" height="30" fill="#fff7ed"/><text x="294" y="109" text-anchor="middle">6</text>
<rect x="324" y="90" width="56" height="30" fill="#fff7ed"/><text x="352" y="109" text-anchor="middle">12</text>
<text x="84" y="144" text-anchor="end">Eau Claire</text>
<rect x="92" y="124" width="56" height="30" fill="#fff7ed"/><text x="120" y="143" text-anchor="middle">12</text>
<rect x="150" y="124" width="56" height="30" fill="#fff7ed"/><text x="178" y="143" text-anchor="middle">10</text>
<rect x="208" y="124" width="56" height="30" fill="#fff7ed"/><text x="236" y="143" text-anchor="middle">11</text>
<rect x="266" y="124" width="56" height="30" fill="#fff7ed"/><text x="294" y="143" text-anchor="middle">10.5</text>
<rect x="324" y="124" width="56" height="30" fill="#fff7ed"/><text x="352" y="143" text-anchor="middle">8.5</text>
</svg>
<p class="note">Cells are medians of 2–12 visits; read small cells as directional.</p>
</div>
</div>
<h2>90th percentile wait by check-in hour, all clinics (min)</h2>
<svg viewBox="0 0 860 150" width="100%">
<rect x="40" y="24" width="60" height="96" fill="#c2410c"/><text x="70" y="18" text-anchor="middle">40.1</text><text x="70" y="136" text-anchor="middle">8:00</text>
<rect x="130" y="11" width="60" height="109" fill="#c2410c"/><text x="160" y="5" text-anchor="middle">45.6</text><text x="160" y="136" text-anchor="middle">9:00</text>
<rect x="220" y="91" width="60" height="29" fill="#9ca3af"/><text x="250" y="85" text-anchor="middle">12</text><text x="250" y="136" text-anchor="middle">10:00</text>
<rect x="310" y="67" width="60" height="53" fill="#9ca3af"/><text x="340" y="61" text-anchor="middle">22</text><text x="340" y="136" text-anchor="middle">11:00</text>
<rect x="400" y="82" width="60" height="38" fill="#9ca3af"/><text x="430" y="76" text-anchor="middle">16</text><text x="430" y="136" text-anchor="middle">12:00</text>
<rect x="490" y="59" width="60" height="61" fill="#9ca3af"/><text x="520" y="53" text-anchor="middle">25.6</text><text x="520" y="136" text-anchor="middle">13:00</text>
<rect x="580" y="55" width="60" height="65" fill="#9ca3af"/><text x="610" y="49" text-anchor="middle">27.2</text><text x="610" y="136" text-anchor="middle">14:00</text>
<rect x="670" y="85" width="60" height="35" fill="#9ca3af"/><text x="700" y="79" text-anchor="middle">14.7</text><text x="700" y="136" text-anchor="middle">15:00</text>
<rect x="760" y="80" width="60" height="40" fill="#9ca3af"/><text x="790" y="74" text-anchor="middle">16.6</text><text x="790" y="136" text-anchor="middle">16:00</text>
</svg>
<p class="note">Excluded from wait stats: 2 left-without-being-seen visits (Midway) and 2 completed visits with no rooming time recorded (Northeast, Bloomington). They are counted above, not zero-filled. Small sample: 76 timed visits.</p>
</body>
</html>
`;

const strongByClinic = `clinic,timed_visits,median_wait,p90_wait,share_over_30,checked_in,left_without_being_seen,missing_roomed_time
Bloomington,17,13.0,20.4,0.06,18,0,1
Eau Claire,16,11.5,13.5,0.06,16,0,0
Midway,24,14.0,43.1,0.33,26,2,0
Northeast,19,12.0,15.6,0.05,20,0,1
`;

const strongByClinicWeekday = `clinic,weekday,timed_visits,median_wait,p90_wait,share_over_30
Bloomington,Monday,2,14.0,19.6,0.0
Bloomington,Tuesday,2,14.5,15.7,0.0
Bloomington,Wednesday,4,10.5,17.9,0.0
Bloomington,Thursday,6,12.5,24.5,0.17
Bloomington,Friday,3,13.0,15.4,0.0
Eau Claire,Monday,5,12.0,13.6,0.0
Eau Claire,Tuesday,2,10.0,11.6,0.0
Eau Claire,Wednesday,3,11.0,29.4,0.33
Eau Claire,Thursday,2,10.5,11.7,0.0
Eau Claire,Friday,4,8.5,12.0,0.0
Midway,Monday,12,34.5,46.7,0.67
Midway,Tuesday,2,10.0,10.8,0.0
Midway,Wednesday,2,10.0,15.6,0.0
Midway,Thursday,4,12.5,17.5,0.0
Midway,Friday,4,12.0,15.4,0.0
Northeast,Monday,3,14.0,14.0,0.0
Northeast,Tuesday,7,13.0,22.2,0.14
Northeast,Wednesday,3,10.0,10.8,0.0
Northeast,Thursday,3,6.0,11.6,0.0
Northeast,Friday,3,12.0,16.8,0.0
`;

/* ── Solid template ── */

const solidReadme = `# Clinic wait-time dashboard

\`dashboard.html\` is a static page with three charts: average wait by clinic, by weekday and by check-in hour.

## How to rebuild

~~~
sqlite3 waits.db < prep.sql
~~~

\`prep.sql\` imports \`data/visits.csv\`, computes wait time and writes four CSVs (\`out_avg_by_clinic.csv\`, \`out_avg_by_weekday.csv\`, \`out_avg_by_hour.csv\`, \`out_avg_by_clinic_weekday.csv\`). The charts in \`dashboard.html\` use the values from those files. Next month, drop the new extract into \`data/\` and rerun the same command.

## Metric

Wait time = minutes from \`check_in\` to \`roomed_at\`, as in \`metric_definitions.md\`. I did not use check-out, since that includes the visit itself.

4 of the 80 visits have no \`roomed_at\` (2 patients who left without being seen and 2 completed visits where rooming wasn't recorded). They can't have a wait time, so I excluded them instead of counting them as zero. The dashboard is based on the remaining 76 visits.

## What the data shows

| Clinic | Visits | Avg wait (min) |
|---|---|---|
| Midway | 24 | 20.5 |
| Bloomington | 17 | 13.5 |
| Northeast | 19 | 12.0 |
| Eau Claire | 16 | 11.3 |

- **Midway has the longest average wait**, about 7 minutes more than the next clinic.
- **Monday is the slowest day** (21.4 min average vs. 10.9–13.3 on other days).
- **Mornings are slower:** check-ins in the 8 and 9 AM hours average about 20–21 minutes, compared with 9–14 minutes for the rest of the day.
- Eau Claire is the fastest clinic.

## Limitations

The sample is small (76 timed visits), so some clinic and weekday combinations have only two or three visits. I used averages because they're easy for managers to compare; medians would be less sensitive to a few long waits.
`;

const solidPrep = `-- Clinic wait-time prep (SQLite).
-- Run from the starter-kit root:  sqlite3 waits.db < prep.sql
-- Wait time = check_in -> roomed_at, in minutes (see metric_definitions.md).

.mode csv
.headers on
DROP TABLE IF EXISTS visits;
.import data/visits.csv visits

-- 4 rows have no roomed_at (2 left without being seen, 2 not recorded).
-- They have no wait time, so they're excluded below rather than counted as 0.
DROP VIEW IF EXISTS waits;
CREATE VIEW waits AS
SELECT
  visit_id,
  clinic,
  visit_date,
  CASE CAST(strftime('%w', visit_date) AS INTEGER)
    WHEN 1 THEN '1 Mon' WHEN 2 THEN '2 Tue' WHEN 3 THEN '3 Wed'
    WHEN 4 THEN '4 Thu' WHEN 5 THEN '5 Fri' END AS weekday,
  CAST(substr(check_in, 1, 2) AS INTEGER) AS hour,
  ROUND((julianday(visit_date || ' ' || roomed_at)
       - julianday(visit_date || ' ' || check_in)) * 1440) AS wait_min
FROM visits
WHERE roomed_at <> '';

.output out_avg_by_clinic.csv
SELECT clinic, COUNT(*) AS visits, ROUND(AVG(wait_min), 1) AS avg_wait_min
FROM waits GROUP BY clinic ORDER BY avg_wait_min DESC;

.output out_avg_by_weekday.csv
SELECT weekday, COUNT(*) AS visits, ROUND(AVG(wait_min), 1) AS avg_wait_min
FROM waits GROUP BY weekday ORDER BY weekday;

.output out_avg_by_hour.csv
SELECT hour, COUNT(*) AS visits, ROUND(AVG(wait_min), 1) AS avg_wait_min
FROM waits GROUP BY hour ORDER BY hour;

.output out_avg_by_clinic_weekday.csv
SELECT clinic, weekday, COUNT(*) AS visits, ROUND(AVG(wait_min), 1) AS avg_wait_min
FROM waits GROUP BY clinic, weekday ORDER BY clinic, weekday;

.output stdout
SELECT COUNT(*) AS excluded_no_roomed_time FROM visits WHERE roomed_at = '';
`;

const solidDashboard = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Clinic wait times</title>
<style>body{font-family:Arial,sans-serif;margin:20px;color:#222}
h1{font-size:20px}h2{font-size:15px;margin:18px 0 4px}
svg text{font-size:12px}.note{color:#666;font-size:12px}</style></head>
<body>
<h1>Fernhill clinic wait times, Aug 24 – Sep 4, 2026</h1>
<p>Average wait from check-in to roomed, in minutes. 76 visits with a rooming time (4 excluded, see README).</p>
<h2>By clinic</h2>
<svg viewBox="0 0 460 122" width="460">
<text x="100" y="20" text-anchor="end">Midway</text><rect x="108" y="6" width="246" height="20" fill="#2b6cb0"/><text x="359" y="20">20.5</text>
<text x="100" y="48" text-anchor="end">Bloomington</text><rect x="108" y="34" width="162" height="20" fill="#2b6cb0"/><text x="275" y="48">13.5</text>
<text x="100" y="76" text-anchor="end">Northeast</text><rect x="108" y="62" width="144" height="20" fill="#2b6cb0"/><text x="257" y="76">12.0</text>
<text x="100" y="104" text-anchor="end">Eau Claire</text><rect x="108" y="90" width="136" height="20" fill="#2b6cb0"/><text x="249" y="104">11.3</text>
</svg>
<h2>By weekday</h2>
<svg viewBox="0 0 460 150" width="460">
<text x="100" y="20" text-anchor="end">Monday</text><rect x="108" y="6" width="257" height="20" fill="#2b6cb0"/><text x="370" y="20">21.4</text>
<text x="100" y="48" text-anchor="end">Tuesday</text><rect x="108" y="34" width="160" height="20" fill="#2b6cb0"/><text x="273" y="48">13.3</text>
<text x="100" y="76" text-anchor="end">Wednesday</text><rect x="108" y="62" width="146" height="20" fill="#2b6cb0"/><text x="259" y="76">12.2</text>
<text x="100" y="104" text-anchor="end">Thursday</text><rect x="108" y="90" width="150" height="20" fill="#2b6cb0"/><text x="263" y="104">12.5</text>
<text x="100" y="132" text-anchor="end">Friday</text><rect x="108" y="118" width="131" height="20" fill="#2b6cb0"/><text x="244" y="132">10.9</text>
</svg>
<h2>By check-in hour</h2>
<svg viewBox="0 0 460 262" width="460">
<text x="100" y="20" text-anchor="end">8:00</text><rect x="108" y="6" width="245" height="20" fill="#2b6cb0"/><text x="358" y="20">20.4</text>
<text x="100" y="48" text-anchor="end">9:00</text><rect x="108" y="34" width="253" height="20" fill="#2b6cb0"/><text x="366" y="48">21.1</text>
<text x="100" y="76" text-anchor="end">10:00</text><rect x="108" y="62" width="106" height="20" fill="#2b6cb0"/><text x="219" y="76">8.8</text>
<text x="100" y="104" text-anchor="end">11:00</text><rect x="108" y="90" width="158" height="20" fill="#2b6cb0"/><text x="271" y="104">13.2</text>
<text x="100" y="132" text-anchor="end">12:00</text><rect x="108" y="118" width="154" height="20" fill="#2b6cb0"/><text x="267" y="132">12.8</text>
<text x="100" y="160" text-anchor="end">13:00</text><rect x="108" y="146" width="164" height="20" fill="#2b6cb0"/><text x="277" y="160">13.7</text>
<text x="100" y="188" text-anchor="end">14:00</text><rect x="108" y="174" width="160" height="20" fill="#2b6cb0"/><text x="273" y="188">13.3</text>
<text x="100" y="216" text-anchor="end">15:00</text><rect x="108" y="202" width="145" height="20" fill="#2b6cb0"/><text x="258" y="216">12.1</text>
<text x="100" y="244" text-anchor="end">16:00</text><rect x="108" y="230" width="151" height="20" fill="#2b6cb0"/><text x="264" y="244">12.6</text>
</svg>
<p class="note">Built from the CSVs written by prep.sql.</p>
</body>
</html>
`;

const solidByClinic = `clinic,visits,avg_wait_min
Midway,24,20.5
Bloomington,17,13.5
Northeast,19,12.0
"Eau Claire",16,11.3
`;

/* ── Weak template ── */

const weakReadme = `# Fernhill Clinic Wait Time Dashboard

A one-page dashboard for clinic managers, built to be readable in under a minute. Open \`dashboard.html\` in a browser.

## Key takeaways

1. **Patients wait about 42 minutes on average** from the moment they check in to the moment they leave the front desk.
2. **Mornings are the pinch point.** The 8 and 9 AM hours are the slowest of the day (45.1 and 47.5 minutes).
3. **Monday is the slowest day** at 45.2 minutes, and Wednesday is the fastest at 38.7.
4. **Midway and Bloomington have the longest waits** (45.0 and 44.5 minutes). Eau Claire is 7 to 10 minutes faster than the other clinics, which could be worth learning from.

**Recommendation:** add front-desk and rooming staff for Monday mornings, starting at Midway and Bloomington, and look at what Eau Claire does differently.

## How the numbers are calculated

- Wait time = \`check_out\` minus \`check_in\`, in minutes, so it captures the patient's whole time in the building.
- Four visits had missing timestamps. I set those to 0 so every visit is still counted and the totals match the extract (80 visits).
- Averages by clinic, weekday and check-in hour.

## How to rerun

~~~
python prep.py
~~~

This writes \`summary.csv\`. I originally worked the numbers out in a spreadsheet pivot table and then rewrote the steps in \`prep.py\`; the chart values in \`dashboard.html\` are copied from \`summary.csv\`.

## Design notes

- Dark theme so it stands out on the clinic huddle TV.
- Four headline tiles across the top, then a plain-language "What this shows" box, then one chart per question in Renee's email.
- Every chart shows its values on the bars, so no one has to read an axis.
`;

const weakPrep = `# Builds the numbers behind dashboard.html.
# Run: python prep.py   (reads data/visits.csv, writes summary.csv)
import pandas as pd

df = pd.read_csv("data/visits.csv")

start = pd.to_datetime(df["visit_date"] + " " + df["check_in"])
end = pd.to_datetime(df["visit_date"] + " " + df["check_out"], errors="coerce")

# Wait = time from arriving at the front desk to leaving the clinic.
df["wait_min"] = ((end - start).dt.total_seconds() / 60).fillna(0)

df["weekday"] = pd.to_datetime(df["visit_date"]).dt.day_name()
df["hour"] = start.dt.hour

rows = []
for col in ["clinic", "weekday", "hour"]:
    g = df.groupby(col)["wait_min"].mean().round(1)
    for key, val in g.items():
        rows.append({"dimension": col, "value": key, "avg_wait_min": val})

summary = pd.DataFrame(rows)
summary.to_csv("summary.csv", index=False)
print(summary.to_string(index=False))
print("Overall average wait:", round(df["wait_min"].mean(), 1), "min")
`;

const weakDashboard = `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Fernhill Wait Time Dashboard</title>
<style>
body{font-family:"Segoe UI",system-ui,sans-serif;background:#0f172a;color:#e2e8f0;margin:0;padding:28px}
h1{margin:0;font-size:24px}.sub{color:#94a3b8;margin:6px 0 20px}
.tiles{display:flex;gap:14px;margin-bottom:20px}.tile{flex:1;background:#1e293b;border-radius:12px;padding:14px}
.tile b{font-size:26px;display:block}.tile span{color:#94a3b8;font-size:12px}
.card{background:#1e293b;border-radius:12px;padding:16px;margin-bottom:16px}h2{font-size:15px;margin:0 0 8px}
svg text{fill:#e2e8f0;font-size:12px}svg text.l{fill:#94a3b8}.story{line-height:1.5}
</style></head>
<body>
<h1>Clinic Wait Time Dashboard</h1>
<p class="sub">Fernhill Health · 4 clinics · 80 visits · Aug 24 – Sep 4, 2026</p>
<div class="tiles">
<div class="tile"><b>42.3 min</b><span>average wait</span></div>
<div class="tile"><b>45.0 min</b><span>longest clinic (Midway)</span></div>
<div class="tile"><b>Monday</b><span>slowest day (45.2 min)</span></div>
<div class="tile"><b>9 AM</b><span>peak hour (47.5 min)</span></div>
</div>
<div class="card story"><h2>What this shows</h2>Patients wait about 42 minutes on average. Mornings are the pinch point: the 8 and 9 AM hours are the slowest of the day, and Monday is the slowest weekday. Midway and Bloomington have the longest waits; Eau Claire is 7 to 10 minutes faster than everyone else. Staffing the morning front desk, especially on Mondays, is the clearest lever.</div>
<div class="card"><h2>Average wait by clinic (min)</h2>
<svg viewBox="0 0 600 200" width="100%">
<rect x="30" y="35" width="130" height="135" rx="4" fill="url(#g)"/><text x="95" y="30" text-anchor="middle">45.0</text><text x="95" y="186" text-anchor="middle" class="l">Midway</text>
<rect x="170" y="36" width="130" height="134" rx="4" fill="url(#g)"/><text x="235" y="32" text-anchor="middle">44.5</text><text x="235" y="186" text-anchor="middle" class="l">Bloomington</text>
<rect x="310" y="43" width="130" height="127" rx="4" fill="url(#g)"/><text x="375" y="38" text-anchor="middle">42.4</text><text x="375" y="186" text-anchor="middle" class="l">Northeast</text>
<rect x="450" y="64" width="130" height="106" rx="4" fill="url(#g)"/><text x="515" y="59" text-anchor="middle">35.4</text><text x="515" y="186" text-anchor="middle" class="l">Eau Claire</text>
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7c3aed"/><stop offset="1" stop-color="#22d3ee"/></linearGradient></defs></svg></div>
<div class="card"><h2>Average wait by weekday (min)</h2>
<svg viewBox="0 0 600 200" width="100%">
<rect x="30" y="34" width="102" height="136" rx="4" fill="url(#g)"/><text x="81" y="29" text-anchor="middle">45.2</text><text x="81" y="186" text-anchor="middle" class="l">Monday</text>
<rect x="142" y="42" width="102" height="128" rx="4" fill="url(#g)"/><text x="193" y="38" text-anchor="middle">42.5</text><text x="193" y="186" text-anchor="middle" class="l">Tuesday</text>
<rect x="254" y="54" width="102" height="116" rx="4" fill="url(#g)"/><text x="305" y="49" text-anchor="middle">38.7</text><text x="305" y="186" text-anchor="middle" class="l">Wednesday</text>
<rect x="366" y="46" width="102" height="124" rx="4" fill="url(#g)"/><text x="417" y="41" text-anchor="middle">41.2</text><text x="417" y="186" text-anchor="middle" class="l">Thursday</text>
<rect x="478" y="45" width="102" height="125" rx="4" fill="url(#g)"/><text x="529" y="40" text-anchor="middle">41.6</text><text x="529" y="186" text-anchor="middle" class="l">Friday</text>
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7c3aed"/><stop offset="1" stop-color="#22d3ee"/></linearGradient></defs></svg></div>
<div class="card"><h2>Average wait by check-in hour (min)</h2>
<svg viewBox="0 0 600 200" width="100%">
<rect x="30" y="35" width="52" height="135" rx="4" fill="url(#g)"/><text x="56" y="30" text-anchor="middle">45.1</text><text x="56" y="186" text-anchor="middle" class="l">8</text>
<rect x="92" y="28" width="52" height="142" rx="4" fill="url(#g)"/><text x="118" y="22" text-anchor="middle">47.5</text><text x="118" y="186" text-anchor="middle" class="l">9</text>
<rect x="154" y="60" width="52" height="110" rx="4" fill="url(#g)"/><text x="180" y="55" text-anchor="middle">36.8</text><text x="180" y="186" text-anchor="middle" class="l">10</text>
<rect x="216" y="41" width="52" height="129" rx="4" fill="url(#g)"/><text x="242" y="36" text-anchor="middle">43.0</text><text x="242" y="186" text-anchor="middle" class="l">11</text>
<rect x="278" y="46" width="52" height="124" rx="4" fill="url(#g)"/><text x="304" y="41" text-anchor="middle">41.3</text><text x="304" y="186" text-anchor="middle" class="l">12</text>
<rect x="340" y="51" width="52" height="119" rx="4" fill="url(#g)"/><text x="366" y="46" text-anchor="middle">39.6</text><text x="366" y="186" text-anchor="middle" class="l">13</text>
<rect x="402" y="41" width="52" height="129" rx="4" fill="url(#g)"/><text x="428" y="36" text-anchor="middle">43.0</text><text x="428" y="186" text-anchor="middle" class="l">14</text>
<rect x="464" y="44" width="52" height="126" rx="4" fill="url(#g)"/><text x="490" y="39" text-anchor="middle">42.0</text><text x="490" y="186" text-anchor="middle" class="l">15</text>
<rect x="526" y="54" width="52" height="116" rx="4" fill="url(#g)"/><text x="552" y="49" text-anchor="middle">38.6</text><text x="552" y="186" text-anchor="middle" class="l">16</text>
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7c3aed"/><stop offset="1" stop-color="#22d3ee"/></linearGradient></defs></svg></div>
</body>
</html>
`;

const weakSummary = `dimension,value,avg_wait_min
clinic,Bloomington,44.5
clinic,Eau Claire,35.4
clinic,Midway,45.0
clinic,Northeast,42.4
weekday,Friday,41.6
weekday,Monday,45.2
weekday,Thursday,41.2
weekday,Tuesday,42.5
weekday,Wednesday,38.7
hour,8,45.1
hour,9,47.5
hour,10,36.8
hour,11,43.0
hour,12,41.3
hour,13,39.6
hour,14,43.0
hour,15,42.0
hour,16,38.6
`;

const mod: ChallengeModule = {
  challenge: {
    id: 'past_wait_dashboard',
    kind: 'live',
    companyId: 'co_fernhill',
    title: 'Build a clinic wait-time dashboard',
    summary: 'Turn two weeks of check-in timestamps from 4 clinics into a one-page wait-time dashboard managers can act on before their huddle.',
    type: 'data',
    skills: ['SQL', 'Python', 'Data visualization', 'Dashboard design', 'Healthcare operations'],
    classroomConcepts: [
      { concept: 'Medians, percentiles and skewed distributions', course: 'Intro to Statistics' },
      { concept: 'Timestamp arithmetic and GROUP BY aggregation', course: 'Database Systems' },
      { concept: 'Choosing chart types and encodings for comparison', course: 'Data Visualization' },
    ],
    difficulty: 'intermediate',
    estHours: 4,
    brief,
    deliverables: [
      'A static one-page dashboard (HTML, notebook export or BI export)',
      'A prep script or SQL that produces every number on the page',
      'A short written callout of what managers should act on',
      'A README covering the metric, missing data and how to rerun',
    ],
    rubric: [
      {
        id: 'accuracy',
        name: 'Metric accuracy',
        description: 'Wait time follows the official definition, summaries include the median and p90, and visits with missing timestamps are handled exactly as the definitions require.',
        weight: 30,
      },
      {
        id: 'insight',
        name: 'Insight',
        description: 'Points managers to the specific clinic, day and hour where long waits concentrate, in a sentence or two they can act on.',
        weight: 25,
      },
      {
        id: 'visual_clarity',
        name: 'Visual clarity',
        description: 'One page where each chart answers one question from the request, with units and targets labeled and nothing misleading.',
        weight: 20,
      },
      {
        id: 'reproducibility',
        name: 'Reproducibility',
        description: "Prep is scripted end to end, so next month's extract reruns with one command and no hand edits.",
        weight: 10,
      },
      {
        id: 'communication',
        name: 'Communication',
        description: 'A short, plain-language README that states the metric, the main finding and the caveats a clinic manager needs to know.',
        weight: 15,
      },
    ],
    reward: { mode: 'top3', amounts: [200, 120, 75] },
    applicantCap: 30,
    status: 'awarded',
    hiringFor: 'Data Analyst I · Full-time · Minneapolis, MN (hybrid)',
    starterFiles: [
      { path: 'README.md', content: starterReadme },
      { path: 'request.md', content: requestEmail },
      { path: 'metric_definitions.md', content: metricDefinitions },
      { path: 'data/visits.csv', content: visitsCsv },
    ],
    aiHints: {
      testing:
        'Whether you compute the metric the business actually uses, and whether you notice when a few bad hours hide behind a normal-looking average. It also tests how you handle rows that cannot be measured, which is where most real dashboards quietly go wrong.',
      steps: [
        'Read metric_definitions.md and write down exactly which two timestamps define wait time.',
        'Parse the times, compute wait in minutes, and decide what happens to rows with a blank roomed_at before you aggregate anything.',
        'Summarize by clinic, weekday and check-in hour with the median and p90, plus a count of visits behind each number.',
        'Look for where the long waits (over 30 minutes) concentrate, and check whether the pattern repeats across both weeks.',
        'Lay out one page: headline numbers, a written callout, one chart per question in the request, and a note on excluded visits.',
        'Rerun your prep from a clean folder to make sure it works without hand edits.',
      ],
      greatLooksLike:
        'A great submission uses check-in to roomed, reports the median and p90 by clinic, and calls out in plain words the clinic, day and hour where long waits pile up. It counts the visits it could not time (including patients who left without being seen) instead of dropping or zero-filling them, and a single command rebuilds every number on the page.',
      pitfalls: [
        'Using check-in to check-out, which is cycle time and roughly triples the wait.',
        'Filling blank roomed_at values with zero, or silently dropping them.',
        'Reporting only averages, which can hide a cluster of very long waits.',
        'Charts that show a pattern without a sentence telling managers what it means.',
        'Doing the prep by hand in a spreadsheet so next month has to be rebuilt from scratch.',
      ],
    },
    deadlineInDays: -35,
    createdDaysAgo: 49,
    seed: { participants: 28, submissions: 18, scored: 18 },
  },
  templates: [
    {
      quality: 'strong',
      notes: `### What I built
A pandas prep script (\`prep.py\`) that computes wait time as check-in → roomed, summarizes it by clinic, weekday and hour, and writes the tables to \`out/\`. On top of that, a static \`dashboard.html\` with inline SVG: four headline tiles, a callout box, median/p90 bars by clinic, a clinic × weekday heatmap and p90 by check-in hour.

### Key decisions & trade-offs
- **Median and p90 instead of the mean.** Midway's median (14 min) meets target, but its p90 (43 min) doesn't, and that's the story.
- **Missing roomed_at handled per the definitions.** The 2 left-without-being-seen visits are their own metric, and the 2 completed visits without a rooming time are excluded and counted. Nothing is zero-filled.
- **Checked that the pattern repeats.** Midway's Monday 8–10 AM window is bad on both Mondays, so I was comfortable leading with it despite the small sample.
- I hand-copied the numbers into the SVG to save time instead of templating the HTML from Python.

### What I'd do with more time
Generate \`dashboard.html\` directly from \`prep.py\`, and run it on the full table to confirm the Midway pattern before anyone changes staffing.`,
      files: [
        { path: 'README.md', content: strongReadme },
        { path: 'prep.py', content: strongPrep },
        { path: 'dashboard.html', content: strongDashboard },
        { path: 'out/by_clinic.csv', content: strongByClinic },
        { path: 'out/by_clinic_weekday.csv', content: strongByClinicWeekday },
      ],
      feedback:
        'Correct metric, median and p90 by clinic, and a clear callout that the Midway Monday 8–10 AM window accounts for 8 of the 11 long waits. Treating the two left-without-being-seen visits as their own metric instead of dropping them is exactly how we want this done. One improvement: generate the dashboard from prep.py so next month is a single command.',
      aiDisclosure:
        'Used an AI assistant to check my pandas quantile and groupby syntax and to suggest a heatmap color scale. The metric choices, analysis and write-up are mine.',
    },
    {
      quality: 'solid',
      notes: `**What I built**
A SQLite script (\`prep.sql\`) that imports the extract, computes wait time from check-in to roomed and writes average waits by clinic, weekday, hour and clinic × weekday to CSV. \`dashboard.html\` shows three bar charts built from those CSVs.

**Key decisions & trade-offs**
- I followed \`metric_definitions.md\` and used check-in → roomed, not check-out, because check-out includes the visit itself.
- The 4 visits with no \`roomed_at\` can't have a wait time, so I excluded them and said so in the README instead of counting them as 0.
- I went with averages because they're the easiest for managers to compare across clinics. I know medians are more robust, and I mention that as a limitation.
- SQL keeps the prep to one command, and SQLite comes preinstalled on most machines.

**What I'd do with more time**
Add medians and percentiles (SQLite needs a window-function workaround for those), add a clinic × weekday chart, and generate the HTML from the query output instead of copying values.`,
      files: [
        { path: 'README.md', content: solidReadme },
        { path: 'prep.sql', content: solidPrep },
        { path: 'dashboard.html', content: solidDashboard },
        { path: 'out_avg_by_clinic.csv', content: solidByClinic },
      ],
      feedback:
        "Correct metric and a clean, rerunnable SQL prep, and you excluded the rows with no rooming time instead of zero-filling them. Your charts show that Midway is the slowest clinic and that Monday is the slowest day, but the page never connects the two: nearly all of Midway's long waits come from Monday 8–10 AM. Reporting only averages also softens the problem, since Midway's p90 is 43 minutes against a 30-minute target.",
      aiDisclosure: 'Asked an AI assistant how to compute minutes between two times in SQLite (julianday). Everything else is my own work.',
    },
    {
      quality: 'weak',
      notes: `**What I built**
A polished, dark-themed one-page dashboard with four headline tiles, a plain-language "What this shows" box and three bar charts (by clinic, weekday and hour), plus a short \`prep.py\` that produces the numbers.

**Key decisions & trade-offs**
- I measured wait as check-in to check-out because that captures the patient's whole experience in the building, which felt more meaningful than one segment of it.
- I set the four visits with missing timestamps to 0 so that every visit is counted and the totals match the extract.
- I prioritized design: every bar is labeled with its value, and the story box answers Renee's questions in plain words so managers don't have to interpret the charts.
- I started in a spreadsheet pivot table and then rewrote the steps as a script.

**What I'd do with more time**
Add a clinic × weekday view, make the charts interactive, and set up an automatic monthly refresh.`,
      files: [
        { path: 'README.md', content: weakReadme },
        { path: 'prep.py', content: weakPrep },
        { path: 'dashboard.html', content: weakDashboard },
        { path: 'summary.csv', content: weakSummary },
      ],
      feedback:
        'A beautiful page with a clear story, but wait is computed from check-in to check-out, which our definitions call cycle time. That overstates waits about 3× (42.3 vs. 14.9 minutes on average). Zero-filling the four missing rows also hides the two patients who left without being seen. With the check-in → roomed metric, your morning and Monday story would have pointed straight at Midway.',
    },
  ],
  scripted: [
    {
      challengeId: 'past_wait_dashboard',
      studentId: 'stu_diego',
      scores: { accuracy: 5, insight: 5, visual_clarity: 4, reproducibility: 4, communication: 5 },
      feedback:
        "This is the dashboard Renee asked for. Correct metric, median and p90 side by side, and a callout that pins 8 of the 11 long waits on Midway's Monday 8–10 AM window, including the two patients who left without being seen. The README is the clearest we received; managers will understand it in a minute. Two small things: the heatmap cells are cramped, and the dashboard values were copied in by hand, so next month's refresh isn't quite one command yet.",
      templateIndex: 0,
      submittedDaysAgo: 37,
    },
    {
      challengeId: 'past_wait_dashboard',
      studentId: 'stu_kwame',
      scores: { accuracy: 5, insight: 4, visual_clarity: 5, reproducibility: 4, communication: 4 },
      feedback:
        "Accurate throughout, and the cleanest visuals in the field: putting median and p90 on the same bar made Midway's problem obvious at a glance. The callout names the Midway Monday-morning window but stops short of telling managers what to check first (MA staffing, post-weekend overbooking). The README is thorough but long for a manager audience, and the SVG values are hand-copied from prep.py, so a refresh still takes manual edits.",
      templateIndex: 0,
      submittedDaysAgo: 38,
    },
    {
      challengeId: 'past_wait_dashboard',
      studentId: 'stu_maya',
      scores: { accuracy: 5, insight: 4, visual_clarity: 4, reproducibility: 4, communication: 4 },
      feedback:
        "Really solid work, Maya: you used the official check-in → roomed metric, excluded the four rows with no rooming time instead of zero-filling them, and your prep.sql reruns cleanly with one command. The story was already in your output: Midway is the slowest clinic and Monday the slowest day, and Midway's Monday average (29.4 min) comes almost entirely from the 8–10 AM window. Say that in one sentence and add a p90 (Midway's is 43 minutes against a 30-minute target), and this goes from good to great. A target line and a clinic × day view would also help managers scan it quickly.",
      templateIndex: 1,
      submittedDaysAgo: 36,
    },
    {
      challengeId: 'past_wait_dashboard',
      studentId: 'stu_malik',
      scores: { accuracy: 2, insight: 4, visual_clarity: 5, reproducibility: 4, communication: 5 },
      feedback:
        "The most polished dashboard we received, with a story box that is exactly the plain-language summary Renee wanted, and your prep is scripted. The problem is the metric: you measured check-in to check-out, which metric_definitions.md calls cycle time, so every wait is overstated about 3× (a 42.3-minute average vs. 14.9 on the official definition). Zero-filling the missing rows also hid the two patients who left without being seen. Rerun the same pipeline with check-in → roomed and medians, and your morning and Monday story would point straight at Midway.",
      templateIndex: 2,
      submittedDaysAgo: 40,
    },
  ],
};

export default mod;
