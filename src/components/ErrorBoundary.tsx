import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Copy, Check } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary] Uncaught React Error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetState = () => {
    try {
      localStorage.removeItem('loot_ledger_active_result');
    } catch {
      // safe
    }
    window.location.href = '/';
  };

  private handleCopyDiagnostic = () => {
    const diagnostic = {
      timestamp: new Date().toISOString(),
      errorName: this.state.error?.name,
      errorMessage: this.state.error?.message,
      componentStack: this.state.errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
    navigator.clipboard.writeText(JSON.stringify(diagnostic, null, 2));
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 2500);
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-canvas text-primary flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-surface border border-subtle rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5 text-center">
            <div className="w-14 h-14 bg-red-950/40 border border-red-800/60 text-red-400 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight text-primary">
                Something went wrong
              </h2>
              <p className="text-sm text-secondary leading-relaxed">
                An unexpected interface error interrupted your workflow. Your saved inventory data in Firestore and local storage is safe.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-canvas border border-subtle rounded-xl p-3 text-left overflow-x-auto text-xs font-mono text-muted max-h-32">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-accent hover:bg-accent-hover text-primary font-bold text-sm rounded-xl transition-colors"
              >
                <RefreshCw className="w-4 h-4" /> Reload App
              </button>
              <button
                onClick={this.handleResetState}
                className="flex-1 py-2.5 px-4 bg-surface border border-subtle hover:bg-surface-hover text-secondary font-semibold text-sm rounded-xl transition-colors"
              >
                Reset Workspace
              </button>
            </div>

            <div className="pt-2 border-t border-subtle">
              <button
                onClick={this.handleCopyDiagnostic}
                className="inline-flex items-center gap-1.5 text-xs text-secondary hover:text-primary transition-colors"
              >
                {this.state.copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied Diagnostic Log
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy Diagnostic Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
