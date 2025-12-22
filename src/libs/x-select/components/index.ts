/**
 * XSelect - Component Exports
 */

export {
  XSelect,
  DependentWrapper,
  InfiniteWrapper,
  StaticWrapper,
  FieldWrapper,
  DependentContext,
  useDependentContext,
} from './wrappers';

export type {
  DependentWrapperProps,
  DependentInjectedProps,
  InfiniteWrapperProps,
  InfiniteInjectedProps,
  StaticWrapperProps,
  StaticInjectedProps,
  StaticOption,
  FieldWrapperProps,
  FieldInjectedProps,
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