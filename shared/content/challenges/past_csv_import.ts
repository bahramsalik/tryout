import type { ChallengeModule } from '../lib.ts';

const brief = `## Context

Shippers book freight in bulk by uploading a CSV to the Orbitline portal: about 140 uploads a quarter, some with 2,000 rows. Today the importer quietly skips any row it can't insert. The shipper assumes everything was booked, the freight never gets a pickup, and our Customer Experience team finds out when the shipper calls. Ops spends about 6 hours a week matching skipped rows to spreadsheets and emailing shippers about fixes.

We want problems caught before import, in words an ops person can paste into an email.

## The task

Build a validator for shipment CSVs that follows \`docs/import-rules.md\`:

- Parse the CSV properly. Quoted fields can contain commas and quotes.
- Check every rule: required fields, tracking number format and duplicates, carrier codes (including inactive carriers), service levels, dates, ZIP codes, weight and piece counts.
- Report each problem with its spreadsheet row number, column, value, what's wrong and how to fix it. Keep errors and warnings apart.
- Produce both readable output and JSON.
- Write tests for the rules, run the validator on \`data/shipments_sample.csv\` and include the output.

The sample has 14 problems (13 errors and 1 warning). Some rows look odd but are valid, and flagging a valid row costs ops as much time as missing a bad one.

## Constraints

- Time box: about 4 hours.
- Node.js or TypeScript preferred; Python is fine. Use a CSV library or write a parser, but explain your choice.
- Out of scope: the upload UI, database writes, automatic fixes beyond trimming spaces, and checking that a ZIP code really exists.
- AI assistants are allowed if you say how you used them.

## What we provide

- \`data/shipments_sample.csv\`: 60 shipments from one shipper, with planted problems
- \`data/carriers.json\`: accepted carrier codes and their status
- \`docs/import-rules.md\`: the validation rules and what ops needs from a message
- \`README.md\`: background and what we expect`;

const starterReadme = `# Shipment import validator: starter kit

Shippers book freight in bulk by uploading a CSV to the Orbitline portal. Today the importer
quietly skips any row it can't insert. The shipper thinks everything was booked, the freight
doesn't get picked up, and our Customer Experience team spends hours finding and fixing rows
by hand. Last quarter that was about 6 hours a week across 140 bulk uploads.

You're building the validator that runs **before** import and tells a person, row by row
and field by field, what is wrong and how to fix it.

## What's here

| Path | What it is |
|---|---|
| \`data/shipments_sample.csv\` | A real-shaped upload: 60 shipments from one shipper, Halvorsen Supply. Some rows have problems. |
| \`data/carriers.json\` | Carrier codes we accept. One carrier is inactive. |
| \`docs/import-rules.md\` | The rules, agreed between Carrier Integrations and ops. **This is the spec.** |

## What we expect

- A CLI or a function (Node.js or TypeScript preferred, Python is fine) that takes a CSV and
  reports every problem with its **spreadsheet row number**, the column, the value and a fix.
- Errors (the row can't be booked) and warnings (we can auto-fix it) kept apart.
- Machine-readable output too (JSON), so the portal can show the results later.
- Tests for the rules.

Run your validator on \`data/shipments_sample.csv\` and include the output in your submission.
We know what's in the file: there are 14 problems (13 errors and 1 warning), and some rows that
look odd are valid. A validator that flags a valid row costs ops as much time as one that misses
a bad row.

## Not in scope

Writing to a database, the upload UI, fixing rows automatically (beyond trimming spaces),
and looking up whether ZIP codes really exist.
`;

const shipmentsSampleCsv = `shipment_ref,tracking_number,carrier_code,service_level,ship_date,delivery_date,origin_zip,dest_zip,weight_lb,pieces,consignee_name,notes
HS-11040,OLX-48302119,DFML,STANDARD,2026-10-05,2026-10-07,53204,60120,2842.9,7,Brightwater Pumps,Dock hours 7 AM-3 PM
HS-11041,OLX-48302124,PRLN,STANDARD,2026-10-05,2026-10-07,53204,46204,3713.7,12,Osgood Electrical,Inside delivery
HS-11042,OLX-48302155,PRLN,EXPEDITED,2026-10-05,2026-10-06,60638,46204,2888.7,8,Fennimore Hardware,
HS-11043,OLX-48302185,TRVC,EXPEDITED,2026-10-05,2026-10-07,53204,60607,1931.6,11,Fennimore Hardware,Appointment required
HS-11044,OLX-48302198,TRVC,STANDARD,2026-10-05,2026-10-07,53204,,2248,10,Millbrook Restaurant Supply,
HS-11045,OLX-48302222,DFML,STANDARD,2026-10-05,2026-10-09,53204,43215,2155.9,8,Quarry Lane Ceramics,
HS-11046,OLX-48302243,CLMX,STANDARD,2026-10-05,2026-10-08,53204,52401,725.7,6,"Halvorsen Supply, Inc.",Inside delivery
HS-11047,OLX-48302265,CLMX,EXPEDITED,2026-10-05,10/07/2026,53204,53703,3745,12,Quarry Lane Ceramics,
HS-11048,OLX-48302299,DFML,EXPEDITED,2026-10-05,2026-10-06,53204,43215,974.8,4,Northgate Office Interiors,
HS-11049,OLX-48302318,LKSF,TIME_CRITICAL,2026-10-05,2026-10-06,60638,46802,877.6,4,Quarry Lane Ceramics,Inside delivery
HS-11050,OLX-48302345,PRLN,STANDARD,2026-10-05,2026-10-07,53204,63103,500,6,Osgood Electrical,
HS-11051,OLX-48302367,TRVC,STANDARD,2026-10-05,2026-10-08,53204,55401,-40,11,Copperfield Farm Co-op,Residential delivery
HS-11052,OLX-48302386,TRVC,STANDARD,2026-10-06,2026-10-10,53204,49503,3954.6,10,Ashby Plumbing Wholesale,
HS-11053,OLX-48302402,PRLN,EXPEDITED,2026-10-06,2026-10-08,53204,60607,1039.4,11,Tanager Builders,Inside delivery
HS-11054,OLX-48302425,DFML,STANDARD,2026-10-06,2026-10-09,53204,60120,1618.9,4,Quarry Lane Ceramics,Appointment required
HS-11055,OLX-48302451,PRLX,STANDARD,2026-10-06,2026-10-10,53204,54601,910.4,5,Northgate Office Interiors,Appointment required
HS-11056,OLX-48302476,TRVC,STANDARD,2026-10-06,2026-10-09,53204,49503,3601.2,12,Fennimore Hardware,Appointment required
HS-11057,OLX-48302508,CLMX,EXPEDITED,2026-10-06,2026-10-08,53204,54601,342.3,1,Fennimore Hardware,Inside delivery
HS-11058,OLX-48302515,DFML,STANDARD,2026-10-06,2026-10-08,60638,2134,135.3,3,Copperfield Farm Co-op,Inside delivery
HS-11059,OLX-48302540,CLMX,STANDARD,2026-10-06,2026-10-08,53204,50309,909.6,3,Fennimore Hardware,Inside delivery
HS-11060,OLX-48302565,LKSF,STANDARD,2026-10-06,2026-10-10,53204,63103,622.9,2,Brightwater Pumps,"Call ahead, dock 4 closes at 3 PM"
HS-11061,OLX-48302584,TRVC,STANDARD,2026-10-06,2026-10-08,53204,48103,750.1,6,Northgate Office Interiors,
HS-11062,OLX-48302318,LKSF,STANDARD,2026-10-06,2026-10-10,53204,52401,3063.3,9,Ashby Plumbing Wholesale,
HS-11063,OLX-48302631,PRLN,EXPEDITED,2026-10-06,2026-10-08,53204,55401,294.9,1,Millbrook Restaurant Supply,Inside delivery
HS-11064,OLX-48302654,DFML,STANDARD,2026-10-07,2026-10-11,53204,61602,2450.7,7,Osgood Electrical,Appointment required
HS-11065,OLX-48302693,CLMX,EXPEDITED,2026-10-07,2026-10-09,60638,47905,1656,4,Kestrel Auto Parts,Liftgate required
HS-11066,OLX-48302710,LKSF,OVERNIGHT,2026-10-07,2026-10-11,60638,60607,379.7,1,Kestrel Auto Parts,
HS-11067,OLX-48302722,PRLN,STANDARD,2026-10-07,2026-10-09,53204,63103,2471.8,7,Prairie Rose Garden Center,Dock hours 7 AM-3 PM
HS-11068,OLX-48302754,LKSF,STANDARD,2026-10-07,2026-10-11,53204,61602,545.3,7,Northgate Office Interiors,
HS-11069,OLX-48302777,TRVC,STANDARD,2026-10-07,2026-10-05,53204,49503,1613.6,4,Osgood Electrical,Dock hours 7 AM-3 PM
HS-11070,OLX-48302793,CLMX,STANDARD,2026-10-07,2026-10-11,60638,53703,96.2,2,Quarry Lane Ceramics,Residential delivery
HS-11071,OLX-48302821,LKSF,EXPEDITED,2026-10-07,2026-10-09,53204,46802,3159.5,10,"Bart ""Big B"" Lumber",Appointment required
HS-11072,OLX-48302853,TRVC,STANDARD,2026-10-07,2026-10-09,53204,43215,173.4,1,Prairie Rose Garden Center,Inside delivery
HS-11073,OLX-48302872,LKSF ,STANDARD,2026-10-07,2026-10-09,53204,47905,277.9,2,Lindqvist Tool & Die,Dock hours 7 AM-3 PM
HS-11074,OLX-48302895,CLMX,TIME_CRITICAL,2026-10-07,2026-10-08,60638,53703,2071.4,8,Prairie Rose Garden Center,Liftgate required
HS-11075,OLX-48302922,TRVC,STANDARD,2026-10-07,2026-10-09,53204,48103,3664.8,12,Northgate Office Interiors,Dock hours 7 AM-3 PM
HS-11076,OLX-48302938,NWTR,EXPEDITED,2026-10-08,2026-10-09,60638,60607,682.4,12,Copperfield Farm Co-op,Appointment required
HS-11077,OLX-48302962,DFML,TIME_CRITICAL,2026-10-08,2026-10-09,53204,48103,475.6,2,Copperfield Farm Co-op,
HS-11078,OLX-48302976,TRVC,EXPEDITED,2026-10-08,2026-10-09,53204,60611-3402,780.5,2,Osgood Electrical,
HS-11079,OLX-48303006,PRLN,TIME_CRITICAL,2026-10-08,2026-10-09,53204,46204,224.1,3,Ashby Plumbing Wholesale,
HS-11080,OLX-48303033,LKSF,TIME_CRITICAL,2026-09-31,2026-10-02,53204,63103,932.3,8,Fennimore Hardware,Appointment required
HS-11081,OLX-48303056,CLMX,STANDARD,2026-10-08,2026-10-11,53204,55401,895.1,11,Fennimore Hardware,
HS-11082,OLX-48303075,LKSF,STANDARD,2026-10-08,2026-10-11,60638,48103,347.9,2,Fennimore Hardware,Dock hours 7 AM-3 PM
HS-11083,OLX-48303105,LKSF,EXPEDITED,2026-10-08,2026-10-09,53204,60120,2564.4,6,Ashby Plumbing Wholesale,Residential delivery
HS-11084,OLX-48303125,PRLN,EXPEDITED,2026-10-08,2026-10-10,60638,48103,1675,9,Osgood Electrical,Dock hours 7 AM-3 PM
HS-11085,olx-48302402,DFML,STANDARD,2026-10-08,2026-10-10,53204,46802,1591.9,4,Tanager Builders,Inside delivery
HS-11086,OLX-48303176,CLMX,EXPEDITED,2026-10-08,2026-10-09,53204,46204,305.1,2,Prairie Rose Garden Center,Dock hours 7 AM-3 PM
HS-11087,OLX-48303186,TRVC,STANDARD,2026-10-08,2026-10-11,53204,63103,402.8,10,Quarry Lane Ceramics,Liftgate required
HS-11088,OLX-48303210,LKSF,STANDARD,2026-10-09,2026-10-13,53204,60607,1863.1,12,Brightwater Pumps,
HS-11089,OLX-48303238,LKSF,EXPEDITED,2026-10-09,2026-10-10,53204,47905,182000,2,Lindqvist Tool & Die,
HS-11090,OLX-48303263,DFML,EXPEDITED,2026-10-09,2026-10-11,53204,60607,407.6,8,Copperfield Farm Co-op,
HS-11091,OLX-48303291,TRVC,TIME_CRITICAL,2026-10-09,2026-10-10,53204,53703,463.9,4,Northgate Office Interiors,Dock hours 7 AM-3 PM
HS-11092,OLX-48303306,PRLN,EXPEDITED,2026-10-09,2026-10-11,53204,43215,3501,8,Brightwater Pumps,
HS-11093,OLX-48303333,DFML,EXPEDITED,2026-10-09,2026-10-10,53204,46204,3426.2,0,Ashby Plumbing Wholesale,
HS-11094,OLX-48303358,TRVC,STANDARD,2026-10-09,2026-10-11,53204,48103,513,4,Brightwater Pumps,Residential delivery
HS-11095,OLX-48303376,LKSF,STANDARD,2026-10-09,2026-10-13,53204,49503,901.6,5,Brightwater Pumps,Residential delivery
HS-11096,OLX-48303397,PRLN,STANDARD,2026-10-09,2026-10-11,53204,43215,941.4,5,"Ostrowski, Lane & Daughters Hardware",Inside delivery
HS-11097,OLX-48303429,LKSF,EXPEDITED,2026-10-09,2026-10-10,53204,52401,1043.9,4,Lindqvist Tool & Die,
HS-11098,OLX-48303449,DFML,STANDARD,2026-10-09,2026-10-13,60638,55401,977.3,4,Copperfield Farm Co-op,Dock hours 7 AM-3 PM
HS-11099,OLX-48303475,PRLN,TIME_CRITICAL,2026-10-09,2026-10-10,53204,63103,566.3,9,Fennimore Hardware,
`;

const carriersJson = `[
  { "code": "LKSF", "name": "Lakeshore Freight Co", "active": true },
  { "code": "PRLN", "name": "Prairie Line Carriers", "active": true },
  { "code": "CLMX", "name": "Calumet Express", "active": true },
  { "code": "DFML", "name": "Driftless Motor Lines", "active": true },
  { "code": "TRVC", "name": "Tri-Rivers Cartage", "active": true },
  { "code": "NWTR", "name": "Northwoods Transit", "active": false, "inactiveReason": "Suspended 2026-09-15: insurance certificate expired" }
]
`;

const importRulesMd = `# Bulk shipment import: validation rules

Owner: Carrier Integrations · Reviewed with Customer Experience (ops) · v1.3, 2026-09-29

Shippers book shipments in bulk by uploading a CSV in the Orbitline portal. Today the
importer skips any row it can't insert and never says why. These are the rules the
validator must enforce before anything reaches the booking service.

## File format

- UTF-8, comma-separated, first line is the header. Column order may vary; names may not.
- Fields follow RFC 4180: a field containing a comma, a double quote or a line break is wrapped
  in double quotes, and a double quote inside it is written twice (\`"Bart ""Big B"" Lumber"\`).
- A file that is empty, or has a header and no data rows, is rejected with a file-level error.
- A header missing any required column is rejected with a file-level error that names the column.
- **Row numbers in messages are spreadsheet row numbers**: the header is row 1, the first
  shipment is row 2. Ops opens these files in a spreadsheet, so they must match.

## Columns

| Column | Required | Rule |
|---|---|---|
| \`shipment_ref\` | yes | Shipper's own reference, free text |
| \`tracking_number\` | yes | \`OLX-\` followed by 8 digits. Case-insensitive. Unique within the file. |
| \`carrier_code\` | yes | A code in \`data/carriers.json\` whose carrier is \`active\` |
| \`service_level\` | yes | One of \`STANDARD\`, \`EXPEDITED\`, \`TIME_CRITICAL\` |
| \`ship_date\` | yes | ISO date \`YYYY-MM-DD\`, and a real calendar date |
| \`delivery_date\` | yes | ISO date \`YYYY-MM-DD\`, on or after \`ship_date\` |
| \`origin_zip\`, \`dest_zip\` | yes | US ZIP: 5 digits, or ZIP+4 (\`60611-3402\`) |
| \`weight_lb\` | yes | Number greater than 0 and at most 45,000 (one full trailer) |
| \`pieces\` | yes | Whole number from 1 to 999 |
| \`consignee_name\` | yes | Free text |
| \`notes\` | no | Free text |

## Duplicates

Two rows with the same tracking number book the same freight twice, and the carrier bills
for both. Compare tracking numbers **after trimming spaces and ignoring case**: \`olx-48302402\`
and \`OLX-48302402\` are the same shipment. Report the later row and name the earlier one.

## Whitespace

Leading or trailing spaces in a value are a **warning**, not an error. The importer trims
them, so validate the trimmed value, but tell the shipper so their export gets fixed.

## Errors vs warnings

- **Error:** the row cannot be booked. Every error in a row should be reported, not just the first.
- **Warning:** the row can be booked after an automatic fix.

## What ops needs from a message

Ops (Customer Experience) forwards these reports to shippers, many of whom are not technical.
A good message says the row, the column, the value found, what is wrong, and how to fix it:

> Row 20, dest_zip: "2134" is not a valid ZIP code. ZIPs have 5 digits; if this is a
> New England ZIP, the spreadsheet may have dropped a leading zero (did you mean "02134"?).

Ops would also like a summary by rule (for example "3 rows: unknown carrier code") that they
can paste into an email to the shipper.
`;

const strongNotes = `### What I built

A zero-dependency Node.js validator: an RFC 4180 parser, one function per rule, and a CLI with readable and \`--json\` output. On the sample it finds all 14 problems (13 errors, 1 warning) and flags none of the valid rows. There are 10 tests, including one that checks the exact list of problems in the sample file.

### Key decisions & trade-offs

- **Parsing first.** Five rows in the sample have quoted commas, doubled quotes or ZIP+4, so I wrote and tested the parser before any rule. \`split(',')\` would have flagged three valid rows.
- **Every problem in a row, not just the first.** Ops fixes a row once, so they need the full list.
- **Specific hints.** A 4-digit ZIP gets "did you mean 02134?", a US-style date gets the ISO version, and an inactive carrier shows its suspension reason from \`carriers.json\`.
- **Duplicates** are compared after trimming and uppercasing, as the rules say, and each message names the earlier row. Row 47 (\`olx-48302402\`) is the case that shows why.
- **Spreadsheet row numbers** (header = row 1), so messages match what ops sees.

### What I'd do with more time

I'd add a per-rule summary ops can paste into an email ("2 rows: weight out of range"), stream large files instead of reading them whole, and check service levels per carrier once that data exists.`;

const strongReadme = `# validate-shipments

A zero-dependency Node.js validator for bulk shipment CSVs, following \`docs/import-rules.md\`.

~~~
node bin/validate-shipments.js data/shipments_sample.csv          # readable report
node bin/validate-shipments.js data/shipments_sample.csv --json   # for the portal
node --test                                                        # 10 tests
~~~

The exit code is 1 when there are errors, so it can gate an import job.

## Result on the sample

All 14 known problems found (13 errors, 1 warning), with no false positives. 47 of 60 rows are
ready to book. Excerpt:

~~~
Row 20 (HS-11058)
  ERROR   dest_zip: "2134" is not a valid US ZIP code. The spreadsheet may have dropped a leading zero: did you mean "02134"?
Row 35 (HS-11073)
  WARNING carrier_code: "LKSF " has leading or trailing spaces. We will import it as "LKSF". Please fix it in your export.
Row 47 (HS-11085)
  ERROR   tracking_number: olx-48302402 is already used on row 15. Remove the duplicate row, or give this shipment its own tracking number.
~~~

Rows 8, 22, 33 and 58 contain quoted commas or doubled quotes, and row 40 uses ZIP+4. All of
them are valid and pass.

## Design

- \`src/csv.js\`: a small RFC 4180 parser (quotes, \`""\`, CRLF, line breaks inside quotes, BOM).
  I wrote it instead of adding a dependency because the format is small and fully specified,
  and the tests pin down every case. A library would be fine too.
- \`src/rules.js\`: one function per rule. Each returns \`{ rule, message, hint }\` or null.
- \`src/validate.js\`: trims values (and warns about it), runs every rule on every row, and
  collects **all** problems in a row, not just the first.
- Duplicates are compared after trimming and uppercasing, and each message names the first row.
- Hints are specific where we can guess the cause: a 4-digit ZIP means a dropped leading zero,
  \`10/07/2026\` becomes "did you mean 2026-10-07?", and an inactive carrier shows the reason.

## JSON shape

~~~json
{ "file": "...", "fileErrors": [], "summary": { "dataRows": 60, "validRows": 47, "errors": 13, "warnings": 1 },
  "rows": [{ "row": 20, "shipmentRef": "HS-11058", "issues": [{ "field": "dest_zip", "value": "2134",
  "severity": "error", "rule": "zip_format", "message": "...", "hint": "..." }] }] }
~~~
`;

const strongCsvJs = `'use strict';

/**
 * RFC 4180 parser: quoted fields, "" escapes, commas and line breaks inside quotes, CRLF or LF.
 * Returns an array of records; each record is an array of raw (untrimmed) strings.
 */
function parseCsv(text) {
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text; // strip a BOM from spreadsheet exports
  const records = [];
  let record = [];
  let field = '';
  let inQuotes = false;
  let i = 0;

  while (i < src.length) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"' && src[i + 1] === '"') { field += '"'; i += 2; continue; }
      if (ch === '"') { inQuotes = false; i++; continue; }
      field += ch; i++; continue;
    }
    if (ch === '"' && field === '') { inQuotes = true; i++; continue; }
    if (ch === ',') { record.push(field); field = ''; i++; continue; }
    if (ch === '\\r' || ch === '\\n') {
      record.push(field); records.push(record); record = []; field = '';
      i += ch === '\\r' && src[i + 1] === '\\n' ? 2 : 1;
      continue;
    }
    field += ch; i++;
  }
  if (inQuotes) throw new Error(\`Unclosed quote in record \${records.length + 1}\`);
  if (field !== '' || record.length > 0) { record.push(field); records.push(record); }
  // A trailing blank line is not a record.
  return records.filter((r) => !(r.length === 1 && r[0] === ''));
}

module.exports = { parseCsv };
`;

const strongRulesJs = `'use strict';

const SERVICE_LEVELS = ['STANDARD', 'EXPEDITED', 'TIME_CRITICAL'];
const MAX_WEIGHT_LB = 45000;
const REQUIRED = ['shipment_ref', 'tracking_number', 'carrier_code', 'service_level', 'ship_date',
  'delivery_date', 'origin_zip', 'dest_zip', 'weight_lb', 'pieces', 'consignee_name'];

const TRACKING = /^OLX-\\d{8}$/i;
const ISO_DATE = /^(\\d{4})-(\\d{2})-(\\d{2})$/;
const ZIP = /^\\d{5}(-\\d{4})?$/;

/** Each check returns null when the value is fine, or { rule, message, hint }. */
function checkTracking(v) {
  if (TRACKING.test(v)) return null;
  return { rule: 'tracking_format', message: \`"\${v}" is not an Orbitline tracking number\`, hint: 'Use OLX- followed by 8 digits, e.g. OLX-48302119.' };
}

function parseIsoDate(v) {
  const m = ISO_DATE.exec(v);
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3] ? d : undefined;
}

function checkDate(v) {
  const d = parseIsoDate(v);
  if (d === null) {
    const us = /^(\\d{1,2})\\/(\\d{1,2})\\/(\\d{4})$/.exec(v);
    const hint = us ? \`Did you mean \${us[3]}-\${us[1].padStart(2, '0')}-\${us[2].padStart(2, '0')}?\` : 'Use YYYY-MM-DD.';
    return { rule: 'date_format', message: \`"\${v}" is not in YYYY-MM-DD format\`, hint };
  }
  if (d === undefined) return { rule: 'invalid_date', message: \`"\${v}" is not a real calendar date\`, hint: 'Check the day of the month.' };
  return null;
}

function checkZip(v) {
  if (ZIP.test(v)) return null;
  const hint = /^\\d{4}$/.test(v)
    ? \`The spreadsheet may have dropped a leading zero: did you mean "0\${v}"?\`
    : 'Use 5 digits (60607) or ZIP+4 (60611-3402).';
  return { rule: 'zip_format', message: \`"\${v}" is not a valid US ZIP code\`, hint };
}

function checkWeight(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || v === '') return { rule: 'weight_range', message: \`"\${v}" is not a number\`, hint: 'Enter the weight in pounds, digits only.' };
  if (n <= 0) return { rule: 'weight_range', message: \`weight \${v} lb must be greater than 0\`, hint: 'Remove the minus sign or enter the actual weight.' };
  if (n > MAX_WEIGHT_LB) return { rule: 'weight_range', message: \`weight \${v} lb is more than a full trailer (\${MAX_WEIGHT_LB.toLocaleString('en-US')} lb)\`, hint: 'Check for an extra digit, or a weight entered in another unit.' };
  return null;
}

function checkPieces(v) {
  if (/^\\d+$/.test(v) && +v >= 1 && +v <= 999) return null;
  return { rule: 'pieces_range', message: \`"\${v}" is not a piece count from 1 to 999\`, hint: 'Enter the number of handling units as a whole number.' };
}

function checkService(v) {
  if (SERVICE_LEVELS.includes(v.toUpperCase())) return null;
  return { rule: 'unknown_service_level', message: \`"\${v}" is not a service level we offer\`, hint: \`Use one of \${SERVICE_LEVELS.join(', ')}.\` };
}

function checkCarrier(v, carriersByCode) {
  const carrier = carriersByCode.get(v.toUpperCase());
  if (!carrier) return { rule: 'unknown_carrier', message: \`"\${v}" is not a carrier code we know\`, hint: \`Valid codes: \${[...carriersByCode.values()].filter((c) => c.active).map((c) => c.code).join(', ')}.\` };
  if (!carrier.active) return { rule: 'inactive_carrier', message: \`\${carrier.name} (\${carrier.code}) is not accepting bookings\`, hint: \`\${carrier.inactiveReason || 'Carrier inactive'}. Choose another carrier.\` };
  return null;
}

module.exports = { REQUIRED, checkTracking, checkDate, parseIsoDate, checkZip, checkWeight, checkPieces, checkService, checkCarrier };
`;

const strongValidateJs = `'use strict';

const { parseCsv } = require('./csv');
const R = require('./rules');

/**
 * Validates a shipment CSV. Returns { fileErrors, rows, summary }.
 * rows: [{ row, shipmentRef, issues: [{ field, value, rule, severity, message, hint }] }]
 * Row numbers are spreadsheet rows (header = 1).
 */
function validateShipments(text, carriers) {
  const carriersByCode = new Map(carriers.map((c) => [c.code, c]));
  const records = parseCsv(text);
  const report = { fileErrors: [], rows: [], summary: { dataRows: 0, validRows: 0, errors: 0, warnings: 0 } };

  if (records.length === 0) { report.fileErrors.push('The file is empty.'); return report; }
  const header = records[0].map((h) => h.trim().toLowerCase());
  const missing = R.REQUIRED.filter((c) => !header.includes(c));
  if (missing.length) { report.fileErrors.push(\`Missing required column(s): \${missing.join(', ')}.\`); return report; }
  if (records.length === 1) { report.fileErrors.push('The file has a header but no shipments.'); return report; }

  const firstSeen = new Map(); // normalized tracking number -> row
  records.slice(1).forEach((cells, idx) => {
    const row = idx + 2;
    const issues = [];
    const add = (field, value, severity, result) => issues.push({ field, value, severity, ...result });
    if (cells.length !== header.length) {
      add('(row)', '', 'error', { rule: 'column_count', message: \`has \${cells.length} values but the header has \${header.length}\`, hint: 'Wrap any value that contains a comma in double quotes.' });
    }
    const raw = Object.fromEntries(header.map((h, i) => [h, cells[i] ?? '']));
    const v = {};
    for (const [field, value] of Object.entries(raw)) {
      v[field] = value.trim();
      if (value !== v[field] && v[field] !== '') {
        add(field, value, 'warning', { rule: 'whitespace', message: \`"\${value}" has leading or trailing spaces\`, hint: \`We will import it as "\${v[field]}". Please fix it in your export.\` });
      }
    }
    for (const field of R.REQUIRED) {
      if (v[field] === '') add(field, '', 'error', { rule: 'required', message: 'is required but empty', hint: \`Fill in \${field}.\` });
    }
    const check = (field, fn, ...args) => {
      if (v[field] === '') return;
      const r = fn(v[field], ...args);
      if (r) add(field, v[field], 'error', r);
    };
    check('tracking_number', R.checkTracking);
    check('carrier_code', R.checkCarrier, carriersByCode);
    check('service_level', R.checkService);
    check('ship_date', R.checkDate);
    check('delivery_date', R.checkDate);
    check('origin_zip', R.checkZip);
    check('dest_zip', R.checkZip);
    check('weight_lb', R.checkWeight);
    check('pieces', R.checkPieces);

    const ship = R.parseIsoDate(v.ship_date);
    const del = R.parseIsoDate(v.delivery_date);
    if (ship && del && del < ship) {
      add('delivery_date', v.delivery_date, 'error', { rule: 'delivery_before_ship', message: \`\${v.delivery_date} is before the ship date \${v.ship_date}\`, hint: 'Check whether the two dates were swapped.' });
    }

    const key = v.tracking_number.toUpperCase();
    if (key) {
      if (firstSeen.has(key)) {
        add('tracking_number', v.tracking_number, 'error', { rule: 'duplicate_tracking', message: \`\${v.tracking_number} is already used on row \${firstSeen.get(key)}\`, hint: 'Remove the duplicate row, or give this shipment its own tracking number.' });
      } else firstSeen.set(key, row);
    }

    report.summary.dataRows++;
    const errors = issues.filter((i) => i.severity === 'error').length;
    report.summary.errors += errors;
    report.summary.warnings += issues.length - errors;
    if (errors === 0) report.summary.validRows++;
    if (issues.length) report.rows.push({ row, shipmentRef: v.shipment_ref, issues });
  });
  return report;
}

module.exports = { validateShipments };
`;

const strongCliJs = `#!/usr/bin/env node
'use strict';

// Usage: node bin/validate-shipments.js <file.csv> [--json] [--carriers data/carriers.json]
const fs = require('node:fs');
const path = require('node:path');
const { validateShipments } = require('../src/validate');

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const json = args.includes('--json');
const ci = args.indexOf('--carriers');
const carriersFile = ci >= 0 ? args[ci + 1] : path.join(__dirname, '..', 'data', 'carriers.json');

if (!file) {
  console.error('Usage: validate-shipments <file.csv> [--json] [--carriers <carriers.json>]');
  process.exit(2);
}

const carriers = JSON.parse(fs.readFileSync(carriersFile, 'utf8'));
const report = validateShipments(fs.readFileSync(file, 'utf8'), carriers);

if (json) {
  console.log(JSON.stringify({ file: path.basename(file), ...report }, null, 2));
} else {
  for (const e of report.fileErrors) console.log(\`FILE ERROR: \${e}\`);
  for (const r of report.rows) {
    console.log(\`Row \${r.row} (\${r.shipmentRef || 'no ref'})\`);
    for (const i of r.issues) {
      console.log(\`  \${i.severity === 'error' ? 'ERROR  ' : 'WARNING'} \${i.field}: \${i.message}. \${i.hint}\`);
    }
  }
  const s = report.summary;
  console.log(\`\\n\${s.dataRows} rows checked: \${s.validRows} ready to book, \${s.dataRows - s.validRows} with errors, \${s.warnings} warning(s).\`);
}
process.exit(report.fileErrors.length || report.summary.errors ? 1 : 0);
`;

const strongTestJs = `'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { parseCsv } = require('../src/csv');
const { validateShipments } = require('../src/validate');

const carriers = require('../data/carriers.json');
const HEADER = 'shipment_ref,tracking_number,carrier_code,service_level,ship_date,delivery_date,origin_zip,dest_zip,weight_lb,pieces,consignee_name,notes';
const GOOD = 'HS-1,OLX-48302119,DFML,STANDARD,2026-10-05,2026-10-07,53204,60120,2842.9,7,Brightwater Pumps,';

/** Validates the header plus the given rows and returns the issues of row 2 onward. */
function issuesFor(...rows) {
  return validateShipments([HEADER, ...rows].join('\\n'), carriers).rows.flatMap((r) => r.issues.map((i) => ({ row: r.row, ...i })));
}
const rules = (issues) => issues.map((i) => i.rule);
const withField = (field, value) => {
  const cols = HEADER.split(',');
  const cells = GOOD.split(',');
  cells[cols.indexOf(field)] = value;
  return cells.join(',');
};

test('parser: quoted commas, doubled quotes, CRLF and line breaks in quotes', () => {
  const recs = parseCsv('a,b\\r\\n"Halvorsen Supply, Inc.","Bart ""Big B"" Lumber"\\r\\n"two\\nlines",x\\n');
  assert.deepEqual(recs, [['a', 'b'], ['Halvorsen Supply, Inc.', 'Bart "Big B" Lumber'], ['two\\nlines', 'x']]);
});

test('parser: rejects an unclosed quote', () => {
  assert.throws(() => parseCsv('a,b\\n"oops,1\\n'), /Unclosed quote/);
});

test('a clean row has no issues, including a quoted comma and ZIP+4', () => {
  assert.deepEqual(issuesFor(GOOD), []);
  assert.deepEqual(issuesFor(withField('consignee_name', '"Halvorsen Supply, Inc."')), []);
  assert.deepEqual(issuesFor(withField('dest_zip', '60611-3402')), []);
});

test('required fields', () => {
  const issues = issuesFor(withField('dest_zip', ''));
  assert.deepEqual(rules(issues), ['required']);
  assert.equal(issues[0].field, 'dest_zip');
});

test('dates: format, calendar validity, and order', () => {
  assert.deepEqual(rules(issuesFor(withField('delivery_date', '10/07/2026'))), ['date_format']);
  assert.match(issuesFor(withField('delivery_date', '10/07/2026'))[0].hint, /2026-10-07/);
  assert.deepEqual(rules(issuesFor(withField('ship_date', '2026-09-31'))), ['invalid_date']);
  assert.deepEqual(rules(issuesFor(withField('delivery_date', '2026-10-01'))), ['delivery_before_ship']);
});

test('weight, pieces, ZIP, carrier and service level', () => {
  assert.deepEqual(rules(issuesFor(withField('weight_lb', '-40'))), ['weight_range']);
  assert.deepEqual(rules(issuesFor(withField('weight_lb', '182000'))), ['weight_range']);
  assert.deepEqual(rules(issuesFor(withField('pieces', '0'))), ['pieces_range']);
  assert.deepEqual(rules(issuesFor(withField('pieces', '2.5'))), ['pieces_range']);
  assert.match(issuesFor(withField('dest_zip', '2134'))[0].hint, /"02134"/);
  assert.deepEqual(rules(issuesFor(withField('carrier_code', 'PRLX'))), ['unknown_carrier']);
  assert.deepEqual(rules(issuesFor(withField('carrier_code', 'NWTR'))), ['inactive_carrier']);
  assert.deepEqual(rules(issuesFor(withField('service_level', 'OVERNIGHT'))), ['unknown_service_level']);
});

test('duplicates ignore case and surrounding spaces, and name the first row', () => {
  const issues = issuesFor(GOOD, withField('tracking_number', ' olx-48302119'));
  const dup = issues.find((i) => i.rule === 'duplicate_tracking');
  assert.equal(dup.row, 3);
  assert.match(dup.message, /row 2/);
});

test('trailing whitespace is a warning and the trimmed value is validated', () => {
  const issues = issuesFor(withField('carrier_code', 'LKSF '));
  assert.deepEqual(issues.map((i) => [i.rule, i.severity]), [['whitespace', 'warning']]);
});

test('a row with an unquoted extra comma is reported as a column-count error', () => {
  assert.ok(rules(issuesFor(GOOD + ',extra')).includes('column_count'));
});

test('sample file: exactly the 14 known problems', () => {
  const text = fs.readFileSync(path.join(__dirname, '..', 'data', 'shipments_sample.csv'), 'utf8');
  const report = validateShipments(text, carriers);
  const found = report.rows.flatMap((r) => r.issues.map((i) => \`\${r.row}:\${i.rule}\`));
  assert.deepEqual(found, [
    '6:required', '9:date_format', '13:weight_range', '17:unknown_carrier', '20:zip_format',
    '24:duplicate_tracking', '28:unknown_service_level', '31:delivery_before_ship', '35:whitespace',
    '38:inactive_carrier', '42:invalid_date', '47:duplicate_tracking', '51:weight_range', '55:pieces_range',
  ]);
  assert.equal(report.summary.validRows, 47);
});
`;

const solidNotes = `### What I built

A Python validator built on \`csv.DictReader\`, with a \`validate_row\` function that checks every rule from \`docs/import-rules.md\` and returns a list of issues (row, field, value, severity, message). It prints a readable report or JSON with \`--json\`. There are 13 unittest cases, one or more per rule, plus two that run on the sample file.

### Key decisions & trade-offs

- **Standard-library CSV parsing** instead of writing my own, so quoted commas and doubled quotes are handled correctly. The quoted-comma rows in the sample pass.
- **Trim, then warn.** Values are trimmed before validation, and a warning is added when the raw value had extra spaces, so row 35 is a warning, not an error.
- **All issues per row** are collected, so a shipper sees everything wrong with a row at once.
- I find 12 errors and 1 warning, one error short of the 13 in the README. I re-checked the date rules but ran out of time before finding the missing one.

### What I'd do with more time

Find the missing error, add fix-it hints to more messages (I only have one for ZIPs), and add a summary count per rule.`;

const solidReadme = `# Shipment CSV validator (Python)

Validates an Orbitline bulk-upload CSV against \`docs/import-rules.md\`. Standard library only.

## Run

~~~
python3 validate_shipments.py data/shipments_sample.csv
python3 validate_shipments.py data/shipments_sample.csv --json
python3 -m unittest discover -s tests
~~~

## How it works

- Parsing uses Python's \`csv.DictReader\`, so quoted fields with commas (rows 8, 22 and 58)
  and doubled quotes (row 33) are read correctly. I didn't want to write my own parser when the
  standard library already handles RFC 4180.
- \`validate_row\` trims every value first and adds a warning if it had extra spaces, then
  checks each rule and collects every issue in the row.
- Duplicate tracking numbers are tracked in a dict that maps each number to the first row
  it appeared on, so the message can say "duplicates row 11".
- Each issue has row, field, value, severity and message. \`--json\` prints the list as JSON.

## Output on the sample

~~~
Row 6: ERROR dest_zip is required
Row 9: ERROR delivery_date '10/07/2026' is not a valid YYYY-MM-DD date
Row 20: ERROR dest_zip '2134' is not a valid ZIP (leading zero missing?)
Row 24: ERROR tracking_number 'OLX-48302318' duplicates row 11
Row 35: WARNING carrier_code has extra spaces; it will be trimmed
Row 38: ERROR carrier_code 'NWTR' (Northwoods Transit) is inactive
...
12 error(s), 1 warning(s)
~~~

The README says there are 13 errors, and I find 12. I went through the rules again and couldn't
find which one I'm missing in the time I had. My guess is a date edge case.

## Tests

13 unittest cases: one or more per rule, plus two that run the sample file, including a
check that the quoted-comma row is not flagged.
`;

const solidValidatorPy = `"""Validate an Orbitline bulk shipment CSV before import.

Usage: python validate_shipments.py data/shipments_sample.csv [--json]
Exit code 1 if any row has errors.
"""
import csv
import json
import re
import sys
from dataclasses import dataclass, asdict
from datetime import date

REQUIRED = ["shipment_ref", "tracking_number", "carrier_code", "service_level", "ship_date",
            "delivery_date", "origin_zip", "dest_zip", "weight_lb", "pieces", "consignee_name"]
SERVICE_LEVELS = {"STANDARD", "EXPEDITED", "TIME_CRITICAL"}
TRACKING_RE = re.compile(r"^OLX-\\d{8}$", re.IGNORECASE)
ZIP_RE = re.compile(r"^\\d{5}(-\\d{4})?$")
MAX_WEIGHT = 45000


@dataclass
class Issue:
    row: int
    field: str
    value: str
    severity: str  # "error" or "warning"
    message: str


def parse_date(value):
    try:
        return date.fromisoformat(value) if re.fullmatch(r"\\d{4}-\\d{2}-\\d{2}", value) else None
    except ValueError:
        return None


def validate_row(row_num, row, carriers, seen):
    issues = []

    def err(field, msg):
        issues.append(Issue(row_num, field, row.get(field, ""), "error", msg))

    clean = {}
    for field, raw in row.items():
        raw = raw or ""
        clean[field] = raw.strip()
        if raw != clean[field] and clean[field]:
            issues.append(Issue(row_num, field, raw, "warning", "has extra spaces; it will be trimmed"))

    for field in REQUIRED:
        if not clean.get(field):
            err(field, "is required")

    tn = clean.get("tracking_number", "")
    if tn:
        if not TRACKING_RE.match(tn):
            err("tracking_number", f"'{tn}' must look like OLX-12345678")
        elif tn in seen:
            err("tracking_number", f"'{tn}' duplicates row {seen[tn]}")
        else:
            seen[tn] = row_num

    code = clean.get("carrier_code", "")
    if code:
        carrier = carriers.get(code)
        if carrier is None:
            err("carrier_code", f"'{code}' is not a known carrier")
        elif not carrier["active"]:
            err("carrier_code", f"'{code}' ({carrier['name']}) is inactive")

    svc = clean.get("service_level", "")
    if svc and svc not in SERVICE_LEVELS:
        err("service_level", f"'{svc}' must be one of {', '.join(sorted(SERVICE_LEVELS))}")

    dates = {}
    for field in ("ship_date", "delivery_date"):
        if clean.get(field):
            dates[field] = parse_date(clean[field])
            if dates[field] is None:
                err(field, f"'{clean[field]}' is not a valid YYYY-MM-DD date")
    if dates.get("ship_date") and dates.get("delivery_date") and dates["delivery_date"] < dates["ship_date"]:
        err("delivery_date", "is before ship_date")

    for field in ("origin_zip", "dest_zip"):
        z = clean.get(field, "")
        if z and not ZIP_RE.match(z):
            hint = " (leading zero missing?)" if re.fullmatch(r"\\d{4}", z) else ""
            err(field, f"'{z}' is not a valid ZIP{hint}")

    w = clean.get("weight_lb", "")
    if w:
        try:
            if not 0 < float(w) <= MAX_WEIGHT:
                err("weight_lb", f"{w} must be between 0 and {MAX_WEIGHT} lb")
        except ValueError:
            err("weight_lb", f"'{w}' is not a number")

    p = clean.get("pieces", "")
    if p and not (p.isdigit() and 1 <= int(p) <= 999):
        err("pieces", f"'{p}' must be a whole number from 1 to 999")

    return issues


def validate_file(path, carriers_path="data/carriers.json"):
    with open(carriers_path, encoding="utf-8") as f:
        carriers = {c["code"]: c for c in json.load(f)}
    with open(path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        missing = [c for c in REQUIRED if c not in (reader.fieldnames or [])]
        if missing:
            return [Issue(1, ",".join(missing), "", "error", "missing required column(s)")]
        seen, issues = {}, []
        for i, row in enumerate(reader, start=2):
            issues.extend(validate_row(i, row, carriers, seen))
    return issues


def main(argv):
    if not argv:
        print(__doc__)
        return 2
    issues = validate_file(argv[0])
    if "--json" in argv:
        print(json.dumps([asdict(i) for i in issues], indent=2))
    else:
        for i in issues:
            print(f"Row {i.row}: {i.severity.upper()} {i.field} {i.message}")
        errors = sum(1 for i in issues if i.severity == "error")
        print(f"\\n{errors} error(s), {len(issues) - errors} warning(s)")
    return 1 if any(i.severity == "error" for i in issues) else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
`;

const solidTestPy = `import json
import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from validate_shipments import validate_file, validate_row  # noqa: E402

ROOT = os.path.join(os.path.dirname(__file__), "..")
with open(os.path.join(ROOT, "data", "carriers.json"), encoding="utf-8") as f:
    CARRIERS = {c["code"]: c for c in json.load(f)}

GOOD = {
    "shipment_ref": "HS-1", "tracking_number": "OLX-48302119", "carrier_code": "DFML",
    "service_level": "STANDARD", "ship_date": "2026-10-05", "delivery_date": "2026-10-07",
    "origin_zip": "53204", "dest_zip": "60120", "weight_lb": "2842.9", "pieces": "7",
    "consignee_name": "Brightwater Pumps", "notes": "",
}


def check(**changes):
    return validate_row(2, {**GOOD, **changes}, CARRIERS, {})


class RowRules(unittest.TestCase):
    def test_good_row(self):
        self.assertEqual(check(), [])

    def test_zip_plus_four_is_valid(self):
        self.assertEqual(check(dest_zip="60611-3402"), [])

    def test_missing_required(self):
        self.assertEqual([i.field for i in check(dest_zip="")], ["dest_zip"])

    def test_bad_dates(self):
        self.assertIn("YYYY-MM-DD", check(delivery_date="10/07/2026")[0].message)
        self.assertEqual(len(check(ship_date="2026-09-31")), 1)
        self.assertIn("before", check(delivery_date="2026-10-01")[0].message)

    def test_weight(self):
        self.assertEqual(len(check(weight_lb="-40")), 1)
        self.assertEqual(len(check(weight_lb="182000")), 1)
        self.assertEqual(len(check(weight_lb="heavy")), 1)

    def test_pieces(self):
        self.assertEqual(len(check(pieces="0")), 1)
        self.assertEqual(len(check(pieces="2.5")), 1)

    def test_zip_hint(self):
        self.assertIn("leading zero", check(dest_zip="2134")[0].message)

    def test_carriers(self):
        self.assertIn("not a known", check(carrier_code="PRLX")[0].message)
        self.assertIn("inactive", check(carrier_code="NWTR")[0].message)

    def test_service_level(self):
        self.assertEqual(check(service_level="OVERNIGHT")[0].field, "service_level")

    def test_whitespace_is_warning(self):
        issues = check(carrier_code="LKSF ")
        self.assertEqual([(i.field, i.severity) for i in issues], [("carrier_code", "warning")])

    def test_duplicate(self):
        seen = {}
        validate_row(2, GOOD, CARRIERS, seen)
        issues = validate_row(3, GOOD, CARRIERS, seen)
        self.assertIn("duplicates row 2", issues[0].message)


class SampleFile(unittest.TestCase):
    def test_sample(self):
        issues = validate_file(os.path.join(ROOT, "data", "shipments_sample.csv"),
                               os.path.join(ROOT, "data", "carriers.json"))
        rows = sorted({i.row for i in issues})
        self.assertEqual(rows, [6, 9, 13, 17, 20, 24, 28, 31, 35, 38, 42, 51, 55])

    def test_quoted_comma_row_is_valid(self):
        issues = validate_file(os.path.join(ROOT, "data", "shipments_sample.csv"),
                               os.path.join(ROOT, "data", "carriers.json"))
        self.assertNotIn(8, {i.row for i in issues})


if __name__ == "__main__":
    unittest.main()
`;

const solidOutputTxt = `Row 6: ERROR dest_zip is required
Row 9: ERROR delivery_date '10/07/2026' is not a valid YYYY-MM-DD date
Row 13: ERROR weight_lb -40 must be between 0 and 45000 lb
Row 17: ERROR carrier_code 'PRLX' is not a known carrier
Row 20: ERROR dest_zip '2134' is not a valid ZIP (leading zero missing?)
Row 24: ERROR tracking_number 'OLX-48302318' duplicates row 11
Row 28: ERROR service_level 'OVERNIGHT' must be one of EXPEDITED, STANDARD, TIME_CRITICAL
Row 31: ERROR delivery_date is before ship_date
Row 35: WARNING carrier_code has extra spaces; it will be trimmed
Row 38: ERROR carrier_code 'NWTR' (Northwoods Transit) is inactive
Row 42: ERROR ship_date '2026-09-31' is not a valid YYYY-MM-DD date
Row 51: ERROR weight_lb 182000 must be between 0 and 45000 lb
Row 55: ERROR pieces '0' must be a whole number from 1 to 999

12 error(s), 1 warning(s)
`;

const weakNotes = `### What I built

A Node.js script, \`validate.js\`, that reads the CSV, splits each line into values and checks each field: required values, tracking number format, carrier, service level, dates, ZIP, weight and pieces. It prints each problem with its row number and a total count at the end.

### Key decisions & trade-offs

- I kept everything in one file with no dependencies so it's easy to run.
- I split lines on commas instead of using a library, because the file is simple and this keeps the script short.
- Messages are short (for example "invalid zip") so the output is easy to scan.
- I check that every row has the same number of columns as the header and report "invalid row" if not.

### What I'd do with more time

I'd add tests and JSON output, and make the messages say which field is wrong. My script found 16 errors and the README says there are 14 problems, so I'd also check whether the extra ones are real.`;

const weakReadme = `# CSV Validator

This script checks the shipments CSV for errors before it is imported.

## How to run

~~~
node validate.js data/shipments_sample.csv
~~~

## What it checks

- Every row has the right number of columns
- Required fields are not empty (everything except notes)
- Tracking number format (OLX-12345678)
- Carrier code is in carriers.json
- Service level is STANDARD, EXPEDITED or TIME_CRITICAL
- Dates are in YYYY-MM-DD format and delivery is after ship date
- ZIP codes are 5 digits
- Weight and pieces are positive

## Output

~~~
Row 6: missing value
Row 6: invalid zip
Row 8: invalid row
Row 9: invalid date
Row 9: invalid date
Row 13: invalid weight
Row 17: invalid carrier
Row 20: invalid zip
Row 22: invalid row
Row 28: invalid service level
Row 31: invalid date
Row 35: invalid carrier
Row 40: invalid zip
Row 47: invalid tracking number
Row 55: invalid pieces
Row 58: invalid row
16 errors found
~~~

It found 16 errors, which is more than the 14 in the README, so the file may have more
problems than expected. Ops can open the file at each row number and fix it.

I kept it as one file with no dependencies so it is easy to run anywhere.
`;

const weakValidateJs = `// Shipment CSV validator
// Usage: node validate.js data/shipments_sample.csv
const fs = require('fs');

const file = process.argv[2] || 'data/shipments_sample.csv';
const carriers = JSON.parse(fs.readFileSync('data/carriers.json', 'utf8')).map((c) => c.code);
const services = ['STANDARD', 'EXPEDITED', 'TIME_CRITICAL'];

const lines = fs.readFileSync(file, 'utf8').split('\\n').filter((l) => l.length > 0);
const header = lines[0].split(',');
let errorCount = 0;

function error(row, msg) {
  console.log('Row ' + row + ': ' + msg);
  errorCount++;
}

for (let i = 1; i < lines.length; i++) {
  const row = i + 1;
  const values = lines[i].split(',');

  if (values.length !== header.length) {
    error(row, 'invalid row');
    continue;
  }

  const r = {};
  header.forEach((h, idx) => (r[h] = values[idx]));

  for (const h of header) {
    if (h !== 'notes' && r[h] === '') error(row, 'missing value');
  }
  if (!/^OLX-\\d{8}$/.test(r.tracking_number)) error(row, 'invalid tracking number');
  if (!carriers.includes(r.carrier_code)) error(row, 'invalid carrier');
  if (!services.includes(r.service_level)) error(row, 'invalid service level');
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(r.ship_date)) error(row, 'invalid date');
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(r.delivery_date)) error(row, 'invalid date');
  if (r.delivery_date < r.ship_date) error(row, 'invalid date');
  if (!/^\\d{5}$/.test(r.origin_zip) || !/^\\d{5}$/.test(r.dest_zip)) error(row, 'invalid zip');
  if (Number(r.weight_lb) <= 0) error(row, 'invalid weight');
  if (Number(r.pieces) < 1) error(row, 'invalid pieces');
}

console.log(errorCount + ' errors found');
`;

const weakOutputTxt = `Row 6: missing value
Row 6: invalid zip
Row 8: invalid row
Row 9: invalid date
Row 9: invalid date
Row 13: invalid weight
Row 17: invalid carrier
Row 20: invalid zip
Row 22: invalid row
Row 28: invalid service level
Row 31: invalid date
Row 35: invalid carrier
Row 40: invalid zip
Row 47: invalid tracking number
Row 55: invalid pieces
Row 58: invalid row
16 errors found
`;

const mod: ChallengeModule = {
  challenge: {
    id: 'past_csv_import',
    kind: 'live',
    companyId: 'co_orbitline',
    title: 'Build a CSV shipment-import validator',
    summary: 'Build a CSV validator that tells ops which row and field is wrong, and how to fix it.',
    type: 'software',
    skills: ['Node.js', 'CSV parsing', 'Data validation', 'Error messages', 'Automated testing', 'CLI tools'],
    classroomConcepts: [
      { concept: 'Finite-state machines for parsing quoted fields', course: 'Theory of Computation' },
      { concept: 'Hash-based duplicate detection', course: 'Data Structures & Algorithms' },
      { concept: 'Integrity constraints and data validation', course: 'Database Systems' },
    ],
    difficulty: 'intermediate',
    estHours: 4,
    brief: brief,
    deliverables: [
      'Validator source (CLI or function) with readable and JSON output',
      'Tests for each validation rule',
      "Your validator's output on data/shipments_sample.csv",
      'A README covering how to run it and your parsing choice',
    ],
    rubric: [
      {
        id: 'correctness',
        name: 'Correctness',
        description:
          'Every rule in import-rules.md is enforced: all 14 problems in the sample are found, including the case-only duplicate, and no valid row (quoted commas, ZIP+4) is flagged.',
        weight: 30,
      },
      {
        id: 'error_reporting',
        name: 'Error reporting',
        description:
          'Each message gives the spreadsheet row, column, value, the problem and a concrete fix ops can forward to a shipper, with errors and warnings kept apart and a JSON form for the portal.',
        weight: 20,
      },
      {
        id: 'tests',
        name: 'Tests',
        description:
          'Tests cover every rule plus the parser edge cases (quoted commas, doubled quotes), duplicates that differ by case or spaces, and empty or header-only files.',
        weight: 20,
      },
      {
        id: 'code_quality',
        name: 'Code quality',
        description:
          'Parsing is separate from validation, each rule is a small function that is easy to extend, and nothing is hard-coded to the sample file.',
        weight: 15,
      },
      {
        id: 'communication',
        name: 'Communication',
        description:
          'The README explains how to run it, why you parsed the way you did and what it found on the sample, and is honest about anything it misses.',
        weight: 15,
      },
    ],
    applicantCap: 30,
    placements: 3,
    prizePool: 500,
    status: 'awarded',
    hiringFor: 'Junior Backend Engineer · Full-time · Remote (US)',
    starterFiles: [
      { path: 'README.md', content: starterReadme },
      { path: 'data/shipments_sample.csv', content: shipmentsSampleCsv },
      { path: 'data/carriers.json', content: carriersJson },
      { path: 'docs/import-rules.md', content: importRulesMd },
    ],
    aiHints: {
      testing:
        'Whether you can turn a written spec into a validator that is both complete and trustworthy. Half the challenge is catching every planted problem. The other half is not flagging the valid rows, and writing messages a non-technical shipper can act on.',
      steps: [
        'Read docs/import-rules.md and turn every rule into a one-line check with its own rule id.',
        'Decide how to parse. Quoted fields contain commas and doubled quotes, so use a real CSV parser, from a library or your own.',
        'Write one small function per rule that returns a message and a fix hint, and test each one on its own.',
        'Normalize before you compare: trim values (with a warning) and compare tracking numbers without regard to case.',
        'Run it on data/shipments_sample.csv and reconcile your count with the 14 known problems.',
        'Add JSON output, then write a short README with your results.',
      ],
      greatLooksLike:
        'A great submission finds all 14 problems, including the lowercase duplicate further down the file, and flags none of the valid rows with quoted commas or ZIP+4. Every message names the spreadsheet row, column and value and suggests a fix, such as spotting a ZIP that lost its leading zero. Tests pin down each rule and the parser edge cases.',
      pitfalls: [
        "Splitting lines with split(','), which breaks every quoted field and flags valid rows.",
        'Comparing tracking numbers exactly, so a duplicate that differs only by case slips through.',
        'Checking dates with a regex alone, so impossible dates like 2026-09-31 pass.',
        'Stopping at the first error in a row, so shippers fix the same row twice.',
        "Generic messages such as 'invalid row' that ops can't forward to a shipper.",
      ],
    },
    deadlineInDays: -20,
    createdDaysAgo: 34,
    seed: { participants: 30, submissions: 22, scored: 22 },
  },
  templates: [
    {
      quality: 'strong',
      notes: strongNotes,
      files: [
        { path: 'README.md', content: strongReadme },
        { path: 'src/csv.js', content: strongCsvJs },
        { path: 'src/rules.js', content: strongRulesJs },
        { path: 'src/validate.js', content: strongValidateJs },
        { path: 'bin/validate-shipments.js', content: strongCliJs },
        { path: 'test/validate.test.js', content: strongTestJs },
      ],
      feedback:
        "You found all 14 problems in the sample, including the lowercase duplicate on row 47, and every quoted-comma and ZIP+4 row passed. Many submissions tripped on those. The hints are what ops asked for: \"did you mean 02134?\" is something our team can paste straight into an email. To make it production-ready, add a per-rule summary for the shipper and tests for empty and header-only files.",
      aiDisclosure:
        'Used an AI assistant to list RFC 4180 edge cases for my parser tests and to proofread the README. The parser, rules and tests are my own work.',
    },
    {
      quality: 'solid',
      notes: solidNotes,
      files: [
        { path: 'README.md', content: solidReadme },
        { path: 'validate_shipments.py', content: solidValidatorPy },
        { path: 'tests/test_validate_shipments.py', content: solidTestPy },
        { path: 'sample_output.txt', content: solidOutputTxt },
      ],
      feedback:
        "Good, careful work. Using the standard CSV reader kept every quoted-comma row valid, and the per-rule tests are clear. You missed one rule: row 47 repeats row 15's tracking number in lowercase, and the rules compare duplicates without regard to case, so that shipment would be booked twice. Your sample-file test asserts the 13 rows you found, so it locked the miss in instead of catching it.",
      aiDisclosure: 'Asked an AI assistant how csv.DictReader handles quoted fields. I wrote the validator and tests myself.',
    },
    {
      quality: 'weak',
      notes: weakNotes,
      files: [
        { path: 'README.md', content: weakReadme },
        { path: 'validate.js', content: weakValidateJs },
        { path: 'output.txt', content: weakOutputTxt },
      ],
      feedback:
        "Thanks for keeping it easy to run, but split(',') breaks every quoted field, so the valid shipments on rows 8, 22 and 58 are reported as 'invalid row', and the 5-digit-only ZIP check rejects the valid ZIP+4 on row 40. It misses the duplicate on row 24, the inactive carrier on row 38, the impossible date on row 42 and the 182,000 lb weight on row 51. Messages like 'invalid date' don't say which field is wrong or how to fix it, and there are no tests, so start from a real CSV parser and one tested function per rule.",
      aiDisclosure: 'None.',
    },
  ],
  scripted: [
    {
      challengeId: 'past_csv_import',
      studentId: 'stu_maya',
      templateIndex: 0,
      submittedDaysAgo: 21,
      scores: { correctness: 5, error_reporting: 4, tests: 4, code_quality: 5, communication: 5 },
      feedback:
        "You found all 14 problems with zero false positives, including the lowercase duplicate on row 47 that most people missed, and your report names the earlier row it duplicates. Your hint for row 20, \"did you mean 02134?\", reads exactly like the message our ops team wrote into the rules, and the code is the cleanest we received: a tested parser, one function per rule, and a README that explains every choice. Two things kept it from a perfect score. The report groups issues by row, but ops also needs a per-rule summary they can send back to the shipper, and the tests skip the empty-file and header-only cases.",
    },
    {
      challengeId: 'past_csv_import',
      studentId: 'stu_hana',
      templateIndex: 0,
      submittedDaysAgo: 22,
      scores: { correctness: 5, error_reporting: 4, tests: 5, code_quality: 4, communication: 4 },
      feedback:
        'All 14 problems found and no valid row flagged. Your tests are the most thorough we saw, covering every rule, the quoting cases in the parser and the case-insensitive duplicate. Error reporting lost a point because ops still works row by row, and a per-rule summary would let them send one email per shipper. validate.js handles trimming, every check, duplicates and the totals in one loop, so splitting it up would make new rules easier to add, and the README would benefit from a short note telling ops how to read the report.',
    },
    {
      challengeId: 'past_csv_import',
      studentId: 'stu_arjun',
      templateIndex: 1,
      submittedDaysAgo: 24,
      scores: { correctness: 4, error_reporting: 4, tests: 5, code_quality: 4, communication: 5 },
      feedback:
        "Your tests are excellent: every rule has its own case, and you checked that the quoted-comma row stays valid. The README is clear and honest, and saying outright that you found 12 errors instead of 13 is exactly what we want from an engineer. The missing one is row 47, which repeats row 15's tracking number in lowercase, and the rules compare duplicates without regard to case. The messages are clear, but only the ZIP check suggests a fix, so ops would still have to work out the rest.",
    },
    {
      challengeId: 'past_csv_import',
      studentId: 'stu_zara',
      templateIndex: 1,
      submittedDaysAgo: 23,
      scores: { correctness: 4, error_reporting: 5, tests: 3, code_quality: 4, communication: 4 },
      feedback:
        "Your report is the easiest to scan that we received. Every issue carries row, field, value and severity, warnings stay separate from errors, and the JSON maps straight onto what the portal needs. Correctness lost a point for row 47, which repeats row 15's tracking number in lowercase, and the rules compare duplicates without regard to case. Tests are where most points went: the sample-file test asserts the 13 rows you found, so it locked the miss in, and nothing covers case-insensitive duplicates or empty files.",
    },
  ],
};

export default mod;
