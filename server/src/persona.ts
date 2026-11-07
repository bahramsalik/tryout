/** Demo identity: `X-Demo-User: <id>` header, or `?as=<id>` for links/downloads (SPEC §7.4). */
import type { Request } from 'express';
import type { Company, EmployerUser, Student } from '../../shared/types.ts';
import { forbidden, unauthorized } from './errors.ts';
import { getDb } from './store.ts';

export type Persona =
  | { kind: 'student'; id: string; student: Student }
  | { kind: 'employer'; id: string; employer: EmployerUser; company: Company };

export type StudentPersona = Extract<Persona, { kind: 'student' }>;
export type EmployerPersona = Extract<Persona, { kind: 'employer' }>;

function personaId(req: Request): string | null {
  const header = req.get('x-demo-user');
  if (header && header.trim()) return header.trim();
  const as = req.query.as;
  if (typeof as === 'string' && as.trim()) return as.trim();
  return null;
}

/** undefined = no persona sent; null = sent but unknown. */
function lookup(req: Request): Persona | null | undefined {
  const id = personaId(req);
  if (!id) return undefined;
  const db = getDb();
  if (id.startsWith('stu_')) {
    const student = db.students.find((s) => s.id === id);
    return student ? { kind: 'student', id, student } : null;
  }
  if (id.startsWith('emp_')) {
    const employer = db.employers.find((e) => e.id === id);
    const company = employer && db.companies.find((c) => c.id === employer.companyId);
    return employer && company ? { kind: 'employer', id, employer, company } : null;
  }
  return null;
}

/** For "any" endpoints: the persona if a known one was sent, otherwise null (never throws). */
export function optionalPersona(req: Request): Persona | null {
  return lookup(req) ?? null;
}

export function requirePersona(req: Request): Persona {
  const p = lookup(req);
  if (p === undefined) throw unauthorized('NO_PERSONA', 'Send an X-Demo-User header (or ?as=) with a persona id.');
  if (p === null) {
    throw unauthorized('UNKNOWN_PERSONA', `Unknown persona "${personaId(req)}". Pick one from GET /api/personas (the data may have been reseeded).`);
  }
  return p;
}

export function requireStudent(req: Request): StudentPersona {
  const p = requirePersona(req);
  if (p.kind !== 'student') throw forbidden('WRONG_ROLE', 'This endpoint is for students.');
  return p;
}

export function requireEmployer(req: Request): EmployerPersona {
  const p = requirePersona(req);
  if (p.kind !== 'employer') throw forbidden('WRONG_ROLE', 'This endpoint is for employers.');
  return p;
}
