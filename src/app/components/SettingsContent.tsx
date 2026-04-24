import { useEffect, useState } from "react";
import BrandSelect from "./BrandSelect";
import { Field, SettingsSection, Toggle } from "./SettingsForm";
import { useLanguage } from "../i18n/LanguageProvider";
import { LANGUAGES, type LanguageCode } from "../i18n/translations";

interface SettingsContentProps {
  onSave?: () => void;
  compact?: boolean;
}

export default function SettingsContent({ onSave, compact = false }: SettingsContentProps) {
  const { t, language, setLanguage } = useLanguage();

  const [workspaceName, setWorkspaceName] = useState("SoundAI · Studio");
  const [sampleRate, setSampleRate] = useState("48 kHz");
  const [bitDepth, setBitDepth] = useState("24-bit");
  const [dither, setDither] = useState(true);
  const [defaultExportFormat, setDefaultExportFormat] = useState("WAV");
  const [sidebarWidth, setSidebarWidth] = useState(216);
  const [density, setDensity] = useState("comfortable");
  const [showTooltips, setShowTooltips] = useState(true);
  const [inputDevice, setInputDevice] = useState("Default — System");
  const [outputDevice, setOutputDevice] = useState("Default — System");
  const [devices, setDevices] = useState<{ inputs: string[]; outputs: string[] }>({
    inputs: [],
    outputs: [],
  });
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
          .filter((device) => device.kind === "audioinput" && device.label)
          .map((device) => device.label);
        const outputs = all
          .filter((device) => device.kind === "audiooutput" && device.label)
          .map((device) => device.label);
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

  const languageOptions = LANGUAGES.map((item) => ({ value: item.code, label: item.label }));
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
    <div className="rounded-card border border-surface bg-white shadow-flat-sm">
      <div className={`flex items-center justify-between border-b border-surface ${compact ? "px-5 py-4" : "px-6 py-4"}`}>
        <div>
          <h2 className="font-poppins text-lg font-semibold text-text">{t("settings.title")}</h2>
          <p className="app-meta mt-1">{t("settings.subtitle")}</p>
        </div>
        <button type="button" className="app-btn-primary h-9" onClick={onSave}>
          {t("settings.save")}
        </button>
      </div>

      <SettingsSection title={t("settings.general")} description={t("settings.generalDesc")}>
        <Field label={t("settings.workspaceName")}>
          <input
            className="app-input"
            value={workspaceName}
            onChange={(event) => setWorkspaceName(event.target.value)}
          />
        </Field>
        <Field label={t("settings.language")} hint={t("settings.languageDesc")}>
          <BrandSelect
            value={language}
            options={languageOptions}
            onChange={(value) => setLanguage(value as LanguageCode)}
          />
        </Field>
      </SettingsSection>

      <SettingsSection title={t("settings.audioQuality")} description={t("settings.audioQualityDesc")}>
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

      <SettingsSection title={t("settings.interface")} description={t("settings.interfaceDesc")}>
        <Field label={t("settings.sidebarWidth")} hint={`${sidebarWidth}px`}>
          <input
            type="range"
            min={180}
            max={320}
            value={sidebarWidth}
            onChange={(event) => setSidebarWidth(Number(event.target.value))}
            className="app-range w-full"
          />
        </Field>
        <Field label={t("settings.density")}>
          <BrandSelect value={density} options={densityOptions} onChange={setDensity} />
        </Field>
        <Toggle
          label={t("settings.tooltips")}
          description={t("settings.tooltipsDesc")}
          checked={showTooltips}
          onChange={setShowTooltips}
        />
      </SettingsSection>

      <SettingsSection title={t("settings.devices")} description={t("settings.devicesDesc")}>
        <Field label={t("settings.inputDevice")} hint={t("settings.inputDeviceHint")}>
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

      <SettingsSection title={t("settings.export")} description={t("settings.exportDesc")}>
        <Field label={t("settings.qualityPreset")}>
          <div className="flex items-center gap-2">
            {qualityPresets.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => setQualityPreset(preset.value)}
                className={`h-9 rounded-button px-4 font-poppins text-xs font-medium transition-colors ${
                  qualityPreset === preset.value
                    ? "bg-primary text-white"
                    : "bg-surface-muted text-text/60 hover:bg-surface"
                }`}
              >
                {preset.label}
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
  );
}
