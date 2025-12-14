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
  useContext,
  useMemo,
} from 'react';

import { useDependentField } from '../context';
import { formatOptionsForSelect } from '../utils';
import type {
  DependentContextValue,
  DependentInjectedProps,
  DependentWrapperProps,
} from './types';

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

export function DependentWrapper({
  name,
  disabled: disabledProp,
  options: externalOptions,
  loading: externalLoading,
  children,
}: DependentWrapperProps) {
  // Get field state from store
  const {
    config: fieldConfig,
    options: storeOptions,
    value,
    parentValue,
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
      onChange,
      isDisabledByParent: isDisabled,
      isLoading,
      hasDependency, // Add this to tell InfiniteWrapper if parent check is needed
    }),
    [name, value, parentValue, onChange, isDisabled, isLoading, hasDependency],
  );

  // Warn if no config found
  if (!fieldConfig) {
    console.warn(
      `[SmartSelect.Dependent] No config found for field "${name}". ` +
        'Make sure the field name matches a config in DependentSelectProvider.',
    );
  }

  // Render
  const content =
    typeof children === 'function'
      ? children(injectedProps)
      : isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<any>, {
            ...injectedProps,
            // Don't override if child already has these props
            value: (children.props as any).value ?? injectedProps.value,
            onChange: (children.props as any).onChange ?? injectedProps.onChange,
            disabled:
              (children.props as any).disabled ?? injectedProps.disabled,
            options: (children.props as any).options ?? injectedProps.options,
            loading: (children.props as any).loading ?? injectedProps.loading,
            // Always pass parentValue for InfiniteWrapper
            parentValue: injectedProps.parentValue,
            // Pass mode from config
            mode: fieldConfig?.mode,
            placeholder:
              (children.props as any).placeholder ?? fieldConfig?.placeholder,
          })
        : children;

  return (
    <DependentContext.Provider value={contextValue}>
      {content}
    </DependentContext.Provider>
  );
}

export default DependentWrapper;