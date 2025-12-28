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

import React, { createContext, isValidElement, memo, useContext, useMemo } from 'react';
import type { ReactElement, ReactNode } from 'react';

import { RenderableChildren, useAutoRegistration, useStableChildren } from '../../hooks';
import type { XSelectOption, FormattedOption, DependentContextValue } from '../../types';
import { useUnifiedField } from './useUnifiedField';

// ============================================================================
// TYPES
// ============================================================================

/** Props injected into children. */
export interface DependentInjectedProps {
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
  parentValue?: unknown;
  options?: FormattedOption[];
  loading?: boolean;
  name: string
}

/** Props for DependentWrapper. */
export interface DependentWrapperProps {
  /** Field name (must match config in Provider) */
  name: string;
  /** Parent field dependency (for auto-registration in dynamic mode) */
  dependsOn?: string | string[];
  /** Display label */
  label?: ReactNode;
  /** Override disabled state */
  disabled?: boolean;
  /** External options (override config options) */
  options?: XSelectOption[];
  /** External loading state */
  loading?: boolean;
  /** Selection mode */
  mode?: 'multiple' | 'tags';
  /** Placeholder text */
  placeholder?: string;
  /** Children - ReactElement or render function */
  children: RenderableChildren<DependentInjectedProps>;
}

// ============================================================================
// CONTEXT
// ============================================================================

export const DependentContext = createContext<DependentContextValue | null>(null);

/** Hook to get context from DependentWrapper (if nested). */
export function useDependentContext(): DependentContextValue | null {
  return useContext(DependentContext);
}

/** Props that can be passed to children element. */
interface ChildSelectProps {
  value?: unknown;
  onChange?: (value: unknown) => void;
  disabled?: boolean;
  options?: FormattedOption[];
  loading?: boolean;
  parentValue?: unknown;
  mode?: 'multiple' | 'tags';
  name: string
}

/** Clone element with merged props (child props take priority). */
function cloneWithProps(
  element: ReactElement<ChildSelectProps>,
  injectedProps: DependentInjectedProps,
  mode?: 'multiple' | 'tags',
): ReactElement<ChildSelectProps> {
  const childProps = element.props;
  return React.cloneElement(element, {
    ...childProps,
    name: childProps.name ?? injectedProps.name,
    value: childProps.value ?? injectedProps.value,
    onChange: childProps.onChange ?? injectedProps.onChange,
    disabled: childProps.disabled ?? injectedProps.disabled,
    options: childProps.options ?? injectedProps.options,
    loading: childProps.loading ?? injectedProps.loading,
    parentValue: childProps.parentValue ?? injectedProps.parentValue,
    mode: childProps.mode ?? mode,
  });
}

// ============================================================================
// COMPONENT
// ============================================================================

function DependentWrapperInner({
  name,
  dependsOn,
  mode,
  disabled: disabledProp,
  options: externalOptions,
  loading: externalLoading,
  children,
  ...restProps
}: DependentWrapperProps) {
  console.log("DependentWrapperInner re-render", name);
  const stableChildren = useStableChildren(children);

  // Auto-register if field not pre-configured (dynamic mode)
  const { isDynamicMode } = useAutoRegistration({
    name,
    dependsOn,
    options: externalOptions,
    mode,
  });

  // Get field state from store (Store is single source of truth)
  // Form.Item may inject value/onChange but we ignore them
  // Adapter handles Store → Form sync
  const {
    config: fieldConfig,
    options: storeOptions,
    value,
    parentValue,
    parentValues,
    isLoading: storeLoading,
    isDisabledByParent,
    onChange,
  } = useUnifiedField(name, { options: externalOptions });

  // Resolve states
  const loading = externalLoading ?? storeLoading;
  const disabled = disabledProp || isDisabledByParent;
  const options = externalOptions ?? storeOptions;

  // Build injected props
  const injectedProps: DependentInjectedProps = {
    ...restProps,
    name,
    value,
    parentValue,
    disabled,
    options,
    loading,
    onChange,
  };

  // Build context value for nested wrappers
  const contextValue: DependentContextValue = useMemo(
    () => ({
      name,
      value,
      parentValue,
      parentValues,
      onChange,
      isDisabledByParent: disabled,
      isLoading: loading,
      hasDependency: !!fieldConfig?.dependsOn,
    }),
    [name, value, parentValue, parentValues, onChange, disabled, loading, fieldConfig?.dependsOn],
  );

  // Warn if field not found
  if (!fieldConfig && !isDynamicMode) {
    console.warn(
      `[DependentWrapper] No config found for field "${name}". ` +
        'Make sure the field name matches a config in XSelectProvider.',
    );
  }

  // Render content
  const content =
    typeof stableChildren === 'function'
      ? stableChildren(injectedProps)
      : isValidElement<ChildSelectProps>(stableChildren)
        ? cloneWithProps(stableChildren, injectedProps, fieldConfig?.mode)
        : stableChildren;

  return (
    <DependentContext.Provider value={contextValue}>
      {content}
    </DependentContext.Provider>
  );
}

export const DependentWrapper = memo(DependentWrapperInner);
export default DependentWrapper;