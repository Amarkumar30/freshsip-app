import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// Check if error is a network/navigation error that should be ignored
const isRecoverableError = (error: Error | null): boolean => {
  if (!error) return false;
  const msg = error.message?.toLowerCase() || '';
  const name = error.name?.toLowerCase() || '';
  
  // These errors happen during navigation and are recoverable
  if (name === 'aborterror') return true;
  if (msg.includes('load failed')) return true;
  if (msg.includes('failed to fetch')) return true;
  if (msg.includes('aborted')) return true;
  if (msg.includes('cancelled')) return true;
  if (msg.includes('network request failed')) return true;
  if (msg.includes('dynamically imported module')) return true;
  if (msg.includes('loading chunk')) return true;
  
  return false;
};

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Don't show error boundary for recoverable network errors
    if (isRecoverableError(error)) {
      return { hasError: false, error: null };
    }
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    // If it's a recoverable error, just log and don't show error UI
    if (isRecoverableError(error)) {
      console.log('[ErrorBoundary] Ignoring recoverable error:', error.message);
      this.setState({ hasError: false, error: null });
      return;
    }
    console.error('[ErrorBoundary] Caught error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-2xl p-8">
            <AlertTriangle
              size={48}
              className="text-destructive mb-6 flex-shrink-0"
            />

            <h2 className="text-xl mb-4">An unexpected error occurred.</h2>

            <div className="p-4 w-full rounded bg-muted overflow-auto mb-6">
              <pre className="text-sm text-muted-foreground whitespace-break-spaces">
                {this.state.error?.stack}
              </pre>
            </div>

            <button
              onClick={() => window.location.reload()}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg",
                "bg-primary text-primary-foreground",
                "hover:opacity-90 cursor-pointer"
              )}
            >
              <RotateCcw size={16} />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
