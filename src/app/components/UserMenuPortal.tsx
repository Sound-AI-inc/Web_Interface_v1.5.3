import { useEffect, useLayoutEffect, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Settings as SettingsIcon,
  LogOut,
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
import { useInterfaceMode } from "../hooks/useInterfaceMode";
import { useLanguage } from "../i18n/LanguageProvider";
import { LANGUAGES, type LanguageCode } from "../i18n/translations";

const WEBSITE_BASE =
  (import.meta.env.VITE_WEBSITE_URL as string | undefined)?.replace(/\/$/, "") ??
  "http://127.0.0.1:4174";

interface UserMenuPortalProps {
  open: boolean;
  collapsed: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenUpgrade: () => void;
}

export default function UserMenuPortal({
  open,
  collapsed,
  anchorRef,
  onClose,
  onOpenSettings,
  onOpenUpgrade,
}: UserMenuPortalProps) {
  const { language, setLanguage, t } = useLanguage();
  const { mode } = useInterfaceMode();
  const themeClass = mode === "lite" ? "theme-lite" : "theme-pro";
  const navigate = useNavigate();
  const [subOpen, setSubOpen] = useState<"language" | "help" | null>(null);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  const updatePosition = () => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    if (collapsed) {
      setMenuStyle({
        position: "fixed",
        left: rect.right + 8,
        bottom: window.innerHeight - rect.bottom,
        width: 240,
        zIndex: "var(--z-dropdown)",
      });
    } else {
      setMenuStyle({
        position: "fixed",
        left: rect.left + 12,
        bottom: window.innerHeight - rect.top + 8,
        width: rect.width - 24,
        zIndex: "var(--z-dropdown)",
      });
    }
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, collapsed]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => updatePosition();
    const onResize = () => updatePosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, collapsed]);

  if (!open) return null;

  const handleNav = (to: string) => {
    navigate(to);
    onClose();
  };

  const websiteHref = (path: string) => `${WEBSITE_BASE}${path}`;

  return createPortal(
    <div data-user-menu data-theme={mode} className={`token-menu ${themeClass} rounded-card p-1.5 shadow-[var(--ui-shadow-floating)]`} style={menuStyle}>
      <button type="button" className="menu-row" onClick={() => { onOpenSettings(); onClose(); }}>
        <SettingsIcon className="h-4 w-4 text-[var(--text-muted)]" />
        <span className="flex-1 text-left">{t("menu.settings")}</span>
      </button>

      <div
        className="relative"
        onMouseEnter={() => setSubOpen("language")}
        onMouseLeave={() => setSubOpen((s) => (s === "language" ? null : s))}
      >
        <button type="button" className="menu-row">
          <LanguagesIcon className="h-4 w-4 text-[var(--text-muted)]" />
          <span className="flex-1 text-left">{t("menu.language")}</span>
          <ChevronRight className="h-3 w-3 text-[var(--text-muted)]" />
        </button>
        {subOpen === "language" && (
          <div
            className="token-menu absolute bottom-0 left-full ml-1 w-[200px] rounded-card p-1.5 shadow-[var(--ui-shadow-floating)]"
            style={{ zIndex: "calc(var(--z-dropdown) + 1)" }}
          >
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                type="button"
                className="menu-row"
                onClick={() => setLanguage(l.code as LanguageCode)}
              >
                <span className="flex-1 text-left">{l.label}</span>
                {language === l.code && <Check className="h-3.5 w-3.5 text-primary" />}
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
          <HelpCircle className="h-4 w-4 text-[var(--text-muted)]" />
          <span className="flex-1 text-left">{t("menu.getHelp")}</span>
          <ChevronRight className="h-3 w-3 text-[var(--text-muted)]" />
        </button>
        {subOpen === "help" && (
          <div
            className="token-menu absolute bottom-0 left-full ml-1 w-[220px] rounded-card p-1.5 shadow-[var(--ui-shadow-floating)]"
            style={{ zIndex: "calc(var(--z-dropdown) + 1)" }}
          >
            <div className="px-2 py-1 font-codec text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {t("menu.learnMore")}
            </div>
            <a href={websiteHref("/api")} target="_blank" rel="noreferrer" className="menu-row" onClick={onClose}>
              <Terminal className="h-4 w-4 text-[var(--text-muted)]" />
              <span className="flex-1 text-left">{t("menu.apiConsole")}</span>
            </a>
            <a href={websiteHref("/about")} target="_blank" rel="noreferrer" className="menu-row" onClick={onClose}>
              <Info className="h-4 w-4 text-[var(--text-muted)]" />
              <span className="flex-1 text-left">{t("menu.aboutSoundAI")}</span>
            </a>
            <a href={websiteHref("/docs")} target="_blank" rel="noreferrer" className="menu-row" onClick={onClose}>
              <BookOpen className="h-4 w-4 text-[var(--text-muted)]" />
              <span className="flex-1 text-left">{t("menu.tutorials")}</span>
            </a>
            <a href={websiteHref("/faq")} target="_blank" rel="noreferrer" className="menu-row" onClick={onClose}>
              <GraduationCap className="h-4 w-4 text-[var(--text-muted)]" />
              <span className="flex-1 text-left">{t("menu.courses")}</span>
            </a>
            <div className="my-1 mx-1 h-px bg-[var(--border-primary)]" aria-hidden />
            <a href={websiteHref("/legal/terms")} target="_blank" rel="noreferrer" className="menu-row" onClick={onClose}>
              <FileText className="h-4 w-4 text-[var(--text-muted)]" />
              <span className="flex-1 text-left">{t("menu.usagePolicy")}</span>
            </a>
            <a href={websiteHref("/legal/privacy")} target="_blank" rel="noreferrer" className="menu-row" onClick={onClose}>
              <Shield className="h-4 w-4 text-[var(--text-muted)]" />
              <span className="flex-1 text-left">{t("menu.privacyPolicy")}</span>
            </a>
            <a href={websiteHref("/legal/info")} target="_blank" rel="noreferrer" className="menu-row" onClick={onClose}>
              <Shield className="h-4 w-4 text-[var(--text-muted)]" />
              <span className="flex-1 text-left">{t("menu.privacyChoices")}</span>
            </a>
          </div>
        )}
      </div>

      <div className="my-1 mx-1 h-px bg-[var(--border-primary)]" aria-hidden />

      <button
        type="button"
        className="menu-row text-primary"
        onClick={() => { onOpenUpgrade(); onClose(); }}
      >
        <Sparkles className="h-4 w-4" />
        <span className="flex-1 text-left">{t("menu.upgradePlan")}</span>
      </button>
      <button type="button" className="menu-row" onClick={() => handleNav("/app/billing")}>
        <Gift className="h-4 w-4 text-[var(--text-muted)]" />
        <span className="flex-1 text-left">{t("menu.giftSoundAI")}</span>
      </button>

      <div className="my-1 mx-1 h-px bg-[var(--border-primary)]" aria-hidden />

      <button type="button" className="menu-row" onClick={onClose}>
        <LogOut className="h-4 w-4 text-[var(--text-muted)]" />
        <span className="flex-1 text-left">{t("menu.logOut")}</span>
      </button>
    </div>,
    document.body,
  );
}
