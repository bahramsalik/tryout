import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { getPersona, setPersona as setApiPersona } from './api';

interface PersonaContextValue {
  personaId: string;
  setPersonaId: (id: string) => void;
}

const PersonaContext = createContext<PersonaContextValue | null>(null);

/**
 * Current demo persona (a `stu_*` id). Every query key includes it, so switching persona
 * loads that student's data on its own; the old persona's cache simply ages out.
 */
export function PersonaProvider({ children }: { children: ReactNode }) {
  const [personaId, setState] = useState(getPersona);

  const setPersonaId = useCallback((id: string) => {
    if (id === getPersona()) return;
    setApiPersona(id);
    setState(id);
  }, []);

  const value = useMemo(() => ({ personaId, setPersonaId }), [personaId, setPersonaId]);
  return <PersonaContext.Provider value={value}>{children}</PersonaContext.Provider>;
}

export function usePersona(): PersonaContextValue {
  const ctx = useContext(PersonaContext);
  if (!ctx) throw new Error('usePersona must be used inside <PersonaProvider>');
  return ctx;
}
