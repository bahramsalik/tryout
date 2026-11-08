import type { ChallengeModule } from '../lib.ts';

const brief = `## Context
Sproutly Foods makes legume-based snacks sold in about 2,100 grocery stores across the Mountain West. On Monday, January 11, 2027 we launch **Sproutly Crispeas**, our first chickpea crisp: three flavors (Sea Salt & Cracked Pepper, Smoky Chipotle, Everything Bagel), $4.49 per 4.5 oz bag, 6 g of plant protein per serving. It goes into 180 stores in Colorado and Utah across three retailers (Peakway Markets, Basin Fresh and Highline Co-op) and on sproutly.example.

We have **$10,000 for the first six weeks**. Last year we spent $12,000 launching lentil puffs, most of it on paid social and creators. The item averaged 3.1 units per store per week, below the 3.5 that Peakway's buyer expects at the 12-week item review. We'd like this launch to clear that bar, and we suspect the answer is already in last year's numbers.

## The task
Write the launch plan our Marketing Coordinator would own for weeks 1–6:
1. **Audience and message:** who we target first and the one message we lead with, grounded in the survey.
2. **Channel mix:** each channel justified by last launch's results or the survey.
3. **Budget:** a table that adds up to exactly $10,000. A reserve is allowed and encouraged.
4. **Calendar:** week by week, hitting the retailer deadlines and promo windows.
5. **Measurement:** KPIs with targets, where each number comes from, and what you'd change at a mid-flight check.

## Constraints
- Time box: about 3 hours. We'd rather see clear reasoning than polish.
- Any tools are fine (docs, spreadsheets, slides exported to PDF). AI use is allowed if you disclose how you used it.
- Out of scope: packaging, pricing, distribution beyond the 180 launch stores, and finished ad design. Rough headlines and a description of one sample asset are enough.
- Use the costs in the starter files. Don't assume free placements or retailer favors we haven't negotiated.

## What we provide
- \`product-brief.md\`: product facts, the store list and last launch's benchmarks.
- \`research/audience-survey-summary.md\`: our October survey of 412 Colorado and Utah snack buyers.
- \`data/last-launch-results.csv\`: channel-level spend, reach, conversions, CAC and repeat rate from the lentil-puff launch.
- \`retailer-calendar.md\`: promo windows, costs and the end-cap deadline.
- \`README.md\`: what to submit and how.
`;

const productBrief = `# Product brief: Sproutly Crispeas

Owner: Marcus Bell, Brand Manager · Last updated: October 28, 2026

## The product
Crispeas are baked chickpea crisps with the snap of a kettle chip. They're our first non-lentil product.

| | |
|---|---|
| Flavors | Sea Salt & Cracked Pepper · Smoky Chipotle · Everything Bagel |
| Bag | 4.5 oz (about 4.5 servings) |
| Suggested retail price | $4.49 per bag |
| Online | 6-bag variety box, $24.99 on sproutly.example (free shipping over $35) |
| Per 1 oz serving | 130 calories · 6 g plant protein · 4 g fiber · 210 mg sodium |
| Claims cleared by Regulatory | Gluten-free · Non-GMO · "Made from chickpeas" · "6 g plant protein per serving" |
| Claims NOT cleared | "High protein" · "Healthier than chips" (no comparisons, please) |

## Launch footprint (week 1 starts Monday, January 11, 2027)
| Retailer | State | Stores | Notes |
|---|---|---|---|
| Peakway Markets | CO | 95 | Loyalty app with about 410,000 active members; weekly scan data |
| Basin Fresh | UT | 60 | Weekly scan data; end-cap program by application |
| Highline Co-op | CO and UT | 25 | Natural-channel shoppers; monthly scan data only |
| **Total** | | **180** | Plus sproutly.example nationwide |

## Benchmarks from last year's lentil-puff launch
- 150 stores, $12,000 marketing budget, six weeks (channel detail in \`data/last-launch-results.csv\`).
- Average velocity, weeks 1–6: **3.1 units per store per week**.
- Demo stores averaged 4.6 units per store per week in the three weeks after their demo; non-demo stores averaged 2.8.
- Peakway's 12-week item review (April 5, 2027 for Crispeas) expects **3.5 units per store per week**. Items below that lose a facing or get delisted.
- Repeat rate is the share of first-time buyers who bought again within 8 weeks. In-store figures come from retailer loyalty-card data; online figures come from our store.

## Brand guardrails
- Voice: warm, a little playful, never preachy about health.
- Tagline: "Snacks that grow on you."
- Lead with taste. Protein and fiber are supporting proof, not the headline.
- Contact for questions: brand@sproutly.example
`;

const surveySummary = `# Audience survey summary: chickpea crisp concept

Fielded October 6–13, 2026 by our Insights team through an online panel. Respondents: **n = 412** adults in Colorado and Utah who bought a packaged salty snack in the past 30 days. Margin of error about ±5 points at the total level; treat subgroup numbers (n < 150) as directional.

## Who answered
- 34% parents of a child under 12 (n = 139)
- 41% aged 25–44 · 22% aged 18–24 · 37% aged 45+
- 29% had heard of Sproutly when shown the logo (aided awareness)

## Snacking occasions (main occasion for a bag like this)
| Occasion | Share |
|---|---|
| Afternoon snack at work or school | 38% |
| Kids' lunchboxes and after-school | 27% |
| Post-workout | 14% |
| Entertaining and game days | 12% |
| Other | 9% |

## What would make you buy (top-2 box, "very important" or "important")
| Driver | Share |
|---|---|
| Tastes like a real chip | 71% |
| Simple ingredients I recognize | 54% |
| Protein | 38% |
| Price | 36% |
| Gluten-free | 22% |

## Concept test (purchase intent, "definitely" or "probably" would buy)
| Concept line | Total | Parents | Non-parents |
|---|---|---|---|
| A: "6 g of plant protein in every serving" | 31% | 35% | 29% |
| B: "The crunch of a chip, made from chickpeas" | 44% | 49% | 41% |

**Surprise #1:** the protein-led line we expected to win lost by 13 points. Taste and crunch beat protein in every age group.

**Surprise #2:** parents of kids under 12 were our strongest segment (49% intent on concept B, versus 41% for non-parents), even though our past marketing has targeted gym-goers. Lunchbox-friendly, nut-free and "kids actually ate it" were the most common open-ended comments.

## What would get you to try a new snack brand
Respondents could pick more than one.
| Trigger | Share |
|---|---|
| Tasting a free sample in the store | 58% |
| A $1-or-more coupon | 47% |
| Seeing it on an end-cap or display | 39% |
| A friend or family recommendation | 33% |
| Seeing it on social media | 19% |
| A creator I follow recommending it | 14% |

## Where you usually discover new snacks (single choice)
In-store browsing and displays 52% · friends and family 21% · social media 15% · retailer app or coupons 12%

## Flavor preference (first choice)
Everything Bagel 41% · Sea Salt & Cracked Pepper 35% · Smoky Chipotle 24% (Smoky Chipotle rises to 33% among 18–24s)

## Price
At $4.49, 61% said "about right", 24% "too expensive" and 15% "a good deal". Among "too expensive" respondents, 58% said a $1.50 coupon would get them to try it.
`;

const lastLaunchCsv = `channel,tactic,spend_usd,impressions,clicks,ctr_pct,conversions,conversion_type,cac_usd,repeat_within_8wk_pct
paid_social,"video ads (2 cuts)",3600,720000,5040,0.70,72,"online first orders",50.00,9
paid_social,"coupon carousel",1200,260000,2340,0.90,40,"digital coupon claims redeemed",30.00,14
influencer,"4 micro creators (fee + product)",2000,185000,1480,0.80,23,"promo code redemptions",86.96,11
search,"brand + category keywords",900,64000,1920,3.00,38,"online first orders",23.68,17
email,"existing list (2 sends)",400,42000,1260,3.00,84,"online orders",4.76,26
in_store_demo,"16 four-hour shifts @ $150",2400,4800,,,600,"demo-day purchases (scan lift vs prior 4 weekends)",4.00,31
retailer_coupon,"Peakway app $1.50 off (fee $600 + face value)",1500,98000,4410,4.50,600,"coupon redemptions",2.50,24
`;

const retailerCalendar = `# Retailer calendar: Crispeas launch

All dates are 2026–27. Costs are what we pay; none are negotiable this cycle.

## Deadlines before launch
| Date | Retailer | What's due | Cost |
|---|---|---|---|
| **Fri, Dec 4** | Basin Fresh | **End-cap commitment and artwork** for the "Game Day Snacks" end-cap (Feb 1–14, all 60 stores). Late applications are not accepted. | $1,500 flat fee |
| Fri, Dec 11 | Peakway Markets | Digital coupon submission for the "Fresh Start" event in the loyalty app (Jan 11–24) | $600 setup fee + we reimburse face value per redemption |
| Fri, Dec 18 | Peakway, Basin Fresh, Highline | Demo bookings through TasteRight Field Marketing | $175 per 4-hour shift (up from $150 last year); max 2 shifts per store per weekend |
| Fri, Dec 18 | Highline Co-op | Shelf-talker artwork (optional, free to place) | Printing about $2 each |

## Launch weeks
| Week | Dates | What's happening |
|---|---|---|
| 1 | Jan 11–17 | Product on shelf in all 180 stores. Peakway "Fresh Start" coupon window opens. |
| 2 | Jan 18–24 | Week 1 scan data arrives Tuesday, Jan 19. Peakway coupon window closes Sunday, Jan 24. |
| 3 | Jan 25–31 | No retailer events. By Tuesday, Jan 26 you have scan data for weeks 1 and 2. |
| 4 | Feb 1–7 | Basin Fresh "Game Day Snacks" end-cap starts. Big-game weekend Feb 6–7 is the year's biggest salty-snack weekend. |
| 5 | Feb 8–14 | End-cap continues through Sunday, Feb 14. |
| 6 | Feb 15–21 | No retailer events. Plan wraps Sunday, Feb 21. |

## Data you can use
- Peakway and Basin Fresh send weekly scan data (units by store) every Tuesday for the prior week.
- Highline sends monthly scan data, so its first read is early February.
- Coupon redemptions are reported weekly by Peakway.
- Online orders, promo codes and email results are in our store dashboard daily.

## After the launch
- **Mon, Apr 5:** Peakway 12-week item review. Bar: 3.5 units per store per week.
`;

const starterReadme = `# Crispeas launch plan: starter kit

Thanks for taking this on. This is the same brief our Marketing Coordinator would get in their first week.

## What's in here
| File | What it's for |
|---|---|
| \`product-brief.md\` | Product facts, claims, launch stores and last year's benchmarks |
| \`research/audience-survey-summary.md\` | October survey, n = 412 |
| \`data/last-launch-results.csv\` | Lentil-puff launch results by channel |
| \`retailer-calendar.md\` | Deadlines, promo windows and costs |

## What to submit
A zip containing:
1. **README.md**: a one-page summary of your plan (we read this first).
2. **Your plan**: audience and message, channel mix and why, a six-week calendar, and a measurement plan. Markdown, PDF or slides are all fine.
3. **Budget table** (CSV or spreadsheet) that sums to exactly $10,000.

Then add short approach notes in the submission form: what you built, the key trade-offs, and what you'd do with more time.

## Tips
- Show your math. If a number comes from the CSV or the survey, say which.
- A reserve is fine. Tell us what would make you spend it.
- About 3 hours is plenty. Don't design finished ads.

Questions: brand@sproutly.example (Marcus Bell, Brand Manager).
`;

/* ───────────── Strong template ───────────── */

const strongReadme = `# Crispeas launch plan: weeks 1–6

**One line:** win the shelf, not the feed. Put most of the $10,000 where last year's launch actually sold bags (in-store demos and the Peakway coupon), lead with taste for parents, and keep $1,000 in reserve until week 3 scan data tells us where to push.

## Audience and message
- **Primary: Colorado and Utah parents of kids under 12.** They were our strongest segment in the survey (49% intent on the taste concept) and 27% of buyers name lunchboxes as the main occasion.
- **Secondary: afternoon work and school snackers** (38% of occasions).
- **Lead message:** "The crunch of a chip, made from chickpeas." It beat the protein line 44% to 31%. Protein ("6 g plant protein") stays as proof on the bag and the demo card, not the headline.

## Channel mix (and why)
| Channel | Budget | Evidence |
|---|---|---|
| In-store demos (24 shifts) | $4,200 | $4.00 CAC and 31% repeat last year; 58% of survey says a sample gets them to try |
| Peakway "Fresh Start" coupon | $2,100 | $2.50 per redemption last year, 24% repeat |
| Basin Fresh Game Day end-cap | $1,500 | 52% discover snacks in-store; big-game weekend |
| Search | $600 | $23.68 CAC, captures people who saw us in store |
| Paid social (coupon-led, small) | $600 | Coupon carousel ($30 CAC) beat video ($50); test only |
| Reserve | $1,000 | Released at week 3 check |
| **Total** | **$10,000** | |

**Cut:** creators ($86.96 CAC, 11% repeat) and paid social video ($50 CAC, 9% repeat).

## How we'll know it's working
North-star: **3.5 units per store per week by week 6**, the Peakway review bar (lentil puffs did 3.1). Full KPI table and the week 3 decision rules are in \`measurement-plan.md\`.

## Files
- \`launch-plan.md\`: audience, positioning, creative and channel detail
- \`budget.csv\`: line-item budget (sums to $10,000)
- \`six-week-calendar.md\`: pre-launch deadlines and week-by-week plan
- \`measurement-plan.md\`: KPIs, targets, data sources and the mid-flight check

## Caveat I'd flag to Marcus
Demo "conversions" are a scan lift over prior weekends, while coupon and online conversions are counted directly, so the CACs aren't perfectly comparable. Even if I halve the demo lift, demos still come in at $8 per purchase, far below paid social.
`;

const strongPlan = `# Launch plan detail

## Positioning
**For** busy Colorado and Utah parents packing lunches and after-school snacks, **Crispeas are** the chickpea crisp **that** crunches like a real chip, **because** they're baked from chickpeas with simple ingredients, and they bring 6 g of plant protein along for the ride.

## Messaging hierarchy
1. **Headline (taste):** "The crunch of a chip, made from chickpeas."
2. **Proof:** 6 g plant protein · 4 g fiber · gluten-free. These are all cleared claims. I avoided "high protein" and any comparison to chips, which aren't cleared.
3. **Brand sign-off:** "Snacks that grow on you."

Lead flavor in creative: **Everything Bagel** (41% first choice). Smoky Chipotle only in the paid social test aimed at 18–24s (33% first choice there).

## Creative
- **Demo table card (sample asset):** a bag of each flavor on a kraft-paper card. Headline: "Crunch first. Chickpeas second." Underneath: "6 g plant protein · gluten-free · lunchbox-ready." A QR code goes to the store locator on sproutly.example with the promo code CRUNCH15.
- **Peakway coupon tile:** "$1.50 off Sproutly Crispeas: the crunch of a chip, made from chickpeas."
- **End-cap header (Basin Fresh):** "Game day just got a new crunch." Lead with Smoky Chipotle for the big-game weekend.
- **Paid social (2 carousel cards, coupon-led):** "Lunchbox approved. Crunch guaranteed." Targeted to parents within 10 miles of a Peakway store, linking to the coupon clip.

## Channel detail
**In-store demos: 24 shifts × $175 = $4,200.** Last year 16 shifts drove 600 demo-day purchases (37.5 per shift). Allocation: 12 Peakway shifts in weeks 1–2 (stacked on the coupon window, so the sample plus the $1.50 off closes the sale), 8 Basin Fresh shifts in weeks 4–5 next to the end-cap, and 4 Highline shifts in week 3. I pick the highest-traffic stores; at 2 shifts per store per weekend that's comfortably within the cap.

**Peakway coupon: $600 + 1,000 × $1.50 = $2,100.** Last year we got 600 redemptions. I'm planning for 1,000 because Crispeas launch into 95 Peakway stores with demos in the same window. If we come in under, the leftover rolls into the reserve.

**Basin Fresh end-cap: $1,500.** All 60 stores, Feb 1–14, covering big-game weekend. The commitment and artwork are due **Dec 4**, the earliest deadline in the plan.

**Search: $600.** Brand terms plus "chickpea chips" and "gluten-free lunchbox snacks". At last year's $23.68 CAC that's about 25 online first orders.

**Paid social: $600.** Coupon carousel only, which was the better of last year's two formats at $30 versus $50 CAC. It's a learning budget, not a growth engine.

**Email: $0 incremental.** Two sends to our existing list (launch week and big-game week) using the existing platform. Last year email drove 84 orders, but those are existing customers, so I don't count it as acquisition.

**Shelf talkers: Highline only,** printing covered by the reserve if we use them (25 stores × 2 × $2 = $100).
`;

const strongBudget = `line,channel,detail,weeks,cost_usd,expected_result,basis
1,In-store demos,"24 shifts x $175 (Peakway 12, Highline 4, Basin Fresh 8)",1-5,4200,"~900 demo-day purchases (37.5 per shift)",last-launch-results.csv
2,Retailer coupon,"Peakway Fresh Start: $600 fee + 1,000 redemptions x $1.50",1-2,2100,"1,000 redemptions ($2.10 each)",last-launch-results.csv + retailer-calendar.md
3,End-cap,"Basin Fresh Game Day Snacks, 60 stores",4-5,1500,"Velocity lift during big-game weekend",retailer-calendar.md + survey (52% discover in-store)
4,Search,"Brand + chickpea snack keywords",1-6,600,"~25 online first orders at $23.68",last-launch-results.csv
5,Paid social,"Coupon-led carousel, parents near Peakway stores",1-3,600,"~20 coupon claims at $30; test only",last-launch-results.csv
6,Email,"2 sends to existing list (existing platform)",1 and 4,0,"~80 online orders from current customers",last-launch-results.csv
7,Reserve,"Released at week 3 check (see measurement-plan.md)",4-6,1000,"Up to 5 extra demo shifts ($875) + $125 coupon overage or shelf talkers",measurement-plan.md
,,,,10000,TOTAL,
`;

const strongCalendar = `# Six-week calendar

## Before launch
| Date | Action | Owner |
|---|---|---|
| Mon, Nov 30 | Final end-cap header artwork to Marcus for sign-off | Marketing Coordinator |
| **Fri, Dec 4** | **Basin Fresh end-cap commitment + artwork submitted** ($1,500) | Marketing Coordinator |
| Fri, Dec 11 | Peakway "Fresh Start" coupon submitted ($1.50 off, cap 1,000 redemptions) | Marketing Coordinator |
| Fri, Dec 18 | 24 demo shifts booked with TasteRight; Highline shelf-talker artwork sent | Marketing Coordinator |
| Week of Jan 4 | Search and paid social campaigns built; email 1 scheduled | Marketing Coordinator |

## Launch weeks
| Week | Dates | In store | Digital | Check |
|---|---|---|---|---|
| 1 | Jan 11–17 | Coupon live. 6 Peakway demo shifts (Sat/Sun). | Email 1 (launch). Search and paid social on. | Daily: coupon clips, online orders |
| 2 | Jan 18–24 | Coupon closes Sun. 6 Peakway demo shifts. | Paid social continues. | Tue, Jan 19: week 1 scan data |
| 3 | Jan 25–31 | 4 Highline demo shifts. | Paid social ends Sun. | **Tue, Jan 26: mid-flight check** (weeks 1–2 scan data) |
| 4 | Feb 1–7 | End-cap starts. 4 Basin Fresh demo shifts on big-game weekend. | Email 2 (game day). | Weekly scan review |
| 5 | Feb 8–14 | End-cap continues. 4 Basin Fresh demo shifts. Reserve shifts if released. | Search continues. | Weekly scan review |
| 6 | Feb 15–21 | No events; measure the baseline after promotions. | Search continues. | Wrap-up report Tue, Feb 23 |

Why this order: demos land on top of the coupon in weeks 1–2 (sample, then $1.50 off), Highline fills the quiet week 3, and Basin Fresh demos sit next to the end-cap on the biggest snack weekend. Week 6 has no promotion on purpose, so we see the velocity Peakway will see at its April review.
`;

const strongMeasurement = `# Measurement plan

## North-star
**Units per store per week (velocity), weeks 1–6, all 180 stores: target ≥ 3.5.** That's the Peakway 12-week review bar. Lentil puffs averaged 3.1. Source: weekly Peakway and Basin Fresh scan data, monthly Highline.

## KPIs
| KPI | Target | Source | Why this target |
|---|---|---|---|
| Velocity, week 6 (no promo running) | ≥ 3.5 u/s/w | Scan data | Review bar |
| Demo-store velocity vs non-demo | ≥ 1.4× in the 3 weeks after a demo | Scan data | Last year 4.6 vs 2.8 (1.6×) |
| Cost per demo-day purchase | ≤ $5.00 | TasteRight reports + scan lift | Plan is $4,200 / 900 = $4.67 |
| Coupon redemptions | 1,000 | Peakway weekly report | Last year 600; demos stacked this year |
| Cost per online first order (search) | ≤ $25 | Store dashboard | Last year $23.68 |
| Cost per coupon claim (paid social) | ≤ $30 | Ad dashboard | Last year $30.00 |
| 8-week repeat, coupon and demo buyers | ≥ 24% | Loyalty-card data (Peakway) | Last year 24–31% |

Not KPIs: impressions and followers. I'll report them, but they don't decide anything.

## Mid-flight check: Tuesday, January 26 (week 3)
We'll have two full weeks of Peakway and Basin Fresh scan data.
1. **If demo stores are ≥ 1.3× non-demo stores:** release $875 of the reserve for 5 extra Basin Fresh demo shifts in weeks 4–5 (end-cap stores). Remaining $125 covers coupon overage or Highline shelf talkers.
2. **If paid social cost per claim is > $40:** stop it now. The unspent budget (about $200) moves to the reserve.
3. **If overall velocity is < 2.8:** hold the reserve, check on-shelf availability with the retailers before spending more (an out-of-stock looks exactly like weak demand), then decide.
4. **If coupon redemptions are on pace to exceed 1,000:** the cap protects the budget; the reserve covers up to 83 more.

## Wrap-up (Feb 23)
One page for Marcus: velocity versus 3.5 by retailer, cost per purchase by channel, and a recommendation for the April review.
`;

/* ───────────── Solid template ───────────── */

const solidReadme = `# Sproutly Crispeas: six-week launch plan

## Summary
Crispeas are a tasty, better-for-you crunch, and the launch should make as many Coloradans and Utahns as possible aware of them in six weeks. My plan uses a balanced mix: paid social to build awareness, in-store demos and a coupon to drive trial, a small creator program for credibility, and the Basin Fresh end-cap for game day.

## Target audience
**Health-conscious millennials (25–40) in Colorado and Utah** who snack at work and want something with protein, with parents as a secondary group. The survey shows 38% snack in the afternoon at work or school and 41% are 25–44.

## Key message
"The crunch of a chip, made from chickpeas." It scored highest in the concept test (44% vs 31%).

## Budget
| Channel | Budget |
|---|---|
| Paid social (video + carousel) | $3,000 |
| In-store demos (12 shifts × $175) | $2,100 |
| Creators (3 micro creators) | $1,500 |
| Peakway digital coupon ($600 + 600 × $1.50) | $1,500 |
| Basin Fresh end-cap | $1,500 |
| Email (design + 2 sends) | $400 |
| **Total** | **$10,000** |

## KPIs
- 1.2 million impressions across paid social and creators
- 2,000 new social followers
- 50,000 video views
- 600 coupon redemptions
- Strong engagement rate (3%+) on creator posts

## Files
- \`launch-plan.md\`: channel plan and creative ideas
- \`budget.csv\`: budget table
- \`calendar.md\`: week-by-week timeline

## Notes
I matched the end-cap and coupon to the retailer calendar so we don't miss the deadlines. If I had more time, I'd build out the creator brief and a content calendar for social.
`;

const solidPlan = `# Launch plan

## Positioning
Crispeas: the crunch you crave, with 6 g of plant protein. A snack you can feel good about at your desk, in a lunchbox or on game day.

## Channels
**Paid social ($3,000).** Social is where our audience spends time, so it's the best way to build awareness quickly. Two 15-second videos (one on crunch, one on flavors) plus a carousel featuring all three flavors. Target 25–40-year-olds in Colorado and Utah interested in fitness, healthy eating and cooking.

**In-store demos ($2,100).** 12 shifts at our busiest Peakway and Basin Fresh stores so shoppers can taste the crunch.

**Creators ($1,500).** Three Denver and Salt Lake City food and fitness creators at $500 each for one post and two stories. Creators bring credibility and new followers.

**Peakway coupon ($1,500).** $1.50 off during "Fresh Start," Jan 11–24, budgeted for 600 redemptions.

**Basin Fresh end-cap ($1,500).** Game-day end-cap Feb 1–14, featuring Smoky Chipotle.

**Email ($400).** Launch announcement and a game-day recipe email to our existing list.

## Creative ideas
- Video: close-up "crunch test" with sound on. Tagline "Snacks that grow on you."
- Creator hook: "I tried the chickpea chip everyone's talking about."
- Demo card: three flavors, "6 g plant protein," QR to the store locator.
`;

const solidBudget = `channel,detail,cost_usd
Paid social,"2 videos + 1 carousel, CO/UT 25-40",3000
In-store demos,"12 shifts x $175",2100
Creators,"3 micro creators x $500",1500
Peakway coupon,"$600 fee + 600 redemptions x $1.50",1500
Basin Fresh end-cap,"Game Day Snacks, Feb 1-14",1500
Email,"Design + 2 sends",400
TOTAL,,10000
`;

const solidCalendar = `# Timeline

| When | What |
|---|---|
| Dec 4 | Submit Basin Fresh end-cap commitment and artwork |
| Dec 11 | Submit Peakway coupon |
| Dec 18 | Book 12 demo shifts |
| Week 1 (Jan 11) | Launch email, paid social starts, coupon live, 3 demo shifts |
| Week 2 (Jan 18) | Creator posts go live, 3 demo shifts, coupon ends Jan 24 |
| Week 3 (Jan 25) | Paid social continues, 2 demo shifts |
| Week 4 (Feb 1) | End-cap starts, game-day email, 2 demo shifts |
| Week 5 (Feb 8) | End-cap continues, 2 demo shifts |
| Week 6 (Feb 15) | Paid social wraps, recap report |
`;

/* ───────────── Weak template ───────────── */

const weakReadme = `# Crispeas Launch Plan

## Big idea: #CrunchChallenge
People discover new snacks on social media now, so the launch should be built around creators and a viral challenge. We'll get local food and fitness creators to post themselves doing a "crunch test" with Crispeas and tag friends to try it. This builds buzz and gets Crispeas trending in Denver and Salt Lake City.

## Target audience
Gen Z and millennials who are into fitness and healthy eating. They care about protein and follow creators for snack recommendations.

## Message
"6 g of protein, all the crunch." Protein is the main reason people buy better-for-you snacks.

## Budget ($10,000)
| Item | Cost |
|---|---|
| Creators (5 × $1,000) | $5,000 |
| Paid social ads | $4,000 |
| In-store demos (4 shifts) | $800 |
| Branded tote bag giveaway | $1,000 |
| **Total** | **$10,000** |

## Timeline
- Week 1: Launch the #CrunchChallenge with all 5 creators
- Weeks 2–4: Paid social ads boosting the best creator posts
- Weeks 5–6: Tote bag giveaway for people who post with the hashtag
- Demos sometime during the launch

## Results we expect
The challenge should go viral and get Crispeas a lot of attention. We'll see engagement go up and more people will start buying Crispeas in stores.

## Files
- \`creator-ideas.md\`: ideas for creator content
- \`social-posts.md\`: sample captions
`;

const weakCreators = `# Creator ideas

- Fitness creator does a post-workout "crunch test" and rates each flavor
- Food creator makes Crispeas nachos
- Mom creator puts Crispeas in her kids' lunchboxes
- College creator does a dorm snack haul
- Outdoors creator brings Crispeas on a hike in the Rockies

Each creator gets $1,000, a box of all 3 flavors, and a branded tote bag. They post one video and three stories and use #CrunchChallenge.
`;

const weakSocial = `# Sample captions

1. "6 g of protein and ALL the crunch. Who's taking the #CrunchChallenge?"
2. "Healthier than chips and tastes even better. Meet Crispeas."
3. "Tag a friend who needs a better snack. #CrunchChallenge #Sproutly"
4. "Everything Bagel, Smoky Chipotle or Sea Salt & Cracked Pepper? Drop your pick below."
`;

const mod: ChallengeModule = {
  challenge: {
    id: 'ch_launch',
    kind: 'live',
    companyId: 'co_sproutly',
    title: 'Launch plan for chickpea crisps on a $10k budget',
    summary: 'Plan a 6-week chickpea crisp launch: pick channels, split $10k, set KPIs.',
    type: 'marketing',
    skills: ['Go-to-market planning', 'Budget allocation', 'Audience research', 'Retail marketing', 'KPI design'],
    classroomConcepts: [
      { concept: 'Segmentation, targeting and positioning (STP)', course: 'Marketing Principles' },
      { concept: 'Trial and adoption triggers', course: 'Consumer Behavior' },
      { concept: 'Customer acquisition cost and channel ROI', course: 'Marketing Analytics' },
      { concept: 'Trade promotion and retail merchandising', course: 'Retail Management' },
    ],
    difficulty: 'beginner',
    estHours: 3,
    brief,
    deliverables: [
      'One-page README summarizing audience, message and channel mix',
      'Budget table that sums to exactly $10,000',
      'Six-week calendar tied to the retailer deadlines',
      'Measurement plan with KPI targets and a mid-flight check',
    ],
    rubric: [
      { id: 'audience', name: 'Audience insight', weight: 20, description: 'Picks a primary segment and lead message straight from the survey (for example the parents segment and the taste-over-protein result) and explains why.' },
      { id: 'channel_strategy', name: 'Channel strategy', weight: 25, description: 'Every channel is justified with last launch CAC or repeat data or the survey, and weak channels are cut or reduced to a deliberate test.' },
      { id: 'budget', name: 'Budget allocation', weight: 20, description: 'A line-item table that sums to exactly $10,000 using the real costs, with a reserve and a stated trigger for spending it.' },
      { id: 'creative', name: 'Creative & messaging', weight: 20, description: 'A clear messaging hierarchy and sample assets that lead with taste, use only cleared claims and fit each channel.' },
      { id: 'measurement', name: 'Measurement plan', weight: 15, description: 'KPIs tied to sales (velocity against the 3.5 review bar, cost per purchase) with sourced targets and a dated mid-flight decision rule.' },
    ],
    applicantCap: 60,
    status: 'open',
    hiringFor: 'Marketing Coordinator · Full-time · Denver, CO (hybrid)',
    starterFiles: [
      { path: 'README.md', content: starterReadme },
      { path: 'product-brief.md', content: productBrief },
      { path: 'research/audience-survey-summary.md', content: surveySummary },
      { path: 'data/last-launch-results.csv', content: lastLaunchCsv },
      { path: 'retailer-calendar.md', content: retailerCalendar },
    ],
    aiHints: {
      testing:
        'Whether you can turn evidence into a plan. Last launch\'s CSV and the survey both point to the store shelf (demos and the retailer coupon) over paid social and creators, and the brand team wants to see you notice that and spend accordingly. They are also checking basic discipline: a budget that adds up and KPIs that connect to sales.',
      steps: [
        'Compute or read CAC and repeat rate per channel from last-launch-results.csv and rank the channels.',
        'Pick a primary audience and a lead message from the survey, noting which concept line won and which segment had the highest intent.',
        'Allocate the $10,000 line by line using the real costs in retailer-calendar.md, keeping a reserve.',
        'Lay the channels onto the six weeks so they hit the Dec 4, Dec 11 and Dec 18 deadlines and stack on the promo windows.',
        'Set KPIs anchored to the 3.5 units per store per week review bar and write a dated mid-flight rule for the reserve.',
      ],
      greatLooksLike:
        'A plan that leads with taste for parents, puts most of the money into demos, the Peakway coupon and the Basin Fresh end-cap, and cuts or shrinks creators and video ads with the CAC numbers to back it up. The budget table sums to exactly $10,000 and includes a reserve with a clear trigger. Success is measured by store velocity against the 3.5 bar, not impressions or followers.',
      pitfalls: [
        'Spending most of the budget on paid social or creators without checking last launch\'s CAC and repeat rates.',
        'A budget table that doesn\'t add up to $10,000, or that uses last year\'s $150 demo price instead of $175.',
        'Missing the Dec 4 end-cap deadline, which falls before the launch even starts.',
        'Vanity KPIs (impressions, followers, engagement) with no link to units sold.',
        'Leading with "high protein" or comparisons to chips, which aren\'t cleared claims.',
      ],
    },
    deadlineInDays: 9,
    createdDaysAgo: 5,
    seed: { participants: 27, submissions: 5, scored: 0 },
  },
  templates: [
    {
      quality: 'strong',
      notes: `### What I built
A six-week launch plan for Crispeas: an audience and positioning section, a line-item budget that sums to $10,000, a calendar built backward from the retailer deadlines, and a measurement plan with a dated mid-flight check. I started from the CSV, not from channel ideas. I worked out CAC and repeat rate per channel first, and demos ($4.00, 31% repeat) and the Peakway coupon ($2.50, 24%) were in a different league from creators ($86.96, 11%) and video ads ($50, 9%).

### Key decisions & trade-offs
- **Parents first, taste first.** The survey's two surprises (parents had the highest intent, and the crunch line beat the protein line by 13 points) shaped the whole plan.
- **About 78% of spend in store** (demos, coupon, end-cap). The risk is less reach on digital, so I kept $1,200 in search and a small coupon-led social test to keep learning.
- **$1,000 reserve** tied to week 3 scan data rather than spent up front.
- Demo CAC is a scan-lift estimate, not a direct count. I flagged this and checked that demos still win if the lift is halved.

### What I'd do with more time
Pick the specific demo stores using store-level traffic data, and plan a holdout of matched stores so we can measure the demo lift cleanly instead of comparing against prior weekends.`,
      files: [
        { path: 'README.md', content: strongReadme },
        { path: 'launch-plan.md', content: strongPlan },
        { path: 'budget.csv', content: strongBudget },
        { path: 'six-week-calendar.md', content: strongCalendar },
        { path: 'measurement-plan.md', content: strongMeasurement },
      ],
      feedback:
        'This is the plan we were hoping someone would write. You read the CSV before choosing channels, cut creators and video ads on CAC and repeat rate, and your $1,000 reserve has a real trigger tied to the January 26 scan data. Leading with taste for parents is exactly what the survey says, and flagging that demo CAC is a scan-lift estimate shows good judgment. One small gap: the plan doesn\'t name which stores get demos, and that\'s the first thing we\'d ask a coordinator to nail down.',
      aiDisclosure:
        'Used an AI assistant to double-check my CAC math and to suggest a few headline variations; the channel choices, budget and calendar are my own.',
    },
    {
      quality: 'solid',
      notes: `### What I built
A launch plan with a target audience, a key message, a six-channel budget that adds up to $10,000 and a week-by-week timeline that hits the end-cap, coupon and demo deadlines.

### Key decisions & trade-offs
- I went with a balanced mix so we aren't betting the launch on one channel. Paid social gets the largest share ($3,000) because it reaches the most people quickly, and demos and the coupon drive trial.
- I used the winning concept line from the survey ("The crunch of a chip, made from chickpeas") as the main message.
- I priced demos at this year's $175 per shift and built the coupon budget around last year's 600 redemptions.
- Creators add credibility, so I kept a small program of three local creators.

### What I'd do with more time
Write the creator brief and a full social content calendar, and design the demo card and end-cap header.`,
      files: [
        { path: 'README.md', content: solidReadme },
        { path: 'launch-plan.md', content: solidPlan },
        { path: 'budget.csv', content: solidBudget },
        { path: 'calendar.md', content: solidCalendar },
      ],
      feedback:
        'A clean, well-organized plan: the budget sums to $10,000 at the correct $175 demo price, the calendar hits all three December deadlines, and you picked the right lead message from the concept test. What holds it back is that the channel split isn\'t tied to last launch\'s results. Paid social and creators get $4,500 even though they cost $30–87 per conversion last year, versus $2.50–4.00 for the coupon and demos. Your KPIs (impressions, followers, video views) also wouldn\'t tell us whether we clear the 3.5 units per store per week review bar.',
      aiDisclosure: 'I used an AI tool to help format my tables and tighten the wording of the README.',
    },
    {
      quality: 'weak',
      notes: `### What I built
A creator-led launch built around a #CrunchChallenge hashtag, with a budget, a rough timeline and some sample captions.

### Key decisions & trade-offs
- I put most of the budget into creators and paid social because that's where younger snackers discover new products, and a viral challenge can reach far more people than in-store demos.
- I led with protein because that's the main reason people buy better-for-you snacks.
- The tote bag giveaway gives people a reason to post, which spreads the hashtag further.
- I kept demos small because they only reach one store at a time, while a single creator post can reach thousands of people.

### What I'd do with more time
Find the specific creators and negotiate rates, design the tote bag, and write more sample posts for each flavor.`,
      files: [
        { path: 'README.md', content: weakReadme },
        { path: 'creator-ideas.md', content: weakCreators },
        { path: 'social-posts.md', content: weakSocial },
      ],
      feedback:
        'There\'s real energy in the #CrunchChallenge idea, but the plan isn\'t grounded in the data we shared. Creators and paid social were our most expensive channels last launch ($50–87 per conversion with the lowest repeat), and the survey shows only 14–19% of shoppers try snacks because of social. The budget lines add up to $10,800 rather than $10,000, "healthier than chips" isn\'t a cleared claim, and there\'s no way to tell whether the launch worked. Start from the CSV next time and tie each dollar to a result you can measure.',
      aiDisclosure: 'None.',
    },
  ],
  scripted: [
    { challengeId: 'ch_launch', studentId: 'stu_sofia', templateIndex: 0, submittedDaysAgo: 2, scores: null, feedback: null },
    { challengeId: 'ch_launch', studentId: 'stu_malik', templateIndex: 1, submittedDaysAgo: 1, scores: null, feedback: null },
  ],
};

export default mod;
