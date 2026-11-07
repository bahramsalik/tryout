/**
 * ✨ Suggest rubric (employer wizard): one starter rubric per field. Weights sum to 100.
 */
import type { ChallengeType, RubricCriterion } from '../types.ts';

export const rubricTemplates: Record<ChallengeType, RubricCriterion[]> = {
  software: [
    { id: 'correctness', name: 'Correctness', description: 'Does what the brief asks, including edge cases, without breaking existing behavior.', weight: 30 },
    { id: 'design', name: 'Design & trade-offs', description: 'A sensible approach for the constraints, with the alternatives and trade-offs explained.', weight: 25 },
    { id: 'tests', name: 'Tests', description: 'Meaningful, deterministic automated tests that cover the failure cases, not just the happy path.', weight: 20 },
    { id: 'code_quality', name: 'Code quality', description: 'Readable, idiomatic code that a teammate could extend without a walkthrough.', weight: 15 },
    { id: 'communication', name: 'Communication', description: 'A README and notes that explain how to run it, what changed and why.', weight: 10 },
  ],
  data: [
    { id: 'accuracy', name: 'Accuracy', description: 'Metrics are defined precisely and computed correctly; data problems are found and handled, not hidden.', weight: 30 },
    { id: 'insight', name: 'Insight', description: 'Surfaces the finding that changes a decision, backed by segments and rates rather than raw counts.', weight: 25 },
    { id: 'recommendations', name: 'Recommendations', description: 'Concrete, prioritized next steps with their expected impact.', weight: 20 },
    { id: 'visualization', name: 'Visualization', description: 'One clear, honestly scaled and labeled chart per point.', weight: 10 },
    { id: 'communication', name: 'Communication', description: 'Leads with the answer, states assumptions and makes the method reproducible.', weight: 15 },
  ],
  design: [
    { id: 'user_insight', name: 'User insight', description: 'Grounds the design in the evidence provided (funnel, quotes, tickets) and names the real problem.', weight: 25 },
    { id: 'flow', name: 'Flow & interaction design', description: 'Solves the problem in the fewest steps and covers empty, error and edge states.', weight: 30 },
    { id: 'visual_craft', name: 'Visual craft', description: 'Clear hierarchy, consistent components, real copy and accessible contrast.', weight: 20 },
    { id: 'rationale', name: 'Design rationale', description: 'Explains decisions and trade-offs in plain language a PM and an engineer can follow.', weight: 15 },
    { id: 'measurement', name: 'Success metrics', description: 'Defines how success will be measured, including a guardrail metric.', weight: 10 },
  ],
  product: [
    { id: 'problem_framing', name: 'Problem framing', description: 'States who has the problem, how often and what it costs, with evidence.', weight: 25 },
    { id: 'requirements', name: 'Requirements', description: 'Clear, testable requirements and user stories an engineer could build from.', weight: 25 },
    { id: 'edge_cases', name: 'Edge cases & risks', description: 'Anticipates failure modes and edge cases, and says what is out of scope.', weight: 20 },
    { id: 'metrics', name: 'Success metrics', description: 'A primary metric with a target and at least one guardrail.', weight: 15 },
    { id: 'clarity', name: 'Clarity', description: 'Concise, well structured and easy to skim.', weight: 15 },
  ],
  marketing: [
    { id: 'audience', name: 'Audience insight', description: 'A specific audience and positioning grounded in the research provided.', weight: 20 },
    { id: 'channel_strategy', name: 'Channel strategy', description: 'Channel choices justified by past results and the audience, not habit.', weight: 25 },
    { id: 'budget', name: 'Budget allocation', description: 'A budget that adds up, with spend matched to expected return and a reserve.', weight: 20 },
    { id: 'creative', name: 'Creative & messaging', description: 'On-brand messages and concepts that fit each channel.', weight: 20 },
    { id: 'measurement', name: 'Measurement plan', description: 'KPIs with targets, tracking and a mid-flight check.', weight: 15 },
  ],
  finance: [
    { id: 'accuracy', name: 'Numerical accuracy', description: 'The math ties out: totals, signs and links between tables are all correct.', weight: 30 },
    { id: 'drivers', name: 'Drivers & assumptions', description: 'Explains the business drivers behind the numbers and states every assumption.', weight: 25 },
    { id: 'communication', name: 'Executive communication', description: 'Leads with the answer in language a CFO can act on in two minutes.', weight: 25 },
    { id: 'recommendations', name: 'Recommendations', description: 'Specific, quantified next steps that separate one-time items from recurring ones.', weight: 20 },
  ],
  security: [
    { id: 'detection', name: 'Detection', description: 'Identifies the real threats and ties related evidence together.', weight: 30 },
    { id: 'analysis', name: 'Evidence & analysis', description: 'Every verdict is backed by specific evidence from the data provided.', weight: 25 },
    { id: 'response', name: 'Response & escalation', description: 'Clear containment and escalation steps, in the right order.', weight: 20 },
    { id: 'prioritization', name: 'Prioritization', description: 'Works the highest-risk items first and says why.', weight: 10 },
    { id: 'communication', name: 'Communication', description: 'Notes a teammate or client could act on at 3 a.m.', weight: 15 },
  ],
};
