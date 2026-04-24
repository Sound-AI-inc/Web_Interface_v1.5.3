import PageContainer from "../components/PageContainer";
import SettingsContent from "../components/SettingsContent";

export default function Settings() {
  return (
    <PageContainer title="Settings" subtitle="Workspace, audio, interface and export defaults">
      <SettingsContent />
    </PageContainer>
  );
}
