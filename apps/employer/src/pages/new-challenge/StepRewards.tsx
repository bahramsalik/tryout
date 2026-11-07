import type { ReactNode } from 'react';
import { CalendarClock, HandHeart, Lock, Medal, Trophy, Users } from 'lucide-react';
import { PLATFORM_RULES, rewardTotal, splitTop3, type RewardMode } from '@shared/types';
import { daysFromNow, dateTime, fromLocalInput, money, ordinal, toLocalInput } from '@/lib/format';
import { Field, Input, cn } from '@/components/ui';
import { draftReward, type Draft, type StepErrors } from './draft';

export function StepRewards({ draft, set, errors }: { draft: Draft; set: (patch: Partial<Draft>) => void; errors: StepErrors }) {
  const pool = rewardTotal(draftReward(draft));

  return (
    <div className="space-y-7">
      <Field label="Reward" error={errors.reward} hint="Bounties are escrowed when you publish and released when you publish results.">
        <div role="radiogroup" aria-label="Reward mode" className="grid gap-2.5 @2xl:grid-cols-3">
          <RewardCard
            mode="winner"
            current={draft.rewardMode}
            onSelect={(rewardMode) => set({ rewardMode })}
            icon={<Trophy className="size-5" aria-hidden />}
            title="Winner takes all"
            body="One winner gets the full bounty."
          />
          <RewardCard
            mode="top3"
            current={draft.rewardMode}
            onSelect={(rewardMode) => set({ rewardMode })}
            icon={<Medal className="size-5" aria-hidden />}
            title="Top 3"
            body="A pool split 50 / 30 / 20 across the top three."
            badge="Most popular"
          />
          <RewardCard
            mode="none"
            current={draft.rewardMode}
            onSelect={(rewardMode) => set({ rewardMode })}
            icon={<HandHeart className="size-5" aria-hidden />}
            title="No bounty"
            body="A hiring signal. Feedback is still guaranteed."
          />
        </div>

        <div className="mt-3">
          {draft.rewardMode === 'winner' && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <label htmlFor="f-winner" className="text-[13px] font-semibold text-slate-800">
                Winner’s bounty
              </label>
              <MoneyInput
                id="f-winner"
                value={draft.winnerAmount}
                onChange={(winnerAmount) => set({ winnerAmount })}
                className="mt-1.5 max-w-[12rem]"
              />
              <QuickAmounts values={[200, 300, 400, 500]} onPick={(winnerAmount) => set({ winnerAmount })} />
            </div>
          )}
          {draft.rewardMode === 'top3' && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label htmlFor="f-pool" className="text-[13px] font-semibold text-slate-800">
                    Bounty pool
                  </label>
                  <MoneyInput
                    id="f-pool"
                    value={pool}
                    onChange={(p) => set({ top3: splitTop3(Math.max(0, p)) as [number, number, number] })}
                    className="mt-1.5 w-40"
                  />
                </div>
                <QuickAmounts values={[300, 525, 750, 1000]} onPick={(p) => set({ top3: splitTop3(p) as [number, number, number] })} />
              </div>
              <p className="mt-4 mb-2 text-xs font-medium text-slate-500">Split per place — edit any amount</p>
              <div className="grid grid-cols-3 gap-2">
                {draft.top3.map((amount, i) => (
                  <div key={i}>
                    <label htmlFor={`f-place-${i}`} className="mb-1 flex items-center gap-1 text-xs font-semibold text-slate-600">
                      <span aria-hidden>{['🥇', '🥈', '🥉'][i]}</span> {ordinal(i + 1)}
                      <span className="ml-auto font-normal text-slate-400 tabular-nums">
                        {pool > 0 ? `${Math.round((amount / pool) * 100)}%` : '—'}
                      </span>
                    </label>
                    <MoneyInput
                      id={`f-place-${i}`}
                      value={amount}
                      onChange={(v) => {
                        const next = [...draft.top3] as [number, number, number];
                        next[i] = Math.max(0, v);
                        set({ top3: next });
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          {draft.rewardMode === 'none' && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-[13px] leading-relaxed text-slate-600">
              No money changes hands — the challenge is a hiring signal. Every submission still gets rubric scores and written
              feedback, and you can invite standouts to interview. Students keep their IP.
            </div>
          )}
        </div>
      </Field>

      <Field
        label="Applicant cap"
        error={errors.cap}
        hint="Caps keep the odds fair for students and your review load predictable. Students see “spots left”."
      >
        <div className="flex flex-wrap items-center gap-2">
          {[25, 50, 100].map((n) => (
            <PresetChip key={n} active={draft.capped && draft.cap === n} onClick={() => set({ capped: true, cap: n })}>
              <Users className="size-3.5" aria-hidden /> {n}
            </PresetChip>
          ))}
          <PresetChip active={!draft.capped} onClick={() => set({ capped: false })}>
            No cap
          </PresetChip>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">or</span>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={draft.capped ? (Number.isFinite(draft.cap) ? draft.cap : '') : ''}
              onChange={(e) => set({ capped: true, cap: e.target.value === '' ? NaN : Math.round(Number(e.target.value)) })}
              placeholder="Custom"
              aria-label="Custom applicant cap"
              className="w-24 tabular-nums"
              invalid={!!errors.cap}
            />
          </div>
        </div>
      </Field>

      <Field label="Deadline" htmlFor="f-deadline" error={errors.deadline} hint={`Default is ${PLATFORM_RULES.defaultDeadlineDays} days. Students see a countdown.`}>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <CalendarClock className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
            <Input
              id="f-deadline"
              type="datetime-local"
              value={draft.deadline ? toLocalInput(draft.deadline) : ''}
              onChange={(e) => set({ deadline: fromLocalInput(e.target.value) })}
              className="w-56 pl-8 tabular-nums"
              invalid={!!errors.deadline}
            />
          </div>
          {[3, 7, 14].map((d) => (
            <PresetChip key={d} active={false} onClick={() => set({ deadline: daysFromNow(d) })}>
              +{d} days
            </PresetChip>
          ))}
        </div>
      </Field>

      <EscrowSummary draft={draft} />
    </div>
  );
}

function RewardCard({
  mode,
  current,
  onSelect,
  icon,
  title,
  body,
  badge,
}: {
  mode: RewardMode;
  current: RewardMode;
  onSelect: (m: RewardMode) => void;
  icon: ReactNode;
  title: string;
  body: string;
  badge?: string;
}) {
  const active = mode === current;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={() => onSelect(mode)}
      className={cn(
        'relative flex items-start gap-3 rounded-xl border bg-white p-3.5 text-left transition-all @2xl:flex-col @2xl:gap-2',
        active ? 'border-transparent bg-indigo-50/40 ring-2 ring-primary' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
      )}
    >
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-lg',
          mode === 'none' ? 'bg-slate-100 text-slate-600' : 'bg-amber-50 text-amber-600',
        )}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          {title}
          {badge && (
            <span className="rounded-full bg-indigo-100 px-1.5 py-px text-[10px] font-semibold text-indigo-700">{badge}</span>
          )}
        </span>
        <span className="mt-0.5 block text-xs leading-snug text-slate-500">{body}</span>
      </span>
      <span
        className={cn(
          'absolute top-3 right-3 flex size-4 items-center justify-center rounded-full border-2',
          active ? 'border-primary bg-primary' : 'border-slate-300 bg-white',
        )}
        aria-hidden
      >
        {active && <span className="size-1.5 rounded-full bg-white" />}
      </span>
    </button>
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
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-semibold text-slate-400">$</span>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        step={5}
        value={Number.isFinite(value) ? value : ''}
        onChange={(e) => onChange(e.target.value === '' ? 0 : Math.round(Number(e.target.value)))}
        className="pl-6 font-semibold text-emerald-800 tabular-nums"
      />
    </div>
  );
}

function QuickAmounts({ values, onPick }: { values: number[]; onPick: (v: number) => void }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {values.map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onPick(v)}
          className="inline-flex h-7 items-center rounded-full bg-slate-100 px-2.5 text-xs font-semibold text-slate-600 tabular-nums hover:bg-slate-200 hover:text-slate-900"
        >
          {money(v)}
        </button>
      ))}
    </div>
  );
}

function PresetChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold tabular-nums ring-1 transition-colors ring-inset',
        active ? 'bg-indigo-50 text-indigo-700 ring-indigo-300' : 'bg-white text-slate-700 ring-slate-300 hover:bg-slate-50',
      )}
    >
      {children}
    </button>
  );
}

export function EscrowSummary({ draft, className }: { draft: Draft; className?: string }) {
  const reward = draftReward(draft);
  const pool = rewardTotal(reward);
  const fee = Math.round((pool * PLATFORM_RULES.platformFeePct) / 100);
  return (
    <section className={cn('overflow-hidden rounded-xl border border-emerald-200 bg-white', className)} aria-label="Escrow summary">
      <div className="flex items-center gap-2 border-b border-emerald-100 bg-emerald-50/70 px-4 py-2.5">
        <Lock className="size-4 text-emerald-600" aria-hidden />
        <p className="text-sm font-semibold text-emerald-900">Escrow summary</p>
      </div>
      {pool > 0 ? (
        <div className="px-4 py-3">
          <dl className="space-y-1.5 text-[13px]">
            {reward.mode === 'top3' ? (
              reward.amounts.map((a, i) => (
                <div key={i} className="flex justify-between text-slate-600">
                  <dt>
                    {ordinal(i + 1)} place
                  </dt>
                  <dd className="tabular-nums">{money(a)}</dd>
                </div>
              ))
            ) : (
              <div className="flex justify-between text-slate-600">
                <dt>Winner</dt>
                <dd className="tabular-nums">{money(pool)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-100 pt-1.5 font-medium text-slate-800">
              <dt>Bounty pool</dt>
              <dd className="tabular-nums">{money(pool)}</dd>
            </div>
            <div className="flex justify-between text-slate-600">
              <dt>Platform fee ({PLATFORM_RULES.platformFeePct}%)</dt>
              <dd className="tabular-nums">{money(fee)}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-900">
              <dt>Charged today</dt>
              <dd className="text-emerald-700 tabular-nums">{money(pool + fee)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">
            The {money(pool)} pool sits in escrow from publish until you publish results
            {draft.deadline ? ` (deadline ${dateTime(draft.deadline)})` : ''}. Simulated for the demo — no card is charged.
          </p>
        </div>
      ) : (
        <p className="px-4 py-3 text-[13px] text-slate-600">
          Nothing to escrow and no platform fee. Students still get scores and written feedback on every submission.
        </p>
      )}
    </section>
  );
}
