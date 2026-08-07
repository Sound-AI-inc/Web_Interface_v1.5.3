import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import ThemedLogo from "../components/ThemedLogo";
import { useAuth } from "../hooks/useAuth";
import { useLanguage } from "../i18n/LanguageProvider";
import {
  ONBOARDING_STEPS,
  isOnboardingCompleteSync,
  saveOnboarding,
  shouldRequireOnboarding,
  type OnboardingData,
} from "../lib/onboardingService";
import type { TranslationKey } from "../i18n/translations";

const EMPTY: OnboardingData = {
  profileType: "",
  discoverySource: "",
  primaryGoal: "",
  workflowFrequency: "",
  mainDaw: "",
  painPoint: "",
};

export default function OnboardingSurvey() {
  const navigate = useNavigate();
  const { user, session, loading, configured, markFreshSession } = useAuth();
  const { t } = useLanguage();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<OnboardingData>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);

  const userId = user?.id ?? session?.user?.id;
  const createdAt = user?.created_at ?? session?.user?.created_at;

  useEffect(() => {
    if (loading) return;
    if (configured && !session) {
      navigate("/sign-in", { replace: true });
      return;
    }
    if (!userId) {
      setChecking(false);
      return;
    }

    if (isOnboardingCompleteSync(userId)) {
      navigate("/app/generator", { replace: true });
      return;
    }

    if (!shouldRequireOnboarding(userId, createdAt)) {
      navigate("/app/generator", { replace: true });
      return;
    }

    setChecking(false);
  }, [userId, createdAt, session, loading, configured, navigate]);

  const current = ONBOARDING_STEPS[step];
  const progress = ((step + 1) / ONBOARDING_STEPS.length) * 100;
  const selected = answers[current?.key ?? "profileType"];

  const canContinue = Boolean(selected);

  const pick = (optionKey: TranslationKey) => {
    if (!current) return;
    setAnswers((prev) => ({ ...prev, [current.key]: t(optionKey) }));
  };

  const finish = () => {
    if (!userId) return;
    setBusy(true);
    saveOnboarding(userId, answers);
    markFreshSession();
    navigate("/app/generator?fresh=1", { replace: true });
  };

  const next = () => {
    if (step >= ONBOARDING_STEPS.length - 1) finish();
    else setStep((s) => s + 1);
  };

  const back = () => setStep((s) => Math.max(0, s - 1));

  const stepLabel = useMemo(
    () =>
      t("onboarding.step")
        .replace("{current}", String(step + 1))
        .replace("{total}", String(ONBOARDING_STEPS.length)),
    [step, t],
  );

  if (loading || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background-primary)]">
        <div className="font-codec text-sm text-[var(--text-secondary)]">{t("onboarding.loading")}</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background-primary)]">
      <header className="border-b border-[var(--border-primary)] px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <ThemedLogo className="h-8 w-8" />
          <span className="font-syne text-lg font-bold text-[var(--text-primary)]">SoundAI</span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-10">
        <p className="font-codec text-[11px] uppercase tracking-[0.08em] text-[var(--text-muted)]">{stepLabel}</p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--surface-secondary)]">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <h1 className="mt-8 font-syne text-[28px] font-bold tracking-[-0.02em] text-[var(--text-primary)]">
          {current ? t(current.questionKey) : ""}
        </h1>
        <p className="mt-2 font-codec text-sm text-[var(--text-secondary)]">{t("onboarding.subtitle")}</p>

        <ul className="mt-8 space-y-2">
          {current?.options.map((optionKey) => {
            const label = t(optionKey);
            const active = selected === label;
            return (
              <li key={optionKey}>
                <button
                  type="button"
                  onClick={() => pick(optionKey)}
                  className={`flex w-full items-center justify-between rounded-[14px] border px-4 py-3.5 text-left font-codec text-sm transition-colors ${
                    active
                      ? "border-primary bg-primary/10 text-[var(--text-primary)]"
                      : "border-[var(--border-primary)] bg-[var(--surface-primary)] text-[var(--text-secondary)] hover:border-[var(--border-secondary)]"
                  }`}
                >
                  <span>{label}</span>
                  {active && <Check className="h-4 w-4 text-primary" />}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-auto flex items-center justify-between gap-3 pt-10">
          <button
            type="button"
            onClick={back}
            disabled={step === 0}
            className="premium-asset-action h-10 px-4 disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("common.back")}
          </button>
          <button
            type="button"
            onClick={next}
            disabled={!canContinue || busy}
            className="app-btn-primary h-10 px-5 disabled:opacity-50"
          >
            {step >= ONBOARDING_STEPS.length - 1 ? t("onboarding.finish") : t("onboarding.continue")}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </main>
    </div>
  );
}
