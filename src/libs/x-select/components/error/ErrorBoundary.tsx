/**
 * ErrorBoundary - React Error Boundary for XSelect
 *
 * Catches JavaScript errors in child component tree and displays fallback UI.
 * Integrates with ErrorDisplay for consistent error presentation.
 *
 * @example Basic usage
 * ```tsx
 * <XSelectErrorBoundary>
 *   <XSelectProvider configs={configs}>
 *     <MyForm />
 *   </XSelectProvider>
 * </XSelectErrorBoundary>
 * ```
 *
 * @example With custom fallback
 * ```tsx
 * <XSelectErrorBoundary
 *   fallback={({ error, resetError }) => (
 *     <CustomError error={error} onReset={resetError} />
 *   )}
 * >
 *   <XSelect.Infinite ... />
 * </XSelectErrorBoundary>
 * ```
 */

import React, { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

import { ErrorDisplay, parseError, type ParsedError } from './ErrorDisplay';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Props for fallback render function.
 */
export interface ErrorBoundaryFallbackProps {
  /** Parsed error */
  error: ParsedError;

  /** Original error */
  originalError: Error;

  /** Error info from React */
  errorInfo: ErrorInfo | null;

  /** Reset error boundary */
  resetError: () => void;
}

/**
 * Props for ErrorBoundary.
 */
export interface XSelectErrorBoundaryProps {
  /** Children to render */
  children: ReactNode;

  /** Custom fallback render */
  fallback?: (props: ErrorBoundaryFallbackProps) => ReactNode;

  /** Error callback */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;

  /** Reset keys - error boundary resets when these change */
  resetKeys?: unknown[];

  /** Show error details */
  showDetails?: boolean;

  /** Custom error parser */
  parseError?: (error: Error) => ParsedError;
}

/**
 * State for ErrorBoundary.
 */
interface ErrorBoundaryState {
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Error Boundary for XSelect components.
 *
 * Catches render errors and displays a fallback UI with retry option.
 */
export class XSelectErrorBoundary extends Component<
  XSelectErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: XSelectErrorBoundaryProps) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[XSelectErrorBoundary] Caught error:', error);
      console.error('[XSelectErrorBoundary] Component stack:', errorInfo.componentStack);
    }
  }

  componentDidUpdate(prevProps: XSelectErrorBoundaryProps) {
    // Reset error when resetKeys change
    if (this.state.error && this.props.resetKeys) {
      const prevResetKeys = prevProps.resetKeys ?? [];
      const currentResetKeys = this.props.resetKeys;

      const hasChanged = currentResetKeys.some(
        (key, index) => key !== prevResetKeys[index]
      );

      if (hasChanged) {
        this.resetError();
      }
    }
  }

  resetError = () => {
    this.setState({ error: null, errorInfo: null });
  };

  render() {
    const { children, fallback, showDetails, parseError: customParseError } = this.props;
    const { error, errorInfo } = this.state;

    if (error) {
      const parsedError = customParseError ? customParseError(error) : parseError(error);

      // Custom fallback
      if (fallback) {
        return fallback({
          error: parsedError,
          originalError: error,
          errorInfo,
          resetError: this.resetError,
        });
      }

      // Default fallback using ErrorDisplay
      return (
        <div style={{ padding: '16px' }}>
          <ErrorDisplay
            error={error}
            onRetry={this.resetError}
            retryText="Try Again"
            showDetails={showDetails}
            parseError={customParseError}
          />
          {showDetails && errorInfo && (
            <details
              style={{
                marginTop: '12px',
                padding: '8px',
                backgroundColor: '#f5f5f5',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            >
              <summary style={{ cursor: 'pointer', fontWeight: 500 }}>
                Component Stack
              </summary>
              <pre
                style={{
                  margin: '8px 0 0',
                  whiteSpace: 'pre-wrap',
                  fontSize: '11px',
                  color: '#666',
                }}
              >
                {errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return children;
  }
}

export default XSelectErrorBoundary;
