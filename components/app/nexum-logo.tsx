import Image from "next/image";

import { cn } from "@/lib/utils";

/** Logo completo en pantalla de acceso (`public/images/image_1.png`). */
const SRC_LOGIN = "/images/image_1.png";
/** Marca en panel interno (`public/images/image_2.png`). */
const SRC_APP = "/images/image_2.png";

export function NexumLogo({
  variant = "app",
  compact = false,
  size = "default",
  className,
}: {
  /** `login`: asset de login. `app`: asset para sidebar / cabecera interna. */
  variant?: "login" | "app";
  compact?: boolean;
  /** `sm` para sidebar (icono ~64px de alto). */
  size?: "default" | "sm";
  className?: string;
}) {
  if (variant === "login") {
    return (
      <div className={cn("flex w-full justify-center", className)}>
        <Image
          alt="Nexum Content Hub"
          className="mx-auto block h-auto w-auto max-h-[220px] max-w-[min(100%,420px)] object-contain sm:max-w-[480px]"
          height={200}
          loading="eager"
          priority
          sizes="(max-width: 640px) 90vw, 480px"
          src={SRC_LOGIN}
          style={{ width: "auto", height: "auto" }}
          width={480}
        />
      </div>
    );
  }

  const iconClass = compact
    ? "h-14 w-14 shrink-0 rounded-lg object-contain"
    : size === "sm"
      ? "h-8 w-auto max-w-[2rem] shrink-0 object-contain object-left"
      : "h-11 w-auto max-w-[2.75rem] shrink-0 object-contain object-left";

  const iconHeight = compact ? 56 : size === "sm" ? 32 : 44;
  const iconWidth = compact ? 56 : size === "sm" ? 46 : 60;

  return (
    <div aria-label="Nexum Content Hub" className={cn("flex items-center gap-3", className)}>
      <Image
        alt=""
        className={iconClass}
        height={iconHeight}
        loading="eager"
        priority
        sizes={compact ? "56px" : size === "sm" ? "88px" : "104px"}
        src={SRC_APP}
        style={{ width: "auto", height: "auto" }}
        width={iconWidth}
      />
      {!compact ? (
        <div className="min-w-0 flex-1 leading-tight">
          <p className={cn("truncate font-semibold tracking-tight text-foreground", size === "sm" ? "text-lg" : "text-base")}>Nexum</p>
          <p className={cn("mt-0.5 truncate text-muted-foreground", size === "sm" ? "text-sm" : "text-xs")}>Content Hub</p>
        </div>
      ) : null}
    </div>
  );
}
