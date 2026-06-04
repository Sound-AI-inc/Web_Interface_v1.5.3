import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("SoundAI render error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 text-center">
          <h2 className="font-syne text-xl font-bold text-[var(--text-primary)]">
            {this.props.fallbackTitle ?? "Something went wrong"}
          </h2>
          <p className="mt-3 max-w-md font-codec text-sm text-[var(--text-secondary)]">
            {this.state.error.message}
          </p>
          <button
            type="button"
            className="app-btn-primary mt-6"
            onClick={() => {
              try {
                localStorage.removeItem("soundai-workspace-v1");
              } catch {
                /* ignore */
              }
              window.location.reload();
            }}
          >
            Reset workspace and reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
