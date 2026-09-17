import type { ReactNode } from "react";
import ProGate from "./ProGate";
import { useInterfaceMode } from "../hooks/useInterfaceMode";

interface RequireProProps {
  title: string;
  subtitle: string;
  feature: string;
  children: ReactNode;
}

/**
 * Route-level Pro guard. Uses the existing interface-mode state as the
 * authoritative frontend gate so direct URLs cannot bypass the Sidebar
 * lite-lock. Backend authorization is untouched.
 */
export default function RequirePro({ title, subtitle, feature, children }: RequireProProps) {
  const { mode } = useInterfaceMode();
  if (mode !== "pro") {
    return <ProGate title={title} subtitle={subtitle} feature={feature} />;
  }
  return <>{children}</>;
}
