import { Lock } from "lucide-react";
import PageContainer from "./PageContainer";

interface ProGateProps {
  title: string;
  subtitle: string;
  feature: string;
}

export default function ProGate({ title, subtitle, feature }: ProGateProps) {
  return (
    <div className="premium-workspace pb-8">
      <PageContainer title={title} subtitle={subtitle}>
        <div className="premium-gate flex flex-col items-center justify-center rounded-[20px] border border-[var(--border-primary)] bg-[var(--surface-primary)] px-8 py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[var(--border-primary)] bg-[var(--surface-secondary)]">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <h2 className="font-poppins text-lg font-semibold text-[var(--text-primary)]">
            Pro workspace required
          </h2>
          <p className="mt-2 max-w-md font-codec text-sm text-[var(--text-secondary)]">
            {feature} Switch to Pro using the toggle in the top bar to unlock this workspace.
          </p>
        </div>
      </PageContainer>
    </div>
  );
}
