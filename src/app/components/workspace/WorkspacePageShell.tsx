import type { ReactNode } from "react";

interface StatItem {
  label: string;
  value: string | number;
}

interface WorkspacePageShellProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  stats?: StatItem[];
  children: ReactNode;
}

export default function WorkspacePageShell({
  title,
  subtitle,
  actions,
  stats,
  children,
}: WorkspacePageShellProps) {
  return (
    <div className="premium-workspace-shell flex min-h-[calc(100dvh-4rem)] flex-col">
      <header className="premium-workspace-header border-b border-[var(--border-primary)] px-4 py-4 sm:px-6">
        <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-syne text-[22px] font-bold tracking-[-0.02em] text-[var(--text-primary)]">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 font-codec text-[13px] text-[var(--text-secondary)]">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
        {stats && stats.length > 0 && (
          <div className="mx-auto mt-4 flex w-full max-w-[1400px] flex-wrap gap-2">
            {stats.map((stat) => (
              <div key={stat.label} className="premium-stat-chip">
                <span className="font-codec text-[10px] uppercase tracking-[0.06em] text-[var(--text-muted)]">
                  {stat.label}
                </span>
                <span className="font-poppins text-sm font-semibold text-[var(--text-primary)]">
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </header>
      <div className="premium-workspace-body mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6">
        {children}
      </div>
    </div>
  );
}
