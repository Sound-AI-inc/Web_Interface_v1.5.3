import { useEffect, useState } from "react";
import PageContainer from "../components/PageContainer";
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
  const [density, setDensity] = useState("Comfortable");
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
          description="Workspace and regional defaults."
        >
          <Field label="Workspace name">
            <input
              className="app-input"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
            />
          </Field>
          <Field label={t("settings.language")} hint={t("settings.languageDesc")}>
            <select
              className="app-input"
              value={language}
              onChange={(e) => setLanguage(e.target.value as LanguageCode)}
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </Field>
        </SettingsSection>

        <SettingsSection
          title={t("settings.audioQuality")}
          description="Defaults for rendering and exports."
        >
          <Field label="Sample rate">
            <select
              className="app-input"
              value={sampleRate}
              onChange={(e) => setSampleRate(e.target.value)}
            >
              <option>44.1 kHz</option>
              <option>48 kHz</option>
              <option>88.2 kHz</option>
              <option>96 kHz</option>
            </select>
          </Field>
          <Field label="Bit depth">
            <select
              className="app-input"
              value={bitDepth}
              onChange={(e) => setBitDepth(e.target.value)}
            >
              <option>16-bit</option>
              <option>24-bit</option>
              <option>32-bit float</option>
            </select>
          </Field>
          <Field label="Default export format">
            <select
              className="app-input"
              value={defaultExportFormat}
              onChange={(e) => setDefaultExportFormat(e.target.value)}
            >
              <option>WAV</option>
              <option>MP3</option>
              <option>FLAC</option>
              <option>OGG</option>
            </select>
          </Field>
          <Toggle
            label="Apply dither on downconversion"
            description="Reduces quantization noise when exporting at lower bit depths."
            checked={dither}
            onChange={setDither}
          />
        </SettingsSection>

        <SettingsSection
          title={t("settings.interface")}
          description="Tune the dashboard to your workflow."
        >
          <Field label="Sidebar width" hint={`${sidebarWidth}px`}>
            <input
              type="range"
              min={180}
              max={320}
              value={sidebarWidth}
              onChange={(e) => setSidebarWidth(Number(e.target.value))}
              className="w-full accent-[#FF3C82]"
            />
          </Field>
          <Field label="Density">
            <select
              className="app-input"
              value={density}
              onChange={(e) => setDensity(e.target.value)}
            >
              <option>Comfortable</option>
              <option>Compact</option>
            </select>
          </Field>
          <Toggle
            label="Show tooltips"
            description="Inline explanations on buttons and fields."
            checked={showTooltips}
            onChange={setShowTooltips}
          />
        </SettingsSection>

        <SettingsSection
          title={t("settings.devices")}
          description="Audio I/O for generation playback and Editor Mode."
        >
          <Field
            label="Input device"
            hint="Grant microphone permission to see all connected devices."
          >
            <select
              className="app-input"
              value={inputDevice}
              onChange={(e) => setInputDevice(e.target.value)}
            >
              {(devices.inputs.length ? devices.inputs : ["Default — System"]).map(
                (d) => (
                  <option key={d}>{d}</option>
                ),
              )}
            </select>
          </Field>
          <Field label="Output device">
            <select
              className="app-input"
              value={outputDevice}
              onChange={(e) => setOutputDevice(e.target.value)}
            >
              {(devices.outputs.length ? devices.outputs : ["Default — System"]).map(
                (d) => (
                  <option key={d}>{d}</option>
                ),
              )}
            </select>
          </Field>
        </SettingsSection>

        <SettingsSection
          title={t("settings.export")}
          description="Defaults when sending assets out of SoundAI."
        >
          <Field label="Quality preset">
            <div className="flex items-center gap-2">
              {(["draft", "standard", "studio"] as const).map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQualityPreset(q)}
                  className={`h-9 rounded-button px-4 font-poppins text-xs font-medium capitalize transition-colors ${
                    qualityPreset === q
                      ? "bg-primary text-white"
                      : "bg-surface-muted text-text/60 hover:bg-surface"
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </Field>
          <Toggle
            label="Bundle stems when exporting"
            description="Adds separated stems (drums, bass, melody) to exported projects."
            checked={stemsBundle}
            onChange={setStemsBundle}
          />
          <Toggle
            label="Prefer lossless formats"
            description="Use WAV / FLAC when the target supports them."
            checked={preferLossless}
            onChange={setPreferLossless}
          />
        </SettingsSection>
      </div>
    </PageContainer>
  );
}
