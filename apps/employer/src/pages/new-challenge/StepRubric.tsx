import { useMutation } from '@tanstack/react-query';
import { Plus, Sparkles, X } from '@/components/icons';
import type { RubricSuggestRequest, RubricSuggestResponse } from '@shared/types';
import { api } from '@/lib/api';
import { Button, IconButton, InlineError, Input, cn } from '@/components/ui';
import { newKey, weightTotal, type Draft, type RubricRow, type StepErrors } from './draft';

/** Judging: criteria (name + weight %), weights must total 100. Each is scored 1–5 in review. */
export function StepRubric({
  draft,
  set,
  errors,
}: {
  draft: Draft;
  set: (patch: Partial<Draft>) => void;
  errors: StepErrors;
}) {
  const rows = draft.rubric;
  const total = weightTotal(rows);

  const suggest = useMutation({
    mutationFn: (body: RubricSuggestRequest) => api<RubricSuggestResponse>('/ai/rubric', { method: 'POST', json: body }),
    onSuccess: (res) => {
      const next = (res.rubric ?? []).map((r) => ({ key: newKey(), name: r.name, description: r.description, weight: r.weight }));
      if (next.length) set({ rubric: next });
    },
  });

  const update = (key: string, patch: Partial<RubricRow>) =>
    set({ rubric: rows.map((r) => (r.key === key ? { ...r, ...patch } : r)) });
  const remove = (key: string) => set({ rubric: rows.filter((r) => r.key !== key) });
  const add = () => {
    const remaining = Math.max(0, 100 - total);
    set({ rubric: [...rows, { key: newKey(), name: '', description: '', weight: remaining || 10 }] });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn('text-sm tabular-nums', rows.length > 0 && total !== 100 ? 'text-red-600' : 'text-slate-600')}
          aria-live="polite"
        >
          Total {total}%
        </span>
        <Button
          className="ml-auto"
          onClick={() => draft.type && suggest.mutate({ type: draft.type, title: draft.title, brief: draft.brief })}
          disabled={!draft.type}
          loading={suggest.isPending}
          icon={<Sparkles className="size-5" aria-hidden />}
        >
          Suggest rubric
        </Button>
      </div>
      <InlineError error={suggest.error} />

      {rows.length > 0 && (
        <ol className="space-y-2">
          {rows.map((r, i) => (
            <li key={r.key} className="flex items-center gap-2">
              <Input
                value={r.name}
                onChange={(e) => update(r.key, { name: e.target.value })}
                placeholder="Correctness"
                aria-label={`Criterion ${i + 1} name`}
                title={r.description || undefined}
                invalid={!!errors.rubric && !r.name.trim()}
              />
              <div className="relative w-20 shrink-0">
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={100}
                  step={1}
                  value={Number.isFinite(r.weight) ? r.weight : ''}
                  onChange={(e) => update(r.key, { weight: e.target.value === '' ? NaN : Math.round(Number(e.target.value)) })}
                  aria-label={`Criterion ${i + 1} weight in percent`}
                  className="pr-6 text-right tabular-nums"
                />
                <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-sm text-slate-500">%</span>
              </div>
              <IconButton label={`Remove criterion ${i + 1}`} onClick={() => remove(r.key)}>
                <X className="size-4" />
              </IconButton>
            </li>
          ))}
        </ol>
      )}

      {rows.length < 8 && (
        <Button variant="subtle" className="-ml-2" icon={<Plus className="size-5" />} onClick={add}>
          Add criterion
        </Button>
      )}

      {(errors.rubric || errors.weights) && <p className="text-xs text-red-600">{errors.rubric ?? errors.weights}</p>}
    </div>
  );
}
