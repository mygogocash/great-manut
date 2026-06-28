"use client";

import Link, { useLinkStatus } from "next/link";
import { useRouter } from "next/navigation";
import { ReactNode, useCallback, useTransition } from "react";
import { cn } from "@/lib/utils";

function NavLinkLabel({
  icon,
  children,
  active,
}: {
  icon: ReactNode;
  children: ReactNode;
  active: boolean;
}) {
  const { pending } = useLinkStatus();
  return (
    <>
      {icon}
      <span
        className={cn(
          "truncate",
          pending && !active && "opacity-60",
        )}
      >
        {children}
      </span>
    </>
  );
}

export function FastNavLink({
  href,
  icon,
  children,
  active,
}: {
  href: string;
  icon: ReactNode;
  children: ReactNode;
  active: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const prefetch = useCallback(() => {
    router.prefetch(href);
  }, [router, href]);

  return (
    <Link
      href={href}
      prefetch={false}
      onMouseEnter={prefetch}
      onFocus={prefetch}
      onClick={(event) => {
        if (
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          event.button !== 0
        ) {
          return;
        }
        event.preventDefault();
        startTransition(() => router.push(href));
      }}
      className={cn(
        "flex h-7 items-center gap-2 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
        active && "bg-accent text-foreground",
      )}
    >
      <NavLinkLabel icon={icon} active={active}>
        {children}
      </NavLinkLabel>
    </Link>
  );
}
