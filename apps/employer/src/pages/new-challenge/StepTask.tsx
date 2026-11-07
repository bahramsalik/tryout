import { useState, type CSSProperties, type KeyboardEvent } from 'react';
import { Briefcase, FileText, GraduationCap, Plus, Timer, X } from 'lucide-react';
import { CHALLENGE_TYPES, DIFFICULTY_LABEL, PLATFORM_RULES, TYPE_META, type ChallengeType, type Company, type Difficulty } from '@shared/types';
import { TypeIcon } from '@/components/brand';
import { Markdown } from '@/components/Markdown';
import { Button, Field, Input, Segmented, cn } from '@/components/ui';
import { BRIEF_TEMPLATE, SKILL_SUGGESTIONS, SUMMARY_MAX, TITLE_MAX, type Draft, type StepErrors } from './draft';

interface StepProps {
  draft: Draft;
  set: (patch: Partial<Draft>) => void;
  errors: StepErrors;
  company: Company | null;
}

export function StepTask({ draft, set, errors, company }: StepProps) {
  return (
    <div className="space-y-6">
      <Field
        label="Title"
        htmlFor="f-title"
        error={errors.title}
        counter={`${draft.title.length}/${TITLE_MAX}`}
        hint="Name the real task, e.g. “Add rate limiting to our Shipment Tracking API”."
      >
        <Input
          id="f-title"
          value={draft.title}
          maxLength={TITLE_MAX + 20}
          onChange={(e) => set({ title: e.target.value })}
          placeholder="What will students actually do?"
          invalid={!!errors.title}
          autoComplete="off"
        />
      </Field>

      <Field label="Field" error={errors.type} hint="Students browse by field — this sets the card color and who gets notified.">
        <TypePicker value={draft.type} onChange={(type) => set({ type })} />
      </Field>

      <Field
        label="Card summary"
        htmlFor="f-summary"
        error={errors.summary}
        counter={
          <span className={cn(draft.summary.length > SUMMARY_MAX && 'font-semibold text-red-600')}>
            {draft.summary.length}/{SUMMARY_MAX}
          </span>
        }
        hint="One line shown on the student card."
      >
        <Input
          id="f-summary"
          value={draft.summary}
          onChange={(e) => set({ summary: e.target.value })}
          placeholder="Protect a public API from noisy clients with per-key limits, proper 429s and tests."
          invalid={!!errors.summary}
          autoComplete="off"
        />
      </Field>

      <BriefEditor value={draft.brief} onChange={(brief) => set({ brief })} error={errors.brief} />

      <Field label="Deliverables" error={errors.deliverables} hint="What students hand in. Keep it to 3–5 items.">
        <ListEditor
          values={draft.deliverables}
          onChange={(deliverables) => set({ deliverables })}
          placeholder="e.g. Source code with tests"
          addLabel="Add deliverable"
          max={8}
        />
      </Field>

      <div className="grid gap-6 @2xl:grid-cols-2">
        <HoursSlider value={draft.estHours} onChange={(estHours) => set({ estHours })} error={errors.estHours} />
        <Field label="Difficulty">
          <Segmented<Difficulty>
            label="Difficulty"
            value={draft.difficulty}
            onChange={(difficulty) => set({ difficulty })}
            options={(['beginner', 'intermediate', 'advanced'] as const).map((d) => ({ value: d, label: DIFFICULTY_LABEL[d] }))}
            className="w-full [&>button]:flex-1 [&>button]:justify-center"
          />
        </Field>
      </div>

      <Field label="Skills" optional hint="Press Enter to add. Shown as tags and used in talent search.">
        <TagInput
          values={draft.skills}
          onChange={(skills) => set({ skills })}
          suggestions={draft.type ? SKILL_SUGGESTIONS[draft.type] : []}
        />
      </Field>

      <Field
        label={
          <span className="inline-flex items-center gap-1.5">
            <GraduationCap className="size-4 text-indigo-500" aria-hidden /> From the classroom
          </span>
        }
        optional
        hint="The course concepts this task applies — the bridge from theory to practice students see on the brief."
      >
        <ConceptsEditor value={draft.classroomConcepts} onChange={(classroomConcepts) => set({ classroomConcepts })} />
      </Field>

      <Field
        label={
          <span className="inline-flex items-center gap-1.5">
            <Briefcase className="size-4 text-violet-500" aria-hidden /> Hiring for
          </span>
        }
        optional
        htmlFor="f-hiring"
        hint="Link the challenge to a real open role. Top performers can be invited to interview for it."
      >
        <Input
          id="f-hiring"
          value={draft.hiringFor}
          onChange={(e) => set({ hiringFor: e.target.value })}
          placeholder="e.g. Junior Backend Engineer · Full-time · Remote (US)"
          autoComplete="off"
        />
        {company && company.hiringFor.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {company.hiringFor.map((role) => {
              const active = draft.hiringFor.startsWith(role);
              return (
                <button
                  key={role}
                  type="button"
                  onClick={() => set({ hiringFor: active ? '' : role })}
                  className={cn(
                    'inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-medium ring-1 transition-colors ring-inset',
                    active ? 'bg-violet-50 text-violet-800 ring-violet-300' : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50',
                  )}
                  aria-pressed={active}
                >
                  {active ? <X className="size-3" aria-hidden /> : <Plus className="size-3" aria-hidden />}
                  {role}
                </button>
              );
            })}
          </div>
        )}
      </Field>
    </div>
  );
}

function TypePicker({ value, onChange }: { value: ChallengeType | null; onChange: (t: ChallengeType) => void }) {
  return (
    <div role="radiogroup" aria-label="Field" className="grid grid-cols-2 gap-2 @lg:grid-cols-3 @3xl:grid-cols-4">
      {CHALLENGE_TYPES.map((t) => {
        const meta = TYPE_META[t];
        const active = value === t;
        return (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(t)}
            className={cn(
              'group flex items-start gap-2.5 rounded-xl border bg-white p-2.5 text-left transition-all',
              active ? 'border-transparent shadow-sm ring-2' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
            )}
            style={active ? ({ '--tw-ring-color': meta.color, backgroundColor: meta.softBg } as CSSProperties) : undefined}
          >
            <span
              className="flex size-8 shrink-0 items-center justify-center rounded-lg"
              style={{ backgroundColor: active ? '#fff' : meta.softBg, color: meta.color }}
            >
              <TypeIcon type={t} className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold text-slate-900">{meta.label}</span>
              <span className="mt-0.5 line-clamp-2 block text-[11px] leading-snug text-slate-500">{meta.blurb}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function BriefEditor({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: string }) {
  const [mode, setMode] = useState<'write' | 'preview'>('write');
  return (
    <Field
      label="Brief"
      htmlFor="f-brief"
      error={error}
      hint="Markdown supported. A good brief covers Context · The task · Constraints · What we provide."
    >
      <div className={cn('overflow-hidden rounded-lg border bg-white shadow-sm', error ? 'border-red-400' : 'border-slate-300')}>
        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-2 py-1.5">
          <Segmented
            label="Brief editor mode"
            size="sm"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'write', label: 'Write' },
              { value: 'preview', label: 'Preview' },
            ]}
          />
          <Button
            size="xs"
            variant="ghost"
            className="ml-auto"
            icon={<FileText className="size-3.5" aria-hidden />}
            onClick={() => {
              onChange(value.trim() ? `${value.trimEnd()}\n\n${BRIEF_TEMPLATE}` : BRIEF_TEMPLATE);
              setMode('write');
            }}
          >
            Insert template
          </Button>
        </div>
        {mode === 'write' ? (
          <textarea
            id="f-brief"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={10}
            placeholder={'## Context\nWho you are and why this matters…'}
            className="block w-full resize-y border-0 px-3 py-2.5 font-mono text-[13px] leading-relaxed text-slate-800 placeholder:text-slate-400 focus:ring-0 focus:outline-none"
          />
        ) : (
          <div className="max-h-96 min-h-[12rem] overflow-y-auto px-4 py-3">
            {value.trim() ? <Markdown>{value}</Markdown> : <p className="text-sm text-slate-400">Nothing to preview yet.</p>}
          </div>
        )}
      </div>
    </Field>
  );
}

function HoursSlider({ value, onChange, error }: { value: number; onChange: (v: number) => void; error?: string }) {
  const max = PLATFORM_RULES.maxEstHours;
  return (
    <Field label="Estimated time" htmlFor="f-hours" error={error}>
      <div className="rounded-lg border border-slate-200 bg-white px-3 pt-2.5 pb-2 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900 tabular-nums">
            <Timer className="size-4 text-primary" aria-hidden />~{value} {value === 1 ? 'hour' : 'hours'}
          </span>
          <span className="text-[11px] font-medium text-slate-500">Max {max} h</span>
        </div>
        <input
          id="f-hours"
          type="range"
          min={PLATFORM_RULES.minEstHours}
          max={max}
          step={1}
          value={value}
          onChange={(e) => onChange(Math.min(max, Math.max(1, Number(e.target.value))))}
          className="mt-2 w-full accent-indigo-600"
          aria-valuetext={`${value} hours`}
        />
        <div className="flex justify-between px-0.5 text-[10px] text-slate-400 tabular-nums" aria-hidden>
          {Array.from({ length: max }, (_, i) => (
            <span key={i} className={cn(i + 1 === value && 'font-semibold text-primary')}>
              {i + 1}h
            </span>
          ))}
        </div>
      </div>
      <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-500">
        <span className="rounded bg-indigo-50 px-1 py-px text-[10px] font-semibold tracking-wide text-indigo-700 uppercase">Rule</span>
        Platform rule: tasks must fit in {max} hours.
      </p>
    </Field>
  );
}

function ListEditor({
  values,
  onChange,
  placeholder,
  addLabel,
  max,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
  addLabel: string;
  max: number;
}) {
  return (
    <div className="space-y-2">
      {values.map((v, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-5 shrink-0 text-right text-xs font-semibold text-slate-400 tabular-nums">{i + 1}.</span>
          <Input
            value={v}
            onChange={(e) => onChange(values.map((x, j) => (j === i ? e.target.value : x)))}
            placeholder={placeholder}
            aria-label={`Deliverable ${i + 1}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (values.length < max) onChange([...values.slice(0, i + 1), '', ...values.slice(i + 1)]);
              }
            }}
          />
          <button
            type="button"
            onClick={() => onChange(values.length === 1 ? [''] : values.filter((_, j) => j !== i))}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label={`Remove deliverable ${i + 1}`}
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
      {values.length < max && (
        <Button size="sm" variant="ghost" className="ml-6" icon={<Plus className="size-3.5" />} onClick={() => onChange([...values, ''])}>
          {addLabel}
        </Button>
      )}
    </div>
  );
}

function TagInput({ values, onChange, suggestions }: { values: string[]; onChange: (v: string[]) => void; suggestions: string[] }) {
  const [text, setText] = useState('');
  const add = (raw: string) => {
    const tag = raw.trim().replace(/,$/, '');
    if (!tag || values.some((v) => v.toLowerCase() === tag.toLowerCase()) || values.length >= 12) return;
    onChange([...values, tag]);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(text);
      setText('');
    } else if (e.key === 'Backspace' && !text && values.length) {
      onChange(values.slice(0, -1));
    }
  };
  const remaining = suggestions.filter((s) => !values.some((v) => v.toLowerCase() === s.toLowerCase()));
  return (
    <div>
      <div className="flex min-h-9 flex-wrap items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2 py-1.5 shadow-sm focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/30">
        {values.map((v) => (
          <span key={v} className="inline-flex h-6 items-center gap-1 rounded-md bg-slate-100 pr-1 pl-2 text-xs font-medium text-slate-700">
            {v}
            <button
              type="button"
              onClick={() => onChange(values.filter((x) => x !== v))}
              className="inline-flex size-4 items-center justify-center rounded text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              aria-label={`Remove ${v}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => {
            if (text.trim()) {
              add(text);
              setText('');
            }
          }}
          placeholder={values.length ? '' : 'Type a skill and press Enter'}
          className="h-6 min-w-[8rem] flex-1 border-0 bg-transparent p-0 text-sm placeholder:text-slate-400 focus:ring-0 focus:outline-none"
          aria-label="Add a skill"
        />
      </div>
      {remaining.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-slate-400">Suggested:</span>
          {remaining.slice(0, 6).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="inline-flex h-6 items-center gap-0.5 rounded-full bg-white px-2 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200 ring-inset hover:bg-slate-50 hover:text-slate-900"
            >
              <Plus className="size-3" aria-hidden />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ConceptsEditor({
  value,
  onChange,
}: {
  value: { concept: string; course: string }[];
  onChange: (v: { concept: string; course: string }[]) => void;
}) {
  return (
    <div className="space-y-2">
      {value.map((c, i) => (
        <div key={i} className="grid grid-cols-[1fr_auto] gap-2 @lg:grid-cols-[1fr_1fr_auto]">
          <Input
            value={c.concept}
            onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, concept: e.target.value } : x)))}
            placeholder="Concept, e.g. Token bucket algorithm"
            aria-label={`Concept ${i + 1}`}
          />
          <Input
            value={c.course}
            onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, course: e.target.value } : x)))}
            placeholder="Course, e.g. Data Structures & Algorithms"
            aria-label={`Course for concept ${i + 1}`}
            className="max-@lg:order-3 max-@lg:col-span-2"
          />
          <button
            type="button"
            onClick={() => onChange(value.filter((_, j) => j !== i))}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label={`Remove concept ${i + 1}`}
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
      {value.length < 5 && (
        <Button
          size="sm"
          variant="ghost"
          icon={<Plus className="size-3.5" />}
          onClick={() => onChange([...value, { concept: '', course: '' }])}
        >
          Add concept
        </Button>
      )}
    </div>
  );
}
