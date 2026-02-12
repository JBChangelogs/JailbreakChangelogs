"use client";

import React from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

class ValuesErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Check if it's a DOM manipulation error
    if (
      error.message.includes("removeChild") ||
      error.message.includes("insertBefore") ||
      error.message.includes("appendChild")
    ) {
      console.warn("DOM manipulation error caught by error boundary:", error);
      return { hasError: true, error };
    }
    // Re-throw other errors
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ValuesErrorBoundary caught an error:", error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      if (FallbackComponent) {
        return (
          <FallbackComponent
            error={this.state.error}
            resetError={this.resetError}
          />
        );
      }

      return (
        <div className="border-border-card bg-secondary-bg rounded-lg border p-6 text-center">
          <h2 className="text-primary-text mb-4 text-xl font-semibold">
            Something went wrong
          </h2>
          <p className="text-secondary-text mb-4">
            There was an issue loading the values page. This is usually
            temporary.
          </p>
          <button
            onClick={this.resetError}
            className="border-border-card bg-button-info text-form-button-text hover:border-border-focus hover:bg-button-info-hover rounded-lg border px-4 py-2 focus:outline-none"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ValuesErrorBoundary;
