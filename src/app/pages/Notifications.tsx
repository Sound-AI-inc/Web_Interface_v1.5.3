import PageContainer from "../components/PageContainer";
import { useLanguage } from "../i18n/LanguageProvider";

const MOCK_NOTIFICATIONS = [
  { id: "n1", title: "Generation complete", body: "Your audio sample is ready.", time: "2m ago", read: false },
  { id: "n2", title: "Credits low", body: "You have fewer than 20% credits remaining.", time: "1h ago", read: false },
  { id: "n3", title: "Welcome to SoundAI", body: "Start creating in Lite mode — upgrade anytime.", time: "Today", read: true },
];

export default function Notifications() {
  const { t } = useLanguage();

  return (
    <PageContainer title={t("notifications.title")} subtitle={t("notifications.subtitle")}>
      <ul className="flex max-w-2xl flex-col gap-2">
        {MOCK_NOTIFICATIONS.map((n) => (
          <li
            key={n.id}
            className={`token-card rounded-card p-4 ${n.read ? "opacity-70" : "ring-1 ring-primary/15"}`}
          >
            <div className="font-poppins text-sm font-semibold text-[var(--text-primary)]">{n.title}</div>
            <p className="mt-1 font-codec text-[13px] text-[var(--text-secondary)]">{n.body}</p>
            <span className="mt-2 block font-codec text-[11px] text-[var(--text-muted)]">{n.time}</span>
          </li>
        ))}
      </ul>
    </PageContainer>
  );
}
