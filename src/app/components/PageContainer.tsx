import type { ReactNode } from "react";

interface PageContainerProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export default function PageContainer({ title, subtitle, actions, children }: PageContainerProps) {
  return (
    <div className="mx-auto w-full max-w-[1280px] px-8 py-8">
      <header className="mb-8 flex items-start justify-between gap-6">
        <div>
          <h1 className="font-poppins text-[28px] font-semibold leading-tight text-text">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 font-codec text-sm text-text/60">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </header>
      {children}
    </div>
  );
}
