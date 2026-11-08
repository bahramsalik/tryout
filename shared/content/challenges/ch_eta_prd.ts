import type { ChallengeModule } from '../lib.ts';

const brief = `## Context
Orbitline builds shipment-tracking and dispatch software for about 300 regional freight carriers. Our Tracking API answers about 40 million status checks a day, and our white-label tracking page and notifications reach carriers' end customers.

"Where is my order?" (WISMO) is the #1 support driver for those carriers. Across our three pilot carriers in Q3, 27,400 of 61,800 support contacts (44%) were WISMO: **19.3 WISMO contacts per 1,000 delivered shipments**, at about $4.10 per contact. Today recipients get only three messages: shipped, out for delivery ("arriving today by 9 PM") and delivered. Between the last two there can be 12 hours or more of silence.

Our Routing Intelligence team's ETA model, ArrivalCast, already powers the dispatcher console. Its median error is 14 minutes, but its p90 error is 47 minutes, and it's much worse in rural areas and for the first stop of a route. We want to use it to tell recipients when their delivery is actually coming, without making promises we can't keep.

## The task
Write the PRD for live delivery-ETA notifications, using the outline in \`README.md\`. It should cover:
1. **Problem:** a problem statement grounded in the ticket sample, with numbers.
2. **Users:** user stories for the recipient and for the carrier's dispatcher.
3. **Requirements:** when we send what, and what the message says. Your rules should respect what the model can and can't do.
4. **Edge cases and risks:** what goes wrong and how the product behaves when it does.
5. **Success metrics:** a primary metric with a target and at least one guardrail.
6. **Phasing:** what ships in the pilot and what waits.

## Constraints
- Time box: about 3 hours. A focused 3–5 page PRD beats a long one.
- Markdown or PDF. Sample message copy is welcome; mockups are not needed.
- Use only the events and fields in \`events-available.md\`. Changing the ETA model, pricing or the carrier contract is out of scope.
- AI use is allowed if you disclose how you used it.

## What we provide
- \`research/support-tickets.csv\`: 36 sampled tickets from the pilot carriers, with category, area and contact count.
- \`eta-model-notes.md\`: ArrivalCast accuracy by segment, confidence levels and known failure modes.
- \`events-available.md\`: the tracking events and fields you can build on.
- \`current-notifications.md\`: today's messages and their stats.
- \`README.md\`: the PRD outline and how to submit.
`;

const supportTicketsCsv = `ticket_id,carrier,created_local,channel,area,category,contacts,summary
T-40211,Prairie Line Freight,2026-09-02 14:12,phone,suburban,wismo_out_for_delivery,2,"Marked out for delivery at 7:40am. Customer has a 3pm appointment and wants to know if she can leave."
T-40218,Lakeshore Express,2026-09-02 16:47,chat,urban,wismo_out_for_delivery,1,"Tracking page says arriving today by 9pm. Asked for a narrower time; agent could only say the driver has 31 stops."
T-40225,Ridgeway Haulers,2026-09-03 10:05,email,rural,wismo_in_transit,1,"No scan since arriving at the Grand Island hub two days ago. Asked whether the package is lost."
T-40233,Prairie Line Freight,2026-09-03 11:30,phone,urban,eta_window_request,1,"Small restaurant receiving a 3-box equipment order. Wants a 2-hour heads-up so staff can be at the back door."
T-40240,Lakeshore Express,2026-09-03 13:58,phone,suburban,wismo_out_for_delivery,3,"Third call today. Out for delivery since morning; caller is working from home and does not want to miss the signature."
T-40247,Ridgeway Haulers,2026-09-04 09:15,chat,rural,missed_delivery,1,"Delivery attempted at 11:05am while customer was at the mailbox road. Says she would have waited at the house if she had known."
T-40252,Prairie Line Freight,2026-09-04 17:40,email,urban,partial_delivery,1,"Order of 3 boxes shows delivered but only 2 arrived. Wants to know where box 3 is."
T-40259,Lakeshore Express,2026-09-05 08:02,chat,suburban,notification_complaint,1,"Got the out-for-delivery text at 5:52am and it woke the baby. Asked to stop early-morning texts."
T-40266,Ridgeway Haulers,2026-09-05 15:21,phone,rural,wismo_out_for_delivery,2,"Out for delivery all day; rural route 60 miles from the depot. Asked if it is really still coming today."
T-40271,Prairie Line Freight,2026-09-08 12:44,chat,urban,wismo_out_for_delivery,1,"Customer refreshing the tracking page; status unchanged since 8:10am. Wants to know roughly when."
T-40279,Lakeshore Express,2026-09-08 14:30,phone,urban,address_change,1,"Wants to redirect to work address after it was already out for delivery."
T-40284,Ridgeway Haulers,2026-09-09 10:12,email,suburban,wismo_in_transit,2,"Expected delivery date passed yesterday with no update. Asking for a new date."
T-40290,Prairie Line Freight,2026-09-09 16:55,phone,suburban,wismo_out_for_delivery,2,"Needs to pick up kids at 4:30pm; asked if the driver will come before or after."
T-40297,Lakeshore Express,2026-09-10 09:40,chat,urban,eta_window_request,1,"Office manager wants to know the morning or afternoon window for a pallet delivery so the dock is clear."
T-40303,Ridgeway Haulers,2026-09-10 13:05,phone,rural,wismo_out_for_delivery,1,"Out for delivery, no ETA. Customer has to drive 20 minutes to the gate to meet the driver."
T-40309,Prairie Line Freight,2026-09-11 11:18,email,urban,damaged,1,"Box arrived crushed; requesting a claim form."
T-40316,Lakeshore Express,2026-09-11 15:47,phone,suburban,missed_delivery,2,"Delivery attempted at 2:10pm while he ran to the store for 15 minutes. Wants a redelivery and a warning next time."
T-40322,Ridgeway Haulers,2026-09-12 08:35,chat,rural,wismo_in_transit,1,"Status still in transit after 4 days on a 2-day service. Asked whether weather is the cause."
T-40329,Prairie Line Freight,2026-09-15 13:22,phone,urban,wismo_out_for_delivery,1,"Wants to know if the package will arrive before a 1pm meeting."
T-40335,Lakeshore Express,2026-09-15 17:10,chat,urban,notification_complaint,1,"Got out-for-delivery text, then nothing; package rolled to next day with no message. Felt misled."
T-40341,Ridgeway Haulers,2026-09-16 10:48,phone,suburban,eta_window_request,1,"Clinic receiving temperature-sensitive supplies wants a window so someone can refrigerate them on arrival."
T-40348,Prairie Line Freight,2026-09-16 15:33,chat,suburban,wismo_out_for_delivery,2,"Out for delivery since 7am; customer asked if they are near the end of the route."
T-40354,Lakeshore Express,2026-09-17 09:20,email,urban,wismo_in_transit,1,"Tracking shows arrived at hub, then no scan for 36 hours. Asking for an update."
T-40361,Ridgeway Haulers,2026-09-17 14:02,phone,rural,partial_delivery,1,"Two-box shipment split: one delivered Tuesday, second still in transit. Customer thought the order was incomplete."
T-40367,Prairie Line Freight,2026-09-18 11:55,phone,urban,missed_delivery,1,"Attempted at 9:40am with no prior notice; tenant buzzer was broken. Wants a call-ahead."
T-40374,Lakeshore Express,2026-09-18 16:28,chat,suburban,wismo_out_for_delivery,1,"Customer wants to walk the dog; asked whether the driver is within the next hour."
T-40380,Ridgeway Haulers,2026-09-21 10:30,phone,rural,wismo_in_transit,2,"No movement for 3 days at the Cheyenne cross-dock. Customer is a farm supply store waiting on parts."
T-40386,Prairie Line Freight,2026-09-21 14:45,email,urban,address_change,1,"Asked to change the delivery address to a neighbor before the truck leaves."
T-40393,Lakeshore Express,2026-09-22 12:12,phone,urban,wismo_out_for_delivery,1,"Out for delivery; caller wants to know if it will come during lunch so she can step out."
T-40399,Ridgeway Haulers,2026-09-22 15:50,chat,rural,missed_delivery,1,"Driver arrived 3 hours earlier than the customer expected; gate locked, attempt failed."
T-40405,Prairie Line Freight,2026-09-23 09:05,phone,suburban,eta_window_request,1,"Wants to schedule an installer the same afternoon and needs to know when the appliance part lands."
T-40412,Lakeshore Express,2026-09-23 13:37,email,suburban,wismo_in_transit,1,"Expected yesterday, still shows in transit. Asked for a revised delivery date."
T-40418,Ridgeway Haulers,2026-09-24 11:14,phone,rural,wismo_out_for_delivery,2,"Out for delivery since 6:50am. Customer called twice to ask if it is still coming before dark."
T-40425,Prairie Line Freight,2026-09-24 16:20,chat,urban,partial_delivery,1,"3 of 4 cartons delivered; tracking only shows one tracking number. Customer unsure the rest exists."
T-40431,Lakeshore Express,2026-09-25 10:40,phone,urban,damaged,1,"Corner of carton torn and contents wet. Wants replacement."
T-40438,Ridgeway Haulers,2026-09-25 14:58,phone,suburban,wismo_in_transit,1,"Delivery date moved twice with no explanation. Asking what is going on."
`;

const etaModelNotes = `# ArrivalCast v2: model notes for product

Owner: Routing Intelligence (data science) · In production in the dispatcher console since June 2026 · Not yet shown to recipients

## What it predicts
For every shipment in \`out_for_delivery\`, ArrivalCast predicts when the driver will complete that stop. It recomputes every 5 minutes while the driver app is online, and on every \`stop_completed\` event on the route.

**Outputs** (on the \`eta_updated\` event and \`GET /v2/shipments/{id}/eta\`)
| Field | Meaning |
|---|---|
| \`eta_point\` | Single best-guess arrival time (what dispatchers see today) |
| \`eta_low\`, \`eta_high\` | 80% prediction interval |
| \`confidence\` | \`high\` (interval ≤ 60 min) · \`medium\` (61–120 min) · \`low\` (> 120 min or GPS missing) |
| \`eta_stale\` | \`true\` when the driver app has been offline for more than 10 minutes |

## Accuracy (July–September 2026, 3.1M delivered stops)
Error = |eta_point − actual delivery time|, measured on the last ETA computed before each delivery's previous stop was completed.
| Segment | Share of stops | p50 error | p90 error | Actual inside 80% interval | Median interval width |
|---|---|---|---|---|---|
| **All stops** | 100% | **14 min** | **47 min** | 81% | 74 min |
| Urban | 52% | 11 min | 36 min | 83% | 58 min |
| Suburban | 33% | 15 min | 49 min | 80% | 78 min |
| Rural | 15% | 26 min | 88 min | 76% | 132 min |
| First stop of a route | 3% | 31 min | 74 min | 71% | 96 min |
| 1–5 stops before yours | — | 6 min | 19 min | 86% | 32 min |
| 6–15 stops before yours | — | 13 min | 41 min | 81% | 66 min |
| 16+ stops before yours | — | 22 min | 63 min | 77% | 104 min |

When the actual time falls outside the interval, it is early about as often as late: **9% of deliveries arrive before \`eta_low\`** and 10% after \`eta_high\`.

Confidence mix of predictions: high 46% · medium 38% · low 16%. **Coverage:** 92% of out-for-delivery shipments get an ETA. The other 8% are on manually planned routes or the driver app was offline at departure.

## Known failure modes
1. **Departure variance.** Before \`route_started\`, the ETA assumes the planned departure time. Drivers leave the depot up to an hour late, which is why the first stop is so poor.
2. **Route resequencing.** Drivers reorder stops on about 11% of routes, and an ETA can jump 30–90 minutes in one refresh when that happens.
3. **Offline drivers.** When the app loses signal (common on rural routes), the ETA freezes and \`eta_stale\` flips to \`true\`.
4. **Long business stops.** Pallet and liftgate deliveries take longer than predicted, pushing every later stop on the route.
5. **Weather days.** On days with a weather exception in the region, p90 error roughly doubles.

## What we can and can't change
We can tune refresh frequency and add fields. We can't make the model more accurate this quarter. Questions: routing-intel@orbitline.example
`;

const eventsAvailable = `# Events and fields available to notifications

All events arrive on the internal \`tracking.events\` stream within 30 seconds and can trigger a notification rule. Recipient-facing copy can use any field below.

## Shipment fields
| Field | Notes |
|---|---|
| \`shipment_id\`, \`tracking_number\` | One per package |
| \`master_tracking_number\`, \`piece_index\`, \`package_count\` | Multi-piece shipments share a master number. Pieces can travel on different trucks. |
| \`carrier_id\`, \`carrier_display_name\` | Messages go out under the carrier's brand |
| \`service_level\` | \`standard\` · \`expedited\` · \`freight_liftgate\` |
| \`expected_delivery_date\` | Promised date at label creation |
| \`address_type\` | \`residential\` · \`business\` (business hours available for 58% of business addresses) |
| \`area_class\` | \`urban\` · \`suburban\` · \`rural\` |
| \`signature_required\` | boolean |
| \`recipient.phone\` | Present on 71% of shipments |
| \`recipient.email\` | Present on 64% of shipments |
| \`recipient.sms_consent\` | Must be \`true\` to send SMS |
| \`recipient.timezone\` | IANA zone derived from the delivery address |

## Events
| Event | Key fields | Notes |
|---|---|---|
| \`label_created\` | expected_delivery_date | |
| \`picked_up\` | | Triggers today's "shipped" message |
| \`arrived_at_facility\`, \`departed_facility\` | facility_name | |
| \`out_for_delivery\` | route_id, stop_sequence | Fires at the depot load scan, usually 5:00–7:00 AM |
| \`route_started\` | route_id, departed_at | Driver leaves the depot (new in 2026) |
| \`eta_updated\` | eta_point, eta_low, eta_high, confidence, eta_stale, stops_before_you | Fires when eta_point moves ≥ 5 minutes or confidence changes |
| \`stop_completed\` | route_id, stops_before_you | Fires for each earlier stop on the route |
| \`delivery_attempted\` | reason_code (\`recipient_unavailable\`, \`no_access\`, \`business_closed\`, \`refused\`, \`address_issue\`), next_attempt_date | |
| \`delivered\` | delivered_at, pod_photo_url, signed_by | |
| \`exception\` | exception_code (\`weather_delay\`, \`mechanical\`, \`missed_sort\`, \`damaged\`, \`address_issue\`), new_expected_date | |
| \`route_closed\` | route_id, undelivered_shipment_ids | End of the driver's day. Undelivered stops roll to the next day. |

## Channels and limits
- **SMS:** 160 characters per segment. The carrier pays $0.0079 per segment. Recipients can reply STOP at any time.
- **Email:** free to carriers. About 22% of notification emails are opened.
- **Tracking page:** every message can deep-link to \`track.orbitline.example/{tracking_number}\`.
- **Carrier settings:** each notification type can be switched on or off per carrier. Today there is no quiet-hours setting.

## Dispatcher console
Dispatchers see every stop's \`eta_point\` on a route map. They can't currently see which notifications a recipient received.
`;

const currentNotifications = `# Current recipient notifications

Live for all carriers that enable notifications (212 of about 300).

| # | Trigger | Channels | Copy (SMS version) |
|---|---|---|---|
| 1 | \`picked_up\` | SMS + email | "{carrier}: Your shipment {tracking_number} is on its way. Expected {expected_delivery_date}. Track: {link}" |
| 2 | \`out_for_delivery\` | SMS + email | "{carrier}: Your delivery is out for delivery and arriving today by 9 PM. Track: {link}" |
| 3 | \`delivered\` | SMS + email | "{carrier}: Delivered at {delivered_at}. Photo: {link}" |

Carriers can also enable an email-only "delivery attempted" message (19 carriers have). Nothing is sent for exceptions, delays or rolled-over deliveries.

## What we know (pilot carriers, Q3 2026)
- The out-for-delivery message goes out at the depot load scan: median **6:12 AM** recipient local time, and **14% are sent before 6:00 AM**.
- **38% of tracking-page sessions** happen after out-for-delivery. Those shipments average **4.2 page views** on delivery day.
- **SMS opt-out rate: 1.2%** of recipients per month (replied STOP).
- Out-for-delivery shipments that roll over to the next day: 2.3%. Recipients get no message when this happens.
- Average SMS segments per delivered shipment: 2.6. Cost to carriers: about $0.021 per shipment.
`;

const starterReadme = `# Live delivery-ETA notifications: PRD starter kit

Hi! Thanks for taking this on. This is the kind of PRD an Associate PM on our Customer Notifications team writes in their first month. The team is a PM, four engineers and a designer, working with Routing Intelligence on the model.

## Files
| File | What's in it |
|---|---|
| \`research/support-tickets.csv\` | 36 tickets sampled at random from the three pilot carriers' delivery queues, September 2026 |
| \`eta-model-notes.md\` | ArrivalCast accuracy, confidence and failure modes |
| \`events-available.md\` | Events, fields, channels and limits |
| \`current-notifications.md\` | Today's three messages and their stats |

## PRD outline (use these headings)
1. **Problem statement**: who is hurting, how much, and how we know
2. **Goals and non-goals**
3. **Users and user stories**: at least the recipient and the carrier dispatcher
4. **Requirements**: notification rules (trigger → condition → message), copy, settings
5. **Edge cases and risks**
6. **Success metrics**: primary metric, target, guardrails, how we'll measure
7. **Phasing**: pilot scope versus later
8. **Open questions**

## What to submit
A zip with your PRD (markdown or PDF) and a short \`README.md\` that summarizes it. Add any supporting work you did (for example a ticket analysis). Then add brief approach notes in the submission form.

Questions go to Jordan Park, Talent Lead: talent@orbitline.example
`;

/* ───────────── Strong template ───────────── */

const strongReadme = `# PRD: Live delivery-window notifications

**TL;DR:** Replace "arriving today by 9 PM" with an honest **delivery window** that narrows as the driver gets closer, plus a message when the window moves or the delivery fails. Pilot it with the three pilot carriers on urban and suburban routes for six weeks, and measure **WISMO contacts per 1,000 delivered shipments** (baseline 19.3, target ≤ 15.5), with SMS opt-outs as the guardrail.

## Why
In the 36-ticket sample, 19 tickets (53%) are WISMO. The biggest single group, 12 tickets, is "out for delivery, but when?", and those customers contact support 1.6 times each, which makes them 41% of all contacts. Add the 4 "give me a window" requests and the 4 missed deliveries where people would have stayed home, and **20 of 36 tickets (56%)** are about not knowing *when*. Full breakdown in \`ticket-analysis.md\`.

## Key decision: windows, not minutes
ArrivalCast is good in the middle (p50 error 14 min) but has a long tail (p90 47 min, rural p90 88 min, first stop p90 74 min). A promise like "2:14 PM" would be wrong by more than 45 minutes for 1 in 10 recipients. So we show the model's 80% interval, rounded outward, and narrow it only when the model is confident (5 or fewer stops away). For low-confidence and rural first stops we say less, not more.

## Files
- \`prd.md\`: problem, goals, users, user stories, metrics, phasing, open questions
- \`notification-rules.md\`: trigger → condition → message rules, with copy
- \`edge-cases.md\`: edge cases and risks with the product behavior for each
- \`ticket-analysis.md\`: how I categorized the sample and what it does and doesn't tell us

## What I'd validate first
1. Window hit rate using last quarter's data (replay): how often would the shown window have contained the actual delivery?
2. Whether carriers will pay for roughly 1.5 extra SMS segments per shipment (about $0.012).
3. Dispatcher appetite for a "promised window at risk" alert.
`;

const strongPrd = `# PRD: Live delivery-window notifications

Author: Associate PM candidate · Team: Customer Notifications · Status: Draft for review

## 1. Problem statement
Once a package is out for delivery, recipients get one message ("arriving today by 9 PM"), usually around 6 AM, and then silence for up to 15 hours. They fill that silence by refreshing the tracking page (4.2 views per shipment) and calling the carrier. WISMO is 44% of pilot-carrier contacts (19.3 per 1,000 delivered shipments, about $112,000 per quarter at $4.10 each). In our sample, 56% of tickets come down to "I don't know *when*", and some of those become failed deliveries (4 of 36), which cost a second truck roll.

## 2. Goals and non-goals
**Goals:** cut delivery-day WISMO contacts; reduce failed attempts where the recipient was unavailable; never send a window we expect to miss more than 1 time in 5.
**Non-goals (v1):** a live driver map, exact-minute ETAs, recipient rescheduling, changes to the model.

## 3. User stories
**Recipient (residential)**
- As a recipient, I want a delivery window that's narrow enough to plan around, so I can decide whether to step out.
- As a recipient, I want to be told when the window changes or the delivery won't happen today, so I'm not waiting for nothing.
- As a recipient, I don't want texts at 5:52 AM or a stream of tiny updates.

**Recipient (business)**
- As an office or clinic manager, I want a heads-up when the driver is close, so someone is at the dock or ready to refrigerate the delivery.

**Carrier dispatcher**
- As a dispatcher, I want to see which window each recipient was told, so I can answer calls consistently.
- As a dispatcher, I want an alert when a stop is likely to miss its promised window by more than 30 minutes, so I can resequence or call ahead.
- As a dispatcher, I want to pause updates for a route (for example a breakdown), so we don't send a stream of wrong windows.

## 4. Requirements
See \`notification-rules.md\` (rules R1–R7, quiet hours, frequency caps, opt-out) and \`edge-cases.md\`.

## 5. Success metrics
| Metric | Baseline | Pilot target | Notes |
|---|---|---|---|
| **Primary: WISMO contacts per 1,000 delivered shipments** | 19.3 | **≤ 15.5 (−20%)** | Pilot carriers. Compare enabled routes against a held-out 20% of routes. |
| Window hit rate (delivered inside the last window sent) | not measured | ≥ 85% | If < 80% for a week, widen windows |
| Failed attempts, reason \`recipient_unavailable\` | carrier report | −15% | Secondary |
| **Guardrail: SMS opt-out rate** | 1.2% per month | ≤ 1.5% | Stop the rollout if exceeded for 2 weeks |
| Guardrail: SMS segments per shipment | 2.6 | ≤ 4.2 | Carrier cost |

## 6. Phasing
- **Pilot (6 weeks, 3 carriers):** R1–R7 for urban and suburban; rural gets R1 as a half-day window and R3 only. Dispatcher "promised window" column. 20% route holdout.
- **Phase 2:** in-transit delay messages from \`exception\` events (7 of 36 tickets are in-transit WISMO, which this pilot doesn't solve). Dispatcher at-risk alerts.
- **Phase 3:** recipient actions (delivery instructions, "I'm not home"), open to all carriers.

## 7. Open questions
- Do carriers want to pay for the extra SMS, or should R3 be email-only by default?
- Can Routing Intelligence expose a 90% interval for rural routes?
`;

const strongRules = `# Notification rules (v1)

All times are in the recipient's local time zone. Windows are rounded **outward** to the nearest 30 minutes (eta_low down, eta_high up).

| # | Trigger | Condition | Message (SMS) |
|---|---|---|---|
| R1 | \`route_started\` | ETA exists and confidence is \`high\` or \`medium\` | "{carrier}: Your delivery is on the truck. Expected between 1:00 and 3:00 PM. We'll text when it's close. {link}" |
| R1-low | \`route_started\` | confidence \`low\`, no ETA, or rural first-stop | "{carrier}: Your delivery is on the truck and expected this afternoon (12–5 PM). {link}". No narrower window until R2. |
| R2 | \`stop_completed\` | stops_before_you ≤ 5, confidence \`high\`, eta_stale false | "{carrier}: Your driver is about 5 stops away. Expected 1:30–2:00 PM. {link}" |
| R3 | \`eta_updated\` | New window doesn't overlap the last window sent, or moves its end by > 30 min | "{carrier}: Update: your delivery is now expected 3:30–5:00 PM. {link}" |
| R4 | \`delivery_attempted\` | any | "{carrier}: We tried to deliver at 2:10 PM but couldn't ({reason}). Next attempt {next_attempt_date}. {link}" |
| R5 | \`route_closed\` | shipment in undelivered_shipment_ids | "{carrier}: Sorry, your delivery didn't make it today. It's scheduled for tomorrow. {link}" |
| R6 | \`delivered\` | unchanged from today | "{carrier}: Delivered at {time}. Photo: {link}" |
| R7 | \`out_for_delivery\` | **moved:** today's 6 AM text is replaced by R1 at route start | — |

## Why these thresholds
- R1 uses the 80% interval because it contains the actual time 81% of the time overall. Rounding outward pushes the hit rate up a bit further.
- R2 waits for ≤ 5 stops because that's where the model is sharpest (p90 19 min, 86% inside the interval).
- Rural and first stops start wide because their p90 error is 74–88 minutes.

## Guardrails on volume
- **Quiet hours: 9 PM–7 AM.** Messages are held until 7 AM. R5 is sent by email only if triggered during quiet hours.
- **Frequency cap:** at most 2 R3 updates per shipment per day; after that, only R4, R5 or R6.
- **Hysteresis:** R3 never fires within 20 minutes of the previous message. A window that moves back to the original isn't re-sent.
- **Stale ETA:** if eta_stale is true, suppress R2 and R3. The tracking page shows "last updated {time}".
- **Opt-out:** STOP ends all SMS for that number (existing). The tracking page gets a "stop updates for this delivery" link that keeps only R6.
- **Consent:** SMS only when recipient.sms_consent is true; otherwise email for R1, R4 and R5.
- **Carrier settings:** R1–R5 can be toggled per carrier. Quiet hours are on by default and editable.

## Tracking page
Shows the same window as the last message, never eta_point, so the text and the page never disagree.
`;

const strongEdge = `# Edge cases and risks

## Edge cases
| Case | How often / evidence | Product behavior |
|---|---|---|
| **Early arrival** | 9% arrive before eta_low; T-40399 (gate locked, driver 3 hours early) | For \`signature_required\` or business addresses, R1 copy adds "could arrive as early as {eta_low − 30 min}". |
| **Route resequenced** | ~11% of routes; ETA jumps 30–90 min | R3 hysteresis plus a 2-update cap stops ping-pong. Dispatcher sees "window changed" on the stop. |
| **Multi-piece shipment on different trucks** | 3 of 36 tickets (T-40252, T-40361, T-40425) | Notify per master_tracking_number: "2 of 3 packages arriving today 1–3 PM; 1 arriving {date}". Don't send "Delivered" until all pieces are delivered, or say "2 of 3 delivered". |
| **Delivery fails** | 4 of 36 tickets are missed deliveries | R4 with the reason and next attempt. Today only 19 carriers send this, by email. |
| **Rolls to tomorrow** | 2.3% of out-for-delivery shipments; T-40335 | R5. A new R1 goes out the next morning. |
| **Driver app offline** | Common on rural routes | Suppress updates (eta_stale). Never send a narrower window from a stale ETA. |
| **No ETA (8%)** | Manual routes | Fall back to today's copy, sent at 7 AM, not 6 AM. |
| **Business closed** | 58% of business addresses have hours | If the window falls outside business hours, alert the dispatcher, not the recipient. |
| **Weather day** | p90 roughly doubles | When there's a regional \`weather_delay\` exception, R1 uses the half-day copy for every stop. |
| **No phone, no consent** | 29% have no phone | Email only. 36% have no email, so the tracking page has to carry the same window. |
| **Address change after loading** | T-40279, T-40386 | Out of scope for v1. The message links to the carrier's existing support path. |

## Risks
1. **Windows that miss destroy trust.** Mitigation: window hit-rate monitoring with automatic widening if < 80% for a week, and a replay test on Q3 data before launch.
2. **More messages, more opt-outs.** Mitigation: frequency cap, quiet hours, opt-out guardrail.
3. **Carrier SMS cost.** Estimated +1.5 segments per shipment (about $0.012). Mitigation: R3 can be set to email-only.
4. **Dispatchers get more calls** about changed windows. Mitigation: show "promised window" in the console.
5. **Quiet hours delay the first message.** 14% of out-for-delivery texts go out before 6 AM today. Moving R1 to route start fixes the 5:52 AM complaint (T-40259).
`;

const strongTicketAnalysis = `# Ticket analysis (36-ticket sample, September 2026)

| Category | Tickets | Share | Contacts | Share of contacts | Solved by v1? |
|---|---|---|---|---|---|
| WISMO: out for delivery, when? | 12 | 33% | 19 | 41% | Yes (R1, R2) |
| WISMO: in transit, no movement or late | 7 | 19% | 9 | 20% | No: needs delay messages (Phase 2) |
| ETA window request (business) | 4 | 11% | 4 | 9% | Yes (R1, R2) |
| Missed delivery | 4 | 11% | 5 | 11% | Partly (R1, R4) |
| Partial / multi-package | 3 | 8% | 3 | 7% | Partly (per-master copy) |
| Notification complaint | 2 | 6% | 2 | 4% | Yes (quiet hours, R5) |
| Address change | 2 | 6% | 2 | 4% | No |
| Damaged | 2 | 6% | 2 | 4% | No |
| **Total** | **36** | | **46** | | |

- **WISMO overall:** 19 of 36 tickets (53%) and 28 of 46 contacts (61%).
- **"When" problems** (out-for-delivery WISMO + window requests + missed deliveries): 20 tickets (56%), 28 contacts (61%).
- Out-for-delivery WISMO tickets average **1.6 contacts each**, versus 1.0 for damaged or address tickets. Silence makes people call back.
- Rural is 9 of 36 tickets (25%) but 5 of the 11 missed-delivery and in-transit tickets (45%), consistent with the model's weaker rural accuracy.

## Caveats
36 tickets is small (±16 points at 95% confidence on a 50% share). The sample shows 53% WISMO versus 44% across all Q3 contacts, probably because it comes from the delivery queue only. I use the sample to rank problems and the Q3 baseline (19.3 per 1,000) for targets.
`;

/* ───────────── Solid template ───────────── */

const solidReadme = `# PRD: Live ETA Notifications

## Summary
Recipients don't know when their delivery will arrive once it's out for delivery, so they contact support. This PRD proposes live ETA notifications that tell recipients the exact time their driver will arrive and keep them updated as it changes.

## Problem
WISMO is the #1 support driver for our carriers: 44% of contacts in Q3, or 19.3 per 1,000 shipments. In the ticket sample, 19 of 36 tickets (53%) are WISMO, and most are people who were told "arriving today by 9 PM" and then waited all day. Business customers also asked for a heads-up so staff can be ready.

## Proposal
Use ArrivalCast's \`eta_point\` to send:
1. **ETA message** when the route starts: "Your driver will arrive at 2:14 PM."
2. **ETA update** every time the ETA changes.
3. **Arriving soon** when the driver is 3 stops away.
4. **Delivered** (unchanged).

## Success metrics
- Reduce WISMO contacts by 30% for pilot carriers
- Improve recipient CSAT on delivery-day surveys
- Increase tracking-page engagement

## Files
- \`prd.md\`: full PRD
- \`user-stories.md\`: user stories for recipients and dispatchers

## Notes
The ETA model is accurate to within 14 minutes on average, which is good enough to give recipients a specific time. With more time, I'd add mockups of the messages and the tracking page.
`;

const solidPrd = `# PRD: Live ETA Notifications

## 1. Problem statement
Once a delivery is out for delivery, recipients hear nothing until it arrives. They call or chat to ask when it's coming: 12 of the 36 sampled tickets are this exact situation, and several customers called two or three times. WISMO costs pilot carriers about $112,000 per quarter.

## 2. Goals
- Tell every recipient exactly when their delivery will arrive
- Reduce WISMO contacts
- Give business recipients enough notice to be ready

**Non-goals:** live driver map, rescheduling.

## 3. Users
- **Residential recipients** waiting at home
- **Business recipients** (offices, clinics, restaurants) that need staff ready
- **Dispatchers** who field escalations

## 4. Requirements
| # | Requirement | Priority |
|---|---|---|
| 1 | On \`route_started\`, send an SMS and email with eta_point: "Your driver will arrive at {eta_point}." | P0 |
| 2 | On every \`eta_updated\` event, send the new eta_point | P0 |
| 3 | When stops_before_you = 3, send "Your driver is 3 stops away, arriving at {eta_point}" | P0 |
| 4 | Show eta_point on the tracking page, refreshed every 5 minutes | P0 |
| 5 | Dispatcher console shows the ETA each recipient was sent | P1 |
| 6 | Carriers can turn each message on or off | P1 |
| 7 | Use the carrier's brand name and sender ID | P0 |

## 5. Edge cases
- **Delivery attempt fails:** send "We couldn't deliver today" with the reason.

## 6. Success metrics
- WISMO contacts −30% on pilot carriers within 6 weeks
- Delivery-day CSAT +10 points
- Tracking-page views per shipment up

## 7. Phasing
- **Phase 1:** requirements 1–4 for the three pilot carriers
- **Phase 2:** dispatcher view and carrier settings
- **Phase 3:** all carriers

## 8. Open questions
- What should we do for the 8% of shipments without an ETA?
- Should business recipients get an extra heads-up?
`;

const solidStories = `# User stories

## Recipient
- As a recipient, I want to know exactly what time my delivery will arrive so I can plan my day.
- As a recipient, I want to be told if the time changes so I'm not caught off guard.
- As a recipient, I want a heads-up when the driver is close so I can be at the door.

## Business recipient
- As a clinic manager, I want to know when a temperature-sensitive delivery is arriving so staff can refrigerate it immediately.
- As a restaurant owner, I want a heads-up so someone is at the back door.

## Dispatcher
- As a dispatcher, I want to see the ETA each recipient was given so I can answer questions consistently.
- As a dispatcher, I want fewer "where's my driver" calls so I can focus on routing.
`;

/* ───────────── Weak template ───────────── */

const weakReadme = `# ETA Notifications Feature Spec

## Overview
Customers want to know where their package is. This spec covers a set of features to make delivery tracking more like the experience on popular food delivery apps, where you can see your driver moving on a map in real time.

## Features
1. **Live driver map:** show the driver's location on the tracking page, updated every few seconds
2. **Exact ETA:** "Your package will arrive at 2:14 PM" in every message
3. **Push notifications** at every stop the driver completes
4. **Chat with your driver** from the tracking page
5. **Rate your delivery** from 1 to 5 stars after it arrives
6. **Delivery photo** (already exists)
7. **Dark mode** for the tracking page

## Why
Real-time tracking is what customers expect now. Showing the driver on a map will make customers feel in control and make Orbitline look modern compared to other tracking providers.

## Timeline
Build all features in one release so customers get the full experience at once.

## Files
- \`features.md\`: more detail on each feature
- \`message-copy.md\`: sample notification text
`;

const weakFeatures = `# Feature details

## Live driver map
Use the driver app's GPS to show a moving truck icon on the tracking page. Refresh every 5 seconds.

## Exact ETA
Take eta_point from ArrivalCast and show it everywhere: SMS, email and the tracking page.

## Stop-by-stop notifications
Every time the driver completes a stop, text the recipient: "Your driver just completed a stop. You are now {n} stops away."

## Chat with driver
Recipients can message the driver from the tracking page. Drivers see messages in the driver app.

## Ratings
After delivery, ask "How was your delivery?" with 1–5 stars.
`;

const weakCopy = `# Message copy

- "Your package will arrive at 2:14 PM!"
- "Your driver just completed a stop. You are now 7 stops away."
- "Your driver just completed a stop. You are now 6 stops away."
- "Your package is here! Rate your delivery."
`;

const mod: ChallengeModule = {
  challenge: {
    id: 'ch_eta_prd',
    kind: 'live',
    companyId: 'co_orbitline',
    title: 'Write the PRD for live delivery-ETA notifications',
    summary: 'WISMO is our #1 support driver. Write a PRD for ETA alerts on an imperfect model.',
    type: 'product',
    skills: ['PRD writing', 'Problem framing', 'User stories', 'Success metrics', 'Edge-case analysis'],
    classroomConcepts: [
      { concept: 'Problem statements and jobs to be done', course: 'Product Management' },
      { concept: 'Prediction intervals and forecast error', course: 'Intro to Statistics' },
      { concept: 'Requirements specification', course: 'Software Engineering' },
      { concept: 'Writing for decision-makers', course: 'Technical Writing' },
    ],
    difficulty: 'beginner',
    estHours: 3,
    brief,
    deliverables: [
      'PRD following the outline in README.md',
      'Notification rules (trigger, condition, message) with sample copy',
      'Edge cases and risks with the product behavior for each',
      'Success metrics with a baseline, target and guardrail',
      'Short README summarizing the PRD',
    ],
    rubric: [
      { id: 'problem_framing', name: 'Problem framing', weight: 25, description: 'States who is hurting and how much using the ticket sample and the 19.3 per 1,000 baseline, and separates the out-for-delivery problem the feature can solve from the ones it can\'t.' },
      { id: 'requirements', name: 'Requirements', weight: 25, description: 'Clear trigger, condition and message rules that show windows sized to the model\'s accuracy, with update thresholds, quiet hours, frequency caps and opt-out.' },
      { id: 'edge_cases', name: 'Edge cases & risks', weight: 20, description: 'Covers early arrivals, resequenced routes, stale ETAs, failed and rolled-over deliveries and multi-piece shipments, with a specific product behavior for each.' },
      { id: 'metrics', name: 'Success metrics', weight: 15, description: 'WISMO contacts per 1,000 shipments as the primary metric, with a baseline, a target, a guardrail like SMS opt-outs and a clean comparison group.' },
      { id: 'clarity', name: 'Clarity', weight: 15, description: 'A reader gets the decision and its rationale from the README in two minutes, and the PRD is concise, scannable and consistent throughout.' },
    ],
    applicantCap: 25,
    status: 'open',
    hiringFor: 'Associate Product Manager · Full-time · Chicago, IL (hybrid)',
    starterFiles: [
      { path: 'README.md', content: starterReadme },
      { path: 'research/support-tickets.csv', content: supportTicketsCsv },
      { path: 'eta-model-notes.md', content: etaModelNotes },
      { path: 'events-available.md', content: eventsAvailable },
      { path: 'current-notifications.md', content: currentNotifications },
    ],
    aiHints: {
      testing:
        'Whether you can design a product around an imperfect model. ArrivalCast is good on average but has a long tail (p90 47 minutes, much worse rural and on first stops), so the real test is whether your notification rules promise only what the model can deliver. It also checks that you can size a problem from raw tickets and pick a metric that proves the feature worked.',
      steps: [
        'Categorize the 36 tickets and count tickets and contacts per category to size the "when is it coming?" problem.',
        'Read the accuracy table and decide what a recipient should see at each confidence level and distance from the stop.',
        'Write notification rules as trigger, condition and message, using only events from events-available.md.',
        'List edge cases (early arrival, resequencing, stale ETA, failed or rolled-over delivery, multi-piece) and say how the product behaves for each.',
        'Pick a primary metric with a baseline and target, add a guardrail, and decide what ships in the pilot.',
      ],
      greatLooksLike:
        'A PRD that opens with the numbers: 53% of sampled tickets are WISMO, and out-for-delivery customers contact support 1.6 times each. It replaces "by 9 PM" with time windows that narrow only when the model is confident, and it limits updates with quiet hours, caps and hysteresis. Success is WISMO contacts per 1,000 shipments against the 19.3 baseline with a holdout, with SMS opt-outs as the guardrail.',
      pitfalls: [
        'Promising exact-minute ETAs ("arriving at 2:14 PM") when the p90 error is 47 minutes.',
        'Sending an update on every eta_updated event, which floods recipients when routes are resequenced.',
        'Ignoring quiet hours: today\'s out-for-delivery text already goes out before 6 AM 14% of the time.',
        'Measuring tracking-page views or CSAT instead of WISMO contact rate, with no guardrail.',
        'Writing a feature list (maps, chat, ratings) with no problem statement or phasing.',
      ],
    },
    deadlineInDays: 7,
    createdDaysAgo: 3,
    seed: { participants: 8, submissions: 2, scored: 0 },
  },
  templates: [
    {
      quality: 'strong',
      notes: `### What I built
A PRD for delivery-window notifications, split into a summary README, the core PRD, a rules table with copy, an edge-case and risk table, and a ticket analysis. I started by categorizing the 36 tickets and counting contacts as well as tickets. That showed the out-for-delivery silence drives repeat calls (1.6 contacts per ticket), which made it the problem to solve first.

### Key decisions & trade-offs
- **Windows, not minutes.** With a p90 error of 47 minutes (88 rural), an exact time would be badly wrong for 1 in 10 people. I show the 80% interval rounded outward and only narrow it at 5 or fewer stops away, where p90 drops to 19 minutes.
- **Fewer, better messages.** Updates fire only when the window really moves, capped at two a day, with quiet hours. More messages would feel responsive but would risk opt-outs, so opt-out rate is the guardrail.
- **In-transit WISMO is out of the pilot.** It's 7 of 36 tickets, but it needs delay messaging from exception events, not ETAs.

### What I'd do with more time
Replay Q3 data through the rules to measure the real window hit rate and message count per shipment before committing to the 85% target.`,
      files: [
        { path: 'README.md', content: strongReadme },
        { path: 'prd.md', content: strongPrd },
        { path: 'notification-rules.md', content: strongRules },
        { path: 'edge-cases.md', content: strongEdge },
        { path: 'ticket-analysis.md', content: strongTicketAnalysis },
      ],
      feedback:
        'Excellent work. Counting contacts per ticket, not just tickets, is a sharp catch: it shows the out-for-delivery silence drives repeat calls. Your rules are built around what ArrivalCast can actually do: the 80% interval rounded outward, narrowing only at 5 or fewer stops, and staying quiet when the ETA is stale. The holdout-based WISMO metric with an opt-out guardrail is how we\'d want to run the pilot. If anything, the 85% window hit-rate target needs the Q3 replay you proposed before we\'d commit to it.',
      aiDisclosure:
        'I used an AI assistant to sanity-check my ticket counts and to tighten the message copy to fit 160 characters. The rules, thresholds and metrics are my own decisions.',
    },
    {
      quality: 'solid',
      notes: `### What I built
A PRD with a problem statement, goals, users, prioritized requirements, metrics and phasing, plus a separate set of user stories for residential recipients, business recipients and dispatchers.

### Key decisions & trade-offs
- I framed the problem around the out-for-delivery silence because it's the biggest group in the ticket sample (12 of 36) and those customers called repeatedly.
- I chose to send an exact ETA ("arriving at 2:14 PM") because a specific time is easiest for recipients to plan around, and the model's median error is only 14 minutes.
- I kept the pilot to the three pilot carriers and pushed the dispatcher view to phase 2 so engineering can ship the recipient side first.
- I left the live map out of scope to keep the pilot small.

### What I'd do with more time
Design the message mockups and the tracking-page view, and work out what to show for the 8% of shipments without an ETA.`,
      files: [
        { path: 'README.md', content: solidReadme },
        { path: 'prd.md', content: solidPrd },
        { path: 'user-stories.md', content: solidStories },
      ],
      feedback:
        'This is well structured and easy to follow, and your problem statement correctly centers the out-for-delivery silence using the ticket sample. The core risk is the exact-minute ETA: a 14-minute median hides a 47-minute p90 (88 minutes rural), so "arriving at 2:14 PM" would be badly wrong for about 1 in 10 recipients. Sending a message on every eta_updated event would also flood people when routes get resequenced. Edge cases stop at failed deliveries, and there\'s no guardrail metric such as SMS opt-outs.',
      aiDisclosure: 'Used an AI tool to help draft the user stories, then edited them to match the ticket themes.',
    },
    {
      quality: 'weak',
      notes: `### What I built
A feature spec listing seven features for a better delivery tracking experience, with details on each and some sample message copy.

### Key decisions & trade-offs
- I modeled the experience on food delivery apps because customers already expect a live map and exact arrival time.
- I put everything in one release so customers get the full experience at once instead of piecemeal updates.
- I added ratings so carriers can get feedback on drivers.
- I used eta_point for the exact time because it's the model's best guess and is already shown to dispatchers.
- Texting at every stop keeps the recipient updated the whole way, like watching a food order.

### What I'd do with more time
Make mockups of the map and chat screens, and survey customers to find out which features are most popular.`,
      files: [
        { path: 'README.md', content: weakReadme },
        { path: 'features.md', content: weakFeatures },
        { path: 'message-copy.md', content: weakCopy },
      ],
      feedback:
        'You clearly care about the recipient experience, but this reads as a feature wish list rather than a PRD. There\'s no problem statement or numbers from the tickets, no success metric, and features like driver chat and dark mode don\'t connect to the WISMO problem. A text at every completed stop could mean 20+ messages per delivery, and exact times ignore the model\'s 47-minute p90 error. Start from the ticket data, pick the one problem worth solving, and define how you\'d know it worked.',
    },
  ],
  scripted: [
    { challengeId: 'ch_eta_prd', studentId: 'stu_riley', templateIndex: 0, submittedDaysAgo: 1, scores: null, feedback: null },
  ],
};

export default mod;
