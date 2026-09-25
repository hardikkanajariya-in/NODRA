"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useRouteLoadingStart } from "./route-loading-bar";

type Props = ComponentProps<typeof Link>;

export function ClientNavLink({ href, onClick, ...rest }: Props) {
  const startLoading = useRouteLoadingStart();

  return (
    <Link
      href={href}
      onClick={(e) => {
        startLoading();
        onClick?.(e);
      }}
      {...rest}
    />
  );
}
