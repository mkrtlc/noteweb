import { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackLabel?: string;
}

// @types/react is not installed; declare inherited members explicitly so TypeScript
// can type-check this class (Component resolves to `any` without the types package).
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  declare state: ErrorBoundaryState;
  declare props: Readonly<ErrorBoundaryProps & { children: ReactNode }>;
  declare setState: (state: Partial<ErrorBoundaryState>) => void;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset() {
    this.setState({ hasError: false, error: null });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-500 p-6">
          <p className="text-sm font-medium">
            {this.props.fallbackLabel ?? 'The graph ran into an error.'}
          </p>
          <button
            onClick={this.handleReset}
            className="text-xs px-3 py-1.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
          >
            Reload graph
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
