import type { ChallengeModule } from '../lib.ts';

const brief = `## Context
On September 30 we ship **Groups** in Kitebird 6.4: small, private, invite-only spaces inside a community, with their own chat threads and meetups. It's our most requested feature. "A private space for my crew" came up in 31% of feature requests last quarter, and 6,800 beta testers created 1,240 groups in four weeks.

Launch day puts Groups in front of about 2.3 million monthly users through three surfaces, each with its own hard limits. Our engineers have written a thorough changelog, but it's written for engineers, and it includes work that didn't make the release.

## The task
Write the launch copy for Groups:

1. **App store "What's New" text** for version 6.4. Only the first ~170 characters show before "more", so they have to do the heavy lifting.
2. **In-app announcement card** shown once on Home after the update: a title, a body and a button label.
3. **Help-center article** that explains Groups and answers the questions people will actually ask: who can see my group, how big can it be, how do people join, how do I leave.

Lead with what people can now do, not with what we built. Every claim must match the spec.

## Constraints
- Time box: 3 hours.
- Write in plain text or markdown; any editor is fine. No visuals or screenshots needed.
- \`groups-spec.md\` is the source of truth. The changelog is background only: not everything in it ships in 6.4, and nothing that isn't in the spec should be announced.
- Respect every limit in \`surfaces.md\`. Character counts include spaces.
- Push notifications, email and social posts are out of scope.
- AI tools are allowed if you disclose how you used them.

## What we provide
- \`groups-spec.md\`: what ships in 6.4, with exact limits and behaviors.
- \`changelog-raw.md\`: the engineering changelog for the release.
- \`voice-guide.md\`: how Kitebird sounds, with words we use and avoid.
- \`surfaces.md\`: the three surfaces and their character limits.
- \`README.md\`: what to hand in and how we'll review it.
`;

const groupsSpec = `# Groups: launch spec (Kitebird 6.4)

Owner: Community Experience pod · Status: final for launch · Launch: Sept 30, 2026

## What it is
A Group is a small, private space inside a community. A community is public and can have tens of thousands of members; a Group is for the handful of people you actually climb, bake or play with.

## Who can create a Group
- Anyone who has been a member of the community for at least 7 days.
- Creating a Group makes you its **host**. A host can name up to **2 co-hosts**.

## Size and limits
- Up to **50 members** per Group, including the host.
- A person can be in up to **10 Groups** in total.
- Up to **20 chat threads** per Group.

## Joining
Groups are **invite-only**. There is no Group search and no "request to join".
- Hosts and co-hosts can invite any member of the community directly.
- Hosts and co-hosts can create an **invite link**. Links expire after **7 days** and can be turned off at any time.
- Someone who opens a link but isn't in the community is asked to join the community first.

## Privacy
- A Group's name, member list, threads and meetups are visible only to its members.
- Groups don't appear in community feeds, search or anyone's public profile.
- Messages are not end-to-end encrypted. Community rules still apply, and if someone reports content, Kitebird's Trust & Safety team can review it.

## Chat threads
- Every Group starts with a **General** thread. Hosts and co-hosts can add topic threads (up to 20 in total).
- Messages can include text, links and up to **10 photos**. Members can react to messages.

## Meetups
- Hosts and co-hosts can create a meetup with a title, date, time and place (an address, or "Online" with a link).
- Members RSVP **Going**, **Maybe** or **Can't go**.
- Everyone who said Going or Maybe gets a reminder **24 hours** before the start time.

## Leaving and removing
- Anyone can leave a Group at any time. Messages they already sent stay in the Group unless they delete them first.
- Hosts and co-hosts can remove members. Removed members can't rejoin through an old link.
- If the host leaves, the longest-serving co-host becomes host. With no co-hosts, the longest-standing member does.

## Platforms and rollout
- iOS and Android, app version 6.4 and later.
- On the web, members can read threads and see meetups, but posting and RSVPs need the app.
- Rolls out gradually: everyone has it within 7 days of Sept 30.

## Not in this release
- Voice rooms, public Groups and Group search.
`;

const changelogRaw = `# 6.4.0 release changelog (eng)

Release branch: release/6.4 · RC3 · Target: 2026-09-30 · Flag: groups_enabled (ramp 0 to 100% over 7d)

## Groups (GRP)
- GRP-101: groups-svc v1. New Group entity scoped to community_id; membership table with role enum HOST | COHOST | MEMBER.
- GRP-104: create-group gate: community membership age >= 7d (server-side check, error code GROUP_TENURE).
- GRP-109: MAX_GROUP_MEMBERS = 50 (incl. host). Enforced on invite accept; returns GROUP_FULL.
- GRP-110: MAX_GROUPS_PER_USER = 10.
- GRP-112: COHOST limit = 2 per group.
- GRP-118: invite links. Signed tokens, revocable from Group settings.
- GRP-131: invite token TTL 24h -> 7d (per design review 09/02).
- GRP-120: threads via chat-gateway WS fanout. MAX_THREADS = 20, default thread "General".
- GRP-122: attachments: images only, max 10 per message. Video attachments deferred.
- GRP-125: reactions on messages (reuses reactions-svc).
- GRP-127: meetups: Event model {title, starts_at, location | online_url}. RSVP enum GOING | MAYBE | NO.
- GRP-128: reminder job: push at T-24h to GOING + MAYBE.
- GRP-133: exclude group content from feed-ranker, search indexer and profile activity.
- GRP-136: host succession on leave: oldest COHOST, else oldest MEMBER by joined_at.
- GRP-138: web client: read-only group views (threads, meetups). Compose + RSVP gated to native.
- GRP-140: voice rooms (live audio, max 12 speakers). **CUT from 6.4**, moved to Q1. Keep voice_rooms flag OFF. Do not mention externally.
- GRP-142: T&S tooling: reported group messages routed to the existing moderation queue.

## Other
- FEED-882: fix double-counting of reactions on reshared posts.
- PERF-311: cold start -180 ms on Android mid-tier devices.
- A11Y-097: larger hit area on the post composer close button.
`;

const voiceGuide = `# Kitebird voice guide (short version)

We sound like the friendly regular at your climbing gym: warm, a little playful, and never in a hurry to show off.

## Three rules
1. **Lead with the person.** Say what someone can now do, then how. "Plan your Saturday climb with the crew" beats "Meetups now support RSVPs".
2. **Keep it short.** One idea per sentence. If a word can go, it goes.
3. **Playful, not silly.** A light touch is great. Puns are allowed once per piece, never in a help article's headings.

## Words we use and avoid
| Say | Don't say |
|---|---|
| people, members, you | users |
| hosts, co-hosts | admins, moderators, owners |
| meetups | events |
| invite link | token, invite URL |
| private, only members can see | secure, encrypted, 100% private |
| start a Group | create a Group entity, provision |

Also avoid: leverage, functionality, seamless, robust, v1, "we're excited to announce".

## Mechanics
- Sentence case for titles and buttons. "Groups" is capitalized when we mean the feature.
- At most one exclamation mark per surface.
- At most one emoji per surface, and none in app store text or help articles.
- Numbers as numerals: "up to 50 people", not "fifty".
- Be honest about limits. If something isn't possible yet, say so plainly instead of hinting it's coming.
`;

const surfacesMd = `# Launch surfaces for 6.4

All limits count characters including spaces. Over-limit copy gets cut off by the platform, so these are hard limits.

## 1. App store "What's New"
- Plain text only: no markdown, no emoji, no links. Simple dashes for lists are fine.
- Only the **first ~170 characters** show before the "more" link. Most people never tap it.
- Total length: keep it under 600 characters.

## 2. In-app announcement card
Shown once, at the top of Home, the first time someone opens 6.4.
- **Title:** max 40 characters.
- **Body:** max 120 characters.
- **Button:** max 18 characters. It opens the "Start a Group" screen in the community the person visits most.
- One emoji allowed in the title or body, not both.

## 3. Help-center article
Lives at https://help.kitebird.example/groups and is linked from Group settings.
- **Title:** max 70 characters.
- Markdown with headings, because most readers scan for one answer.
- Aim for 300 to 500 words.
- Must answer: what a Group is, who can start one, how people join, who can see what, the limits, meetups, leaving or removing someone, and where Groups work.
`;

const starterReadme = `# Starter kit: Groups launch copy

Thanks for helping us launch Groups. Everything you need is in this folder.

## Files
| File | Use it for |
|---|---|
| groups-spec.md | The source of truth. If it's not here, don't announce it. |
| changelog-raw.md | Background on what engineering built. Written for engineers, and not everything in it ships. |
| voice-guide.md | How we sound, plus words we use and avoid. |
| surfaces.md | Character limits for each surface. |

## What to hand in
A zip with:
- app-store.txt: the "What's New" text
- in-app-card.md: title, body and button
- help-article.md: the help-center article
- README.md: a few lines on your approach and the character count for each limited field

## How we'll review it
Our content designer and the Community Experience PM review every submission against the rubric. We check every claim against the spec and count every character, so it's worth doing that yourself first. Questions go to content@kitebird.example.
`;

/* ───────────── Strong template ───────────── */

const strongReadme = `# Groups launch copy

## Approach
I started by listing what someone can actually do on Sept 30 that they couldn't do on Sept 29: have a private space for their crew, chat there, and plan meetups. Everything else (roles, limits, links) is how, so it goes after the what.

I wrote every claim from groups-spec.md, then went back through changelog-raw.md only to check for conflicts. Two things to flag:
- **Voice rooms (GRP-140)** were cut from 6.4, so they appear nowhere. I also didn't hint that they're coming, per the voice guide.
- **Invite links** expire after 7 days. The changelog still mentions the old 24-hour value, so I double-checked this against the spec.

## Character counts
| Field | Count | Limit |
|---|---|---|
| App store, first paragraph | 158 | ~170 visible |
| App store, total | 382 | 600 |
| Card title | 21 | 40 |
| Card body | 105 | 120 |
| Card button | 13 | 18 |
| Help article title | 37 | 70 |

## Surface by surface
- **App store:** the first sentence is the hook and the second says exactly what a Group is, so even people who never tap "more" get the whole idea. No emoji or links, per surfaces.md.
- **Card:** "Your crew, your space" is the one bit of play; the body is all concrete. The button matches where it lands: the Start a Group screen.
- **Help article:** organized around the questions people will ask, not around the features. Privacy gets its own section, and it's honest that reported content can be reviewed, instead of saying "100% private".

## Files
- app-store.txt
- in-app-card.md
- help-article.md
`;

const strongAppStore = `Your crew finally has a place of its own. Start a Group in any community: a private space for up to 50 people to chat, share photos and plan meetups together.

- Invite people directly or with a link that works for 7 days
- Keep conversations tidy with up to 20 threads
- Plan meetups, collect RSVPs and get a reminder 24 hours before
- Only members can see what's shared in a Group
`;

const strongCard = `# In-app announcement card

**Title (21/40):** Your crew, your space

**Body (105/120):** Start a private Group for up to 50 people in any community. Chat, share photos and plan your next meetup.

**Button (13/18):** Start a group

Emoji: none. The title does the playful work, and the body stays concrete.
`;

const strongHelp = `# Groups: a private space for your crew

Groups are small, private spaces inside a community. A community can have thousands of members; a Group is for the few people you actually climb, bake or play with.

## Who can start a Group?
Anyone who has been a member of a community for at least 7 days. When you start a Group you become its host, and you can name up to 2 co-hosts to help run it.

## How do people join?
Groups are invite-only, so there's no Group search and no requests to join. Hosts and co-hosts can:
- invite any member of the community directly, or
- share an invite link. Links stop working after 7 days, and you can turn one off anytime in Group settings.

If someone opens your link but isn't in the community yet, we'll ask them to join it first.

## Who can see what's in my Group?
Only members. A Group's name, members, threads and meetups never show up in community feeds, search or anyone's profile.

Groups aren't end-to-end encrypted, and community rules still apply. If someone reports a message, our Trust & Safety team can review it.

## How big can a Group be?
- Up to 50 members, including the host
- Up to 20 chat threads per Group
- You can be in up to 10 Groups at once

## Chatting
Every Group starts with a General thread. Hosts and co-hosts can add topic threads. Messages can include text, links and up to 10 photos, and anyone can react.

## Meetups
Hosts and co-hosts can plan a meetup with a date, time and place (or "Online" with a link). Members answer Going, Maybe or Can't go, and anyone who said Going or Maybe gets a reminder 24 hours before it starts.

## Leaving or removing someone
You can leave a Group anytime. Messages you've sent stay unless you delete them first. Hosts and co-hosts can remove members, and removed members can't rejoin with an old link. If a host leaves, the longest-serving co-host takes over.

## Where can I use Groups?
In the Kitebird app on iOS and Android (version 6.4 or later). On the web you can read threads and see meetups, but posting and RSVPs happen in the app. Groups are rolling out gradually, so if you don't see them yet, they'll reach you by October 7.
`;

/* ───────────── Solid template ───────────── */

const solidReadme = `# Groups launch copy

## How I approached it
I read the spec first and wrote down the three things people will care about most: privacy, chatting with a smaller crew, and planning meetups. I tried to make each surface lead with those instead of the technical details in the changelog. I skipped voice rooms because the changelog marks them as cut.

## Character counts
- App store total: 466 / 600
- Card title: 18 / 40
- Card body: 104 / 120
- Card button: 10 / 18

## Notes
- I wanted the launch to feel like a moment, so the app store text and the card both open with the feature name.
- The help article covers everything in the spec. I wrote it as an overview followed by details so someone can read it top to bottom.
- I kept to one exclamation mark per surface.

## Files
- app-store.txt
- in-app-card.md
- help-article.md
`;

const solidAppStore = `Introducing Groups! Now you can create a private space inside any community for the people you actually hang out with. Chat in threads, share photos and plan meetups with up to 50 members.

- Invite people directly or share a link (links last 7 days)
- Add co-hosts to help run things
- Organize conversations into threads
- Plan meetups and see who's going, with a reminder 24 hours before
- Only members can see what's shared

Update now to start your first Group.
`;

const solidCard = `# In-app announcement card

**Title:** Introducing Groups

**Body:** Make a private space for your crew, with up to 50 members. Chat, share photos and plan meetups together.

**Button:** Try Groups
`;

const solidHelp = `# Everything you need to know about Groups

## Overview
Groups are private spaces inside a community where up to 50 people can chat and plan meetups together. Anyone who has been a member of a community for at least 7 days can start a Group and becomes its host. Hosts can name up to 2 co-hosts. Groups are invite-only: hosts and co-hosts can invite members of the community directly or share an invite link, which expires after 7 days. Groups are completely private, so only members will ever see what you share.

## The details
Members are able to utilize chat threads to organize conversations. Every Group has a General thread, and hosts and co-hosts can add up to 20 threads in total. Messages can include text, links and up to 10 photos. Hosts and co-hosts can also create meetups with a date, time and place, and members can respond Going, Maybe or Can't go. Anyone who responds Going or Maybe will receive a reminder 24 hours before the meetup. You can be in up to 10 Groups. You can leave a Group at any time, and hosts and co-hosts can remove members. If the host leaves, a co-host takes over. Groups work in the iOS and Android apps on version 6.4 and up; on the web you can read threads and see meetups.
`;

/* ───────────── Weak template ───────────── */

const weakReadme = `# Groups release notes (6.4)

## Summary
These are the release notes and launch copy for Groups. I organized them so every feature in the release is covered and nothing important is missing. I went through the changelog line by line and grouped related tickets together (membership, invites, threads, meetups, permissions, platforms), then checked the spec for limits.

## What's included
- **app-store.txt:** the What's New text, written as a feature list so people can see everything at a glance.
- **in-app-card.md:** the announcement card.
- **help-article.md:** a full reference article with sections for each part of the feature.

## Decisions
- I left out GRP-140 (voice rooms) because it was cut from 6.4.
- I left out the bug fixes and performance items (FEED-882, PERF-311, A11Y-097) because they aren't part of Groups.
- I used the same section names as the spec so it's easy for the team to check each part.
- I kept the copy factual and avoided marketing language.

## Character counts
- Card title: 24
- Card button: 12

## Files
- app-store.txt
- in-app-card.md
- help-article.md
`;

const weakAppStore = `Version 6.4: Groups

New features:
- Groups: create private groups within communities (max 50 members, incl. host)
- Group chat threads with text, links and photo attachments (up to 10 per message)
- Meetups with RSVP (Going / Maybe / Can't go) and push reminders 24h before
- Invite links for joining groups (expire after 24 hours, can be turned off)
- Host and co-host roles (up to 2 co-hosts) with member management
- Web: read-only access to group threads and meetups

Also includes performance improvements and bug fixes.
`;

const weakCard = `# In-app announcement card

**Title:** Groups are now available

**Body:** Groups are now available in all communities. Create a private group with up to 50 members, chat threads and meetups with RSVPs.

**Button:** Create group
`;

const weakHelp = `# Groups feature overview

## What are Groups?
Groups are private, invite-only spaces within a community. Each group has a host and up to 2 co-hosts.

## Requirements
- You must be a member of the community for at least 7 days to create a group.
- Supported on iOS and Android, version 6.4 and later. Web access is read-only.

## Limits
- Max 50 members per group (including the host)
- Max 10 groups per person
- Max 20 threads per group
- Max 10 photos per message

## Invites
Hosts and co-hosts can invite community members directly or generate an invite link. Invite links can be turned off at any time in group settings. People who aren't in the community are asked to join it first.

## Threads
Each group has a default General thread. Hosts and co-hosts can create more threads. Messages support text, links, photos and reactions.

## Meetups
Hosts and co-hosts can create meetups with a title, date, time and location (address or online link). Members can RSVP Going, Maybe or Can't go. A push reminder is sent 24 hours before to members who RSVP'd Going or Maybe.

## Privacy
Group content is only visible to members and is excluded from community feeds, search and profiles. Reported messages are reviewed by Trust & Safety.

## Roles and permissions
- Host: invite, remove members, manage threads and meetups, name co-hosts
- Co-host: invite, remove members, manage threads and meetups
- Member: chat, react, RSVP, leave

## Leaving
Members can leave at any time. If the host leaves, the oldest co-host becomes host, or the oldest member if there are no co-hosts.
`;

const mod: ChallengeModule = {
  challenge: {
    id: 'past_release_notes',
    kind: 'live',
    companyId: 'co_kitebird',
    title: 'Write release notes + an in-app announcement for Groups',
    summary: 'Turn a jargon-heavy changelog into launch copy for Groups, within hard limits.',
    type: 'product',
    skills: ['UX writing', 'Release notes', 'Content design', 'Product communication', 'Editing'],
    classroomConcepts: [
      { concept: 'Audience analysis and the inverted pyramid', course: 'Technical Writing' },
      { concept: 'Plain language and reading for scanning', course: 'Professional Communication' },
      { concept: 'Microcopy and progressive disclosure', course: 'Interaction Design' },
    ],
    difficulty: 'beginner',
    estHours: 3,
    brief,
    deliverables: [
      'App store "What\'s New" text for version 6.4',
      'In-app announcement card: title, body and button',
      'Help-center article that answers the privacy and limits questions',
      'README.md with your approach and character counts for each limited field',
    ],
    rubric: [
      { id: 'customer_value', name: 'Leads with user value', description: 'Every surface opens with what people can now do with their crew, and the features come after as the how.', weight: 30 },
      { id: 'accuracy', name: 'Accuracy', description: 'Every claim matches groups-spec.md exactly (50 members, 7-day links, 24-hour reminders, honest privacy) and nothing cut from the release is announced or hinted at.', weight: 25 },
      { id: 'voice', name: 'Voice & tone', description: 'Warm, playful and short throughout, using Kitebird\'s words (members, hosts, meetups) with no engineering jargon.', weight: 20 },
      { id: 'channel_fit', name: 'Fit for each surface', description: 'Each piece fits its surface: the hook lands in the first 170 store characters, the card fits 40/120/18, and the help article is scannable by question.', weight: 15 },
      { id: 'brevity', name: 'Brevity', description: 'No wasted words on any surface; nothing could be cut without losing meaning.', weight: 10 },
    ],
    applicantCap: 25,
    status: 'awarded',
    hiringFor: 'Associate Product Designer · Full-time · New York, NY (hybrid)',
    starterFiles: [
      { path: 'README.md', content: starterReadme },
      { path: 'groups-spec.md', content: groupsSpec },
      { path: 'changelog-raw.md', content: changelogRaw },
      { path: 'voice-guide.md', content: voiceGuide },
      { path: 'surfaces.md', content: surfacesMd },
    ],
    aiHints: {
      testing:
        'Whether you can translate engineering facts into words people care about without bending the facts. It also tests care: hard character limits, a changelog with a stale value and a cut feature, and a privacy story that has to be honest.',
      steps: [
        'Read groups-spec.md and write one sentence on what someone can do on launch day that they couldn\'t before.',
        'Diff the changelog against the spec: note the cut item (voice rooms) and any value that changed (invite links went from 24 hours to 7 days).',
        'Draft the app store text so the first 170 characters carry the whole idea on their own.',
        'Write the card to 40/120/18 and count every character, including spaces.',
        'Structure the help article around the questions people will ask, with privacy answered honestly.',
        'Do a final pass against the voice guide\'s "don\'t say" list.',
      ],
      greatLooksLike:
        'A great submission opens every surface with what you can now do with your crew, then backs it up with exact limits from the spec. It never mentions voice rooms, says invite links last 7 days, and is honest that reported messages can be reviewed. The card fits 40/120/18, the store hook fits in 170 characters, and the help article is organized by question.',
      pitfalls: [
        'Listing features in changelog order instead of leading with what people can do.',
        'Announcing or hinting at voice rooms, which were cut from the release.',
        'Copying the stale 24-hour invite-link value from the changelog instead of the spec\'s 7 days.',
        'Going over the 120-character card body or burying the hook past the first 170 store characters.',
        'Calling Groups "completely private" or "secure" when reported content can be reviewed.',
      ],
    },
    deadlineInDays: -50,
    createdDaysAgo: 62,
    seed: { participants: 20, submissions: 12, scored: 12 },
  },
  templates: [
    {
      quality: 'strong',
      notes: `### What I built
Launch copy for all three surfaces (app store text, in-app card, help article), plus a README with character counts for every limited field.

### Key decisions & trade-offs
- I opened with the feeling ("your crew finally has a place of its own") and put the concrete definition in the very next sentence, so the 170-character preview carries the whole idea on its own. The trade-off: the bullet list after "more" will only be read by a few people, so it's purely supporting detail.
- I treated groups-spec.md as the only source of truth. That kept voice rooms out completely and caught the stale 24-hour invite value in the changelog.
- On privacy, I chose honesty over reassurance: the help article says only members can see a Group, and also that reported messages can be reviewed. "100% private" would read better and be wrong.
- The help article is organized by question, because people arrive there looking for one answer.

### What I'd do with more time
Test two card titles on a small rollout cohort, and write the Group settings tooltip that links to the article.`,
      files: [
        { path: 'README.md', content: strongReadme },
        { path: 'app-store.txt', content: strongAppStore },
        { path: 'in-app-card.md', content: strongCard },
        { path: 'help-article.md', content: strongHelp },
      ],
      feedback:
        'This is launch-ready. The store text lands the whole idea in the first 170 characters, the card fits every limit with room to spare, and the help article is organized around the questions our support team actually gets. You caught the stale 24-hour invite value and kept voice rooms out, and the privacy section is honest without being scary.',
      aiDisclosure:
        'Asked an AI assistant to count characters for each field and to suggest five alternative card titles; I picked and rewrote one myself.',
    },
    {
      quality: 'solid',
      notes: `**What I built**
An app store "What's New" text, an in-app announcement card and a help-center article for Groups, with character counts in the README.

**Key decisions & trade-offs**
- I focused on the three things people will care about most: privacy, a smaller crew to chat with, and meetups. Each surface mentions all three.
- I opened the store text and the card with "Introducing Groups" because a launch should feel like a moment and the name needs to stick. The trade-off is a few characters of the 170-character preview.
- I left out voice rooms because the changelog says they were cut.
- The help article is an overview followed by details, so it reads top to bottom.

**What I'd do with more time**
Break the help article into more sections and get feedback from someone on the support team about which questions come up most.`,
      files: [
        { path: 'README.md', content: solidReadme },
        { path: 'app-store.txt', content: solidAppStore },
        { path: 'in-app-card.md', content: solidCard },
        { path: 'help-article.md', content: solidHelp },
      ],
      feedback:
        'Warm, user-first copy that gets the facts right and fits the card limits. Two things held it back: opening with "Introducing Groups" spends the most valuable words on the name instead of what people can do, and the help article is two dense paragraphs, so someone looking for the privacy answer has to read everything. The line "only members will ever see what you share" also overpromises, since reported messages can be reviewed.',
      aiDisclosure: 'Used an AI chatbot to check my drafts for grammar.',
    },
    {
      quality: 'weak',
      notes: `**What I built**
Release notes for 6.4 (app store text), an in-app card and a help-center reference article for Groups. I made sure every Groups feature in the release is covered.

**Key decisions & trade-offs**
- I went through the changelog ticket by ticket and grouped related items (membership, invites, threads, meetups, roles, platforms) so nothing was missed.
- I wrote the app store text as a feature list, since people like to scan what's new.
- I left out voice rooms (cut) and the non-Groups bug fixes.
- I used the spec's section names in the help article so the team can check each part easily.

**What I'd do with more time**
Add screenshots to the help article and write a version for the web release notes.`,
      files: [
        { path: 'README.md', content: weakReadme },
        { path: 'app-store.txt', content: weakAppStore },
        { path: 'in-app-card.md', content: weakCard },
        { path: 'help-article.md', content: weakHelp },
      ],
      feedback:
        'Thorough and well organized, and you correctly kept voice rooms out. But every surface reads like the changelog: "Version 6.4: Groups / New features:" uses the 170-character preview on a header and a list, when it could say what people can now do with their crew. The invite-link line says links expire after 24 hours (that\'s the old changelog value; the spec says 7 days), and the card body runs past the 120-character limit.',
      aiDisclosure: 'None.',
    },
  ],
  scripted: [
    {
      challengeId: 'past_release_notes',
      studentId: 'stu_riley',
      templateIndex: 0,
      submittedDaysAgo: 52,
      scores: { customer_value: 5, accuracy: 4, voice: 5, channel_fit: 5, brevity: 5 },
      feedback:
        'Our winner, and close to what we shipped. "Your crew finally has a place of its own" followed straight away by a plain definition is exactly how we want the first 170 characters to work, and the card and help article are warm, tight and fit every limit. The one point we docked on accuracy: the store text doesn\'t mention the 7-day gradual rollout, so people who read it on day one and don\'t see Groups yet will write in. That caveat is in your help article; it belonged on the store too.',
    },
    {
      challengeId: 'past_release_notes',
      studentId: 'stu_sofia',
      templateIndex: 1,
      submittedDaysAgo: 54,
      scores: { customer_value: 4, accuracy: 4, voice: 5, channel_fit: 5, brevity: 5 },
      feedback:
        'Lovely voice: "for the people you actually hang out with" is pure Kitebird, and your card fits all three limits cleanly. Opening with "Introducing Groups!" cost a point on value, because the name takes the first words people see before the benefit. On accuracy, the help article says Groups are "completely private, so only members will ever see what you share", but the spec says reported messages can be reviewed by Trust & Safety, and we can\'t promise "ever".',
    },
    {
      challengeId: 'past_release_notes',
      studentId: 'stu_amara',
      templateIndex: 1,
      submittedDaysAgo: 51,
      scores: { customer_value: 4, accuracy: 5, voice: 4, channel_fit: 4, brevity: 5 },
      feedback:
        'Your limits, member caps and invite-link details all match the spec, and you kept voice rooms out: full marks on accuracy. Leading with "Introducing Groups" spends the preview on the name rather than what people can do. The help article is where most points went: it\'s two dense paragraphs with no question headings, so readers can\'t jump to privacy, and "members are able to utilize chat threads" slips out of our voice.',
    },
    {
      challengeId: 'past_release_notes',
      studentId: 'stu_maya',
      templateIndex: 2,
      submittedDaysAgo: 51,
      scores: { customer_value: 3, accuracy: 4, voice: 4, channel_fit: 4, brevity: 4 },
      feedback:
        'Your help article is the most clearly organized reference we received, grouping the changelog by theme meant nothing was missed, and you correctly left voice rooms out. The biggest gap is the lead: every surface starts with features ("Version 6.4: Groups / New features:"), when the first line should say what someone can now do, like "plan Saturday\'s climb with your crew." Two smaller fixes: invite links last 7 days, not 24 hours (the changelog had the old value), and the card body is a little over 120 characters. Try rewriting just your first sentence from the reader\'s side; the rest of your structure is solid.',
    },
  ],
};

export default mod;
