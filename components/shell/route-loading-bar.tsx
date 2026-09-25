"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useAppActivity } from "./app-activity-context";

export function RouteLoadingBar() {
  const pathname = usePathname();
  const { routeLoading, setRouteLoading } = useAppActivity();
  const prev = useRef(pathname);

  useEffect(() => {
    if (prev.current !== pathname) {
      prev.current = pathname;
      setRouteLoading(false);
    }
  }, [pathname, setRouteLoading]);

  if (!routeLoading) return null;

  return (
    <div className="nodra-route-loading" role="progressbar" aria-label="Loading page">
      <div className="nodra-route-loading-bar" />
    </div>
  );
}

export function useRouteLoadingStart() {
  const { setRouteLoading } = useAppActivity();
  return () => setRouteLoading(true);
}
