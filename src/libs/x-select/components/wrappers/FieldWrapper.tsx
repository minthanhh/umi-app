/**
 * FieldWrapper - Generic Field Wrapper for Non-Select Fields
 *
 * Lightweight wrapper for dependent fields that are NOT selects.
 * Use this for Input, TextArea, Checkbox, DatePicker, etc.
 *
 * Features:
 * - Auto-sync value from store
 * - Auto-disable when parent has no value
 * - Access to parent value for conditional rendering
 * - No options/filtering logic (lighter than DependentWrapper)
 *
 * @example Basic Input
 * ```tsx
 * <XSelect.Field name="description" dependsOn="status">
 *   {({ value, onChange, disabled }) => (
 *     <Input.TextArea
 *       value={value}
 *       onChange={(e) => onChange(e.target.value)}
 *       disabled={disabled}
 *     />
 *   )}
 * </XSelect.Field>
 * ```
 *
 * @example Conditional rendering based on parent
 * ```tsx
 * <XSelect.Field name="details" dependsOn="type">
 *   {({ value, onChange, parentValue }) => {
 *     if (parentValue === 'text') return <Input value={value} onChange={e => onChange(e.target.value)} />;
 *     if (parentValue === 'number') return <InputNumber value={value} onChange={onChange} />;
 *     if (parentValue === 'date') return <DatePicker value={value} onChange={onChange} />;
 *     return <Input value={value} onChange={e => onChange(e.target.value)} placeholder="Select type first" disabled />;
 *   }}
 * </XSelect.Field>
 * ```
 *
 * @example With validation based on parent
 * ```tsx
 * <XSelect.Field name="amount" dependsOn="currency">
 *   {({ value, onChange, parentValue, disabled }) => (
 *     <InputNumber
 *       value={value}
 *       onChange={onChange}
 *       disabled={disabled}
 *       prefix={parentValue === 'USD' ? '$' : parentValue === 'VND' ? '₫' : ''}
 *       min={parentValue === 'VND' ? 1000 : 1}
 *     />
 *   )}
 * </XSelect.Field>
 * ```
 */

import React, { isValidElement, memo, useRef } from 'react';
import type { ReactElement, ReactNode } from 'react';

import { useXSelectField } from '../../contexts';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Props injected into children.
 */
export interface FieldInjectedProps {
  /** Current value */
  value: unknown;

  /** Change handler - call with new value directly */
  onChange: (value: unknown) => void;

  /** Disabled when parent has no value */
  disabled: boolean;

  /** Parent value (single parent) */
  parentValue?: unknown;

  /** Parent values (multiple parents) - Record<parentFieldName, value> */
  parentValues?: Record<string, unknown>;

  /** Loading state from store */
  isLoading: boolean;

  /** Field name */
  name: string;
}

/**
 * Props for FieldWrapper.
 */
export interface FieldWrapperProps {
  /** Field name (must match config in Provider) */
  name: string;

  /** Override disabled state */
  disabled?: boolean;

  /** Children - render function (recommended) or ReactElement */
  children: ((props: FieldInjectedProps) => ReactNode) | ReactElement;
}

// ============================================================================
// HELPERS
// ============================================================================

function areChildrenEqual(
  a: FieldWrapperProps['children'],
  b: FieldWrapperProps['children'],
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
  prevProps: FieldWrapperProps,
  nextProps: FieldWrapperProps,
): boolean {
  if (prevProps.name !== nextProps.name) return false;
  if (prevProps.disabled !== nextProps.disabled) return false;
  if (!areChildrenEqual(prevProps.children, nextProps.children)) return false;

  return true;
}

// ============================================================================
// COMPONENT
// ============================================================================

function FieldWrapperInner({
  name,
  disabled: disabledProp,
  children,
}: FieldWrapperProps) {
  const childrenRef = useRef(children);

  // Stabilize children reference
  if (isValidElement(children) && isValidElement(childrenRef.current)) {
    if (
      children.type !== (childrenRef.current as ReactElement).type ||
      children.key !== (childrenRef.current as ReactElement).key
    ) {
      childrenRef.current = children;
    }
  } else if (children !== childrenRef.current) {
    childrenRef.current = children;
  }

  const stableChildren = childrenRef.current;

  // Get field state from store (without options logic)
  const {
    config: fieldConfig,
    value,
    parentValue,
    parentValues,
    isLoading,
    isDisabledByParent,
    onChange,
  } = useXSelectField(name);

  const isDisabled = disabledProp || isDisabledByParent;

  const injectedProps: FieldInjectedProps = {
    name,
    value,
    onChange,
    disabled: isDisabled,
    parentValue,
    parentValues,
    isLoading,
  };

  if (!fieldConfig) {
    console.warn(
      `[FieldWrapper] No config found for field "${name}". ` +
        'Make sure the field name matches a config in XSelectProvider.',
    );
  }

  // Render
  if (typeof stableChildren === 'function') {
    return <>{stableChildren(injectedProps)}</>;
  }

  if (isValidElement(stableChildren)) {
    const childProps = stableChildren.props as Record<string, unknown>;

    return React.cloneElement(stableChildren as ReactElement<Record<string, unknown>>, {
      value: childProps.value ?? injectedProps.value,
      onChange: childProps.onChange ?? injectedProps.onChange,
      disabled: childProps.disabled ?? injectedProps.disabled,
    });
  }

  return <>{stableChildren}</>;
}

export const FieldWrapper = memo(FieldWrapperInner, arePropsEqual);

export default FieldWrapper;
