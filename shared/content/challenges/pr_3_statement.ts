import type { ChallengeModule } from '../lib.ts';

const brief = `## Context
Ember & Oak Coffee Co. is a two-year-old specialty roaster in Asheville, NC that sells almost entirely by subscription. It has 2,400 active subscribers on $18 bags and booked about $0.9M of revenue in 2026. The founders want to buy a $180,000 drum roaster in Q2 2027 so they can stop renting roasting time, and they have applied to Cobalt Ridge Bank's Small Business Lending team for a $250,000 revolving line of credit to cover it.

Our credit officers see dozens of borrower models like this a quarter. The ones that move fastest tie out, show their assumptions and answer "how much, and when?" Here you build that model.

## The task
Build an integrated quarterly model for Q1 2027 through Q4 2028 (8 quarters):

1. **Revenue build.** Each quarter: opening subscribers, churn, new subscribers (marketing spend / CAC), closing and average subscribers, bags shipped and revenue.
2. **Three statements.** An income statement, a cash flow statement (indirect method) and a balance sheet, all linked. Working capital comes from the days assumptions, depreciation from a schedule, and the line of credit draws to hold minimum cash and repays from any excess.
3. **Balance check.** Add a row showing assets minus liabilities and equity. It must be zero every quarter, with no plugs.
4. **Downside case.** Run 7.0% monthly churn and a $55 CAC and show what happens to the line.
5. **Lender summary.** One page: first draw, peak balance and quarter, payback, and what the downside changes.

## Constraints
- Time box: 5 hours.
- Use any spreadsheet tool. Export each statement to CSV, and write the summary in markdown.
- Model in whole dollars. Follow the conventions in \`README.md\` (90-day quarters, interest on opening balances) so the model has no circular references.
- Out of scope: monthly detail, taxes (the company is an LLC), valuation and any equity raise.
- AI tools are allowed. Say how you used them.

## What we provide
- \`assumptions.csv\`: every driver by quarter, with notes
- \`opening_balance_sheet.csv\`: the balance sheet at December 31, 2026
- \`lender_request.md\`: what our relationship manager needs to see
- \`README.md\`: modeling conventions and a suggested build order
`;

const assumptionsCsv = `assumption,unit,Q1-27,Q2-27,Q3-27,Q4-27,Q1-28,Q2-28,Q3-28,Q4-28,notes
Opening subscribers,subscribers,2400,,,,,,,,Active paying subscribers on Jan 1 2027
Monthly churn,% of subscribers,6.0%,6.0%,6.0%,6.0%,6.0%,6.0%,6.0%,6.0%,Trailing 6-month average; apply to opening subscribers
Marketing spend,$ per quarter,60000,60000,75000,90000,90000,90000,100000,100000,Paid social + referral credits
Blended CAC,$ per new subscriber,45,45,45,45,45,45,45,45,Marketing spend / new subscribers; trailing 2026 average
Price per bag,$,18.00,18.00,18.00,18.00,18.00,18.00,18.00,18.00,12 oz bag; shipping included in price
Bags per subscriber,bags per month,2.0,2.0,2.0,2.0,2.0,2.0,2.0,2.0,Most subscribers are on the 2-bag plan
COGS per bag,$,7.00,7.00,7.00,7.00,7.00,7.00,7.00,7.00,Green coffee + roasting + bag and label
Shipping,$ per subscriber per month,4.00,4.00,4.00,4.00,4.00,4.00,4.00,4.00,One box a month; regional carrier contract
Payment processing,% of revenue,3.0%,3.0%,3.0%,3.0%,3.0%,3.0%,3.0%,3.0%,Card processor fee
Payroll,$ per quarter,96000,96000,120000,120000,120000,120000,126000,126000,Head roaster hire from Q3-27; raises in Q3-28
Rent,$ per quarter,22500,22500,22500,22500,22500,22500,22500,22500,Roastery + warehouse lease; $7500/month
Other G&A,$ per quarter,9000,9000,9000,9000,9000,9000,9000,9000,Software, insurance, accounting
Capex: new roaster,$,0,180000,0,0,0,0,0,0,15 kg drum roaster; paid on delivery in Q2-27
Roaster useful life,years,7,,,,,,,,Straight-line; depreciation starts the quarter after purchase (Q3-27)
Depreciation on existing equipment,$ per quarter,3000,3000,3000,3000,3000,3000,3000,3000,Continues through the forecast
Inventory days,days of COGS,45,45,45,45,45,45,45,45,Green coffee bought in 6-week lots; COGS excludes shipping
Receivable days,days of revenue,4,4,4,4,4,4,4,4,Card settlement lag
Payables days,days of COGS,30,30,30,30,30,30,30,30,Importer terms: net 30
Days per quarter,days,90,90,90,90,90,90,90,90,Use 90 for all days calculations
Equipment note principal,$ per quarter,5000,5000,5000,5000,5000,5000,5000,5000,Fixed principal payment
Equipment note rate,% annual,8.0%,8.0%,8.0%,8.0%,8.0%,8.0%,8.0%,8.0%,Interest on the opening balance of each quarter
Line of credit rate,% annual,9.5%,9.5%,9.5%,9.5%,9.5%,9.5%,9.5%,9.5%,Interest on the opening balance of each quarter
Line of credit limit,$,250000,,,,,,,,Requested facility
Minimum cash balance,$,50000,50000,50000,50000,50000,50000,50000,50000,Draw on the line to stay at or above this
Income tax,% of pre-tax income,0%,0%,0%,0%,0%,0%,0%,0%,LLC taxed as a partnership; no entity-level tax
`;

const openingBsCsv = `line,amount_usd,notes
Cash,140000,Operating account at Cobalt Ridge Bank
Accounts receivable,11000,Card settlements in transit
Inventory,50000,Green and roasted coffee and packaging
PP&E at cost,60000,Current roaster and packing equipment
Accumulated depreciation,-24000,
Total assets,237000,
Accounts payable,33000,Green coffee importers
Equipment note,45000,8.0%; $5000 principal per quarter
Line of credit,0,Not yet in place
Total liabilities,78000,
Contributed capital,300000,Founders and two angel investors
Retained earnings,-141000,Accumulated losses since 2024 launch
Total equity,159000,
Total liabilities & equity,237000,
`;

const lenderRequest = `**From:** Darnell Hughes, Relationship Manager, Small Business Lending <dhughes@cobaltridge.example>
**To:** Tess Okonkwo, Co-founder & CEO, Ember & Oak Coffee Co. <tess@emberandoak.example>
**Date:** Monday, January 11, 2027
**Subject:** Line of credit application: what we need from you

Hi Tess,

Thanks for sending over the application for the $250,000 revolving line. Before it goes to credit committee, I need a quarterly projection for 2027 and 2028 that answers four questions:

1. **When do you first draw on the line, and how much?** I assume the roaster purchase in Q2 drives it, but I'd like to see it in the numbers.
2. **What is the peak balance, and in which quarter?** Committee wants at least $25,000 of headroom under the limit in the base case.
3. **When is the line paid back to zero?** We expect a revolver like this to clean up within about 18 months.
4. **What happens if growth disappoints?** Show me a case with 7% monthly churn and a $55 acquisition cost. If that breaks the limit, tell me what you would do about it.

Please send it as income statement, cash flow and balance sheet, linked, with a balance check. If the balance sheet doesn't balance, committee will send it back before anyone reads the narrative.

Terms we'd expect to quote: 9.5% variable, interest-only, $250,000 limit, minimum operating cash of $50,000 kept with us.

Best,
Darnell
`;

const starterReadme = `# Ember & Oak Coffee Co.: 3-statement model starter kit

This kit has everything you need to build the 8-quarter model the bank asked for in \`lender_request.md\`.

## Files
| File | Contents |
| --- | --- |
| \`assumptions.csv\` | Every driver by quarter (Q1-27 to Q4-28) with a note on where it came from |
| \`opening_balance_sheet.csv\` | Balance sheet at December 31, 2026. It balances: $237,000 = $237,000. |
| \`lender_request.md\` | The relationship manager's four questions |

## Conventions (please follow these so results are comparable)
- **Quarters are 90 days** for every days-based calculation.
- **Churn:** churned subscribers = opening subscribers x (1 - (1 - monthly churn)^3), rounded to whole subscribers. At 6.0%, that is 16.94% a quarter.
- **New subscribers** = marketing spend / CAC, rounded.
- **Average subscribers** = (opening + closing) / 2. Revenue, COGS and shipping run on average subscribers.
- **Bags shipped** = average subscribers x bags per month x 3. Revenue = bags x price. COGS = bags x COGS per bag.
- **Working capital:** receivables = revenue x days / 90; inventory and payables = COGS x days / 90. COGS here excludes shipping and processing.
- **Depreciation:** the roaster depreciates straight-line over 7 years (28 quarters), starting the quarter after purchase.
- **Interest** on the equipment note and the line of credit = opening balance x annual rate / 4. That keeps the model free of circular references.
- **Line of credit:** draw whatever keeps ending cash at $50,000 or above. Repay with any cash above $50,000 until the line is at zero.
- Round each line to whole dollars.

## Suggested build order
1. Revenue build (subscribers to bags to revenue)
2. Income statement down to net income
3. Working capital and depreciation schedules
4. Cash flow statement before financing, then the line of credit logic
5. Balance sheet and balance check
6. Downside case (change only churn and CAC), then the lender summary

## What to submit
A zip with your CSV exports, a one-page lender summary (markdown) and a README explaining how the files fit together.
`;

/* ───────────── Strong template ───────────── */

const strongRevenueCsv = `line,Q1-27,Q2-27,Q3-27,Q4-27,Q1-28,Q2-28,Q3-28,Q4-28
Opening subscribers,2400,3326,4096,5069,6210,7158,7945,8821
Churned (6.0%/month = 16.94%/quarter),-407,-563,-694,-859,-1052,-1213,-1346,-1494
Marketing spend ($),60000,60000,75000,90000,90000,90000,100000,100000
New subscribers (spend / $45 CAC),1333,1333,1667,2000,2000,2000,2222,2222
Closing subscribers,3326,4096,5069,6210,7158,7945,8821,9549
Average subscribers,2863,3711,4582.5,5639.5,6684,7551.5,8383,9185
Bags shipped (avg x 2 bags x 3 months),17178,22266,27495,33837,40104,45309,50298,55110
Price per bag ($),18,18,18,18,18,18,18,18
Subscription revenue ($),309204,400788,494910,609066,721872,815562,905364,991980
`;

const strongStatementsCsv = `line,Q1-27,Q2-27,Q3-27,Q4-27,Q1-28,Q2-28,Q3-28,Q4-28
INCOME STATEMENT,,,,,,,,
Revenue,309204,400788,494910,609066,721872,815562,905364,991980
COGS: coffee & packaging,-120246,-155862,-192465,-236859,-280728,-317163,-352086,-385770
Shipping,-34356,-44532,-54990,-67674,-80208,-90618,-100596,-110220
Payment processing,-9276,-12024,-14847,-18272,-21656,-24467,-27161,-29759
Gross profit,145326,188370,232608,286261,339280,383314,425521,466231
Marketing,-60000,-60000,-75000,-90000,-90000,-90000,-100000,-100000
Payroll,-96000,-96000,-120000,-120000,-120000,-120000,-126000,-126000
Rent,-22500,-22500,-22500,-22500,-22500,-22500,-22500,-22500
Other G&A,-9000,-9000,-9000,-9000,-9000,-9000,-9000,-9000
EBITDA,-42174,870,6108,44761,97780,141814,168021,208731
Depreciation,-3000,-3000,-9429,-9429,-9429,-9429,-9429,-9429
Operating income (EBIT),-45174,-2130,-3321,35332,88351,132385,158592,199302
Interest expense,-900,-800,-4471,-4695,-4059,-2144,-300,-200
Net income,-46074,-2930,-7792,30637,84292,130241,158292,199102
CASH FLOW (INDIRECT),,,,,,,,
Net income,-46074,-2930,-7792,30637,84292,130241,158292,199102
Add back depreciation,3000,3000,9429,9429,9429,9429,9429,9429
(Increase) in receivables,-2742,-4071,-4183,-5074,-5013,-4164,-3991,-3850
(Increase) in inventory,-10123,-17808,-18301,-22198,-21934,-18218,-17461,-16842
Increase in payables,7082,11872,12201,14798,14623,12145,11641,11228
Cash from operations,-48857,-9937,-8646,27592,81397,129433,157910,199067
Capex: roaster,0,-180000,0,0,0,0,0,0
Equipment note principal,-5000,-5000,-5000,-5000,-5000,-5000,-5000,-5000
Line of credit draw,0,158794,13646,0,0,0,0,0
Line of credit repayment,0,0,0,-22592,-76397,-73451,0,0
Net change in cash,-53857,-36143,0,0,0,50982,152910,194067
Ending cash,86143,50000,50000,50000,50000,100982,253892,447959
BALANCE SHEET,,,,,,,,
Cash,86143,50000,50000,50000,50000,100982,253892,447959
Accounts receivable (4 days),13742,17813,21996,27070,32083,36247,40238,44088
Inventory (45 days of COGS),60123,77931,96232,118430,140364,158582,176043,192885
PP&E at cost,60000,240000,240000,240000,240000,240000,240000,240000
Accumulated depreciation,-27000,-30000,-39429,-48858,-58287,-67716,-77145,-86574
Total assets,193008,355744,368799,386642,404160,468095,633028,838358
Accounts payable (30 days of COGS),40082,51954,64155,78953,93576,105721,117362,128590
Equipment note,40000,35000,30000,25000,20000,15000,10000,5000
Line of credit,0,158794,172440,149848,73451,0,0,0
Contributed capital,300000,300000,300000,300000,300000,300000,300000,300000
Retained earnings,-187074,-190004,-197796,-167159,-82867,47374,205666,404768
Total liabilities & equity,193008,355744,368799,386642,404160,468095,633028,838358
BALANCE CHECK (assets - L&E),0,0,0,0,0,0,0,0
DEPRECIATION SCHEDULE,,,,,,,,
Existing equipment,3000,3000,3000,3000,3000,3000,3000,3000
New roaster ($180000 / 28 quarters),0,0,6429,6429,6429,6429,6429,6429
Total depreciation,3000,3000,9429,9429,9429,9429,9429,9429
Roaster net book value,0,180000,173571,167142,160713,154284,147855,141426
`;

const strongScenariosCsv = `line,Q1-27,Q2-27,Q3-27,Q4-27,Q1-28,Q2-28,Q3-28,Q4-28
Base: closing subscribers,3326,4096,5069,6210,7158,7945,8821,9549
Base: revenue,309204,400788,494910,609066,721872,815562,905364,991980
Base: EBITDA,-42174,870,6108,44761,97780,141814,168021,208731
Base: ending cash,86143,50000,50000,50000,50000,100982,253892,447959
Base: line of credit balance,0,158794,172440,149848,73451,0,0,0
Downside (7% churn + $55 CAC): closing subscribers,3021,3521,4196,5011,5667,6194,6800,7288
Downside (7% churn + $55 CAC): revenue,292734,353268,416718,497178,576612,640494,701676,760752
Downside (7% churn + $55 CAC): EBITDA,-49915,-21464,-30643,-7826,29508,59532,72288,100053
Downside (7% churn + $55 CAC): ending cash,80202,50000,50000,50000,50000,50000,50000,50000
Downside (7% churn + $55 CAC): line of credit balance,0,183677,231314,259026,249848,208629,153282,68523
Downside + head roaster hire moved to Q1-28: closing subscribers,3021,3521,4196,5011,5667,6194,6800,7288
Downside + head roaster hire moved to Q1-28: revenue,292734,353268,416718,497178,576612,640494,701676,760752
Downside + head roaster hire moved to Q1-28: EBITDA,-49915,-21464,-6643,16174,29508,59532,72288,100053
Downside + head roaster hire moved to Q1-28: ending cash,80202,50000,50000,50000,50000,50000,50000,50000
Downside + head roaster hire moved to Q1-28: line of credit balance,0,183677,207314,210456,200124,157724,101168,15172
`;

const strongLenderSummary = `# Ember & Oak Coffee Co.: line of credit summary

**Prepared for:** Cobalt Ridge Bank, Small Business Lending · **Period:** Q1 2027–Q4 2028 · **Model:** \`three_statement_model.csv\`

## Bottom line
In the base case Ember & Oak **first draws $158,794 in Q2 2027** to pay for the roaster. The line **peaks at $172,440 at the end of Q3 2027**, leaving $77,560 of headroom under the $250,000 limit, and is **repaid to zero in Q2 2028**, about 12 months after the first draw.

## Answers to the four questions
| Question | Base case | Downside (7% churn, $55 CAC) |
| --- | --- | --- |
| First draw | Q2-27: $158,794 | Q2-27: $183,677 |
| Peak balance | $172,440 (Q3-27) | **$259,026 (Q4-27), $9,026 over the limit** |
| Repaid to zero | Q2-28 | Not within the forecast ($68,523 left in Q4-28) |
| EBITDA turns positive | Q2-27, and stays positive | Q1-28 |

## Why the line is needed
The roaster ($180,000) lands in a quarter when the business is roughly cash-neutral at the EBITDA line. Growth also absorbs working capital: receivables, inventory and payables together use $38,547 of cash in 2027, because green coffee is held about 45 days but paid on 30-day terms. EBITDA turns positive in Q2-27 and reaches $44,761 by Q4-27, and that is what pays the line down.

## Downside and mitigation
Higher churn plus more expensive acquisition leaves about 2,260 fewer subscribers by the end of 2028 and pushes the peak $9,026 over the limit. **Moving the head roaster hire from Q3-27 to Q1-28** (saving $24,000 a quarter for two quarters) brings the downside peak to **$210,456, leaving $39,544 of headroom**. Cutting marketing does not help much, because every marketing dollar we cut also cuts subscribers and revenue.

## Line of credit balance by quarter ($K)
<svg xmlns="http://www.w3.org/2000/svg" width="420" height="160" viewBox="0 0 420 160" font-family="sans-serif" font-size="10">
<line x1="30" y1="30" x2="410" y2="30" stroke="#DC2626" stroke-dasharray="4 3"/>
<text x="32" y="25" fill="#DC2626">$250K limit</text>
<polyline fill="none" stroke="#059669" stroke-width="2" points="50,130 100,66 150,61 200,70 250,101 300,130 350,130 400,130"/>
<polyline fill="none" stroke="#6B7280" stroke-width="2" stroke-dasharray="5 3" points="50,130 100,57 150,37 200,26 250,30 300,47 350,69 400,103"/>
<text x="40" y="148">Q1-27</text><text x="140" y="148">Q3-27</text><text x="240" y="148">Q1-28</text><text x="340" y="148">Q3-28</text>
<text x="300" y="120" fill="#059669">Base</text><text x="355" y="62" fill="#6B7280">Downside</text>
</svg>

## Key assumptions to diligence
- **Churn of 6.0% a month** is the trailing six-month average. Each extra point of monthly churn adds about $14K to the peak draw (7% alone gives a $186,207 peak).
- **CAC is held at $45** even as marketing spend rises 67%. This is the assumption I trust least: most of the downside breach comes from the $55 CAC, not the churn.
- **Inventory at 45 days** depends on 6-week green coffee lots. Moving to monthly lots would release about $30K of cash.
`;

const strongReadme = `# Ember & Oak: 8-quarter integrated model

I built the model in a spreadsheet with one tab per schedule and exported each tab to CSV. All amounts are whole dollars. Expenses and cash outflows are negative.

## Files
| File | What it is |
| --- | --- |
| \`lender_summary.md\` | One page for the bank: first draw, peak, payback, downside and mitigation. **Start here.** |
| \`revenue_build.csv\` | Subscriber roll-forward: opening, churn, new from marketing / CAC, closing, average, bags shipped and revenue. |
| \`three_statement_model.csv\` | Base case: income statement, indirect cash flow, balance sheet, balance check and depreciation schedule. |
| \`scenarios.csv\` | Base, downside (7% churn, $55 CAC) and downside with the delayed hire: subscribers, revenue, EBITDA, cash and line balance. |

## How it's linked
1. Revenue build to income statement: average subscribers drive bags, which drive revenue, COGS and shipping.
2. Working capital is driven by days on a 90-day quarter: AR is 4 days of revenue, inventory 45 days of COGS, AP 30 days of COGS. The cash flow statement takes the change in each balance.
3. The depreciation schedule feeds both the income statement and accumulated depreciation.
4. Cash before financing = opening cash + CFO + capex - note principal. The line draws max(0, 50,000 - that) and otherwise repays min(line balance, excess over 50,000).
5. Interest uses opening balances, so there is no circularity.
6. Retained earnings = prior + net income. The balance check row is **0 in all 8 quarters**, with no plugs.

## Checks
- The opening balance sheet ties at $237,000.
- Ending cash on the cash flow statement equals cash on the balance sheet every quarter.
- The downside changes only two inputs (churn and CAC). Everything else flows through.

## Simplifications
- One blended subscriber pool with the same churn for new and existing subscribers. In reality, first-month churn is usually higher.
- CAC is flat at $45 even though quarterly marketing spend rises 67% over the forecast.
- No price increase over the forecast, even though one is plausible in 2028.
`;

const strongNotes = `### What I built
An 8-quarter integrated model. A subscriber-based revenue build feeds an income statement, an indirect cash flow and a balance sheet that balances to $0 every quarter. Working capital is driven by days, there is a depreciation schedule for the new roaster, and the line of credit draws and repays automatically around the $50K cash floor. I added a downside case, a mitigation case and a one-page summary for the lender.

### Key decisions & trade-offs
- I calculated interest on opening balances, as the README suggests. That keeps the model free of circular references, at the cost of slightly understating interest in the quarter of the big draw.
- The downside breaks the $250K limit by $9K, so I tested two fixes. Cutting marketing barely helped because it also cuts subscribers. Delaying the head roaster hire by two quarters worked: the peak falls to $210K, with $39.5K of headroom.
- I kept one blended subscriber pool rather than true monthly cohorts, which made the build faster to audit in a 5-hour box.

### What I'd do with more time
Split new and existing subscribers so first-month churn can be higher, let CAC rise as marketing spend scales, and add a small sensitivity table of peak draw against churn and CAC.
`;

/* ───────────── Solid template ───────────── */

const solidRevenueCsv = `line,Q1-27,Q2-27,Q3-27,Q4-27,Q1-28,Q2-28,Q3-28,Q4-28
Opening subscribers,2400,3326,4096,5069,6210,7158,7945,8821
Churned,-407,-563,-694,-859,-1052,-1213,-1346,-1494
Marketing spend ($),60000,60000,75000,90000,90000,90000,100000,100000
New subscribers,1333,1333,1667,2000,2000,2000,2222,2222
Closing subscribers,3326,4096,5069,6210,7158,7945,8821,9549
Average subscribers,2863,3711,4582.5,5639.5,6684,7551.5,8383,9185
Bags shipped (avg x 2 bags x 3 months),17178,22266,27495,33837,40104,45309,50298,55110
Price per bag ($),18,18,18,18,18,18,18,18
Subscription revenue ($),309204,400788,494910,609066,721872,815562,905364,991980
`;

const solidStatementsCsv = `line,Q1-27,Q2-27,Q3-27,Q4-27,Q1-28,Q2-28,Q3-28,Q4-28
INCOME STATEMENT,,,,,,,,
Revenue,309204,400788,494910,609066,721872,815562,905364,991980
COGS: coffee & packaging,-120246,-155862,-192465,-236859,-280728,-317163,-352086,-385770
Shipping,-34356,-44532,-54990,-67674,-80208,-90618,-100596,-110220
Payment processing,-9276,-12024,-14847,-18272,-21656,-24467,-27161,-29759
Gross profit,145326,188370,232608,286261,339280,383314,425521,466231
Marketing,-60000,-60000,-75000,-90000,-90000,-90000,-100000,-100000
Payroll,-96000,-96000,-120000,-120000,-120000,-120000,-126000,-126000
Rent,-22500,-22500,-22500,-22500,-22500,-22500,-22500,-22500
Other G&A,-9000,-9000,-9000,-9000,-9000,-9000,-9000,-9000
EBITDA,-42174,870,6108,44761,97780,141814,168021,208731
Depreciation,-3000,-3000,-9400,-9429,-9429,-9429,-9429,-9429
Operating income (EBIT),-45174,-2130,-3292,35332,88351,132385,158592,199302
Interest expense,-900,-800,-4168,-4164,-3242,-1040,-300,-200
Net income,-46074,-2930,-7460,31168,85109,131345,158292,199102
CASH FLOW (INDIRECT),,,,,,,,
Net income,-46074,-2930,-7460,31168,85109,131345,158292,199102
Add back depreciation,3000,3000,9400,9429,9429,9429,9429,9429
(Increase) in receivables,-1000,0,0,0,0,0,0,0
(Increase) in inventory,-2000,-3000,-3000,-3000,-3000,-3000,-3000,-3000
Increase in payables,1000,2000,2000,2000,2000,2000,2000,2000
Cash from operations,-45074,-930,940,39597,93538,139774,166721,207531
Capex: roaster,0,-180000,0,0,0,0,0,0
Equipment note principal,-5000,-5000,-5000,-5000,-5000,-5000,-5000,-5000
Line of credit draw,0,146004,4060,0,0,0,0,0
Line of credit repayment,0,0,0,-34597,-88538,-26929,0,0
Net change in cash,-50074,-39926,0,0,0,107845,161721,202531
Ending cash,89926,50000,50000,50000,50000,157845,319566,522097
BALANCE SHEET,,,,,,,,
Cash,89926,50000,50000,50000,50000,157845,319566,522097
Accounts receivable,12000,12000,12000,12000,12000,12000,12000,12000
Inventory,52000,55000,58000,61000,64000,67000,70000,73000
PP&E at cost,60000,240000,240000,240000,240000,240000,240000,240000
Accumulated depreciation,-27000,-30000,-39429,-48858,-58287,-67716,-77145,-86574
Total assets,186926,327000,320571,314142,307713,409129,564421,760523
Accounts payable,34000,36000,38000,40000,42000,44000,46000,48000
Equipment note,40000,35000,30000,25000,20000,15000,10000,5000
Line of credit,0,146004,150064,115467,26929,0,0,0
Contributed capital,300000,300000,300000,300000,300000,300000,300000,300000
Retained earnings,-187074,-190004,-197464,-166296,-81187,50158,208450,407552
Rounding adjustment,0,0,-29,-29,-29,-29,-29,-29
Total liabilities & equity,186926,327000,320571,314142,307713,409129,564421,760523
BALANCE CHECK (assets - L&E),0,0,0,0,0,0,0,0
`;

const solidLenderSummary = `# Lender summary: Ember & Oak Coffee Co.

## Line of credit
- **First draw:** Q2 2027, $146,004, when the $180,000 roaster is purchased.
- **Peak balance:** $150,064 at the end of Q3 2027, well under the $250,000 limit.
- **Repaid:** in full in Q2 2028.

## Business outlook
Subscribers grow from 2,400 to 9,549 by the end of 2028 as marketing spend rises from $60,000 to $100,000 a quarter. Revenue grows from $309,204 in Q1 2027 to $991,980 in Q4 2028. EBITDA is positive from Q2 2027, and net income from Q4 2027.

Gross margin holds at 47% after shipping and payment processing, because price and unit costs are held flat.

## Cash
Ending cash stays at the $50,000 minimum from Q2 2027 to Q1 2028 while the line is drawn, then builds to $522,097 by the end of 2028.

## Conclusion
The model shows Ember & Oak can support a $250,000 line comfortably. The peak draw uses about 60% of the limit, and the line is paid back within a year.
`;

const solidReadme = `# Ember & Oak Coffee: 3-statement model

Built in a spreadsheet. Each tab was exported to CSV. Amounts are in whole dollars, and costs are shown as negatives.

## Files
- \`revenue_build.csv\`: subscribers by quarter (opening, churned, new, closing, average), bags shipped and revenue.
- \`three_statements.csv\`: income statement, cash flow statement (indirect method) and balance sheet for Q1-27 to Q4-28, with a balance check row.
- \`lender_summary.md\`: summary of the line of credit for the bank.

## How the model works
- New subscribers = marketing spend / $45 CAC. Churn is 6% a month applied to opening subscribers.
- Revenue = average subscribers x 2 bags x 3 months x $18.
- Net income flows to the cash flow statement. Depreciation is added back and working capital changes are subtracted.
- Receivables, inventory and payables are entered on the balance sheet each quarter. I estimated them from the opening balance sheet and grew inventory and payables steadily as the business grows.
- The line of credit draws to keep cash at $50,000 and repays when cash is above $50,000.
- Retained earnings roll forward from net income.

## Balance check
The balance check is 0 in all quarters. In Q3-27 I needed a -$29 rounding adjustment in equity to get it to balance. I think it comes from the roaster depreciation not dividing evenly ($180,000 / 28 = $6,428.57), and it carries forward from there.

## Results
The line is first drawn in Q2-27, peaks at $150,064 in Q3-27 and is repaid by Q2-28.
`;

const solidNotes = `**What I built**
A linked three-statement model for 8 quarters with a subscriber-based revenue build. Net income flows into the cash flow statement, the cash flow drives the cash balance, and the line of credit draws and repays to hold the $50K minimum. The balance sheet has a check row, and there is a short lender summary.

**Key decisions & trade-offs**
To save time I entered receivables, inventory and payables directly instead of building a days calculation. I started from the opening balances and grew them steadily. I used interest on opening balances to avoid circularity. I had a small imbalance in Q3-27 and added a $29 rounding adjustment in equity so the check shows zero. I'm fairly sure it's rounding on the roaster depreciation.

**What I'd do with more time**
Build a downside case with higher churn, link working capital to the days assumptions, and find the source of the Q3 rounding difference so I can remove the adjustment.
`;

/* ───────────── Weak template ───────────── */

const weakIncomeCsv = `line,Q1-27,Q2-27,Q3-27,Q4-27,Q1-28,Q2-28,Q3-28,Q4-28
Revenue,309204,400788,494910,609066,721872,815562,905364,991980
Cost of goods sold,-120246,-155862,-192465,-236859,-280728,-317163,-352086,-385770
Shipping,-34356,-44532,-54990,-67674,-80208,-90618,-100596,-110220
Payment processing,-9276,-12024,-14847,-18272,-21656,-24467,-27161,-29759
Gross profit,145326,188370,232608,286261,339280,383314,425521,466231
Marketing,-60000,-60000,-75000,-90000,-90000,-90000,-100000,-100000
Payroll,-96000,-96000,-120000,-120000,-120000,-120000,-126000,-126000
Rent,-22500,-22500,-22500,-22500,-22500,-22500,-22500,-22500
Other G&A,-9000,-9000,-9000,-9000,-9000,-9000,-9000,-9000
Depreciation,-3000,-3000,-9429,-9429,-9429,-9429,-9429,-9429
Interest expense,-900,-800,-700,-600,-500,-400,-300,-200
Net income,-46074,-2930,-4021,34732,87851,131985,158292,199102
Cash (opening cash + net income),93926,90996,86975,121707,209558,341543,499835,698937
`;

const weakBalanceCsv = `line,Q1-27,Q2-27,Q3-27,Q4-27,Q1-28,Q2-28,Q3-28,Q4-28
Cash,93926,90996,86975,121707,209558,341543,499835,698937
Inventory,50000,50000,50000,50000,50000,50000,50000,50000
Equipment (net),33000,210000,200571,191142,181713,172284,162855,153426
Total assets,176926,350996,337546,362849,441271,563827,712690,902363
Accounts payable,33000,33000,33000,33000,33000,33000,33000,33000
Equipment note,40000,35000,30000,25000,20000,15000,10000,5000
Owner equity,112926,109996,105975,140707,228558,360543,518835,717937
Total liabilities & equity,185926,177996,168975,198707,281558,408543,561835,755937
Difference,-9000,173000,168571,164142,159713,155284,150855,146426
`;

const weakReadme = `# Ember & Oak Coffee Co. Financial Model

This is my financial model for the Ember & Oak line of credit application.

## Files
- \`income_statement.csv\`: quarterly income statement for 2027–2028
- \`balance_sheet.csv\`: quarterly balance sheet

## Approach
I started with revenue. Each quarter I took subscribers, applied churn and added new subscribers from marketing spend, then multiplied by bags and price. I subtracted COGS, shipping, processing and operating expenses to get net income. Depreciation includes the new roaster from Q3-27.

For cash, I started with the $140,000 opening balance and added each quarter's net income. Cash is lowest in Q3-27 at $86,975, which is still above the $50,000 minimum, so the company does not need to draw on the line of credit in the base case. The line works as a safety net.

## Balance sheet
I built a balance sheet with cash, inventory, equipment, payables, the equipment note and equity. It does not balance yet. The difference is about $170,000 from Q2-27, which I think is related to the roaster. I ran out of time to fix it.

## Results
- Revenue grows from $309,204 to $991,980 a quarter.
- Net income turns positive in Q4-27.
- Year-end 2028 cash is $698,937.
`;

const weakNotes = `**What I built**
An income statement for 8 quarters, based on subscribers, plus a balance sheet. I calculated cash as opening cash plus cumulative net income, so I could see whether the company ever falls below the $50K minimum.

**Key decisions & trade-offs**
I spent most of my time on the revenue and expense lines because the income statement is the most important part for showing that the business is profitable. I kept the balance sheet simple and held inventory and payables at their opening values. I didn't build a separate cash flow statement because cash is just the running total of net income.

**What I'd do with more time**
Fix the balance sheet so it balances, add a cash flow statement and add a downside scenario.
`;

const mod: ChallengeModule = {
  challenge: {
    id: 'pr_3_statement',
    kind: 'practice',
    companyId: 'co_cobalt',
    title: 'Build a 3-statement model for a coffee subscription startup',
    summary: 'Build an 8-quarter linked model and tell the bank when its $250K line gets drawn.',
    type: 'finance',
    skills: ['3-statement modeling', 'Working capital', 'Cash flow forecasting', 'Scenario analysis', 'Excel / Sheets', 'Credit analysis'],
    classroomConcepts: [
      { concept: 'Indirect-method statement of cash flows', course: 'Financial Accounting' },
      { concept: 'Working capital and the cash conversion cycle', course: 'Corporate Finance' },
      { concept: 'Straight-line depreciation and the accrual basis', course: 'Financial Accounting' },
      { concept: 'Revolving credit and short-term financing', course: 'Corporate Finance' },
    ],
    difficulty: 'advanced',
    estHours: 5,
    brief,
    deliverables: [
      'Subscriber-based revenue build for 8 quarters',
      'Linked income statement, cash flow and balance sheet with a balance check',
      'Downside scenario (7% churn, $55 CAC) with its effect on the line',
      'One-page lender summary: first draw, peak, payback',
    ],
    rubric: [
      { id: 'integrity', name: 'Model integrity', description: 'The three statements are fully linked, cash ties to the balance sheet, and the balance check is zero every quarter with no plugs.', weight: 30 },
      { id: 'assumptions', name: 'Assumptions', description: 'Every driver comes from the assumptions file: working capital from days, depreciation from a schedule, and the line of credit from the cash floor. Weak assumptions are flagged.', weight: 25 },
      { id: 'revenue_build', name: 'Revenue build', description: 'Revenue comes from a subscriber roll-forward (churn, marketing / CAC, average subscribers, bags) that anyone can audit line by line.', weight: 20 },
      { id: 'usability', name: 'Usability', description: 'Inputs, calculations and outputs are clearly separated and labeled, so a lender could change churn or CAC and follow the results.', weight: 10 },
      { id: 'communication', name: 'Communication', description: 'The lender summary answers first draw, peak, payback and downside in plain numbers, and proposes a fix if the limit is breached.', weight: 15 },
    ],
    applicantCap: null,
    status: 'open',
    hiringFor: null,
    starterFiles: [
      { path: 'README.md', content: starterReadme },
      { path: 'lender_request.md', content: lenderRequest },
      { path: 'assumptions.csv', content: assumptionsCsv },
      { path: 'opening_balance_sheet.csv', content: openingBsCsv },
    ],
    aiHints: {
      testing: 'Whether you understand how the three statements connect, especially that cash is not net income once you add capex, working capital and debt. It also tests whether you can turn a model into the one answer a lender cares about: how much they lend, and when they get it back.',
      steps: [
        'Build the subscriber roll-forward first and check that Q1-27 revenue makes sense against 2,400 subscribers at about $36 a month.',
        'Build the income statement down to net income, with depreciation coming from a schedule that starts the roaster in Q3-27.',
        'Calculate receivables, inventory and payables from days on a 90-day quarter, then take the changes into an indirect cash flow statement.',
        'Add the financing block: note principal, then a line of credit that draws to the $50K floor and repays from any excess.',
        'Build the balance sheet, add a check row and fix the links until it is zero every quarter, without plugs.',
        'Change only churn and CAC for the downside, then write the lender summary from the line of credit row.',
      ],
      greatLooksLike: 'The balance check is zero in all 8 quarters with no plugs, and working capital is driven by days. The lender summary opens with the first draw in Q2-27, a peak of about $172K in Q3-27 and repayment by Q2-28. It then shows that the downside breaks the $250K limit and proposes a specific fix, such as delaying a hire, with the new peak.',
      pitfalls: [
        'Treating net income as cash and ignoring the $180K roaster and working capital, which hides the draw entirely.',
        'Forcing the balance sheet to balance with a plug instead of finding the broken link.',
        'Hard-coding working capital balances instead of driving them from days, which understates the cash need as the business grows.',
        'Interest on average balances, which creates a circular reference that breaks when you change a scenario.',
        'A lender summary that celebrates revenue growth but never says the peak draw or when it is repaid.',
      ],
    },
    deadlineInDays: null,
    createdDaysAgo: 110,
    seed: { participants: 11, submissions: 4, scored: 4 },
  },
  templates: [
    {
      quality: 'strong',
      notes: strongNotes,
      files: [
        { path: 'README.md', content: strongReadme },
        { path: 'lender_summary.md', content: strongLenderSummary },
        { path: 'revenue_build.csv', content: strongRevenueCsv },
        { path: 'three_statement_model.csv', content: strongStatementsCsv },
        { path: 'scenarios.csv', content: strongScenariosCsv },
      ],
      feedback: 'Your model is clean all the way through: the balance check is zero in all 8 quarters with no plugs, working capital comes from days, and the line of credit logic handles both draws and repayments. The lender summary answers all four of the bank\'s questions in the first table, and testing two fixes for the downside breach (and explaining why cutting marketing fails) is the kind of judgment credit committees look for. Next, give new subscribers a higher first-month churn than existing ones and let CAC rise with spend. Those are the two assumptions a lender would push on.',
      aiDisclosure: 'Used an AI assistant to review my line of credit draw/repay formulas for edge cases and to suggest the SVG chart layout. The model and the summary are my own.',
    },
    {
      quality: 'solid',
      notes: solidNotes,
      files: [
        { path: 'README.md', content: solidReadme },
        { path: 'lender_summary.md', content: solidLenderSummary },
        { path: 'revenue_build.csv', content: solidRevenueCsv },
        { path: 'three_statements.csv', content: solidStatementsCsv },
      ],
      feedback: 'The statements are properly linked and the subscriber build is easy to audit, which is a strong core. Two things hold it back. Working capital is typed in, so inventory grows only $3K a quarter while quarterly COGS grows $34–44K, and the peak draw comes out about $22K too low. The $29 Q3 adjustment isn\'t rounding either: the income statement uses a typed $6,400 for roaster depreciation while the schedule uses $6,429. Without a downside case, the lender can\'t see how close a bad year gets to the $250K limit.',
      aiDisclosure: 'Asked an AI chatbot how to lay out an indirect cash flow statement. All formulas and numbers are mine.',
    },
    {
      quality: 'weak',
      notes: weakNotes,
      files: [
        { path: 'README.md', content: weakReadme },
        { path: 'income_statement.csv', content: weakIncomeCsv },
        { path: 'balance_sheet.csv', content: weakBalanceCsv },
      ],
      feedback: 'Your revenue build matches the assumptions, and the income statement is laid out clearly. Cash isn\'t net income, though: the $180K roaster, working capital and the note repayments all use cash that never touches the income statement. That is why your balance sheet is off by about $170K from Q2-27, and why the model says the line is never needed when it is actually drawn in Q2-27. Build the cash flow statement next and let it set the cash balance. The balance sheet will then show you what\'s still missing.',
      aiDisclosure: 'None.',
    },
  ],
  scripted: [
    {
      challengeId: 'pr_3_statement',
      studentId: 'stu_kwame',
      scores: { integrity: 5, assumptions: 4, revenue_build: 4, usability: 5, communication: 5 },
      feedback: 'Excellent integrity. The balance check is zero in every quarter with no plugs, cash ties between the statements, and the line of credit draws and repays on its own. Your lender summary is exactly what a credit committee wants: first draw, $172K peak, Q2-28 payback, and a tested fix (delaying the head roaster hire) when the downside breaks the limit. The points you lost are in the assumptions and the revenue build: one blended pool churns new and existing subscribers at the same 6%, and CAC stays at $45 while marketing spend rises 67%. Split out a new-subscriber cohort and let CAC rise with spend.',
      templateIndex: 0,
      submittedDaysAgo: 55,
    },
    {
      challengeId: 'pr_3_statement',
      studentId: 'stu_diego',
      scores: { integrity: 4, assumptions: 4, revenue_build: 4, usability: 5, communication: 4 },
      feedback: 'Your layout is the clearest I\'ve seen on this task: inputs, the subscriber build and the statements are easy to follow, and the links between them work. Two fixes would lift it. Your $29 Q3 "rounding adjustment" comes from a typed $6,400 roaster depreciation on the income statement against $6,429 in the schedule. And the typed-in working capital understates the peak draw by about $22K ($150K against roughly $172K with days-driven balances). The lender summary answers timing well, but without the 7% churn / $55 CAC downside it can\'t show how close the line gets to its limit.',
      templateIndex: 1,
      submittedDaysAgo: 25,
    },
  ],
};

export default mod;
