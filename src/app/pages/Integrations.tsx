import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageContainer from "../components/PageContainer";
import IntegrationRow from "../components/IntegrationRow";
import { integrations } from "../data/mock";
import type { IntegrationCategory } from "../data/mock";
import { useLanguage } from "../i18n/LanguageProvider";
import type { TranslationKey } from "../i18n/translations";
import { Check, Download, ArrowUpRight } from "lucide-react";

type Filter = "All" | IntegrationCategory;

const CATEGORY_ORDER: IntegrationCategory[] = [
  "DAW",
  "AI Tools",
  "Distribution",
  "Samples",
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

const VISIBLE_INTEGRATIONS = integrations.filter((i) => i.category !== "Storage");

const DAW_INTEGRATIONS = [
  {
    id: "ableton",
    name: "Ableton Live",
    description: "Drag WAV/MIDI/VST presets from SoundAI directly into Ableton Live sessions.",
    assetTypes: ["Audio Samples (WAV)", "MIDI", "VST Presets"],
    workflow: "Generate → Save to Library → Drag to Ableton",
    status: "export-ready" as const,
  },
  {
    id: "fl-studio",
    name: "FL Studio",
    description: "Export generated samples and melodies, then import into FL Studio projects.",
    assetTypes: ["Audio Samples (WAV/MP3)", "MIDI"],
    workflow: "Generate → Export → Import to FL Studio",
    status: "export-ready" as const,
  },
  {
    id: "logic-pro",
    name: "Logic Pro",
    description: "Export audio, MIDI, and compatible presets for use in Logic Pro.",
    assetTypes: ["Audio Samples (WAV/AIFF)", "MIDI", "AU Presets (where supported)"],
    workflow: "Generate → Export → Import to Logic Pro",
    status: "export-ready" as const,
  },
] as const;

type DawStatus = "export-ready" | "coming-soon" | "not-supported";

function getStatusLabel(status: DawStatus, t: (key: TranslationKey) => string) {
  switch (status) {
    case "export-ready":
      return t("integrations.daw.status.exportReady");
    case "coming-soon":
      return t("integrations.daw.status.comingSoon");
    case "not-supported":
      return t("integrations.daw.status.notSupported");
  }
}

function getStatusClass(status: DawStatus) {
  switch (status) {
    case "export-ready":
      return "bg-success/10 text-success border-success/20";
    case "coming-soon":
      return "bg-warning/10 text-warning border-warning/20";
    case "not-supported":
      return "bg-text/10 text-text/50 border-text/10";
  }
}

interface DawIntegrationCardProps {
  daw: (typeof DAW_INTEGRATIONS)[number];
  t: (key: TranslationKey) => string;
}

function DawIntegrationCard({ daw, t }: DawIntegrationCardProps) {
  return (
    <div className="premium-integration-card rounded-[18px] border border-[var(--border-primary)] bg-[var(--surface-primary)] p-5 transition-colors hover:border-[var(--border-secondary)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-syne text-[16px] font-semibold text-[var(--text-primary)]">
            {daw.name}
          </h3>
          <p className="mt-1 font-codec text-sm text-[var(--text-secondary)]">
            {daw.description}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {daw.assetTypes.map((type, idx) => (
              <span
                key={idx}
                className="premium-chip rounded-full px-2.5 py-0.5 font-codec text-[10px]"
              >
                {type}
              </span>
            ))}
          </div>
          <div className="mt-3 font-codec text-[11px] text-[var(--text-muted)]">
            <span className="font-semibold text-[var(--text-secondary)]">{t("integrations.daw.workflow")}:</span>{" "}
            {daw.workflow}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-codec text-[10px] font-medium border ${getStatusClass(daw.status)}`}>
            <Check className="h-3 w-3" />
            {getStatusLabel(daw.status, t)}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="premium-asset-action h-9 px-3 text-[11px] flex items-center gap-1.5"
              title={t("integrations.daw.openExport")}
            >
              <Download className="h-3.5 w-3.5" />
              {t("integrations.daw.exportAssets")}
            </button>
            <Link
              to="/app/export"
              className="premium-asset-action h-9 px-3 text-[11px] flex items-center gap-1.5"
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              {t("integrations.daw.openExportPage")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

interface IntegrationsProps {
  inline?: boolean;
}

export default function Integrations({ inline = false }: IntegrationsProps) {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<Filter>("All");

  const counts = useMemo(() => {
    const map = new Map<Filter, number>();
    map.set("All", VISIBLE_INTEGRATIONS.length);
    for (const cat of CATEGORY_ORDER) {
      map.set(cat, VISIBLE_INTEGRATIONS.filter((i) => i.category === cat).length);
    }
    return map;
  }, []);

  const groups = useMemo(() => {
    const visible = CATEGORY_ORDER.filter(
      (c) => filter === "All" || filter === c,
    );
    return visible.map((cat) => ({
      category: cat,
      items: VISIBLE_INTEGRATIONS.filter((i) => i.category === cat),
    }));
  }, [filter]);

  const filters: Filter[] = ["All", ...CATEGORY_ORDER];
  const filterLabel = (f: Filter) => (f === "All" ? t("common.all") : f);

  const dawCards = DAW_INTEGRATIONS.map((daw) => (
    <DawIntegrationCard key={daw.id} daw={daw} t={t} />
  ));

  const content = (
    <>
      {/* DAW Integrations Section - Primary */}
      <section className="mb-8">
        <div className="mb-4 flex items-baseline justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-syne text-[18px] font-semibold text-[var(--text-primary)]">
              {t("integrations.daw.title")}
            </h2>
            <span className="font-codec text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
              {t("integrations.daw.subtitle")}
            </span>
          </div>
          <Link
            to="/app/export"
            className="premium-asset-action h-9 px-3 text-[11px] flex items-center gap-1.5"
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
            {t("integrations.daw.openExportPage")}
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {dawCards}
        </div>
      </section>

      {/* Other Integrations - Filterable */}
      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-syne text-[18px] font-semibold text-[var(--text-primary)]">
            {t("integrations.other.title")}
          </h2>
        </div>

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
                <span className="font-medium">{filterLabel(f)}</span>
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
                <h3 className="font-poppins text-[11px] font-bold uppercase tracking-[0.14em] text-text">
                  {CATEGORY_LABEL[g.category]}
                </h3>
                <span className="font-codec text-[10px] text-text/40">
                  {g.items.length}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {g.items.map((i) => (
                  <IntegrationRow key={i.id} integration={i} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </>
  );

  if (inline) {
    return <div className="space-y-6">{content}</div>;
  }

  return (
    <PageContainer title={t("integrations.title")} subtitle={t("integrations.subtitle")}>
      {content}
    </PageContainer>
  );
}
