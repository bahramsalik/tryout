import type { ChallengeModule } from '../lib.ts';

const brief = `## Context

Every Monday, our Revenue Cycle team checks that each visit at the Northeast (Minneapolis) and Midway (St. Paul) clinics produced exactly one claim. A visit with no claim is revenue we never collect, about $200 per visit on average. A claim with no visit is a compliance problem.

For the week of July 20, 2026, the two systems disagree: the scheduling export has 50 rows and the billing export has 48. Finance needs the gap explained before the books close for July. The catch is that the two exports were never designed to be joined. They format IDs, names, dates and times differently, and each one contains rows that aren't quite what they look like.

## The task

1. Clean both exports and match each visit across them.
2. Report how many visits actually happened, and how many appear in both systems, only in scheduling and only in billing.
3. Give a specific reason for every row that doesn't match, and for every row you exclude.
4. Write down each cleaning rule you applied so a teammate could apply it to next week's files.

## Constraints

- Time box: about 3 hours.
- Use any language or tool. A script that runs from the raw files is strongly preferred over manual spreadsheet edits; if you do clean anything by hand, document every step.
- Don't change the raw exports. Write cleaned data to new files.
- AI assistants are allowed; tell us how you used them.
- Out of scope: fuzzy-matching libraries and probabilistic record linkage. Every match in this data can be explained with exact rules.
- All patients, names and MRNs are fictional.

## What we provide

- \`data/scheduling_export.csv\`: 50 appointment rows from the scheduling system.
- \`data/billing_export.csv\`: 48 claim rows from the billing system.
- \`README.md\`: Finance's question, column descriptions for both files, and what we already know about each system.
`;

const schedulingCsv = `appt_id,mrn,patient_name,appt_date,appt_time,clinic,provider,visit_type,status
A310458,00718961,"Ibarra, Mireille",07/20/2026,8:30 AM,Midway,Dr. T. Iverson,Annual physical,Completed
A310476,00864602,"Okafor, Daniel",07/20/2026,9:15 AM,Northeast,Dr. S. Moreau,Annual physical,Completed
A310492,00398174,"Dunmore, Quentin",07/20/2026,11:15 AM,Midway,Dr. T. Iverson,"Office visit, established",Completed
A310504,00452162,"Marchetti, Gideon",07/20/2026,11:45 AM,Northeast,Dr. A. Lindahl,"Office visit, established",Completed
A310511,00988026,"Nyberg, Greta",07/20/2026,11:45 AM,Northeast,"J. Kerr, NP",Annual physical,Completed
A310518,00235225,"Wennberg, Cyrus",07/20/2026,12:15 PM,Midway,"L. Duarte, PA","Office visit, new",Completed
A310525,00404596,"Lindqvist, Maria",07/20/2026,12:45 PM,Northeast,Dr. S. Moreau,"Office visit, established",Completed
A310541,00647440,"Ashby, Corinne",07/20/2026,1:00 PM,Northeast,Dr. A. Lindahl,Annual physical,No Show
A310548,00396273,"Sorensen, Ingrid",07/20/2026,3:00 PM,Midway,"L. Duarte, PA","Office visit, new",Completed
A310556,00981269,"Achterberg, Della",07/21/2026,9:30 AM,Northeast,Dr. A. Lindahl,"Office visit, established",Completed
A310575,00760685,"Rasmussen, Odette",07/21/2026,10:30 AM,Northeast,Dr. S. Moreau,"Office visit, new",Completed
A310587,00675615,"Halvorsen, Abel",07/21/2026,10:45 AM,Northeast,Dr. S. Moreau,"Office visit, established",Completed
A310602,00544941,"Quist, Hollis",07/21/2026,11:15 AM,Midway,Dr. T. Iverson,Annual physical,Completed
A310606,00936903,"Engstrom, Calvin",07/21/2026,11:15 AM,Midway,"L. Duarte, PA","Office visit, new",Completed
A310620,00659188,"Eriksen, Hazel",07/21/2026,11:15 AM,Northeast,Dr. S. Moreau,"Office visit, established",Completed
A310631,00527025,"Whitcombe, Sunniva",07/21/2026,12:30 PM,Midway,Dr. R. Banerjee,"Office visit, established",Completed
A310645,00852284,"Ferreira, Theo",07/21/2026,12:45 PM,Northeast,Dr. S. Moreau,"Office visit, established",Completed
A310654,00330660,"Aldana, Paloma",07/21/2026,2:15 PM,Northeast,"J. Kerr, NP",Annual physical,Completed
A310659,00460490,"Strand, Hedda",07/21/2026,2:30 PM,Midway,"L. Duarte, PA","Office visit, new",Completed
A310663,00218124,"Holloway, Yara",07/21/2026,3:15 PM,Northeast,"J. Kerr, NP",Annual physical,Completed
A310670,00146012,"Haugen, Priscilla",07/21/2026,4:30 PM,Midway,"L. Duarte, PA","Office visit, new",Completed
A310680,00944489,"Valdez, Rosa",07/21/2026,7:15 PM,Midway,"L. Duarte, PA","Office visit, established",Completed
A310688,00606801,"Feld, Bram",07/22/2026,9:45 AM,Midway,Dr. R. Banerjee,Annual physical,No Show
A310702,00891254,"Brandt, Owen",07/22/2026,10:45 AM,Midway,Dr. R. Banerjee,"Office visit, established",Completed
A310710,00216836,"Nakashima, Lena",07/22/2026,11:30 AM,Northeast,Dr. A. Lindahl,"Office visit, established",Completed
A310729,00573415,"Mbeki, Silas",07/22/2026,1:15 PM,Midway,"L. Duarte, PA","Office visit, established",Completed
A310736,00169145,"Hjelm, Jasper",07/22/2026,3:15 PM,Northeast,Dr. S. Moreau,"Office visit, new",Completed
A310752,00708730,"Pruitt, Felix",07/23/2026,9:15 AM,Northeast,Dr. A. Lindahl,"Office visit, established",Completed
A310770,00566339,"Tanaka, Margit",07/23/2026,10:00 AM,Northeast,Dr. A. Lindahl,"Office visit, established",Completed
A310780,00146012,"Haugen, Priscilla",07/23/2026,10:30 AM,Midway,Dr. R. Banerjee,"Office visit, established",Completed
A310798,00803215,"Ruud, Beatrix",07/22/2026,2:00 PM,Midway,Dr. T. Iverson,"Office visit, established",Rescheduled
A310807,00803215,"Ruud, Beatrix",07/23/2026,11:00 AM,Midway,Dr. T. Iverson,"Office visit, established",Completed
A310825,00445106,"Maddox, Desmond",07/23/2026,1:30 PM,Northeast,Dr. S. Moreau,"Office visit, new",Completed
A310842,00312253,"Abernathy, Samir",07/23/2026,3:00 PM,Midway,"L. Duarte, PA","Office visit, new",Completed
A310855,00119052,"Galloway, Lucia",07/23/2026,3:15 PM,Northeast,Dr. A. Lindahl,"Office visit, established",Completed
A310869,00132978,"Crowder, Vivian",07/23/2026,3:30 PM,Midway,Dr. T. Iverson,"Office visit, new",Completed
A310872,00623041,"Salcedo, Imogen",07/23/2026,4:00 PM,Midway,Dr. T. Iverson,"Office visit, established",Completed
A310886,00378398,"Thorsen, Rafael",07/23/2026,4:30 PM,Midway,"L. Duarte, PA",Annual physical,Completed
A310889,00484424,"Vance, Tobias",07/23/2026,7:30 PM,Midway,"L. Duarte, PA","Office visit, established",Completed
A310902,00542010,"Fairbanks, Wendell",07/23/2026,7:45 PM,Midway,"L. Duarte, PA","Office visit, established",Completed
A310917,00722215,"Castellanos, Emmett",07/24/2026,8:00 AM,Midway,"L. Duarte, PA","Office visit, new",Completed
A310928,00805345,"Delacroix, Marcus",07/24/2026,12:15 PM,Midway,Dr. T. Iverson,"Office visit, established",Completed
A310939,00306780,"Pellegrini, Noor",07/24/2026,12:30 PM,Northeast,Dr. A. Lindahl,Annual physical,Completed
A310950,00518632,"Kowalczyk, Annika",07/24/2026,1:00 PM,Midway,Dr. R. Banerjee,"Office visit, new",Completed
A310953,00598696,"Ostrowski, Ezra",07/24/2026,1:30 PM,Midway,"L. Duarte, PA","Office visit, established",Completed
A310966,00964304,"Whitfield, Katherine",07/24/2026,3:00 PM,Northeast,"J. Kerr, NP",Annual physical,Completed
A310982,00711670,"Vollmer, Leopold",07/24/2026,3:30 PM,Northeast,Dr. S. Moreau,"Office visit, established",Completed
A310993,00445768,"Lindgren, Juniper",07/24/2026,4:00 PM,Northeast,Dr. S. Moreau,Annual physical,Completed
A311012,00319366,"Corbett, Ronan",07/24/2026,4:00 PM,Midway,"L. Duarte, PA","Office visit, new",Completed
A311020,00561581,"Arroyo, Mateo",07/24/2026,4:15 PM,Midway,"L. Duarte, PA",Annual physical,Completed
`;

const billingCsv = `claim_id,patient_mrn,patient_name,service_datetime_utc,place_of_service,rendering_provider,cpt_code,charge_amount
C880205,00718961, Mireille Ibarra,2026-07-20T13:30:00Z,MIDWAY,Dr. T. Iverson,99396,285.00
C880208,864602,Daniel Okafor,2026-07-20T14:15:00Z,NORTHEAST,Dr. S. Moreau,99396,285.00
C880209,398174,Quentin Dunmore,2026-07-20T16:15:00Z,MIDWAY,Dr. T. Iverson,99214,240.00
C880212,452162, GIDEON MARCHETTI  ,2026-07-20T16:45:00Z,NORTHEAST,Dr. A. Lindahl,99214,240.00
C880217,988026,Greta Nyberg  ,2026-07-20T16:45:00Z,NORTHEAST,"J. Kerr, NP",99396,285.00
C880221,235225, CYRUS WENNBERG  ,2026-07-20T17:15:00Z,MIDWAY,"L. Duarte, PA",99203,210.00
C880227,404596,Maria Lindqvist,2026-07-20T17:45:00Z,NORTHEAST,Dr. S. Moreau,99213,165.00
C880232,00396273,Ingrid Sorensen,2026-07-20T20:00:00Z,MIDWAY,"L. Duarte, PA",99203,210.00
C880233,981269, DELLA ACHTERBERG,2026-07-21T14:30:00Z,NORTHEAST,Dr. A. Lindahl,99214,240.00
C880236,00760685,ODETTE RASMUSSEN,2026-07-21T15:30:00Z,NORTHEAST,Dr. S. Moreau,99203,210.00
C880243,00675615,abel halvorsen,2026-07-21T15:45:00Z,NORTHEAST,Dr. S. Moreau,99213,165.00
C880250,306646,Ilse Brekke,2026-07-21T16:10:00Z,NORTHEAST,"K. Olafsen, RN",90471,45.00
C880254,544941, Hollis Quist,2026-07-21T16:15:00Z,MIDWAY,Dr. T. Iverson,99396,285.00
C880260,936903, Calvin Engstrom,2026-07-21T16:15:00Z,MIDWAY,"L. Duarte, PA",99203,210.00
C880261,659188,Hazel Eriksen,2026-07-21T16:15:00Z,NORTHEAST,Dr. S. Moreau,99213,165.00
C880264,527025, sunniva whitcombe,2026-07-21T17:30:00Z,MIDWAY,Dr. R. Banerjee,99214,240.00
C880267,852284,Theo Ferreira,2026-07-21T17:45:00Z,NORTHEAST,Dr. S. Moreau,99213,165.00
C880274,330660,Paloma Aldana,2026-07-21T19:15:00Z,NORTHEAST,"J. Kerr, NP",99396,285.00
C880281,460490,Hedda Strand  ,2026-07-21T19:30:00Z,MIDWAY,"L. Duarte, PA",99203,210.00
C880287,218124,Yara Holloway,2026-07-21T20:15:00Z,NORTHEAST,"J. Kerr, NP",99396,285.00
C880289,146012,Priscilla Haugen  ,2026-07-21T21:30:00Z,MIDWAY,"L. Duarte, PA",99203,210.00
C880292,00944489, rosa valdez  ,2026-07-22T00:15:00Z,MIDWAY,"L. Duarte, PA",99214,240.00
C880297,891254,Owen Brandt,2026-07-22T15:45:00Z,MIDWAY,Dr. R. Banerjee,99213,165.00
C880297,891254,Owen Brandt,2026-07-22T15:45:00Z,MIDWAY,Dr. R. Banerjee,99213,165.00
C880305,00216836,LENA NAKASHIMA  ,2026-07-22T16:30:00Z,NORTHEAST,Dr. A. Lindahl,99213,165.00
C880314,573415,Silas Mbeki  ,2026-07-22T18:15:00Z,MIDWAY,"L. Duarte, PA",99213,165.00
C880321,00169145,JASPER HJELM,2026-07-22T20:15:00Z,NORTHEAST,Dr. S. Moreau,99203,210.00
C880323,708730,Felix Pruitt,2026-07-23T14:15:00Z,NORTHEAST,Dr. A. Lindahl,99213,165.00
C880324,566339, Margit Tanaka,2026-07-23T15:00:00Z,NORTHEAST,Dr. A. Lindahl,99213,165.00
C880328,146012,priscilla haugen  ,2026-07-23T15:30:00Z,MIDWAY,Dr. R. Banerjee,99214,240.00
C880337,803215,BEATRIX RUUD,2026-07-23T16:00:00Z,MIDWAY,Dr. T. Iverson,99214,240.00
C880341,00445106, Desmond Maddox,2026-07-23T18:30:00Z,NORTHEAST,Dr. S. Moreau,99203,210.00
C880344,00312253, Samir Abernathy,2026-07-23T20:00:00Z,MIDWAY,"L. Duarte, PA",99203,210.00
C880353,119052,Lucia Galloway,2026-07-23T20:15:00Z,NORTHEAST,Dr. A. Lindahl,99213,165.00
C880356,132978,Vivian Crowder,2026-07-23T20:30:00Z,MIDWAY,Dr. T. Iverson,99203,210.00
C880359,623041,Imogen Salcedo  ,2026-07-23T21:00:00Z,MIDWAY,Dr. T. Iverson,99213,165.00
C880368,00378398,Rafael Thorsen  ,2026-07-23T21:30:00Z,MIDWAY,"L. Duarte, PA",99396,285.00
C880372,484424,TOBIAS VANCE,2026-07-24T00:30:00Z,MIDWAY,"L. Duarte, PA",99214,240.00
C880378,542010, wendell fairbanks,2026-07-24T00:45:00Z,MIDWAY,"L. Duarte, PA",99213,165.00
C880380,722215,EMMETT CASTELLANOS,2026-07-24T13:00:00Z,MIDWAY,"L. Duarte, PA",99203,210.00
C880384,805345,marcus delacroix  ,2026-07-24T17:15:00Z,MIDWAY,Dr. T. Iverson,99214,240.00
C880388,306780, Noor Pellegrini,2026-07-24T17:30:00Z,NORTHEAST,Dr. A. Lindahl,99396,285.00
C880389,518632,ANNIKA KOWALCZYK,2026-07-24T18:00:00Z,MIDWAY,Dr. R. Banerjee,99203,210.00
C880395,598696,Ezra Ostrowski,2026-07-24T18:30:00Z,MIDWAY,"L. Duarte, PA",99213,165.00
C880403,942600,Tomasz Wren  ,2026-07-24T19:40:00Z,NORTHEAST,"K. Olafsen, RN",90471,45.00
C880412,964304,Kate Whitfield,2026-07-24T20:00:00Z,NORTHEAST,"J. Kerr, NP",99396,285.00
C880421,00445768,JUNIPER LINDGREN,2026-07-24T21:00:00Z,NORTHEAST,Dr. S. Moreau,99396,285.00
C880425,00319366,Ronan Corbett,2026-07-24T21:00:00Z,MIDWAY,"L. Duarte, PA",99203,210.00
`;

const starterReadme = `# Reconcile two clinic-visit exports (practice task)

Sponsored by Fernhill Health's Revenue Cycle team.

## The question

Every Monday, Finance checks that each visit at our Northeast (Minneapolis) and Midway (St. Paul) clinics turned into exactly one claim. For the week of **Monday, July 20 to Friday, July 24, 2026**, the two systems disagree:

- The **scheduling** export has **50** appointment rows.
- The **billing** export has **48** claim rows.

Finance wants to know:

1. How many visits actually happened that week?
2. How many visits appear in **both** systems, **only in scheduling**, and **only in billing**?
3. For **every** row that doesn't match, why not? (A missing claim is lost revenue; an extra claim might be a billing error.)

## The files

~~~
data/scheduling_export.csv   pulled Sat, July 25 at 06:00 from the scheduling system
data/billing_export.csv      pulled Mon, July 27 at 06:00 from the billing system
~~~

**scheduling_export.csv**: \`appt_id\`, \`mrn\`, \`patient_name\` ("Last, First"), \`appt_date\` (MM/DD/YYYY), \`appt_time\` (12-hour, clinic local time), \`clinic\`, \`provider\`, \`visit_type\`, \`status\` (\`Completed\`, \`No Show\`, \`Rescheduled\`).

**billing_export.csv**: \`claim_id\`, \`patient_mrn\`, \`patient_name\` ("First Last", typed by hand), \`service_datetime_utc\` (ISO 8601), \`place_of_service\`, \`rendering_provider\`, \`cpt_code\`, \`charge_amount\`.

## Things we already know

- Both clinics are on Central time. Midway has evening hours on Tuesdays and Thursdays until 8 PM.
- The MRN (medical record number) is the same patient ID in both systems, but the two systems don't format it the same way.
- Patient names are entered by hand at the front desk and in billing, so don't trust them to match exactly.
- Nurse-only walk-in visits are not booked in the scheduling system.

## What to hand in

- Your matching code (Python, R, SQL, anything) that runs from these two raw files.
- A reconciliation table with one row per visit or excluded row, and a result for each.
- A README with the counts, a reason for every unmatched row and your cleaning rules.

All names and MRNs in these files are fictional.
`;

/* ── Strong template ── */

const strongReadme = `# Visit reconciliation: week of July 20, 2026

## Answer

**49 visits happened:** 45 in both systems, 2 only in scheduling, 2 only in billing. The raw counts (50 vs. 48) differ because 3 scheduling rows aren't visits and 1 billing row is a duplicate.

| | Scheduling rows | Billing rows |
|---|---|---|
| Raw export | 50 | 48 |
| Not a visit: No Show | −2 | |
| Not a visit: original slot of a rescheduled appt | −1 | |
| Exact duplicate claim row (C880297) | | −1 |
| **Distinct visits** | **47** | **47** |
| Matched | 45 | 45 |
| Unmatched | 2 | 2 |

## Every unmatched or excluded row

| Row | Result | Reason |
|---|---|---|
| A310982, A311020 | only in scheduling | Completed Friday 3:30 and 4:15 PM; no claim by the Monday 06:00 billing pull. Likely charge lag, but **unbilled until proven otherwise** (about $450–$525 at our usual charges). |
| C880250, C880403 | only in billing | CPT 90471, nurse RN rendering, Northeast. Nurse walk-ins aren't booked in scheduling, so no appointment is expected. |
| A310541, A310688 | excluded | No Show. |
| A310798 | excluded | Original Wednesday slot; the patient was seen Thursday under A310807, which matched C880337. |
| C880297 (2nd copy) | excluded | Byte-for-byte duplicate row. Worth checking that it wasn't submitted to the payer twice. |

## Cleaning rules

1. **MRN:** strip spaces and leading zeros; compare as integers (scheduling pads to 8 digits, billing mostly doesn't).
2. **Time zone:** billing stores UTC. July is CDT (UTC−5), so I convert before taking the date. Without this, the 3 Midway evening visits (7:15–7:45 PM) land on the next day and fail to match.
3. **Dates:** scheduling is MM/DD/YYYY with a 12-hour time.
4. **Names:** lowercased, whitespace collapsed, "Last, First" flipped. Used only as a check, never as the key: one matched visit (A310966 / C880412) has "Katherine" vs. "Kate".
5. **Scheduling status:** only \`Completed\` counts as a visit.
6. **Billing duplicates:** drop rows identical in every field.

**Match key:** MRN + local service date + clinic. One patient (MRN 146012) has two visits that week, so MRN alone isn't enough. The script asserts the key is unique on both sides.

## How to run

~~~
python reconcile.py          # standard library only; reads data/
~~~

Writes \`reconciliation.csv\` and prints the counts above.
`;

const strongScript = `"""Reconcile the scheduling and billing exports for the week of July 20, 2026.

Usage:  python reconcile.py [data_dir]      (default: data)
Writes reconciliation.csv and prints the summary. Standard library only.

Cleaning rules (see README for why):
  R1  MRN: strip, drop leading zeros, compare as an integer.
  R2  Billing time is UTC. Convert to Central (CDT, UTC-5 in July) before
      taking the date. Evening visits otherwise land on the next day.
  R3  Scheduling dates are MM/DD/YYYY with a 12-hour time.
  R4  Names are only a tiebreak/check: lowercased, whitespace collapsed,
      "Last, First" flipped to "First Last". Never the match key.
  R5  Scheduling: only status == Completed is a visit (drop No Show and
      the original slot of a Rescheduled appointment).
  R6  Billing: drop exact duplicate rows (same claim_id and every field).
  Match key: (MRN, local service date, clinic).
"""
import csv
import sys
from datetime import datetime, timedelta
from pathlib import Path

DATA = Path(sys.argv[1] if len(sys.argv) > 1 else "data")
CDT = timedelta(hours=-5)


def mrn(raw):
    return int(raw.strip().lstrip("0") or 0)  # R1


def name(raw):
    n = " ".join(raw.split()).lower()  # R4
    if "," in n:
        last, first = [p.strip() for p in n.split(",", 1)]
        n = f"{first} {last}"
    return n


def read(fname):
    with open(DATA / fname, newline="") as f:
        return list(csv.DictReader(f))


sched_raw = read("scheduling_export.csv")
bill_raw = read("billing_export.csv")

sched = {}
dropped_sched = []
for r in sched_raw:
    if r["status"].strip() != "Completed":  # R5
        dropped_sched.append((r["appt_id"], r["status"].strip()))
        continue
    when = datetime.strptime(f"{r['appt_date']} {r['appt_time']}", "%m/%d/%Y %I:%M %p")  # R3
    key = (mrn(r["mrn"]), when.date(), r["clinic"].strip().upper())
    assert key not in sched, f"two completed appointments share a key: {key}"
    sched[key] = r

bill = {}
seen_rows = set()
dropped_bill = []
for r in bill_raw:
    row_sig = tuple(r.values())
    if row_sig in seen_rows:  # R6
        dropped_bill.append((r["claim_id"], "Exact duplicate row"))
        continue
    seen_rows.add(row_sig)
    utc = datetime.strptime(r["service_datetime_utc"], "%Y-%m-%dT%H:%M:%SZ")
    local = utc + CDT  # R2
    key = (mrn(r["patient_mrn"]), local.date(), r["place_of_service"].strip().upper())
    assert key not in bill, f"two claims share a key: {key}"
    bill[key] = (r, local)

out = []
for key in sorted(set(sched) | set(bill), key=lambda k: (k[1], k[2], k[0])):
    s = sched.get(key)
    b, local = bill.get(key, (None, None))
    if s and b:
        result = "matched"
        note = "" if name(s["patient_name"]) == name(b["patient_name"]) else "name differs; MRN/date/clinic agree"
        if local and local.date() != datetime.strptime(b["service_datetime_utc"][:10], "%Y-%m-%d").date():
            note = (note + "; " if note else "") + "UTC date is next day"
    elif s:
        result, note = "only_in_scheduling", "Completed, no claim yet"
    else:
        result = "only_in_billing"
        note = "No appointment; CPT 90471 (nurse immunization walk-in)" if b["cpt_code"] == "90471" else "No appointment"
    out.append({
        "mrn": key[0], "service_date": key[1].isoformat(), "clinic": key[2],
        "appt_id": s["appt_id"] if s else "", "claim_id": b["claim_id"] if b else "",
        "result": result, "note": note,
    })

for appt_id, status in dropped_sched:
    out.append({"mrn": "", "service_date": "", "clinic": "", "appt_id": appt_id,
                "claim_id": "", "result": "excluded_scheduling", "note": status})
for claim_id, why in dropped_bill:
    out.append({"mrn": "", "service_date": "", "clinic": "", "appt_id": "",
                "claim_id": claim_id, "result": "excluded_billing", "note": why})

with open("reconciliation.csv", "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(out[0]), lineterminator="\\n")
    w.writeheader()
    w.writerows(out)

count = lambda res: sum(1 for o in out if o["result"] == res)
print(f"scheduling rows {len(sched_raw)}, billing rows {len(bill_raw)}")
for res in ["matched", "only_in_scheduling", "only_in_billing", "excluded_scheduling", "excluded_billing"]:
    print(f"{res:22} {count(res)}")
print("visits that happened:", count("matched") + count("only_in_scheduling") + count("only_in_billing"))
`;

const strongTable = `mrn,service_date,clinic,appt_id,claim_id,result,note
235225,2026-07-20,MIDWAY,A310518,C880221,matched,
396273,2026-07-20,MIDWAY,A310548,C880232,matched,
398174,2026-07-20,MIDWAY,A310492,C880209,matched,
718961,2026-07-20,MIDWAY,A310458,C880205,matched,
404596,2026-07-20,NORTHEAST,A310525,C880227,matched,
452162,2026-07-20,NORTHEAST,A310504,C880212,matched,
864602,2026-07-20,NORTHEAST,A310476,C880208,matched,
988026,2026-07-20,NORTHEAST,A310511,C880217,matched,
146012,2026-07-21,MIDWAY,A310670,C880289,matched,
460490,2026-07-21,MIDWAY,A310659,C880281,matched,
527025,2026-07-21,MIDWAY,A310631,C880264,matched,
544941,2026-07-21,MIDWAY,A310602,C880254,matched,
936903,2026-07-21,MIDWAY,A310606,C880260,matched,
944489,2026-07-21,MIDWAY,A310680,C880292,matched,UTC date is next day
218124,2026-07-21,NORTHEAST,A310663,C880287,matched,
306646,2026-07-21,NORTHEAST,,C880250,only_in_billing,No appointment; CPT 90471 (nurse immunization walk-in)
330660,2026-07-21,NORTHEAST,A310654,C880274,matched,
659188,2026-07-21,NORTHEAST,A310620,C880261,matched,
675615,2026-07-21,NORTHEAST,A310587,C880243,matched,
760685,2026-07-21,NORTHEAST,A310575,C880236,matched,
852284,2026-07-21,NORTHEAST,A310645,C880267,matched,
981269,2026-07-21,NORTHEAST,A310556,C880233,matched,
573415,2026-07-22,MIDWAY,A310729,C880314,matched,
891254,2026-07-22,MIDWAY,A310702,C880297,matched,
169145,2026-07-22,NORTHEAST,A310736,C880321,matched,
216836,2026-07-22,NORTHEAST,A310710,C880305,matched,
132978,2026-07-23,MIDWAY,A310869,C880356,matched,
146012,2026-07-23,MIDWAY,A310780,C880328,matched,
312253,2026-07-23,MIDWAY,A310842,C880344,matched,
378398,2026-07-23,MIDWAY,A310886,C880368,matched,
484424,2026-07-23,MIDWAY,A310889,C880372,matched,UTC date is next day
542010,2026-07-23,MIDWAY,A310902,C880378,matched,UTC date is next day
623041,2026-07-23,MIDWAY,A310872,C880359,matched,
803215,2026-07-23,MIDWAY,A310807,C880337,matched,
119052,2026-07-23,NORTHEAST,A310855,C880353,matched,
445106,2026-07-23,NORTHEAST,A310825,C880341,matched,
566339,2026-07-23,NORTHEAST,A310770,C880324,matched,
708730,2026-07-23,NORTHEAST,A310752,C880323,matched,
319366,2026-07-24,MIDWAY,A311012,C880425,matched,
518632,2026-07-24,MIDWAY,A310950,C880389,matched,
561581,2026-07-24,MIDWAY,A311020,,only_in_scheduling,"Completed, no claim yet"
598696,2026-07-24,MIDWAY,A310953,C880395,matched,
722215,2026-07-24,MIDWAY,A310917,C880380,matched,
805345,2026-07-24,MIDWAY,A310928,C880384,matched,
306780,2026-07-24,NORTHEAST,A310939,C880388,matched,
445768,2026-07-24,NORTHEAST,A310993,C880421,matched,
711670,2026-07-24,NORTHEAST,A310982,,only_in_scheduling,"Completed, no claim yet"
942600,2026-07-24,NORTHEAST,,C880403,only_in_billing,No appointment; CPT 90471 (nurse immunization walk-in)
964304,2026-07-24,NORTHEAST,A310966,C880412,matched,name differs; MRN/date/clinic agree
,,,A310541,,excluded_scheduling,No Show
,,,A310688,,excluded_scheduling,No Show
,,,A310798,,excluded_scheduling,Rescheduled
,,,,C880297,excluded_billing,Exact duplicate row
`;

/* ── Solid template ── */

const solidReadme = `# Clinic visit reconciliation (week of July 20, 2026)

## Results

| Result | Count |
|---|---|
| Matched (in both systems) | 45 |
| Only in scheduling | 2 |
| Only in billing | 2 |
| **Visits that happened** | **49** |

The raw exports don't line up (50 vs. 48 rows) because 2 scheduling rows are No Shows, 1 is the original slot of an appointment that was rescheduled to the next day, and 1 billing row is an exact duplicate.

### Unmatched rows

- **Only in scheduling:** A310982 and A311020. Both were completed late Friday afternoon and have no claim yet. Probably the charges hadn't been entered before the Monday billing pull, but someone should confirm they get billed.
- **Only in billing:** C880250 and C880403. Both are CPT 90471 (immunization) by a nurse at Northeast, so they look like walk-in nurse visits, which aren't scheduled.

## How I cleaned the data

**In a spreadsheet (by hand) before running the script:**

1. Opened \`billing_export.csv\` and added a column converting \`service_datetime_utc\` to Central time with \`=D2 - 5/24\`, then kept only the date as \`local_date\`. This fixed 3 evening visits that showed up on the wrong day.
2. Sorted by \`claim_id\` and deleted the duplicate row for C880297.
3. Used TRIM on \`patient_name\`.
4. Saved the result as \`data/billing_clean.csv\`.

**In \`match.py\`:**

5. Kept only \`Completed\` scheduling rows.
6. Converted MRNs to integers on both sides so \`00412345\` and \`412345\` match.
7. Merged on MRN + date (an outer join) and labeled each row.

## How to run

~~~
python match.py
~~~

It reads \`data/scheduling_export.csv\` and \`data/billing_clean.csv\` and writes \`summary.csv\` and \`unmatched.csv\`.

**Note:** steps 1–4 aren't in the script, so a new week's billing export has to go through the spreadsheet first. I'd move those steps into Python next.
`;

const solidScript = `# Match scheduling appointments to billing claims.
# Input: data/scheduling_export.csv (raw) and data/billing_clean.csv
# (cleaned by hand in a spreadsheet first, see README).
import pandas as pd

sched = pd.read_csv("data/scheduling_export.csv", dtype=str)
bill = pd.read_csv("data/billing_clean.csv", dtype=str)

# Only completed appointments are visits.
excluded = sched[sched["status"] != "Completed"]
sched = sched[sched["status"] == "Completed"].copy()

sched["mrn_key"] = sched["mrn"].astype(int)
bill["mrn_key"] = bill["patient_mrn"].astype(int)
sched["date_key"] = pd.to_datetime(sched["appt_date"], format="%m/%d/%Y")
bill["date_key"] = pd.to_datetime(bill["local_date"], format="%m/%d/%Y")

merged = sched.merge(
    bill, on=["mrn_key", "date_key"], how="outer", indicator=True,
    suffixes=("_sched", "_bill"),
)
merged["result"] = merged["_merge"].map({
    "both": "matched",
    "left_only": "only_in_scheduling",
    "right_only": "only_in_billing",
})

summary = merged["result"].value_counts()
print(summary)
print("Excluded from scheduling:", excluded["status"].value_counts().to_dict())

cols = ["result", "appt_id", "claim_id", "mrn_key", "date_key",
        "patient_name_sched", "patient_name_bill", "cpt_code"]
merged.loc[merged["result"] != "matched", cols].to_csv("unmatched.csv", index=False)
summary.to_csv("summary.csv")
`;

const solidBillingClean = `claim_id,patient_mrn,patient_name,local_date,place_of_service,cpt_code,charge_amount
C880205,718961,Mireille Ibarra,07/20/2026,MIDWAY,99396,285.0
C880208,864602,Daniel Okafor,07/20/2026,NORTHEAST,99396,285.0
C880209,398174,Quentin Dunmore,07/20/2026,MIDWAY,99214,240.0
C880212,452162,GIDEON MARCHETTI,07/20/2026,NORTHEAST,99214,240.0
C880217,988026,Greta Nyberg,07/20/2026,NORTHEAST,99396,285.0
C880221,235225,CYRUS WENNBERG,07/20/2026,MIDWAY,99203,210.0
C880227,404596,Maria Lindqvist,07/20/2026,NORTHEAST,99213,165.0
C880232,396273,Ingrid Sorensen,07/20/2026,MIDWAY,99203,210.0
C880233,981269,DELLA ACHTERBERG,07/21/2026,NORTHEAST,99214,240.0
C880236,760685,ODETTE RASMUSSEN,07/21/2026,NORTHEAST,99203,210.0
C880243,675615,abel halvorsen,07/21/2026,NORTHEAST,99213,165.0
C880250,306646,Ilse Brekke,07/21/2026,NORTHEAST,90471,45.0
C880254,544941,Hollis Quist,07/21/2026,MIDWAY,99396,285.0
C880260,936903,Calvin Engstrom,07/21/2026,MIDWAY,99203,210.0
C880261,659188,Hazel Eriksen,07/21/2026,NORTHEAST,99213,165.0
C880264,527025,sunniva whitcombe,07/21/2026,MIDWAY,99214,240.0
C880267,852284,Theo Ferreira,07/21/2026,NORTHEAST,99213,165.0
C880274,330660,Paloma Aldana,07/21/2026,NORTHEAST,99396,285.0
C880281,460490,Hedda Strand,07/21/2026,MIDWAY,99203,210.0
C880287,218124,Yara Holloway,07/21/2026,NORTHEAST,99396,285.0
C880289,146012,Priscilla Haugen,07/21/2026,MIDWAY,99203,210.0
C880292,944489,rosa valdez,07/21/2026,MIDWAY,99214,240.0
C880297,891254,Owen Brandt,07/22/2026,MIDWAY,99213,165.0
C880305,216836,LENA NAKASHIMA,07/22/2026,NORTHEAST,99213,165.0
C880314,573415,Silas Mbeki,07/22/2026,MIDWAY,99213,165.0
C880321,169145,JASPER HJELM,07/22/2026,NORTHEAST,99203,210.0
C880323,708730,Felix Pruitt,07/23/2026,NORTHEAST,99213,165.0
C880324,566339,Margit Tanaka,07/23/2026,NORTHEAST,99213,165.0
C880328,146012,priscilla haugen,07/23/2026,MIDWAY,99214,240.0
C880337,803215,BEATRIX RUUD,07/23/2026,MIDWAY,99214,240.0
C880341,445106,Desmond Maddox,07/23/2026,NORTHEAST,99203,210.0
C880344,312253,Samir Abernathy,07/23/2026,MIDWAY,99203,210.0
C880353,119052,Lucia Galloway,07/23/2026,NORTHEAST,99213,165.0
C880356,132978,Vivian Crowder,07/23/2026,MIDWAY,99203,210.0
C880359,623041,Imogen Salcedo,07/23/2026,MIDWAY,99213,165.0
C880368,378398,Rafael Thorsen,07/23/2026,MIDWAY,99396,285.0
C880372,484424,TOBIAS VANCE,07/23/2026,MIDWAY,99214,240.0
C880378,542010,wendell fairbanks,07/23/2026,MIDWAY,99213,165.0
C880380,722215,EMMETT CASTELLANOS,07/24/2026,MIDWAY,99203,210.0
C880384,805345,marcus delacroix,07/24/2026,MIDWAY,99214,240.0
C880388,306780,Noor Pellegrini,07/24/2026,NORTHEAST,99396,285.0
C880389,518632,ANNIKA KOWALCZYK,07/24/2026,MIDWAY,99203,210.0
C880395,598696,Ezra Ostrowski,07/24/2026,MIDWAY,99213,165.0
C880403,942600,Tomasz Wren,07/24/2026,NORTHEAST,90471,45.0
C880412,964304,Kate Whitfield,07/24/2026,NORTHEAST,99396,285.0
C880421,445768,JUNIPER LINDGREN,07/24/2026,NORTHEAST,99396,285.0
C880425,319366,Ronan Corbett,07/24/2026,MIDWAY,99203,210.0
`;

/* ── Weak template ── */

const weakReadme = `# Scheduling vs. billing reconciliation

## Summary

I matched the two exports on patient name and visit date after cleaning up the names.

| Result | Count |
|---|---|
| Matched | 42 |
| In scheduling but not billing | 9 |
| In billing but not scheduling | 6 |

**42 visits matched.** The main finding is that **9 scheduled visits have no claim**, which could mean missed charges, and 6 claims have no matching appointment, which could be billing errors. Based on these numbers, about 57 visits happened last week (42 + 9 + 6).

## Method

1. Loaded both CSVs with pandas.
2. Cleaned the names: stripped spaces, lowercased, and flipped "Last, First" into "First Last" so both files use the same format.
3. Took the date from \`appt_date\` in scheduling and the first 10 characters of \`service_datetime_utc\` in billing.
4. Did an outer merge on name + date and counted the results.

## Files

- \`match.py\`: the matching script
- \`match_summary.csv\`: counts by result
- \`matched_visits.csv\` (not included, it's large): every merged row

## Recommendations

- Finance should review the 9 unbilled visits for missed charges.
- Billing should review the 6 claims without appointments.
- Both systems should use the same name format so that matching is easier in future.
`;

const weakScript = `import pandas as pd

sched = pd.read_csv("data/scheduling_export.csv")
bill = pd.read_csv("data/billing_export.csv")


def clean_name(n):
    n = n.strip().lower()
    if "," in n:
        last, first = n.split(",", 1)
        n = first.strip() + " " + last.strip()
    return n


sched["name"] = sched["patient_name"].apply(clean_name)
bill["name"] = bill["patient_name"].apply(clean_name)
sched["date"] = pd.to_datetime(sched["appt_date"], format="%m/%d/%Y").dt.date
bill["date"] = pd.to_datetime(bill["service_datetime_utc"].str[:10]).dt.date

merged = sched.merge(bill, on=["name", "date"], how="outer", indicator=True)
print(merged["_merge"].value_counts())

merged["_merge"].value_counts().to_csv("match_summary.csv")
merged.to_csv("matched_visits.csv", index=False)
`;

const weakSummary = `_merge,count
both,42
left_only,9
right_only,6
`;

const mod: ChallengeModule = {
  challenge: {
    id: 'pr_messy_data',
    kind: 'practice',
    companyId: 'co_fernhill',
    title: 'Reconcile two messy clinic-visit exports',
    summary: 'Scheduling shows 50 visits, billing shows 48. Match every visit and explain each gap.',
    type: 'data',
    skills: ['Python', 'pandas', 'SQL', 'Data cleaning', 'Record linkage'],
    classroomConcepts: [
      { concept: 'Join keys and outer joins', course: 'Database Systems' },
      { concept: 'Data cleaning and normalization', course: 'Intro to Data Science' },
      { concept: 'Set intersection and difference', course: 'Discrete Mathematics' },
    ],
    difficulty: 'beginner',
    estHours: 3,
    brief,
    deliverables: [
      'A matching script that runs from the two raw exports',
      'A reconciliation table with a result for every visit and excluded row',
      'A README with the counts, a reason for every unmatched row and your cleaning rules',
    ],
    rubric: [
      {
        id: 'match_accuracy',
        name: 'Match accuracy',
        description: 'Exact counts of matched, scheduling-only and billing-only visits, with a correct reason for every unmatched or excluded row.',
        weight: 35,
      },
      {
        id: 'cleaning',
        name: 'Cleaning rules',
        description: 'Every cleaning rule (IDs, dates, times, names, statuses, duplicates) is stated explicitly and applied consistently to both files.',
        weight: 25,
      },
      {
        id: 'reproducibility',
        name: 'Reproducibility',
        description: 'One script goes from the two raw exports to the final table with no manual steps, and gives the same counts every run.',
        weight: 15,
      },
      {
        id: 'communication',
        name: 'Communication',
        description: 'A README Finance can act on: the answer first, a clear bridge from raw row counts to real visits, and a next step for each gap.',
        weight: 25,
      },
    ],
    applicantCap: null,
    status: 'open',
    hiringFor: null,
    starterFiles: [
      { path: 'README.md', content: starterReadme },
      { path: 'data/scheduling_export.csv', content: schedulingCsv },
      { path: 'data/billing_export.csv', content: billingCsv },
    ],
    aiHints: {
      testing:
        'Whether you can find a reliable join key between two systems that were never meant to be joined, and account for every row on both sides. Getting a plausible count is easy; explaining each unmatched row is the real test.',
      steps: [
        'Profile both files first: row counts, distinct IDs, status values, and date and time formats.',
        'Pick a match key that identifies a visit (not just a patient) and normalize it the same way on both sides.',
        'Check the timestamps: what time zone is each system in, and does converting change any dates?',
        "Remove rows that aren't visits or are duplicates, and keep a list of what you removed and why.",
        'Match, then go through every unmatched row one by one and write down the reason.',
        'Rerun your script from the raw files to confirm the counts come out the same.',
      ],
      greatLooksLike:
        'A great submission bridges the raw row counts (50 and 48) to the real number of visits in a small table, gives a specific reason for every unmatched or excluded row, and lists its cleaning rules in plain language. A single script reproduces everything from the two raw exports.',
      pitfalls: [
        "Matching on name and date: names are typed by hand and don't always agree.",
        'Comparing UTC dates with local dates, which pushes evening visits onto the next day.',
        'Counting No Show or Rescheduled rows as visits.',
        'Missing the exact duplicate row and counting one visit twice.',
        'Using MRN alone as the key when a patient can have more than one visit in a week.',
      ],
    },
    deadlineInDays: null,
    createdDaysAgo: 100,
    seed: { participants: 29, submissions: 17, scored: 17 },
  },
  templates: [
    {
      quality: 'strong',
      notes: `### What I built
\`reconcile.py\`, a standard-library Python script that reads both raw exports, applies six numbered cleaning rules, matches visits and writes \`reconciliation.csv\` with one row per visit or excluded row. The README bridges 50 and 48 raw rows to 49 real visits and gives a reason for every unmatched row.

### Key decisions & trade-offs
- **Match key = MRN + local date + clinic.** One patient has two visits that week, so MRN alone isn't enough. The script asserts the key is unique on both sides, so a bad week fails loudly instead of quietly double-matching.
- **Convert billing from UTC before taking the date.** Otherwise the three Midway evening visits land on the next day.
- **Names are a check, not a key.** They differ on one matched visit (Katherine vs. Kate), and the script flags that rather than rejecting the match.
- **Standard library only,** so Finance can run it without installing anything.
- I used a fixed UTC−5 offset because the week is in July.

### What I'd do with more time
Switch to \`zoneinfo\` (America/Chicago) so the script survives the change back to standard time in November, and add a few unit tests for the cleaning functions.`,
      files: [
        { path: 'README.md', content: strongReadme },
        { path: 'reconcile.py', content: strongScript },
        { path: 'reconciliation.csv', content: strongTable },
      ],
      feedback:
        'Excellent reconciliation: 45 matched, 2 scheduling-only and 2 billing-only, a reason for every unmatched and excluded row, and a bridge table that takes Finance from 50 and 48 raw rows to 49 real visits. Keying on MRN + local date + clinic and asserting the key is unique shows you spotted the patient with two visits that week. One idea: swap the fixed UTC−5 offset for zoneinfo so the script keeps working after the switch back to standard time.',
      aiDisclosure:
        'Used an AI assistant to check the strptime format string for the 12-hour times. The matching logic, rules and write-up are mine.',
    },
    {
      quality: 'solid',
      notes: `**What I built**
A pandas script (\`match.py\`) that filters scheduling to completed appointments, normalizes MRNs and outer-joins the two files on MRN + date, plus a README with the counts and a reason for each unmatched row.

**Key decisions & trade-offs**
- I matched on MRN + date instead of names, because names are typed by hand.
- I did the billing cleanup in a spreadsheet first: converting UTC to Central with a formula, deleting the duplicate claim row and trimming names. It was the fastest way to see what was going on with the evening visits, but it means the script can't run on a raw export by itself.
- Only \`Completed\` scheduling rows count as visits, so No Shows and the original slot of the rescheduled appointment are excluded.
- I wrote the unmatched rows to their own CSV so Finance can work through them.

**What I'd do with more time**
Move the spreadsheet steps into Python so a new week's exports can run end to end, and add a check that each MRN + date appears only once on each side.`,
      files: [
        { path: 'README.md', content: solidReadme },
        { path: 'match.py', content: solidScript },
        { path: 'data/billing_clean.csv', content: solidBillingClean },
      ],
      feedback:
        "Your counts are right (45 / 2 / 2, 49 visits) and every unmatched row has a sensible reason. The weak spot is reproducibility: the time-zone fix, the duplicate removal and the name trimming happen in a spreadsheet, so next week's export can't go through match.py on its own. Move those steps into the script and state them as rules, and this becomes a pipeline Finance can rerun every Monday.",
      aiDisclosure: 'I asked an AI chatbot for the spreadsheet formula to convert UTC to Central time. The rest is my own work.',
    },
    {
      quality: 'weak',
      notes: `**What I built**
A short pandas script that cleans up patient names in both files and matches appointments to claims on name + visit date, with a summary of matched and unmatched counts.

**Key decisions & trade-offs**
- I matched on name and date because those are the fields both files clearly share, and the names were easy to standardize (trim, lowercase, flip "Last, First").
- I took the date straight from each file: \`appt_date\` in scheduling and the first 10 characters of \`service_datetime_utc\` in billing.
- I kept every row in both files so that nothing is lost in the reconciliation.
- I used an outer join so the unmatched rows on both sides show up in the output.

**What I'd do with more time**
Look at the unmatched rows in more detail and try fuzzy name matching to pick up spelling differences.`,
      files: [
        { path: 'README.md', content: weakReadme },
        { path: 'match.py', content: weakScript },
        { path: 'match_summary.csv', content: weakSummary },
      ],
      feedback:
        "Clean, readable write-up, but name + date isn't a reliable key here. Billing stores times in UTC, so the three Midway evening visits land on the next day, and one patient is 'Katherine' in scheduling and 'Kate' in billing, so those four visits show up as unmatched on both sides. The duplicate claim was counted as its own match and the No Show and Rescheduled rows were counted as visits, which is how 49 real visits became 57. Try matching on MRN plus the local date, and filter statuses first.",
    },
  ],
  scripted: [
    {
      challengeId: 'pr_messy_data',
      studentId: 'stu_maya',
      scores: { match_accuracy: 5, cleaning: 4, reproducibility: 3, communication: 4 },
      feedback:
        "Your counts are exactly right: 45 matched, 2 only in scheduling and 2 only in billing, 49 visits in all, with a reason for every unmatched row, and you caught both the UTC shift and the duplicate claim. The cleaning steps are written down, but the time-zone fix and duplicate removal live in a spreadsheet, so they aren't rules anyone can rerun, and that spreadsheet also quietly stripped the MRN zeros. Moving steps 1–4 into match.py would make this rerunnable end to end. For Finance, lead with what to do next: chase the two unbilled Friday visits and check whether the duplicate claim went to the payer twice.",
      templateIndex: 1,
      submittedDaysAgo: 14,
    },
  ],
};

export default mod;
