import type { ChallengeModule } from '../lib.ts';

const brief = `## Context
Fernleaf Tea Co. is a six-person online tea shop that ships about 1,900 orders a month, 41% of them placed on phones. Last month the owner, Rosalind, got this email from a long-time customer: "I use a keyboard and a screen reader, and I couldn't get your Place order button to do anything. I ended up calling the shop." Checkout abandonment is already at 68%, and Rosalind suspects she is losing more customers than the ones who write in.

The checkout page was built two years ago by a freelancer and hasn't been touched since. Rosalind has a developer for one day next week and wants to know exactly what to fix first.

## The task
Audit \`checkout.html\` for accessibility problems and write it up so the developer can act on it.

1. Open the page in a browser and test it three ways: with the keyboard only, with your OS's built-in screen reader, and with a browser accessibility checker.
2. Log every issue in \`audit-template.md\`: what it is, where it is, the WCAG 2.2 success criterion it fails, a severity and a concrete fix.
3. Rank the issues so the developer knows what to do in their one day.
4. Write a short summary (under 200 words) that Rosalind, who isn't a developer, can read and understand.

## Constraints
- Time box: 3 hours.
- Use any browser, checker or screen reader. Don't rely on an automated checker alone: many of the worst problems here can only be found by hand.
- Audit against WCAG 2.2 Level A and AA. Level AAA is out of scope.
- You don't need to redesign the page or rewrite the whole file. Code snippets for your fixes are welcome.
- Only audit this page; the rest of the store is out of scope.
- AI tools are fine if you say how you used them. Check their WCAG citations yourself.

## What we provide
- \`checkout.html\`: the checkout page, one self-contained file with inline CSS and a little JavaScript. Images are intentionally missing.
- \`audit-template.md\`: the table to fill in, with the severity scale.
- \`README.md\`: how to run the page and a suggested testing routine.
`;

const checkoutHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Checkout | Fernleaf Tea Co.</title>
<style>
  * { box-sizing: border-box; }
  *:focus { outline: none; }
  body { margin: 0; font-family: Georgia, serif; color: #2b2b2b; background: #faf7f2; }
  .promo { background: #2f6b4f; color: #ffffff; text-align: center; padding: 10px 16px; font-size: 14px; }
  header { display: flex; align-items: center; padding: 16px 24px; border-bottom: 1px solid #e4ddd2; background: #ffffff; }
  header img { height: 40px; }
  main { max-width: 960px; margin: 0 auto; padding: 24px; display: grid; grid-template-columns: 1fr 340px; gap: 32px; }
  h1 { font-size: 28px; margin: 0 0 16px; }
  h2 { font-size: 18px; margin: 24px 0 12px; }
  .card { background: #ffffff; border: 1px solid #e4ddd2; border-radius: 8px; padding: 20px; }
  input, select { width: 100%; padding: 12px; margin-bottom: 12px; font-size: 16px; border: 1px solid #cfc6b8; border-radius: 6px; background: #ffffff; }
  input::placeholder { color: #b5b5b5; }
  .row { display: flex; gap: 12px; }
  .row > * { flex: 1; }
  .hint { color: #a3a3a3; font-size: 13px; margin: -6px 0 12px; }
  .field-label { font-size: 14px; margin-bottom: 4px; }
  .check { display: flex; gap: 8px; align-items: center; font-size: 14px; }
  .check input { width: auto; margin: 0; }
  .field.invalid input { border: 2px solid #e03131; }
  .error-box { color: #e03131; font-size: 14px; min-height: 20px; margin-bottom: 12px; }
  .btn-primary { background: #2f6b4f; color: #ffffff; text-align: center; padding: 16px; border-radius: 6px; font-size: 18px; cursor: pointer; }
  .btn-primary:hover { background: #24543e; }
  .item { display: flex; gap: 12px; align-items: center; padding: 12px 0; border-bottom: 1px solid #efe9df; }
  .item img { width: 56px; height: 56px; border-radius: 6px; background: #e4ddd2; }
  .item .name { flex: 1; font-size: 15px; }
  .remove { display: inline-block; width: 14px; height: 14px; line-height: 14px; font-size: 11px; text-align: center; color: #6b6b6b; text-decoration: none; }
  .totals div { display: flex; justify-content: space-between; padding: 4px 0; font-size: 15px; }
  .totals .grand { font-weight: bold; font-size: 18px; border-top: 1px solid #e4ddd2; margin-top: 8px; padding-top: 12px; }
  .promo-code { display: flex; gap: 8px; margin-top: 16px; }
  .promo-code input { margin: 0; }
  .promo-code button { width: 48px; border: 1px solid #cfc6b8; background: #ffffff; border-radius: 6px; cursor: pointer; }
  .fine-print { color: #a3a3a3; font-size: 12px; margin-top: 16px; }
</style>
</head>
<body>

<div class="promo" id="promo">Free shipping on orders over $75</div>

<header>
  <a href="/"><img src="fernleaf-logo.png"></a>
</header>

<main>
  <section>
    <h1>Checkout</h1>
    <form id="checkout" novalidate>
      <div class="card">
        <h2>Contact</h2>
        <div class="field">
          <input type="email" id="email" placeholder="Email address" tabindex="1">
        </div>
        <p class="hint">We'll email your receipt and tracking number.</p>
        <label class="check"><input type="checkbox" id="news" tabindex="3"> Send me tea tips and new blends (about twice a month)</label>

        <h2>Shipping address</h2>
        <div class="field"><input type="text" id="name" placeholder="Full name"></div>
        <div class="field"><input type="text" id="address" placeholder="Street address"></div>
        <div class="row">
          <div class="field"><input type="text" id="city" placeholder="City"></div>
          <div>
            <label for="state" class="field-label">State</label>
            <select id="state">
              <option value="">Choose...</option>
              <option>California</option>
              <option>Oregon</option>
              <option>Washington</option>
            </select>
          </div>
          <div class="field"><input type="text" id="zip" placeholder="ZIP code" inputmode="numeric"></div>
        </div>

        <h2>Payment</h2>
        <div class="field">
          <label for="card" class="field-label">Card number</label>
          <input type="text" id="card" inputmode="numeric" autocomplete="cc-number">
        </div>
        <div class="row">
          <div class="field">
            <label for="exp" class="field-label">Expiry (MM/YY)</label>
            <input type="text" id="exp" autocomplete="cc-exp">
          </div>
          <div class="field">
            <label for="cvc" class="field-label">Security code</label>
            <input type="text" id="cvc" inputmode="numeric" autocomplete="cc-csc">
          </div>
        </div>

        <div class="error-box" id="form-error"></div>
        <div class="btn-primary" id="place-order" onclick="placeOrder()">Place order &middot; $70.19</div>
        <p class="fine-print">By placing your order you agree to our terms of sale. Orders ship within 2 business days from Ashford, OR.</p>
      </div>
    </form>
  </section>

  <aside>
    <div class="card">
      <h2>Your order</h2>
      <div class="item">
        <img src="morning-mist.jpg" alt="Tin of Morning Mist green tea">
        <span class="name">Morning Mist green tea, 100 g<br>Qty 1 &middot; $14.00</span>
        <a href="#" class="remove">&times;</a>
      </div>
      <div class="item">
        <img src="ember-chai.jpg" alt="Bag of Ember Chai loose-leaf blend">
        <span class="name">Ember Chai blend, 250 g<br>Qty 2 &middot; $45.00</span>
        <a href="#" class="remove">&times;</a>
      </div>
      <div class="promo-code">
        <input type="text" id="promo-input" tabindex="2">
        <button type="button" onclick="applyPromo()"><svg width="16" height="16" viewBox="0 0 16 16"><path d="M2 8h10M8 3l5 5-5 5" stroke="#2b2b2b" stroke-width="2" fill="none"/></svg></button>
      </div>
      <div class="totals">
        <div><span>Subtotal</span><span>$59.00</span></div>
        <div><span>Shipping</span><span>$5.95</span></div>
        <div><span>Estimated tax</span><span>$5.24</span></div>
        <div class="grand"><span>Total</span><span>$70.19</span></div>
      </div>
    </div>
  </aside>
</main>

<script>
  var promos = [
    'Free shipping on orders over $75',
    'New: Ember Chai is back in stock',
    'Use code STEEP10 for 10% off your first order'
  ];
  var promoIndex = 0;
  setInterval(function () {
    promoIndex = (promoIndex + 1) % promos.length;
    document.getElementById('promo').textContent = promos[promoIndex];
  }, 4000);

  function applyPromo() {
    var code = document.getElementById('promo-input').value.trim().toUpperCase();
    if (code === 'STEEP10') {
      document.querySelector('.grand span:last-child').textContent = '$63.76';
    }
  }

  function placeOrder() {
    var required = ['email', 'name', 'address', 'city', 'zip', 'card', 'exp', 'cvc'];
    var missing = 0;
    required.forEach(function (id) {
      var input = document.getElementById(id);
      var field = input.closest('.field');
      if (input.value.trim() === '') {
        field.classList.add('invalid');
        missing++;
      } else {
        field.classList.remove('invalid');
      }
    });
    var box = document.getElementById('form-error');
    if (missing > 0) {
      box.textContent = 'Please fix the highlighted fields.';
    } else {
      box.textContent = '';
      document.getElementById('checkout').innerHTML = '<h2>Thanks! Your order is on its way.</h2>';
    }
  }
</script>
</body>
</html>
`;

const auditTemplate = `# Accessibility audit: Fernleaf checkout

Auditor: (your initials) · Date: · Standard: WCAG 2.2, Levels A and AA

## How to rate severity
| Severity | Meaning |
|---|---|
| Critical | Blocks someone from completing checkout. Fix before anything else. |
| High | Checkout is possible but very hard, or people are likely to make costly mistakes. |
| Medium | Causes real friction or confusion for some people, with a workaround. |
| Low | Annoying or inconsistent; fix when convenient. |

## Issues
Add one row per issue. Cite the success criterion by number and name, for example "1.3.1 Info and Relationships (A)". If one problem fails several criteria, list the main one first.

| # | Issue | Where | WCAG 2.2 criterion | Severity | Fix |
|---|---|---|---|---|---|
| e.g. | Search button is an icon with no accessible name | Site header (not on this page) | 4.1.2 Name, Role, Value (A) | Medium | Add aria-label="Search" to the button |
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |

## Summary for Rosalind
Under 200 words, no jargon. What's broken, who it affects, and what to fix first with one developer day.

## How I tested
Browser, screen reader, checker and anything else you used.
`;

const starterReadme = `# Practice: accessibility audit of a checkout page

## Running the page
Open checkout.html directly in any modern browser. No server or build step needed. Product images and the logo are intentionally missing, so you'll see empty boxes; that's fine. The Place order button runs a small validation script, so try submitting the form empty and half-filled.

## A suggested routine (about 2 hours)
1. **Keyboard only (30 min).** Unplug or ignore your mouse. Press Tab from the top of the page and try to complete a purchase. Note where focus goes, whether you can see it, and anything you can't reach or activate.
2. **Screen reader (40 min).** Turn on your operating system's built-in screen reader. Move through the form field by field. Does every field say what it is? What happens when you submit with errors?
3. **Visual checks (20 min).** Zoom to 200%, look at text contrast, check whether anything relies on color alone, and look at how big the tap targets are.
4. **Automated checker (10 min).** Run a browser accessibility checker last, to catch anything you missed. Treat its findings as a starting point, not the answer.
5. **Write up (rest of your time).** Use audit-template.md.

## Useful references
- WCAG 2.2 quick reference, filtered to Levels A and AA
- A contrast checker (normal text needs 4.5:1; large text needs 3:1)

## What to submit
A zip with your completed audit (markdown), the summary for Rosalind, and a README.md. Code snippets for fixes are a plus.
`;

/* ───────────── Strong template ───────────── */

const strongReadme = `# Fernleaf checkout: accessibility audit

I tested checkout.html against WCAG 2.2 A and AA and found **12 issues: 1 critical, 4 high, 5 medium and 2 low.** The critical one is the customer's complaint: Place order is a div, so keyboard and screen reader users can't place an order at all.

## Files
- **audit.md:** all 12 issues with location, WCAG criterion, severity and fix, ordered by priority.
- **fixes.md:** code for the top fixes, ready to paste.
- **summary-for-priya.md:** a plain-language summary and a one-day plan.

## How I tested
1. Keyboard only, from the top of the page through a full purchase attempt.
2. My laptop's built-in screen reader, field by field, then submitting the form empty.
3. A contrast checker on every text color in the stylesheet.
4. A browser accessibility checker at the end. It flagged 5 of my 12 issues; the other 7 (including the critical one) only showed up by hand.

## Suggested one-day plan for the developer
| Block | Fixes | Time |
|---|---|---|
| Morning | #1 Place order button, #2 focus outline, #3 labels | ~3 h |
| Midday | #4 error messages, #5 error announcement | ~2 h |
| Afternoon | #6 to #12 (all small CSS or attribute changes) | ~2 h |

## Things I'd check next
- The order confirmation that replaces the form. Focus is lost when the form's HTML is swapped out, so screen reader users may not hear "Thanks!".
- Payment fields at 320 px wide, where the expiry and security code row gets tight.
- Retest everything with a second screen reader, since announcements differ.
`;

const strongAudit = `# Audit: Fernleaf checkout (WCAG 2.2 A/AA)

Ordered by priority.

| # | Issue | Where | WCAG 2.2 criterion | Severity | Fix |
|---|---|---|---|---|---|
| 1 | Place order is a div with onclick: not focusable, no role, Enter/Space do nothing | #place-order | 2.1.1 Keyboard (A); 4.1.2 Name, Role, Value (A) | Critical | Replace with button type="submit" and handle the form's submit event |
| 2 | Focus outline removed globally, so keyboard users can't see where they are | CSS: *:focus { outline: none } | 2.4.7 Focus Visible (AA) | High | Delete the rule; add a visible :focus-visible style (see fixes.md) |
| 3 | Placeholder is the only label; it disappears on typing and isn't reliably announced | Email, Full name, Street address, City, ZIP | 3.3.2 Labels or Instructions (A); 1.3.1 Info and Relationships (A) | High | Visible label elements with for/id; keep placeholders for examples only; add autocomplete values |
| 4 | Errors shown only by a red border; nothing says which field or why | .field.invalid | 1.4.1 Use of Color (A); 3.3.1 Error Identification (A) | High | Per-field text error, aria-invalid="true", aria-describedby pointing to the message |
| 5 | Error summary is injected silently; screen reader users hear nothing after submit | #form-error | 4.1.3 Status Messages (AA) | High | role="alert" on the error box, or move focus to it with tabindex="-1" |
| 6 | Positive tabindex (1, 2, 3) makes focus jump from email to promo code (in the sidebar) and back | #email, #promo-input, #news | 2.4.3 Focus Order (A) | Medium | Remove all positive tabindex values; let DOM order decide |
| 7 | Hint and fine-print text at #A3A3A3 is 2.5:1 on white | .hint, .fine-print | 1.4.3 Contrast (Minimum) (AA) | Medium | Use #6B6B6B (5.3:1) or darker |
| 8 | Promo code input has no label; the arrow button has no accessible name | .promo-code | 4.1.2 Name, Role, Value (A) | Medium | Add label "Promo code"; give the button visible text "Apply" or aria-label="Apply promo code" |
| 9 | Promo banner rotates every 4 s forever, with no way to pause | #promo | 2.2.2 Pause, Stop, Hide (A) | Medium | Show one static message, or add a pause button and stop rotating on hover and focus |
| 10 | No lang attribute, so screen readers may use the wrong pronunciation | html element | 3.1.1 Language of Page (A) | Medium | html lang="en" |
| 11 | Remove links are 14 × 14 px and announced as "times" | .remove | 2.5.5 Target Size | Low | At least 24 × 24 px; text "Remove Ember Chai" via a visually hidden span |
| 12 | Logo image has no alt, and it's the only content of the home link | header img | 1.1.1 Non-text Content (A); 2.4.4 Link Purpose (A) | Low | alt="Fernleaf Tea Co. home" |

Not issues: the product images have good alt text, and the State and payment fields are labeled correctly.
`;

const strongFixes = `# Fixes for the top issues

## 1. A real Place order button
~~~html
<button type="submit" class="btn-primary">Place order · $70.19</button>
~~~
~~~js
document.getElementById('checkout').addEventListener('submit', function (e) {
  e.preventDefault();
  placeOrder();
});
~~~
Add border: 0 and width: 100% to .btn-primary so it looks the same.

## 2. Visible focus
~~~css
/* remove: *:focus { outline: none; } */
:focus-visible { outline: 3px solid #1d4ed8; outline-offset: 2px; }
~~~
#1D4ED8 is 6.7:1 on white, so the ring itself is easy to see.

## 3. Real labels
~~~html
<label for="email" class="field-label">Email</label>
<input type="email" id="email" autocomplete="email" aria-describedby="email-hint">
<p class="hint" id="email-hint">We'll email your receipt and tracking number.</p>
~~~
Same pattern for name (autocomplete="name"), street address (address-line1), city (address-level2) and ZIP (postal-code).

## 4 and 5. Errors people can see and hear
~~~html
<div class="error-box" id="form-error" role="alert"></div>
<input id="zip" aria-invalid="true" aria-describedby="zip-error">
<p class="field-error" id="zip-error">Enter a 5-digit ZIP code.</p>
~~~
Change the summary text from "Please fix the highlighted fields" to a count with links, e.g. "2 fields need attention: ZIP code, Security code." Then move focus to the first invalid field.
`;

const strongSummary = `# Summary for Rosalind

Your customer was right: right now, someone who uses a keyboard or a screen reader **can't place an order**. The Place order button is built in a way that only works with a mouse. That's the first thing to fix, and it takes minutes.

I found 12 problems in total. The most important ones after the button:
- **People can't see where they are** when using a keyboard, because the page hides the focus highlight.
- **Several fields have no real label.** The gray hint text disappears as soon as you type, and screen readers may not read it at all.
- **Errors are invisible to many people.** A red border is the only clue, which doesn't help people who are colorblind, and screen reader users hear nothing.

The rest are small: light gray text that's hard to read, a rotating banner that can't be paused, and a few missing descriptions and tiny buttons.

With one developer day, all 12 can be fixed. Start with the button, the focus highlight, labels and errors (about 5 hours), then do the small fixes. These changes also make checkout easier on phones, where 41% of your orders come from.
`;

/* ───────────── Solid template ───────────── */

const solidReadme = `# Accessibility audit: Fernleaf Tea checkout

## Overview
I audited the checkout page with the keyboard, a screen reader and an automated checker. I found 9 accessibility issues. The most serious is that the Place order button can't be used without a mouse, which explains the customer email.

## Files
- **audit.md:** the completed audit table
- **summary.md:** a short summary for Rosalind

## Method
- Tabbed through the page and tried to place an order using only the keyboard.
- Used a screen reader to go through the form fields.
- Ran a browser accessibility checker and checked the contrast of the gray text.

## Top priorities
1. Make Place order a real button.
2. Bring back the focus outline.
3. Add labels to all the form fields.
4. Make errors clearer.

## What I'd do with more time
Look at the page on a phone and test with a second screen reader. I'd also like to write the code for the fixes rather than describing them.
`;

const solidAudit = `# Audit table

| # | Issue | Where | WCAG 2.2 | Severity | Fix |
|---|---|---|---|---|---|
| 1 | Place order button is a div and doesn't work with the keyboard | Bottom of the form | 2.1.1 Keyboard (A) | Critical | Make it a real button |
| 2 | Focus outline is turned off | Whole page (CSS) | 2.4.7 Focus Visible (AA) | High | Add the focus outline back |
| 3 | Fields use placeholder text instead of labels | Email and shipping address fields | 3.3.2 Labels or Instructions (A) | High | Add labels to the fields |
| 4 | Error fields are only marked in red | Form fields after submitting | 1.4.1 Use of Color (A) | High | Add error text as well as color |
| 5 | Error message isn't read out by the screen reader | Error box above the button | 3.3.1 Error Identification (A) | Medium | Make the screen reader announce it |
| 6 | Gray hint text has low contrast | "We'll email your receipt" and the fine print | 1.4.3 Contrast (Minimum) (AA) | Medium | Use a darker gray |
| 7 | Promo code field has no label and the button is just an arrow icon | Order summary | 4.1.2 Name, Role, Value (A) | Medium | Add a label and button text |
| 8 | No language set on the page | html element | 3.1.1 Language of Page (A) | Low | Add lang="en" |
| 9 | Logo has no alt text | Header | 1.1.1 Non-text Content (A) | Low | Add alt text |
`;

const solidSummary = `# Summary for Rosalind

The biggest problem is that the Place order button only works with a mouse, so customers who use a keyboard or screen reader can't finish their order. This should be fixed first.

There are also problems with the form: some fields have no labels, the keyboard focus outline is hidden, and errors are only shown in red. Some of the gray text is too light to read easily, and a few images and fields are missing descriptions.

I'd recommend fixing the button, focus and labels first, then the error messages, and then the smaller issues.
`;

/* ───────────── Weak template ───────────── */

const weakReadme = `# Checkout accessibility audit

## Summary
I ran an automated accessibility checker on checkout.html and documented every issue it reported. The tool found 6 issues, mostly related to missing text alternatives, labels and contrast. Overall the page is in fairly good shape: the structure uses headings, the payment fields are labeled, and the product images have alt text.

## Method
I opened the page in my browser and ran the built-in accessibility checker. Then I looked up each issue it reported in WCAG 2.2 and filled in the template.

## Files
- **audit.md:** the 6 issues from the checker
- **checker-output.txt:** the raw results

## Priorities
The tool marked 5 of the 6 as serious, so I rated them all High to be safe. The easiest wins are adding the lang attribute and the logo alt text, which are one-line fixes.

## Next steps
Run the checker again after the fixes to confirm the page passes.
`;

const weakAudit = `# Audit table

| # | Issue | Where | WCAG 2.2 | Severity | Fix |
|---|---|---|---|---|---|
| 1 | html element must have a lang attribute | html | 3.1.2 Language of Parts | High | Add a lang attribute |
| 2 | Images must have alternate text | header img | 1.1.1 Non-text Content | High | Add alt text |
| 3 | Form elements must have labels | #promo-input | 1.3.1 Info and Relationships | High | Add a label |
| 4 | Buttons must have discernible text | .promo-code button | 4.1.2 Name, Role, Value | High | Add text to the button |
| 5 | Elements must have sufficient color contrast | .hint, .fine-print | 1.4.6 Contrast (Enhanced) | High | Ensure sufficient contrast |
| 6 | Elements should not have tabindex greater than zero | #email, #promo-input, #news | 2.1.1 Keyboard | High | Remove tabindex |
`;

const weakChecker = `Accessibility checker results: checkout.html
6 issues (5 serious, 1 moderate)

[serious] html-has-lang: <html> element must have a lang attribute
  html
[serious] image-alt: Images must have alternate text
  header > a > img
[serious] label: Form elements must have labels
  #promo-input
[serious] button-name: Buttons must have discernible text
  .promo-code > button
[serious] color-contrast: Elements must have sufficient color contrast
  .hint (2.52:1), .fine-print (2.52:1)
[moderate] tabindex: Elements should not have tabindex greater than zero
  #email, #promo-input, #news

Passed: 24 rules · Incomplete: 2 (needs review)
`;

const mod: ChallengeModule = {
  challenge: {
    id: 'pr_a11y_audit',
    kind: 'practice',
    companyId: null,
    title: 'Accessibility audit of a checkout page',
    summary: 'Audit a checkout page against WCAG 2.2 and rank the fixes for the shop owner.',
    type: 'design',
    skills: ['Accessibility', 'WCAG 2.2', 'Usability testing', 'HTML & CSS', 'UX writing'],
    classroomConcepts: [
      { concept: 'Universal design and accessibility guidelines', course: 'Human-Computer Interaction' },
      { concept: 'Semantic HTML and the accessibility tree', course: 'Web Development' },
      { concept: 'Heuristic evaluation and severity ratings', course: 'Usability Engineering' },
      { concept: 'Writing for a non-technical audience', course: 'Technical Writing' },
    ],
    difficulty: 'beginner',
    estHours: 3,
    brief,
    deliverables: [
      'Completed audit table: issue, where, WCAG 2.2 criterion, severity, fix',
      'Issues ranked for a one-day developer fix',
      'Plain-language summary for the shop owner (under 200 words)',
      'README.md describing how you tested',
    ],
    rubric: [
      { id: 'issue_coverage', name: 'Issue coverage', description: 'Finds nearly all the real problems, including the keyboard, focus, error-announcement and auto-rotating banner issues that only manual testing reveals.', weight: 30 },
      { id: 'wcag_mapping', name: 'WCAG mapping', description: 'Every issue cites the correct WCAG 2.2 A or AA success criterion by number, name and level, with no AAA or near-miss citations.', weight: 20 },
      { id: 'severity', name: 'Prioritization', description: 'Severity reflects real impact: the unusable Place order button is critical and ranked first, and the order fits a one-day fix.', weight: 15 },
      { id: 'fixes', name: 'Fix recommendations', description: 'Each fix is concrete enough to implement without guessing, with code-level detail such as the element, attribute or CSS value to use.', weight: 20 },
      { id: 'communication', name: 'Communication', description: 'The owner\'s summary is short, jargon-free and says what to fix first; the audit itself is easy for a developer to work through.', weight: 15 },
    ],
    reward: { mode: 'none', amounts: [] },
    applicantCap: null,
    status: 'open',
    hiringFor: null,
    starterFiles: [
      { path: 'README.md', content: starterReadme },
      { path: 'checkout.html', content: checkoutHtml },
      { path: 'audit-template.md', content: auditTemplate },
    ],
    aiHints: {
      testing:
        'Whether you can find accessibility problems the way a real person would hit them, not just the ones a tool reports. It also tests whether you can map each one to the right WCAG criterion, judge how much it matters, and explain it to someone who isn\'t technical.',
      steps: [
        'Try to complete checkout with only the keyboard and note every place you get stuck or lose track of focus.',
        'Go through the form with a screen reader, then submit it empty and listen for what happens.',
        'Check colors with a contrast checker and look for anything that relies on color alone or moves on its own.',
        'Run an automated checker last and add anything new it finds.',
        'Map each issue to a WCAG 2.2 A/AA criterion, rate severity and write a concrete fix.',
        'Write a short, jargon-free summary for the owner with a clear order of work.',
      ],
      greatLooksLike:
        'A great audit finds around a dozen issues, starting with the Place order div that keyboard and screen reader users can\'t activate, and including the hidden focus outline, placeholder-only labels, color-only and unannounced errors, the positive tabindex and the rotating banner. Each cites the right A or AA criterion and has a fix a developer could paste in. The owner\'s summary is a few short paragraphs that say what to do first.',
      pitfalls: [
        'Relying only on an automated checker, which misses the keyboard, focus and error problems.',
        'Citing AAA criteria (like 1.4.6 Contrast (Enhanced)) or near-miss criteria instead of the A/AA ones.',
        'Rating everything the same severity, so the developer can\'t tell what to do first.',
        'Vague fixes such as "make it accessible" or "add a label" with no detail.',
        'Writing the owner\'s summary in WCAG jargon.',
      ],
    },
    deadlineInDays: null,
    createdDaysAgo: 90,
    seed: { participants: 21, submissions: 12, scored: 12 },
  },
  templates: [
    {
      quality: 'strong',
      notes: `### What I built
A full audit of checkout.html: 12 issues with WCAG 2.2 criteria, severities and fixes, code snippets for the top five, a one-day plan, and a summary written for the owner.

### Key decisions & trade-offs
- I tested by hand first and ran the checker last. The checker only caught 5 of the 12, and missed the critical one: Place order is a div, so you can't reach or press it from the keyboard.
- Severity is based on whether someone can still finish checkout. Anything that blocks the purchase is critical; anything that makes errors likely is high. Visual and small issues come after.
- Where one issue fails several criteria (like the color-only error), I listed the main criterion first so the developer isn't overwhelmed.
- I kept the owner's summary under 200 words and talked about customers, not criteria.

### What I'd do with more time
Test the order confirmation (focus is lost when the form is replaced), check the layout at 320 px, and retest with a second screen reader.`,
      files: [
        { path: 'README.md', content: strongReadme },
        { path: 'audit.md', content: strongAudit },
        { path: 'fixes.md', content: strongFixes },
        { path: 'summary-for-priya.md', content: strongSummary },
      ],
      feedback:
        'Excellent coverage. You found all 12 issues, including the ones only manual testing reveals: the div button, the hidden focus ring, the silent error box and the rotating banner. Severity is well judged and the one-day plan is genuinely useful. Two things to tighten: target size is 2.5.8 Target Size (Minimum) at AA in WCAG 2.2, not 2.5.5 (which is AAA), and the banner fix would be stronger with code showing the pause control.',
      aiDisclosure:
        'Used an AI assistant to double-check WCAG criterion numbers and to proofread the summary. All testing was done by hand.',
    },
    {
      quality: 'solid',
      notes: `**What I built**
An audit table with 9 issues, a top-priorities list and a short summary for the owner.

**Key decisions & trade-offs**
- I tested with the keyboard first, which is how I found the biggest problem: Place order doesn't work without a mouse. That matches the customer's email, so I made it critical.
- I also used a screen reader and an automated checker, and checked the contrast of the gray text.
- I kept the fixes short so the table stays readable. The developer can look up the exact code.
- I rated the language and logo issues low because they're quick to fix and don't block checkout.

**What I'd do with more time**
Write code for each fix, test on a phone, and try a second screen reader.`,
      files: [
        { path: 'README.md', content: solidReadme },
        { path: 'audit.md', content: solidAudit },
        { path: 'summary.md', content: solidSummary },
      ],
      feedback:
        'You found the issue that matters most, the Place order div, and rated it critical, and most of your criteria are right. You missed three: the positive tabindex values that make focus jump to the sidebar, the banner that rotates with no pause (2.2.2), and the 14 px remove links (2.5.8). The unannounced error box is 4.1.3 Status Messages rather than 3.3.1. Your fixes say what to do but not how, so try adding the element or attribute, like role="alert" or a label with a matching for.',
      aiDisclosure: 'I asked an AI tool to explain two WCAG criteria I wasn\'t sure about.',
    },
    {
      quality: 'weak',
      notes: `**What I built**
An audit based on an automated accessibility checker, with each issue mapped to WCAG 2.2, plus the raw checker output.

**Key decisions & trade-offs**
- I used an automated checker so the results would be objective and repeatable, and I looked up the WCAG criterion for each finding.
- I rated everything High because the tool marked them as serious.
- I didn't write a separate summary for the owner because the table is short and easy to read.
- I kept the checker's own wording for each issue so the developer can search for it and find documentation.
- The page already does some things well: it has headings, labeled payment fields and alt text on the product photos, so I noted those in the README.

**What I'd do with more time**
Rerun the checker after the fixes are in to confirm the page passes, and try a second automated tool to compare results, since different checkers sometimes report different issues.`,
      files: [
        { path: 'README.md', content: weakReadme },
        { path: 'audit.md', content: weakAudit },
        { path: 'checker-output.txt', content: weakChecker },
      ],
      feedback:
        'Good start: the checker found real issues, and the raw output is clearly documented. But a checker can\'t press buttons. Try tabbing through the page and you\'ll find the Place order "button" can\'t be reached or activated, which is the exact problem the customer reported, along with the hidden focus outline and errors that are only shown in red. Some citations need fixing too: contrast is 1.4.3 (1.4.6 is AAA), a missing lang is 3.1.1, and positive tabindex is 2.4.3 Focus Order.',
      aiDisclosure: 'None.',
    },
  ],
  scripted: [
    {
      challengeId: 'pr_a11y_audit',
      studentId: 'stu_amara',
      templateIndex: 0,
      submittedDaysAgo: 60,
      scores: { issue_coverage: 5, wcag_mapping: 4, severity: 5, fixes: 4, communication: 5 },
      feedback:
        'A thorough audit: you caught all 12 issues, including the keyboard trap on Place order and the silent error box, your severity order would get a developer through the critical work by lunch, and the summary for Rosalind is clear and kind. To reach a 5 on mapping, cite target size as 2.5.8 Target Size (Minimum), the AA criterion new in WCAG 2.2; 2.5.5 is AAA. On fixes, the banner and remove-link rows describe the change but don\'t show it, so add a snippet for the pause button and the visually hidden "Remove" text.',
    },
  ],
};

export default mod;
