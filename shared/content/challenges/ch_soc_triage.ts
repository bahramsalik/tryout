import type { ChallengeModule } from '../lib.ts';

const brief = `## Context
Ironvale's 24/7 SOC watches about 180 mid-sized clients. One of them, Cedar Hollow Credit Union (14 branches in Marlow County, Missouri, about 310 staff and 41,000 members), generated 12 alerts between 18:00 and 08:00 CDT on the night of Tuesday, October 20. A Tier 1 analyst on our night shift works 40–60 alerts like these across several clients, and historically about 1 in 40 is a real incident. Last quarter a mailbox compromise at another client sat in the queue for 9 hours because its rule was rated Low. We want to see how you think when the scariest-looking alert and the real one are not the same alert.

## The task
Triage all 12 alerts in \`alerts.json\` the way our night shift would:

1. Give every alert a verdict from \`runbook-triage.md\` (Escalate, Benign – expected, Benign – blocked, False positive) and cite the specific evidence behind it: a field in the alert, a line in the change calendar, an entry in the allow-list.
2. Group alerts that belong to the same activity, and put the queue in the order you would have worked it, with a priority (P1–P4) for each.
3. Write the escalation note to Cedar Hollow's IT on-call for anything that needs one, using the runbook format.
4. Suggest tuning for 2–3 of the noisiest rules, using the \`rule_fires_last_30d\` counts.

## Constraints
- Time box: 3 hours. A complete, evidence-backed triage beats a beautiful partial one.
- Any tools are fine: a text editor, \`jq\`, a spreadsheet. Everything you need is in the kit; you don't need SIEM access or internet lookups, and every IP, domain and account is fictional.
- Out of scope: writing detection code, contacting anyone, and full incident response. Stop at triage, the escalation note and tuning ideas.
- AI assistants are allowed if you disclose how you used them. The verdicts and the evidence must be yours.

## What we provide
- \`alerts.json\`: the 12 alerts as exported from our SIEM (timestamps in UTC; CDT is UTC-5)
- \`context/asset-inventory.csv\`: Cedar Hollow hosts, owners, criticality and egress IPs
- \`context/change-calendar.md\`: approved changes and standing jobs for the week
- \`context/known-good.md\`: Cedar Hollow IT's allow-list notes
- \`runbook-triage.md\`: verdict categories, priorities and the escalation-note format
- \`README.md\`: how to work through the kit and what to submit
`;

const alertsJson = `{
  "export": {
    "siem": "Ironvale Sentry",
    "tenant": "cedar-hollow-cu",
    "client": "Cedar Hollow Credit Union",
    "window_utc": ["2026-10-20T23:00:00Z", "2026-10-21T13:00:00Z"],
    "window_local": "Tue Oct 20 18:00 to Wed Oct 21 08:00 CDT (UTC-5)",
    "alert_count": 12
  },
  "alerts": [
    {
      "alert_id": "ALR-4101",
      "created_utc": "2026-10-20T23:12:44Z",
      "rule_id": "IDP-014",
      "rule_name": "Password spray: many accounts from one source",
      "severity": "medium",
      "source": "identity",
      "entity": { "src_ip": "203.0.113.77", "src_asn": "AS64521 Driftnet Hosting", "src_country": "US" },
      "evidence": {
        "window_utc": "23:01:10Z-23:12:30Z",
        "failed_signins": 46,
        "distinct_usernames": 41,
        "usernames_existing_in_directory": 2,
        "existing_accounts_targeted": ["info@cedarhollowcu.example", "careers@cedarhollowcu.example"],
        "sample_nonexistent_usernames": ["admin@", "jsmith@", "test@", "payroll@", "mwilliams@"],
        "successful_signins": 0,
        "result": "All attempts used legacy authentication; denied by conditional access policy CA-07"
      },
      "rule_fires_last_30d": 3
    },
    {
      "alert_id": "ALR-4102",
      "created_utc": "2026-10-21T00:15:09Z",
      "rule_id": "NET-031",
      "rule_name": "Internal host scanning many destinations",
      "severity": "medium",
      "source": "network",
      "entity": { "host": "IT-SCAN01", "src_ip": "10.20.5.15", "account": "svc_vulnscan" },
      "evidence": {
        "scan_start_utc": "2026-10-21T00:02:11Z",
        "distinct_destinations": 412,
        "destination_ranges": ["10.20.0.0/16", "10.21.0.0/16", "10.23.0.0/16", "10.27.0.0/16"],
        "ports": "tcp/1-1024, 3389, 5985",
        "authenticated_checks": true,
        "external_destinations": 0
      },
      "rule_fires_last_30d": 4
    },
    {
      "alert_id": "ALR-4103",
      "created_utc": "2026-10-21T01:04:31Z",
      "rule_id": "IDP-022",
      "rule_name": "Impossible travel",
      "severity": "medium",
      "source": "identity",
      "entity": { "user": "kelly.osei@cedarhollowcu.example", "title": "Branch Manager, Eastgate" },
      "evidence": {
        "signin_1": { "time_utc": "2026-10-21T00:51:02Z", "ip": "192.0.2.61", "geo": "Marlow, MO, US", "app": "Webmail", "result": "success", "mfa": "push approved" },
        "signin_2": { "time_utc": "2026-10-21T00:57:40Z", "ip": "203.0.113.141", "geo": "Dallas, TX, US", "app": "Webmail", "result": "success", "mfa": "satisfied by token" },
        "distance_km": 590,
        "implied_speed_kmh": 5330,
        "device": "CH-LT-KO (managed, compliant)",
        "vpn_session_started_utc": "2026-10-21T00:56:58Z"
      },
      "rule_fires_last_30d": 23
    },
    {
      "alert_id": "ALR-4104",
      "created_utc": "2026-10-21T01:30:02Z",
      "rule_id": "NET-008",
      "rule_name": "Large outbound transfer: possible data exfiltration",
      "severity": "critical",
      "source": "network",
      "entity": { "host": "CH-BKP01", "src_ip": "10.20.8.20", "dst_ip": "203.0.113.50", "dst_port": 443, "dst_asn": "AS64540 Coldvault Offsite Storage" },
      "evidence": {
        "session_start_utc": "2026-10-21T00:30:05Z",
        "bytes_out_first_60m": "58.7 GB",
        "threshold": "50 GB in 60 minutes",
        "session_end_utc": "2026-10-21T03:42:18Z",
        "bytes_out_session_total": "186.4 GB",
        "process": "cvagent.exe (Coldvault Replication Agent 5.1, signed)",
        "account": "svc_backup",
        "tls_sni": "vault-us2.coldvault.example"
      },
      "rule_fires_last_30d": 4
    },
    {
      "alert_id": "ALR-4105",
      "created_utc": "2026-10-21T02:41:20Z",
      "rule_id": "IDP-031",
      "rule_name": "MFA push requests denied repeatedly",
      "severity": "low",
      "source": "identity",
      "entity": { "user": "dana.whitlock@cedarhollowcu.example", "title": "Senior Loan Processor, HQ Lending" },
      "evidence": {
        "window_utc": "02:32:03Z-02:41:07Z",
        "push_requests": 14,
        "denied": 9,
        "timed_out": 4,
        "approved": 1,
        "approved_at_utc": "2026-10-21T02:41:07Z",
        "requesting_ip": "198.51.100.23",
        "requesting_app": "Webmail",
        "password_step": "correct password supplied before each push",
        "authenticator": "mobile app, enrolled 2025-03-11, push without number matching"
      },
      "rule_fires_last_30d": 6
    },
    {
      "alert_id": "ALR-4106",
      "created_utc": "2026-10-21T02:42:05Z",
      "rule_id": "IDP-009",
      "rule_name": "Sign-in from unfamiliar location",
      "severity": "medium",
      "source": "identity",
      "entity": { "user": "dana.whitlock@cedarhollowcu.example", "src_ip": "198.51.100.23", "src_asn": "AS64533 Hostwave Cloud (hosting provider)", "src_country": "NL" },
      "evidence": {
        "signin_time_utc": "2026-10-21T02:41:09Z",
        "result": "success",
        "mfa": "push approved 2026-10-21T02:41:07Z",
        "app": "Webmail",
        "device": "unregistered, not compliant",
        "session_id": "s-7f3a91c2e4",
        "first_seen_asn_for_user": true,
        "user_baseline_30d": { "countries": ["US"], "ips": ["192.0.2.10 (HQ egress)", "192.0.2.88 (home ISP)"] },
        "geo_policy_CA-12": "report-only: would have blocked"
      },
      "rule_fires_last_30d": 11
    },
    {
      "alert_id": "ALR-4107",
      "created_utc": "2026-10-21T02:58:40Z",
      "rule_id": "EDR-112",
      "rule_name": "Encoded PowerShell command on server",
      "severity": "high",
      "source": "endpoint",
      "entity": { "host": "CH-DC02", "ip": "10.20.1.11", "role": "Domain controller", "account": "adm.tpark@cedarhollowcu.example" },
      "evidence": {
        "command_line": "powershell.exe -NoProfile -ExecutionPolicy Bypass -EncodedCommand SQBtAHAAbwByAHQALQBNAG8AZAB1AGwAZQAgAEMASABQAGEAdABjAGgAVABvAG8AbABzADsAIABJAG4AcwB0AGEAbABsAC0AUABlAG4AZABpAG4AZwBVAHAAZABhAHQAZQBzACAALQBSAGUAYgBvAG8AdAA6ADAAIAAtAEwAbwBnACAARAA6AC8ASQBUAEwAbwBnAHMALwBDAEgARwAtADIAMgA5ADEALgBsAG8AZwA=",
        "decoded_command": "Import-Module CHPatchTools; Install-PendingUpdates -Reboot:0 -Log D:/ITLogs/CHG-2291.log",
        "parent_process": "cmd.exe in interactive RDP session from CH-MGMT01 (10.20.5.20)",
        "logon_type": "RemoteInteractive",
        "network_connections": ["10.20.5.20:8530 (internal update service)"],
        "external_connections": 0
      },
      "rule_fires_last_30d": 14
    },
    {
      "alert_id": "ALR-4108",
      "created_utc": "2026-10-21T03:07:52Z",
      "rule_id": "MAIL-017",
      "rule_name": "Inbox rule forwards mail to external domain",
      "severity": "low",
      "source": "email",
      "entity": { "user": "dana.whitlock@cedarhollowcu.example", "client_ip": "198.51.100.23", "session_id": "s-7f3a91c2e4" },
      "evidence": {
        "rule_created_utc": "2026-10-21T02:56:31Z",
        "rule_name": ".",
        "created_via": "Webmail",
        "conditions": { "subject_or_body_contains": ["wire", "payoff", "ACH", "invoice", "closing"] },
        "actions": { "forward_to": "dw.loanfiles@quickpost-mail.example", "mark_as_read": true, "move_to_folder": "RSS Subscriptions" },
        "messages_forwarded_at_alert_time": 2
      },
      "rule_fires_last_30d": 41
    },
    {
      "alert_id": "ALR-4109",
      "created_utc": "2026-10-21T04:20:15Z",
      "rule_id": "EDR-076",
      "rule_name": "New software installed on many endpoints",
      "severity": "medium",
      "source": "endpoint",
      "entity": { "deployed_from": "CH-MGMT01", "account": "svc_swdeploy" },
      "evidence": {
        "package": "LedgerLink Teller Client 8.4.2",
        "installer": "LLTeller-8.4.2-x64.msi",
        "sha256": "75f7458658670b37d743c2e2aabb280fbe266492453b1a7ec961d5f35c3fcfd5",
        "signer": "Brightfield Banking Software, Inc. (valid signature)",
        "endpoints": 61,
        "endpoint_group": "Teller workstations, all 14 branches",
        "first_install_utc": "2026-10-21T04:02:40Z"
      },
      "rule_fires_last_30d": 9
    },
    {
      "alert_id": "ALR-4110",
      "created_utc": "2026-10-21T05:41:30Z",
      "rule_id": "IDP-040",
      "rule_name": "Repeated failed logons: service account",
      "severity": "medium",
      "source": "identity",
      "entity": { "account": "svc_printmgmt", "src_host": "CH-PRT01", "src_ip": "10.20.6.30" },
      "evidence": {
        "first_failure_utc": "2026-10-20T22:04:12Z",
        "failures": 37,
        "failure_reason": "bad password",
        "pattern": "one attempt about every 12 minutes from the print spooler service",
        "other_sources": 0,
        "account_locked_out_utc": "2026-10-21T05:41:22Z"
      },
      "rule_fires_last_30d": 2
    },
    {
      "alert_id": "ALR-4111",
      "created_utc": "2026-10-21T07:52:10Z",
      "rule_id": "NET-044",
      "rule_name": "Repeated connections to newly registered domain",
      "severity": "low",
      "source": "dns",
      "entity": { "host": "IT-MON01", "src_ip": "10.20.5.25" },
      "evidence": {
        "domain": "holidaysaver-cedarhollow.example",
        "domain_registered": "2026-10-12",
        "resolved_ip": "203.0.113.90",
        "connections_since_2026-10-21T00:00Z": 32,
        "interval": "every 15 minutes",
        "http_requests": "GET / and GET /status only, 2-4 KB responses"
      },
      "rule_fires_last_30d": 1
    },
    {
      "alert_id": "ALR-4112",
      "created_utc": "2026-10-21T12:46:03Z",
      "rule_id": "EDR-090",
      "rule_name": "Potentially unwanted application",
      "severity": "low",
      "source": "endpoint",
      "entity": { "host": "CH-BR03-WS11", "ip": "10.23.1.41", "user": "jlarue@cedarhollowcu.example" },
      "evidence": {
        "file": "ShopSaverToolbar_Setup.exe",
        "sha256": "ffe6d45e0789630b7eab7e251c392296d7ce3563e253f81e6dcbd77321197af3",
        "category": "Browser toolbar / adware",
        "action": "quarantined on write",
        "executed": false,
        "download_source": "browser download, 12:45:51Z"
      },
      "rule_fires_last_30d": 5
    }
  ]
}
`;

const assetInventoryCsv = `hostname,ip,role,owner_team,location,criticality,notes
CH-DC01,10.20.1.10,Domain controller,IT Infrastructure,HQ server room,critical,Patched monthly under CHG tickets
CH-DC02,10.20.1.11,Domain controller,IT Infrastructure,HQ server room,critical,Patched monthly under CHG tickets
CH-FS01,10.20.2.15,File server (lending and member documents),IT Infrastructure,HQ server room,high,
CH-CORE-GW01,10.20.3.5,Core banking gateway,IT Infrastructure,HQ server room,critical,Only host allowed to reach the hosted core processor
IT-SCAN01,10.20.5.15,Vulnerability scanner,IT Security,HQ server room,medium,Weekly authenticated scan as svc_vulnscan
CH-MGMT01,10.20.5.20,Endpoint management and patch server; admin jump host,IT Infrastructure,HQ server room,high,Software deployment as svc_swdeploy; update service on tcp/8530
IT-MON01,10.20.5.25,Uptime and website monitoring,IT Infrastructure,HQ server room,low,Synthetic checks every 15 minutes
CH-PRT01,10.20.6.30,Print server (all branches),IT Infrastructure,HQ server room,medium,Spooler service runs as svc_printmgmt
CH-BKP01,10.20.8.20,Backup server,IT Infrastructure,HQ server room,high,Replicates to Coldvault Offsite as svc_backup
CH-HQ-WS114,10.20.12.114,Workstation,Lending,HQ 2nd floor,medium,Assigned to dana.whitlock
CH-HQ-WS188,10.20.12.188,Workstation,Marketing,HQ 3rd floor,low,
CH-BR03-WS11,10.23.1.41,Teller workstation,Branch Operations,Branch 03 Riverside,medium,Shared teller station 2
CH-BR07-WS03,10.27.1.33,Teller workstation,Branch Operations,Branch 07 Pine Ridge,medium,
CH-LT-KO,DHCP,Laptop,Branch Operations,Branch 05 Eastgate,medium,Assigned to kelly.osei; remote access via VPN
HQ-EGRESS,192.0.2.10,HQ internet egress (NAT),IT Infrastructure,HQ,n/a,All HQ and branch traffic leaves here
VPN-EGRESS-OLD,192.0.2.32/28,Remote-access VPN egress,IT Infrastructure,n/a,n/a,Retired 2026-10-19 (CHG-2284)
VPN-EGRESS,203.0.113.128/27,Remote-access VPN egress via Northgate Edge,IT Infrastructure,n/a,n/a,In service since 2026-10-19 (CHG-2284)
`;

const changeCalendarMd = `# Cedar Hollow CU: change calendar, week of Oct 19, 2026

Maintained by Cedar Hollow IT (it-oncall@cedarhollowcu.example). Times are CDT (UTC-5) with UTC in brackets.

## Approved changes

| Change | Window | Systems | Operator | Status |
|---|---|---|---|---|
| CHG-2284 Remote-access VPN cutover to Northgate Edge | Sun Oct 18 22:00 to Mon Oct 19 02:00 [Oct 19 03:00-07:00 UTC] | VPN, egress pool 203.0.113.128/27 | R. Okafor | Completed. Commercial geo-IP databases still place the new pool in Dallas, TX. Correction requested Oct 19 (Northgate ticket NGE-55120), expected in 7-10 days. |
| CHG-2288 LedgerLink Teller Client 8.4.2 rollout | Tue Oct 20 23:00 to Wed Oct 21 01:00 [Oct 21 04:00-06:00 UTC] | 61 teller workstations | svc_swdeploy via CH-MGMT01 | Approved by CAB Oct 14 |
| CHG-2290 Quarterly service-account password rotation | Tue Oct 20 17:00-18:00 [22:00-23:00 UTC] | svc_printmgmt, svc_swdeploy, svc_vulnscan, svc_backup, svc_scanmail, svc_hrsync | R. Okafor | Completed. Dependent services updated for all accounts except the CH-PRT01 spooler (follow-up REQ-8817, Wed morning). |
| CHG-2291 Monthly domain controller patching | Tue Oct 20 21:00-23:30 [Oct 21 02:00-04:30 UTC] | CH-DC01, CH-DC02 | adm.tpark, RDP from CH-MGMT01, using the CHPatchTools module | Approved |

## Standing jobs

| Job | Schedule | Detail |
|---|---|---|
| STD-01 Weekly authenticated vulnerability scan | Every Tue 19:00-23:00 [Wed 00:00-04:00 UTC] | IT-SCAN01 scans HQ and branch subnets as svc_vulnscan |
| STD-02 Nightly incremental backup | Daily 19:30 [00:30 UTC] | CH-BKP01 to Coldvault Offsite, typically 15-25 GB |
| STD-03 Weekly full backup | Every Tue 19:30 [Wed 00:30 UTC], replaces the incremental | CH-BKP01 to Coldvault Offsite, typically 170-200 GB, 3-4 hours |

## Not scheduled this week

- No changes to email, mailbox rules, identity provider or conditional access policies.
- No admin work outside the windows above.
`;

const knownGoodMd = `# Cedar Hollow CU: known-good notes for Ironvale SOC

Owner: Cedar Hollow IT. Last reviewed Oct 15, 2026. If something isn't listed here, it isn't approved.

## Network destinations
- **203.0.113.50** (vault-us2.coldvault.example, AS64540): Coldvault Offsite Storage, our contracted offsite backup provider since 2023. Only CH-BKP01 talks to it, using cvagent.exe as svc_backup.
- **203.0.113.128/27**: Northgate Edge VPN egress since Oct 19 (CHG-2284). Sign-ins from this pool are our own remote staff.
- **203.0.113.90**: Fernhill Creative, the agency hosting **holidaysaver-cedarhollow.example**. Marketing registered the domain on Oct 12 for the Holiday Saver campaign (launch Nov 2). IT-MON01 checks it every 15 minutes.

## Identity
- Shared mailboxes **info@, careers@ and members@** have sign-in blocked; they receive mail only.
- **CA-07** blocks legacy authentication for all users.
- **CA-12** (block sign-ins from outside the US) has been in report-only mode since Sept 2 while we fix two traveling executives' exceptions. Enforcement is planned for November.
- Admin accounts use the **adm.** prefix: adm.tpark (Theo Park, systems administrator) and adm.rokafor (Rina Okafor, IT manager). Admins work from CH-MGMT01 only.
- Service accounts use the **svc_** prefix and never sign in interactively.

## Email
Approved external forwarding rules (policy IT-POL-14; anything else is not allowed):
1. board.secretary@ to boardportal.example (board packets)
2. collections@ to recoverypartners.example (contracted collections agency)
3. it-alerts@ to pager.ironvale.example (after-hours paging)

The board portal sync re-saves rule 1 several times a week, which trips MAIL-017.

## Software
- **LedgerLink Teller Client** (Brightfield Banking Software, Inc.). Vendor-published SHA-256 for LLTeller-8.4.2-x64.msi: 75f7458658670b37d743c2e2aabb280fbe266492453b1a7ec961d5f35c3fcfd5
- **CHPatchTools** is our internal PowerShell module for server patching. The launcher passes its command with -EncodedCommand to avoid quoting problems, so EDR-112 fires on every patch night.

## Endpoint
- EDR quarantines adware and toolbar installers automatically. No action is needed unless \`executed\` is true.

## People (for context)
- dana.whitlock: Senior Loan Processor, HQ Lending. Works 08:00-17:00 CDT. Not on any travel list.
- kelly.osei: Branch Manager, Eastgate. Works remotely two evenings a week over VPN.
`;

const runbookMd = `# Ironvale SOC: alert triage runbook (Tier 1)

## Verdicts
| Verdict | Use when | What happens |
|---|---|---|
| **ESCALATE** | Malicious or unauthorized activity that needs client action | Escalation note to client on-call, plus a phone call for P1 |
| **BENIGN-EXPECTED** | Real activity that is authorized: matches a change ticket, standing job or allow-list entry | Close with the reference |
| **BENIGN-BLOCKED** | Hostile or unwanted activity that our controls stopped, with no sign of success | Close; mention in the morning summary |
| **FALSE-POSITIVE** | The rule fired on something that isn't what it describes (bad geo data, parsing error) | Close; open a tuning ticket |

Every verdict needs at least one specific piece of evidence: a field value, a change ID, an allow-list line. "Probably fine" is not evidence. **Severity is the rule's opinion, not yours.**

## Priorities
- **P1**: active or confirmed compromise. Call the client on-call within 15 minutes, send the note within 30.
- **P2**: likely compromise, not yet confirmed. Note within 1 hour.
- **P3**: needs client IT follow-up but isn't a security incident. Ticket for business hours.
- **P4**: no action. Close.

## Containment authority (Cedar Hollow contract)
For P1 incidents, Ironvale may **revoke sessions** and **disable a user account** without waiting for approval. Password resets, MFA re-enrollment and mailbox changes are done by Cedar Hollow IT.

## Escalation note format
1. **Subject**: [P#] Client: one-line description
2. **Summary**: what happened, in 2-3 sentences a non-specialist can follow
3. **Affected**: users, hosts, mailboxes
4. **Timeline**: UTC and local time, oldest first
5. **Evidence**: alert IDs and the fields that matter
6. **Scope and unknowns**: what we know, what we don't, what could make it worse
7. **Recommended actions**: numbered, most urgent first, with who does each
8. **Ironvale actions**: what we have done and will do
9. **Contact**: soc@ironvale.example, +1 512 555 0190

Client on-call: it-oncall@cedarhollowcu.example, +1 417 555 0142
`;

const starterReadme = `# Triage a night of SIEM alerts: Cedar Hollow CU

Welcome to a night shift at Ironvale. Cedar Hollow Credit Union produced 12 alerts between 18:00 and 08:00 CDT on Tue Oct 20. Your job is to work them like a Tier 1 analyst.

## How to work through the kit
1. Skim \`runbook-triage.md\` first. The verdict names and escalation format come from there.
2. Read \`alerts.json\` (\`jq '.alerts[] | {alert_id, rule_name, severity}' alerts.json\` gives a quick list).
3. For each alert, look for supporting evidence in \`context/\`: the asset inventory, the change calendar and IT's known-good notes. Note the change IDs and lines you rely on.
4. Look across alerts, not just down the list. Same user, same IP, same session and close timestamps all matter.
5. Decide what needs escalating, then write the note.

All timestamps in \`alerts.json\` are UTC. Cedar Hollow is on CDT (UTC-5).

## What to submit
A zip containing:
- \`README.md\`: your summary (what you found, verdict counts, anything you'd flag to the SOC lead)
- A triage table (markdown or CSV): alert ID, verdict, priority, group, evidence
- Your escalation note(s), in the runbook format
- Tuning suggestions for 2-3 rules

Add your approach notes and AI-use disclosure in the submission form.

## Files
- \`alerts.json\`
- \`context/asset-inventory.csv\`
- \`context/change-calendar.md\`
- \`context/known-good.md\`
- \`runbook-triage.md\`
`;

/* ───────────── Strong template ───────────── */

const strongReadme = `# Cedar Hollow CU: night of Oct 20-21 triage

## Bottom line
**One real incident: Dana Whitlock's mailbox was taken over via MFA push fatigue, and the attacker set up a rule forwarding lending mail (wire, payoff, ACH) to an outside address.** Three alerts are the same intrusion: ALR-4105 (push spam), ALR-4106 (sign-in from a hosting provider in NL) and ALR-4108 (forwarding rule). They share source IP 198.51.100.23, and 4106 and 4108 share session s-7f3a91c2e4. I'd call it P1 and phone IT on-call. The escalation note is in \`escalation-CHCU-2026-10-21.md\`.

The Critical alert (ALR-4104, 186 GB outbound) is the weekly full backup to Coldvault, the contracted offsite provider. It's the scariest alert on the board and it's benign.

## Verdict counts
| Verdict | Count | Alerts |
|---|---|---|
| ESCALATE | 3 (one incident) | 4105, 4106, 4108 |
| BENIGN-EXPECTED | 6 | 4102, 4104, 4107, 4109, 4110, 4111 |
| BENIGN-BLOCKED | 2 | 4101, 4112 |
| FALSE-POSITIVE | 1 | 4103 |

ALR-4110 is benign, but it still needs a P3 ticket: the print spooler on CH-PRT01 still has the old svc_printmgmt password (CHG-2290 follow-up REQ-8817) and the account is now locked, so branch printing will fail when branches open at 08:00.

## Order I worked the queue
1. ALR-4104: sanity-check the Critical first (about 4 minutes: signed cvagent.exe, allow-listed IP, Tuesday full backup)
2. ALR-4105, 4106, 4108: the incident (P1)
3. ALR-4107: an admin on a DC, matched to CHG-2291
4. ALR-4110: P3 ticket before branches open
5. The rest, in time order

## Files
- \`triage.md\`: all 12 alerts with verdict, priority, group and evidence
- \`escalation-CHCU-2026-10-21.md\`: the P1 note for Cedar Hollow IT
- \`tuning.md\`: changes for IDP-031, MAIL-017 and IDP-022
- \`iocs.txt\`: indicators for a cross-client hunt

## Flag for the SOC lead
CA-12 (the geo block) is in report-only mode, and the alert says it would have blocked this sign-in. The push approval, not the password, was the last line of defense. Both fixes, number matching and enforcing CA-12, are client decisions, but I'd raise them on the call.
`;

const strongTriage = `# Triage table: Cedar Hollow CU, Oct 20 18:00 to Oct 21 08:00 CDT

Groups: **A** = mailbox takeover of dana.whitlock (one incident). Everything else stands alone.

| Alert | Rule (sev) | Verdict | Pri | Grp | Evidence |
|---|---|---|---|---|---|
| ALR-4101 | Password spray (med) | BENIGN-BLOCKED | P4 | - | 46 failures, 0 successes; 39 of 41 usernames don't exist; the 2 real ones (info@, careers@) have sign-in blocked (known-good); legacy auth denied by CA-07 |
| ALR-4102 | Internal scan (med) | BENIGN-EXPECTED | P4 | - | IT-SCAN01 as svc_vulnscan, started 00:02Z, inside STD-01 (Wed 00:00-04:00 UTC); 0 external destinations |
| ALR-4103 | Impossible travel (med) | FALSE-POSITIVE | P4 | - | 2nd sign-in IP 203.0.113.141 is in the Northgate VPN pool 203.0.113.128/27; VPN session began 00:56:58Z, 42 s before; geo error documented in CHG-2284 (NGE-55120); managed, compliant device |
| ALR-4104 | Large outbound (CRIT) | BENIGN-EXPECTED | P4 | - | CH-BKP01 to 203.0.113.50 (Coldvault, allow-listed), signed cvagent.exe as svc_backup; 00:30Z start matches STD-03 weekly full; 186.4 GB is within the normal 170-200 GB |
| ALR-4105 | MFA push denied (low) | ESCALATE | P1 | A | 14 pushes in 9 min from 198.51.100.23, 13 denied or timed out, then **approved at 02:41:07Z**; correct password before each push, so the password is compromised |
| ALR-4106 | Unfamiliar location (med) | ESCALATE | P1 | A | Success at 02:41:09Z, 2 s after the approval, from the same IP; AS64533 is a hosting provider in NL, first seen for this user; unregistered device; baseline US only; CA-12 report-only "would have blocked"; session s-7f3a91c2e4 |
| ALR-4107 | Encoded PowerShell on DC (high) | BENIGN-EXPECTED | P4 | - | adm.tpark over RDP from CH-MGMT01 at 02:58Z, inside CHG-2291 (02:00-04:30Z); decoded command runs CHPatchTools and logs to CHG-2291.log; only internal connection to 10.20.5.20:8530 |
| ALR-4108 | External forward rule (low) | ESCALATE | P1 | A | Created 02:56:31Z in session s-7f3a91c2e4 from 198.51.100.23; filters on wire/payoff/ACH/invoice/closing, marks read and hides in RSS Subscriptions; destination not on the IT-POL-14 list; 2 messages already forwarded |
| ALR-4109 | Mass software install (med) | BENIGN-EXPECTED | P4 | - | LedgerLink 8.4.2 via svc_swdeploy from CH-MGMT01, first install 04:02Z, inside CHG-2288 (04:00-06:00Z); SHA-256 matches vendor hash in known-good; 61 = teller fleet |
| ALR-4110 | Svc account failures (med) | BENIGN-EXPECTED | P3 | - | Failures began 22:04Z, right after CHG-2290 rotation; only source is the CH-PRT01 spooler, steady 12-min retry; CHG-2290 says the spooler wasn't updated (REQ-8817). Now locked: printing will break at open |
| ALR-4111 | Newly registered domain (low) | BENIGN-EXPECTED | P4 | - | IT-MON01 to holidaysaver-cedarhollow.example (203.0.113.90): Marketing domain registered Oct 12, monitored every 15 min (known-good); only GET / and /status |
| ALR-4112 | PUA (low) | BENIGN-BLOCKED | P4 | - | Toolbar installer quarantined on write, executed: false; user education only, in the morning summary |
`;

const strongEscalation = `Subject: [P1] Cedar Hollow CU: dana.whitlock mailbox taken over via MFA push fatigue; rule forwarding lending mail externally

Priority: P1. Calling IT on-call (+1 417 555 0142); this note follows the call.

## Summary
Between 02:32 and 02:41 UTC (21:32-21:41 CDT, Tue Oct 20) someone with Dana Whitlock's correct password sent her 14 MFA push requests. She denied or ignored 13 and approved the 14th. The attacker signed in to webmail from a hosting provider in the Netherlands and, 15 minutes later, created a hidden inbox rule that forwards any mail mentioning wire, payoff, ACH, invoice or closing to dw.loanfiles@quickpost-mail.example. Two messages had been forwarded by 03:07 UTC.

## Affected
- User: dana.whitlock@cedarhollowcu.example (Senior Loan Processor, HQ Lending)
- Mailbox: same. No alerts on her workstation CH-HQ-WS114; the attacker used an unregistered device.

## Timeline (UTC / CDT)
| UTC | CDT | Event | Alert |
|---|---|---|---|
| 02:32:03 | 21:32 | First of 14 push requests from 198.51.100.23 | ALR-4105 |
| 02:41:07 | 21:41 | Push approved | ALR-4105 |
| 02:41:09 | 21:41 | Webmail sign-in succeeds from 198.51.100.23 (AS64533 Hostwave Cloud, NL); session s-7f3a91c2e4 | ALR-4106 |
| 02:56:31 | 21:56 | Inbox rule "." created in the same session | ALR-4108 |
| 03:07:52 | 22:07 | 2 messages forwarded so far | ALR-4108 |

## Scope and unknowns
- The password is compromised (pushes only follow a correct password). We don't know how it was obtained.
- Unknown: which 2+ messages were forwarded, whether the attacker sent mail as Dana, and whether they accessed files or other mailboxes.
- Risk: payoff and wire threads are what an attacker needs to redirect a loan payoff or send fake wire instructions to members or title companies.

## Recommended actions (most urgent first)
1. **Ironvale, now**: revoke all of Dana's sessions and refresh tokens (contract authority).
2. **Cedar Hollow IT**: reset Dana's password and remove her registered MFA method; re-enroll in person.
3. **Cedar Hollow IT**: delete rule "." and check for other rules, mailbox-level forwarding, delegates and new app consents.
4. **Cedar Hollow IT**: run a message trace for everything sent to quickpost-mail.example since 02:56 UTC and give Lending the list. Call back to verify any wire or payoff instructions sent from Dana's mailbox this week.
5. **Cedar Hollow IT**: block the address dw.loanfiles@quickpost-mail.example and the IP 198.51.100.23. quickpost-mail.example looks like free webmail, so block the address, not the domain.
6. **Follow-up**: enforce CA-12 and turn on number matching for push MFA.

## Ironvale actions
- Hunting 198.51.100.23 and AS64533 sign-ins across the tenant and our other clients.
- Watching Dana's account for 72 hours.

Contact: soc@ironvale.example, +1 512 555 0190
`;

const strongTuning = `# Tuning suggestions

## 1. IDP-031 MFA push denied repeatedly (6 fires in 30 days, rated Low)
Today it fires on denials and ignores the approval at the end, which is the part that matters. Proposal:
- **High** when any push is approved within 15 minutes of 3 or more denials or timeouts.
- Auto-correlate with IDP-009 for the same user within 5 minutes and open as **P1**.
- Client side: turn on number matching, which makes push-spam approvals much harder.

## 2. MAIL-017 external forwarding rule (41 fires in 30 days, rated Low)
Most fires are the three IT-POL-14 rules being re-saved (the board portal sync re-saves rule 1 several times a week). Proposal:
- Suppress the three approved mailbox + destination pairs.
- Raise to **High** when the rule is created from an IP or session with a risky sign-in in the last 24 hours, or when the rule also hides mail (mark as read, move to a rarely used folder).
That should cut the noise by roughly 90% and would have made ALR-4108 stand out.

## 3. IDP-022 impossible travel (23 fires in 30 days, 19 since Oct 19)
The jump comes from CHG-2284: the new Northgate egress 203.0.113.128/27 geolocates to Dallas. Proposal:
- Add 203.0.113.128/27 as a named corporate location until NGE-55120 corrects the geo data, then review.
- Don't suppress the user; suppress only the "second sign-in from corporate VPN pool" case.

## Not tuned, on purpose
EDR-112 (encoded PowerShell, 14 fires) is noisy because of CHPatchTools, but I'd keep it. Suppressing encoded PowerShell on DCs is exactly the gap an attacker would want. Instead, add a note linking adm.* activity inside an approved CHG window, so it can be closed in under a minute.
`;

const strongIocs = `# IOCs: Cedar Hollow CU incident, 2026-10-21 (for cross-client hunt)
ip        198.51.100.23        attacker sign-in, push requests and rule creation (AS64533 Hostwave Cloud, NL)
email     dw.loanfiles@quickpost-mail.example   forwarding destination
session   s-7f3a91c2e4         attacker webmail session
rule      name "."             inbox rule; folder "RSS Subscriptions"; keywords wire, payoff, ACH, invoice, closing
`;

/* ───────────── Solid template ───────────── */

const solidReadme = `# Cedar Hollow CU alert triage, Oct 20-21

## Summary
I triaged all 12 alerts. The main finding is a **suspicious sign-in for dana.whitlock from the Netherlands** (ALR-4106) through a hosting provider, after she approved an MFA push. I escalated it as P2 and recommended a password reset and session revoke.

ALR-4105 (repeated MFA pushes for the same user) is also escalated, as a separate low-priority note: the user should be reminded not to approve pushes she didn't start.

The Critical alert (ALR-4104, 186 GB outbound) is the weekly full backup to Coldvault Offsite. The destination IP and process are on the known-good list and the timing matches STD-03.

## Verdicts
- ESCALATE: 4105, 4106
- BENIGN-EXPECTED: 4102, 4104, 4107, 4108, 4109, 4111
- BENIGN-BLOCKED: 4101, 4112
- FALSE-POSITIVE: 4103, 4110

## How I worked
I sorted by severity, took the Critical and High alerts first, then matched each one against the change calendar and known-good notes. Most of the night lines up with planned work: the vulnerability scan, DC patching, the LedgerLink rollout and the backup.

## Notes
- MAIL-017 fires 41 times a month, so I treated the forwarding-rule alert as routine noise. It's worth tuning.
- IDP-022 (impossible travel) is noisy since the VPN change on Oct 19.

## Files
- \`triage.md\`: verdict and evidence per alert
- \`escalation-dana-whitlock.md\`: P2 note
- \`escalation-mfa-pushes.md\`: P3 note about MFA awareness
`;

const solidTriage = `# Triage

| Alert | Rule | Severity | Verdict | Priority | Evidence |
|---|---|---|---|---|---|
| ALR-4104 | Large outbound transfer | critical | BENIGN-EXPECTED | P4 | Coldvault 203.0.113.50 is allow-listed; cvagent.exe signed; matches STD-03 weekly full |
| ALR-4107 | Encoded PowerShell | high | BENIGN-EXPECTED | P4 | adm.tpark during CHG-2291; decoded command is CHPatchTools |
| ALR-4101 | Password spray | medium | BENIGN-BLOCKED | P4 | 0 successes; blocked by CA-07 |
| ALR-4102 | Internal scan | medium | BENIGN-EXPECTED | P4 | IT-SCAN01 during STD-01 |
| ALR-4103 | Impossible travel | medium | FALSE-POSITIVE | P4 | 203.0.113.141 is in the new VPN pool (CHG-2284) |
| ALR-4106 | Unfamiliar location | medium | ESCALATE | P2 | dana.whitlock signed in from NL hosting ASN, unregistered device, never seen before |
| ALR-4109 | Mass install | medium | BENIGN-EXPECTED | P4 | CHG-2288, hash matches vendor |
| ALR-4110 | Service account failures | medium | FALSE-POSITIVE | P4 | Service accounts lock out sometimes; internal host only |
| ALR-4105 | MFA pushes denied | low | ESCALATE | P3 | 14 pushes, user denied most of them; user awareness |
| ALR-4108 | External forward rule | low | BENIGN-EXPECTED | P4 | MAIL-017 fires 41 times in 30 days; users commonly forward mail |
| ALR-4111 | New domain | low | BENIGN-EXPECTED | P4 | Marketing campaign site, IT-MON01 checks it |
| ALR-4112 | PUA | low | BENIGN-BLOCKED | P4 | Quarantined, not executed |
`;

const solidEscalation = `Subject: [P2] Cedar Hollow CU: suspicious sign-in for dana.whitlock

## Summary
dana.whitlock signed in to webmail at 02:41 UTC (21:41 CDT) from 198.51.100.23, a hosting provider (AS64533) in the Netherlands. MFA was approved on her phone. She has only signed in from the US in the last 30 days.

## Affected
dana.whitlock@cedarhollowcu.example

## Timeline
- 02:41:09 UTC: successful sign-in from 198.51.100.23 (ALR-4106)

## Evidence
ALR-4106: first-seen ASN, unregistered device, CA-12 report-only would have blocked.

## Scope and unknowns
We don't know if the user approved the push by mistake or if the account is compromised.

## Recommended actions
1. Revoke Dana's sessions.
2. Reset her password.
3. Confirm with Dana whether she was traveling.
4. Consider enforcing CA-12.

Contact: soc@ironvale.example
`;

const solidMfaNote = `Subject: [P3] Cedar Hollow CU: repeated MFA push requests for dana.whitlock

ALR-4105: between 02:32 and 02:41 UTC Dana received 14 push requests from 198.51.100.23 and denied 9 of them. Recommend reminding her to deny pushes she didn't start and to report them to IT. Consider number matching for push MFA.

Contact: soc@ironvale.example
`;

/* ───────────── Weak template ───────────── */

const weakReadme = `# SIEM triage: Cedar Hollow

## Summary
The biggest problem last night was **ALR-4104: 186 GB of data sent from the backup server to an external IP**. This is Critical and looks like data exfiltration, possibly before ransomware. I escalated it as P1 and recommend isolating CH-BKP01 right away.

I also escalated ALR-4107 (encoded PowerShell on a domain controller) as P1. Encoded commands with ExecutionPolicy Bypass are a common attacker technique, and it was on a DC at night.

The Dana Whitlock alerts look like user error. She got a lot of MFA prompts and accidentally approved one, and she was probably on a VPN or traveling, which explains the Netherlands location. The forwarding rule is probably her forwarding work mail to her personal email so she can read it on her phone. I closed those.

## Verdicts
- Escalate: 4104, 4107
- Closed: everything else

## Files
- \`triage.txt\`
- \`escalation.md\`
`;

const weakTriage = `ALR-4101  password spray       closed - blocked
ALR-4102  internal scan        closed - IT scanner
ALR-4103  impossible travel    closed - VPN
ALR-4104  large outbound       ESCALATE P1 - 186 GB to external IP, possible exfiltration
ALR-4105  MFA denied           closed - user error, kept tapping
ALR-4106  unfamiliar location  closed - user traveling or on VPN
ALR-4107  encoded powershell   ESCALATE P1 - suspicious on domain controller
ALR-4108  forward rule         closed - user forwarding to personal mail
ALR-4109  software install     closed - update
ALR-4110  service account      closed - false positive
ALR-4111  new domain           closed - false positive
ALR-4112  PUA                  closed - quarantined
`;

const weakEscalation = `Subject: [P1] URGENT: Possible data exfiltration and ransomware at Cedar Hollow

We detected 186 GB of data leaving CH-BKP01 to 203.0.113.50 overnight. This could be an attacker stealing member data before deploying ransomware. We also saw encoded PowerShell with ExecutionPolicy Bypass on CH-DC02 run by adm.tpark.

Recommended actions:
1. Isolate CH-BKP01 from the network immediately.
2. Disable adm.tpark and reset the password.
3. Block 203.0.113.50 at the firewall.
4. Check the domain controllers for other signs of compromise.

Contact: soc@ironvale.example
`;

const mod: ChallengeModule = {
  challenge: {
    id: 'ch_soc_triage',
    kind: 'live',
    companyId: 'co_ironvale',
    title: 'Triage a night of SIEM alerts',
    summary: 'Work 12 overnight alerts, clear false positives and escalate the one real incident.',
    type: 'security',
    skills: ['Alert triage', 'SIEM', 'Identity & MFA', 'Log correlation', 'Incident escalation', 'Detection tuning'],
    classroomConcepts: [
      { concept: 'Base rates and false-positive rates in intrusion detection', course: 'Network Security' },
      { concept: 'Authentication factors and MFA attacks', course: 'Computer Security' },
      { concept: 'Building a timeline from correlated log events', course: 'Digital Forensics' },
      { concept: 'Incident response lifecycle and escalation', course: 'Information Security Management' },
    ],
    difficulty: 'intermediate',
    estHours: 3,
    brief,
    deliverables: [
      'Triage table: verdict, priority, group and evidence for all 12 alerts',
      'Escalation note to the client in the runbook format',
      'Tuning suggestions for 2–3 noisy rules',
      'README summarizing what you found and the order you worked the queue',
    ],
    rubric: [
      { id: 'detection', name: 'Finds the real incident', description: 'Identifies the single true incident and ties every related alert together through shared user, IP, session and timing.', weight: 30 },
      { id: 'fp_handling', name: 'False-positive handling', description: 'Every benign alert is closed with a specific citation from the alert fields, change calendar or allow-list, including the high-severity decoy.', weight: 25 },
      { id: 'escalation', name: 'Escalation note', description: 'A client-ready note in the runbook format with a clear timeline, scope and unknowns, and ordered containment steps with an owner for each.', weight: 20 },
      { id: 'prioritization', name: 'Prioritization', description: 'Works the queue in a defensible order and assigns P1–P4 by impact, not by the rule severity label.', weight: 10 },
      { id: 'communication', name: 'Communication', description: 'Concise, scannable writing a SOC lead or client can act on at 3 a.m. without asking follow-up questions.', weight: 15 },
    ],
    applicantCap: 35,
    status: 'open',
    hiringFor: 'SOC Analyst I · Full-time · Remote (US)',
    starterFiles: [
      { path: 'README.md', content: starterReadme },
      { path: 'alerts.json', content: alertsJson },
      { path: 'context/asset-inventory.csv', content: assetInventoryCsv },
      { path: 'context/change-calendar.md', content: changeCalendarMd },
      { path: 'context/known-good.md', content: knownGoodMd },
      { path: 'runbook-triage.md', content: runbookMd },
    ],
    aiHints: {
      testing:
        'Whether you can tell the severity label apart from the actual risk. The real incident here is spread across low- and medium-severity alerts, and the Critical one is noise. It also tests whether every verdict rests on evidence you can point to, which is what makes a Tier 1 analyst trustworthy on a night shift.',
      steps: [
        'Read the runbook so you know the four verdicts, the priorities and the escalation format before you open the alerts.',
        'List all 12 alerts with user, host, IP and time, then sort them by entity as well as by time. Repeated users, IPs or session IDs are the thread to pull.',
        'For each alert, look for a matching change ID, standing job or allow-list line in context/ and write down the exact reference.',
        'Rebuild the timeline for anything left unexplained and decide what the attacker achieved and what they could do next.',
        'Write the escalation note in the runbook format: containment first, an owner for each step, and honest unknowns.',
        'Use rule_fires_last_30d to choose 2–3 rules to tune, and explain how each change would have made the real incident easier to see.',
      ],
      greatLooksLike:
        'A great submission links the MFA push alert, the unfamiliar sign-in and the forwarding rule into one incident using the shared IP and session ID, and notices that the push was finally approved. It closes the Critical backup alert in a few lines using the Coldvault allow-list entry and the weekly full-backup schedule. The escalation note leads with revoking sessions, resetting credentials and MFA, removing the rule and tracing what was forwarded, and it explains why payoff and wire mail matter at a credit union.',
      pitfalls: [
        'Trusting the severity label: escalating the Critical transfer or the High PowerShell alert without checking the change calendar and allow-list.',
        'Triaging alerts one at a time and missing that three of them share a user, an IP and a session.',
        'Calling an approved push after 13 denials "user error" instead of evidence that the password is compromised.',
        'Treating the forwarding rule as routine because its rule is noisy, without reading its conditions and actions.',
        'Closing benign alerts with "probably fine" or "false positive" and no citation, especially the service-account lockout, which still needs a ticket.',
      ],
    },
    deadlineInDays: 3,
    createdDaysAgo: 11,
    seed: { participants: 22, submissions: 11, scored: 6 },
  },
  templates: [
    {
      quality: 'strong',
      notes: `### What I built
A full triage of all 12 alerts (\`triage.md\`) with a verdict, priority and specific evidence for each, a P1 escalation note for Cedar Hollow IT, tuning proposals for three rules, and a short IOC list for a cross-client hunt.

### Key decisions & trade-offs
- I sanity-checked the Critical backup alert first, because ignoring a Critical without looking is how you miss the one that's real. It took about four minutes to clear with the allow-list entry and the STD-03 schedule, and then I moved on.
- I grouped ALR-4105, 4106 and 4108 into one incident because they share 198.51.100.23, and 4106 and 4108 share session s-7f3a91c2e4. The approval at 02:41:07 followed by a sign-in two seconds later is the pivot.
- I marked the service-account lockout benign but P3, not P4: it's not a security issue, but branch printing breaks at 08:00 if nobody fixes the spooler.
- I chose not to tune EDR-112 even though it's noisy, because suppressing encoded PowerShell on DCs is a blind spot.

### What I'd do with more time
Pull the message trace to see exactly which two messages were forwarded, and check sign-in logs for other users targeted from AS64533.`,
      files: [
        { path: 'README.md', content: strongReadme },
        { path: 'triage.md', content: strongTriage },
        { path: 'escalation-CHCU-2026-10-21.md', content: strongEscalation },
        { path: 'tuning.md', content: strongTuning },
        { path: 'iocs.txt', content: strongIocs },
      ],
      feedback:
        "This is the triage we'd want from a Tier 1 analyst on night one. You tied ALR-4105, 4106 and 4108 together through the shared IP and session, caught that the push was finally approved, and read the rule's keywords as a payoff and wire-fraud risk. Every dismissal cites a change ID or allow-list line, and keeping the service-account lockout as a P3 ticket shows good judgment. The escalation note is complete; next time, put the containment steps above the timeline so the on-call reads them first.",
      aiDisclosure:
        'Used an AI assistant to decode the base64 PowerShell command and to check my timeline table for UTC/CDT conversion mistakes. All verdicts and evidence are my own.',
    },
    {
      quality: 'solid',
      notes: `### What I built
A triage table covering all 12 alerts, a P2 escalation for the suspicious Netherlands sign-in on dana.whitlock's account, and a separate P3 note about the MFA push requests.

### Key decisions & trade-offs
- I sorted by severity and took the Critical and High alerts first. Both turned out to be planned work: the weekly full backup to Coldvault and DC patching under CHG-2291.
- I escalated the sign-in as P2 rather than P1 because I couldn't confirm the account was compromised. The user might have approved the push by mistake, so I asked IT to check with her.
- The forwarding rule alert comes from a rule that fires 41 times a month, so I treated it as noise and flagged MAIL-017 for tuning.
- I kept the MFA alert as its own ticket so the user-awareness piece doesn't get lost.

### What I'd do with more time
Go back through the low-severity alerts more carefully, and write proper tuning proposals for MAIL-017 and IDP-022 with thresholds.`,
      files: [
        { path: 'README.md', content: solidReadme },
        { path: 'triage.md', content: solidTriage },
        { path: 'escalation-dana-whitlock.md', content: solidEscalation },
        { path: 'escalation-mfa-pushes.md', content: solidMfaNote },
      ],
      feedback:
        "You found the right account and cleared the Critical backup and High PowerShell alerts with the right evidence, which a lot of people miss. The gap is correlation: ALR-4105, 4106 and 4108 share 198.51.100.23 and a session ID, and the forwarding rule (hidden, keyed on wire and payoff, created by the attacker's session) is the most damaging part of the incident, but it was closed as noise. Without it, your escalation note doesn't ask IT to remove the rule or trace what was forwarded. Also, ALR-4110 needed the CHG-2290 citation; \"service accounts lock out sometimes\" isn't evidence.",
      aiDisclosure: 'Asked an AI tool to explain what the CA-12 "report-only" field meant. Did the triage myself.',
    },
    {
      quality: 'weak',
      notes: `### What I built
A triage list of the 12 alerts and an urgent escalation for the possible data exfiltration from the backup server and the encoded PowerShell on the domain controller.

### Key decisions & trade-offs
- I focused on the Critical and High alerts because those are the most dangerous. 186 GB leaving the network at night is a classic exfiltration sign, and encoded PowerShell with ExecutionPolicy Bypass is a common attacker technique.
- I recommended isolating the backup server, because stopping data loss matters more than avoiding downtime.
- The Dana Whitlock alerts were low and medium severity and looked like user error: too many MFA prompts, one accidental approval, probably a VPN.

### What I'd do with more time
Look at the low-severity alerts in more depth and check the context files more closely.`,
      files: [
        { path: 'README.md', content: weakReadme },
        { path: 'triage.txt', content: weakTriage },
        { path: 'escalation.md', content: weakEscalation },
      ],
      feedback:
        "Thanks for submitting. The escalation went to the two alerts that were planned work: ALR-4104 is the weekly full backup to Coldvault, which is on the known-good list, and ALR-4107 matches CHG-2291 line for line, so the note would have had the client isolate its backup server and lock out its own admin. Meanwhile the real incident, an approved push after 13 denials, a sign-in from a hosting provider and a hidden rule forwarding payoff mail, was closed as user error. The habit to build is checking every alert against the change calendar and allow-list before deciding, whatever its severity.",
      aiDisclosure: 'None.',
    },
  ],
  scripted: [
    {
      challengeId: 'ch_soc_triage',
      studentId: 'stu_zara',
      scores: { detection: 5, fp_handling: 5, escalation: 4, prioritization: 5, communication: 4 },
      feedback:
        "This is the triage I'd hand a new hire as the example. You tied ALR-4105, 4106 and 4108 together through 198.51.100.23 and session s-7f3a91c2e4, and you read the rule's wire and payoff keywords as the fraud risk they are at a credit union. Every dismissal cites a change ID or allow-list line, and checking the Critical backup first, then moving on in minutes, is exactly how we want the queue worked. Two things held back the last points: the escalation note puts the timeline before the containment steps, which is the wrong order for a 3 a.m. phone read, and some triage-table evidence cells run long enough to slow down a handoff.",
      templateIndex: 0,
      submittedDaysAgo: 3,
    },
  ],
};

export default mod;
