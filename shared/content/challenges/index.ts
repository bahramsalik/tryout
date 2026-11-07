/**
 * All 17 seeded challenges (SPEC.md §6), in table order: live, practice, past.
 */
import type { ChallengeModule } from '../lib.ts';

import chRateLimiter from './ch_rate_limiter.ts';
import chChurn from './ch_churn.ts';
import chOnboarding from './ch_onboarding.ts';
import chVariance from './ch_variance.ts';
import chLaunch from './ch_launch.ts';
import chSocTriage from './ch_soc_triage.ts';
import chEtaPrd from './ch_eta_prd.ts';

import prFlakyTests from './pr_flaky_tests.ts';
import prMessyData from './pr_messy_data.ts';
import prA11yAudit from './pr_a11y_audit.ts';
import prInterviews from './pr_interviews.ts';
import prAbTest from './pr_ab_test.ts';
import pr3Statement from './pr_3_statement.ts';
import prPhishing from './pr_phishing.ts';

import pastCsvImport from './past_csv_import.ts';
import pastWaitDashboard from './past_wait_dashboard.ts';
import pastReleaseNotes from './past_release_notes.ts';

export const challengeModules: ChallengeModule[] = [
  chRateLimiter,
  chChurn,
  chOnboarding,
  chVariance,
  chLaunch,
  chSocTriage,
  chEtaPrd,
  prFlakyTests,
  prMessyData,
  prA11yAudit,
  prInterviews,
  prAbTest,
  pr3Statement,
  prPhishing,
  pastCsvImport,
  pastWaitDashboard,
  pastReleaseNotes,
];
