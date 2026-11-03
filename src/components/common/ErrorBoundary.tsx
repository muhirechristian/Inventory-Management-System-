import React, { Component, ErrorInfo, ReactNode } from 'react';
import { CodevLogo } from './CodevLogo.tsx';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Codev System] Uncaught UI render error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xl text-center space-y-4">
            <div className="flex justify-center">
              <CodevLogo size="lg" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#14213D]">Codev Recovery Assistant</h2>
              <p className="text-sm text-[#64748B] mt-1">
                An unexpected display error occurred while rendering the interface.
              </p>
            </div>

            {this.state.error && (
              <div className="text-left bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono text-[#DC2626] max-h-32 overflow-auto">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full h-10 rounded-lg bg-[#14213D] text-white font-semibold text-sm hover:bg-[#14213D]/90 transition cursor-pointer"
              >
                Reload Application
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full h-10 rounded-lg border border-[#E2E8F0] text-[#64748B] font-semibold text-sm hover:bg-slate-50 transition cursor-pointer"
              >
                Clear Local Cache & Reset
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
