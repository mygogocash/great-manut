import { SettingsNav } from "@/components/billing/settings-nav";
import { CONTENT_PX } from "@/lib/responsive";
import { cn } from "@/lib/utils";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="flex h-12 shrink-0 items-center border-b px-4 text-sm font-medium">
        Settings
      </header>
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <SettingsNav />
        <div className="flex-1 overflow-y-auto">
          <div
            className={cn(
              "mx-auto flex max-w-2xl flex-col gap-8 py-8",
              CONTENT_PX,
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
