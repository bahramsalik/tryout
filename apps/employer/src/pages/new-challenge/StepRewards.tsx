import { PLATFORM_RULES, rewardTotal, splitTop3, type RewardMode } from '@shared/types';
import { fromLocalInput, money, ordinal, toLocalInput } from '@/lib/format';
import { Field, Input, cn } from '@/components/ui';
import { draftReward, type Draft, type StepErrors } from './draft';

const MODES: { mode: RewardMode; title: string; line: string }[] = [
  { mode: 'top3', title: 'Top 3', line: 'Pool split 50 / 30 / 20' },
  { mode: 'winner', title: 'Winner', line: 'One winner takes all' },
  { mode: 'none', title: 'No reward', line: 'Feedback only' },
];

export function StepRewards({ draft, set, errors }: { draft: Draft; set: (patch: Partial<Draft>) => void; errors: StepErrors }) {
  const pool = rewardTotal(draftReward(draft));

  return (
    <div className="space-y-5">
      <Field label="Reward type" error={errors.reward}>
        <div role="radiogroup" aria-label="Reward type" className="grid gap-2 @xl:grid-cols-3">
          {MODES.map((m) => {
            const active = draft.rewardMode === m.mode;
            return (
              <button
                key={m.mode}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => set({ rewardMode: m.mode })}
                className={cn(
                  'flex items-center gap-2.5 rounded-[var(--borderRadiusMedium)] border p-3 text-left transition-colors',
                  active
                    ? 'border-[var(--colorBrandStroke1)] bg-[var(--colorBrandBackground2)]'
                    : 'border-[var(--colorNeutralStroke1)] bg-white hover:bg-[var(--colorNeutralBackground1Hover)]',
                )}
              >
                <span
                  className={cn(
                    'flex size-4 shrink-0 items-center justify-center rounded-full border',
                    active ? 'border-[var(--colorBrandStroke1)]' : 'border-[var(--colorNeutralStrokeAccessible)]',
                  )}
                  aria-hidden
                >
                  {active && <span className="size-2 rounded-full bg-[var(--colorBrandBackground)]" />}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{m.title}</span>
                  <span className="block text-xs text-slate-600">{m.line}</span>
                </span>
              </button>
            );
          })}
        </div>
      </Field>

      {draft.rewardMode === 'winner' && (
        <Field label="Amount" htmlFor="f-winner">
          <MoneyInput id="f-winner" value={draft.winnerAmount} onChange={(winnerAmount) => set({ winnerAmount })} className="w-40" />
        </Field>
      )}
      {draft.rewardMode === 'top3' && (
        <div className="grid grid-cols-2 gap-3 @xl:grid-cols-4">
          <Field label="Pool" htmlFor="f-pool">
            <MoneyInput
              id="f-pool"
              value={pool}
              onChange={(p) => set({ top3: splitTop3(Math.max(0, p)) as [number, number, number] })}
            />
          </Field>
          {draft.top3.map((amount, i) => (
            <Field key={i} label={ordinal(i + 1)} htmlFor={`f-place-${i}`}>
              <MoneyInput
                id={`f-place-${i}`}
                value={amount}
                onChange={(v) => {
                  const next = [...draft.top3] as [number, number, number];
                  next[i] = Math.max(0, v);
                  set({ top3: next });
                }}
              />
            </Field>
          ))}
        </div>
      )}

      <div className="grid gap-5 @xl:grid-cols-2">
        <Field label="Applicant cap" htmlFor="f-cap" error={errors.cap}>
          <div className="flex items-center gap-3">
            <Input
              id="f-cap"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              disabled={!draft.capped}
              value={draft.capped ? (Number.isFinite(draft.cap) ? draft.cap : '') : ''}
              onChange={(e) => set({ capped: true, cap: e.target.value === '' ? NaN : Math.round(Number(e.target.value)) })}
              className="w-24 tabular-nums"
              invalid={!!errors.cap}
            />
            <label className="inline-flex items-center gap-2 text-sm whitespace-nowrap">
              <input
                type="checkbox"
                className="size-4 accent-[var(--colorBrandBackground)]"
                checked={!draft.capped}
                onChange={(e) => set({ capped: !e.target.checked, cap: Number.isFinite(draft.cap) ? draft.cap : 50 })}
              />
              No cap
            </label>
          </div>
        </Field>
        <Field label="Deadline" htmlFor="f-deadline" error={errors.deadline}>
          <Input
            id="f-deadline"
            type="datetime-local"
            value={draft.deadline ? toLocalInput(draft.deadline) : ''}
            onChange={(e) => set({ deadline: fromLocalInput(e.target.value) })}
            className="w-60 tabular-nums"
            invalid={!!errors.deadline}
          />
        </Field>
      </div>

      <EscrowSummary draft={draft} />
    </div>
  );
}

function MoneyInput({
  id,
  value,
  onChange,
  className,
}: {
  id: string;
  value: number;
  onChange: (v: number) => void;
  className?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-slate-500">$</span>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        step={5}
        value={Number.isFinite(value) ? value : ''}
        onChange={(e) => onChange(e.target.value === '' ? 0 : Math.round(Number(e.target.value)))}
        className="pl-6 tabular-nums"
      />
    </div>
  );
}

/** Escrow total: pool + fee = total (3 lines). */
export function EscrowSummary({ draft, className }: { draft: Draft; className?: string }) {
  const pool = rewardTotal(draftReward(draft));
  if (pool <= 0) return null;
  const fee = Math.round((pool * PLATFORM_RULES.platformFeePct) / 100);
  return (
    <dl
      className={cn('max-w-xs space-y-1 rounded-[var(--borderRadiusMedium)] bg-[var(--colorNeutralBackground3)] p-3 text-sm', className)}
      aria-label="Escrow"
    >
      <div className="flex justify-between">
        <dt>Pool</dt>
        <dd className="tabular-nums">{money(pool)}</dd>
      </div>
      <div className="flex justify-between">
        <dt>Fee {PLATFORM_RULES.platformFeePct}%</dt>
        <dd className="tabular-nums">{money(fee)}</dd>
      </div>
      <div className="flex justify-between border-t border-slate-300 pt-1 font-semibold">
        <dt>Escrow total</dt>
        <dd className="tabular-nums">{money(pool + fee)}</dd>
      </div>
    </dl>
  );
}
