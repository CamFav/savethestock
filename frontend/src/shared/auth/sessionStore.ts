import { create } from "zustand";

type Session = {
  jwtToken: string | null;
  accountId: string | null;
  companyId: string | null;
  role: string | null;
  displayName: string | null;
};

type SessionStore = Session & {
  setSession: (s: Required<Session>) => void;
  clearSession: () => void;
};

const STORAGE_KEY = "savethestock.session.v1";

function loadSession(): Session {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { jwtToken: null, accountId: null, companyId: null, role: null, displayName: null };
    }
    const parsed = JSON.parse(raw) as Session;
    return {
      jwtToken: parsed.jwtToken ?? null,
      accountId: parsed.accountId ?? null,
      companyId: parsed.companyId ?? null,
      role: parsed.role ?? null,
      displayName: parsed.displayName ?? null,
    };
  } catch {
    return { jwtToken: null, accountId: null, companyId: null, role: null, displayName: null };
  }
}

function persistSession(s: Session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export const useSessionStore = create<SessionStore>((set) => ({
  ...loadSession(),

  setSession: (s) => {
    const next: Session = {
      jwtToken: s.jwtToken,
      accountId: s.accountId,
      companyId: s.companyId,
      role: s.role,
      displayName: s.displayName,
    };
    set(next);
    persistSession(next);
  },

  clearSession: () => {
    const empty: Session = { jwtToken: null, accountId: null, companyId: null, role: null, displayName: null };
    set(empty);
    localStorage.removeItem(STORAGE_KEY);
  },
}));


export function getJwtToken(): string | null {
  return useSessionStore.getState().jwtToken;
}
