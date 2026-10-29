import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

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
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Craftora UI ErrorBoundary caught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl border border-[#D9B99B]/40 p-8 text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center mx-auto">
              <AlertTriangle size={28} />
            </div>
            <h2 className="font-display text-2xl font-bold text-[#29231F]">Something went wrong</h2>
            <p className="text-xs text-[#29231F]/70 leading-relaxed">
              We encountered a rendering issue. You can reload this view or return to the marketplace home.
            </p>
            {this.state.error && (
              <pre className="text-[10px] text-left p-3 rounded-xl bg-[#FAF7F2] text-neutral-600 font-mono overflow-x-auto max-h-32 border border-[#D9B99B]/30">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="flex-1 py-2.5 px-4 bg-[#7A4B35] hover:bg-[#633B29] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <RefreshCw size={14} /> Reload Page
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.hash = '';
                  window.location.href = '/';
                }}
                className="flex-1 py-2.5 px-4 bg-white border border-[#D9B99B]/60 text-[#29231F] text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Home size={14} /> Back to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
