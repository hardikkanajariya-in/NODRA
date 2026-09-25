"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type SaveStatus = "idle" | "saving" | "saved" | "error";

type Ctx = {
  saveStatus: SaveStatus;
  setSaveStatus: (s: SaveStatus) => void;
  lastSaved: Date | null;
  setLastSaved: (d: Date) => void;
  routeLoading: boolean;
  setRouteLoading: (v: boolean) => void;
  uploadActive: boolean;
  uploadProgress: number | null;
  beginUpload: () => void;
  setUploadProgress: (percent: number) => void;
  endUpload: () => void;
};

const AppActivityContext = createContext<Ctx | null>(null);

export function AppActivityProvider({ children }: { children: ReactNode }) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const [uploadProgress, setUploadProgressState] = useState<number | null>(
    null,
  );

  const beginUpload = useCallback(() => {
    setUploadCount((c) => c + 1);
    setUploadProgressState(0);
  }, []);
  const setUploadProgress = useCallback((percent: number) => {
    setUploadProgressState(Math.max(0, Math.min(100, percent)));
  }, []);
  const endUpload = useCallback(() => {
    setUploadCount((c) => {
      const next = Math.max(0, c - 1);
      if (next === 0) setUploadProgressState(null);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      saveStatus,
      setSaveStatus,
      lastSaved,
      setLastSaved,
      routeLoading,
      setRouteLoading,
      uploadActive: uploadCount > 0,
      uploadProgress,
      beginUpload,
      setUploadProgress,
      endUpload,
    }),
    [
      saveStatus,
      lastSaved,
      routeLoading,
      uploadCount,
      uploadProgress,
      beginUpload,
      setUploadProgress,
      endUpload,
    ],
  );

  return (
    <AppActivityContext.Provider value={value}>
      {children}
    </AppActivityContext.Provider>
  );
}

export function useAppActivity() {
  const ctx = useContext(AppActivityContext);
  if (!ctx) throw new Error("AppActivityProvider required");
  return ctx;
}

/** @deprecated use useAppActivity */
export function useSaveStatus() {
  const ctx = useAppActivity();
  return {
    status: ctx.saveStatus,
    setStatus: ctx.setSaveStatus,
    lastSaved: ctx.lastSaved,
    setLastSaved: ctx.setLastSaved,
  };
}
