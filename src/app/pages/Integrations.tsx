import { useMemo, useState } from "react";
import PageContainer from "../components/PageContainer";
import IntegrationCard from "../components/IntegrationCard";
import { integrations } from "../data/mock";
import type { Integration } from "../data/mock";

type Filter = "All" | Integration["category"];
const FILTERS: Filter[] = ["All", "DAW", "Format", "API"];

export default function Integrations() {
  const [filter, setFilter] = useState<Filter>("All");
  const filtered = useMemo(
    () => (filter === "All" ? integrations : integrations.filter((i) => i.category === filter)),
    [filter],
  );

  return (
    <PageContainer title="Integrations" subtitle="Connect SoundAI to your workflow">
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1.5 font-codec text-xs transition-colors ${
              f === filter
                ? "bg-primary/10 text-primary"
                : "bg-surface-muted text-text/60 hover:bg-surface"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((i) => (
          <IntegrationCard key={i.id} integration={i} />
        ))}
      </div>
    </PageContainer>
  );
}
