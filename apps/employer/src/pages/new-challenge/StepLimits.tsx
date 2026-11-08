import { fromLocalInput, toLocalInput } from '@/lib/format';
import { Field, Input, selectClass } from '@/components/ui';
import type { Draft, StepErrors } from './draft';

export function StepLimits({ draft, set, errors }: { draft: Draft; set: (patch: Partial<Draft>) => void; errors: StepErrors }) {
  return (
    <div className="space-y-5">
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
      <Field label="Award" htmlFor="f-placements">
        <select
          id="f-placements"
          className={`${selectClass} w-52`}
          value={draft.placements ?? 0}
          onChange={(e) => set({ placements: Number(e.target.value) })}
        >
          <option value={0}>No award</option>
          <option value={1}>Top 1 gets a medal</option>
          <option value={3}>Top 3 get medals</option>
        </select>
      </Field>
      {(draft.placements ?? 0) > 0 && (
        <Field label="Prize (optional)" htmlFor="f-prize">
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-sm text-slate-500">$</span>
              <Input
                id="f-prize"
                type="number"
                inputMode="numeric"
                min={0}
                step={10}
                placeholder="None"
                value={draft.prizePool > 0 ? draft.prizePool : ''}
                onChange={(e) => set({ prizePool: e.target.value === '' ? 0 : Math.max(0, Math.round(Number(e.target.value))) })}
                className="w-32 pl-6 tabular-nums"
              />
            </div>
            {draft.placements === 3 && <span className="text-sm text-slate-600">Split 50 / 30 / 20</span>}
          </div>
        </Field>
      )}
    </div>
  );
}
