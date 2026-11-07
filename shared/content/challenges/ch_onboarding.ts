import type { ChallengeModule } from '../lib.ts';

const brief = `## Context
About 2.3 million people a month use Kitebird to find their hobby communities. Our weak spot is the first week. Only 18% of new sign-ups post anything in their first 7 days, and the people who do are about 4× likelier to still be active at day 30 (64% vs. 16%).

Today a new account goes through 7 onboarding screens before it sees a single community: welcome, notifications, a "pick 5 interests" grid, contacts import, follow suggestions, profile setup and a communities picker. Across our last four weekly cohorts (roughly 10,000 sign-ups each), only 45% reach the home feed at all.

## The task
Redesign first-run onboarding so more new users make a first post.

1. Use the funnel data and the research to find where and why we lose people. Tell us what you think the real problem is.
2. Design a new flow from "account created" to "first post published". Show every screen with real copy.
3. Cover the unhappy paths: skipping, a denied permission, and someone who isn't ready to post yet.
4. Tell us how we'd know it worked: a primary metric with a target, and at least one guardrail.

## Constraints
- Time box: 4 hours. A sharp, well-argued flow beats a pixel-perfect deck.
- Use any tools. Submit a zip with a README.md plus markdown and/or simple SVG wireframes. A prototype link is a bonus, not a requirement.
- Account creation and the post composer itself are out of scope. A post can be a photo, text or a question.
- The OS will still show its own permission dialog whenever we ask for notifications or contacts. You decide when, and whether, we ask.
- AI tools are welcome. Tell us how you used them in your notes.

## What we provide
- \`data/onboarding_funnel.csv\`: per-step counts, drop-off and median time on step for the four weekly cohorts starting Sept 28 to Oct 19.
- \`current-flow.md\`: today's 7 screens with their actual copy.
- \`research/user-quotes.md\`: 14 quotes from app reviews, support tickets and 5 short interviews.
- \`brand-basics.md\`: colors, type and voice.
- \`README.md\`: how the files fit together and how we define a "first post".
`;

const funnelCsv = `cohort_week,step,step_name,users_entered,users_completed,drop_off_pct,median_sec_on_step
2026-09-28,1,welcome,9840,9643,2.0,6
2026-09-28,2,notifications_permission,9643,9248,4.1,9
2026-09-28,3,pick_5_interests,9248,7417,19.8,52
2026-09-28,4,contacts_import,7417,5259,29.1,21
2026-09-28,5,follow_suggestions,5259,4938,6.1,34
2026-09-28,6,profile_setup,4938,4582,7.2,41
2026-09-28,7,join_communities,4582,4399,4.0,18
2026-09-28,8,first_post_within_7d,4399,1771,59.7,
2026-10-05,1,welcome,10215,10021,1.9,6
2026-10-05,2,notifications_permission,10021,9630,3.9,9
2026-10-05,3,pick_5_interests,9630,7675,20.3,55
2026-10-05,4,contacts_import,7675,5472,28.7,22
2026-10-05,5,follow_suggestions,5472,5155,5.8,33
2026-10-05,6,profile_setup,5155,4794,7.0,43
2026-10-05,7,join_communities,4794,4593,4.2,18
2026-10-05,8,first_post_within_7d,4593,1808,60.6,
2026-10-12,1,welcome,9612,9410,2.1,6
2026-10-12,2,notifications_permission,9410,9034,4.0,8
2026-10-12,3,pick_5_interests,9034,7263,19.6,51
2026-10-12,4,contacts_import,7263,5120,29.5,21
2026-10-12,5,follow_suggestions,5120,4797,6.3,35
2026-10-12,6,profile_setup,4797,4466,6.9,40
2026-10-12,7,join_communities,4466,4292,3.9,17
2026-10-12,8,first_post_within_7d,4292,1749,59.2,
2026-10-19,1,welcome,10388,10180,2.0,6
2026-10-19,2,notifications_permission,10180,9752,4.2,9
2026-10-19,3,pick_5_interests,9752,7792,20.1,53
2026-10-19,4,contacts_import,7792,5540,28.9,20
2026-10-19,5,follow_suggestions,5540,5208,6.0,34
2026-10-19,6,profile_setup,5208,4828,7.3,42
2026-10-19,7,join_communities,4828,4630,4.1,18
2026-10-19,8,first_post_within_7d,4630,1859,59.8,
`;

const currentFlowMd = `# Current first-run flow (app v6.3, iOS and Android)

Shown once, right after account creation. There is no way to resume: if someone force-quits mid-flow, they restart at screen 1 next launch. Copy below is exactly what ships today.

## 1. Welcome
- Illustration: three kites over a park.
- Headline: **Find your people, one hobby at a time.**
- Body: "Kitebird is where hobbies turn into friendships."
- Button: **Let's go**

## 2. Notifications
- Headline: **Don't miss a thing**
- Body: "Turn on notifications so you know when someone replies, follows you, or a meetup is happening near you."
- Primary: **Turn on notifications** (opens the OS dialog). Secondary: **Not now**
- 38% of people who see the OS dialog tap Allow.

## 3. Pick 5 interests
- Headline: **What are you into?**
- Body: "Pick at least 5 so we can personalize your Kitebird."
- A scrolling grid of 48 tiles in 8 categories (Making, Outdoors, Food & Drink, Games, Music, Collecting, Fitness, Arts). No search.
- Counter in the button: **Continue (2 of 5)**. The button is disabled until 5 tiles are selected. No skip.

## 4. Contacts import
- Headline: **Kitebird is better with friends**
- Body: "Sync your contacts to see who's already here. We'll never post or message anyone without asking."
- Primary: **Sync contacts** (opens the OS dialog). Skip: a small gray **Skip** link in the top-right corner (13 pt).
- If the OS permission is denied, a modal appears: "Contacts access is off. You can turn it on in Settings." Buttons: **Open Settings** / **Cancel**. Cancel returns to this same screen.

## 5. Follow suggestions
- Headline: **People you might like**
- Body: "Follow at least 3 people to fill your feed."
- A list of 20 popular accounts matched to your interests, each with a **Follow** button. **Continue** is disabled until 3 are followed.

## 6. Profile setup
- Headline: **Show people who you are**
- Fields: photo, display name (prefilled), bio (160 characters).
- Primary: **Save & continue**. Secondary: **Skip for now**

## 7. Join communities
- Headline: **Communities picked for you**
- Six community cards based on your interests, all preselected.
- Button: **Join 6 communities** (the count updates if you deselect).

## After onboarding
- Lands on the **Home** feed: a mix of the most popular posts from all joined communities.
- Posting happens through the **+** button in the tab bar. There is no first-post prompt anywhere.
- The first nudge is a push on day 3, "Say hi to your new communities!", which only reaches people who allowed notifications.
`;

const userQuotesMd = `# What new users are telling us

Collected Oct 2026 by the Growth Design pod. Sources: app-store reviews (R), support tickets (T) and five 20-minute interviews with people who signed up in the last month (P1 to P5).

## Getting through onboarding
1. "Why do I have to pick FIVE things? I came for climbing. I picked random stuff just to get past it and now my feed is half knitting." (R, 2 stars)
2. "It asked for my contacts before I even knew what the app was. Hard no. I closed it." (R, 1 star)
3. "I hit Don't Allow on contacts and then it kept bouncing me back to the same screen. I didn't see the skip button until my second try." (T-48213)
4. "I spent like five minutes on the interests screen because I couldn't find 'tabletop' anywhere. It was under Games, page three." (P2)
5. "Following random influencers to unlock the app felt weird. I don't know these people." (P4)
6. "Honestly the setup was fine once I got to the communities part. That's what I wanted from the start." (P1)

## The first post
7. "Everyone in the film group posts these perfect scans. I shoot on a twenty-dollar camera. What would I even post?" (P3)
8. "I opened the plus button, stared at the empty box, and closed it." (P5)
9. "I'd ask a question, but I didn't want to look dumb in front of 40,000 people." (P2)
10. "Is there a place for beginners? I couldn't tell which community was the chill one." (T-48977)
11. "I didn't know if I was supposed to introduce myself or if that's cringe here." (P4)
12. "I joined six communities on day one and my feed was a firehose. I never figured out where my post would even go." (R, 3 stars)

## When it clicked
13. "Someone replied to my first sourdough photo within an hour and told me my crumb looked great. I was hooked after that." (P1)
14. "The weekly 'show your progress' thread in Bouldering is the only reason I posted. Everyone posts their bad attempts there." (P3)
`;

const brandBasicsMd = `# Kitebird brand basics (product UI)

## Color
| Token | Hex | Use |
|---|---|---|
| Coral 600 | #C73E22 | Primary buttons, key links (5.1:1 on white) |
| Coral 100 | #FFE6DF | Selected states, soft highlights |
| Ink 900 | #1F2430 | Body text and headlines |
| Ink 500 | #5B6273 | Secondary text (6.1:1 on white) |
| Paper | #FFF9F4 | App background |
| Sky 600 | #2D6CC0 | Info, links inside posts |
| Moss 600 | #2F7D5B | Success, "posted" confirmations |
| Line | #E6E1DA | Dividers, card borders |

## Type
- Kite Sans (our in-house grotesk), falling back to the system UI font.
- Display 28/34 semibold for screen headlines, Title 20/26 semibold, Body 16/24 regular, Caption 13/18 regular.
- Sentence case everywhere, including buttons.

## Layout
- 8 pt grid; 16 pt screen margins; cards have 12 pt corner radius.
- Primary button: full width, 52 pt tall, pinned 24 pt above the bottom safe area.
- Minimum touch target 44 × 44 pt.

## Voice
Warm, playful, short. We sound like the friendly regular at the climbing gym, not a brand.
- Talk to one person: "you", never "users".
- Lead with what people get, not what we need ("See who's here", not "Sync your contacts").
- One exclamation mark per screen, maximum. No guilt ("Don't miss out!") and no pressure ("Last chance").
- Celebrate small wins. A first post is a big deal; treat it like one.

Good: "Say hi to the sourdough crowd." Not: "Engage with your community to unlock features."
`;

const starterReadme = `# Starter kit: first-run onboarding

Hi, and thanks for taking this on. This kit has everything we would hand a new designer in their first week on the Growth Design pod.

## Files
| File | What it is |
|---|---|
| data/onboarding_funnel.csv | One row per onboarding step per weekly cohort, plus a final row for first posts |
| current-flow.md | Today's 7 screens, with the copy that actually ships |
| research/user-quotes.md | 14 quotes from reviews, support tickets and interviews |
| brand-basics.md | Colors, type, layout rules and voice |

## Reading the funnel
- users_entered is everyone who saw the step; users_completed is everyone who moved on. Tapping Skip or Not now counts as completed.
- drop_off_pct = (entered - completed) / entered, rounded to one decimal.
- Step 8 starts from people who reached the home feed and counts those who published a first post within 7 days of sign-up.
- median_sec_on_step is measured for people who completed the step.

## Definitions
- **First post**: an original post (photo, text or question) in any community. Comments and reactions don't count.
- **Active at day 30**: opened the app at least once between day 28 and day 34 after sign-up.
- Week-one posters are active at day 30 at 64%; everyone else at 16%.

## What to send back
A zip with a README.md that explains your thinking, your flow (screens with real copy) and how we would measure it. SVG wireframes, a markdown spec or a prototype link are all fine. Questions go to design@kitebird.example; we answer within one business day.
`;

/* ───────────── Strong template ───────────── */

const strongReadme = `# First post in under 2 minutes

**Prototype:** https://prototypes.example/kitebird-first-post (tap-through, 5 screens)

## The problem, from the data
Across the four cohorts, about 5,500 of every ~10,000 sign-ups never reach the home feed. Two screens cause most of that:

| Step | Avg drop-off | Share of all onboarding losses |
|---|---|---|
| Contacts import | 29.0% | ~40% |
| Pick 5 interests | 20.0% | ~34% |
| Everything else combined | | ~26% |

The interests grid is also the slowest screen (median 53 s), and quote 1 shows people picking random tiles just to unlock Continue, which then pollutes their feed.

But fixing the funnel alone isn't enough. Even people who finish onboarding only post 40% of the time. The quotes say why: they don't know **what** to post or **where** (quotes 7 to 12). The two moments that worked (13 and 14) were a low-stakes thread and a fast reply.

## The idea
Three steps from account created to a first post, landing in **one** community instead of six:

1. **Pick a hobby to start:** one choice, with search.
2. **Meet your community:** a welcome card from the hosts and the community's "New here" thread.
3. **Say hi:** a guided first post with three starter options that are fine to be bad at.

Contacts, follow suggestions and profile setup move out of onboarding and come back later, in context, when they are actually useful.

## Files
- flow.md: screen-by-screen flow with copy, plus skip and permission-denied paths
- metrics.md: primary metric, targets, guardrails and the test plan
- wireframes/01-pick-a-hobby.svg, 02-meet-your-community.svg, 03-say-hi.svg

## Assumptions
- Every community can have a pinned "New here" thread. About 70% of our top 200 communities already run something similar; for the rest we'd seed one.
- Hosts can write a 1-line welcome. Where they haven't, we fall back to a default from the brand voice.
`;

const strongFlow = `# Flow: account created to first post

## Step 1: Pick a hobby to start
- Headline: **What do you want to get into first?**
- Body: "Pick one to start. You can add more anytime."
- Search field: "Search hobbies (try 'tabletop')". Below it, 12 popular tiles, then "See all 48".
- Tapping a tile selects it and enables **Continue**. Choosing a second tile replaces the first; a small link "Add another later" explains why.
- Edge case, nothing fits: "Can't find it?" opens a free-text field and routes to Hobby Hub, our general community, plus a log of the term for the content team.

## Step 2: Meet your community
- Auto-joins the biggest beginner-friendly community for that hobby (for example, Film Photography).
- Welcome card: host avatar and "Welcome! Most of us started with a thrifted camera too. Say hi in New here."
- Below it: the 3 most recent posts from the **New here** thread, so people see that beginner posts are normal.
- Primary: **Say hi**. Secondary: **Just look around**.

## Step 3: Say hi (guided first post)
- Headline: **Your first post can be tiny**
- Three starters, each opens the composer prefilled and posts to New here:
  - **Introduce yourself:** "Hi! I'm new to film photography. Right now I'm..."
  - **Show a first try:** "Here's my first [roll / loaf / climb]. Be gentle." with the photo picker open
  - **Ask a question:** three example chips, e.g. "What camera should I start with?"
- Footer: "Posts in New here only show up in this thread."
- After posting: "You did it. We'll tell you when someone replies." with **Turn on reply alerts**. This is where we ask for notifications, because now there's a reason.

## Unhappy paths
- **Just look around:** go to the community feed with a dismissible card at the top: "Whenever you're ready, a question counts as a first post." The card returns once, on day 2, then never again.
- **Notifications denied:** no modal, no Settings dead end. We confirm in-app ("Replies will show up in your Activity tab") and send a reply digest by email if we have their consent.
- **Force quit mid-flow:** resume at the last completed step, not at screen 1.
- **Contacts:** never in onboarding. After their first reply we show "Know someone who'd love this? Invite a friend" with a share link. No contacts permission needed.
- **Profile:** a generated avatar in the community color. We prompt for a photo only after the first post.
`;

const strongMetrics = `# How we'd know it worked

## Primary metric
**% of sign-ups who publish a first post within 7 days.** Baseline 18% (four cohorts, Sept 28 to Oct 19). Target: 25% in the test arm.

## Leading indicators
- First post within 24 hours of sign-up. Not in the current data; we would instrument it before launch and expect most of the lift to show here first.
- Onboarding completion (reached a community): 45% today. Target 75%.
- Share of first posts made through a starter option vs. the blank composer.

## Guardrails
- **Day-30 activity** of the test arm must not fall below control. More posts from less-committed people could dilute the 4× effect; we would watch it, not assume it.
- **Report and hide rate on first posts** stays at or below the current community average, so New here doesn't fill up with spam.
- **Notification opt-in** stays at or above 38%. We ask later, so fewer people see the prompt; the rate among those who see it should go up.
- **Invites sent within 14 days**, since we removed contacts import from onboarding.

## Test plan
- 50/50 split of new sign-ups for two weekly cohorts, about 10,000 people per arm. At an 18% baseline that is enough to detect a lift of roughly 2 percentage points.
- Read the 7-day result on day 14, and day-30 activity a month later before full rollout.
- Segment by hobby: communities without an active New here thread are the main risk.
`;

const strongSvg1 = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="740" viewBox="0 0 360 740" font-family="system-ui, sans-serif">
<rect x="0" y="0" width="360" height="740" rx="28" fill="#FFF9F4" stroke="#1F2430" stroke-width="2"/>
<text x="24" y="40" font-size="12" fill="#5B6273">Step 1 of 3</text>
<rect x="24" y="50" width="104" height="4" rx="2" fill="#C73E22"/>
<rect x="128" y="50" width="208" height="4" rx="2" fill="#E6E1DA"/>
<text x="24" y="100" font-size="24" font-weight="600" fill="#1F2430">What do you want to</text>
<text x="24" y="130" font-size="24" font-weight="600" fill="#1F2430">get into first?</text>
<text x="24" y="160" font-size="15" fill="#5B6273">Pick one to start. You can add more anytime.</text>
<rect x="24" y="180" width="312" height="44" rx="10" fill="#FFFFFF" stroke="#E6E1DA"/>
<text x="40" y="207" font-size="14" fill="#5B6273">Search hobbies (try "tabletop")</text>
<g font-size="14" fill="#1F2430">
<rect x="24" y="244" width="150" height="72" rx="12" fill="#FFE6DF" stroke="#C73E22" stroke-width="2"/>
<text x="40" y="286">Film photography</text>
<rect x="186" y="244" width="150" height="72" rx="12" fill="#FFFFFF" stroke="#E6E1DA"/>
<text x="202" y="286">Bouldering</text>
<rect x="24" y="328" width="150" height="72" rx="12" fill="#FFFFFF" stroke="#E6E1DA"/>
<text x="40" y="370">Sourdough</text>
<rect x="186" y="328" width="150" height="72" rx="12" fill="#FFFFFF" stroke="#E6E1DA"/>
<text x="202" y="370">Tabletop games</text>
<rect x="24" y="412" width="150" height="72" rx="12" fill="#FFFFFF" stroke="#E6E1DA"/>
<text x="40" y="454">Knitting</text>
<rect x="186" y="412" width="150" height="72" rx="12" fill="#FFFFFF" stroke="#E6E1DA"/>
<text x="202" y="454">Houseplants</text>
</g>
<text x="24" y="516" font-size="14" fill="#2D6CC0">See all 48 hobbies</text>
<text x="24" y="544" font-size="14" fill="#2D6CC0">Can't find it?</text>
<rect x="24" y="640" width="312" height="52" rx="12" fill="#C73E22"/>
<text x="180" y="672" font-size="16" font-weight="600" fill="#FFFFFF" text-anchor="middle">Continue</text>
</svg>
`;

const strongSvg2 = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="740" viewBox="0 0 360 740" font-family="system-ui, sans-serif">
<rect x="0" y="0" width="360" height="740" rx="28" fill="#FFF9F4" stroke="#1F2430" stroke-width="2"/>
<text x="24" y="40" font-size="12" fill="#5B6273">Step 2 of 3</text>
<rect x="24" y="50" width="208" height="4" rx="2" fill="#C73E22"/>
<rect x="232" y="50" width="104" height="4" rx="2" fill="#E6E1DA"/>
<text x="24" y="96" font-size="24" font-weight="600" fill="#1F2430">Film Photography</text>
<text x="24" y="120" font-size="14" fill="#5B6273">41,200 members · You just joined</text>
<rect x="24" y="140" width="312" height="110" rx="12" fill="#FFFFFF" stroke="#E6E1DA"/>
<circle cx="52" cy="172" r="16" fill="#FFE6DF"/>
<text x="76" y="168" font-size="13" font-weight="600" fill="#1F2430">From the hosts</text>
<text x="76" y="186" font-size="12" fill="#5B6273">Community host</text>
<text x="40" y="214" font-size="14" fill="#1F2430">Welcome! Most of us started with a</text>
<text x="40" y="234" font-size="14" fill="#1F2430">thrifted camera too. Say hi in New here.</text>
<text x="24" y="284" font-size="16" font-weight="600" fill="#1F2430">New here</text>
<g font-size="13" fill="#1F2430">
<rect x="24" y="298" width="312" height="64" rx="12" fill="#FFFFFF" stroke="#E6E1DA"/>
<text x="40" y="324">"First roll ever, half of it is my thumb."</text>
<text x="40" y="346" fill="#5B6273">14 replies</text>
<rect x="24" y="372" width="312" height="64" rx="12" fill="#FFFFFF" stroke="#E6E1DA"/>
<text x="40" y="398">"Which lab do you all use for 35mm?"</text>
<text x="40" y="420" fill="#5B6273">9 replies</text>
<rect x="24" y="446" width="312" height="64" rx="12" fill="#FFFFFF" stroke="#E6E1DA"/>
<text x="40" y="472">"Hi from a total beginner in Ohio."</text>
<text x="40" y="494" fill="#5B6273">22 replies</text>
</g>
<rect x="24" y="616" width="312" height="52" rx="12" fill="#C73E22"/>
<text x="180" y="648" font-size="16" font-weight="600" fill="#FFFFFF" text-anchor="middle">Say hi</text>
<text x="180" y="698" font-size="15" fill="#2D6CC0" text-anchor="middle">Just look around</text>
</svg>
`;

const strongSvg3 = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="740" viewBox="0 0 360 740" font-family="system-ui, sans-serif">
<rect x="0" y="0" width="360" height="740" rx="28" fill="#FFF9F4" stroke="#1F2430" stroke-width="2"/>
<text x="24" y="40" font-size="12" fill="#5B6273">Step 3 of 3</text>
<rect x="24" y="50" width="312" height="4" rx="2" fill="#C73E22"/>
<text x="24" y="100" font-size="24" font-weight="600" fill="#1F2430">Your first post can be tiny</text>
<text x="24" y="128" font-size="15" fill="#5B6273">Pick a starter. You can edit everything.</text>
<g fill="#1F2430">
<rect x="24" y="150" width="312" height="84" rx="12" fill="#FFFFFF" stroke="#E6E1DA"/>
<text x="40" y="180" font-size="16" font-weight="600">Introduce yourself</text>
<text x="40" y="204" font-size="13" fill="#5B6273">"Hi! I'm new to film photography. Right</text>
<text x="40" y="222" font-size="13" fill="#5B6273">now I'm..."</text>
<rect x="24" y="246" width="312" height="84" rx="12" fill="#FFFFFF" stroke="#E6E1DA"/>
<text x="40" y="276" font-size="16" font-weight="600">Show a first try</text>
<text x="40" y="300" font-size="13" fill="#5B6273">"Here's my first roll. Be gentle."</text>
<rect x="24" y="342" width="312" height="120" rx="12" fill="#FFFFFF" stroke="#E6E1DA"/>
<text x="40" y="372" font-size="16" font-weight="600">Ask a question</text>
<rect x="40" y="388" width="230" height="28" rx="14" fill="#FFE6DF"/>
<text x="52" y="407" font-size="12">What camera should I start with?</text>
<rect x="40" y="424" width="200" height="28" rx="14" fill="#FFE6DF"/>
<text x="52" y="443" font-size="12">Is it worth developing at home?</text>
</g>
<text x="24" y="500" font-size="13" fill="#5B6273">Posts in New here only show up in this thread.</text>
<text x="180" y="698" font-size="15" fill="#2D6CC0" text-anchor="middle">Maybe later</text>
</svg>
`;

/* ───────────── Solid template ───────────── */

const solidReadme = `# A shorter path to the community

**Prototype:** https://prototypes.example/kb-onboarding-v2

## Summary
Today's onboarding is 7 screens long, and new users have to do a lot of work (picking interests, syncing contacts, following people, writing a bio) before they get any value. My redesign cuts it to 4 screens and gets people into their communities much faster, with a clear prompt to make a first post once they arrive.

## What changed
1. **Interests: pick 3 instead of 5**, with a search bar so people can find niche hobbies.
2. **Communities:** suggested from those interests, shown as bigger cards with member counts and a sample post.
3. **Profile:** optional, one screen, with a generated avatar so nobody is blocked on a photo.
4. **Home:** a "Make your first post" banner at the top of the feed.

Removed entirely: contacts import and follow suggestions. Both felt like they were asking for something before giving anything back, which several quotes complain about. Notifications move to after the first post.

## Why
The research makes it clear that onboarding feels long and demanding. Fewer steps should mean more people reach their communities, and once they're there, the banner makes posting the obvious next action.

## Files
- flow.md: the 4 screens with copy
- wireframes/01-interests.svg
- wireframes/04-home-banner.svg

I focused on getting the core flow and the visuals right inside the time box, using Kitebird's colors and type scale from brand-basics.md.
`;

const solidFlow = `# Onboarding v2: screens and copy

## 1. Interests
- Headline: **What are you into?**
- Body: "Pick 3 to get started."
- Search: "Search hobbies"
- Grid of 48 tiles, same categories as today, with search results filtering the grid.
- Button: **Continue (1 of 3)**, enabled at 3.

## 2. Your communities
- Headline: **Here's where your people hang out**
- 4 suggested communities as large cards: name, member count, one recent photo.
- Each card has a **Join** toggle, all on by default.
- Button: **Join and continue**

## 3. Profile (optional)
- Headline: **Add a face to the name**
- Generated avatar in coral, a photo upload button, display name.
- Primary: **Looks good**. Secondary: **Skip**

## 4. Home with first-post banner
- The normal Home feed from all joined communities.
- Pinned banner: **Make your first post** / "Share what you're working on." Button: **Post**
- Tapping Post opens the standard composer with a community picker.
- The banner disappears after the first post or after 3 dismissals.

## Notifications
After the first post: "Get notified when people reply?" with **Turn on** / **Not now**.
`;

const solidSvg1 = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="740" viewBox="0 0 360 740" font-family="system-ui, sans-serif">
<rect x="0" y="0" width="360" height="740" rx="28" fill="#FFF9F4" stroke="#1F2430" stroke-width="2"/>
<text x="24" y="80" font-size="26" font-weight="600" fill="#1F2430">What are you into?</text>
<text x="24" y="108" font-size="15" fill="#5B6273">Pick 3 to get started.</text>
<rect x="24" y="128" width="312" height="44" rx="10" fill="#FFFFFF" stroke="#E6E1DA"/>
<text x="40" y="155" font-size="14" fill="#5B6273">Search hobbies</text>
<g font-size="13" fill="#1F2430">
<rect x="24" y="192" width="98" height="88" rx="12" fill="#FFE6DF" stroke="#C73E22" stroke-width="2"/>
<text x="36" y="268">Bouldering</text>
<rect x="131" y="192" width="98" height="88" rx="12" fill="#FFFFFF" stroke="#E6E1DA"/>
<text x="143" y="268">Sourdough</text>
<rect x="238" y="192" width="98" height="88" rx="12" fill="#FFFFFF" stroke="#E6E1DA"/>
<text x="250" y="268">Knitting</text>
<rect x="24" y="292" width="98" height="88" rx="12" fill="#FFFFFF" stroke="#E6E1DA"/>
<text x="36" y="368">Film</text>
<rect x="131" y="292" width="98" height="88" rx="12" fill="#FFE6DF" stroke="#C73E22" stroke-width="2"/>
<text x="143" y="368">Tabletop</text>
<rect x="238" y="292" width="98" height="88" rx="12" fill="#FFFFFF" stroke="#E6E1DA"/>
<text x="250" y="368">Running</text>
</g>
<rect x="24" y="640" width="312" height="52" rx="12" fill="#C73E22" opacity="0.5"/>
<text x="180" y="672" font-size="16" font-weight="600" fill="#FFFFFF" text-anchor="middle">Continue (2 of 3)</text>
</svg>
`;

const solidSvg2 = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="740" viewBox="0 0 360 740" font-family="system-ui, sans-serif">
<rect x="0" y="0" width="360" height="740" rx="28" fill="#FFF9F4" stroke="#1F2430" stroke-width="2"/>
<text x="24" y="60" font-size="22" font-weight="600" fill="#1F2430">Home</text>
<rect x="24" y="80" width="312" height="120" rx="12" fill="#FFE6DF"/>
<text x="40" y="114" font-size="17" font-weight="600" fill="#1F2430">Make your first post</text>
<text x="40" y="138" font-size="14" fill="#1F2430">Share what you're working on.</text>
<rect x="40" y="152" width="88" height="36" rx="10" fill="#C73E22"/>
<text x="84" y="175" font-size="14" font-weight="600" fill="#FFFFFF" text-anchor="middle">Post</text>
<rect x="24" y="216" width="312" height="200" rx="12" fill="#FFFFFF" stroke="#E6E1DA"/>
<rect x="40" y="232" width="280" height="120" rx="8" fill="#E6E1DA"/>
<text x="40" y="378" font-size="13" font-weight="600" fill="#1F2430">Bouldering · 2h</text>
<text x="40" y="398" font-size="13" fill="#5B6273">Finally sent my first V4!</text>
<rect x="24" y="432" width="312" height="200" rx="12" fill="#FFFFFF" stroke="#E6E1DA"/>
<rect x="40" y="448" width="280" height="120" rx="8" fill="#E6E1DA"/>
<text x="40" y="594" font-size="13" font-weight="600" fill="#1F2430">Tabletop Games · 5h</text>
<text x="40" y="614" font-size="13" fill="#5B6273">Game night recap, 6 players, 1 winner</text>
</svg>
`;

/* ───────────── Weak template ───────────── */

const weakReadme = `# Kitebird onboarding refresh

## Overview
I gave Kitebird's onboarding a full visual refresh. The current screens feel plain and a bit corporate for a hobby app, so I created a more playful look with custom illustrations for each step, a warmer color treatment and friendlier copy. The goal is to make the first few minutes feel as fun as the communities themselves.

## What I changed
- A new illustration for each of the 7 screens, all based on the kite motif: kites tangled in trees, kites made of film strips, a kite shaped like a loaf of bread, etc.
- A progress bar with little kite icons so people know where they are (1 of 7).
- Rewrote headlines to sound more fun (see screens.md).
- Larger tiles on the interests screen with photos instead of icons.
- A confetti animation when you finish onboarding.

## Screens
All 7 steps are kept in the same order: welcome, notifications, interests, contacts, follow suggestions, profile and communities. I think each step has a purpose, so I didn't want to remove anything the team had decided on. Making them more delightful should help more people get through.

## Files
- screens.md: copy and illustration notes per screen
- style-notes.md: colors and motion
- wireframes/welcome.svg: the new welcome screen

## Next steps
I would love to animate the illustrations and test which ones people like best.
`;

const weakScreens = `# Screens

| # | Screen | New headline | Illustration |
|---|---|---|---|
| 1 | Welcome | Ready for takeoff? | Three kites over a city skyline |
| 2 | Notifications | Stay in the loop! | A kite with a bell for a tail |
| 3 | Interests | Pick your passions! (choose 5) | Photo tiles instead of icons |
| 4 | Contacts | Bring your crew! | Kites holding hands |
| 5 | Follow suggestions | Find your flock! | Birds flying in a V |
| 6 | Profile | Strike a pose! | A kite taking a selfie |
| 7 | Communities | Your communities await! | A kite landing on a map |

Every screen gets the same layout: illustration on top (about 45% of the screen), headline, one line of body copy and a full-width coral button. The Skip link on the contacts screen moves next to the button so it's easier to see.

After screen 7, a confetti animation plays for 1.5 seconds and then shows the home feed.
`;

const weakStyle = `# Style notes

- Background: Paper (#FFF9F4) with a soft coral gradient at the top of each screen.
- Headlines: Kite Sans Display, 28 pt, Ink 900.
- Buttons: Coral 600, full width, 52 pt, rounded 12 pt.
- Illustrations: flat vector, 2-color (coral and sky), with a hand-drawn outline.
- Motion: each illustration gently floats (4 px up and down, 3 s loop). Confetti on completion.
- Progress: 7 kite icons at the top; the current one is coral, the rest are gray.
`;

const weakSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="740" viewBox="0 0 360 740" font-family="system-ui, sans-serif">
<rect x="0" y="0" width="360" height="740" rx="28" fill="#FFF9F4" stroke="#1F2430" stroke-width="2"/>
<g fill="#E6E1DA">
<circle cx="76" cy="44" r="6" fill="#C73E22"/><circle cx="110" cy="44" r="6"/><circle cx="144" cy="44" r="6"/><circle cx="178" cy="44" r="6"/><circle cx="212" cy="44" r="6"/><circle cx="246" cy="44" r="6"/><circle cx="280" cy="44" r="6"/>
</g>
<rect x="24" y="72" width="312" height="300" rx="16" fill="#FFE6DF"/>
<polygon points="120,120 160,180 120,250 80,180" fill="#C73E22"/>
<polygon points="220,150 250,195 220,245 190,195" fill="#2D6CC0"/>
<path d="M120 250 C 130 290, 100 320, 120 350" stroke="#1F2430" fill="none"/>
<path d="M220 245 C 230 280, 210 310, 225 340" stroke="#1F2430" fill="none"/>
<text x="180" y="430" font-size="28" font-weight="600" fill="#1F2430" text-anchor="middle">Ready for takeoff?</text>
<text x="180" y="462" font-size="15" fill="#5B6273" text-anchor="middle">Kitebird is where hobbies turn into friendships.</text>
<rect x="24" y="640" width="312" height="52" rx="12" fill="#C73E22"/>
<text x="180" y="672" font-size="16" font-weight="600" fill="#FFFFFF" text-anchor="middle">Let's fly</text>
</svg>
`;

const mod: ChallengeModule = {
  challenge: {
    id: 'ch_onboarding',
    kind: 'live',
    companyId: 'co_kitebird',
    title: 'Redesign first-run onboarding to get new users to a first post',
    summary: 'Only 18% of new users post in week one. Redesign our 7-screen onboarding so more people land in a community and post.',
    type: 'design',
    skills: ['UX design', 'User flows', 'Wireframing', 'UX writing', 'Product metrics', 'Research synthesis'],
    classroomConcepts: [
      { concept: 'Friction and cognitive load in multi-step flows', course: 'Human-Computer Interaction' },
      { concept: 'Funnel analysis and conversion metrics', course: 'Interaction Design' },
      { concept: 'Social anxiety and evaluation apprehension', course: 'Social Psychology' },
      { concept: 'Affinity mapping of qualitative data', course: 'User Research Methods' },
    ],
    difficulty: 'intermediate',
    estHours: 4,
    brief,
    deliverables: [
      'README.md with your read of the data and the problem you are solving',
      'Screen-by-screen flow with real copy, from account created to first post',
      'Unhappy paths: skip, permission denied, not ready to post',
      'Success metrics: a primary metric with a target and at least one guardrail',
      'Wireframes (SVG) or a prototype link',
    ],
    rubric: [
      { id: 'user_insight', name: 'User insight', description: 'Pinpoints the contacts and interests screens as the main drop-offs from the funnel and uses the quotes to show that people also don\'t know what to post.', weight: 25 },
      { id: 'flow', name: 'Flow & interaction design', description: 'A short, clear path that lands people in a community and makes a low-stakes first post easy, with skip and permission-denied paths fully handled.', weight: 30 },
      { id: 'visual_craft', name: 'Visual craft', description: 'Clean, readable wireframes that follow Kitebird\'s type, color and touch-target rules, with real copy instead of placeholder text.', weight: 20 },
      { id: 'rationale', name: 'Design rationale', description: 'Every major decision is tied to a specific number or quote, and the trade-offs of what was removed or deferred are stated plainly.', weight: 15 },
      { id: 'measurement', name: 'Success metrics', description: 'Defines a primary metric with a baseline and target, a leading indicator, a guardrail and a realistic way to test it.', weight: 10 },
    ],
    reward: { mode: 'winner', amounts: [400] },
    applicantCap: 30,
    status: 'open',
    hiringFor: 'Associate Product Designer · Full-time · New York, NY (hybrid)',
    starterFiles: [
      { path: 'README.md', content: starterReadme },
      { path: 'data/onboarding_funnel.csv', content: funnelCsv },
      { path: 'current-flow.md', content: currentFlowMd },
      { path: 'research/user-quotes.md', content: userQuotesMd },
      { path: 'brand-basics.md', content: brandBasicsMd },
    ],
    aiHints: {
      testing:
        'Whether you can find the real problem in messy evidence and design for it, not just make screens prettier. The funnel shows where people leave; the quotes show why even the people who finish onboarding still don\'t post. Kitebird wants a designer who connects those two things.',
      steps: [
        'Work out each step\'s share of total onboarding losses from the CSV, not just its drop-off rate, and note the median time on step.',
        'Group the quotes into themes (forced choices, permissions too early, not knowing what or where to post) and match them to the funnel.',
        'Decide what to cut, what to defer and what to keep, and write down the trade-off for each.',
        'Design the shortest path to a first post, including what the first post can be and where it goes.',
        'Sketch the unhappy paths: skip, permission denied, quitting mid-flow, not ready to post.',
        'Define a primary metric with a baseline and target, plus a guardrail, and how you would test it.',
      ],
      greatLooksLike:
        'A great submission shows that contacts import and the pick-5 grid cause roughly three quarters of onboarding losses, then notices that even people who finish rarely post, because they don\'t know what to say. It lands people in one community with a guided, low-stakes first post and asks for permissions only when there is a reason. It ends with a measurable target against the 18% baseline and a guardrail such as day-30 activity.',
      pitfalls: [
        'Reskinning the same 7 screens with nicer illustrations, which leaves the drop-off untouched.',
        'Cutting steps but still dropping people on a busy feed with a blank composer.',
        'Ignoring what happens when someone denies a permission or skips.',
        'Claiming improvement without a baseline, a target or a guardrail.',
        'Using placeholder copy instead of the real words people would read.',
      ],
    },
    deadlineInDays: 6,
    createdDaysAgo: 8,
    seed: { participants: 19, submissions: 6, scored: 0 },
  },
  templates: [
    {
      quality: 'strong',
      notes: `### What I built
A 3-step first run (pick one hobby, meet one community, say hi) that ends with a guided first post in the community's New here thread. I wrote the full flow with copy, the unhappy paths and a metrics plan, plus three SVG wireframes and a short tap-through prototype.

### Key decisions & trade-offs
- I computed each step's share of total losses. Contacts import (~40%) and pick-5 interests (~34%) dominate, so both are gone from onboarding. Contacts come back later as a share link that needs no permission. The trade-off is a thinner friend graph early on, which is why invites are a guardrail.
- One community instead of six. You lose breadth on day one, but quote 12 shows the firehose hides where your post goes.
- Starter posts aimed at the "what would I even post?" quotes. Posting to New here keeps it low-stakes.
- Notifications are asked right after the first post, when "tell me about replies" is an obvious win.

### What I'd do with more time
Test the starter copy with five new users, check how many of our top 200 communities really have an active beginner thread, and design the host-side tool for writing welcome cards.`,
      files: [
        { path: 'README.md', content: strongReadme },
        { path: 'flow.md', content: strongFlow },
        { path: 'metrics.md', content: strongMetrics },
        { path: 'wireframes/01-pick-a-hobby.svg', content: strongSvg1 },
        { path: 'wireframes/02-meet-your-community.svg', content: strongSvg2 },
        { path: 'wireframes/03-say-hi.svg', content: strongSvg3 },
      ],
      feedback:
        'This is the submission that understood the problem. Working out each screen\'s share of total losses (contacts ~40%, interests ~34%) and then spotting that finishers still only post 40% of the time is exactly the read we hoped for. The New here thread with starter posts answers the "what would I even post?" quotes directly, and moving the notification ask to after the first post is a smart call. Next, we\'d like to see how the flow behaves in communities without an active beginner thread, which you rightly flag as the main risk.',
      aiDisclosure:
        'Used an AI assistant to brainstorm starter-post wording and to sanity-check my sample-size estimate. The data analysis, flow and wireframes are my own.',
    },
    {
      quality: 'solid',
      notes: `**What I built**
A 4-screen onboarding (interests, communities, optional profile, home) that replaces today's 7 screens, with copy for each screen and two SVG wireframes. Contacts import and follow suggestions are removed, and the home feed gets a "Make your first post" banner.

**Key decisions & trade-offs**
- Fewer steps overall. Onboarding is clearly too long, and every extra screen is a chance to lose someone.
- I kept the interests grid but dropped the minimum from 5 to 3 and added search, because people struggled to find niche hobbies.
- I removed contacts import because asking for contacts before showing any value felt pushy. The trade-off is that people will have fewer friends on Kitebird at first.
- I moved the notification prompt to after the first post.
- I spent most of my time on the wireframes so the visual direction is clear and consistent with the brand basics.

**What I'd do with more time**
Prototype the composer flow from the banner and run a quick usability test with new users to see if the banner is noticeable enough.`,
      files: [
        { path: 'README.md', content: solidReadme },
        { path: 'flow.md', content: solidFlow },
        { path: 'wireframes/01-interests.svg', content: solidSvg1 },
        { path: 'wireframes/04-home-banner.svg', content: solidSvg2 },
      ],
      feedback:
        'A clean, sensible flow, and removing contacts import is the right instinct. The wireframes are tidy and on-brand. Where it falls short is the why and the how-we\'d-know: the rationale says onboarding "feels long" without using the funnel numbers, and there is no metric, target or guardrail. The home banner also opens a blank composer on a busy feed, so it doesn\'t address the quotes about not knowing what or where to post.',
      aiDisclosure: 'Used an AI tool to tighten some of the screen copy.',
    },
    {
      quality: 'weak',
      notes: `**What I built**
A visual refresh of all 7 onboarding screens: new kite-themed illustrations, a progress bar, playful headlines, photo tiles on the interests screen and a confetti moment at the end. I included a welcome-screen wireframe and style notes.

**Key decisions & trade-offs**
- I kept every step in the same order because I assumed each one was there for a reason, and I didn't want to remove something the team needs.
- I focused on delight. Hobby apps should feel fun, and the current screens look a bit plain.
- I moved the Skip link on the contacts screen next to the button so people can find it.

**What I'd do with more time**
Animate the illustrations, make a version in dark mode and test which illustration style people like best.`,
      files: [
        { path: 'README.md', content: weakReadme },
        { path: 'screens.md', content: weakScreens },
        { path: 'style-notes.md', content: weakStyle },
        { path: 'wireframes/welcome.svg', content: weakSvg },
      ],
      feedback:
        'The illustrations are charming, and moving the contacts Skip link to where people can see it is a real, small fix. But the flow is still 7 screens, still asks for 5 interests and contacts up front, and the funnel shows those two screens are where most people leave. Next time, start from the data and the quotes and ask which screens need to exist at all. The quotes about not knowing what to post are a big clue too.',
      aiDisclosure: 'None.',
    },
  ],
  scripted: [
    { challengeId: 'ch_onboarding', studentId: 'stu_amara', templateIndex: 0, submittedDaysAgo: 1, scores: null, feedback: null },
    { challengeId: 'ch_onboarding', studentId: 'stu_riley', templateIndex: 1, submittedDaysAgo: 2, scores: null, feedback: null },
  ],
};

export default mod;
