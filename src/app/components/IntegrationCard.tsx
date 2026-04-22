import type { Integration } from "../data/mock";

interface IntegrationCardProps {
  integration: Integration;
}

export default function IntegrationCard({ integration }: IntegrationCardProps) {
  return (
    <div className="flex flex-col gap-4 rounded-card border border-surface bg-white p-5 shadow-flat-sm">
      <header className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-button bg-surface-muted font-poppins text-xs font-semibold text-text">
          {integration.iconLetter}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-poppins text-sm font-semibold text-text">
              {integration.name}
            </h3>
            {integration.pro && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 font-poppins text-[9px] font-bold uppercase tracking-wider text-primary">
                Pro
              </span>
            )}
          </div>
          <p className="mt-0.5 font-poppins text-[10px] font-medium uppercase tracking-[0.12em] text-text/40">
            {integration.category}
          </p>
        </div>
      </header>
      <p className="font-codec text-sm leading-relaxed text-text/70">
        {integration.description}
      </p>
      <div className="mt-auto">
        {integration.connected ? (
          <button className="app-btn-ghost h-9 w-full">Connected</button>
        ) : (
          <button className="app-btn-primary h-9 w-full">Connect</button>
        )}
      </div>
    </div>
  );
}
