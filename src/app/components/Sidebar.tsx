import { NavLink } from "react-router-dom";
import {
  Mic2,
  Lightbulb,
  LayoutGrid,
  Pencil,
  Library as LibraryIcon,
  Plug,
  CreditCard,
  User,
  Settings as SettingsIcon,
  LogOut,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useInterfaceMode } from "../hooks/useInterfaceMode";

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  disabled?: boolean;
  badge?: string;
}

const coreProduct: NavItem[] = [
  { label: "Audio Generator", to: "/app/generator", icon: Mic2 },
  { label: "Prompts", to: "/app/prompts", icon: Lightbulb },
  { label: "Arrangement", to: "/app/arrangement", icon: LayoutGrid, disabled: true, badge: "SOON" },
  { label: "Editor Mode", to: "/app/editor", icon: Pencil },
];

const assetsSystem: NavItem[] = [
  { label: "Library", to: "/app/library", icon: LibraryIcon },
  { label: "Integrations", to: "/app/integrations", icon: Plug },
  { label: "Billing", to: "/app/billing", icon: CreditCard },
];

const userLayer: NavItem[] = [
  { label: "Profile", to: "/app/profile", icon: User },
  { label: "Settings", to: "/app/settings", icon: SettingsIcon },
];

function Item({ item }: { item: NavItem }) {
  const Icon = item.icon;
  if (item.disabled) {
    return (
      <div
        className="flex cursor-not-allowed items-center gap-3 rounded-button px-3 py-2 font-codec text-sm text-text/40"
        aria-disabled
      >
        <Icon className="h-4 w-4" />
        <span className="flex-1">{item.label}</span>
        {item.badge && (
          <span className="rounded-full bg-surface px-2 py-0.5 font-poppins text-[10px] font-medium tracking-wider text-text/40">
            {item.badge}
          </span>
        )}
      </div>
    );
  }
  return (
    <NavLink
      to={item.to}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-button px-3 py-2 font-codec text-sm transition-colors ${
          isActive
            ? "bg-primary/10 text-primary"
            : "text-text/70 hover:bg-surface hover:text-text"
        }`
      }
    >
      <Icon className="h-4 w-4" />
      <span className="flex-1">{item.label}</span>
      {item.badge && (
        <span className="rounded-full bg-surface px-2 py-0.5 font-poppins text-[10px] font-medium tracking-wider text-text/50">
          {item.badge}
        </span>
      )}
    </NavLink>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 mt-4 px-3 font-poppins text-[10px] font-medium uppercase tracking-[0.12em] text-text/40">
      {children}
    </div>
  );
}

export default function Sidebar() {
  const { mode, toggle } = useInterfaceMode();
  return (
    <aside className="flex h-screen w-[240px] shrink-0 flex-col border-r border-surface bg-surface-muted">
      {/* Logo / brand */}
      <div className="flex h-16 items-center gap-2 px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
          <span className="font-poppins text-xs font-bold text-white">S</span>
        </div>
        <span className="font-poppins text-[15px] font-semibold text-text">SoundAI</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <div className="flex flex-col gap-1">
          {coreProduct.map((i) => (
            <Item key={i.to} item={i} />
          ))}
        </div>

        <SectionLabel>Settings</SectionLabel>
        <div className="flex flex-col gap-1">
          {assetsSystem.map((i) => (
            <Item key={i.to} item={i} />
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-1">
          {userLayer.map((i) => (
            <Item key={i.to} item={i} />
          ))}
        </div>
      </nav>

      <div className="border-t border-surface p-4">
        <div className="mb-2 font-poppins text-[11px] font-medium text-text/60">Interface Mode</div>
        <button
          type="button"
          onClick={toggle}
          className="flex w-full items-center gap-2 rounded-button px-1 py-1 text-left"
          aria-label="Toggle interface mode"
        >
          <span
            className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
              mode === "pro" ? "bg-primary" : "bg-surface"
            }`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                mode === "pro" ? "translate-x-[18px]" : "translate-x-0.5"
              }`}
            />
          </span>
          <span className="font-codec text-xs text-text/70">Lite / Pro</span>
        </button>

        <button
          type="button"
          className="mt-4 flex w-full items-center gap-2 rounded-button px-2 py-2 font-codec text-sm text-text/70 transition-colors hover:bg-surface hover:text-text"
        >
          <LogOut className="h-4 w-4" />
          Log out
        </button>
      </div>
    </aside>
  );
}
