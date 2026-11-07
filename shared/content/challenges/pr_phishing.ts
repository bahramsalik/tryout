import type { ChallengeModule } from '../lib.ts';

const brief = `## Context
Ironvale runs the phishing desk for about 180 clients. Staff forward roughly 300 suspicious emails a week, and about 1 in 6 turns out to be malicious. This one came from Harrow Valley Medical Group, a 9-clinic primary-care group with about 420 staff. On Monday, July 27 at 08:14 CDT, a front-desk coordinator at the Eastgate clinic received an email that appeared to come from Ledgerleaf Payroll, the group's real payroll vendor. It warned that her July 31 paycheck would be held unless she re-verified her direct-deposit details within 24 hours. She clicked, got uneasy and reported it. Harrow Valley IT's message trace shows 23 staff received the same email.

## The task
Work the report the way our phishing desk would:

1. Analyze \`reported/suspicious.eml\`: the Received chain, Return-Path, From and Reply-To, the Authentication-Results, the link and the attachment. Decide whether it is phishing and explain how each indicator supports that.
2. List the indicators of compromise (IOCs) that Harrow Valley should block or hunt for.
3. Write a staff advisory of no more than 200 words using \`advisory-template.md\`, in plain language, that shows staff the tells in this specific email.
4. Write the response steps for Harrow Valley IT, in order, with a note on what to do about the employee who clicked.

## Constraints
- Time box: 3 hours.
- Use a text editor to read the raw .eml. Don't open the attachment in a browser or follow the link: everything you need is in the file's text, and every domain and IP is fictional.
- Out of scope: malware reverse engineering, takedown requests and writing detection rules.
- AI assistants are allowed if you disclose how you used them. Header interpretations must be your own.

## What we provide
- \`reported/suspicious.eml\`: the full raw message as received, headers included
- \`reported/user-report.md\`: what the employee told the service desk, plus IT's message-trace note
- \`reference/genuine-ledgerleaf-headers.txt\`: headers from a real Ledgerleaf notice last month, for comparison
- \`advisory-template.md\`: the structure and tone rules for staff advisories
- \`README.md\`: how to approach the kit and what to submit
`;

const suspiciousEml = `Return-Path: <bounce-4471@relay7.trellismail.example>
Delivered-To: joan.mercer@harrowvalleymed.example
Received: from mail-gw01.harrowvalleymed.example (10.40.1.12) by mbx02.harrowvalleymed.example
 (10.40.2.21) with ESMTP id 4F2A91C0; Mon, 27 Jul 2026 13:14:09 +0000
Received: from relay7.trellismail.example (relay7.trellismail.example [198.51.100.87])
 by mail-gw01.harrowvalleymed.example (HVMG Mail Gateway) with ESMTPS id 9B03E2A41
 for <joan.mercer@harrowvalleymed.example>; Mon, 27 Jul 2026 13:14:07 +0000
Received: from [203.0.113.199] (unknown [203.0.113.199])
 by relay7.trellismail.example with ESMTPSA id 77c1e0aa;
 Mon, 27 Jul 2026 13:14:02 +0000
Authentication-Results: mail-gw01.harrowvalleymed.example;
 spf=fail (mail-gw01.harrowvalleymed.example: domain of bounce-4471@relay7.trellismail.example
 does not designate 198.51.100.87 as permitted sender) smtp.mailfrom=relay7.trellismail.example;
 dkim=none (message not signed);
 dmarc=fail (p=none sp=none dis=none) header.from=ledgerleaf-payroll.example
X-HVMG-Spam-Score: 4.1 (threshold 5.0)
From: "Ledgerleaf Payroll" <notifications@ledgerleaf-payroll.example>
Reply-To: "Payroll Support" <payroll.verify@hrdesk-mail.example>
To: joan.mercer@harrowvalleymed.example
Subject: ACTION REQUIRED: Direct deposit verification needed before July 31 pay run
Date: Mon, 27 Jul 2026 08:13:55 -0500
Message-ID: <20260727131355.4471.88123@relay7.trellismail.example>
MIME-Version: 1.0
X-Mailer: BulkSendr 4.2
X-Originating-IP: [203.0.113.199]
Content-Type: multipart/mixed; boundary="==LLB_0727_a91f=="

--==LLB_0727_a91f==
Content-Type: multipart/alternative; boundary="==ALT_0727_c3d2=="

--==ALT_0727_c3d2==
Content-Type: text/plain; charset="utf-8"
Content-Transfer-Encoding: 7bit

Dear Employee,

Our records show that your direct deposit details have not been re-verified
following our July security upgrade. To avoid a hold on your July 31 paycheck,
please confirm your banking details within 24 hours:

https://portal.ledgerleafpayroll.example/employee/verify

If we do not receive confirmation by 5:00 PM today, your payment will be held
until the next pay cycle. A copy of the direct deposit form is attached for
your records.

Thank you,
Ledgerleaf Payroll Employee Services
Ledgerleaf Payroll, Inc. | 1200 Commerce Way, Suite 400

--==ALT_0727_c3d2==
Content-Type: text/html; charset="utf-8"
Content-Transfer-Encoding: 7bit

<html>
<body style="font-family: Arial, sans-serif; font-size: 14px; color: #222;">
<p>Dear Employee,</p>
<p>Our records show that your direct deposit details have not been re-verified following our July security upgrade. To avoid a <b>hold on your July 31 paycheck</b>, please confirm your banking details within <b>24 hours</b>.</p>
<p><a href="https://ledgerleaf-payroll.account-verify.example/hv/login?u=joan.mercer&amp;c=0727">https://portal.ledgerleafpayroll.example/employee/verify</a></p>
<p>If we do not receive confirmation by <b>5:00 PM today</b>, your payment will be held until the next pay cycle. A copy of the direct deposit form is attached for your records.</p>
<p>Thank you,<br>Ledgerleaf Payroll Employee Services<br>Ledgerleaf Payroll, Inc. | 1200 Commerce Way, Suite 400</p>
</body>
</html>

--==ALT_0727_c3d2==--

--==LLB_0727_a91f==
Content-Type: text/html; name="DirectDeposit_Form_July2026.pdf.html"
Content-Disposition: attachment; filename="DirectDeposit_Form_July2026.pdf.html"
Content-Transfer-Encoding: base64

PGh0bWw+PGJvZHk+PHA+QXR0YWNobWVudCByZW1vdmVkIGJ5IElyb252YWxlIFNlY3VyaXR5IGZv
ciB0cmFpbmluZyB1c2UuIFRoZSBvcmlnaW5hbCBmaWxlIHdhcyBhbiBIVE1MIHBhZ2UgaW1pdGF0
aW5nIGEgcGF5cm9sbCBzaWduLWluIGZvcm0uPC9wPjwvYm9keT48L2h0bWw+

--==LLB_0727_a91f==--
`;

const userReportMd = `# Service desk ticket HVMG-SEC-3318

**Reported:** Mon Jul 27, 2026, 08:41 CDT, by the Eastgate clinic front-desk coordinator (joan.mercer@harrowvalleymed.example)
**Forwarded to:** Ironvale phishing desk (phishing@ironvale.example), 08:47 CDT

## What the employee said (transcribed by the service desk)
> I got this at about 8:15. It looked like our normal payroll emails, it had the Ledgerleaf name on it. I was worried about my check being held because I changed banks in June, so I clicked the link. A page with the Ledgerleaf logo came up and asked for my work email and password. I typed my email and started typing my password and then I noticed the address bar didn't say ledgerleafpayroll like it usually does, so I closed the tab. I don't think I hit the sign-in button but I'm honestly not 100% sure. I did not open the attachment. Maribel at Northside said she got the same email. I haven't replied to it.

## Service desk notes
- Ledgerleaf never asks for banking details by email. Direct-deposit changes are made in the Ledgerleaf portal (portal.ledgerleafpayroll.example) after signing in with HVMG single sign-on.
- The employee is still signed in on her workstation EG-FD-02. No password change yet.

## Harrow Valley IT message trace (08:55 CDT)
- 23 internal recipients received this message between 13:13 and 13:16 UTC.
- All 23 are still in inboxes. The gateway spam score was 4.1, below the 5.0 quarantine threshold.
- Web proxy logs are available on request for any domain you give us.
`;

const genuineHeaders = `Headers from a genuine Ledgerleaf notice received Jun 26, 2026 (body omitted)

Return-Path: <bounces@mail.ledgerleafpayroll.example>
Received: from out3.mail.ledgerleafpayroll.example (out3.mail.ledgerleafpayroll.example [198.51.100.140])
 by mail-gw01.harrowvalleymed.example (HVMG Mail Gateway) with ESMTPS id 1C77D0B12
 for <joan.mercer@harrowvalleymed.example>; Fri, 26 Jun 2026 14:02:51 +0000
Authentication-Results: mail-gw01.harrowvalleymed.example;
 spf=pass smtp.mailfrom=mail.ledgerleafpayroll.example;
 dkim=pass header.d=ledgerleafpayroll.example header.s=ll2026;
 dmarc=pass (p=reject sp=reject dis=none) header.from=ledgerleafpayroll.example
From: "Ledgerleaf Payroll" <no-reply@ledgerleafpayroll.example>
To: joan.mercer@harrowvalleymed.example
Subject: Your June 30 pay statement is ready
Date: Fri, 26 Jun 2026 09:02:47 -0500
Message-ID: <ps-20260626-88412@ledgerleafpayroll.example>
`;

const advisoryTemplateMd = `# Staff security advisory template (Ironvale clients)

Use this structure. Keep it under 200 words.

**Subject line:** Plain and calm. Say what to look out for, e.g. "Heads up: fake payroll email going around."

**What happened** (2-3 sentences): What staff may have received, when, and what it's trying to get.

**How to spot it** (3-5 bullets): Point to tells in *this* email that anyone can check without technical knowledge: the sender address, where the link really goes, the attachment name, the pressure in the wording.

**If you received it:** One clear action (for example, use the Report button, then delete).

**If you clicked or entered anything:** What to do and who to call. Make it safe to admit a mistake.

**Contact:** Service desk extension and email.

## Tone rules
- No ALL CAPS, no "URGENT", no scolding. People report more when they don't feel blamed.
- No jargon (SPF, DKIM, headers) unless you explain it in a few words.
- Aim for an 8th-grade reading level.
- Harrow Valley service desk: ext. 4357, servicedesk@harrowvalleymed.example
`;

const starterReadme = `# Dissect a phishing email and write the staff advisory

A Harrow Valley Medical Group employee reported an email claiming to be from Ledgerleaf Payroll. Your job is to prove whether it is phishing, pull out the IOCs, warn staff in plain language and tell IT what to do next.

## Suggested approach
1. Open \`reported/suspicious.eml\` in a plain text editor (not a mail client).
2. Read the **Received** headers from the bottom up: the bottom one is closest to the sender.
3. Compare **Return-Path**, **From** and **Reply-To**. Then read **Authentication-Results**.
4. Compare the headers with \`reference/genuine-ledgerleaf-headers.txt\`. What's different?
5. In the HTML part, compare each link's visible text with its \`href\`. Read domains right to left to find the one that is really registered.
6. Look at the attachment's name and its declared Content-Type.
7. Read \`reported/user-report.md\`. It changes what IT needs to do first.

Safety: don't open the attachment or visit the link. Everything you need is in the text.

## What to submit
A zip with:
- \`README.md\`: your verdict and summary
- Your header and indicator analysis
- An IOC list
- The staff advisory (under 200 words, following \`advisory-template.md\`)
- Response steps for Harrow Valley IT

Add your approach notes and AI-use disclosure in the submission form.
`;

/* ───────────── Strong template ───────────── */

const strongReadme = `# Phishing analysis: "Direct deposit verification" email (HVMG-SEC-3318)

## Verdict
**Confirmed credential phishing** impersonating Ledgerleaf Payroll, sent to 23 Harrow Valley staff on Jul 27, 2026 at 13:13-13:16 UTC. It was sent from a bulk-mail relay using a lookalike domain (**ledgerleaf-payroll.example**, with a hyphen; the real one is **ledgerleafpayroll.example**). It links to a fake sign-in page on **account-verify.example** and carries an HTML attachment disguised as a PDF.

## Top indicators
1. Lookalike From domain, and DMARC fails for it.
2. Return-Path and Received chain point to relay7.trellismail.example; the real vendor sends from mail.ledgerleafpayroll.example with SPF, DKIM and DMARC passing.
3. Reply-To goes to a third domain (hrdesk-mail.example).
4. Link text shows the real portal; the href goes to ledgerleaf-payroll.**account-verify.example**, with the recipient's username in the URL.
5. Attachment \`DirectDeposit_Form_July2026.pdf.html\` is declared \`text/html\`.
6. Pretext: paycheck hold, 24-hour deadline, "5:00 PM today", asks for banking details (Ledgerleaf never does this by email).

## Most urgent action
The reporter typed her email and part of her password and isn't sure whether she submitted it. **Treat her account as compromised**: reset her password and revoke her sessions now, before the purge. Then purge the other 22 copies and check proxy logs for anyone else who visited account-verify.example.

## Files
- \`analysis.md\`: header-by-header walkthrough
- \`iocs.csv\`: block and hunt list
- \`staff-advisory.md\`: 175-word advisory for all staff
- \`response-plan.md\`: ordered steps for Harrow Valley IT

## Note on the spam score
The gateway scored it 4.1, under the 5.0 threshold. A DMARC fail on a domain registered to look like a known vendor should probably add weight. Worth raising with IT, but out of scope here.
`;

const strongAnalysis = `# Header and content analysis

## Received chain (read bottom-up)
1. \`from [203.0.113.199] ... by relay7.trellismail.example with ESMTPSA\` at 13:14:02Z. The sender authenticated to a bulk relay from 203.0.113.199 (also in X-Originating-IP). This is the true origin.
2. \`relay7.trellismail.example [198.51.100.87] by mail-gw01.harrowvalleymed.example\` at 13:14:07Z.
3. Internal hop to mbx02 at 13:14:09Z.

**Nothing in the chain touches Ledgerleaf's mail servers.** The genuine sample arrives from out3.mail.ledgerleafpayroll.example [198.51.100.140].

## Sender fields
| Field | Value | Why it matters |
|---|---|---|
| From (display) | "Ledgerleaf Payroll" | Display names are free text; anyone can type this |
| From (address) | notifications@ledgerleaf-payroll.example | Lookalike: the real domain is ledgerleafpayroll.example (no hyphen) |
| Return-Path | bounce-4471@relay7.trellismail.example | Bounce domain unrelated to the From domain |
| Reply-To | payroll.verify@hrdesk-mail.example | Replies go to a third domain the attacker controls |
| Message-ID | ...@relay7.trellismail.example | Generated by the relay, not Ledgerleaf (genuine: @ledgerleafpayroll.example) |
| X-Mailer | BulkSendr 4.2 | Bulk-mailing tool |

## Authentication-Results
- **spf=fail**: the envelope domain (relay7.trellismail.example) doesn't authorize 198.51.100.87.
- **dkim=none**: not signed at all. The genuine notice is signed d=ledgerleafpayroll.example.
- **dmarc=fail** for header.from=ledgerleaf-payroll.example, with **p=none**. That's why it was delivered rather than rejected. The real domain publishes p=reject, which is why the attacker used a lookalike instead of spoofing it.

## Link
- Visible text: https://portal.ledgerleafpayroll.example/employee/verify
- Actual href: https://ledgerleaf-payroll.account-verify.example/hv/login?u=joan.mercer&c=0727
- Reading right to left, the registered domain is **account-verify.example**; "ledgerleaf-payroll" is only a subdomain. \`u=joan.mercer\` personalizes the link, so any visit in proxy logs can be tied to a recipient. \`c=0727\` looks like a campaign tag.
- The plain-text part shows only the real portal URL, which is why previews look legitimate.

## Attachment
\`DirectDeposit_Form_July2026.pdf.html\`, Content-Type \`text/html\`. The double extension hides ".html" on systems that hide known extensions. An HTML attachment opens locally in a browser and is a common way to show a fake sign-in form without a link the gateway can scan. (The kit's copy is a harmless, neutralized version.)

## Pretext
Payroll is high-trust and time-sensitive. The email uses a fake "July security upgrade", the July 31 pay date, a 24-hour deadline and then "5:00 PM today", and a generic "Dear Employee". It asks for banking details, which Ledgerleaf never does by email.
`;

const strongIocs = `type,value,action,note
email_from,notifications@ledgerleaf-payroll.example,block,lookalike sender
domain,ledgerleaf-payroll.example,block,lookalike of ledgerleafpayroll.example
email_reply_to,payroll.verify@hrdesk-mail.example,block,reply-to harvest
domain,hrdesk-mail.example,block,reply-to domain
domain,account-verify.example,block + hunt proxy logs,credential phishing host (registered domain)
url,https://ledgerleaf-payroll.account-verify.example/hv/login,hunt proxy logs,u= parameter identifies the recipient
ip,203.0.113.199,hunt,originating client IP
ip,198.51.100.87,monitor,relay7.trellismail.example; shared bulk relay; blocking may hit legitimate mail
subject,ACTION REQUIRED: Direct deposit verification needed before July 31 pay run,search and purge,
message_id,20260727131355.4471.88123@relay7.trellismail.example,search and purge,
attachment_name,DirectDeposit_Form_July2026.pdf.html,block,HTML disguised as PDF
attachment_sha256,801948d065e36661134dd59d8b795d8a88fe2e58c12d7333005afec7728cb2a8,hunt,hash of the copy in this report
`;

const strongAdvisory = `**Subject:** Heads up: fake Ledgerleaf payroll email going around

**What happened**
On Monday morning, 23 of us got an email that looks like it's from Ledgerleaf Payroll. It says your paycheck will be held unless you "verify" your bank details today. It's fake. It's trying to steal your work password.

**How to spot it**
- The sender is **ledgerleaf-payroll.example**, with a dash. Real Ledgerleaf email comes from **ledgerleafpayroll.example**, no dash.
- Hover over the link before clicking. It goes to **account-verify.example**, not the Ledgerleaf portal.
- The attachment ends in **.pdf.html**. A real PDF ends in .pdf.
- Ledgerleaf never asks for bank details by email, and never gives a same-day deadline.
- It failed our email security checks, which confirm who really sent a message (SPF/DMARC).

**If you got it:** Click Report Phishing, then delete it.

**If you clicked or typed anything:** Call the service desk right away. You're not in trouble, and the sooner we know, the easier it is to fix.

**Contact:** Service desk, ext. 4357 or servicedesk@harrowvalleymed.example
`;

const strongResponse = `# Response plan for Harrow Valley IT (in order)

## Now (first 30 minutes)
1. **Reporter's account**: she typed her email and part of her password and isn't sure she submitted it. Reset her password, revoke all sessions and tokens, and check sign-ins since 13:14 UTC for unfamiliar IPs. Confirm her MFA methods haven't changed.
2. **Block** at the gateway: sender domains ledgerleaf-payroll.example and hrdesk-mail.example. At the web proxy and DNS: account-verify.example (all subdomains).
3. **Search and purge** all 23 copies by Message-ID 20260727131355.4471.88123@relay7.trellismail.example (or subject + sender) from inboxes and deleted items.

## Next (within 2 hours)
4. **Who clicked**: search proxy logs for account-verify.example since 13:13 UTC. The \`u=\` parameter maps each visit to a recipient. For each visitor, ask whether they entered anything; treat "not sure" as yes and repeat step 1.
5. **Who replied**: search outbound mail to hrdesk-mail.example.
6. **Who opened the attachment**: check endpoint telemetry for DirectDeposit_Form_July2026.pdf.html launched from a mail temp folder.
7. **Payroll**: ask HR to confirm with Ledgerleaf that no direct-deposit details were changed for any HVMG employee since Jul 27, and to tell Ledgerleaf about the lookalike domain.

## Then
8. Send the staff advisory.
9. Hunt for 203.0.113.199 in gateway logs for earlier campaigns.
10. Review the spam-score weighting for DMARC fail on vendor lookalike domains.

Not recommended: blocking 198.51.100.87 outright. It's a shared bulk relay, so blocking it could drop legitimate newsletters. Block the domains instead and monitor the IP.
`;

/* ───────────── Solid template ───────────── */

const solidReadme = `# Phishing email analysis: Ledgerleaf direct deposit

## Verdict
This is a phishing email. The sender's Ledgerleaf account appears to have been compromised and used to send a credential-harvesting link to Harrow Valley staff.

## What I found
- **Sender**: "Ledgerleaf Payroll" <notifications@ledgerleaf-payroll.example>. The display name and address both say Ledgerleaf, so it was sent from Ledgerleaf's system, which suggests their mail account was compromised.
- **Return-Path** (relay7.trellismail.example) doesn't match the From domain. Ledgerleaf may use a bulk-mail service.
- **Reply-To** is a different domain (hrdesk-mail.example), so replies would go to the attacker.
- **SPF fail, DKIM none, DMARC fail**: the message failed authentication.
- **Link mismatch**: the text shows portal.ledgerleafpayroll.example but the link goes to ledgerleaf-payroll.account-verify.example.
- **Attachment**: DirectDeposit_Form_July2026.pdf.html is an HTML file pretending to be a PDF.
- **Urgency**: 24-hour deadline, paycheck hold, "Dear Employee".

## Files
- \`analysis.md\`
- \`staff-advisory.md\`
- \`response.md\`

## Recommendation
Let Ledgerleaf know their account may be compromised, and warn staff.
`;

const solidAnalysis = `# Analysis

## Headers
| Header | Value | Finding |
|---|---|---|
| From | "Ledgerleaf Payroll" <notifications@ledgerleaf-payroll.example> | Sent from Ledgerleaf (possibly compromised account) |
| Return-Path | bounce-4471@relay7.trellismail.example | Different from From |
| Reply-To | payroll.verify@hrdesk-mail.example | Replies go to another domain |
| X-Originating-IP | 203.0.113.199 | Original sender IP |
| Authentication-Results | spf=fail, dkim=none, dmarc=fail | Failed authentication |

## Received chain
Three hops: 203.0.113.199 to relay7.trellismail.example to the HVMG gateway to the mailbox server.

## Link
The visible link shows the real portal, but the href goes to ledgerleaf-payroll.account-verify.example/hv/login. Hovering would reveal this.

## Attachment
DirectDeposit_Form_July2026.pdf.html, type text/html. Double extension to look like a PDF.

## Social engineering
Paycheck hold, 24 hours, 5:00 PM today. Generic greeting.

## IOCs
- 203.0.113.199
- 198.51.100.87
- ledgerleaf-payroll.account-verify.example
- payroll.verify@hrdesk-mail.example
- DirectDeposit_Form_July2026.pdf.html
`;

const solidAdvisory = `**Subject:** Watch out for a fake payroll email

**What happened**
Some of us received an email on Monday that says it's from Ledgerleaf Payroll and asks you to confirm your bank details within 24 hours. It's a scam designed to steal your password.

**How to spot it**
- Hover over the link. If the address doesn't start with portal.ledgerleafpayroll.example, don't click.
- The attachment ends in ".pdf.html". That's a web page pretending to be a PDF.
- Ledgerleaf will never ask for your bank details by email.
- Real payroll emails don't threaten to hold your pay by 5 PM today.

**If you got it:** Use the Report Phishing button, then delete it.

**If you clicked or typed your password:** Call the service desk now. It's okay, mistakes happen, and calling quickly is the best thing you can do.

**Contact:** Service desk, ext. 4357 or servicedesk@harrowvalleymed.example
`;

const solidResponse = `# Response steps

1. Block the sender.
2. Delete the email from users' mailboxes.
3. Send the staff advisory.
4. Reset passwords for anyone who entered them.
5. Contact Ledgerleaf to report their compromised account.
6. Keep monitoring for similar emails.
`;

/* ───────────── Weak template ───────────── */

const weakReadme = `# Phishing Email Report

## Is it phishing?
Yes, this email is definitely phishing.

## Why
- It says "ACTION REQUIRED" in the subject, which is a big red flag.
- It's very urgent: 24 hours, 5:00 PM today.
- It says "Dear Employee" instead of using a name.
- There are some grammar and spelling issues that a real company wouldn't make.
- It asks for bank details.
- It has an attachment, and attachments can contain viruses.

## Who received it
The employee who reported it said a coworker at another clinic got the same email, so it probably went to a lot of people. It looks like a mass email sent to everyone at Harrow Valley.

## What to do
Warn everyone right away and tell them to delete the email. Anyone who clicked the link should change their password. IT should also remind staff to be careful with any email that asks for personal or banking information, especially if it has a deadline.

## Files
- \`findings.txt\`
- \`advisory.md\`
`;

const weakFindings = `Findings

- Subject in caps: ACTION REQUIRED
- Urgency: 24 hours, 5:00 PM today, paycheck will be held
- Generic greeting
- Asks for banking details
- Attachment could be a virus
- Link might be fake

Conclusion: phishing.
`;

const weakAdvisory = `**SUBJECT: WARNING!!! DANGEROUS PHISHING EMAIL - DO NOT CLICK!!!**

ATTENTION ALL STAFF: A DANGEROUS PHISHING EMAIL IS BEING SENT TO HARROW VALLEY EMPLOYEES. DO NOT OPEN IT. DO NOT CLICK ANY LINKS. DO NOT OPEN ANY ATTACHMENTS.

Hackers are trying to steal your information and your paycheck. If you click the link, your computer could be infected and you could put the whole organization at risk.

Always check emails carefully before clicking anything. Be suspicious of any email that asks you to do something urgently.

DELETE THIS EMAIL IMMEDIATELY IF YOU RECEIVED IT.

- IT Security
`;

const mod: ChallengeModule = {
  challenge: {
    id: 'pr_phishing',
    kind: 'practice',
    companyId: 'co_ironvale',
    title: 'Dissect a phishing email and write the staff advisory',
    summary: 'Pull apart a reported payroll phish: headers, SPF/DKIM/DMARC, the lookalike domain and link, then warn staff in plain words.',
    type: 'security',
    skills: ['Email header analysis', 'SPF/DKIM/DMARC', 'Phishing triage', 'IOC extraction', 'Security awareness writing'],
    classroomConcepts: [
      { concept: 'Email authentication with SPF, DKIM and DMARC', course: 'Network Security' },
      { concept: 'SMTP relays and the Received header chain', course: 'Computer Networks' },
      { concept: 'Social engineering and pretexting', course: 'Information Security Management' },
      { concept: 'Writing risk communication for non-technical audiences', course: 'Technical Communication' },
    ],
    difficulty: 'beginner',
    estHours: 3,
    brief,
    deliverables: [
      'Header and indicator analysis of the reported email',
      'IOC list for blocking and hunting',
      'Plain-language staff advisory (under 200 words)',
      'Ordered response steps for the client IT team',
    ],
    rubric: [
      { id: 'indicators', name: 'Indicators found', description: 'Finds every indicator: lookalike domain, Return-Path and Reply-To mismatches, auth failures, link mismatch, disguised attachment and pretext, plus a usable IOC list.', weight: 30 },
      { id: 'technical_analysis', name: 'Technical analysis', description: 'Reads the Received chain and Authentication-Results correctly and explains what each result proves about the real sender, without trusting the display name.', weight: 25 },
      { id: 'advisory', name: 'Staff advisory', description: 'A calm, jargon-free advisory under 200 words that shows staff the tells in this specific email and makes it safe to report a click.', weight: 25 },
      { id: 'response', name: 'Response steps', description: 'Ordered, specific steps: contain the employee who clicked, block the domains, purge all copies, find other clickers via proxy logs, and confirm no payroll changes.', weight: 20 },
    ],
    reward: { mode: 'none', amounts: [] },
    applicantCap: null,
    status: 'open',
    hiringFor: null,
    starterFiles: [
      { path: 'README.md', content: starterReadme },
      { path: 'reported/suspicious.eml', content: suspiciousEml },
      { path: 'reported/user-report.md', content: userReportMd },
      { path: 'reference/genuine-ledgerleaf-headers.txt', content: genuineHeaders },
      { path: 'advisory-template.md', content: advisoryTemplateMd },
    ],
    aiHints: {
      testing:
        "Whether you can prove who really sent an email from its headers instead of trusting what it says about itself, and whether you can turn that proof into something non-technical staff will actually act on. The user report also tests whether you notice that one person may already have given away her password.",
      steps: [
        'Read the Received headers bottom-up and write down where the message really started and which servers it passed through.',
        'Line up Return-Path, From, Reply-To and Message-ID and compare each with the genuine Ledgerleaf sample.',
        'Interpret each Authentication-Results line (SPF, DKIM, DMARC) and say which domain each one was checking.',
        'In the HTML part, compare the link text with the href and find the registered domain by reading right to left; then check the attachment name against its Content-Type.',
        'Build the IOC list, then write the advisory around the three or four tells a non-technical reader can check.',
        'Order the response steps, starting with the employee who may have entered her password.',
      ],
      greatLooksLike:
        'A great submission spots that ledgerleaf-payroll.example is a lookalike of ledgerleafpayroll.example, explains why DMARC failed but the message was still delivered (p=none), and shows that the link really goes to account-verify.example. Its advisory is calm and specific: "check for the dash", "hover over the link", ".pdf.html is not a PDF". The response treats the reporter as compromised first, then blocks, purges all 23 copies and uses the u= parameter in proxy logs to find anyone else who clicked.',
      pitfalls: [
        'Treating the display name or From address as proof of the sender, then concluding the vendor was hacked.',
        'Relying on spelling and urgency alone. This email has no spelling mistakes, and most modern phish don\'t.',
        'Writing an all-caps, scary advisory that tells staff what not to do but not how to recognize this email.',
        'Generic response steps that skip the employee who may have entered her password, or never check who else clicked.',
        'Blocking the shared bulk-relay IP outright, which can drop legitimate mail; block the attacker\'s domains instead.',
      ],
    },
    deadlineInDays: null,
    createdDaysAgo: 95,
    seed: { participants: 33, submissions: 20, scored: 20 },
  },
  templates: [
    {
      quality: 'strong',
      notes: `### What I built
A header-by-header analysis of the reported email, a 12-line IOC list, a staff advisory of about 175 words and an ordered response plan for Harrow Valley IT.

### Key decisions & trade-offs
- I compared every sender field with the genuine Ledgerleaf sample. That's what exposed the lookalike domain (one hyphen), and it showed why the attacker didn't just spoof the real domain: it publishes DMARC p=reject.
- I put the reporter's account first in the response plan. She isn't sure whether she submitted her password, and "not sure" has to mean "yes".
- I chose not to recommend blocking 198.51.100.87 because it's a shared bulk relay. Blocking the attacker's domains does the job without breaking legitimate mail.
- In the advisory I limited the tells to things anyone can check: the dash, where the link goes, the .pdf.html name and the same-day deadline.

### What I'd do with more time
Ask IT for the proxy-log results for account-verify.example and turn the u= values into a list of people to contact. I'd also look for earlier campaigns from 203.0.113.199.`,
      files: [
        { path: 'README.md', content: strongReadme },
        { path: 'analysis.md', content: strongAnalysis },
        { path: 'iocs.csv', content: strongIocs },
        { path: 'staff-advisory.md', content: strongAdvisory },
        { path: 'response-plan.md', content: strongResponse },
      ],
      feedback:
        'Excellent work. You caught the one-hyphen lookalike, explained why DMARC failed but the mail was still delivered (p=none), and found the real registered domain behind the link, which is the core of this task. Putting the reporter\'s possibly entered password at the top of the response plan, and using the u= parameter to find other clickers, is exactly how a phishing desk thinks. One polish point for the advisory: the "SPF/DMARC" line adds jargon staff can\'t act on, so cut it and keep the four tells that anyone can check.',
      aiDisclosure:
        'Used an AI assistant to confirm how DMARC alignment works when p=none, then checked it against my course notes. Wrote the analysis and advisory myself.',
    },
    {
      quality: 'solid',
      notes: `### What I built
An analysis of the email's headers, link and attachment, a staff advisory and a list of response steps.

### Key decisions & trade-offs
- I went through every header and noted mismatches: Return-Path and Reply-To both point to other domains, and all three authentication checks failed.
- Because the From address and display name both say Ledgerleaf, I concluded the email came from Ledgerleaf's own system and that their account was probably compromised. That's why I recommended contacting them.
- I spent the most time on the advisory, because staff are the ones who will see the next one. I kept it short, gave concrete tells and made it okay to admit clicking.
- I kept the response steps short so IT can act quickly.

### What I'd do with more time
Look into the Received chain more closely and turn the IOCs into a proper block list.`,
      files: [
        { path: 'README.md', content: solidReadme },
        { path: 'analysis.md', content: solidAnalysis },
        { path: 'staff-advisory.md', content: solidAdvisory },
        { path: 'response.md', content: solidResponse },
      ],
      feedback:
        "Your advisory is genuinely good: calm, specific and safe to act on. You also caught the link mismatch and the .pdf.html attachment. The key misread is the sender: the From domain is ledgerleaf-payroll.example (with a hyphen), not Ledgerleaf's real ledgerleafpayroll.example, and nothing in the Received chain touches Ledgerleaf's servers, so this isn't a vendor compromise; the genuine sample in the kit shows the difference. The response steps are also generic: they don't start with the reporter who may have entered her password, purge all 23 copies or check proxy logs for other clicks.",
      aiDisclosure: 'Asked an AI chatbot what "ESMTPSA" means in a Received header.',
    },
    {
      quality: 'weak',
      notes: `### What I built
A short report on why the email is phishing, a list of findings and a warning for all staff.

### Key decisions & trade-offs
- I focused on the obvious red flags that anyone would notice: the all-caps subject line, the urgent deadline, the generic "Dear Employee" greeting and the spelling issues.
- I made the advisory strong and attention-grabbing so people won't ignore it. Security warnings often get skipped, so I used capitals and exclamation marks to make sure it stands out in a busy inbox.
- I didn't go deep into the headers, because the content alone made it clear it was phishing and I wanted to spend my time on the warning instead.
- I kept the response simple (warn everyone and delete the email) so IT can act fast.

### What I'd do with more time
Learn more about how to read email headers and what SPF and DMARC mean, then add the technical details and a proper list of things to block.`,
      files: [
        { path: 'README.md', content: weakReadme },
        { path: 'findings.txt', content: weakFindings },
        { path: 'advisory.md', content: weakAdvisory },
      ],
      feedback:
        "You reached the right verdict, and spotting the pressure tactics is a fair start. The analysis needs evidence, though: this email has no spelling mistakes, and the proof is in the headers you skipped, namely the lookalike ledgerleaf-payroll.example domain, the SPF and DMARC failures, and the link that really goes to account-verify.example. The all-caps advisory tells staff to be scared but not how to recognize this email, and messages like that tend to get fewer reports, not more. Try the README's step-by-step header walkthrough and rewrite the advisory around three tells anyone can check.",
    },
  ],
  scripted: [
    {
      challengeId: 'pr_phishing',
      studentId: 'stu_zara',
      scores: { indicators: 5, technical_analysis: 5, advisory: 4, response: 5 },
      feedback:
        "Outstanding analysis. You found every indicator, including the one-hyphen lookalike, the Reply-To on a third domain and the .pdf.html attachment, and your explanation of why DMARC failed but the mail was delivered (p=none, while the real domain is p=reject) is spot on. The response plan is the best part: the reporter's account comes first, you purge by Message-ID and you use the u= parameter to find other clickers. The advisory lost a point for the \"SPF/DMARC\" line; front-desk staff can't act on it, so the four plain tells are enough.",
      templateIndex: 0,
      submittedDaysAgo: 80,
    },
    {
      challengeId: 'pr_phishing',
      studentId: 'stu_arjun',
      scores: { indicators: 4, technical_analysis: 4, advisory: 5, response: 4 },
      feedback:
        "Your staff advisory is excellent: calm, specific and it makes reporting a click feel safe, which is exactly what drives reports. You found most indicators, including the link mismatch and the disguised attachment. The miss is the sender: you took the From line as proof the email came from Ledgerleaf, but the domain is the hyphenated lookalike ledgerleaf-payroll.example and the Received chain never touches Ledgerleaf's servers, so it isn't a vendor compromise. The response steps are also generic; next time, start with the reporter who may have entered her password, then purge all 23 copies and check proxy logs for other visits to account-verify.example.",
      templateIndex: 1,
      submittedDaysAgo: 33,
    },
  ],
};

export default mod;
