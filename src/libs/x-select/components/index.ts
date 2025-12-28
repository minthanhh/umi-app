/**
 * XSelect - Component Exports
 */

export {
  // Compound component
  XSelect,

  // Wrappers (work in both static and dynamic modes)
  DependentWrapper,
  InfiniteWrapper,
  StaticWrapper,
  DependentContext,
  useDependentContext,
} from './wrappers';

export type {
  // Wrapper props
  DependentWrapperProps,
  DependentInjectedProps,
  InfiniteWrapperProps,
  InfiniteInjectedProps,
  StaticWrapperProps,
  StaticInjectedProps,
  StaticOption,
} from './wrappers';

// Error Recovery Components
export {
  ErrorDisplay,
  XSelectErrorBoundary,
  parseError,
} from './error';

export type {
  ErrorDisplayProps,
  ErrorRenderProps,
  ErrorSeverity,
  ErrorType,
  ParsedError,
  XSelectErrorBoundaryProps,
  ErrorBoundaryFallbackProps,
} from './error';