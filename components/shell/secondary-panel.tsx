"use client";

import { PanelRight } from "lucide-react";
import { ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function useSecondaryPanel() {
  const [open, setOpen] = useState(false);
  return { open, setOpen };
}

export function SecondaryPanelTrigger({
  onClick,
  label = "Properties",
  className,
}: {
  onClick: () => void;
  label?: string;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn("min-h-11 gap-1.5 lg:hidden", className)}
      onClick={onClick}
      aria-label={`Open ${label}`}
    >
      <PanelRight className="size-4" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}

export function SecondaryPanelAside({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <aside
      className={cn("hidden w-72 shrink-0 border-l p-4 lg:block", className)}
    >
      <h3 className="mb-3 text-xs font-medium text-muted-foreground">{title}</h3>
      {children}
    </aside>
  );
}

export function SecondaryPanelSheet({
  title,
  open,
  onOpenChange,
  children,
}: {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-80 sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="overflow-y-auto px-4 pb-6">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
