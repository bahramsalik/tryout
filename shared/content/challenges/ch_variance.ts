import type { ChallengeModule } from '../lib.ts';

const brief = `## Context
Cobalt Ridge Bank's Consumer Banking division (62 branches, about $5.3B in average deposits and $3.6B in loans) closed Q3 2026 with pre-tax income of $22.3M against a budget of $25.9M. That is a $3.6M miss, or 13.9%.

Our CFO needs a one-page explanation for the board pack that goes out on November 13. Several things moved at once in Q3: the High-Yield Savings promotion we launched in June, a cooler mortgage market, the conversion weekend for Project Keystone (our core deposit-system migration), and a hiring freeze in Consumer Banking since mid-July. The board will ask two questions: what actually caused the miss, and how much of it will repeat in Q4?

## The task
Do what a first-week FP&A analyst on our team would do:

1. **Variance table.** For every P&L line, show the Q3 budget, actual, $ variance and % variance, and label each one favorable (F) or unfavorable (U). Monthly detail is optional.
2. **Drivers.** Use \`data/drivers.csv\` to explain the lines that matter. Split the deposit interest expense variance into a rate (price) effect and a balance (volume) effect.
3. **Bridge.** Walk from budget pre-tax income to actual in 5–8 steps that add up exactly.
4. **CFO memo.** One page (max 450 words) that leads with the answer, separates one-time items from recurring ones, and ends with 2–3 recommendations, each with a dollar figure.

## Constraints
- Time box: 3 hours. We're grading judgment, not formatting.
- Use any spreadsheet tool. Export each tab you want us to see to CSV, and write the memo in markdown.
- All amounts in the files are in $000s.
- Out of scope: income taxes, corporate overhead allocations, other divisions and a full-year reforecast.
- Work only from the files provided, and state any assumption in one line.
- AI tools are allowed. Tell us in your submission how you used them.

## What we provide
- \`data/q3_pnl_budget_vs_actual.csv\`: the division's P&L by month (Jul–Sep), budget and actual, with subtotals
- \`data/drivers.csv\`: the volumes and rates behind the P&L
- \`budget_assumptions.md\`: how each line was budgeted last November
- \`cfo_request.md\`: the CFO's email to the team
- \`README.md\`: file guide and sign conventions
`;

const pnlCsv = `line_item,section,jul_budget,jul_actual,aug_budget,aug_actual,sep_budget,sep_actual
Loan interest income,Net interest income,18300,18310,18376,18361,18452,18421
FTP credit on excess deposits,Net interest income,5667,5805,5702,5982,5738,6138
Deposit interest expense,Net interest income,6475,7102,6654,7713,6835,8211
Net interest income,Subtotal,17492,17013,17424,16630,17355,16348
Service charges on deposits,Noninterest income,1450,1430,1450,1425,1450,1440
Card & interchange income,Noninterest income,1250,1268,1250,1281,1250,1259
Mortgage banking income,Noninterest income,1042,724,1085,707,1020,673
Other fee income,Noninterest income,310,305,310,312,310,298
Total noninterest income,Subtotal,4052,3727,4095,3725,4030,3670
Salaries & benefits,Noninterest expense,6953,6791,7056,6709,7158,6654
Occupancy & equipment,Noninterest expense,1600,1598,1600,1604,1600,1611
Technology & core systems,Noninterest expense,1150,1162,1150,1690,1150,1648
Marketing,Noninterest expense,520,540,520,515,520,531
FDIC & regulatory assessments,Noninterest expense,410,410,410,413,410,416
Travel & training,Noninterest expense,18,22,18,41,18,36
Other operating expense,Noninterest expense,600,590,600,641,600,605
Total noninterest expense,Subtotal,11251,11113,11354,11613,11456,11501
Provision for credit losses,Provision,1500,1420,1500,1610,1500,1560
Pre-tax income,Total,8793,8207,8665,7132,8429,6957
`;

const driversCsv = `driver,unit,jul_budget,jul_actual,aug_budget,aug_actual,sep_budget,sep_actual
Average interest-bearing deposits,$M,4200,4240,4225,4305,4250,4360
Average noninterest-bearing deposits,$M,1000,995,1000,990,1000,985
Blended rate paid on interest-bearing deposits,% annual,1.85,2.01,1.89,2.15,1.93,2.26
of which: High-Yield Savings promo balances,$M,514,796,586,1054,659,1264
High-Yield Savings promo rate,% annual,4.00,4.00,4.00,4.00,4.00,4.00
Average loan balances,$M,3600,3596,3615,3606,3630,3612
Loan yield,% annual,6.10,6.11,6.10,6.11,6.10,6.12
FTP credit rate on excess deposits,% annual,4.25,4.25,4.25,4.25,4.25,4.25
Mortgage originations,count,240,172,250,168,235,160
Average mortgage loan size,$000,310,305,310,305,310,305
Mortgage originations volume,$M,74.40,52.46,77.50,51.24,72.85,48.80
Mortgage fee margin,bps of volume,140,138,140,138,140,138
Average FTE headcount,FTE,1015,990,1030,978,1045,970
Loaded cost per FTE,$000 per month,6.85,6.86,6.85,6.86,6.85,6.86
Project Keystone one-time spend (in Technology),$000,0,0,0,538,0,492
Credit card active accounts,000s,182.0,183.1,182.5,184.0,183.0,184.2
`;

const budgetAssumptions = `# Consumer Banking: FY2026 budget assumptions (Q3 extract)

Prepared by FP&A, November 2025. Approved with the FY2026 operating plan. All amounts in $000s unless noted. Fiscal year = calendar year.

## Net interest income
- **Loan interest income** = average loan balances x loan yield / 12. Balances grow about $15M a month (home equity and auto). Yield held at 6.10%.
- **Deposit interest expense** = average interest-bearing deposits x blended rate paid / 12.
- **High-Yield Savings (HYS) promo.** Launches June 15, 2026 at 4.00% APY, guaranteed for six months, then steps down to the standard HYS tier (3.25%). We budgeted promo balances to build gradually, by about $70–75M a month, with most of it new money to the bank. The blended rate rises from 1.85% in July to 1.93% in September as a result. All other interest-bearing balances are budgeted at roughly 1.55%.
- **FTP credit on excess deposits.** Treasury credits the division for deposits it raises beyond its own loans: (interest-bearing + noninterest-bearing deposits - loans) x the FTP rate / 12. The Q3 FTP rate was set by ALCO at 4.25% and does not move during the quarter.

## Noninterest income
- **Service charges and card income** are budgeted flat per month, based on the FY2025 run-rate plus a small lift from the new debit rewards tier.
- **Mortgage banking income** = origination volume x fee margin. We budgeted 235–250 originations a month at a $310K average loan and a 140 bps margin. The plan assumed 30-year rates would ease to about 5.9% by summer.

## Noninterest expense
- **Salaries & benefits** = average FTE x loaded cost per FTE. The plan adds about 15 FTE a month in Q3 (branch tellers, universal bankers, two mortgage loan officers) at a $6,850 loaded monthly cost.
- **Technology & core systems** runs at $1,150 a month and **excludes Project Keystone.** The Keystone conversion was budgeted at $1,400 one-time in Q1 FY2027. In June the vendor offered an earlier conversion window (August 22–23) and the steering committee accepted it.
- **Travel & training** is budgeted at $18 a month.
- **FDIC & regulatory assessments** are budgeted flat at $410 a month.

## Provision for credit losses
- Budgeted at $1,500 a month, based on a 0.50% annualized net charge-off rate on the consumer book plus modest reserve build for loan growth.

## Not in this budget
- Corporate overhead allocations (reported below pre-tax income at the bank level)
- Income taxes
`;

const cfoRequest = `**From:** Daniel Okafor, Chief Financial Officer <dokafor@cobaltridge.example>
**To:** FP&A Team <fpa@cobaltridge.example>
**Cc:** Grace Liu, FP&A Manager <gliu@cobaltridge.example>
**Date:** Tuesday, October 27, 2026, 7:42 AM
**Subject:** Consumer Banking Q3: need the one-pager for the board pack

Team,

Consumer Banking came in at $22.3M pre-tax for Q3 against a $25.9M plan. I need one page for the board pack explaining why. The pack locks on November 13.

What I need it to do:

1. Tell me the answer in the first two sentences. The board will read the top and skip the rest.
2. Separate what's one-time from what will keep happening. If Keystone is in there, call it out. I don't want the board thinking we have a $1M-a-quarter problem if we don't.
3. Tell me what's going on with the HYS promo. Renee's team says it's "working" because balances are up. I want to know what it's costing us and whether the balances are new money or just our own customers moving over.
4. Don't hide behind the hiring freeze. If salaries are under budget only because we aren't filling seats, say so.
5. Give me two or three things we should do, with numbers.

I don't need every line explained. If something is up 80% but it's $40K, leave it out or put it in a footnote.

Thanks,
Daniel
`;

const starterReadme = `# Q3 Consumer Banking variance: starter kit

Hi, and welcome to the FP&A team. This is the same data we used to close Q3 for Consumer Banking, trimmed to what you need for the CFO's one-pager.

## Files
| File | What's in it |
| --- | --- |
| \`data/q3_pnl_budget_vs_actual.csv\` | Division P&L, July–September 2026, budget and actual by month. Includes subtotal rows (net interest income, total noninterest income, total noninterest expense, pre-tax income). |
| \`data/drivers.csv\` | The volumes and rates behind the P&L, budget and actual by month. |
| \`budget_assumptions.md\` | How each line was built in the FY2026 plan. Read this before you explain a variance. |
| \`cfo_request.md\` | Daniel's email. This is your spec. |

## Conventions
- All P&L amounts are in **$000s**. Drivers carry their own units (see the \`unit\` column).
- Every P&L amount is stored as a **positive number**, including expenses. Subtotals are computed as: net interest income = loan interest + FTP credit - deposit interest expense; pre-tax income = net interest income + noninterest income - noninterest expense - provision.
- We define **variance = actual - budget**. Whether that is favorable depends on the line: higher income is favorable, higher expense is unfavorable. Label each line F or U so the CFO doesn't have to think about it.
- Rates in \`drivers.csv\` are annual percentages; divide by 12 for a month.

## Tie-outs worth checking
- Deposit interest expense for a month = average interest-bearing deposits x blended rate / 12 (within $1K of rounding).
- Salaries & benefits = average FTE x loaded cost per FTE.
- Mortgage banking income = origination volume x fee margin.

## What to hand in
A zip with your CSV exports, the memo (\`cfo_memo.md\` or similar) and a short README explaining how your files fit together. Questions during the challenge go to fpa@cobaltridge.example.
`;

/* ───────────── Strong template ───────────── */

const strongVarianceCsv = `line_item,section,q3_budget,q3_actual,variance_a_minus_b,variance_pct,pti_impact,fav_unfav
Loan interest income,Net interest income,55128,55092,-36,-0.1%,-36,U
FTP credit on excess deposits,Net interest income,17107,17925,818,4.8%,818,F
Deposit interest expense,Net interest income,19964,23026,3062,15.3%,-3062,U
Net interest income,Subtotal,52271,49991,-2280,-4.4%,-2280,U
Service charges on deposits,Noninterest income,4350,4295,-55,-1.3%,-55,U
Card & interchange income,Noninterest income,3750,3808,58,1.5%,58,F
Mortgage banking income,Noninterest income,3147,2104,-1043,-33.1%,-1043,U
Other fee income,Noninterest income,930,915,-15,-1.6%,-15,U
Total noninterest income,Subtotal,12177,11122,-1055,-8.7%,-1055,U
Salaries & benefits,Noninterest expense,21167,20154,-1013,-4.8%,1013,F
Occupancy & equipment,Noninterest expense,4800,4813,13,0.3%,-13,U
Technology & core systems,Noninterest expense,3450,4500,1050,30.4%,-1050,U
Marketing,Noninterest expense,1560,1586,26,1.7%,-26,U
FDIC & regulatory assessments,Noninterest expense,1230,1239,9,0.7%,-9,U
Travel & training,Noninterest expense,54,99,45,83.3%,-45,U
Other operating expense,Noninterest expense,1800,1836,36,2.0%,-36,U
Total noninterest expense,Subtotal,34061,34227,166,0.5%,-166,U
Provision for credit losses,Provision,4500,4590,90,2.0%,-90,U
Pre-tax income,Total,25887,22296,-3591,-13.9%,-3591,U
`;

const strongPvCsv = `month,budget_avg_ib_deposits_m,actual_avg_ib_deposits_m,budget_rate_pct,actual_rate_pct,budget_cost,actual_cost,volume_variance,rate_variance,total_variance
Jul,4200,4240,1.85,2.01,6475,7102,-62,-565,-627
Aug,4225,4305,1.89,2.15,6654,7713,-126,-933,-1059
Sep,4250,4360,1.93,2.26,6835,8211,-177,-1199,-1376
Q3,4225,4302,,,19964,23026,-365,-2697,-3062
`;

const strongBridgeCsv = `step,amount_000,running_total_000,type
Q3 budget pre-tax income,25887,25887,start
Deposit rate paid (price),-2697,23190,recurring
Deposit volume (more balances at budget rate),-365,22825,recurring
FTP credit on the extra deposits,818,23643,recurring
Mortgage banking income (fewer originations),-1043,22600,recurring
Project Keystone one-time migration cost,-1030,21570,one-time
Salaries & benefits (hiring freeze),1013,22583,temporary
Provision for credit losses,-90,22493,recurring
All other lines (net),-197,22296,mixed
Q3 actual pre-tax income,22296,22296,end
`;

const strongMemo = `# Consumer Banking Q3 2026: why we missed budget

**To:** Daniel Okafor, CFO · **From:** FP&A · **Amounts in $M unless noted**

## The answer
Consumer Banking earned **$22.3M pre-tax in Q3, $3.6M (13.9%) below budget.** Almost all of the miss is recurring. The HYS promotion is repricing our existing savings customers much faster than planned, and mortgage volume is down a third. The one-time Keystone cost ($1.0M) is offset almost exactly by hiring-freeze savings ($1.0M), and **both of those go away.** The underlying gap is about **$3.6M a quarter, and it widened every month of Q3.**

## What drove it
| Driver | Q3 impact ($K) | Type |
| --- | ---: | --- |
| Deposit rate paid (HYS repricing) | -2,697 | Recurring, growing |
| Deposit volume, net of FTP credit | +453 | Recurring |
| Mortgage banking income | -1,043 | Recurring (market) |
| Project Keystone conversion | -1,030 | One-time (pulled forward from Q1 FY27) |
| Hiring freeze: 75 FTE below plan by Sep | +1,013 | Temporary |
| Provision and all other lines | -287 | Mixed |
| **Total** | **-3,591** | |

**HYS promo.** Promo balances reached $1.26B in September against $0.66B budgeted. But total interest-bearing deposits grew only $120M from July to September while promo balances grew $468M. Roughly three-quarters of the promo's growth is our own customers moving money from 1.55% savings to 4.00%. The rate effect cost $2.7M in Q3 and $1.2M in September alone. The new money is profitable (FTP credit of $0.82M against $0.37M of extra interest) but far too small to cover the repricing.

**Mortgage.** Originations averaged 167 a month against 242 budgeted. Lower volume explains $1.01M of the miss and a 2 bp margin squeeze explains $0.03M.

**Keystone and the freeze.** Keystone was budgeted at $1.40M in Q1 FY27; it came early, not on top. Salaries are under budget only because 75 planned seats are empty.

## What we recommend
1. **Make the promo rate new-money-only from November 15.** Each $100M that moves from standard savings into the promo costs about $2.45M a year. At Q3's pace (about $175M of migration a month), every month we wait adds about $0.36M to the monthly run-rate.
2. **Let promo balances step down to 3.25% at six months as designed, with no auto-renewal.** The first cohort steps down on December 15. Once all of Q3's $1.26B has stepped down, we save about $0.8M a month.
3. **Reforecast Q4 now.** Use the September run-rate (160 originations, -$1.2M a month on deposit rate) and take $1.03M of Keystone out of the Q1 FY27 budget. Before these actions, Q4 tracks $3.0–4.5M below plan, depending on how fast we refill the 75 seats.

*Not material: Travel & training is up 83%, but that is $45K. The August–September timing suggests Keystone training.*
`;

const strongReadme = `# Q3 Consumer Banking variance: submission

I built this in a spreadsheet (one tab per output) and exported each tab to CSV. All amounts are in $000s unless a file says otherwise.

## Files
| File | What it shows |
| --- | --- |
| \`cfo_memo.md\` | The one-pager for the board pack. **Start here.** |
| \`variance_table.csv\` | Q3 budget vs actual for every line and subtotal: $ variance (actual - budget), % variance, pre-tax impact and F/U. |
| \`deposit_price_volume.csv\` | Deposit interest expense split into volume and rate effects, by month. |
| \`bridge.csv\` | Budget-to-actual pre-tax income bridge, tagged recurring / one-time / temporary. |

## Method
- **Signs.** Variance is always actual - budget. A separate \`pti_impact\` column flips the sign for expense lines, so a positive number always helps pre-tax income. F/U follows \`pti_impact\`, so deposit interest expense going *up* by $3,062K shows as -3,062 and U.
- **Deposit price/volume.** Volume effect = (actual balance - budget balance) x budget rate / 12. Rate effect = actual balance x (actual rate - budget rate) / 12. I calculated the rate effect as total minus volume each month, so the two always add back to the P&L to the dollar.
- **FTP.** I put the FTP credit right next to the deposit volume effect, because the extra balances earn FTP at 4.25%. Netting the two is the fair way to judge the new money.
- **One-time vs recurring.** Keystone is one-time and per \`budget_assumptions.md\` it was pulled forward from Q1 FY27. The salary favorability is temporary: it exists only because of the freeze (75 FTE short in Sep).
- **Materiality.** Lines under $100K go into "all other" in the bridge, even when their % looks big (Travel & training is +83%).

## Checks I ran
- Rebuilt each subtotal and pre-tax income from the line items for each month and for Q3. All tie to the starter file.
- Deposit interest, salaries and mortgage income recompute from \`drivers.csv\` within $1K a month.
- The bridge steps add to -$3,591K, which matches actual minus budget pre-tax income.

## Assumptions
- The share of promo growth that is migration (about 75%) is an estimate: promo growth minus total interest-bearing growth, July to September. Account-level data would firm this up.
`;

const strongNotes = `### What I built
A full Q3 variance table with $ and % variances and F/U labels, a monthly price/volume split of deposit interest expense, an eight-step bridge from budget to actual pre-tax income, and a one-page memo for the CFO. Every number comes from the starter files, and I rebuilt all the subtotals to make sure they tie.

### Key decisions & trade-offs
- I led the memo with the recurring gap ($3.6M a quarter) rather than the headline miss. Keystone (-$1.03M) and the hiring freeze (+$1.01M) roughly cancel out, and both are temporary, so the headline number understates the real problem.
- I netted the deposit volume effect against the FTP credit. Looked at alone, the extra balances look like a cost. Netted, they are slightly profitable, and that changes the recommendation from "stop the promo" to "stop the migration."
- My ~75% migration estimate is rough, since it uses division totals and not account-level flows. I say so in the memo.
- I put Travel & training (+83%, $45K) in a footnote, as the CFO asked.

### What I'd do with more time
Pull account-level transfer data to measure migration directly, model the December 15 step-down by promo cohort, and turn the Q4 numbers into a proper reforecast rather than a run-rate estimate.
`;

/* ───────────── Solid template ───────────── */

const solidVarianceCsv = `line_item,q3_budget,q3_actual,variance,variance_pct,favorable_unfavorable
Loan interest income,55128,55092,-36,-0.1%,Unfavorable
FTP credit on excess deposits,17107,17925,818,4.8%,Favorable
Deposit interest expense,19964,23026,3062,15.3%,Unfavorable
Net interest income,52271,49991,-2280,-4.4%,Unfavorable
Service charges on deposits,4350,4295,-55,-1.3%,Unfavorable
Card & interchange income,3750,3808,58,1.5%,Favorable
Mortgage banking income,3147,2104,-1043,-33.1%,Unfavorable
Other fee income,930,915,-15,-1.6%,Unfavorable
Total noninterest income,12177,11122,-1055,-8.7%,Unfavorable
Salaries & benefits,21167,20154,-1013,-4.8%,Favorable
Occupancy & equipment,4800,4813,13,0.3%,Unfavorable
Technology & core systems,3450,4500,1050,30.4%,Unfavorable
Marketing,1560,1586,26,1.7%,Unfavorable
FDIC & regulatory assessments,1230,1239,9,0.7%,Unfavorable
Travel & training,54,99,45,83.3%,Unfavorable
Other operating expense,1800,1836,36,2.0%,Unfavorable
Total noninterest expense,34061,34227,166,0.5%,Unfavorable
Provision for credit losses,4500,4590,90,2.0%,Unfavorable
Pre-tax income,25887,22296,-3591,-13.9%,Unfavorable
`;

const solidDriversCsv = `driver,line_affected,q3_impact_000,explanation
Deposit rate paid above budget,Deposit interest expense,-2697,Blended rate 2.01-2.26% vs 1.85-1.93% budget; HYS promo balances $1264M in Sep vs $659M budget
Higher deposit balances,Deposit interest expense,-365,Avg interest-bearing deposits $4302M vs $4225M budget
FTP credit on higher balances,FTP credit on excess deposits,818,Excess deposits higher by about $77M avg at 4.25%
Fewer mortgage originations,Mortgage banking income,-1043,500 originations vs 725 budget (-31%); margin 138 vs 140 bps
Project Keystone conversion,Technology & core systems,-1030,$538K Aug + $492K Sep; not in FY2026 budget
Hiring freeze,Salaries & benefits,1013,Avg FTE 979 vs 1030 budget
Provision,Provision for credit losses,-90,Aug provision $110K over budget; not explained by the drivers provided
Other lines,Various,-197,Small variances across fees and expenses
Total,,-3591,Matches actual minus budget pre-tax income
`;

const solidMemo = `# Consumer Banking Q3 2026 variance explanation

To: Daniel Okafor, CFO
From: FP&A

## Overview
This memo explains the Q3 2026 variance for Consumer Banking. Budgeted pre-tax income was $25.9M and actual was $22.3M. Below I go through each section of the P&L.

## Net interest income: -$2.28M (U)
- **Loan interest income** was $36K below budget because loan balances came in slightly under plan ($3,605M average vs $3,615M). Yield was 6.11% vs 6.10%.
- **FTP credit** was $818K above budget (F) because deposits were higher than planned.
- **Deposit interest expense** was $3.06M over budget (U). Most of this, $2.70M, comes from the rate paid. The High-Yield Savings promotion drew $1.26B by September vs $659M budgeted, which raised the blended rate to 2.26%. The other $365K comes from higher balances.

## Noninterest income: -$1.06M (U)
- **Mortgage banking income** was $1.04M below budget (-33%). Originations were 500 vs 725 budgeted.
- Service charges were down $55K, card income up $58K and other fees down $15K.

## Noninterest expense: +$166K (U)
- **Salaries & benefits** were $1.01M under budget (F) because of the hiring freeze. Average FTE was 979 vs 1,030.
- **Technology** was $1.05M over budget (U) because of Project Keystone conversion costs in August and September.
- Travel & training was up 83% ($45K), marketing up $26K, other operating up $36K, occupancy up $13K and FDIC up $9K.

## Provision: +$90K (U)
Provision was $4.59M vs $4.50M budget.

## Summary
Pre-tax income was $3.59M (13.9%) below budget. The biggest drivers were deposit costs (-$3.06M), mortgage income (-$1.04M) and Keystone (-$1.03M), partly offset by salaries (+$1.01M) and FTP (+$0.82M).

## Recommendations
1. Review the HYS promo rate, since it is the largest driver. Moving the promo from 4.00% to 3.50% on $1.26B would save about $0.5M a month.
2. Lower the Q4 mortgage forecast to around 160 originations a month.
3. Keep the hiring freeze in place through Q4 to offset deposit costs.
`;

const solidReadme = `# Consumer Banking Q3 variance analysis

My submission for the Q3 budget-miss challenge. I worked in a spreadsheet and exported the tabs as CSV files. Amounts are in $000s.

## What's included
- \`variance_table.csv\`: every P&L line for Q3 with budget, actual, variance (actual - budget), % variance and a favorable/unfavorable flag. Subtotals are included and tie to the starter file.
- \`driver_summary.csv\`: the drivers behind each major variance, with the Q3 dollar impact. The impacts add up to the total pre-tax miss of -$3,591K.
- \`cfo_memo.md\`: the memo to the CFO.

## How I calculated things
- Quarterly totals are the sum of July, August and September.
- % variance = (actual - budget) / budget.
- Favorable/unfavorable: for income lines, actual above budget is favorable. For expense lines (deposit interest, noninterest expense, provision), actual above budget is unfavorable.
- For deposits, I split the variance into a rate part (actual balances x rate difference) and a balance part (balance difference x budget rate), month by month, then added them up.
- For mortgage, I compared origination counts and the fee margin from \`drivers.csv\`.
- For salaries, I compared average FTE to budget. The loaded cost per FTE was almost the same ($6.86K vs $6.85K).

## Checks
- Recomputed net interest income, total noninterest income, total noninterest expense and pre-tax income for each month. All match.
- Driver impacts sum to -$3,591K.

## Notes
I explained every line in the memo so the CFO has the full picture.
`;

const solidNotes = `**What I built**
A variance table for all 19 rows of the Q3 P&L (lines and subtotals), a driver summary that ties to the total miss, and a memo to the CFO that goes through each section of the P&L.

**Key decisions & trade-offs**
I used drivers.csv to explain the big lines rather than only reporting variances. For deposits I split the variance into rate and balance effects and found that the rate is most of it ($2.70M of $3.06M). Mortgage is a volume story: 500 originations against 725 budgeted. I decided to cover every line in the memo, including the small ones, so nothing would look hidden. I checked that my driver impacts add up to the $3,591K miss.

**What I'd do with more time**
I would build a bridge chart for the board, look at the HYS promo by month to see if growth is slowing, and dig into the provision variance in August, which I couldn't fully explain from the data provided.
`;

/* ───────────── Weak template ───────────── */

const weakTopCsv = `line_item,q3_budget,q3_actual,variance,variance_pct,fav_unfav
Deposit interest expense,19964,23026,3062,15.3%,F
Technology & core systems,3450,4500,1050,30.4%,U
Mortgage banking income,3147,2104,-1043,-33.1%,U
Salaries & benefits,21167,20154,-1013,-4.8%,F
FTP credit on excess deposits,17107,17925,818,4.8%,F
Travel & training,54,99,45,83.3%,U
Pre-tax income,25887,22296,-3591,-13.9%,U
`;

const weakSummary = `# Q3 Variance Summary

Consumer Banking pre-tax income was $22,296K vs a budget of $25,887K, a variance of -$3,591K (-13.9%).

## Largest variances
1. **Deposit interest expense:** +$3,062K (+15.3%). Favorable.
2. **Technology & core systems:** +$1,050K (+30.4%). Unfavorable.
3. **Mortgage banking income:** -$1,043K (-33.1%). Unfavorable.
4. **Salaries & benefits:** -$1,013K (-4.8%). Favorable.
5. **FTP credit:** +$818K (+4.8%). Favorable.

## Largest % variance
**Travel & training** was 83.3% over budget, the largest percentage variance in the P&L. It should be investigated.

## Conclusion
Pre-tax income missed budget by 13.9%, mainly because of mortgage income and technology costs. Several lines were favorable, including deposit interest expense and salaries.
`;

const weakReadme = `# Q3 Budget vs Actual

This folder has my analysis of the Consumer Banking Q3 P&L.

## Files
- \`top_variances.csv\`: the largest variances in Q3, sorted by size, plus Travel & training because it has the biggest % change
- \`summary.md\`: a written summary of the results

## Approach
I added up July, August and September for budget and actual on each line, then calculated variance as actual minus budget and the % change. I sorted the lines by the absolute size of the variance and kept the top five, then added the largest % variance.

A positive variance means actual was higher than budget, which I marked as favorable. Negative variances are unfavorable.

## Results
Total pre-tax income was $3.6M below budget. The main problems were mortgage banking income and technology costs. Deposit interest expense and salaries had favorable variances.

## Tools
Spreadsheet for the sums and percentages.
`;

const weakNotes = `**What I built**
A table of the largest Q3 variances and a short written summary. I summed the three months for each line, calculated actual minus budget and the percentage, and ranked the lines by size.

**Key decisions & trade-offs**
I focused on the five biggest dollar variances so the summary would be short, which is what the CFO asked for. I also included Travel & training because an 83% overrun stood out as the biggest percentage change and seemed like something leadership should know about. I didn't use drivers.csv because the P&L already showed where the variances were.

**What I'd do with more time**
I would look at the monthly trend for each line and add a chart showing budget vs actual pre-tax income by month.
`;

const mod: ChallengeModule = {
  challenge: {
    id: 'ch_variance',
    kind: 'live',
    companyId: 'co_cobalt',
    title: 'Explain the Q3 budget miss to the CFO',
    summary: 'Consumer Banking missed Q3 by $3.6M. Find the drivers and write the CFO one-pager.',
    type: 'finance',
    skills: ['Variance analysis', 'Price/volume analysis', 'Excel / Sheets', 'Bank P&L', 'Executive memo writing'],
    classroomConcepts: [
      { concept: 'Flexible budgets and price/volume variances', course: 'Managerial Accounting' },
      { concept: 'Net interest margin and deposit pricing', course: 'Money & Banking' },
      { concept: 'Bottom-line-up-front writing for executives', course: 'Business Communication' },
    ],
    difficulty: 'beginner',
    estHours: 3,
    brief,
    deliverables: [
      'Q3 variance table for every P&L line ($, %, F/U)',
      'Deposit interest expense split into rate and volume effects',
      'Bridge from budget to actual pre-tax income',
      'One-page CFO memo with 2–3 quantified recommendations',
    ],
    rubric: [
      { id: 'variance_math', name: 'Variance accuracy', description: 'Every line and subtotal ties to the source, $ and % variances are right, and favorable/unfavorable is correct for both income and expense lines.', weight: 30 },
      { id: 'drivers', name: 'Root-cause drivers', description: 'Uses drivers.csv to explain the miss, including a deposit rate-vs-volume split, and separates the material drivers from the noise.', weight: 25 },
      { id: 'exec_communication', name: 'Executive communication', description: 'The memo gives the answer in its first two sentences, separates one-time items from recurring ones, and fits on one page.', weight: 25 },
      { id: 'recommendations', name: 'Recommendations', description: 'Two or three specific actions, each with a dollar impact, that address the recurring drivers.', weight: 20 },
    ],
    reward: { mode: 'top3', amounts: [200, 100, 50] },
    applicantCap: 40,
    status: 'open',
    hiringFor: 'Financial Analyst (Rotational) · Full-time · Charlotte, NC',
    starterFiles: [
      { path: 'README.md', content: starterReadme },
      { path: 'cfo_request.md', content: cfoRequest },
      { path: 'budget_assumptions.md', content: budgetAssumptions },
      { path: 'data/q3_pnl_budget_vs_actual.csv', content: pnlCsv },
      { path: 'data/drivers.csv', content: driversCsv },
    ],
    aiHints: {
      testing: 'Whether you can go past "deposit costs were high" to why they were high, and tell a recurring problem from a one-time one. It also tests whether you can write for a CFO who will read only the first two sentences.',
      steps: [
        'Rebuild the subtotals from the line items so you trust the data, then compute Q3 budget, actual, $ and % variance for every line.',
        'Label each line F or U. Higher expense is unfavorable even though the variance is positive.',
        'Split deposit interest expense into volume (balance change x budget rate) and rate (actual balance x rate change), month by month.',
        'Tie mortgage income and salaries back to drivers.csv, and read budget_assumptions.md to see which items were never in the plan.',
        'Build a bridge from budget to actual pre-tax income and tag each step as recurring, one-time or temporary.',
        'Write the memo last: answer first, then a driver table, then 2–3 recommendations with dollar figures.',
      ],
      greatLooksLike: 'The memo opens with the miss and the fact that most of it repeats: the HYS promo is repricing existing customers, and the one-time Keystone cost is offset by temporary hiring-freeze savings. The deposit variance is split into rate and volume and set against the FTP credit, so the reader can see the new money is profitable but the migration isn\'t. Each recommendation comes with a dollar figure, and a small line with a scary percentage is relegated to a footnote.',
      pitfalls: [
        'Marking a higher expense line as favorable just because its variance is positive.',
        'Ranking variances by % instead of $ and leading with an $45K line that is up 83%.',
        'Calling the salary underspend a saving when it exists only because seats are empty.',
        'Walking through every line before giving the answer.',
        'Recommendations with no numbers, such as "review the promo".',
      ],
    },
    deadlineInDays: 4,
    createdDaysAgo: 10,
    seed: { participants: 12, submissions: 3, scored: 0 },
  },
  templates: [
    {
      quality: 'strong',
      notes: strongNotes,
      files: [
        { path: 'README.md', content: strongReadme },
        { path: 'cfo_memo.md', content: strongMemo },
        { path: 'variance_table.csv', content: strongVarianceCsv },
        { path: 'deposit_price_volume.csv', content: strongPvCsv },
        { path: 'bridge.csv', content: strongBridgeCsv },
      ],
      feedback: 'This is the memo we would have sent. You led with the recurring $3.6M gap instead of the headline number, and you noticed that Keystone and the hiring freeze cancel each other out. Netting the deposit volume effect against the FTP credit turned "stop the promo" into "stop the migration," which is the right call. To go further, put a rough range on the 75% migration estimate so the board knows how firm it is.',
      aiDisclosure: 'Asked an AI assistant to double-check my price/volume formulas and to cut the memo under 450 words. The analysis, numbers and recommendations are my own.',
    },
    {
      quality: 'solid',
      notes: solidNotes,
      files: [
        { path: 'README.md', content: solidReadme },
        { path: 'cfo_memo.md', content: solidMemo },
        { path: 'variance_table.csv', content: solidVarianceCsv },
        { path: 'driver_summary.csv', content: solidDriversCsv },
      ],
      feedback: 'Your math is right throughout, and the driver summary ties exactly to the $3,591K miss, including a correct rate/volume split on deposits. The memo buries the answer, though: the CFO has to read to the end to find the total, and Keystone is never called out as one-time, even though budget_assumptions.md says it was pulled forward from Q1 FY27. Keeping the hiring freeze in place to offset deposit costs treats a temporary saving as a fix, so focus your recommendations on the promo migration.',
      aiDisclosure: 'Used an AI chatbot to explain how a price/volume variance works before I built mine.',
    },
    {
      quality: 'weak',
      notes: weakNotes,
      files: [
        { path: 'README.md', content: weakReadme },
        { path: 'summary.md', content: weakSummary },
        { path: 'top_variances.csv', content: weakTopCsv },
      ],
      feedback: 'Your quarterly sums and percentages are correct, which is a good base. Deposit interest expense went up $3.06M, though, and for an expense line that is unfavorable: it is the single biggest reason for the miss, not a bright spot. Without drivers.csv the summary can\'t say why anything moved, the $45K Travel & training line gets more attention than it deserves, and there are no recommendations for the CFO to act on.',
      aiDisclosure: 'None.',
    },
  ],
  scripted: [
    {
      challengeId: 'ch_variance',
      studentId: 'stu_kwame',
      scores: null,
      feedback: null,
      templateIndex: 0,
      submittedDaysAgo: 1,
    },
  ],
};

export default mod;
