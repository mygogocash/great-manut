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
  onClick,
}: {
  href: string;
  icon: ReactNode;
  children: ReactNode;
  active: boolean;
  onClick?: () => void;
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
        startTransition(() => {
          router.push(href);
          onClick?.();
        });
      }}
      className={cn(
        "flex items-center gap-2 rounded-md text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
        children ? "h-7 px-2" : "min-h-11 min-w-11 justify-center",
        active && "bg-accent text-foreground",
      )}
    >
      <NavLinkLabel icon={icon} active={active}>
        {children}
      </NavLinkLabel>
    </Link>
  );
}
