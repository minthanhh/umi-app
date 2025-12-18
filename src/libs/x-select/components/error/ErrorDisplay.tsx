/**
 * ErrorDisplay - Error Recovery UI Component
 *
 * Displays error state with retry functionality.
 * Framework-agnostic design with customizable UI.
 *
 * @example Basic usage
 * ```tsx
 * <ErrorDisplay
 *   error={error}
 *   onRetry={refetch}
 * />
 * ```
 *
 * @example Custom render
 * ```tsx
 * <ErrorDisplay
 *   error={error}
 *   onRetry={refetch}
 *   render={({ error, onRetry, isRetrying }) => (
 *     <CustomErrorUI error={error} onRetry={onRetry} />
 *   )}
 * />
 * ```
 */

import React from 'react';
import type { ReactNode } from 'react';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Error severity levels.
 */
export type ErrorSeverity = 'warning' | 'error' | 'info';

/**
 * Error type classification.
 */
export type ErrorType = 'network' | 'timeout' | 'server' | 'validation' | 'unknown';

/**
 * Parsed error information.
 */
export interface ParsedError {
  /** Error type */
  type: ErrorType;

  /** User-friendly message */
  message: string;

  /** Original error */
  originalError: Error;

  /** HTTP status code (if applicable) */
  statusCode?: number;

  /** Whether error is retryable */
  isRetryable: boolean;
}

/**
 * Props for custom error render function.
 */
export interface ErrorRenderProps {
  /** Parsed error info */
  error: ParsedError;

  /** Retry handler */
  onRetry: () => void;

  /** Whether retry is in progress */
  isRetrying: boolean;

  /** Dismiss handler */
  onDismiss?: () => void;

  /** Error severity */
  severity: ErrorSeverity;
}

/**
 * Props for ErrorDisplay component.
 */
export interface ErrorDisplayProps {
  /** Error object */
  error: Error | null;

  /** Retry handler */
  onRetry?: () => void;

  /** Whether retry is in progress */
  isRetrying?: boolean;

  /** Dismiss handler */
  onDismiss?: () => void;

  /** Error severity */
  severity?: ErrorSeverity;

  /** Custom error parser */
  parseError?: (error: Error) => ParsedError;

  /** Custom render function */
  render?: (props: ErrorRenderProps) => ReactNode;

  /** Show inline (vs overlay) */
  inline?: boolean;

  /** Additional CSS class */
  className?: string;

  /** Additional styles */
  style?: React.CSSProperties;

  /** Custom retry button text */
  retryText?: string;

  /** Custom dismiss button text */
  dismissText?: string;

  /** Show error details (for debugging) */
  showDetails?: boolean;

  /** Children to show when no error */
  children?: ReactNode;
}

// ============================================================================
// ERROR PARSER
// ============================================================================

/**
 * Default error parser - classifies and formats errors.
 */
export function parseError(error: Error): ParsedError {
  const errorMessage = error.message.toLowerCase();
  const errorName = error.name.toLowerCase();

  // Network errors
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('failed to fetch') ||
    errorName === 'typeerror'
  ) {
    return {
      type: 'network',
      message: 'Unable to connect. Please check your internet connection.',
      originalError: error,
      isRetryable: true,
    };
  }

  // Timeout errors
  if (
    errorMessage.includes('timeout') ||
    errorMessage.includes('timed out') ||
    errorName === 'aborterror'
  ) {
    return {
      type: 'timeout',
      message: 'Request timed out. Please try again.',
      originalError: error,
      isRetryable: true,
    };
  }

  // Server errors (5xx)
  const serverErrorMatch = errorMessage.match(/5\d{2}/);
  if (serverErrorMatch) {
    return {
      type: 'server',
      message: 'Server error. Please try again later.',
      originalError: error,
      statusCode: parseInt(serverErrorMatch[0], 10),
      isRetryable: true,
    };
  }

  // Client errors (4xx)
  const clientErrorMatch = errorMessage.match(/4\d{2}/);
  if (clientErrorMatch) {
    const statusCode = parseInt(clientErrorMatch[0], 10);
    return {
      type: 'validation',
      message: statusCode === 401
        ? 'Session expired. Please log in again.'
        : statusCode === 403
          ? 'You do not have permission to perform this action.'
          : statusCode === 404
            ? 'Resource not found.'
            : 'Invalid request. Please try again.',
      originalError: error,
      statusCode,
      isRetryable: statusCode >= 500,
    };
  }

  // Default
  return {
    type: 'unknown',
    message: error.message || 'An unexpected error occurred.',
    originalError: error,
    isRetryable: true,
  };
}

// ============================================================================
// DEFAULT STYLES
// ============================================================================

const defaultStyles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '13px',
    gap: '12px',
  },
  containerInline: {
    padding: '4px 8px',
    fontSize: '12px',
  },
  errorStyle: {
    backgroundColor: '#fff2f0',
    border: '1px solid #ffccc7',
    color: '#cf1322',
  },
  warningStyle: {
    backgroundColor: '#fffbe6',
    border: '1px solid #ffe58f',
    color: '#ad6800',
  },
  infoStyle: {
    backgroundColor: '#e6f4ff',
    border: '1px solid #91caff',
    color: '#0958d9',
  },
  content: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: 1,
    minWidth: 0,
  },
  icon: {
    flexShrink: 0,
    width: '16px',
    height: '16px',
  },
  message: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  },
  button: {
    padding: '4px 12px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 500,
    transition: 'opacity 0.2s',
  },
  retryButton: {
    backgroundColor: '#1677ff',
    color: '#fff',
  },
  dismissButton: {
    backgroundColor: 'transparent',
    color: '#666',
    border: '1px solid #d9d9d9',
  },
  details: {
    marginTop: '8px',
    padding: '8px',
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: '4px',
    fontSize: '11px',
    fontFamily: 'monospace',
    color: '#666',
    maxHeight: '100px',
    overflow: 'auto',
  },
};

// ============================================================================
// ICONS
// ============================================================================

const ErrorIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" style={defaultStyles.icon}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
  </svg>
);

const WarningIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" style={defaultStyles.icon}>
    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
  </svg>
);

const InfoIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" style={defaultStyles.icon}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
  </svg>
);

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: '14px', height: '14px' }}>
    <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
  </svg>
);

// ============================================================================
// COMPONENT
// ============================================================================

export function ErrorDisplay({
  error,
  onRetry,
  isRetrying = false,
  onDismiss,
  severity = 'error',
  parseError: customParseError,
  render,
  inline = false,
  className,
  style,
  retryText = 'Retry',
  dismissText = 'Dismiss',
  showDetails = false,
  children,
}: ErrorDisplayProps) {
  // No error - render children or nothing
  if (!error) {
    return <>{children}</>;
  }

  // Parse error
  const parsedError = customParseError ? customParseError(error) : parseError(error);

  // Custom render
  if (render) {
    return (
      <>
        {render({
          error: parsedError,
          onRetry: onRetry ?? (() => {}),
          isRetrying,
          onDismiss,
          severity,
        })}
      </>
    );
  }

  // Get severity styles
  const severityStyles =
    severity === 'warning'
      ? defaultStyles.warningStyle
      : severity === 'info'
        ? defaultStyles.infoStyle
        : defaultStyles.errorStyle;

  // Get icon
  const Icon =
    severity === 'warning' ? WarningIcon : severity === 'info' ? InfoIcon : ErrorIcon;

  return (
    <div
      className={className}
      style={{
        ...defaultStyles.container,
        ...(inline ? defaultStyles.containerInline : {}),
        ...severityStyles,
        ...style,
      }}
    >
      <div style={defaultStyles.content}>
        <Icon />
        <span style={defaultStyles.message} title={parsedError.message}>
          {parsedError.message}
        </span>
      </div>

      <div style={defaultStyles.actions}>
        {parsedError.isRetryable && onRetry && (
          <button
            onClick={onRetry}
            disabled={isRetrying}
            style={{
              ...defaultStyles.button,
              ...defaultStyles.retryButton,
              opacity: isRetrying ? 0.6 : 1,
              cursor: isRetrying ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <RefreshIcon />
            {isRetrying ? 'Retrying...' : retryText}
          </button>
        )}

        {onDismiss && (
          <button
            onClick={onDismiss}
            style={{
              ...defaultStyles.button,
              ...defaultStyles.dismissButton,
            }}
          >
            {dismissText}
          </button>
        )}
      </div>

      {showDetails && (
        <div style={defaultStyles.details}>
          <div>Type: {parsedError.type}</div>
          {parsedError.statusCode && <div>Status: {parsedError.statusCode}</div>}
          <div>Message: {parsedError.originalError.message}</div>
          {parsedError.originalError.stack && (
            <pre style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap' }}>
              {parsedError.originalError.stack}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

export default ErrorDisplay;