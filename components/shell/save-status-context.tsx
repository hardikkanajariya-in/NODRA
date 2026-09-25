"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type Ctx = {
  status: SaveStatus;
  setStatus: (s: SaveStatus) => void;
  lastSaved: Date | null;
  setLastSaved: (d: Date) => void;
};

const SaveStatusContext = createContext<Ctx | null>(null);

export function SaveStatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const value = useMemo(
    () => ({ status, setStatus, lastSaved, setLastSaved }),
    [status, lastSaved],
  );
  return (
    <SaveStatusContext.Provider value={value}>
      {children}
    </SaveStatusContext.Provider>
  );
}

export function useSaveStatus() {
  const ctx = useContext(SaveStatusContext);
  if (!ctx) throw new Error("SaveStatusProvider required");
  return ctx;
}
