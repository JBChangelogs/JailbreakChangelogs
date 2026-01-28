"use client";

import { ReactNode, Component, ErrorInfo } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary for Ad components
 * Isolates ad errors so they don't crash the entire page
 * Follows Nitropay best practices for error handling
 */
export default class AdErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error for monitoring (third-party scripts, ad network issues)
    console.warn("Ad component error caught:", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Don't throw - silently fail and let page continue
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Return nothing - no visual feedback needed for ad failures
      return this.props.fallback || null;
    }

    return this.props.children;
  }
}
