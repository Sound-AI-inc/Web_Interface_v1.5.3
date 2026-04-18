import PageContainer from "../components/PageContainer";
import { Field, SettingsSection } from "../components/SettingsForm";

export default function Profile() {
  return (
    <PageContainer title="Profile" subtitle="Your identity on SoundAI" actions={<button className="app-btn-primary h-10">Save changes</button>}>
      <div className="rounded-card border border-surface bg-white shadow-flat-sm">
        <SettingsSection title="Account" description="How you appear across SoundAI.">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 font-poppins text-xl font-semibold text-primary">
              DM
            </div>
            <div>
              <div className="font-poppins text-sm font-semibold text-text">Dmitriy M.</div>
              <div className="app-meta">dmitriy@soundai.studio</div>
            </div>
            <button className="app-btn-ghost ml-auto h-9">Change avatar</button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Display name">
              <input className="app-input" defaultValue="Dmitriy M." />
            </Field>
            <Field label="Email">
              <input className="app-input" defaultValue="dmitriy@soundai.studio" type="email" />
            </Field>
            <Field label="Workspace">
              <input className="app-input" defaultValue="SoundAI · Studio" />
            </Field>
            <Field label="Role">
              <input className="app-input" defaultValue="Producer" />
            </Field>
          </div>
        </SettingsSection>

        <SettingsSection title="Stats" description="Snapshot of your recent activity.">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Stat label="Generations" value="312" />
            <Stat label="Saved prompts" value="46" />
            <Stat label="Library assets" value="128" />
          </div>
        </SettingsSection>
      </div>
    </PageContainer>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card border border-surface bg-surface-muted p-4">
      <div className="app-meta">{label}</div>
      <div className="mt-1 font-poppins text-2xl font-semibold text-text">{value}</div>
    </div>
  );
}
