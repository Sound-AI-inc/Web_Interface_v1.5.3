import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Lightbulb,
  LayoutGrid,
  Pencil,
  Library as LibraryIcon,
  CreditCard,
  PanelLeftClose,
  PanelLeftOpen,
  Upload,
  Sparkles,
  Lock,
} from "lucide-react";
import UserMenuPortal from "./UserMenuPortal";
import { useAuth } from "../hooks/useAuth";
import { useInterfaceMode } from "../hooks/useInterfaceMode";
import type { LucideIcon } from "lucide-react";
import ThemedLogo from "./ThemedLogo";
import WorkspaceNav from "./workspace/WorkspaceNav";
import { useLanguage } from "../i18n/LanguageProvider";
import { useWorkspaceStore } from "../state/workspaceStore";

interface NavItem {
  labelKey:
    | "nav.audioGenerator"
    | "nav.prompts"
    | "nav.arrangement"
    | "nav.editor"
    | "nav.library"
    | "nav.export"
    | "nav.integrations"
    | "nav.billing";
  to: string;
  icon: LucideIcon;
  disabled?: boolean;
  badge?: string;
}

const coreProduct: NavItem[] = [
  { labelKey: "nav.audioGenerator", to: "/app/generator", icon: Sparkles },
  { labelKey: "nav.prompts", to: "/app/prompts", icon: Lightbulb },
  { labelKey: "nav.arrangement", to: "/app/arrangement", icon: LayoutGrid, disabled: true, badge: "SOON" },
  { labelKey: "nav.editor", to: "/app/editor", icon: Pencil },
];

const assetsSystem: NavItem[] = [
  { labelKey: "nav.library", to: "/app/library", icon: LibraryIcon },
  { labelKey: "nav.export", to: "/app/export", icon: Upload },
  { labelKey: "nav.billing", to: "/app/billing", icon: CreditCard },
];

const LITE_LOCKED_KEYS: NavItem["labelKey"][] = ["nav.editor", "nav.library", "nav.export"];

const NAV_ITEM_BASE =
  "group flex items-center gap-3 border-l-2 border-transparent px-3 py-2.5 font-codec text-[12px] font-semibold transition-colors";
function Item({
  item,
  collapsed,
  onOpenUpgrade,
}: {
  item: NavItem;
  collapsed: boolean;
  onOpenUpgrade: () => void;
}) {
  const { t } = useLanguage();
  const { mode } = useInterfaceMode();
  const Icon = item.icon;
  const label = t(item.labelKey);
  const isLiteLocked = mode === "lite" && LITE_LOCKED_KEYS.includes(item.labelKey);
  const startNewSession = useWorkspaceStore((s) => s.startNewSession);
  const collapsedBase =
    "group flex items-center justify-center rounded-button p-2 transition-colors";
  if (isLiteLocked) {
    return (
      <button
        type="button"
        onClick={onOpenUpgrade}
        title={collapsed ? `${label} — ${t("sidebar.pro")}` : undefined}
        className={`${collapsed ? collapsedBase : NAV_ITEM_BASE} text-text/45 hover:bg-[var(--surface-secondary)] hover:text-text`}
      >
        <Icon className="h-4 w-4" />
        {!collapsed && (
          <>
            <span className="flex-1 text-left">{label}</span>
            <Lock className="h-3.5 w-3.5 text-[var(--text-muted)]" />
          </>
        )}
      </button>
    );
  }
  // UX-009: future routes stay keyboard-accessible and clickable so they
  // resolve to an honest SOON page instead of a dead element.
  if (item.disabled) {
    return (
      <NavLink
        to={item.to}
        title={collapsed ? `${label}${item.badge ? ` • ${item.badge}` : ""}` : undefined}
        aria-label={`${label} — coming soon`}
        className={`${collapsed ? collapsedBase : NAV_ITEM_BASE} text-text/30`}
      >
        <Icon className="h-4 w-4" />
        {!collapsed && (
          <>
            <span className="flex-1">{label}</span>
            {item.badge && (
              <span className="rounded-[4px] bg-[var(--surface-secondary)] px-1.5 py-0.5 font-codec text-[10px] font-bold tracking-[0.06em] text-[var(--text-muted)]">
                {t("sidebar.soon")}
              </span>
            )}
          </>
        )}
      </NavLink>
    );
  }
  return (
    <NavLink
      to={item.to}
      title={collapsed ? label : undefined}
      onClick={() => {
        if (item.to === "/app/generator") {
          startNewSession();
        }
      }}
      className={({ isActive }) =>
        `${collapsed ? collapsedBase : NAV_ITEM_BASE} ${
          isActive
            ? "border-l-primary bg-[var(--ui-elevated)] text-text"
            : "text-text/55 hover:bg-[var(--surface-secondary)] hover:text-text"
        }`
      }
    >
      <Icon className="h-4 w-4" />
      {!collapsed && (
        <>
          <span className="flex-1">{label}</span>
          {item.badge && (
            <span className="rounded-[4px] bg-[var(--surface-secondary)] px-1.5 py-0.5 font-codec text-[10px] font-bold tracking-[0.06em] text-[var(--text-muted)]">
              {t("sidebar.soon")}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

function SectionSeparator({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={`my-3 ${collapsed ? "" : "mx-3"} h-px bg-[var(--ui-border-soft)]`} aria-hidden />
  );
}

export default function Sidebar({
  onOpenSettings,
  onOpenUpgrade,
  mobileOpen = false,
  onCloseMobile,
}: {
  onOpenSettings: () => void;
  onOpenUpgrade: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const width = collapsed ? "w-[56px]" : "w-[216px]";
  // Closing the drawer when a modal flow starts keeps focus and overlay sane.
  const handleOpenSettings = () => {
    onCloseMobile?.();
    onOpenSettings();
  };
  const handleOpenUpgrade = () => {
    onCloseMobile?.();
    onOpenUpgrade();
  };
  const profileRef = useRef<HTMLButtonElement>(null);
  const { t } = useLanguage();
  const { user } = useAuth();
  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "Account";
  const email = user?.email ?? "";
  const avatarUrl =
    (user?.user_metadata?.avatar_url as string | undefined) ??
    (user?.user_metadata?.picture as string | undefined) ??
    null;
  const initial = displayName.charAt(0).toUpperCase() || "S";

  console.info("[auth-debug] Sidebar render", {
    hasUser: Boolean(user),
    userId: user?.id,
    email,
    displayName,
  });

  useEffect(() => {
    if (!userMenuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (profileRef.current?.contains(target)) return;
      if ((target as Element).closest?.("[data-user-menu]")) return;
      setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [userMenuOpen]);

  return (
    <>
      {/* Mobile scrim — drawer is an overlay below md, inline sidebar above. */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onCloseMobile}
          className="fixed inset-0 z-[60] bg-[var(--scrim)] md:hidden"
        />
      )}
      <aside
        aria-label="Primary"
        className={`top-0 flex h-screen ${width} shrink-0 flex-col self-start border-r border-[var(--ui-border-soft)] bg-[var(--ui-bg)] shadow-[8px_0_40px_rgba(0,0,0,0.12)] transition-[width,transform] duration-150 ease-linear md:sticky ${
          mobileOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full"
        } max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-[70]`}
      >
      {/* Top: brand + collapse toggle */}
      <div
        className={`flex h-16 items-center ${
          collapsed ? "justify-center px-2" : "justify-between px-4"
        }`}
      >
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center">
              <ThemedLogo className="logo-drift h-full w-full object-contain" />
            </div>
            <span className="translate-y-[1px] font-syne text-[17px] font-bold text-text">SoundAI</span>
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex h-8 w-8 items-center justify-center rounded-button text-text/60 transition-colors hover:bg-[var(--ui-input)] hover:text-text"
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      <nav
        className={`token-scroll flex flex-1 flex-col overflow-y-auto ${
          collapsed ? "px-2" : "px-3"
        } pb-4 pt-2`}
      >
        <WorkspaceNav collapsed={collapsed} />
        <SectionSeparator collapsed={collapsed} />
        {!collapsed && (
          <div className="mb-2 px-3 font-codec text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
            {t("sidebar.tools")}
          </div>
        )}
        <div className="flex flex-col gap-1">
          {coreProduct.map((i) => (
            <Item key={i.to} item={i} collapsed={collapsed} onOpenUpgrade={handleOpenUpgrade} />
          ))}
        </div>

        <SectionSeparator collapsed={collapsed} />

        <div className="flex flex-col gap-1">
          {assetsSystem.map((i) => (
            <Item key={i.to} item={i} collapsed={collapsed} onOpenUpgrade={handleOpenUpgrade} />
          ))}
        </div>
      </nav>

      {/* User profile docked at very bottom */}
      <div className={`relative border-t border-[var(--ui-border-soft)] ${collapsed ? "p-2" : "px-3 py-3"}`}>
        <UserMenuPortal
          collapsed={collapsed}
          open={userMenuOpen}
          anchorRef={profileRef}
          onClose={() => setUserMenuOpen(false)}
          onOpenSettings={handleOpenSettings}
          onOpenUpgrade={handleOpenUpgrade}
        />
        <button
          ref={profileRef}
          type="button"
          onClick={() => setUserMenuOpen((v) => !v)}
          title={collapsed ? "Account" : undefined}
          className={`flex items-center rounded-button transition-colors hover:bg-[var(--ui-input)] ${
            collapsed
              ? "h-9 w-full justify-center"
              : "w-full gap-2 px-2 py-2"
          }`}
          aria-haspopup="menu"
          aria-expanded={userMenuOpen}
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-on-accent overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </div>
          {!collapsed && (
            <div className="flex min-w-0 flex-1 flex-col text-left">
              <span className="truncate font-poppins text-xs font-semibold text-text">
                {displayName}
              </span>
              {email && (
                <span className="truncate font-codec text-[10px] text-text/50">{email}</span>
              )}
            </div>
          )}
        </button>
      </div>
      </aside>
    </>
  );
}
