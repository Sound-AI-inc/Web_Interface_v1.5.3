import type { Integration } from "../data/mock";

interface IntegrationCardProps {
  integration: Integration;
}

export default function IntegrationCard({ integration }: IntegrationCardProps) {
  const statusClass = integration.soon
    ? "bg-surface-muted text-text/50"
    : integration.connected
      ? "bg-accent-light/40 text-text"
      : "bg-surface-muted text-text/60";

  const statusLabel = integration.soon
    ? "Soon"
    : integration.connected
      ? "Connected"
      : "Not connected";

  return (
    <div className="flex flex-col gap-4 rounded-card border border-surface bg-white p-5 shadow-flat-sm">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-button bg-surface-muted font-poppins text-sm font-semibold text-text">
          {integration.iconLetter}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-poppins text-sm font-semibold text-text">{integration.name}</h3>
          <p className="app-meta">{integration.category}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 font-poppins text-[11px] font-medium ${statusClass}`}>
          {statusLabel}
        </span>
      </header>
      <p className="font-codec text-sm text-text/70">{integration.description}</p>
      <div className="mt-auto">
        {integration.soon ? (
          <button className="app-btn-ghost h-9 w-full" disabled>
            Coming soon
          </button>
        ) : integration.connected ? (
          <button className="app-btn-ghost h-9 w-full">Manage</button>
        ) : (
          <button className="app-btn-primary h-9 w-full">Connect</button>
        )}
      </div>
    </div>
  );
}
