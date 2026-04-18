import { useState } from "react";
import PageContainer from "../components/PageContainer";
import { Field, SettingsSection, Toggle } from "../components/SettingsForm";

export default function Settings() {
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [productUpdates, setProductUpdates] = useState(false);
  const [explicitContent, setExplicitContent] = useState(false);
  const [autoSave, setAutoSave] = useState(true);

  return (
    <PageContainer
      title="Settings"
      subtitle="System configuration"
      actions={<button className="app-btn-primary h-10">Save changes</button>}
    >
      <div className="rounded-card border border-surface bg-white shadow-flat-sm">
        <SettingsSection title="Account" description="Security and identifiers.">
          <Field label="Email">
            <input className="app-input" defaultValue="dmitriy@soundai.studio" type="email" />
          </Field>
          <Field label="Password" hint="Last changed 32 days ago.">
            <input className="app-input" defaultValue="••••••••" type="password" />
          </Field>
        </SettingsSection>

        <SettingsSection title="Preferences" description="Workspace defaults.">
          <Field label="Default output format">
            <select className="app-input">
              <option>WAV</option>
              <option>MP3</option>
              <option>FLAC</option>
              <option>OGG</option>
            </select>
          </Field>
          <Field label="Interface density">
            <select className="app-input">
              <option>Comfortable</option>
              <option>Compact</option>
            </select>
          </Field>
          <Toggle
            label="Auto-save generations"
            description="Automatically save every result to your library."
            checked={autoSave}
            onChange={setAutoSave}
          />
        </SettingsSection>

        <SettingsSection title="Notifications" description="How SoundAI reaches you.">
          <Toggle
            label="Generation complete emails"
            description="Get an email when a long-running render finishes."
            checked={emailAlerts}
            onChange={setEmailAlerts}
          />
          <Toggle
            label="Product updates"
            description="Occasional updates about new models and features."
            checked={productUpdates}
            onChange={setProductUpdates}
          />
        </SettingsSection>

        <SettingsSection title="AI behavior" description="Basic controls for generation.">
          <Field label="Creativity" hint="Higher values produce more varied, less predictable results.">
            <input type="range" defaultValue={60} className="w-full accent-[#FF3C82]" />
          </Field>
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
