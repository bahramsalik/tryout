import type { ChallengeModule } from '../lib.ts';

const brief = `## Context
Housecart is a fictional four-person startup making a shared grocery list and bill-splitting app for roommates. It has about 3,800 weekly active households, mostly students and young professionals sharing apartments. The worrying number: 42% of new households stop using Housecart within six weeks. The team has room for one big bet next quarter and four candidates on the whiteboard: settle-up reminders, receipt scanning, per-item splitting rules and meal planning. Before choosing, the team interviewed six active users. You've just joined as the product hire, and the transcripts are on your desk.

## The task
Synthesize the six interviews into insights the team can decide from:

1. Identify the 3–4 themes that recur across participants. Back each one with direct quotes, tagged with participant IDs (P1–P6).
2. Separate what people say they do from what they describe actually doing, and call out where the two disagree.
3. Flag anything that is loud but not representative, and explain why you are weighting it the way you are.
4. Prioritize the themes. Make your method explicit (for example, how many participants × how severe the pain).
5. Recommend what the team should do next, including the open questions to answer before building.

## Constraints
- Time box: 4 hours. Six transcripts take about an hour to read carefully; spend the rest on synthesis.
- Any tools are fine: sticky notes, a spreadsheet, a whiteboard app. Submit text or markdown files, not a slide deck.
- Out of scope: UI designs, user counts beyond these six interviews and pricing.
- AI assistants are allowed if you disclose how you used them. Every quote must be verbatim from the transcripts, and the synthesis must be your own judgment.

## What we provide
- \`interviews/p1.md\` to \`interviews/p6.md\`: six lightly cleaned transcripts, 30–40 minutes each
- \`research-plan.md\`: the questions the team wanted answered and the roadmap candidates
- \`README.md\`: how to approach the kit and what to submit
`;

const researchPlan = `# Housecart research plan: roommate grocery and money habits

**Owner:** Product (Housecart)  **Interviews run:** Sep 8-12  **Format:** 30-40 min remote, one participant at a time

## Why now
42% of new households stop using Housecart within six weeks. We have room for one major bet next quarter and need to choose with evidence, not opinions.

## Research questions
1. **Coordination:** How do roommates decide what to buy, and where does that decision actually happen?
2. **Money:** How do households split costs and settle up, in practice?
3. **Friction:** What causes tension or awkwardness around groceries and money?
4. **Product fit:** Where does Housecart help today, and where do people work around it?
5. **Roadmap:** Which of our candidates addresses the biggest problems?

## Roadmap candidates (do not lead participants with these)
- Settle-up reminders
- Receipt scanning
- Per-item splitting rules
- Meal planning

## Participants
Six active users from six different households, recruited from an in-app banner. Households of 2-5 people; Housecart tenure 3-9 months. Each participant received a $25 gift card.

## Interview guide (core prompts)
- Walk me through how groceries work in your place.
- Tell me about the last time you shopped / settled up. (Ask for the specific last time, not "usually".)
- How do you split costs? How does the money actually move?
- Has that ever caused tension?
- If you could change one thing tomorrow...

## Notes
Transcripts are lightly cleaned (filler words trimmed). [Brackets] mark interviewer observations. Roommates' names were left as spoken.
`;

const p1 = `# P1

**Profile:** 26, grad student, 3-person apartment, Housecart user for 7 months. Describes themself as the household's "treasurer."

**Interviewer:** Thanks for doing this. Can you walk me through how groceries work in your place?

**P1:** Sure. So there's three of us, me and two guys from my program. I'm kind of the one who keeps track of money, which, I didn't volunteer, it just happened. I think because I made the spreadsheet first semester. Anyway, groceries. We have the Housecart list, and in theory anyone adds stuff when we run out. In practice it's mostly me adding things, and then whoever's going to the store grabs what's on there.

**Interviewer:** When you say mostly you...

**P1:** Yeah, like, the other two will text the group chat "we're out of dish soap" instead of putting it on the list. Which, fine, but then I'm the one transcribing the group chat into the app. [laughs] I'm a human integration.

**Interviewer:** How do you split the cost?

**P1:** Okay, this is the part I actually care about. I want it to be exact. Like, if I buy a twelve-dollar block of parmesan, that's mine, I don't want them paying for it, and I don't want to pay for their protein powder. Itemized. That's the fair way.

**Interviewer:** Tell me about the last time you settled up.

**P1:** Um. Honestly? Last month we didn't really itemize. I had like four receipts in my bag and I just looked at the total, it was around $310, and I said everybody Venmo me a hundred and call it even. Nobody argued. It's just, going receipt by receipt takes an hour and somebody always asks "wait, whose yogurt is this."

**Interviewer:** Did the hundred each feel fair?

**P1:** It felt done. [pause] Probably I overpaid a little, because I buy the expensive cheese. But I didn't want to have the conversation.

**Interviewer:** Which conversation?

**P1:** The asking-for-money conversation. Like, Dev owed me $64 from September for three weeks and I didn't want to be the guy who keeps bringing it up. I eventually just added it to the October total so it was less weird. The app shows a balance, but nobody looks at the balance. Nobody opens the app to look at how much they owe. Why would you? It's bad news.

**Interviewer:** What would make that easier?

**P1:** Maybe if the app did the nagging so it isn't me. Like a reminder that comes from the app, not from me. Then I'm not the bad guy.

**Interviewer:** Anything else that gets messy?

**P1:** The shared-versus-mine thing. Olive oil is everyone's. Oat milk, is that everyone's? Only I drink it, but sometimes Sam uses it in his coffee. So do I split it? There's no way to mark something as "mostly mine." It ends up being a vibe.

**Interviewer:** [laughs] If you could change one thing about Housecart tomorrow?

**P1:** The settling-up part. The list is fine. Well, the list would be fine if people used it. But the money part is where we actually fight. Not fight. Where it gets awkward.
`;

const p2 = `# P2

**Profile:** 31, works in restaurant operations, 4-person house, Housecart user for 8 months. Cooks for the house most Sundays. Very talkative; came back to meal planning several times.

**Interviewer:** How do groceries work in your house?

**P2:** Oh, I love this question. Okay. So I'm the cook. There's four of us, and on Sundays I do a big batch thing: a pot of chili, a tray of roasted vegetables, grain bowls for the week. So for me the list is really a meal plan. And that's honestly my number one thing for you guys: you need meal planning. Like, I pick five recipes and the app builds the list for me, with quantities, and it knows we already have half a bag of rice.

**Interviewer:** Tell me about the last time you shopped.

**P2:** Saturday. I made my list in Housecart and then, this is a funny one, I get to the store and Priya had already bought eggs and milk on Thursday, but she never checked them off, so I bought them again. Now we have like thirty eggs. That happens, I'd say, every other week? Somebody buys a thing and the list doesn't know.

**Interviewer:** Why do you think it doesn't get checked off?

**P2:** Because you're in the store, you've got a basket, you're on the phone with your mom, nobody's opening an app to tick a box. You just grab it. Anyway, so yeah, meal planning. If the app had recipes, I'd be in it every day. Also nutrition. Like, if it could tell me the chili is this many grams of protein per serving, I'd pay for that. I would literally pay.

**Interviewer:** How do you all split costs?

**P2:** Pretty chill. We each put $60 a week onto a shared card, and I use that card for the shop. If it runs out, it runs out. Nobody tracks it per item. I mean, we're adults, it evens out.

**Interviewer:** Has anyone ever said it doesn't even out?

**P2:** Not to me! [laughs] I think everyone's happy. They eat my food.

**Interviewer:** Anything frustrating about Housecart today?

**P2:** The duplicates thing, and that it's just a list. It's a dumb list. It should be smart. Like, AI meal plans. You tell it "four people, one is vegetarian-ish, budget eighty bucks" and it gives you a week. And then it auto-builds the list. I've been telling everyone about this idea. I'd use it, my sister would use it.

**Interviewer:** You mentioned vegetarian-ish. Is someone in your house vegetarian?

**P2:** Kind of? Our newest roommate mostly doesn't eat meat. She just eats around it, it's fine.

**Interviewer:** Does she pay into the shared card the same?

**P2:** Yeah, same sixty. It's simpler.

**Interviewer:** If you could change one thing tomorrow?

**P2:** Meal planning. Hundred percent. With recipes. And the nutrition. And maybe you could share recipes with other houses? Like a little community. That'd be sick. Honestly if you build that I'll do your marketing for free.
`;

const p3 = `# P3

**Profile:** 29, ER nurse working night shifts, lives with one roommate, Housecart user for 4 months.

**Interviewer:** Walk me through groceries at your place.

**P3:** It's just me and my roommate, so it's simpler than a big house. We both work weird hours. I'm on nights three days a week. So we basically never shop together. Whoever's near a store goes.

**Interviewer:** How do you decide what to buy?

**P3:** I always check the app before I go. That's the whole point of it, right? It's the one source of truth.

**Interviewer:** Tell me about the last time you went.

**P3:** Last time... it was after a shift, like 8 a.m., I stopped at the place by the hospital. I had a screenshot of our texts where she said we needed coffee, tortillas and the good hot sauce. So I got those. And bananas, because I figured.

**Interviewer:** Did you open Housecart on that trip?

**P3:** [pause] No, actually. I had the screenshot. My phone was at 4 percent. Honestly, most of the time it's the text thread, now that I think about it. The app is where things go to sit. There's stuff on our list from August. There's "birthday candles" on there, and her birthday was in August.

**Interviewer:** [laughs] How do you split the cost?

**P3:** We split everything fifty-fifty. Super simple.

**Interviewer:** How does the money actually move?

**P3:** I'll Venmo her for my half when she sends a receipt photo. Except she buys these fancy kombucha things for herself, and those she just doesn't count. And I don't count my energy drinks. So it's fifty-fifty except the stuff that's obviously yours. Which is sort of... a lot of stuff? We've never written down the rule.

**Interviewer:** Has that ever caused tension?

**P3:** Once. She'd fronted, I think, like $140 over a couple of weeks while I was doing a stretch of shifts, and I genuinely forgot. She didn't say anything for a month. When she finally brought it up she was apologizing, like she was the one doing something wrong. I felt terrible. I'd have paid it day one. I just didn't know.

**Interviewer:** Where would you have expected to find out?

**P3:** I don't know. A notification? The app knew. The balance was right there. I just never looked, because I never go to that screen.

**Interviewer:** Anything else you'd want to tell the team?

**P3:** If the list could know when we're out of stuff... no, that's magic. I don't know. Just make it easier to add things from the text thread? Half our list lives in texts.
`;

const p4 = `# P4

**Profile:** 22, undergraduate, 5-person house, Housecart user for 3 months. Short answers; needed frequent prompting.

**Interviewer:** How do groceries work in your house?

**P4:** Um, there's a list. People add stuff.

**Interviewer:** Who does the shopping?

**P4:** Mostly two of the guys. They have a car.

**Interviewer:** Do you ever go?

**P4:** Sometimes, if they're busy. I walk to the little store. I only get what I can carry.

**Interviewer:** And how are costs split?

**P4:** Evenly. Five ways.

**Interviewer:** How do you feel about that?

**P4:** It's fine. [pause] I mean... it's fine.

**Interviewer:** Take your time.

**P4:** I don't really eat at home that much? I have a meal plan on campus for lunch. So, like, I'm paying a fifth of the groceries and I'm eating maybe less than that. And they buy a lot of meat, steaks sometimes. Which is fine, it's their house too.

**Interviewer:** Have you mentioned it to anyone?

**P4:** No. It'd be weird. I'm the newest one in the house. I don't want to be the person who makes it about money.

**Interviewer:** Tell me about the last time you settled up.

**P4:** Someone posts the total in the group chat at the end of the month and we each Venmo. Last month was $96 each. I just paid it.

**Interviewer:** Did you look at what was on the receipts?

**P4:** No. If I looked, I'd want to say something, and then I'd have to say something.

**Interviewer:** Is there anything in the house that's just yours?

**P4:** My oat milk and my cereal. I buy those myself, separate, because I don't know how to put them in the app as just mine. So I keep them on my shelf in the fridge. One time someone used the oat milk and it was on the shared receipt the next week, I think, because they replaced it. So then I paid for my own oat milk twice? I don't know. It's like two dollars.

**Interviewer:** If you could change anything about how your house does groceries, what would it be?

**P4:** Maybe if the split could be not exactly even, without me having to ask for that. Like if the app just suggested it. So it's not me bringing it up.

**Interviewer:** Anything about the app itself?

**P4:** The list is fine. I don't open it much. I'd maybe use it more if it showed what's mine.

**Interviewer:** Thank you, that's really helpful.

**P4:** Sorry, I don't have much to say.
`;

const p5 = `# P5

**Profile:** 24, master's student, 3-person apartment, Housecart user for 5 months. Quiet; long pauses before answering questions about money.

**Interviewer:** How do groceries work where you live?

**P5:** We are three people. We use the app for the list. Mostly it is okay.

**Interviewer:** Who adds things to the list?

**P5:** Everyone, a little. I add things when I finish them. But sometimes I add rice and someone already bought rice, and now we have two big bags. Because they bought it and did not tick it.

**Interviewer:** How often does that happen?

**P5:** Maybe two times a month. Rice, dish soap, eggs. It's not a big problem, but it is money.

**Interviewer:** Tell me about the last time you shopped.

**P5:** Sunday. I went to the Asian market, because a lot of what I cook comes from there. That store is far, so I go alone, and I buy mostly for myself. The shared things I buy at the normal supermarket with the others.

**Interviewer:** How do costs get split?

**P5:** The shared supermarket things are split in three. My things from the other market I pay myself.

**Interviewer:** Does that feel fair to you?

**P5:** [long pause] Mostly. I am vegetarian. And the shared list has chicken, sometimes ground beef, the sausages. I pay one third of that. I don't eat it.

**Interviewer:** Have you talked with your roommates about it?

**P5:** No. They are nice people. I think they would say okay if I asked. But I don't want to make it uncomfortable, and it is maybe fifteen dollars a month. So I don't say.

**Interviewer:** What would help?

**P5:** If I could mark "I don't eat this" on an item, and it just splits without me. Quietly. [laughs] I don't want a big feature. Just so it is not a conversation.

**Interviewer:** When people pay each other back, how does that work?

**P5:** One roommate calculates. Then she sends us the number. Sometimes I forget, and she has to remind me. I feel bad. I wish the app reminded me, so she doesn't have to.

**Interviewer:** Anything else about Housecart?

**P5:** The "shared" and "mine." On the list, everything is everyone's. My tofu was on the list and someone thought it was shared, so they bought it with the shared money, and then I was not sure if I should pay them back alone or not. Small things. But many small things.
`;

const p6 = `# P6

**Profile:** 27, software QA tester, 3-person apartment, Housecart user for 9 months (one of the earliest users).

**Interviewer:** How do groceries work in your apartment?

**P6:** There's three of us. We started with Housecart pretty early, like nine months ago. One person, usually me, does a big shop every two weeks, and then there are smaller runs in between.

**Interviewer:** How do you split costs?

**P6:** We itemize. I'm a QA tester, I like things exact. [laughs] Each item gets tagged to who it's for, or "house."

**Interviewer:** Tell me about the last time you settled up.

**P6:** Hmm. Okay, so... the last couple of months we've been doing a flat thing. Everyone Venmos me forty a week and I cover the shops. Itemizing was taking me like forty-five minutes every two weeks, going through the receipt line by line in the app. And then someone would dispute the paper towels. So we, kind of quietly, stopped.

**Interviewer:** Do you still think of it as itemized?

**P6:** [laughs] I guess not. I guess I'd still say we itemize if you asked me in a survey. That's the intent.

**Interviewer:** What's the hardest part of the money side?

**P6:** Chasing. Before the flat forty, one roommate would run up like $80, $90 and I'd have to bring it up, and they'd get defensive. Not in a mean way. Just like, "yeah yeah, I know." It's awkward being the bank. And the in-app balance... I don't think the other two have ever looked at it. They just wait for me to text.

**Interviewer:** What about the shared-versus-personal question?

**P6:** Constant. Is sparkling water house or mine? I drink most of it, but they have some. Snacks are the worst. Someone buys chips for themselves, puts them in the pantry, they get eaten, and now they're "house"? We had an actual twenty-minute discussion about hummus.

**Interviewer:** What would you want from the app?

**P6:** Honestly, make the itemizing faster, like if it could read the receipt, or make the flat-rate thing official so I'm not secretly running it off a spreadsheet. And reminders that come from the app. If the app says "you owe $40," that's just a fact. If I say it, it's me being annoying.

**Interviewer:** Anything about the list itself?

**P6:** It's okay. People forget to check things off, so we get doubles. We have three jars of peanut butter right now.
`;

const starterReadme = `# Synthesize six user-interview transcripts into insights

Housecart's team interviewed six roommates about groceries and money. They need to choose one big bet for next quarter, and your synthesis will shape that choice.

## Suggested approach
1. Read \`research-plan.md\` so you know what the team wanted to learn.
2. Read all six transcripts once without taking notes. Then read them again and pull out observations (one fact or quote per note) tagged with the participant ID.
3. Cluster the observations across participants. A theme should show up in more than one interview.
4. For each participant, compare what they **say** they do with what they **describe** doing on a specific occasion ("tell me about the last time...").
5. Watch for volume versus breadth: a request repeated many times by one person is still one data point.
6. Notice who said what. Quieter participants often mention things the talkative ones don't.

## What to submit
A zip with:
- \`README.md\`: a one-page summary the team can read in five minutes
- Your themes, each with verbatim quotes and participant IDs
- How you prioritized, with the method made explicit
- Recommendations and open questions

Add your approach notes and AI-use disclosure in the submission form.

## Files
- \`research-plan.md\`
- \`interviews/p1.md\` ... \`interviews/p6.md\`
`;

/* ───────────── Strong template ───────────── */

const strongReadme = `# Housecart interview synthesis: what to build next

## In one paragraph
The six interviews point at **money, not lists**. Settling up is socially costly, so people avoid it and one roommate ends up being "the bank" (P1, P3, P5, P6). The two quietest participants (P4, P5) are paying for food they don't eat and won't say so. Splitting rules are vague (5 of 6) and the list goes stale (5 of 6). Meal planning, the loudest request, came from one participant.

## Themes, prioritized
| # | Theme | Participants | Severity | Priority |
|---|---|---|---|---|
| T1 | Settling up is awkward, so it gets avoided | P1, P3, P5, P6 (+P4) | High: damages trust between roommates | 1 |
| T2 | Silent unfairness: quiet roommates absorb splits that don't fit them | P4, P5 (P2 unknowingly confirms) | High: invisible, likely churn | 2 |
| T3 | "Shared vs mine" has no home in the app | P1, P3, P4, P5, P6 | Medium | 3 |
| T4 | The list goes stale; buying happens in the group chat and the aisle | P1, P2, P3, P5, P6 | Low: costs $2-15 in duplicates | 4 |

**Method:** breadth (how many of six) × severity (1 = annoyance, 2 = wasted money, 3 = relationship strain). T2 has only two direct mentions but scores 3 on severity, and it's the kind of problem people don't volunteer, so I think six interviews undercount it.

## Say vs do
People **say** they want exact, itemized splits (P1, P6) and that they "always check the app" (P3). What they **describe** is the opposite: rounding to $100 each (P1), a flat $40 a week (P6), shopping from a text screenshot (P3). Building precise per-item splitting would serve the stated preference, not the behavior.

## Loud, not representative
P2 came back to meal planning four times in one interview. No one else mentioned it, so I've recorded it as one data point and parked it.

## Recommendation
Bet on **settle-up reminders sent by the app**, paired with **lightweight "not for me" tags** on items, rather than receipt scanning or meal planning. Details and open questions are in \`recommendations.md\`.

## Files
- \`insights.md\`: each theme with quotes
- \`evidence-matrix.csv\`: theme × participant
- \`recommendations.md\`: what to build, what to test first, open questions
`;

const strongInsights = `# Insights

## T1: Settling up is awkward, so it gets avoided (P1, P3, P5, P6; P4 related)
Asking for money feels personal, so the person who's owed waits, absorbs the debt or rolls it into a later total. The in-app balance exists, but nobody visits it because it's "bad news".
- "Nobody opens the app to look at how much they owe. Why would you? It's bad news." (P1)
- "Maybe if the app did the nagging so it isn't me." (P1)
- "She didn't say anything for a month. When she finally brought it up she was apologizing, like she was the one doing something wrong." (P3)
- "The app knew. The balance was right there. I just never looked" (P3)
- "I wish the app reminded me, so she doesn't have to." (P5)
- "If the app says 'you owe $40,' that's just a fact. If I say it, it's me being annoying." (P6)

**Insight:** The same message lands differently depending on who sends it. Coming from the app it's neutral; coming from a roommate it's a confrontation.

## T2: Silent unfairness (P4, P5; corroborated by P2)
The two quietest participants both pay an even share of food they don't eat (meat, meals at home) and have told no one.
- "I'm paying a fifth of the groceries and I'm eating maybe less than that." (P4)
- "If I looked, I'd want to say something, and then I'd have to say something." (P4)
- "I am vegetarian. And the shared list has chicken, sometimes ground beef, the sausages. I pay one third of that. I don't eat it." (P5)
- "Just so it is not a conversation." (P5)
- From the other side: "Our newest roommate mostly doesn't eat meat. She just eats around it, it's fine." and "I think everyone's happy." (P2)

**Insight:** P4 and P5 both want the split to adjust without them having to raise it ("without me having to ask for that", P4; "it just splits without me", P5). The solution has to be private and low-key, not a debate feature.

## T3: "Shared vs mine" has no home in the app (P1, P3, P4, P5, P6)
- "There's no way to mark something as 'mostly mine.' It ends up being a vibe." (P1)
- "So it's fifty-fifty except the stuff that's obviously yours. Which is sort of... a lot of stuff? We've never written down the rule." (P3)
- "I don't know how to put them in the app as just mine." (P4)
- "On the list, everything is everyone's." (P5)
- "We had an actual twenty-minute discussion about hummus." (P6)

## T4: The list goes stale (P1, P2, P3, P5, P6)
Items get bought without being checked off, and requests live in the group chat.
- "nobody's opening an app to tick a box. You just grab it." (P2)
- "Honestly, most of the time it's the text thread, now that I think about it." (P3)
- "We have three jars of peanut butter right now." (P6)
- P1 transcribes the group chat into the app ("I'm a human integration"); P5 reports duplicate rice, soap and eggs about twice a month.

**Severity check:** every example is a few dollars of duplicates. Annoying, but no one described it as a reason to quit.

## Say vs do
| Participant | Says | Describes doing |
|---|---|---|
| P1 | "I want it to be exact... Itemized." | "everybody Venmo me a hundred and call it even" |
| P6 | "We itemize. I'm a QA tester, I like things exact." | "Everyone Venmos me forty a week"; "we, kind of quietly, stopped" |
| P3 | "I always check the app before I go." | Shopped from a text screenshot; "most of the time it's the text thread" |
| P3 | "We split everything fifty-fifty." | Exceptions for "obviously yours" items, rule never written down |

## Loud but not representative
Meal planning, AI meal plans, nutrition and a recipe community: **P2 only**, raised four times. P2 is also the household cook and the one who said everyone's happy, which P4 and P5's interviews suggest may not be true.
`;

const strongMatrix = `theme,P1,P2,P3,P4,P5,P6,count
T1 settling up is awkward,yes,no,yes,partial,yes,yes,4
T2 silent unfairness,no,indirect,no,yes,yes,no,2
T3 shared vs mine unclear,yes,no,yes,yes,yes,yes,5
T4 list goes stale,yes,yes,yes,no,yes,yes,5
Meal planning request,no,yes,no,no,no,no,1
Say-vs-do gap on splitting,yes,no,yes,no,no,yes,3
`;

const strongRecs = `# Recommendations

## 1. App-sent settle-up nudges (addresses T1; supports T2)
A neutral, scheduled reminder from Housecart ("Your share this week: $32") with a one-tap pay link, so no roommate has to ask.
- Why: four participants described the asking as the painful part, and three explicitly asked for the app to do it (P1, P5, P6).
- Success signal: share of households with a balance over $50 older than 14 days. Today we don't know this number.

## 2. Private "not for me" tags and a house rule (addresses T2, T3)
Let anyone mark an item "not for me" or "mine", and let the house pick a default rule (even split, flat weekly amount with exclusions). Exclusions adjust the split quietly.
- Why: P4 and P5 asked for exactly this, in nearly the same words. And because people really use flat amounts (P1, P6), a rule that works with "flat + exclusions" fits real behavior better than per-item splitting.
- Not recommended: full per-item splitting or receipt scanning first. P6 abandoned itemizing because it took 45 minutes, and scanning only speeds up a process people have already dropped.

## 3. Later: reduce list staleness (T4)
A share-sheet "add to Housecart" from the messaging app and a quick "bought it" from the lock screen. Cheap and useful, but low severity.

## Park: meal planning
One participant. Revisit if it shows up in the next round or in feature-request data.

## Open questions before building
- Do reminders feel naggy at weekly cadence? Test daily, weekly and on-threshold variants.
- Will quiet roommates use "not for me" if others can see it? Should tags be visible, or only the adjusted total?
- How common is T2 really? Six interviews can't size it. Add one anonymous in-app survey question: "Does your share feel fair?"
- Does the 42% six-week drop-off correlate with unsettled balances? Check the data before the next sprint.
`;

/* ───────────── Solid template ───────────── */

const solidReadme = `# Housecart user interviews: synthesis

## Summary
I read all six transcripts and grouped what people said into four themes. The strongest signal is that users want Housecart to be **smarter**, especially around meal planning. The other big themes are awkwardness around settling up, confusion about what's shared versus personal, and a list that gets out of date.

## Themes
1. **Users want a smarter app: meal planning and recipes** (P2, P5)
2. **Settling up is awkward** (P1, P3, P5, P6)
3. **Shared vs personal items are confusing** (P1, P4, P5, P6)
4. **The list gets out of date** (P2, P3, P5, P6)

## Recommendation
Build meal planning first, since it was the most enthusiastic request and would make Housecart a daily-use app. Then add settle-up reminders, because several people said they don't want to be the one asking for money.

## How I worked
I read each transcript twice, copied quotes into a spreadsheet with the participant ID, and grouped similar quotes together. I named a theme when quotes from at least two participants fit it. Most participants talked about money and about items that are "mine" versus shared, and almost everyone had a story about buying something twice.

## Files
- \`themes.md\`: each theme with supporting quotes
- \`recommendations.md\`: what to build
`;

const solidThemes = `# Themes

## 1. Users want a smarter app: meal planning and recipes
- "you need meal planning. Like, I pick five recipes and the app builds the list for me" (P2)
- "If the app had recipes, I'd be in it every day." (P2)
- "Like, AI meal plans." (P2)
- "Meal planning. Hundred percent. With recipes." (P2)
- P5 cooks a lot and shops at a separate market for her ingredients.

Meal planning came up more than any other feature, and the participant said they would pay for it.

## 2. Settling up is awkward
- "Nobody opens the app to look at how much they owe. Why would you? It's bad news." (P1)
- "She didn't say anything for a month." (P3)
- "I wish the app reminded me, so she doesn't have to." (P5)
- "It's awkward being the bank." (P6)

## 3. Shared vs personal items are confusing
- "There's no way to mark something as 'mostly mine.'" (P1)
- "I don't know how to put them in the app as just mine." (P4)
- "On the list, everything is everyone's." (P5)
- "We had an actual twenty-minute discussion about hummus." (P6)

P4 and P5 also mentioned that even splits don't feel fair when they don't eat some of the food.

## 4. The list gets out of date
- "Now we have like thirty eggs." (P2)
- "The app is where things go to sit." (P3)
- "We have three jars of peanut butter right now." (P6)
`;

const solidRecs = `# Recommendations

1. **Meal planning**: recipes that build the shopping list automatically. This could make Housecart something people open every day.
2. **Settle-up reminders**: let the app send reminders so roommates don't have to ask each other.
3. **"Mine" tags**: let people mark items as personal so they're excluded from the shared split.
4. **Better check-off**: make it faster to mark items as bought.
`;

/* ───────────── Weak template ───────────── */

const weakReadme = `# Interview Summaries: Housecart

I read all six interviews and summarized each participant below. Overall, people like Housecart but have some frustrations with it.

## Who we talked to
Six people who use Housecart: grad students, undergrads and young professionals living with between one and four roommates. Most have used the app for a few months.

## Overall takeaways
- People use the app for their grocery list, and most like having one shared list.
- Money can be awkward, and some people forget to pay each other back.
- One user really wants meal planning and said they would pay for it.
- People sometimes buy things twice.
- The app could be improved in several ways.

## Recommendation
Housecart should talk to more users and consider adding the features people asked for, like meal planning, reminders and receipt scanning. Meal planning seems like the most exciting idea, since one participant talked about it a lot.

See \`interview-summaries.md\` for details on each participant.
`;

const weakSummaries = `# Interview Summaries

## P1
P1 is a grad student who manages money for their apartment. They want itemized splits and think that's the fair way. They mentioned it's awkward to ask for money and that people text the group chat instead of using the list. They'd like reminders.

## P2
P2 cooks for their house and really wants meal planning with recipes and nutrition info. They said they would pay for it. They also mentioned duplicate purchases. They think everyone in their house is happy.

## P3
P3 is a nurse who lives with one roommate. They always check the app before shopping. They split everything fifty-fifty. They once forgot to pay their roommate back $140.

## P4
P4 lives in a five-person house. They didn't have much to say. Costs are split evenly. They buy their own oat milk.

## P5
P5 is vegetarian and lives with two roommates. Sometimes they get duplicate rice. They would like the app to send reminders.

## P6
P6 is a QA tester who likes things exact. They itemize their splits. They want receipt scanning and reminders. They have three jars of peanut butter.
`;

const weakNextSteps = `# Next steps

Ideas people mentioned, in the order they came up:

1. Meal planning built into the list (P2 really wants this)
2. Reminders when the list hasn't been opened in a while
3. A way to mark items as "mine" vs "ours"
4. Easier ways to pay each other back

I'd suggest starting with meal planning since it came up the most strongly in the interviews, then doing the others if there's time.
`;

const mod: ChallengeModule = {
  challenge: {
    id: 'pr_interviews',
    kind: 'practice',
    companyId: null,
    title: 'Synthesize six user-interview transcripts into insights',
    summary: 'Turn six roommate interviews for a grocery-splitting app into evidence-backed themes, a clear priority order and a next bet.',
    type: 'product',
    skills: ['User research', 'Thematic analysis', 'Affinity mapping', 'Prioritization', 'Product strategy'],
    classroomConcepts: [
      { concept: 'Thematic analysis and affinity mapping', course: 'Qualitative Research Methods' },
      { concept: 'Attitudinal vs behavioral data (what people say vs do)', course: 'Human-Computer Interaction' },
      { concept: 'Sampling bias and outliers in small samples', course: 'Research Methods' },
      { concept: 'Prioritizing by reach and severity', course: 'Product Management' },
    ],
    difficulty: 'intermediate',
    estHours: 4,
    brief,
    deliverables: [
      'One-page README summary the team can read in five minutes',
      '3–4 themes, each backed by verbatim quotes with participant IDs',
      'Prioritization with an explicit method, including say-vs-do and outlier calls',
      'Recommendations with open questions to answer before building',
    ],
    rubric: [
      { id: 'synthesis', name: 'Synthesis', description: 'Finds the 3–4 cross-cutting themes, including the one only quiet participants raise, and separates stated preferences from described behavior.', weight: 30 },
      { id: 'evidence', name: 'Evidence', description: 'Every theme is backed by verbatim quotes from multiple participants, correctly attributed by ID, with no single voice overrepresented.', weight: 25 },
      { id: 'prioritization', name: 'Prioritization', description: 'Ranks themes with an explicit method such as breadth × severity, and correctly weights the loud one-off request as a single data point.', weight: 20 },
      { id: 'recommendations', name: 'Recommendations', description: 'Recommends a specific next bet that follows from the evidence, says what not to build and why, and lists open questions and success signals.', weight: 15 },
      { id: 'clarity', name: 'Clarity', description: 'A busy team can grasp the conclusion from the README in five minutes, and the detail files support it without repeating it.', weight: 10 },
    ],
    reward: { mode: 'none', amounts: [] },
    applicantCap: null,
    status: 'open',
    hiringFor: null,
    starterFiles: [
      { path: 'README.md', content: starterReadme },
      { path: 'research-plan.md', content: researchPlan },
      { path: 'interviews/p1.md', content: p1 },
      { path: 'interviews/p2.md', content: p2 },
      { path: 'interviews/p3.md', content: p3 },
      { path: 'interviews/p4.md', content: p4 },
      { path: 'interviews/p5.md', content: p5 },
      { path: 'interviews/p6.md', content: p6 },
    ],
    aiHints: {
      testing:
        "Whether you can see patterns across people instead of retelling each interview, and whether you weigh evidence by how widespread and how painful it is rather than by how loudly it was said. It also tests whether you notice the gap between what people say they do and what they describe actually doing.",
      steps: [
        'Read research-plan.md, then read all six transcripts once straight through before taking any notes.',
        'On a second pass, write one observation or quote per note, tagged with the participant ID (P1–P6).',
        'Cluster the notes across participants and name each cluster as an insight ("Settling up gets avoided because asking feels personal"), not a topic ("Money").',
        'For each participant, put their general claims next to their "last time I..." story and note where they disagree.',
        'Count how many participants support each theme, rate how severe the pain is, and rank the themes on both.',
        'Turn the top themes into a recommendation, say what you would not build yet, and list the open questions.',
      ],
      greatLooksLike:
        "A great synthesis notices that the money problems are social, not computational: people avoid asking and want the app to be the one that reminds them. It catches that two quiet participants are silently paying for food they don't eat, while the loudest participant believes everyone is happy. It flags meal planning as one person's enthusiasm, and it points out that people who say they itemize actually round or pay a flat amount. Each claim comes with quotes and participant IDs.",
      pitfalls: [
        'Writing a summary per interview (P1 said..., P2 said...) instead of themes that cut across participants.',
        'Ranking by volume: treating a request repeated many times by one participant as the top theme.',
        'Taking stated preferences at face value, such as building precise itemized splitting because people say they want it.',
        'Skipping the quieter transcripts because they are short, and missing the theme only they raise.',
        'Paraphrasing instead of quoting, or quoting without participant IDs, so the team can\'t check the evidence.',
      ],
    },
    deadlineInDays: null,
    createdDaysAgo: 80,
    seed: { participants: 14, submissions: 7, scored: 7 },
  },
  templates: [
    {
      quality: 'strong',
      notes: `### What I built
A one-page summary, four prioritized themes with verbatim quotes, a theme × participant evidence matrix, a say-vs-do table and recommendations with open questions.

### Key decisions & trade-offs
- I ranked by breadth × severity instead of mention count. That put "silent unfairness" second even though only two participants raise it directly, because it's high-severity and the kind of problem people hide. P2's "she just eats around it, it's fine" made me more confident, not less.
- I treated meal planning as one data point. P2 raised it four times, but no one else mentioned it, and it doesn't touch the money problems.
- I recommended against leading with receipt scanning or per-item splitting. People say they want exact splits, but P1 and P6 both described abandoning itemizing, so speeding it up solves a process they've already dropped.
- I kept the README to one page and put the detail in separate files.

### What I'd do with more time
Check whether unsettled balances correlate with the six-week drop-off, and draft the one-question fairness survey.`,
      files: [
        { path: 'README.md', content: strongReadme },
        { path: 'insights.md', content: strongInsights },
        { path: 'evidence-matrix.csv', content: strongMatrix },
        { path: 'recommendations.md', content: strongRecs },
      ],
      feedback:
        "This is real synthesis. You framed the money problem as social rather than computational, and you caught the silent-unfairness theme that only P4 and P5 raise, using P2's \"she just eats around it\" as corroboration. Weighing meal planning as one participant's enthusiasm and showing the say-vs-do gap on itemizing are exactly the calls the team needed. To push it further, quote P1 and P5 directly in T4 instead of paraphrasing, and give recommendation 2 a success signal the way you did for recommendation 1.",
      aiDisclosure:
        'Used an AI assistant to double-check that every quote in insights.md appears word for word in the transcripts. The themes and ranking are my own.',
    },
    {
      quality: 'solid',
      notes: `### What I built
A summary with four themes, supporting quotes for each, and a list of recommendations.

### Key decisions & trade-offs
- I grouped quotes into themes after reading all six interviews, and I made sure each theme had quotes with participant IDs.
- I put "smarter app / meal planning" first because it was the strongest and most enthusiastic signal. The participant said they would pay for it, and it would make Housecart a daily-use app, which could help retention.
- I combined the fairness comments from P4 and P5 into the shared-vs-personal theme, since both are about who pays for what.
- I kept the recommendations short so the team can act on them.

### What I'd do with more time
Add a clearer ranking method, and look more closely at how people actually split money compared with what they say.`,
      files: [
        { path: 'README.md', content: solidReadme },
        { path: 'themes.md', content: solidThemes },
        { path: 'recommendations.md', content: solidRecs },
      ],
      feedback:
        "Your settling-up, shared-vs-mine and stale-list themes are well found and well quoted, with IDs on everything. The big miss is the ranking: theme 1 rests entirely on P2 (four of its quotes are P2's, and P5 shopping at another market isn't a meal-planning request), so one loud voice became your top recommendation. Folding P4 and P5's unfairness into shared-vs-mine also hides the most important finding, which is that quiet roommates are paying for food they don't eat and won't say so. Make your prioritization method explicit (for example breadth × severity) and compare the \"we itemize\" claims with what P1 and P6 actually do.",
      aiDisclosure: 'Used an AI tool to help group my notes into themes, then edited the groups by hand.',
    },
    {
      quality: 'weak',
      notes: `### What I built
A summary of each of the six interviews, in order from P1 to P6, plus a short list of overall takeaways and a recommendation.

### Key decisions & trade-offs
- I summarized each interview separately so nothing would get lost and the team can see each participant's point of view in one place.
- I focused on what each participant said they do and what they asked for, since that's the most direct information about what users want.
- I didn't spend much time on P4 because their answers were very short and they said they didn't have much to say.
- I included every feature request in the recommendation so the team has all the options in front of them and can decide.
- I put meal planning near the top because P2 was so excited about it and said they would pay for it.

### What I'd do with more time
Group the summaries into themes, add direct quotes and maybe make a chart of which features people asked for most.`,
      files: [
        { path: 'README.md', content: weakReadme },
        { path: 'interview-summaries.md', content: weakSummaries },
        { path: 'next-steps.md', content: weakNextSteps },
      ],
      feedback:
        "The per-participant summaries are accurate, which is a start, but they retell the interviews instead of synthesizing them: the team still has to find the patterns themselves. Several summaries repeat what people said rather than what they did; for example, P3 \"always checks the app\" but described shopping from a text screenshot, and P6 \"itemizes\" but now pays a flat $40 a week. P4's short answers hide one of the most important findings, an even split that feels unfair but goes unspoken. Try clustering quotes across participants into 3–4 themes, then rank them.",
    },
  ],
  scripted: [
    {
      challengeId: 'pr_interviews',
      studentId: 'stu_riley',
      scores: { synthesis: 5, evidence: 4, prioritization: 5, recommendations: 4, clarity: 4 },
      feedback:
        "Excellent synthesis. Framing the money problem as social, and catching that only P4 and P5 raise the unfairness theme while P2 believes everyone's happy, is the insight most people miss. Your breadth × severity ranking is explicit and defensible, and parking meal planning as a single data point was the right call. A few points held it back: T4 paraphrases P1 and P5 instead of quoting them, recommendation 2 has no success signal the way recommendation 1 does, and the README and evidence matrix repeat each other in places, so the README could be tighter.",
      templateIndex: 0,
      submittedDaysAgo: 30,
    },
  ],
};

export default mod;
