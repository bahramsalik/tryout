/**
 * Coach (dummy AI) field packs for recommend mode: a short intro to entry-level work in each
 * field, a 4-step learning path and the words in a message that map to the field.
 * Keywords include short tokens (ux, pm, soc, apm), so they should be matched on word boundaries.
 */
import type { ChallengeType, CoachPack } from '../types.ts';

export const coachPacks: Record<ChallengeType, CoachPack> = {
  software: {
    fieldIntro:
      'Entry-level software work is mostly **changing code someone else wrote**: adding a feature to an existing service, fixing a bug from a stack trace, or writing the tests nobody had time for. Teams hire juniors who read code carefully, make small, safe changes and explain their trade-offs in the pull request. You don\'t need every framework; you need to show you can ship something correct and testable.',
    learningPath: [
      'Get fluent with one backend stack end to end (for example Node.js + Express): routes, middleware, a database and tests.',
      'Practice reading unfamiliar code: trace one request from the route to the database, then fix one real bug.',
      'Use tests as a design tool: fakes, an injected clock instead of sleeps, and one integration test per feature.',
      'Ship a timed task with a README a teammate could act on. Start with **Fix a flaky test suite**, then try a live API challenge.',
    ],
    keywords: [
      'software', 'backend', 'frontend', 'full stack', 'developer', 'engineer', 'swe', 'coding',
      'computer science', 'api', 'javascript', 'typescript', 'node', 'python', 'java',
    ],
  },
  data: {
    fieldIntro:
      'Entry-level data work is **answering a business question with messy data**: reconciling two exports that disagree, finding out why a metric moved, or building the dashboard a manager checks every Monday. The best junior analysts define the metric precisely, check the data before trusting it, and lead with the one finding that changes a decision.',
    learningPath: [
      'Get solid at SQL joins, group-bys and window functions, plus pandas for cleaning.',
      'Write the metric definition down before you compute it: exactly what counts as "wait time" or "churn"?',
      'Compare rates, not counts, segment before you conclude, and sanity-check results against the raw rows.',
      'Tell the story: one chart per finding and a recommendation with its expected impact. Start with **Reconcile two messy clinic-visit exports**.',
    ],
    keywords: [
      'data', 'analyst', 'analytics', 'data science', 'data scientist', 'statistics', 'stats', 'sql',
      'pandas', 'dashboard', 'visualization', 'machine learning', 'business intelligence', 'excel',
    ],
  },
  design: {
    fieldIntro:
      'Entry-level product design is **improving a real flow under real constraints**: a first-run experience that loses most new users, a checkout keyboard users can\'t finish, or an empty state nobody wrote copy for. Hiring teams look for designers who start from evidence (funnels, quotes, support tickets), make clear trade-offs and explain every decision in plain words. A flow that measurably works for everyone beats a pretty mockup.',
    learningPath: [
      'Learn interaction-design fundamentals: flows, hierarchy, every state (empty, error, loading) and real copy instead of placeholder text.',
      'Learn accessibility early: WCAG 2.2 basics, keyboard navigation, contrast and screen-reader labels.',
      'Tie design to data: read a funnel, pick the biggest drop and define how you would measure your fix.',
      'Write rationale like a designer on a team. Start with **Accessibility audit of a checkout page**, then try a live redesign challenge.',
    ],
    keywords: [
      'design', 'designer', 'ux', 'ui', 'product design', 'interaction design', 'figma', 'prototype',
      'wireframe', 'accessibility', 'user experience', 'visual design', 'hci', 'graphic design',
    ],
  },
  product: {
    fieldIntro:
      'Entry-level product work is **deciding what to build and getting a team to agree on it**: synthesizing user interviews, writing the PRD for a new notification, or turning an engineering changelog into release notes people actually read. Great junior PMs frame the problem with evidence, write requirements engineers can build from, and name the metric that will show it worked.',
    learningPath: [
      'Learn to frame a problem: who is affected, how often, what it costs, and how you would know it is solved.',
      'Practice research synthesis: themes backed by quotes from several users, not the loudest request.',
      'Write a one-page PRD with user stories, edge cases and a success metric plus a guardrail.',
      'Communicate the launch clearly. Start with **Synthesize six user-interview transcripts into insights**, then try a live PRD challenge.',
    ],
    keywords: [
      'product', 'product manager', 'pm', 'apm', 'product management', 'prd', 'roadmap', 'user research',
      'interviews', 'requirements', 'cognitive science', 'information science', 'release notes', 'strategy',
    ],
  },
  marketing: {
    fieldIntro:
      'Entry-level marketing is **getting the right message to the right people on a real budget**: a launch plan for a new snack with $10k, an email test that actually reaches significance, or copy that fits a 120-character card. Teams hire coordinators who know their audience, justify every dollar with past results and measure what matters instead of what is easy to count.',
    learningPath: [
      'Learn audience and positioning basics: who it is for, why they would switch, and the one message that says so.',
      'Plan channels with a budget table that adds up and is justified by past results.',
      'Learn experiment basics: one hypothesis, a primary metric, a sample size and a decision rule before you launch.',
      'Build a measurement plan with targets and a mid-flight check. Start with **Design and size an email A/B test**, then try a live launch plan.',
    ],
    keywords: [
      'marketing', 'marketer', 'brand', 'campaign', 'social media', 'content', 'copywriting',
      'email marketing', 'seo', 'growth', 'advertising', 'communications', 'launch', 'a/b test',
    ],
  },
  finance: {
    fieldIntro:
      'Entry-level finance work is **making numbers explain themselves**: a variance memo that tells the CFO why Q3 missed, a three-statement model a lender can trust, or a forecast that ties out to the dollar. Hiring managers look for analysts whose math is right, who separate one-time items from recurring ones, and who lead with the answer instead of walking through every line.',
    learningPath: [
      'Master the three statements and how they link: net income flows to cash flow, and cash flow to the balance sheet.',
      'Practice variance analysis: budget vs actual, favorable vs unfavorable, and price vs volume.',
      'Build a small driver-based model with an assumptions tab, a balance check and a downside case.',
      'Write the one-page memo. Start with **Build a 3-statement model for a coffee subscription startup**, then try a live variance challenge.',
    ],
    keywords: [
      'finance', 'financial analyst', 'fp&a', 'accounting', 'accountant', 'cpa', 'investment banking',
      'banking', 'excel', 'financial modeling', 'budget', 'forecast', 'valuation', 'economics',
    ],
  },
  security: {
    fieldIntro:
      'Entry-level security work is mostly **careful triage**: sorting a night of SIEM alerts into the one real incident and the false positives you can explain, dissecting a reported phishing email, and writing notes the next shift can act on at 3 a.m. SOC teams hire analysts who follow the evidence, document their reasoning and escalate the right thing quickly and calmly.',
    learningPath: [
      'Learn networking and identity fundamentals: IP addresses and ASNs, DNS, email authentication (SPF, DKIM, DMARC) and how MFA works.',
      'Practice log analysis: read sign-in, endpoint and mail logs, and connect events across them.',
      'Learn triage discipline: a verdict, the evidence, your confidence, and when to escalate versus close.',
      'Write clear escalation notes and staff advisories. Start with **Dissect a phishing email and write the staff advisory**, then try a live SIEM triage.',
    ],
    keywords: [
      'security', 'cybersecurity', 'soc', 'soc analyst', 'infosec', 'siem', 'incident response',
      'threat', 'phishing', 'blue team', 'pentest', 'malware', 'forensics', 'network security',
    ],
  },
};
