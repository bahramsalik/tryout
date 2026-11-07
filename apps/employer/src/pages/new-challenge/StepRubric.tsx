import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle2, Equal, Plus, Scale, Sparkles, Trash2 } from 'lucide-react';
import { TYPE_META, type RubricSuggestRequest, type RubricSuggestResponse } from '@shared/types';
import { api, errorMessage } from '@/lib/api';
import { Button, EmptyState, Input, TypingDots, cn } from '@/components/ui';
import { newKey, weightTotal, type Draft, type RubricRow, type StepErrors } from './draft';

const BAR_COLORS = ['#4F46E5', '#7C3AED', '#0891B2', '#DB2777', '#EA580C', '#059669', '#64748B', '#CA8A04'];

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
      if (next.length === 0) {
        toast.info('No suggestion for this field yet — add criteria by hand.');
        return;
      }
      set({ rubric: next });
      toast.success('Rubric suggested', { description: 'Tweak names and weights to match what you care about.' });
    },
    onError: (err) => toast.error('Couldn’t suggest a rubric', { description: errorMessage(err) }),
  });

  const update = (key: string, patch: Partial<RubricRow>) =>
    set({ rubric: rows.map((r) => (r.key === key ? { ...r, ...patch } : r)) });
  const remove = (key: string) => set({ rubric: rows.filter((r) => r.key !== key) });
  const add = () => {
    const remaining = Math.max(0, 100 - total);
    set({ rubric: [...rows, { key: newKey(), name: '', description: '', weight: remaining || 10 }] });
  };
  const evenSplit = () => {
    if (rows.length === 0) return;
    const base = Math.floor(100 / rows.length);
    let extra = 100 - base * rows.length;
    set({ rubric: rows.map((r) => ({ ...r, weight: base + (extra-- > 0 ? 1 : 0) })) });
  };

  const canSuggest = !!draft.type && !suggest.isPending;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50/70 p-4 @xl:flex-row @xl:items-center">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
            <Sparkles className="size-4 text-violet-600" aria-hidden /> Not sure how to judge it?
          </p>
          <p className="mt-0.5 text-[13px] text-slate-600">
            {draft.type
              ? `Get a proven ${TYPE_META[draft.type].label.toLowerCase()} rubric you can edit. Students see it before they start.`
              : 'Pick a field in step 1 to get a suggested rubric.'}
          </p>
        </div>
        <Button
          variant="dark"
          onClick={() => draft.type && suggest.mutate({ type: draft.type, title: draft.title, brief: draft.brief })}
          disabled={!canSuggest}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700"
          icon={suggest.isPending ? undefined : <Sparkles className="size-4" aria-hidden />}
        >
          {suggest.isPending ? (
            <>
              Thinking <TypingDots />
            </>
          ) : (
            'Suggest rubric'
          )}
        </Button>
      </div>

      <WeightsIndicator rows={rows} total={total} onEvenSplit={evenSplit} />

      {suggest.isPending ? (
        <div className="space-y-2" aria-busy>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="skeleton h-4 w-1/3" />
              <div className="skeleton mt-2 h-3 w-4/5" />
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white">
          <EmptyState
            compact
            icon={<Scale className="size-5" aria-hidden />}
            title="No criteria yet"
            body="Each criterion is scored 1–5 and weighted. Weights must total 100%."
            action={
              <Button size="sm" icon={<Plus className="size-3.5" />} onClick={add}>
                Add criterion
              </Button>
            }
          />
        </div>
      ) : (
        <ol className="space-y-2">
          {rows.map((r, i) => (
            <li
              key={r.key}
              className="animate-pop-in rounded-xl border border-slate-200 bg-white p-3 shadow-card"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className="flex items-start gap-2">
                <span
                  className="mt-2 size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }}
                  aria-hidden
                />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={r.name}
                      onChange={(e) => update(r.key, { name: e.target.value })}
                      placeholder="Criterion, e.g. Correctness"
                      aria-label={`Criterion ${i + 1} name`}
                      className="font-semibold"
                      invalid={!!errors.rubric && !r.name.trim()}
                    />
                    <div className="relative w-24 shrink-0">
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={100}
                        step={1}
                        value={Number.isFinite(r.weight) ? r.weight : ''}
                        onChange={(e) => update(r.key, { weight: e.target.value === '' ? NaN : Math.round(Number(e.target.value)) })}
                        aria-label={`Criterion ${i + 1} weight in percent`}
                        className="pr-7 text-right tabular-nums"
                      />
                      <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs font-semibold text-slate-400">
                        %
                      </span>
                    </div>
                  </div>
                  <Input
                    value={r.description}
                    onChange={(e) => update(r.key, { description: e.target.value })}
                    placeholder="What does a 5 look like? e.g. Limits are enforced per API key, with 429 + Retry-After."
                    aria-label={`Criterion ${i + 1} description`}
                    className="h-8 text-[13px]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => remove(r.key)}
                  className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                  aria-label={`Remove criterion ${i + 1}`}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}

      {rows.length > 0 && !suggest.isPending && rows.length < 8 && (
        <Button size="sm" variant="secondary" icon={<Plus className="size-3.5" />} onClick={add}>
          Add criterion
        </Button>
      )}

      {errors.rubric && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-red-600">
          <AlertCircle className="size-3.5" aria-hidden /> {errors.rubric}
        </p>
      )}

      <p className="text-xs text-slate-500">
        Scoring: each criterion gets 1–5. Total = Σ (score ÷ 5 × weight), so a perfect submission scores 100.
      </p>
    </div>
  );
}

function WeightsIndicator({ rows, total, onEvenSplit }: { rows: RubricRow[]; total: number; onEvenSplit: () => void }) {
  const ok = total === 100;
  const over = total > 100;
  return (
    <div
      className={cn(
        'rounded-xl border p-3 transition-colors',
        rows.length === 0 ? 'border-slate-200 bg-white' : ok ? 'border-emerald-200 bg-emerald-50/50' : over ? 'border-red-200 bg-red-50/50' : 'border-amber-200 bg-amber-50/50',
      )}
      aria-live="polite"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 text-sm font-semibold tabular-nums',
            rows.length === 0 ? 'text-slate-500' : ok ? 'text-emerald-700' : over ? 'text-red-700' : 'text-amber-800',
          )}
        >
          {ok ? <CheckCircle2 className="size-4" aria-hidden /> : <Scale className="size-4" aria-hidden />}
          Weights: {total}% / 100%
        </span>
        <span className="text-xs text-slate-500">
          {rows.length === 0
            ? 'Add criteria to start'
            : ok
              ? 'Balanced — ready to go'
              : over
                ? `Remove ${total - 100}%`
                : `Add ${100 - total}% more`}
        </span>
        {rows.length > 1 && !ok && (
          <Button size="xs" variant="ghost" className="ml-auto" icon={<Equal className="size-3.5" />} onClick={onEvenSplit}>
            Split evenly
          </Button>
        )}
      </div>
      <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-slate-200/70">
        {rows.map((r, i) => (
          <div
            key={r.key}
            className="h-full transition-[width] duration-300 first:rounded-l-full last:rounded-r-full"
            style={{
              width: `${Math.max(0, Math.min(100, Number.isFinite(r.weight) ? r.weight : 0) * (total > 100 ? 100 / total : 1))}%`,
              backgroundColor: BAR_COLORS[i % BAR_COLORS.length],
            }}
            title={`${r.name || 'Criterion'} · ${r.weight}%`}
          />
        ))}
      </div>
    </div>
  );
}
