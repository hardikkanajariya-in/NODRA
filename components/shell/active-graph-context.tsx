"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";

export type ActiveGraphSummary = {
  id: string;
  name: string;
};

const ActiveGraphContext = createContext<ActiveGraphSummary | null>(null);

export function ActiveGraphProvider({
  graph,
  children,
}: {
  graph: ActiveGraphSummary;
  children: ReactNode;
}) {
  return (
    <ActiveGraphContext.Provider value={graph}>
      {children}
    </ActiveGraphContext.Provider>
  );
}

export function useActiveGraph(): ActiveGraphSummary {
  const ctx = useContext(ActiveGraphContext);
  if (!ctx?.id) {
    throw new Error("ActiveGraphProvider required");
  }
  return ctx;
}

export function useOptionalActiveGraph(): ActiveGraphSummary | null {
  return useContext(ActiveGraphContext);
}
