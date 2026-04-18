import { useState } from "react";
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
  PanelLeftClose,
  PanelLeftOpen,
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

const NAV_ITEM_BASE =
  "group flex items-center gap-3 rounded-button px-3 py-2 font-poppins text-[10px] font-bold uppercase tracking-[0.08em] transition-colors";

function Item({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const Icon = item.icon;
  const collapsedBase =
    "group flex items-center justify-center rounded-button p-2 transition-colors";
  if (item.disabled) {
    return (
      <div
        className={`${collapsed ? collapsedBase : NAV_ITEM_BASE} cursor-not-allowed text-text/40`}
        title={collapsed ? `${item.label}${item.badge ? ` • ${item.badge}` : ""}` : undefined}
        aria-disabled
      >
        <Icon className="h-4 w-4" />
        {!collapsed && (
          <>
            <span className="flex-1">{item.label}</span>
            {item.badge && (
              <span className="rounded-full bg-surface px-2 py-0.5 font-poppins text-[9px] font-bold tracking-wider text-text/40">
                {item.badge}
              </span>
            )}
          </>
        )}
      </div>
    );
  }
  return (
    <NavLink
      to={item.to}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        `${collapsed ? collapsedBase : NAV_ITEM_BASE} ${
          isActive ? "text-primary" : "text-text hover:bg-surface"
        }`
      }
    >
      <Icon className="h-4 w-4" />
      {!collapsed && (
        <>
          <span className="flex-1">{item.label}</span>
          {item.badge && (
            <span className="rounded-full bg-surface px-2 py-0.5 font-poppins text-[9px] font-bold tracking-wider text-text/50">
              {item.badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

function SectionLabel({ children, collapsed }: { children: React.ReactNode; collapsed: boolean }) {
  if (collapsed) return <div className="my-2 h-px bg-surface" aria-hidden />;
  return (
    <div className="mb-2 mt-4 px-3 font-poppins text-[9px] font-bold uppercase tracking-[0.14em] text-text/40">
      {children}
    </div>
  );
}

export default function Sidebar() {
  const { mode, toggle } = useInterfaceMode();
  const [collapsed, setCollapsed] = useState(false);
  const width = collapsed ? "w-[72px]" : "w-[240px]";

  return (
    <aside className={`flex h-screen ${width} shrink-0 flex-col border-r border-surface bg-surface-muted transition-[width] duration-200`}>
      {/* Top: brand + collapse toggle */}
      <div className={`flex h-16 items-center ${collapsed ? "justify-center px-2" : "justify-between px-5"}`}>
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
              <span className="font-poppins text-xs font-bold text-white">S</span>
            </div>
            <span className="font-poppins text-[15px] font-semibold text-text">SoundAI</span>
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex h-8 w-8 items-center justify-center rounded-button text-text/60 transition-colors hover:bg-surface hover:text-text"
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      <nav className={`flex flex-1 flex-col justify-center overflow-y-auto ${collapsed ? "px-2" : "px-3"} pb-4`}>
        <div className="flex flex-col gap-1">
          {coreProduct.map((i) => (
            <Item key={i.to} item={i} collapsed={collapsed} />
          ))}
        </div>

        <SectionLabel collapsed={collapsed}>Settings</SectionLabel>
        <div className="flex flex-col gap-1">
          {assetsSystem.map((i) => (
            <Item key={i.to} item={i} collapsed={collapsed} />
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-1">
          {userLayer.map((i) => (
            <Item key={i.to} item={i} collapsed={collapsed} />
          ))}
        </div>
      </nav>

      <div className={`border-t border-surface ${collapsed ? "p-2" : "p-4"}`}>
        {!collapsed && (
          <>
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
          </>
        )}

        <button
          type="button"
          title={collapsed ? "Log out" : undefined}
          className={`${collapsed ? "mt-0 flex h-9 w-full items-center justify-center" : "mt-4 flex w-full items-center gap-2 px-2 py-2"} rounded-button font-codec text-sm text-text/70 transition-colors hover:bg-surface hover:text-text`}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && "Log out"}
        </button>
      </div>
    </aside>
  );
}
