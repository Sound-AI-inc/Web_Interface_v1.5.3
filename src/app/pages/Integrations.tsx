import { useMemo, useState } from "react";
import PageContainer from "../components/PageContainer";
import IntegrationCard from "../components/IntegrationCard";
import { integrations } from "../data/mock";
import type { IntegrationCategory } from "../data/mock";

type Filter = "All" | IntegrationCategory;

const CATEGORY_ORDER: IntegrationCategory[] = [
  "DAW",
  "AI Tools",
  "Distribution",
  "Samples",
  "Storage",
  "Processing",
];

export default function Integrations() {
  const [filter, setFilter] = useState<Filter>("All");

  const counts = useMemo(() => {
    const map = new Map<Filter, number>();
    map.set("All", integrations.length);
    for (const cat of CATEGORY_ORDER) {
      map.set(cat, integrations.filter((i) => i.category === cat).length);
    }
    return map;
  }, []);

  const filtered = useMemo(
    () =>
      filter === "All"
        ? integrations
        : integrations.filter((i) => i.category === filter),
    [filter],
  );

  const filters: Filter[] = ["All", ...CATEGORY_ORDER];

  return (
    <PageContainer
      title="Integrations"
      subtitle="Connect SoundAI to the tools you already use"
    >
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {filters.map((f) => {
          const active = f === filter;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-codec text-xs transition-colors ${
                active
                  ? "bg-primary/10 text-primary"
                  : "bg-surface-muted text-text/60 hover:bg-surface"
              }`}
            >
              <span className="font-medium">{f}</span>
              <span
                className={`font-poppins text-[10px] ${
                  active ? "text-primary/70" : "text-text/40"
                }`}
              >
                {counts.get(f) ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((i) => (
          <IntegrationCard key={i.id} integration={i} />
        ))}
      </div>
    </PageContainer>
  );
}
