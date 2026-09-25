"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useRouteLoadingStart } from "./route-loading-bar";

type Props = ComponentProps<typeof Link>;

export function NavLink({ onClick, ...props }: Props) {
  const startLoading = useRouteLoadingStart();

  return (
    <Link
      {...props}
      onClick={(e) => {
        startLoading();
        onClick?.(e);
      }}
    />
  );
}
