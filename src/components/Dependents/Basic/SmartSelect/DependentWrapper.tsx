/**
 * SmartSelect.Dependent - Dependent Field Wrapper
 *
 * Wrapper component cho dependent/cascading select.
 * Inject các props cần thiết vào children (value, onChange, disabled, parentValue, options).
 *
 * Features:
 * - Tự động lấy value từ store
 * - Tự động filter options theo parent value
 * - Tự động disable khi parent chưa có value
 * - Hỗ trợ cả render props và React.cloneElement
 *
 * @example Basic usage
 * ```tsx
 * <SmartSelect.Dependent name="province">
 *   <Select placeholder="Select province" />
 * </SmartSelect.Dependent>
 * ```
 *
 * @example With render props
 * ```tsx
 * <SmartSelect.Dependent name="city">
 *   {({ value, onChange, disabled, options }) => (
 *     <Select
 *       value={value}
 *       onChange={onChange}
 *       disabled={disabled}
 *       options={options}
 *     />
 *   )}
 * </SmartSelect.Dependent>
 * ```
 *
 * @example Nested with InfiniteWrapper
 * ```tsx
 * <SmartSelect.Dependent name="city">
 *   <SmartSelect.Infinite queryKey="cities" fetchList={fetchCities}>
 *     <Select placeholder="Select city" />
 *   </SmartSelect.Infinite>
 * </SmartSelect.Dependent>
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

import { useDependentField } from '../context';
import type { SelectOption } from '../types';
import { formatOptionsForSelect } from '../utils';
import type {
  DependentContextValue,
  DependentInjectedProps,
  DependentWrapperProps,
} from './types';

// ============================================================================
// MEMO HELPERS
// ============================================================================

/**
 * Shallow compare two arrays of SelectOption
 */
function areOptionsEqual(
  a: SelectOption[] | undefined,
  b: SelectOption[] | undefined,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].value !== b[i].value || a[i].label !== b[i].label) return false;
  }
  return true;
}

/**
 * Compare children by type and key (not by reference)
 * This allows memo to work even when parent re-renders
 */
function areChildrenEqual(
  a: DependentWrapperProps['children'],
  b: DependentWrapperProps['children'],
): boolean {
  // Same reference
  if (a === b) return true;

  // Both are valid elements - compare type and key
  if (isValidElement(a) && isValidElement(b)) {
    return a.type === b.type && a.key === b.key;
  }

  // Both are functions (render props)
  if (typeof a === 'function' && typeof b === 'function') {
    return a === b;
  }

  return false;
}

/**
 * Custom comparison for DependentWrapper props
 */
function arePropsEqual(
  prevProps: DependentWrapperProps,
  nextProps: DependentWrapperProps,
): boolean {
  // Compare primitive props
  if (prevProps.name !== nextProps.name) return false;
  if (prevProps.disabled !== nextProps.disabled) return false;
  if (prevProps.loading !== nextProps.loading) return false;

  // Compare options array
  if (!areOptionsEqual(prevProps.options, nextProps.options)) return false;

  // Compare children by type/key (not reference)
  if (!areChildrenEqual(prevProps.children, nextProps.children)) return false;

  return true;
}

// ============================================================================
// CONTEXT
// ============================================================================

/**
 * Context để truyền data từ DependentWrapper sang InfiniteWrapper
 * khi chúng được nest với nhau.
 */
export const DependentContext = createContext<DependentContextValue | null>(
  null,
);

/**
 * Hook để lấy context từ DependentWrapper (nếu có)
 */
export function useDependentContext(): DependentContextValue | null {
  return useContext(DependentContext);
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Internal component - will be wrapped with memo
 */
function DependentWrapperInner({
  name,
  disabled: disabledProp,
  options: externalOptions,
  loading: externalLoading,
  children,
}: DependentWrapperProps) {
  // Keep stable reference to children across re-renders
  // This is important because parent re-renders create new children references
  const childrenRef = useRef(children);

  // Update ref only when children type/key changes (not on every parent re-render)
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

  // Get field state from store
  const {
    config: fieldConfig,
    options: storeOptions,
    value,
    parentValue,
    parentValues,
    isLoading: storeLoading,
    isDisabledByParent,
    onChange,
  } = useDependentField(name, { options: externalOptions });

  // Resolve options
  const resolvedOptions = externalOptions ?? storeOptions;

  // Format options for Select
  const formattedOptions = useMemo(
    () => formatOptionsForSelect(resolvedOptions),
    [resolvedOptions],
  );

  // Resolve loading state
  const isLoading = externalLoading ?? storeLoading;

  // Resolve disabled state
  const isDisabled = disabledProp || isDisabledByParent;

  // Build props to inject
  const injectedProps: DependentInjectedProps = {
    value,
    onChange,
    disabled: isDisabled,
    parentValue,
    options: formattedOptions,
    loading: isLoading,
  };

  // Check if this field has a parent dependency
  const hasDependency = !!fieldConfig?.dependsOn;

  // Build context value for nested InfiniteWrapper
  const contextValue: DependentContextValue = useMemo(
    () => ({
      name,
      value,
      parentValue,
      parentValues,
      onChange,
      isDisabledByParent: isDisabled,
      isLoading,
      hasDependency, // Add this to tell InfiniteWrapper if parent check is needed
    }),
    [name, value, parentValue, parentValues, onChange, isDisabled, isLoading, hasDependency],
  );

  // Warn if no config found
  if (!fieldConfig) {
    console.warn(
      `[SmartSelect.Dependent] No config found for field "${name}". ` +
        'Make sure the field name matches a config in DependentSelectProvider.',
    );
  }

  // Render - use stableChildren to avoid unnecessary re-renders
  // IMPORTANT: For value/onChange, we MUST use current children.props (not stableChildren.props)
  // because React Hook Form's Controller provides new field.value/field.onChange on each render.
  // Using stableChildren.props would cause stale closures.
  const currentChildProps = isValidElement(children) ? (children.props as Record<string, unknown>) : {};

  const content =
    typeof stableChildren === 'function'
      ? stableChildren(injectedProps)
      : isValidElement(stableChildren)
        ? React.cloneElement(stableChildren as React.ReactElement<any>, {
            ...injectedProps,
            // Don't override if child already has these props
            // Use currentChildProps for value/onChange to support controlled components (React Hook Form, etc.)
            value: currentChildProps.value ?? injectedProps.value,
            onChange: currentChildProps.onChange ?? injectedProps.onChange,
            disabled:
              (stableChildren.props as any).disabled ?? injectedProps.disabled,
            options:
              (stableChildren.props as any).options ?? injectedProps.options,
            loading:
              (stableChildren.props as any).loading ?? injectedProps.loading,
            // Always pass parentValue for InfiniteWrapper
            parentValue: injectedProps.parentValue,
            // Pass mode from config
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

/**
 * Memoized DependentWrapper to prevent unnecessary re-renders
 * when parent components (like Form) re-render
 */
export const DependentWrapper = memo(DependentWrapperInner, arePropsEqual);

export default DependentWrapper;