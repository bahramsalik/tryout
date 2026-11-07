import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Company, EmployerUser } from '@shared/types';
import { DEFAULT_PERSONA, getPersona, storePersona } from './api';
import { queryClient, usePersonas } from './queries';

export type EmployerPersona = EmployerUser & { company: Company };

interface PersonaContextValue {
  personaId: string;
  employer: EmployerPersona | null;
  company: Company | null;
  employers: EmployerPersona[];
  loading: boolean;
  error: unknown;
  switchPersona: (id: string) => void;
}

const PersonaContext = createContext<PersonaContextValue | null>(null);

export function PersonaProvider({ children }: { children: ReactNode }) {
  const [personaId, setPersonaId] = useState(getPersona);
  const personas = usePersonas();

  const employers = useMemo(() => personas.data?.employers ?? [], [personas.data]);
  const employer =
    employers.find((e) => e.id === personaId) ?? employers.find((e) => e.id === DEFAULT_PERSONA) ?? employers[0] ?? null;

  // Self-heal a stale stored persona (e.g. after a reseed renamed users). The API client reads the
  // module-level persona, so keep it in sync synchronously, before any child query fires.
  const effectiveId = employer?.id ?? personaId;
  if (effectiveId !== getPersona()) storePersona(effectiveId);

  const switchPersona = useCallback((id: string) => {
    if (id === getPersona()) return;
    storePersona(id);
    // Everything except the persona list is persona-scoped: drop it and let the keyed shell remount.
    queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== 'personas' && q.queryKey[0] !== 'health' });
    setPersonaId(id);
  }, []);

  const value = useMemo<PersonaContextValue>(
    () => ({
      personaId: effectiveId,
      employer,
      company: employer?.company ?? null,
      employers,
      loading: personas.isPending,
      error: personas.error,
      switchPersona,
    }),
    [effectiveId, employer, employers, personas.isPending, personas.error, switchPersona],
  );

  return <PersonaContext.Provider value={value}>{children}</PersonaContext.Provider>;
}

export function usePersona(): PersonaContextValue {
  const ctx = useContext(PersonaContext);
  if (!ctx) throw new Error('usePersona must be used inside <PersonaProvider>');
  return ctx;
}
