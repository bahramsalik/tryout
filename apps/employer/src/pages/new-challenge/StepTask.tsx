import { Plus as Add, X as Dismiss } from '@/components/icons';
import { CHALLENGE_TYPES, DIFFICULTY_LABEL, PLATFORM_RULES, TYPE_META, type ChallengeType, type Company, type Difficulty } from '@shared/types';
import { Button, Field, IconButton, Input, Textarea, cn, selectClass } from '@/components/ui';
import { SUMMARY_MAX, type Draft, type StepErrors } from './draft';

interface StepProps {
  draft: Draft;
  set: (patch: Partial<Draft>) => void;
  errors: StepErrors;
  company: Company | null;
}

const HOURS = Array.from({ length: PLATFORM_RULES.maxEstHours - PLATFORM_RULES.minEstHours + 1 }, (_, i) => i + PLATFORM_RULES.minEstHours);

export function StepTask({ draft, set, errors, company }: StepProps) {
  return (
    <div className="space-y-5">
      <Field label="Title" htmlFor="f-title" error={errors.title}>
        <Input
          id="f-title"
          value={draft.title}
          onChange={(e) => set({ title: e.target.value })}
          placeholder="Add rate limiting to our tracking API"
          invalid={!!errors.title}
          autoComplete="off"
        />
      </Field>

      <div className="grid gap-5 @xl:grid-cols-3">
        <Field label="Field" htmlFor="f-type" error={errors.type}>
          <select
            id="f-type"
            className={cn(selectClass, !draft.type && 'text-slate-400')}
            value={draft.type ?? ''}
            onChange={(e) => set({ type: e.target.value as ChallengeType })}
          >
            <option value="" disabled>
              Select
            </option>
            {CHALLENGE_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_META[t].label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Hours" htmlFor="f-hours" error={errors.estHours}>
          <select id="f-hours" className={selectClass} value={draft.estHours} onChange={(e) => set({ estHours: Number(e.target.value) })}>
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {h} h
              </option>
            ))}
          </select>
        </Field>
        <Field label="Level" htmlFor="f-level">
          <select
            id="f-level"
            className={selectClass}
            value={draft.difficulty}
            onChange={(e) => set({ difficulty: e.target.value as Difficulty })}
          >
            {(['beginner', 'intermediate', 'advanced'] as const).map((d) => (
              <option key={d} value={d}>
                {DIFFICULTY_LABEL[d]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field
        label="Summary"
        htmlFor="f-summary"
        error={errors.summary}
        counter={
          <span className={cn(draft.summary.length > SUMMARY_MAX && 'text-red-600')}>
            {draft.summary.length}/{SUMMARY_MAX}
          </span>
        }
      >
        <Input
          id="f-summary"
          value={draft.summary}
          onChange={(e) => set({ summary: e.target.value })}
          placeholder="One line for the card"
          invalid={!!errors.summary}
          autoComplete="off"
        />
      </Field>

      <Field label="Brief" htmlFor="f-brief" error={errors.brief}>
        <Textarea
          id="f-brief"
          value={draft.brief}
          onChange={(e) => set({ brief: e.target.value })}
          rows={8}
          placeholder={'## Context\n\n## The task\n\n## Constraints'}
          invalid={!!errors.brief}
          className="font-mono"
        />
      </Field>

      <Field label="Deliverables" error={errors.deliverables}>
        <ListEditor values={draft.deliverables} onChange={(deliverables) => set({ deliverables })} />
      </Field>

      <Field label="Hiring for" optional htmlFor="f-hiring">
        <Input
          id="f-hiring"
          list="f-hiring-roles"
          value={draft.hiringFor}
          onChange={(e) => set({ hiringFor: e.target.value })}
          placeholder="Junior Backend Engineer"
          autoComplete="off"
        />
        <datalist id="f-hiring-roles">
          {company?.hiringFor.map((role) => (
            <option key={role} value={role} />
          ))}
        </datalist>
      </Field>

      <Field label="Classroom concepts" optional>
        <ConceptsEditor value={draft.classroomConcepts} onChange={(classroomConcepts) => set({ classroomConcepts })} />
      </Field>
    </div>
  );
}

function ListEditor({ values, onChange }: { values: string[]; onChange: (v: string[]) => void }) {
  const max = 8;
  return (
    <div className="space-y-2">
      {values.map((v, i) => (
        <div key={i} className="flex items-center gap-1">
          <Input
            value={v}
            onChange={(e) => onChange(values.map((x, j) => (j === i ? e.target.value : x)))}
            placeholder="Source code with tests"
            aria-label={`Deliverable ${i + 1}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (values.length < max) onChange([...values.slice(0, i + 1), '', ...values.slice(i + 1)]);
              }
            }}
          />
          <IconButton label={`Remove deliverable ${i + 1}`} onClick={() => onChange(values.length === 1 ? [''] : values.filter((_, j) => j !== i))}>
            <Dismiss className="size-4" />
          </IconButton>
        </div>
      ))}
      {values.length < max && (
        <Button variant="subtle" className="-ml-2" icon={<Add className="size-5" />} onClick={() => onChange([...values, ''])}>
          Add
        </Button>
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
        <div key={i} className="flex items-center gap-1">
          <div className="grid min-w-0 flex-1 gap-2 @lg:grid-cols-2">
            <Input
              value={c.concept}
              onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, concept: e.target.value } : x)))}
              placeholder="Token bucket"
              aria-label={`Concept ${i + 1}`}
            />
            <Input
              value={c.course}
              onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, course: e.target.value } : x)))}
              placeholder="Course"
              aria-label={`Course for concept ${i + 1}`}
            />
          </div>
          <IconButton label={`Remove concept ${i + 1}`} onClick={() => onChange(value.filter((_, j) => j !== i))}>
            <Dismiss className="size-4" />
          </IconButton>
        </div>
      ))}
      {value.length < 5 && (
        <Button variant="subtle" className="-ml-2" icon={<Add className="size-5" />} onClick={() => onChange([...value, { concept: '', course: '' }])}>
          Add
        </Button>
      )}
    </div>
  );
}
