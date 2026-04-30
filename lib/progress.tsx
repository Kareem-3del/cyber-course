"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";

interface Ctx {
  completed: Set<string>;
  toggle: (slug: string) => void;
  isDone: (slug: string) => boolean;
  reset: () => void;
}

const ProgressContext = createContext<Ctx | null>(null);
const KEY = "lesson-progress-v1";

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setCompleted(new Set(JSON.parse(raw)));
    } catch {}
  }, []);

  const persist = (s: Set<string>) => {
    try { localStorage.setItem(KEY, JSON.stringify([...s])); } catch {}
  };

  const toggle = useCallback((slug: string) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug); else next.add(slug);
      persist(next);
      return next;
    });
  }, []);

  const isDone = useCallback((slug: string) => completed.has(slug), [completed]);
  const reset = useCallback(() => { setCompleted(new Set()); persist(new Set()); }, []);

  return (
    <ProgressContext.Provider value={{ completed, toggle, isDone, reset }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress outside provider");
  return ctx;
}
