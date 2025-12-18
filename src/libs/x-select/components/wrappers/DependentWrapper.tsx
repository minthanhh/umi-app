/**
 * DependentWrapper - Cascading Select Wrapper
 *
 * Wrapper component for dependent/cascading select.
 * Injects props into children (value, onChange, disabled, parentValue, options).
 *
 * Features:
 * - Auto-fetch value from store
 * - Auto-filter options by parent value
 * - Auto-disable when parent has no value
 * - Supports render props and React.cloneElement
 *
 * @example Basic usage
 * ```tsx
 * <DependentWrapper name="province">
 *   <Select placeholder="Select province" />
 * </DependentWrapper>
 * ```
 *
 * @example With render props
 * ```tsx
 * <DependentWrapper name="city">
 *   {({ value, onChange, disabled, options }) => (
 *     <Select
 *       value={value}
 *       onChange={onChange}
 *       disabled={disabled}
 *       options={options}
 *     />
 *   )}
 * </DependentWrapper>
 * ```
 */

import React, {
  createContext,
  isValidElement,
  memo,
  useContext,
  useMemo,
  useRef,
} from 'react';
import type { ReactElement, ReactNode } from 'react';

import { useXSelectField } from '../../contexts';
import type { XSelectOption, FormattedOption, DependentContextValue } from '../../types';
import { formatOptions } from '../../utils';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Props injected into children.
 */
export interface DependentInjectedProps {
  /** Current value */
  value: unknown;

  /** Change handler */
  onChange: (value: unknown) => void;

  /** Disabled by parent */
  disabled?: boolean;

  /** Parent value(s) */
  parentValue?: unknown;

  /** Filtered options */
  options?: FormattedOption[];

  /** Loading state */
  loading?: boolean;
}

/**
 * Props for DependentWrapper.
 */
export interface DependentWrapperProps {
  /** Field name (must match config in Provider) */
  name: string;

  /** Display label */
  label?: ReactNode;

  /** Override disabled state */
  disabled?: boolean;

  /** External options (override config options) */
  options?: XSelectOption[];

  /** External loading state */
  loading?: boolean;

  /** Children - ReactElement or render function */
  children: ReactElement | ((props: DependentInjectedProps) => ReactNode);
}

// ============================================================================
// CONTEXT
// ============================================================================

/**
 * Context for passing data to nested InfiniteWrapper.
 */
export const DependentContext = createContext<DependentContextValue | null>(null);

/**
 * Hook to get context from DependentWrapper (if nested).
 */
export function useDependentContext(): DependentContextValue | null {
  return useContext(DependentContext);
}

// ============================================================================
// HELPERS
// ============================================================================

function areOptionsEqual(
  a: XSelectOption[] | undefined,
  b: XSelectOption[] | undefined,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].value !== b[i].value || a[i].label !== b[i].label) return false;
  }
  return true;
}

function areChildrenEqual(
  a: DependentWrapperProps['children'],
  b: DependentWrapperProps['children'],
): boolean {
  if (a === b) return true;

  if (isValidElement(a) && isValidElement(b)) {
    return a.type === b.type && a.key === b.key;
  }

  if (typeof a === 'function' && typeof b === 'function') {
    return a === b;
  }

  return false;
}

function arePropsEqual(
  prevProps: DependentWrapperProps,
  nextProps: DependentWrapperProps,
): boolean {
  if (prevProps.name !== nextProps.name) return false;
  if (prevProps.disabled !== nextProps.disabled) return false;
  if (prevProps.loading !== nextProps.loading) return false;
  if (!areOptionsEqual(prevProps.options, nextProps.options)) return false;
  if (!areChildrenEqual(prevProps.children, nextProps.children)) return false;

  return true;
}

// ============================================================================
// COMPONENT
// ============================================================================

function DependentWrapperInner({
  name,
  disabled: disabledProp,
  options: externalOptions,
  loading: externalLoading,
  children,
}: DependentWrapperProps) {
  const childrenRef = useRef(children);

  if (isValidElement(children) && isValidElement(childrenRef.current)) {
    if (
      children.type !== childrenRef.current.type ||
      children.key !== childrenRef.current.key
    ) {
      childrenRef.current = children;
    }
  } else if (children !== childrenRef.current) {
    childrenRef.current = children;
  }

  const stableChildren = childrenRef.current;

  const {
    config: fieldConfig,
    options: storeOptions,
    value,
    parentValue,
    parentValues,
    isLoading: storeLoading,
    isDisabledByParent,
    onChange,
  } = useXSelectField(name, { options: externalOptions });

  const resolvedOptions = externalOptions ?? storeOptions;

  const formattedOptions = useMemo(
    () => formatOptions(resolvedOptions),
    [resolvedOptions],
  );

  const isLoading = externalLoading ?? storeLoading;
  const isDisabled = disabledProp || isDisabledByParent;

  const injectedProps: DependentInjectedProps = {
    value,
    onChange,
    disabled: isDisabled,
    parentValue,
    options: formattedOptions,
    loading: isLoading,
  };

  const hasDependency = !!fieldConfig?.dependsOn;

  const contextValue: DependentContextValue = useMemo(
    () => ({
      name,
      value,
      parentValue,
      parentValues,
      onChange,
      isDisabledByParent: isDisabled,
      isLoading,
      hasDependency,
    }),
    [name, value, parentValue, parentValues, onChange, isDisabled, isLoading, hasDependency],
  );

  if (!fieldConfig) {
    console.warn(
      `[DependentWrapper] No config found for field "${name}". ` +
        'Make sure the field name matches a config in XSelectProvider.',
    );
  }

  const currentChildProps = isValidElement(children)
    ? (children.props as Record<string, unknown>)
    : {};

  const content =
    typeof stableChildren === 'function'
      ? stableChildren(injectedProps)
      : isValidElement(stableChildren)
        ? React.cloneElement(stableChildren as React.ReactElement<any>, {
            ...injectedProps,
            value: currentChildProps.value ?? injectedProps.value,
            onChange: currentChildProps.onChange ?? injectedProps.onChange,
            disabled:
              (stableChildren.props as any).disabled ?? injectedProps.disabled,
            options:
              (stableChildren.props as any).options ?? injectedProps.options,
            loading:
              (stableChildren.props as any).loading ?? injectedProps.loading,
            parentValue: injectedProps.parentValue,
            mode: fieldConfig?.mode,
            placeholder:
              (stableChildren.props as any).placeholder ??
              fieldConfig?.placeholder,
          })
        : stableChildren;

  return (
    <DependentContext.Provider value={contextValue}>
      {content}
    </DependentContext.Provider>
  );
}

export const DependentWrapper = memo(DependentWrapperInner, arePropsEqual);

export default DependentWrapper;