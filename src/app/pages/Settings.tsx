import { useEffect, useState } from "react";
import PageContainer from "../components/PageContainer";
import BrandSelect from "../components/BrandSelect";
import { Field, SettingsSection, Toggle } from "../components/SettingsForm";
import { useLanguage } from "../i18n/LanguageProvider";
import { LANGUAGES, type LanguageCode } from "../i18n/translations";

export default function Settings() {
  const { t, language, setLanguage } = useLanguage();

  // General
  const [workspaceName, setWorkspaceName] = useState("SoundAI · Studio");

  // Audio Quality
  const [sampleRate, setSampleRate] = useState("48 kHz");
  const [bitDepth, setBitDepth] = useState("24-bit");
  const [dither, setDither] = useState(true);
  const [defaultExportFormat, setDefaultExportFormat] = useState("WAV");

  // Interface
  const [sidebarWidth, setSidebarWidth] = useState(216);
  const [density, setDensity] = useState("comfortable");
  const [showTooltips, setShowTooltips] = useState(true);

  // Devices
  const [inputDevice, setInputDevice] = useState("Default — System");
  const [outputDevice, setOutputDevice] = useState("Default — System");
  const [devices, setDevices] = useState<{ inputs: string[]; outputs: string[] }>({
    inputs: [],
    outputs: [],
  });

  // Export
  const [stemsBundle, setStemsBundle] = useState(true);
  const [preferLossless, setPreferLossless] = useState(true);
  const [qualityPreset, setQualityPreset] =
    useState<"draft" | "standard" | "studio">("standard");

  useEffect(() => {
    const run = async () => {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      try {
        const all = await navigator.mediaDevices.enumerateDevices();
        const inputs = all
          .filter((d) => d.kind === "audioinput" && d.label)
          .map((d) => d.label);
        const outputs = all
          .filter((d) => d.kind === "audiooutput" && d.label)
          .map((d) => d.label);
        setDevices({
          inputs: inputs.length ? inputs : ["Default — System"],
          outputs: outputs.length ? outputs : ["Default — System"],
        });
      } catch {
        setDevices({
          inputs: ["Default — System"],
          outputs: ["Default — System"],
        });
      }
    };
    void run();
  }, []);

  const languageOptions = LANGUAGES.map((l) => ({ value: l.code, label: l.label }));
  const densityOptions = [
    { value: "comfortable", label: t("settings.densityComfortable") },
    { value: "compact", label: t("settings.densityCompact") },
  ];
  const qualityPresets: { value: "draft" | "standard" | "studio"; label: string }[] = [
    { value: "draft", label: t("settings.qualityDraft") },
    { value: "standard", label: t("settings.qualityStandard") },
    { value: "studio", label: t("settings.qualityStudio") },
  ];

  return (
    <PageContainer
      title={t("settings.title")}
      subtitle={t("settings.subtitle")}
      actions={
        <button className="app-btn-primary h-9">{t("settings.save")}</button>
      }
    >
      <div className="rounded-card border border-surface bg-white shadow-flat-sm">
        <SettingsSection
          title={t("settings.general")}
          description={t("settings.generalDesc")}
        >
          <Field label={t("settings.workspaceName")}>
            <input
              className="app-input"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
            />
          </Field>
          <Field label={t("settings.language")} hint={t("settings.languageDesc")}>
            <BrandSelect
              value={language}
              options={languageOptions}
              onChange={(v) => setLanguage(v as LanguageCode)}
            />
          </Field>
        </SettingsSection>

        <SettingsSection
          title={t("settings.audioQuality")}
          description={t("settings.audioQualityDesc")}
        >
          <Field label={t("settings.sampleRate")}>
            <BrandSelect
              value={sampleRate}
              options={["44.1 kHz", "48 kHz", "88.2 kHz", "96 kHz"]}
              onChange={setSampleRate}
            />
          </Field>
          <Field label={t("settings.bitDepth")}>
            <BrandSelect
              value={bitDepth}
              options={["16-bit", "24-bit", "32-bit float"]}
              onChange={setBitDepth}
            />
          </Field>
          <Field label={t("settings.defaultExportFormat")}>
            <BrandSelect
              value={defaultExportFormat}
              options={["WAV", "MP3", "FLAC", "OGG"]}
              onChange={setDefaultExportFormat}
            />
          </Field>
          <Toggle
            label={t("settings.dither")}
            description={t("settings.ditherDesc")}
            checked={dither}
            onChange={setDither}
          />
        </SettingsSection>

        <SettingsSection
          title={t("settings.interface")}
          description={t("settings.interfaceDesc")}
        >
          <Field label={t("settings.sidebarWidth")} hint={`${sidebarWidth}px`}>
            <input
              type="range"
              min={180}
              max={320}
              value={sidebarWidth}
              onChange={(e) => setSidebarWidth(Number(e.target.value))}
              className="w-full accent-[#FF3C82]"
            />
          </Field>
          <Field label={t("settings.density")}>
            <BrandSelect
              value={density}
              options={densityOptions}
              onChange={setDensity}
            />
          </Field>
          <Toggle
            label={t("settings.tooltips")}
            description={t("settings.tooltipsDesc")}
            checked={showTooltips}
            onChange={setShowTooltips}
          />
        </SettingsSection>

        <SettingsSection
          title={t("settings.devices")}
          description={t("settings.devicesDesc")}
        >
          <Field
            label={t("settings.inputDevice")}
            hint={t("settings.inputDeviceHint")}
          >
            <BrandSelect
              value={inputDevice}
              options={devices.inputs.length ? devices.inputs : ["Default — System"]}
              onChange={setInputDevice}
            />
          </Field>
          <Field label={t("settings.outputDevice")}>
            <BrandSelect
              value={outputDevice}
              options={devices.outputs.length ? devices.outputs : ["Default — System"]}
              onChange={setOutputDevice}
            />
          </Field>
        </SettingsSection>

        <SettingsSection
          title={t("settings.export")}
          description={t("settings.exportDesc")}
        >
          <Field label={t("settings.qualityPreset")}>
            <div className="flex items-center gap-2">
              {qualityPresets.map((q) => (
                <button
                  key={q.value}
                  type="button"
                  onClick={() => setQualityPreset(q.value)}
                  className={`h-9 rounded-button px-4 font-poppins text-xs font-medium transition-colors ${
                    qualityPreset === q.value
                      ? "bg-primary text-white"
                      : "bg-surface-muted text-text/60 hover:bg-surface"
                  }`}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </Field>
          <Toggle
            label={t("settings.stemsBundle")}
            description={t("settings.stemsBundleDesc")}
            checked={stemsBundle}
            onChange={setStemsBundle}
          />
          <Toggle
            label={t("settings.preferLossless")}
            description={t("settings.preferLosslessDesc")}
            checked={preferLossless}
            onChange={setPreferLossless}
          />
        </SettingsSection>
      </div>
    </PageContainer>
  );
}
