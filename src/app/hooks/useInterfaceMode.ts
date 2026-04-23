import { createContext, useContext } from "react";

export type InterfaceMode = "lite" | "pro";

export interface InterfaceModeCtx {
  mode: InterfaceMode;
  setMode: (m: InterfaceMode) => void;
  toggle: () => void;
}

export const InterfaceModeContext = createContext<InterfaceModeCtx>({
  mode: "pro",
  setMode: () => {},
  toggle: () => {},
});

export function useInterfaceMode(): InterfaceModeCtx {
  return useContext(InterfaceModeContext);
}
