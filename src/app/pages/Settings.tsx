import { useEffect, useState } from "react";
import PageContainer from "../components/PageContainer";
import { Field, SettingsSection, Toggle } from "../components/SettingsForm";
import { supabaseConfigured, supabaseUrl } from "../lib/supabase";

export default function Settings() {
  // General
  const [workspaceName, setWorkspaceName] = useState("SoundAI · Studio");
  const [language, setLanguage] = useState("English (US)");
  const [accentColor, setAccentColor] = useState("#FF3C82");

  // Audio Quality
  const [sampleRate, setSampleRate] = useState("48 kHz");
  const [bitDepth, setBitDepth] = useState("24-bit");
  const [dither, setDither] = useState(true);
  const [defaultExportFormat, setDefaultExportFormat] = useState("WAV");

  // Interface
  const [sidebarWidth, setSidebarWidth] = useState(240);
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
  const [qualityPreset, setQualityPreset] = useState<"draft" | "standard" | "studio">("standard");

  // AI Behaviour (kept)
  const [explicitContent, setExplicitContent] = useState(false);
  const [autoSave, setAutoSave] = useState(true);

  useEffect(() => {
    // Enumerate available audio devices.
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
        setDevices({ inputs: ["Default — System"], outputs: ["Default — System"] });
      }
    };
    void run();
  }, []);

  return (
    <PageContainer
      title="Settings"
      subtitle="System configuration"
      actions={<button className="app-btn-primary h-9">Save changes</button>}
    >
      {supabaseConfigured() && (
        <div className="mb-4 flex items-center gap-3 rounded-card border border-accent-light/60 bg-accent-light/20 px-4 py-3">
          <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
          <div className="min-w-0">
            <div className="font-poppins text-xs font-semibold text-text">Supabase connected</div>
            <div className="app-meta truncate">{supabaseUrl}</div>
          </div>
        </div>
      )}

      <div className="rounded-card border border-surface bg-white shadow-flat-sm">
        <SettingsSection title="General" description="Workspace and regional defaults.">
          <Field label="Workspace name">
            <input
              className="app-input"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
            />
          </Field>
          <Field label="Language">
            <select
              className="app-input"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option>English (US)</option>
              <option>English (UK)</option>
              <option>Русский</option>
              <option>Español</option>
              <option>Deutsch</option>
              <option>日本語</option>
            </select>
          </Field>
          <Field label="Accent color" hint="Used for primary buttons and highlights.">
            <div className="flex items-center gap-2">
              {["#FF3C82", "#FF98A8", "#A1E7EE"].map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setAccentColor(c)}
                  className={`h-8 w-8 rounded-full border ${
                    accentColor === c ? "border-text" : "border-surface"
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Pick ${c}`}
                />
              ))}
              <span className="app-meta ml-2">{accentColor}</span>
            </div>
          </Field>
        </SettingsSection>

        <SettingsSection
          title="Audio Quality"
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

        <SettingsSection title="Interface" description="Tune the dashboard to your workflow.">
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
          title="Devices"
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
              {(devices.inputs.length ? devices.inputs : ["Default — System"]).map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </Field>
          <Field label="Output device">
            <select
              className="app-input"
              value={outputDevice}
              onChange={(e) => setOutputDevice(e.target.value)}
            >
              {(devices.outputs.length ? devices.outputs : ["Default — System"]).map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </Field>
        </SettingsSection>

        <SettingsSection title="Export" description="Defaults when sending assets out of SoundAI.">
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

        <SettingsSection title="AI behavior" description="Basic controls for generation.">
          <Field label="Creativity" hint="Higher values produce more varied, less predictable results.">
            <input type="range" defaultValue={60} className="w-full accent-[#FF3C82]" />
          </Field>
          <Toggle
            label="Auto-save generations"
            description="Automatically save every result to your library."
            checked={autoSave}
            onChange={setAutoSave}
          />
          <Toggle
            label="Allow explicit content"
            description="Opt into outputs that may contain explicit themes."
            checked={explicitContent}
            onChange={setExplicitContent}
          />
        </SettingsSection>
      </div>
    </PageContainer>
  );
}
