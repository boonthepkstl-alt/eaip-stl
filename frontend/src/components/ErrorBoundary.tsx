import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-surface-100">
          <div className="max-w-md rounded-lg bg-white p-8 shadow-lg">
            <h1 className="mb-4 text-2xl font-bold text-error-600">Something went wrong</h1>
            <p className="mb-4 text-surface-700">Sorry, an unexpected error occurred.</p>
            {this.state.error && (
              <pre className="mb-4 overflow-auto rounded bg-surface-100 p-4 text-sm text-surface-800">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="rounded bg-brand-500 px-4 py-2 font-medium text-white hover:bg-brand-600"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
