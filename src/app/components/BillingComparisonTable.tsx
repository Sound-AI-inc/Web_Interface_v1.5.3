import { Fragment } from "react";
import { Check, Minus } from "lucide-react";
import { plans } from "../data/mock";

type Cell = boolean | string;

interface Row {
  label: string;
  values: Cell[]; // matches plans order: Free Trial, Standard, Premium Flex, Enterprise
}

interface Group {
  title: string;
  rows: Row[];
}

const GROUPS: Group[] = [
  {
    title: "Interface & Credits",
    rows: [
      {
        label: "Interface",
        values: ["Lite", "Lite", "Lite + Pro", "Lite + Pro"],
      },
      {
        label: "Credits included",
        values: [
          "20 + timed refills over 7-day trial",
          "30 + auto-recharge after full spend",
          "50 – 3000 / month",
          "Custom",
        ],
      },
      { label: "Billing cadence", values: ["7-day trial", "One-time or $84 / year", "$50+ / month", "Custom"] },
      { label: "Priority GPU queue", values: [false, false, true, "Dedicated GPU node"] },
      { label: "Batch / API generation", values: [false, false, false, true] },
      { label: "Early access to beta features", values: [false, false, true, true] },
    ],
  },
  {
    title: "Audio & Export",
    rows: [
      { label: "Audio generation", values: ["Basic", "Advanced", "Advanced + plugins", "Multi-track AI"] },
      { label: "Export formats", values: ["MP3", "WAV", "WAV · MIDI · MP3", "All formats"] },
      { label: "Advanced audio editing", values: [false, true, true, true] },
      { label: "AI Mastering Suite", values: [false, false, true, true] },
      { label: "Stem separation & remixing", values: [false, false, true, true] },
      { label: "AI Mixing Assistant", values: [false, "Lite", true, "Stem Mixer Pro"] },
    ],
  },
  {
    title: "AI & Models",
    rows: [
      { label: "Smart prompt suggestions", values: ["Limited", true, true, true] },
      { label: "MIDI → Sound AI conversion", values: [false, false, true, true] },
      { label: "Voice → Instrument AI", values: [false, false, true, "Voice Synthesis Suite"] },
      { label: "Custom model training", values: [false, false, "On request", "Dedicated"] },
      { label: "DAW plugin integration (VST/AU)", values: [false, false, true, "Custom SDK"] },
    ],
  },
  {
    title: "Library & Collaboration",
    rows: [
      { label: "Sound library access", values: [false, "Basic", "Full", "Shared asset library"] },
      { label: "Cloud storage", values: [false, "500 MB", "10 GB", "Enterprise"] },
      { label: "Collaborative sessions", values: [false, false, true, "Real-time co-editing"] },
      { label: "Project version control", values: [false, false, false, true] },
      { label: "Commercial usage rights", values: [false, false, true, true] },
    ],
  },
  {
    title: "Security & Enterprise",
    rows: [
      { label: "Role-based access control (RBAC)", values: [false, false, false, true] },
      { label: "SOC 2 · GDPR · ISO 27001", values: [false, false, false, true] },
      { label: "Regional data hosting (EU / US / APAC)", values: [false, false, false, true] },
      { label: "Audit log & usage tracking", values: [false, false, false, true] },
      { label: "Private API endpoint", values: [false, false, false, "Add-on"] },
      { label: "White-label interface", values: [false, false, false, "Add-on"] },
    ],
  },
  {
    title: "Support",
    rows: [
      { label: "Support", values: ["Community", "Email", "Priority", "24/7 dedicated"] },
      { label: "Priority SLA (99.9% uptime)", values: [false, false, false, true] },
      { label: "Dedicated account manager", values: [false, false, false, true] },
      { label: "Onboarding & training sessions", values: [false, false, false, true] },
    ],
  },
];

function Val({ value }: { value: Cell }) {
  if (value === true) {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Check className="h-3.5 w-3.5" />
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full text-text/25">
        <Minus className="h-3.5 w-3.5" />
      </span>
    );
  }
  return <span className="font-codec text-xs text-text/80">{value}</span>;
}

export default function BillingComparisonTable() {
  return (
    <div className="overflow-x-auto rounded-card border border-surface bg-white shadow-flat-sm">
      <table className="w-full min-w-[720px] border-collapse text-left">
        <thead>
          <tr className="border-b border-surface bg-surface-muted">
            <th className="px-5 py-3 font-poppins text-[10px] font-bold uppercase tracking-[0.14em] text-text/50">
              Included benefits
            </th>
            {plans.map((p) => (
              <th
                key={p.id}
                className={`px-5 py-3 text-left font-poppins text-xs ${
                  p.highlight ? "text-primary" : "text-text"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{p.name}</span>
                  {p.highlight && (
                    <span className="rounded-full bg-primary px-1.5 py-0.5 font-poppins text-[9px] font-bold uppercase tracking-wider text-white">
                      Popular
                    </span>
                  )}
                </div>
                <div className="mt-0.5 font-codec text-[11px] font-normal text-text/50">
                  {p.price}
                  {p.cadence && <span className="ml-1">{p.cadence}</span>}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {GROUPS.map((g) => (
            <Fragment key={g.title}>
              <tr>
                <td
                  colSpan={plans.length + 1}
                  className="border-t border-surface bg-surface-muted/60 px-5 py-2 font-poppins text-[10px] font-bold uppercase tracking-[0.14em] text-text/60"
                >
                  {g.title}
                </td>
              </tr>
              {g.rows.map((r) => (
                <tr key={r.label} className="border-t border-surface">
                  <td className="px-5 py-3 font-codec text-sm text-text/80">{r.label}</td>
                  {r.values.map((v, i) => (
                    <td key={i} className="px-5 py-3">
                      <Val value={v} />
                    </td>
                  ))}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
