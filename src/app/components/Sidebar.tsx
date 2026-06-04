import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Mic2,
  Lightbulb,
  LayoutGrid,
  Pencil,
  Library as LibraryIcon,
  Plug,
  CreditCard,
  Settings as SettingsIcon,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Upload,
  ChevronRight,
  Gift,
  HelpCircle,
  Languages as LanguagesIcon,
  GraduationCap,
  Check,
  Sparkles,
  BookOpen,
  FileText,
  Shield,
  Terminal,
  Info,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import ThemedLogo from "./ThemedLogo";
import WorkspaceNav from "./workspace/WorkspaceNav";
import { useLanguage } from "../i18n/LanguageProvider";
import { LANGUAGES, type LanguageCode } from "../i18n/translations";

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
  { labelKey: "nav.audioGenerator", to: "/app/generator", icon: Mic2 },
  { labelKey: "nav.prompts", to: "/app/prompts", icon: Lightbulb },
  { labelKey: "nav.arrangement", to: "/app/arrangement", icon: LayoutGrid, disabled: true, badge: "SOON" },
  { labelKey: "nav.editor", to: "/app/editor", icon: Pencil },
];

const assetsSystem: NavItem[] = [
  { labelKey: "nav.library", to: "/app/library", icon: LibraryIcon },
  { labelKey: "nav.export", to: "/app/export", icon: Upload },
  { labelKey: "nav.integrations", to: "/app/integrations", icon: Plug },
  { labelKey: "nav.billing", to: "/app/billing", icon: CreditCard },
];

const NAV_ITEM_BASE =
  "group flex items-center gap-3 border-l-2 border-transparent px-3 py-2.5 font-codec text-[12px] font-semibold transition-colors";
const WEBSITE_BASE =
  (import.meta.env.VITE_WEBSITE_URL as string | undefined)?.replace(/\/$/, "") ??
  "http://127.0.0.1:4174";

function Item({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const { t } = useLanguage();
  const Icon = item.icon;
  const label = t(item.labelKey);
  const collapsedBase =
    "group flex items-center justify-center rounded-button p-2 transition-colors";
  if (item.disabled) {
    return (
      <div
        className={`${collapsed ? collapsedBase : NAV_ITEM_BASE} cursor-not-allowed text-text/30`}
        title={collapsed ? `${label}${item.badge ? ` • ${item.badge}` : ""}` : undefined}
        aria-disabled
      >
        <Icon className="h-4 w-4" />
        {!collapsed && (
          <>
            <span className="flex-1">{label}</span>
            {item.badge && (
              <span className="rounded-[4px] bg-[var(--surface-secondary)] px-1.5 py-0.5 font-codec text-[10px] font-bold tracking-[0.06em] text-[var(--text-muted)]">
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
      title={collapsed ? label : undefined}
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
            <span className="rounded-[4px] bg-white/10 px-1.5 py-0.5 font-codec text-[10px] font-bold tracking-[0.06em] text-text/30">
              {item.badge}
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

/**
 * Bottom-docked user profile control with a compact account menu.
 */
function UserMenu({
  collapsed,
  open,
  onClose,
  onOpenSettings,
  onOpenUpgrade,
}: {
  collapsed: boolean;
  open: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenUpgrade: () => void;
}) {
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [subOpen, setSubOpen] = useState<"language" | "help" | null>(null);

  // Only render the floating menu when open; use pointer-events-none layout
  // hints so the main sidebar layout remains stable.
  if (!open) return null;

  const handleNav = (to: string) => {
    navigate(to);
    onClose();
  };

  const pickLanguage = (code: LanguageCode) => {
    setLanguage(code);
  };

  const websiteHref = (path: string) => `${WEBSITE_BASE}${path}`;

  return (
    <div
      className={`ui-floating-menu token-menu absolute bottom-full mb-2 w-[240px] rounded-card p-1.5 ${
        collapsed ? "left-full ml-2" : "left-3 right-3 w-auto"
      }`}
      style={{ zIndex: "var(--z-dropdown)" }}
    >
      <button type="button" className="menu-row" onClick={() => { onOpenSettings(); onClose(); }}>
        <SettingsIcon className="h-4 w-4 text-text/60" />
        <span className="flex-1 text-left">{t("menu.settings")}</span>
      </button>

      <div
        className="relative"
        onMouseEnter={() => setSubOpen("language")}
        onMouseLeave={() => setSubOpen((s) => (s === "language" ? null : s))}
      >
        <button type="button" className="menu-row">
          <LanguagesIcon className="h-4 w-4 text-text/60" />
          <span className="flex-1 text-left">{t("menu.language")}</span>
          <ChevronRight className="h-3 w-3 text-text/40" />
        </button>
        {subOpen === "language" && (
          <div className="ui-floating-menu absolute bottom-0 left-full ml-1 w-[200px] rounded-card p-1.5">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                className="menu-row"
                onClick={() => pickLanguage(l.code)}
              >
                <span className="flex-1 text-left">{l.label}</span>
                {language === l.code && (
                  <Check className="h-3.5 w-3.5 text-primary" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div
        className="relative"
        onMouseEnter={() => setSubOpen("help")}
        onMouseLeave={() => setSubOpen((s) => (s === "help" ? null : s))}
      >
        <button type="button" className="menu-row">
          <HelpCircle className="h-4 w-4 text-text/60" />
          <span className="flex-1 text-left">{t("menu.getHelp")}</span>
          <ChevronRight className="h-3 w-3 text-text/40" />
        </button>
        {subOpen === "help" && (
          <div className="ui-floating-menu absolute bottom-0 left-full ml-1 w-[220px] rounded-card p-1.5">
            <div className="px-2 py-1 font-poppins text-[9px] font-bold uppercase tracking-wider text-text/40">
              {t("menu.learnMore")}
            </div>
            <a href={websiteHref("/api")} target="_blank" rel="noreferrer" className="menu-row" onClick={onClose}>
              <Terminal className="h-4 w-4 text-text/60" />
              <span className="flex-1 text-left">{t("menu.apiConsole")}</span>
            </a>
            <a href={websiteHref("/about")} target="_blank" rel="noreferrer" className="menu-row" onClick={onClose}>
              <Info className="h-4 w-4 text-text/60" />
              <span className="flex-1 text-left">{t("menu.aboutSoundAI")}</span>
            </a>
            <a href={websiteHref("/docs")} target="_blank" rel="noreferrer" className="menu-row" onClick={onClose}>
              <BookOpen className="h-4 w-4 text-text/60" />
              <span className="flex-1 text-left">{t("menu.tutorials")}</span>
            </a>
            <a href={websiteHref("/faq")} target="_blank" rel="noreferrer" className="menu-row" onClick={onClose}>
              <GraduationCap className="h-4 w-4 text-text/60" />
              <span className="flex-1 text-left">{t("menu.courses")}</span>
            </a>
            <div className="my-1 mx-1 h-px bg-surface" aria-hidden />
            <a href={websiteHref("/legal/terms")} target="_blank" rel="noreferrer" className="menu-row" onClick={onClose}>
              <FileText className="h-4 w-4 text-text/60" />
              <span className="flex-1 text-left">{t("menu.usagePolicy")}</span>
            </a>
            <a href={websiteHref("/legal/privacy")} target="_blank" rel="noreferrer" className="menu-row" onClick={onClose}>
              <Shield className="h-4 w-4 text-text/60" />
              <span className="flex-1 text-left">{t("menu.privacyPolicy")}</span>
            </a>
            <a href={websiteHref("/legal/info")} target="_blank" rel="noreferrer" className="menu-row" onClick={onClose}>
              <Shield className="h-4 w-4 text-text/60" />
              <span className="flex-1 text-left">{t("menu.privacyChoices")}</span>
            </a>
          </div>
        )}
      </div>

      <div className="my-1 mx-1 h-px bg-surface" aria-hidden />

      <button
        type="button"
        className="menu-row text-primary"
        onClick={() => { onOpenUpgrade(); onClose(); }}
      >
        <Sparkles className="h-4 w-4" />
        <span className="flex-1 text-left">{t("menu.upgradePlan")}</span>
      </button>
      <button
        type="button"
        className="menu-row"
        onClick={() => handleNav("/app/billing")}
      >
        <Gift className="h-4 w-4 text-text/60" />
        <span className="flex-1 text-left">{t("menu.giftSoundAI")}</span>
      </button>

      <div className="my-1 mx-1 h-px bg-surface" aria-hidden />

      <button type="button" className="menu-row" onClick={onClose}>
        <LogOut className="h-4 w-4 text-text/60" />
        <span className="flex-1 text-left">{t("menu.logOut")}</span>
      </button>
    </div>
  );
}

export default function Sidebar({
  onOpenSettings,
  onOpenUpgrade,
}: {
  onOpenSettings: () => void;
  onOpenUpgrade: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const width = collapsed ? "w-[56px]" : "w-[216px]";
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userMenuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [userMenuOpen]);

  return (
    <aside
      className={`sticky top-0 flex h-screen ${width} shrink-0 flex-col self-start border-r border-[var(--ui-border-soft)] bg-[var(--ui-bg)] shadow-[8px_0_40px_rgba(0,0,0,0.12)] transition-[width] duration-150 ease-linear`}
    >
      {/* Inject small menu-row utility */}
      <style>{`
        .menu-row {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          padding: 0.5rem 0.625rem;
          border-radius: 0.5rem;
          font-family: var(--font-codec, 'Inter', sans-serif);
          font-size: 12px;
          color: rgb(var(--color-text) / 0.72);
          transition: background-color 150ms ease;
          width: 100%;
          cursor: pointer;
        }
        .menu-row:hover { background-color: var(--ui-input); color: rgb(var(--color-text)); }
      `}</style>

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
        className={`flex flex-1 flex-col overflow-y-auto ${
          collapsed ? "px-2" : "px-3"
        } pb-4 pt-2`}
      >
        <WorkspaceNav collapsed={collapsed} />
        <SectionSeparator collapsed={collapsed} />
        {!collapsed && (
          <div className="mb-2 px-3 font-codec text-[10px] font-semibold uppercase tracking-[0.06em] text-[var(--text-muted)]">
            Tools
          </div>
        )}
        <div className="flex flex-col gap-1">
          {coreProduct.map((i) => (
            <Item key={i.to} item={i} collapsed={collapsed} />
          ))}
        </div>

        <SectionSeparator collapsed={collapsed} />

        <div className="flex flex-col gap-1">
          {assetsSystem.map((i) => (
            <Item key={i.to} item={i} collapsed={collapsed} />
          ))}
        </div>
      </nav>

      {/* User profile docked at very bottom */}
      <div
        ref={menuRef}
        className={`relative border-t border-[var(--ui-border-soft)] ${collapsed ? "p-2" : "px-3 py-3"}`}
      >
        <UserMenu
          collapsed={collapsed}
          open={userMenuOpen}
          onClose={() => setUserMenuOpen(false)}
          onOpenSettings={onOpenSettings}
          onOpenUpgrade={onOpenUpgrade}
        />
        <button
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
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-on-accent">
            D
          </div>
          {!collapsed && (
            <div className="flex min-w-0 flex-1 flex-col text-left">
              <span className="truncate font-poppins text-xs font-semibold text-text">
                Dmitriy ELAT
              </span>
              <span className="truncate font-codec text-[10px] text-text/50">
                elat.official@gmail.com
              </span>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
