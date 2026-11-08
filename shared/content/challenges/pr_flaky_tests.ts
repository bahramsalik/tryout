import type { ChallengeModule } from '../lib.ts';

const brief = `## Context

Juniper Market, a fictional 14-store grocery chain, texts customers when a click-and-collect order has sat uncollected for 24 hours. The small Node.js service behind those texts has a test suite that fails in CI about one run in five, and every time on a different test. Re-running the job makes it pass. The team now hits "re-run" without reading the failure, and last month a real bug sat on \`main\` for two days because everyone assumed it was "just the flaky tests".

You've just joined the team, and your first ticket is to make the suite trustworthy again.

## The task

Three of the 12 tests are flaky, and each fails for a different reason. For each one:

- Reproduce it. Run the suite in a loop until you've seen it fail.
- Find the root cause and explain it precisely: what varies between runs, and why that changes the result.
- Fix it at the cause. Sometimes the test is wrong and sometimes the code is.

Then show that the suite is stable, for example by running it a few hundred times, and write up what you found.

## Constraints

- Time box: about 3 hours.
- Node.js 20+ and the built-in \`node:test\` runner. Don't add dependencies.
- Retries, longer timeouts and \`--test-concurrency=1\` hide flakiness instead of fixing it, so they don't count.
- Keep every existing test's intent. Don't delete a test to make the suite pass.
- AI assistants are fine. Note how you used them.

## What we provide

- \`src/reminders.js\`, \`src/store.js\`, \`src/notifier.js\`: the service code
- \`src/customer-directory.js\`, \`src/sms-gateway.js\`: fakes with realistic latency
- \`test/reminders.test.js\`, \`test/store.test.js\`, \`test/notifier.test.js\`: the 12 tests
- \`ci-log.txt\`: the last 15 CI runs, with the failures
- \`README.md\`: setup and a loop for reproducing failures`;

const starterReadme = `# pickup-reminders

Juniper Market (a fictional 14-store grocery chain) texts customers when a click-and-collect
order has been ready for 24 hours and still hasn't been picked up. This service schedules
those reminders and sends them through an SMS gateway.

It has no dependencies. Node.js 20 or newer is all you need.

~~~
npm test          # runs node --test over test/
~~~

## Layout

| Path | What it does |
|---|---|
| \`src/reminders.js\` | \`scheduleReminder(order, { customers })\`: looks up the customer and stores a reminder for 24 h later |
| \`src/store.js\` | Reminder storage (in memory for dev and tests) |
| \`src/notifier.js\` | \`sendDueReminders(gateway, nowS)\`: sends every due reminder and marks it sent |
| \`src/customer-directory.js\` | Fake customer profile service with realistic latency |
| \`src/sms-gateway.js\` | Fake SMS gateway with realistic latency; records messages in \`outbox\` |
| \`test/*.test.js\` | 12 tests across three files |
| \`ci-log.txt\` | The last 15 CI runs on \`main\` |

## The problem

CI fails about one run in five, and always on a different test. Re-running the job makes it
pass, so the team has started clicking "re-run" without reading the failure. Last month a real
bug sat on \`main\` for two days because everyone assumed it was "just the flaky tests".

Three of the 12 tests are flaky. Each one fails for a different reason. A single \`npm test\`
will probably pass, so you'll need to run the suite many times to see the failures. For example:

~~~
for i in $(seq 1 50); do node --test 2>&1 | grep -E "^# fail [1-9]"; done
~~~

## What a good fix looks like

- The cause of each flaky test, explained precisely enough that a teammate could spot the same
  bug elsewhere.
- Fixed at the cause, in the test or in the code, whichever is actually wrong.
- Evidence that the suite is now stable.

Retries, longer timeouts, and running tests one at a time don't count as fixes.
`;

const starterPackageJson = `{
  "name": "pickup-reminders",
  "version": "1.4.2",
  "private": true,
  "description": "Sends SMS reminders for click-and-collect orders that are ready for pickup",
  "main": "src/notifier.js",
  "scripts": {
    "test": "node --test"
  },
  "engines": {
    "node": ">=20"
  }
}
`;

const remindersJs = `'use strict';

const store = require('./store');

const REMINDER_DELAY_S = 24 * 60 * 60; // remind customers one day after the order is ready

function formatMessage(order, customer) {
  return \`Hi \${customer.firstName}, your order \${order.id} is ready for pickup at \${order.storeName}. Reply STOP to opt out.\`;
}

/**
 * Schedules a pickup reminder for an order that just became ready.
 * Returns the stored reminder, or null if the customer has not opted in to SMS.
 */
async function scheduleReminder(order, { customers }) {
  const customer = await customers.find(order.customerId);
  if (!customer) throw new Error(\`Unknown customer \${order.customerId}\`);
  if (!customer.smsOptIn) return null;

  const sendAt = Math.floor(Date.now() / 1000) + REMINDER_DELAY_S;
  return store.addReminder({
    orderId: order.id,
    customerId: customer.id,
    phone: customer.phone,
    sendAt,
    message: formatMessage(order, customer),
  });
}

module.exports = { scheduleReminder, formatMessage, REMINDER_DELAY_S };
`;

const storeJs = `'use strict';

// Reminder storage. In production this module wraps the reminders table; this in-memory
// version is what local dev and the test suite use.

const reminders = new Map(); // id -> reminder
let nextId = 1;

function addReminder({ orderId, customerId, phone, sendAt, message }) {
  for (const r of reminders.values()) {
    if (r.orderId === orderId && r.status === 'pending') {
      throw new Error(\`Order \${orderId} already has a pending reminder (\${r.id})\`);
    }
  }
  const reminder = { id: \`rem_\${nextId++}\`, orderId, customerId, phone, sendAt, message, status: 'pending', sentAt: null };
  reminders.set(reminder.id, reminder);
  return { ...reminder };
}

function markSent(id, sentAt = Math.floor(Date.now() / 1000)) {
  const reminder = reminders.get(id);
  if (!reminder) throw new Error(\`No reminder \${id}\`);
  reminder.status = 'sent';
  reminder.sentAt = sentAt;
}

function getReminder(id) {
  const reminder = reminders.get(id);
  return reminder ? { ...reminder } : null;
}

/** Pending reminders, optionally for one customer and/or due at or before \`dueBefore\` (epoch seconds). */
function listPending({ customerId, dueBefore } = {}) {
  return [...reminders.values()]
    .filter((r) => r.status === 'pending')
    .filter((r) => customerId === undefined || r.customerId === customerId)
    .filter((r) => dueBefore === undefined || r.sendAt <= dueBefore)
    .map((r) => ({ ...r }));
}

module.exports = { addReminder, markSent, getReminder, listPending };
`;

const notifierJs = `'use strict';

const store = require('./store');

/**
 * Sends every pending reminder that is due and marks it sent.
 * Runs every minute from the scheduler. Returns how many reminders were due.
 */
async function sendDueReminders(gateway, nowS = Math.floor(Date.now() / 1000)) {
  const due = store.listPending({ dueBefore: nowS });
  due.forEach(async (reminder) => {
    await gateway.send(reminder.phone, reminder.message);
    store.markSent(reminder.id);
  });
  return due.length;
}

module.exports = { sendDueReminders };
`;

const customerDirectoryJs = `'use strict';

// Stand-in for the customer profile service. Lookups take 50-140 ms, like the real service
// does from our CI runners, so code that awaits it is exercised realistically.

const CUSTOMERS = [
  { id: 'cus_1001', firstName: 'Ana', phone: '+13125550101', smsOptIn: true },
  { id: 'cus_1002', firstName: 'Ben', phone: '+13125550102', smsOptIn: true },
  { id: 'cus_1003', firstName: 'Chioma', phone: '+13125550103', smsOptIn: false },
  { id: 'cus_1004', firstName: 'Dev', phone: '+13125550104', smsOptIn: true },
  { id: 'cus_1005', firstName: 'Elena', phone: '+13125550105', smsOptIn: true },
];

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function createCustomerDirectory({ minLatencyMs = 50, maxLatencyMs = 140 } = {}) {
  return {
    async find(customerId) {
      await delay(minLatencyMs + Math.random() * (maxLatencyMs - minLatencyMs));
      return CUSTOMERS.find((c) => c.id === customerId) || null;
    },
  };
}

module.exports = { createCustomerDirectory };
`;

const smsGatewayJs = `'use strict';

// Fake SMS gateway used in local dev and tests. Delivery takes 20-105 ms, which matches
// the provider's sandbox. Sent messages are recorded in \`outbox\`.

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function createFakeGateway({ minLatencyMs = 20, maxLatencyMs = 105 } = {}) {
  const outbox = [];
  return {
    outbox,
    async send(to, body) {
      await delay(minLatencyMs + Math.random() * (maxLatencyMs - minLatencyMs));
      outbox.push({ to, body });
      return { messageId: \`msg_\${outbox.length}\` };
    },
  };
}

module.exports = { createFakeGateway };
`;

const remindersTestJs = `'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { scheduleReminder, formatMessage, REMINDER_DELAY_S } = require('../src/reminders');
const { createCustomerDirectory } = require('../src/customer-directory');

const customers = createCustomerDirectory();

test('formats the pickup message with the first name and store', () => {
  const msg = formatMessage({ id: 'ord_7310', storeName: 'Juniper Market Logan Square' }, { firstName: 'Ana' });
  assert.equal(msg, 'Hi Ana, your order ord_7310 is ready for pickup at Juniper Market Logan Square. Reply STOP to opt out.');
});

test('does not schedule a reminder for a customer who opted out of SMS', async () => {
  const result = await scheduleReminder({ id: 'ord_7311', customerId: 'cus_1003', storeName: 'Juniper Market Pilsen' }, { customers });
  assert.equal(result, null);
});

test('rejects an order for an unknown customer', async () => {
  await assert.rejects(
    scheduleReminder({ id: 'ord_7312', customerId: 'cus_9999', storeName: 'Juniper Market Pilsen' }, { customers }),
    /Unknown customer cus_9999/,
  );
});

test('schedules the reminder 24 hours from now', async () => {
  const expected = Math.floor(Date.now() / 1000) + REMINDER_DELAY_S;
  const reminder = await scheduleReminder(
    { id: 'ord_7313', customerId: 'cus_1001', storeName: 'Juniper Market Logan Square' },
    { customers },
  );
  assert.equal(reminder.sendAt, expected);
  assert.equal(reminder.phone, '+13125550101');
});
`;

const storeTestJs = `'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const store = require('../src/store');

// Random IDs so the tests don't depend on any particular fixture data.
function makeReminder(overrides = {}) {
  return {
    orderId: \`ord_\${10000 + Math.floor(Math.random() * 90000)}\`,
    customerId: \`cus_\${1001 + Math.floor(Math.random() * 20)}\`,
    phone: '+13125550199',
    sendAt: 1_790_000_000,
    message: 'Your order is ready for pickup.',
    ...overrides,
  };
}

test('adds a reminder as pending', () => {
  const reminder = store.addReminder(makeReminder());
  assert.equal(reminder.status, 'pending');
  assert.match(reminder.id, /^rem_\\d+$/);
});

test('refuses a second pending reminder for the same order', () => {
  const input = makeReminder();
  store.addReminder(input);
  assert.throws(() => store.addReminder(input), /already has a pending reminder/);
});

test('marks a reminder as sent', () => {
  const reminder = store.addReminder(makeReminder());
  store.markSent(reminder.id, 1_790_000_100);
  const saved = store.getReminder(reminder.id);
  assert.equal(saved.status, 'sent');
  assert.equal(saved.sentAt, 1_790_000_100);
});

test('lists pending reminders for one customer', () => {
  const input = makeReminder();
  store.addReminder(input);
  const pending = store.listPending({ customerId: input.customerId });
  assert.equal(pending.length, 1);
  assert.equal(pending[0].orderId, input.orderId);
});

test('filters pending reminders by due time', () => {
  const due = store.addReminder(makeReminder({ sendAt: 1_000 }));
  const ids = store.listPending({ dueBefore: 1_000 }).map((r) => r.id);
  assert.deepEqual(ids, [due.id]);
});
`;

const notifierTestJs = `'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const store = require('../src/store');
const { sendDueReminders } = require('../src/notifier');
const { createFakeGateway } = require('../src/sms-gateway');

const NOW = 1_790_000_000;

test('does nothing when no reminders exist', async () => {
  const gateway = createFakeGateway();
  assert.equal(await sendDueReminders(gateway, NOW), 0);
  assert.equal(gateway.outbox.length, 0);
});

test('does not send reminders that are not due yet', async () => {
  const gateway = createFakeGateway();
  store.addReminder({ orderId: 'ord_8001', customerId: 'cus_1002', phone: '+13125550102', sendAt: NOW + 3600, message: 'Later' });
  assert.equal(await sendDueReminders(gateway, NOW), 0);
  assert.equal(gateway.outbox.length, 0);
});

test('sends every due reminder and marks it sent', async () => {
  const gateway = createFakeGateway();
  const a = store.addReminder({ orderId: 'ord_8002', customerId: 'cus_1004', phone: '+13125550104', sendAt: NOW - 60, message: 'Ready A' });
  const b = store.addReminder({ orderId: 'ord_8003', customerId: 'cus_1005', phone: '+13125550105', sendAt: NOW - 30, message: 'Ready B' });

  const count = await sendDueReminders(gateway, NOW);
  await new Promise((resolve) => setTimeout(resolve, 100)); // give the gateway a moment

  assert.equal(count, 2);
  assert.deepEqual(gateway.outbox.map((m) => m.body).sort(), ['Ready A', 'Ready B']);
  assert.equal(store.getReminder(a.id).status, 'sent');
  assert.equal(store.getReminder(b.id).status, 'sent');
});
`;

const ciLogTxt = `ci-runner · pickup-reminders · branch main · last 15 runs
(excerpt: passing runs collapsed, failing runs show the test reporter output)

#1182  2026-06-15 16:02 UTC  a41c9e0  "Add Pilsen store to message templates"     PASSED  1m12s
#1183  2026-06-15 17:40 UTC  a41c9e0  (re-run)                                     PASSED  1m09s
#1184  2026-06-15 21:15 UTC  7be2d13  "Bump node to 22 in CI image"                PASSED  1m14s
#1185  2026-06-16 09:31 UTC  0c58f6a  "Log reminder ids on send"                   PASSED  1m10s
#1186  2026-06-16 14:22 UTC  e93f201  "Copy edit: pickup message"                  FAILED  1m11s

  ✖ schedules the reminder 24 hours from now (131.402ms)
    AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
    + actual - expected

    + 1781706128
    - 1781706127
               ^

        at TestContext.<anonymous> (/build/pickup-reminders/test/reminders.test.js:33:10)

  ℹ tests 12
  ℹ pass 11
  ℹ fail 1

#1187  2026-06-16 14:31 UTC  e93f201  (re-run)                                     PASSED  1m08s
#1188  2026-06-16 18:05 UTC  5d0e7b4  "Skip reminders for cancelled orders"        PASSED  1m13s
#1189  2026-06-17 09:04 UTC  91fa3cc  "Retry SMS send once on 503"                 FAILED  1m15s

  ✖ sends every due reminder and marks it sent (104.877ms)
    AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
    + actual - expected

      [
    -   'Ready A',
        'Ready B'
      ]

        at TestContext.<anonymous> (/build/pickup-reminders/test/notifier.test.js:33:10)

  ℹ tests 12
  ℹ pass 11
  ℹ fail 1

#1190  2026-06-17 09:12 UTC  91fa3cc  (re-run)                                     PASSED  1m10s
#1191  2026-06-17 13:47 UTC  2f6d8a1  "Store sentAt on markSent"                   PASSED  1m09s
#1192  2026-06-17 16:20 UTC  c07e5b9  "README: local setup"                        FAILED  1m07s

  ✖ lists pending reminders for one customer (0.611ms)
    AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:

    2 !== 1

        at TestContext.<anonymous> (/build/pickup-reminders/test/store.test.js:43:10)

  ℹ tests 12
  ℹ pass 11
  ℹ fail 1

#1193  2026-06-17 16:24 UTC  c07e5b9  (re-run)                                     PASSED  1m11s
#1194  2026-06-18 10:02 UTC  8ab4e60  "Quiet hours config (off by default)"        PASSED  1m12s
#1195  2026-06-18 15:38 UTC  d3f9c21  "Upgrade test fixtures"                      PASSED  1m10s
#1196  2026-06-18 19:55 UTC  d3f9c21  (nightly)                                    PASSED  1m11s

Summary: 3 of 15 runs failed, each time on a different test, and every failure passed on re-run
with no code change.
`;

const strongNotes = `### What I built

I fixed all three flaky tests at their cause. All changes are in \`fixes.patch\`, with a stress script and its raw output. Before the fixes, 58 of 300 looped runs failed. After them, 0 of 200 did.

### Key decisions & trade-offs

- **Clock:** the test read \`Date.now()\` before an awaited 50-140 ms lookup and the code read it after, so a second boundary in between made them differ by one. I injected \`now\` into \`scheduleReminder\` and pinned the test to 900 ms before a boundary, the worst case.
- **Shared state:** \`store.js\` keeps a module-level \`Map\` that no test reset, and random customer IDs (1 of 20) made a collision with leftover reminders happen in about 10% of runs. I added \`resetForTests()\` in \`beforeEach\` and made the fixtures deterministic. A reset hook is less elegant than injecting a store everywhere, but it is a much smaller change.
- **Async race:** \`forEach(async ...)\` discards the promises, so \`sendDueReminders\` resolved before any SMS was sent. That is a production bug, not just a test bug. I switched to \`await Promise.all(...)\`, deleted the 100 ms sleep, and added a slow-gateway test that fails every time against the old code.

### What I'd do with more time

Add a lint rule against \`forEach\` with async callbacks, and run the stress loop nightly in CI so a new flaky test gets caught within a day.`;

const strongReadme = `# Flaky test fixes: pickup-reminders

Three tests were flaky, each for a different reason. Before: **58 of 300** looped runs failed.
After: **0 of 200**. All changes are in \`fixes.patch\`; \`scripts/stress.sh\` is the loop I used,
and \`stress-results.txt\` has the raw output.

## 1. \`schedules the reminder 24 hours from now\`: wall clock read twice

The test computes \`expected\` from \`Date.now()\`, then calls \`scheduleReminder\`, which **awaits a
50-140 ms customer lookup** and only then reads \`Date.now()\` again. When a second boundary
falls inside that await, \`sendAt\` is one second later than \`expected\`. That's roughly the
lookup time divided by 1,000 ms, so about 1 run in 10, which matches the CI log
(\`1781706128 !== 1781706127\`).

**Fix:** \`scheduleReminder\` takes an injectable \`now\` (default \`Date.now\`). The test pins it to
900 ms before a second boundary, the worst case, and asserts the exact timestamp.

## 2. \`lists pending reminders for one customer\`: shared module state

\`src/store.js\` keeps reminders in a module-level \`Map\` that no test resets. The fixture picks
a random customer from 20 IDs, and two earlier tests leave pending reminders behind. If either
drew the same customer, the list has 2 entries instead of 1: 1 - (19/20)² ≈ 10% of runs.

**Fix:** \`store.resetForTests()\` runs in \`beforeEach\` in both test files that use the store, and
the fixture IDs are deterministic, so a failure reproduces from the test name alone. I added a
test for the filter itself, using two customers.

## 3. \`sends every due reminder and marks it sent\`: un-awaited async work

\`sendDueReminders\` used \`due.forEach(async (r) => { await gateway.send(...) })\`. \`forEach\`
throws away the promises its callback returns, so the function **resolved before any SMS was
sent**. The test hid this with a 100 ms sleep, and the fake gateway takes 20-105 ms, so the test
failed whenever a send (plus timer slop) ran past the sleep.

This is a production bug too: the scheduler reported reminders as sent before they were, and a
gateway error became an unhandled rejection instead of reaching the caller.

**Fix:** \`await Promise.all(due.map(...))\`, and the sleep is gone. A new test uses a gateway with
150-200 ms of latency and fails every time against the old code.

## Checking for more

I searched for other \`forEach(async\`, module-level state and \`Date.now()\` in tests. None left.
`;

const strongPatch = `diff --git a/src/notifier.js b/src/notifier.js
--- a/src/notifier.js
+++ b/src/notifier.js
@@ -8,10 +8,14 @@
  */
 async function sendDueReminders(gateway, nowS = Math.floor(Date.now() / 1000)) {
   const due = store.listPending({ dueBefore: nowS });
-  due.forEach(async (reminder) => {
-    await gateway.send(reminder.phone, reminder.message);
-    store.markSent(reminder.id);
-  });
+  // forEach ignores the promises its callback returns, so this function used to return
+  // before any SMS was sent. Wait for every send (in parallel) before reporting.
+  await Promise.all(
+    due.map(async (reminder) => {
+      await gateway.send(reminder.phone, reminder.message);
+      store.markSent(reminder.id);
+    }),
+  );
   return due.length;
 }
 
diff --git a/src/reminders.js b/src/reminders.js
--- a/src/reminders.js
+++ b/src/reminders.js
@@ -11,13 +11,14 @@
 /**
  * Schedules a pickup reminder for an order that just became ready.
  * Returns the stored reminder, or null if the customer has not opted in to SMS.
+ * \`now\` (epoch ms) is injectable so tests do not depend on the wall clock.
  */
-async function scheduleReminder(order, { customers }) {
+async function scheduleReminder(order, { customers, now = Date.now }) {
   const customer = await customers.find(order.customerId);
   if (!customer) throw new Error(\`Unknown customer \${order.customerId}\`);
   if (!customer.smsOptIn) return null;
 
-  const sendAt = Math.floor(Date.now() / 1000) + REMINDER_DELAY_S;
+  const sendAt = Math.floor(now() / 1000) + REMINDER_DELAY_S;
   return store.addReminder({
     orderId: order.id,
     customerId: customer.id,
diff --git a/src/store.js b/src/store.js
--- a/src/store.js
+++ b/src/store.js
@@ -38,4 +38,10 @@
     .map((r) => ({ ...r }));
 }
 
-module.exports = { addReminder, markSent, getReminder, listPending };
+/** Empties the store. For tests only: each test should start from a known state. */
+function resetForTests() {
+  reminders.clear();
+  nextId = 1;
+}
+
+module.exports = { addReminder, markSent, getReminder, listPending, resetForTests };
diff --git a/test/notifier.test.js b/test/notifier.test.js
--- a/test/notifier.test.js
+++ b/test/notifier.test.js
@@ -1,6 +1,6 @@
 'use strict';
 
-const { test } = require('node:test');
+const { test, beforeEach } = require('node:test');
 const assert = require('node:assert/strict');
 const store = require('../src/store');
 const { sendDueReminders } = require('../src/notifier');
@@ -8,6 +8,8 @@
 
 const NOW = 1_790_000_000;
 
+beforeEach(() => store.resetForTests());
+
 test('does nothing when no reminders exist', async () => {
   const gateway = createFakeGateway();
   assert.equal(await sendDueReminders(gateway, NOW), 0);
@@ -27,10 +29,17 @@
   const b = store.addReminder({ orderId: 'ord_8003', customerId: 'cus_1005', phone: '+13125550105', sendAt: NOW - 30, message: 'Ready B' });
 
   const count = await sendDueReminders(gateway, NOW);
-  await new Promise((resolve) => setTimeout(resolve, 100)); // give the gateway a moment
 
   assert.equal(count, 2);
   assert.deepEqual(gateway.outbox.map((m) => m.body).sort(), ['Ready A', 'Ready B']);
   assert.equal(store.getReminder(a.id).status, 'sent');
   assert.equal(store.getReminder(b.id).status, 'sent');
+});
+
+test('resolves only after every due reminder has been sent', async () => {
+  // Slow gateway: if sendDueReminders returned early, the outbox would still be empty here.
+  const gateway = createFakeGateway({ minLatencyMs: 150, maxLatencyMs: 200 });
+  store.addReminder({ orderId: 'ord_8004', customerId: 'cus_1001', phone: '+13125550101', sendAt: NOW - 5, message: 'Ready C' });
+  await sendDueReminders(gateway, NOW);
+  assert.equal(gateway.outbox.length, 1);
 });
diff --git a/test/reminders.test.js b/test/reminders.test.js
--- a/test/reminders.test.js
+++ b/test/reminders.test.js
@@ -25,11 +25,12 @@
 });
 
 test('schedules the reminder 24 hours from now', async () => {
-  const expected = Math.floor(Date.now() / 1000) + REMINDER_DELAY_S;
+  const now = () => Date.UTC(2026, 6, 14, 17, 59, 59, 900); // 900 ms before a second boundary
   const reminder = await scheduleReminder(
     { id: 'ord_7313', customerId: 'cus_1001', storeName: 'Juniper Market Logan Square' },
-    { customers },
+    { customers, now },
   );
-  assert.equal(reminder.sendAt, expected);
+  assert.equal(reminder.sendAt, Date.UTC(2026, 6, 15, 17, 59, 59) / 1000);
+  assert.equal(reminder.sendAt - Math.floor(now() / 1000), REMINDER_DELAY_S);
   assert.equal(reminder.phone, '+13125550101');
 });
diff --git a/test/store.test.js b/test/store.test.js
--- a/test/store.test.js
+++ b/test/store.test.js
@@ -1,14 +1,18 @@
 'use strict';
 
-const { test } = require('node:test');
+const { test, beforeEach } = require('node:test');
 const assert = require('node:assert/strict');
 const store = require('../src/store');
 
-// Random IDs so the tests don't depend on any particular fixture data.
+beforeEach(() => store.resetForTests());
+
+// Deterministic IDs: a failure must be reproducible from the test name alone.
+let seq = 0;
 function makeReminder(overrides = {}) {
+  seq += 1;
   return {
-    orderId: \`ord_\${10000 + Math.floor(Math.random() * 90000)}\`,
-    customerId: \`cus_\${1001 + Math.floor(Math.random() * 20)}\`,
+    orderId: \`ord_\${10000 + seq}\`,
+    customerId: 'cus_1001',
     phone: '+13125550199',
     sendAt: 1_790_000_000,
     message: 'Your order is ready for pickup.',
@@ -48,4 +52,11 @@
   const due = store.addReminder(makeReminder({ sendAt: 1_000 }));
   const ids = store.listPending({ dueBefore: 1_000 }).map((r) => r.id);
   assert.deepEqual(ids, [due.id]);
+});
+
+test('a pending reminder for another customer is not listed', () => {
+  store.addReminder(makeReminder({ customerId: 'cus_1002' }));
+  const mine = makeReminder({ customerId: 'cus_1001' });
+  store.addReminder(mine);
+  assert.deepEqual(store.listPending({ customerId: 'cus_1001' }).map((r) => r.orderId), [mine.orderId]);
 });
`;

const strongStressSh = `#!/bin/sh
# Runs the whole suite N times (default 200) and prints a tally of failing tests.
# Usage: sh scripts/stress.sh [runs]
runs=\${1:-200}
fails=0
: > .stress-failures.txt
i=1
while [ "$i" -le "$runs" ]; do
  if ! node --test --test-reporter=spec > .stress-run.txt 2>&1; then
    fails=$((fails + 1))
    grep -E '^✖ ' .stress-run.txt | grep -v 'failing tests' | sed 's/ ([0-9.]*ms)$//' | sort -u >> .stress-failures.txt
  fi
  i=$((i + 1))
done
echo "$runs runs, $fails failed"
sort .stress-failures.txt | uniq -c | sort -rn
rm -f .stress-run.txt .stress-failures.txt
`;

const strongStressResults = `$ git stash && sh scripts/stress.sh 300      # before: original code and tests
300 runs, 58 failed
     26 ✖ lists pending reminders for one customer
     23 ✖ schedules the reminder 24 hours from now
     17 ✖ sends every due reminder and marks it sent

$ git stash pop && sh scripts/stress.sh 200  # after: fixes.patch applied
200 runs, 0 failed

$ git stash -- src/notifier.js && node --test --test-reporter=spec test/notifier.test.js   # new tests vs. old notifier
✖ sends every due reminder and marks it sent (1.790ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
  + actual - expected

  + []
  - [
  -   'Ready A',
  -   'Ready B'
  - ]

✖ resolves only after every due reminder has been sent (0.222ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:

  0 !== 1
`;

const solidNotes = `### What I built

I fixed the three flaky tests: the 24-hour scheduling test, the per-customer listing test and the notifier test. I reproduced them by running the suite 50 times in a loop, then checked the fixes with 20 more runs, which all passed.

### Key decisions & trade-offs

- **Clock:** the expected value came from \`Date.now()\` before the customer lookup and the real one from after it, so they sometimes landed in different seconds. I added an optional \`clock\` parameter to \`scheduleReminder\` and the test passes a fixed time.
- **Shared state:** the store's \`Map\` lives at module level, so reminders from earlier tests were still there, and random customer IDs sometimes collided. I added \`store.clear()\` in a \`beforeEach\`. I kept the random IDs because the reset makes them safe.
- **Notifier:** this was a timing issue, because the test sometimes checked before the messages were sent. Switching the \`forEach\` to a \`for...of\` with \`await\` fixed it.
- I chose sequential sends in the notifier because it's the simplest change, though it's slower than sending in parallel.

### What I'd do with more time

Run the suite more times to be sure, and look into exactly why the \`forEach\` version didn't wait.`;

const solidReadme = `# Fixing the flaky tests

I ran the suite in a loop (50 runs) to reproduce the failures and saw three different tests
fail: the same three as in \`ci-log.txt\`. I fixed all three, and the suite then passed 20 runs
in a row.

## 1. Reminder scheduled 24 hours from now (\`test/reminders.test.js\`)

The test calculated the expected \`sendAt\` from \`Date.now()\` before calling
\`scheduleReminder\`, and the function calls \`Date.now()\` again after it awaits the customer
lookup. The lookup takes 50-140 ms, so sometimes the clock moves into the next second
in between and the two values are off by one.

**Fix:** \`scheduleReminder\` now takes an optional \`clock\` function. The test passes a fixed time
and checks the exact expected value, so the real clock no longer matters.

## 2. Pending reminders for one customer (\`test/store.test.js\`)

The store keeps its reminders in a \`Map\` at module level, so everything earlier tests add is
still there. The fixtures use random customer IDs, so when an earlier test happened to pick
the same customer, the list had two reminders instead of one.

**Fix:** added \`store.clear()\` and call it in \`beforeEach\`, so every store test starts empty.

## 3. Sending due reminders (\`test/notifier.test.js\`)

This one was a timing issue. Sometimes the test checked the outbox before the messages
had been sent.

**Fix:** I changed the \`forEach\` in \`sendDueReminders\` to a \`for...of\` loop with \`await\`, so
each message is sent before the function returns. The test passes every time now.

## Verification

~~~
for i in $(seq 1 20); do node --test 2>&1 | grep -E "^# fail"; done
~~~

All 20 runs showed \`# fail 0\`.
`;

const solidRemindersJs = `'use strict';

const store = require('./store');

const REMINDER_DELAY_S = 24 * 60 * 60; // remind customers one day after the order is ready

function formatMessage(order, customer) {
  return \`Hi \${customer.firstName}, your order \${order.id} is ready for pickup at \${order.storeName}. Reply STOP to opt out.\`;
}

/**
 * Schedules a pickup reminder for an order that just became ready.
 * Returns the stored reminder, or null if the customer has not opted in to SMS.
 */
async function scheduleReminder(order, { customers, clock = () => Date.now() }) {
  const customer = await customers.find(order.customerId);
  if (!customer) throw new Error(\`Unknown customer \${order.customerId}\`);
  if (!customer.smsOptIn) return null;

  const sendAt = Math.floor(clock() / 1000) + REMINDER_DELAY_S;
  return store.addReminder({
    orderId: order.id,
    customerId: customer.id,
    phone: customer.phone,
    sendAt,
    message: formatMessage(order, customer),
  });
}

module.exports = { scheduleReminder, formatMessage, REMINDER_DELAY_S };
`;

const solidStoreJs = `'use strict';

// Reminder storage. In production this module wraps the reminders table; this in-memory
// version is what local dev and the test suite use.

const reminders = new Map(); // id -> reminder
let nextId = 1;

function addReminder({ orderId, customerId, phone, sendAt, message }) {
  for (const r of reminders.values()) {
    if (r.orderId === orderId && r.status === 'pending') {
      throw new Error(\`Order \${orderId} already has a pending reminder (\${r.id})\`);
    }
  }
  const reminder = { id: \`rem_\${nextId++}\`, orderId, customerId, phone, sendAt, message, status: 'pending', sentAt: null };
  reminders.set(reminder.id, reminder);
  return { ...reminder };
}

function markSent(id, sentAt = Math.floor(Date.now() / 1000)) {
  const reminder = reminders.get(id);
  if (!reminder) throw new Error(\`No reminder \${id}\`);
  reminder.status = 'sent';
  reminder.sentAt = sentAt;
}

function getReminder(id) {
  const reminder = reminders.get(id);
  return reminder ? { ...reminder } : null;
}

/** Pending reminders, optionally for one customer and/or due at or before \`dueBefore\` (epoch seconds). */
function listPending({ customerId, dueBefore } = {}) {
  return [...reminders.values()]
    .filter((r) => r.status === 'pending')
    .filter((r) => customerId === undefined || r.customerId === customerId)
    .filter((r) => dueBefore === undefined || r.sendAt <= dueBefore)
    .map((r) => ({ ...r }));
}

function clear() {
  reminders.clear();
}

module.exports = { addReminder, markSent, getReminder, listPending, clear };
`;

const solidNotifierJs = `'use strict';

const store = require('./store');

/**
 * Sends every pending reminder that is due and marks it sent.
 * Runs every minute from the scheduler. Returns how many reminders were due.
 */
async function sendDueReminders(gateway, nowS = Math.floor(Date.now() / 1000)) {
  const due = store.listPending({ dueBefore: nowS });
  for (const reminder of due) {
    await gateway.send(reminder.phone, reminder.message);
    store.markSent(reminder.id);
  }
  return due.length;
}

module.exports = { sendDueReminders };
`;

const solidRemindersTestJs = `'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { scheduleReminder, formatMessage, REMINDER_DELAY_S } = require('../src/reminders');
const { createCustomerDirectory } = require('../src/customer-directory');

const customers = createCustomerDirectory();

test('formats the pickup message with the first name and store', () => {
  const msg = formatMessage({ id: 'ord_7310', storeName: 'Juniper Market Logan Square' }, { firstName: 'Ana' });
  assert.equal(msg, 'Hi Ana, your order ord_7310 is ready for pickup at Juniper Market Logan Square. Reply STOP to opt out.');
});

test('does not schedule a reminder for a customer who opted out of SMS', async () => {
  const result = await scheduleReminder({ id: 'ord_7311', customerId: 'cus_1003', storeName: 'Juniper Market Pilsen' }, { customers });
  assert.equal(result, null);
});

test('rejects an order for an unknown customer', async () => {
  await assert.rejects(
    scheduleReminder({ id: 'ord_7312', customerId: 'cus_9999', storeName: 'Juniper Market Pilsen' }, { customers }),
    /Unknown customer cus_9999/,
  );
});

test('schedules the reminder 24 hours from now', async () => {
  const fixedNow = Date.UTC(2026, 9, 1, 12, 0, 0);
  const expected = fixedNow / 1000 + REMINDER_DELAY_S;
  const reminder = await scheduleReminder(
    { id: 'ord_7313', customerId: 'cus_1001', storeName: 'Juniper Market Logan Square' },
    { customers, clock: () => fixedNow },
  );
  assert.equal(reminder.sendAt, expected);
  assert.equal(reminder.phone, '+13125550101');
});
`;

const solidStoreTestJs = `'use strict';

const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const store = require('../src/store');

// Each test starts with an empty store so reminders from earlier tests don't leak in.
beforeEach(() => store.clear());

// Random IDs so the tests don't depend on any particular fixture data.
function makeReminder(overrides = {}) {
  return {
    orderId: \`ord_\${10000 + Math.floor(Math.random() * 90000)}\`,
    customerId: \`cus_\${1001 + Math.floor(Math.random() * 20)}\`,
    phone: '+13125550199',
    sendAt: 1_790_000_000,
    message: 'Your order is ready for pickup.',
    ...overrides,
  };
}

test('adds a reminder as pending', () => {
  const reminder = store.addReminder(makeReminder());
  assert.equal(reminder.status, 'pending');
  assert.match(reminder.id, /^rem_\\d+$/);
});

test('refuses a second pending reminder for the same order', () => {
  const input = makeReminder();
  store.addReminder(input);
  assert.throws(() => store.addReminder(input), /already has a pending reminder/);
});

test('marks a reminder as sent', () => {
  const reminder = store.addReminder(makeReminder());
  store.markSent(reminder.id, 1_790_000_100);
  const saved = store.getReminder(reminder.id);
  assert.equal(saved.status, 'sent');
  assert.equal(saved.sentAt, 1_790_000_100);
});

test('lists pending reminders for one customer', () => {
  const input = makeReminder();
  store.addReminder(input);
  const pending = store.listPending({ customerId: input.customerId });
  assert.equal(pending.length, 1);
  assert.equal(pending[0].orderId, input.orderId);
});

test('filters pending reminders by due time', () => {
  const due = store.addReminder(makeReminder({ sendAt: 1_000 }));
  const ids = store.listPending({ dueBefore: 1_000 }).map((r) => r.id);
  assert.deepEqual(ids, [due.id]);
});
`;

const weakNotes = `### What I built

I made the test suite more stable on CI. I added a retry helper that re-runs a failing test up to 3 times, raised the wait in the notifier test from 100 ms to 1000 ms, and changed \`npm test\` to run with \`--test-concurrency=1\` and a longer timeout.

### Key decisions & trade-offs

- The CI log shows each failure passes on re-run, so the tests aren't really broken. They're sensitive to timing on slow CI machines, and retrying them is the quickest fix.
- I didn't change any code in \`src/\`, because the tests pass most of the time, so the code seems to work.
- A 1000 ms wait makes the suite about a second slower, but it's much more reliable.
- Running the test files one at a time means they don't compete for CPU on CI.

### What I'd do with more time

Run the suite more times to make sure it's stable, and maybe raise the retry count to 5 if it still fails sometimes.`;

const weakReadme = `# Flaky tests fix

The tests were failing randomly on CI. The CI runners are shared and slower than a laptop,
so timing-sensitive tests sometimes don't finish in time. I made the suite more robust to that.

## Changes

1. **Retries.** I added a small helper, \`test/helpers/retry.js\`, that re-runs a test body up to
   3 times before failing. I wrapped the two tests that failed most in the CI log:
   "schedules the reminder 24 hours from now" and "lists pending reminders for one customer".
2. **Longer wait in the notifier test.** The test waited 100 ms for the gateway. CI can be slower
   than that, so it now waits 1000 ms.
3. **No parallel test runs.** \`npm test\` now runs \`node --test --test-concurrency=1\` so test
   files don't compete for CPU, and has a 60-second timeout so slow runs don't get killed.

## Result

I ran \`npm test\` 10 times locally and it passed every time.

## Notes

This makes CI slower by about a second because of the longer wait. If it is still flaky,
the retry count can be raised to 5.
`;

const weakPackageJson = `{
  "name": "pickup-reminders",
  "version": "1.4.2",
  "private": true,
  "description": "Sends SMS reminders for click-and-collect orders that are ready for pickup",
  "main": "src/notifier.js",
  "scripts": {
    "test": "node --test --test-concurrency=1 --test-timeout=60000"
  },
  "engines": {
    "node": ">=20"
  }
}
`;

const weakRetryJs = `'use strict';

// Re-runs a flaky test body up to \`attempts\` times before failing.
// CI runners are slower and less predictable than laptops, so a test that
// fails once on CI is retried instead of failing the whole build.
function retry(fn, attempts = 3) {
  return async (t) => {
    let lastError;
    for (let i = 1; i <= attempts; i++) {
      try {
        return await fn(t);
      } catch (err) {
        lastError = err;
        if (i < attempts) console.log(\`  retrying "\${t.name}" (attempt \${i + 1} of \${attempts})\`);
      }
    }
    throw lastError;
  };
}

module.exports = { retry };
`;

const weakRemindersTestJs = `'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { scheduleReminder, formatMessage, REMINDER_DELAY_S } = require('../src/reminders');
const { createCustomerDirectory } = require('../src/customer-directory');
const { retry } = require('./helpers/retry');

const customers = createCustomerDirectory();

test('formats the pickup message with the first name and store', () => {
  const msg = formatMessage({ id: 'ord_7310', storeName: 'Juniper Market Logan Square' }, { firstName: 'Ana' });
  assert.equal(msg, 'Hi Ana, your order ord_7310 is ready for pickup at Juniper Market Logan Square. Reply STOP to opt out.');
});

test('does not schedule a reminder for a customer who opted out of SMS', async () => {
  const result = await scheduleReminder({ id: 'ord_7311', customerId: 'cus_1003', storeName: 'Juniper Market Pilsen' }, { customers });
  assert.equal(result, null);
});

test('rejects an order for an unknown customer', async () => {
  await assert.rejects(
    scheduleReminder({ id: 'ord_7312', customerId: 'cus_9999', storeName: 'Juniper Market Pilsen' }, { customers }),
    /Unknown customer cus_9999/,
  );
});

test('schedules the reminder 24 hours from now', retry(async () => {
  const expected = Math.floor(Date.now() / 1000) + REMINDER_DELAY_S;
  const reminder = await scheduleReminder(
    { id: 'ord_7313', customerId: 'cus_1001', storeName: 'Juniper Market Logan Square' },
    { customers },
  );
  assert.equal(reminder.sendAt, expected);
  assert.equal(reminder.phone, '+13125550101');
}));
`;

const weakStoreTestJs = `'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const store = require('../src/store');
const { retry } = require('./helpers/retry');

// Random IDs so the tests don't depend on any particular fixture data.
function makeReminder(overrides = {}) {
  return {
    orderId: \`ord_\${10000 + Math.floor(Math.random() * 90000)}\`,
    customerId: \`cus_\${1001 + Math.floor(Math.random() * 20)}\`,
    phone: '+13125550199',
    sendAt: 1_790_000_000,
    message: 'Your order is ready for pickup.',
    ...overrides,
  };
}

test('adds a reminder as pending', () => {
  const reminder = store.addReminder(makeReminder());
  assert.equal(reminder.status, 'pending');
  assert.match(reminder.id, /^rem_\\d+$/);
});

test('refuses a second pending reminder for the same order', () => {
  const input = makeReminder();
  store.addReminder(input);
  assert.throws(() => store.addReminder(input), /already has a pending reminder/);
});

test('marks a reminder as sent', () => {
  const reminder = store.addReminder(makeReminder());
  store.markSent(reminder.id, 1_790_000_100);
  const saved = store.getReminder(reminder.id);
  assert.equal(saved.status, 'sent');
  assert.equal(saved.sentAt, 1_790_000_100);
});

test('lists pending reminders for one customer', retry(() => {
  const input = makeReminder();
  store.addReminder(input);
  const pending = store.listPending({ customerId: input.customerId });
  assert.equal(pending.length, 1);
  assert.equal(pending[0].orderId, input.orderId);
}));

test('filters pending reminders by due time', () => {
  const due = store.addReminder(makeReminder({ sendAt: 1_000 }));
  const ids = store.listPending({ dueBefore: 1_000 }).map((r) => r.id);
  assert.deepEqual(ids, [due.id]);
});
`;

const weakNotifierTestJs = `'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const store = require('../src/store');
const { sendDueReminders } = require('../src/notifier');
const { createFakeGateway } = require('../src/sms-gateway');

const NOW = 1_790_000_000;

test('does nothing when no reminders exist', async () => {
  const gateway = createFakeGateway();
  assert.equal(await sendDueReminders(gateway, NOW), 0);
  assert.equal(gateway.outbox.length, 0);
});

test('does not send reminders that are not due yet', async () => {
  const gateway = createFakeGateway();
  store.addReminder({ orderId: 'ord_8001', customerId: 'cus_1002', phone: '+13125550102', sendAt: NOW + 3600, message: 'Later' });
  assert.equal(await sendDueReminders(gateway, NOW), 0);
  assert.equal(gateway.outbox.length, 0);
});

test('sends every due reminder and marks it sent', async () => {
  const gateway = createFakeGateway();
  const a = store.addReminder({ orderId: 'ord_8002', customerId: 'cus_1004', phone: '+13125550104', sendAt: NOW - 60, message: 'Ready A' });
  const b = store.addReminder({ orderId: 'ord_8003', customerId: 'cus_1005', phone: '+13125550105', sendAt: NOW - 30, message: 'Ready B' });

  const count = await sendDueReminders(gateway, NOW);
  await new Promise((resolve) => setTimeout(resolve, 1000)); // CI is slow: give the gateway plenty of time

  assert.equal(count, 2);
  assert.deepEqual(gateway.outbox.map((m) => m.body).sort(), ['Ready A', 'Ready B']);
  assert.equal(store.getReminder(a.id).status, 'sent');
  assert.equal(store.getReminder(b.id).status, 'sent');
});
`;

const mod: ChallengeModule = {
  challenge: {
    id: 'pr_flaky_tests',
    kind: 'practice',
    companyId: null,
    title: 'Fix a flaky test suite',
    summary: 'A Node service fails CI one run in five. Find the three flaky tests and fix them.',
    type: 'software',
    skills: ['JavaScript', 'Node.js', 'Debugging', 'Automated testing', 'Async programming'],
    classroomConcepts: [
      { concept: 'Race conditions and nondeterminism', course: 'Operating Systems' },
      { concept: 'Promises and the event loop', course: 'Web Application Development' },
      { concept: 'Test isolation and test doubles', course: 'Software Engineering' },
    ],
    difficulty: 'beginner',
    estHours: 3,
    brief: brief,
    deliverables: [
      'A fix for each of the three flaky tests, made at its root cause',
      'A short write-up per test: what varies between runs and why it changes the result',
      'Evidence the suite is stable, such as a few hundred looped runs before and after',
    ],
    rubric: [
      {
        id: 'root_cause',
        name: 'Root cause',
        description:
          'All three flaky tests are traced to a precise, distinct cause, naming exactly what varies between runs and why that changes the result.',
        weight: 35,
      },
      {
        id: 'fix_quality',
        name: 'Fix quality',
        description:
          'Each fix removes the nondeterminism at its source, in the code or the test, instead of hiding it with retries, sleeps or longer timeouts, and every test keeps its intent.',
        weight: 30,
      },
      {
        id: 'verification',
        name: 'Verification',
        description:
          'Stability is shown with hundreds of looped runs before and after, ideally plus a test that fails every time against the old code.',
        weight: 15,
      },
      {
        id: 'explanation',
        name: 'Explanation',
        description:
          'The write-up lets a teammate recognize each kind of flakiness elsewhere: what failed, why, how it was fixed and how the fix was verified.',
        weight: 20,
      },
    ],
    applicantCap: null,
    status: 'open',
    hiringFor: null,
    starterFiles: [
      { path: 'README.md', content: starterReadme },
      { path: 'package.json', content: starterPackageJson },
      { path: 'src/reminders.js', content: remindersJs },
      { path: 'src/store.js', content: storeJs },
      { path: 'src/notifier.js', content: notifierJs },
      { path: 'src/customer-directory.js', content: customerDirectoryJs },
      { path: 'src/sms-gateway.js', content: smsGatewayJs },
      { path: 'test/reminders.test.js', content: remindersTestJs },
      { path: 'test/store.test.js', content: storeTestJs },
      { path: 'test/notifier.test.js', content: notifierTestJs },
      { path: 'ci-log.txt', content: ciLogTxt },
    ],
    aiHints: {
      testing:
        'Whether you debug from evidence instead of guessing. A flaky test is a deterministic bug with a hidden input. The skill is finding that input, whether it is the clock, leftover state or an unawaited promise, and removing it rather than retrying until the test passes.',
      steps: [
        'Run the suite in a loop (50+ times) and tally which tests fail. Compare with ci-log.txt.',
        'For each flaky test, write down everything it depends on that is not fixed: time, randomness, state left by other tests, timers and latency.',
        'Make the failure happen on demand. Pin the input that varies and confirm the test fails every time.',
        'Fix the cause in the code or the test, whichever is actually wrong, and remove any sleeps that were hiding it.',
        'Re-run the loop a few hundred times and record the before and after counts.',
        'Write up each cause so a teammate could spot the same pattern in another codebase.',
      ],
      greatLooksLike:
        'A great submission names three distinct causes precisely, and each fix removes the source of the nondeterminism: control the clock, isolate the state, wait for the right promise. It notices when a test bug is really a production bug. It proves the result with hundreds of runs before and after, ideally plus a new test that fails every time against the old code.',
      pitfalls: [
        'Adding retries or longer timeouts, which hides the flakiness and can create new failures.',
        'Running with --test-concurrency=1 when the flaky tests are in the same file and already run in order.',
        'Calling a cause "a timing issue" without saying which two things race.',
        'Declaring victory after 10-20 runs when each failure shows up in only about 1 run in 10.',
        'Fixing the test while leaving a real bug in the code it was hiding.',
      ],
    },
    deadlineInDays: null,
    createdDaysAgo: 120,
    seed: { participants: 38, submissions: 24, scored: 24 },
  },
  templates: [
    {
      quality: 'strong',
      notes: strongNotes,
      files: [
        { path: 'README.md', content: strongReadme },
        { path: 'fixes.patch', content: strongPatch },
        { path: 'scripts/stress.sh', content: strongStressSh },
        { path: 'stress-results.txt', content: strongStressResults },
      ],
      feedback:
        'Excellent debugging. You pinned down all three causes precisely and fixed each one at the source: an injected clock, a store reset with deterministic fixtures, and awaiting every send instead of using forEach. Spotting that the forEach bug also affects production, and adding a slow-gateway test that fails every time against the old code, is exactly the instinct teams look for. Going from 58 failures in 300 runs to 0 in 200 is convincing, and as a stretch goal you could run the stress loop nightly in CI.',
      aiDisclosure:
        'Asked an AI assistant how node:test orders tests within a file and across files. I found the causes by looping the suite and wrote all the fixes myself.',
    },
    {
      quality: 'solid',
      notes: solidNotes,
      files: [
        { path: 'README.md', content: solidReadme },
        { path: 'src/reminders.js', content: solidRemindersJs },
        { path: 'src/store.js', content: solidStoreJs },
        { path: 'src/notifier.js', content: solidNotifierJs },
        { path: 'test/reminders.test.js', content: solidRemindersTestJs },
        { path: 'test/store.test.js', content: solidStoreTestJs },
      ],
      feedback:
        "Good fixes: all three tests are stable now, and your clock and shared-state explanations are precise. The third write-up stops at \"a timing issue\", so say what actually raced: forEach doesn't wait for async callbacks, so sendDueReminders resolved before any SMS was sent, and that means the 100 ms sleep in the test can go. Twenty clean runs is a good start, but for failures that show up about one run in ten, a few hundred runs is much stronger evidence.",
      aiDisclosure: 'Used an AI assistant to explain what beforeEach does in node:test. The debugging and fixes are mine.',
    },
    {
      quality: 'weak',
      notes: weakNotes,
      files: [
        { path: 'README.md', content: weakReadme },
        { path: 'package.json', content: weakPackageJson },
        { path: 'test/helpers/retry.js', content: weakRetryJs },
        { path: 'test/reminders.test.js', content: weakRemindersTestJs },
        { path: 'test/store.test.js', content: weakStoreTestJs },
        { path: 'test/notifier.test.js', content: weakNotifierTestJs },
      ],
      feedback:
        "The suite goes green more often, but the flakiness is hidden rather than fixed: retries, a 1-second sleep and --test-concurrency=1 don't change why any test fails, and the flaky tests in each file already run in order anyway. The retry on the clock test even creates a new failure, because the first attempt already saved the reminder, so the retry throws \"already has a pending reminder\". Try looping the suite a few hundred times, then ask what differs between a passing and a failing run of each test: the clock, leftover state or a promise nobody awaited.",
      aiDisclosure: 'None.',
    },
  ],
  scripted: [
    {
      challengeId: 'pr_flaky_tests',
      studentId: 'stu_maya',
      templateIndex: 1,
      submittedDaysAgo: 26,
      scores: { root_cause: 4, fix_quality: 5, verification: 4, explanation: 4 },
      feedback:
        "Nice work: all three fixes are correct and made at the cause: an injected clock, a store reset in beforeEach, and a for...of loop that awaits each send. Your clock and shared-state write-ups are precise, but the notifier bug is described only as \"a timing issue\". The real cause is that forEach ignores the promises its async callback returns, so sendDueReminders resolved before anything was sent, and that was a production bug too. You can also delete the 100 ms sleep you left in that test, and 20 clean runs is encouraging but not proof for a failure that showed up about one run in ten, so try a few hundred.",
    },
    {
      challengeId: 'pr_flaky_tests',
      studentId: 'stu_hana',
      templateIndex: 0,
      submittedDaysAgo: 70,
      scores: { root_cause: 5, fix_quality: 5, verification: 4, explanation: 4 },
      feedback:
        "Outstanding debugging. You named all three causes exactly (the Date.now() read on each side of the customer lookup, the module-level Map no test resets, and forEach dropping the async callbacks' promises) and fixed each one at the source, with a new slow-gateway test that fails every time against the old code. To make the verification airtight, compare the same number of runs before and after (you used 300 and 200) and run the loop in CI, not only locally. The write-up is clear, but the production impact of the forEach bug, where the scheduler reported sends that hadn't happened and gateway errors became unhandled rejections, deserves more than two sentences.",
    },
  ],
};

export default mod;
