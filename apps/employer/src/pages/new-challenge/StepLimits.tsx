import { fromLocalInput, toLocalInput } from '@/lib/format';
import { Field, Input } from '@/components/ui';
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
    </div>
  );
}
