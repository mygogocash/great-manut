import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

const LOGO = "/manut-logo.webp";

type BrandMarkProps = {
  href?: string;
  className?: string;
  showName?: boolean;
  size?: "sm" | "md";
};

export function BrandMark({
  href = "/",
  className,
  showName = true,
  size = "md",
}: BrandMarkProps) {
  const iconClass = size === "sm" ? "size-5" : "size-6";
  const inner = (
    <>
      <Image
        src={LOGO}
        alt="Manut"
        width={size === "sm" ? 20 : 24}
        height={size === "sm" ? 20 : 24}
        className={cn(iconClass, "rounded object-cover")}
        priority
      />
      {showName ? <span>Manut</span> : null}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn("flex items-center gap-2 font-semibold", className)}
      >
        {inner}
      </Link>
    );
  }

  return (
    <div className={cn("flex items-center gap-2 font-semibold", className)}>
      {inner}
    </div>
  );
}
