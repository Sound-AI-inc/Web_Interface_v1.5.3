import type { ReactNode } from "react";

interface PageContainerProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  headerLayout?: "default" | "brand";
  userInitials?: string;
}

export default function PageContainer({
  title,
  subtitle,
  actions,
  children,
  headerLayout = "default",
  userInitials,
}: PageContainerProps) {
  if (headerLayout === "brand") {
    return (
      <div className="mx-auto w-full max-w-[1280px] px-4 py-0 sm:px-6">
        <header className="grid h-16 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center">
              <img
                src="/logo SoundAI v1.5 (1).svg"
                alt="SoundAI"
                className="soundai-logo-mark h-full w-full object-contain"
              />
            </div>
            <span className="truncate font-syne text-[17px] font-bold tracking-[-0.02em] text-text">
              SoundAI
            </span>
          </div>
          <div className="justify-self-center px-2 text-center">
            {title ? (
              <div className="flex items-center justify-center gap-2">
                <h1 className="font-syne text-[20px] font-bold leading-tight tracking-[-0.02em] text-text">
                  {title}
                </h1>
              </div>
            ) : null}
            {subtitle && (
              <p className="mt-1 font-codec text-[13px] text-text/60">{subtitle}</p>
            )}
          </div>
          <div className="flex min-w-0 items-center justify-end gap-2">
            {actions}
            {userInitials && (
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white"
                aria-hidden
              >
                {userInitials}
              </div>
            )}
          </div>
        </header>
        {children}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1280px] px-4 py-0 sm:px-6">
      <header className="flex h-16 items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-syne text-[20px] font-bold leading-tight tracking-[-0.02em] text-text">
              {title}
            </h1>
          </div>
          {subtitle && (
            <p className="mt-1 font-codec text-[13px] text-text/60">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </header>
      {children}
    </div>
  );
}
