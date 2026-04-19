import { useMemo, useState } from "react";
import PageContainer from "../components/PageContainer";
import IntegrationRow from "../components/IntegrationRow";
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

const CATEGORY_LABEL: Record<IntegrationCategory, string> = {
  DAW: "DAW",
  "AI Tools": "AI Tools",
  Distribution: "Distribution",
  Samples: "Samples",
  Storage: "Storage",
  Processing: "Processing",
};

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

  const groups = useMemo(() => {
    const visible = CATEGORY_ORDER.filter(
      (c) => filter === "All" || filter === c,
    );
    return visible.map((cat) => ({
      category: cat,
      items: integrations.filter((i) => i.category === cat),
    }));
  }, [filter]);

  const filters: Filter[] = ["All", ...CATEGORY_ORDER];

  return (
    <PageContainer
      title="Integrations"
      subtitle="Connect SoundAI to the tools you already use"
    >
      <div className="mb-5 flex flex-wrap items-center gap-1.5">
        {filters.map((f) => {
          const active = f === filter;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-codec text-[11px] transition-colors ${
                active
                  ? "bg-primary/10 text-primary"
                  : "bg-surface-muted text-text/60 hover:bg-surface"
              }`}
            >
              <span className="font-medium">{f}</span>
              <span
                className={`font-poppins text-[9px] ${
                  active ? "text-primary/70" : "text-text/40"
                }`}
              >
                {counts.get(f) ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-6">
        {groups.map((g) => (
          <section key={g.category}>
            <div className="mb-2 flex items-baseline gap-2">
              <h2 className="font-poppins text-[11px] font-bold uppercase tracking-[0.14em] text-text">
                {CATEGORY_LABEL[g.category]}
              </h2>
              <span className="font-codec text-[10px] text-text/40">
                {g.items.length}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2 xl:grid-cols-3">
              {g.items.map((i) => (
                <IntegrationRow key={i.id} integration={i} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </PageContainer>
  );
}
