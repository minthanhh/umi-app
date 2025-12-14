/**
 * DependentSelectField - Standalone Select Component
 *
 * A simple select component that integrates with DependentSelectProvider.
 * Use this for standalone (non-form) usage where you don't need Form.Item wrapper.
 *
 * For form integration with Ant Design Form, use FormDependentSelectField instead.
 */

import { Select, Spin } from 'antd';
import { useMemo } from 'react';

import { useDependentField } from './context';
import type { DependentSelectFieldProps } from './types';
import { formatOptionsForSelect } from './utils';

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Standalone dependent select field component.
 *
 * Features:
 * - Automatically subscribes to store changes
 * - Filters options based on parent field value
 * - Handles loading state
 * - Auto-disables when parent has no value
 *
 * @param props - Component props
 * @returns Select component or null if no config found
 *
 * @example Basic usage
 * ```tsx
 * <DependentSelectProvider configs={configs}>
 *   <DependentSelectField name="country" />
 *   <DependentSelectField name="province" />
 *   <DependentSelectField name="city" />
 * </DependentSelectProvider>
 * ```
 *
 * @example With custom styling
 * ```tsx
 * <DependentSelectField
 *   name="country"
 *   className="custom-select"
 *   style={{ width: 300 }}
 * />
 * ```
 *
 * @example Disabled state
 * ```tsx
 * <DependentSelectField name="country" disabled={isReadOnly} />
 * ```
 */
export function DependentSelectField({
  name,
  disabled,
  className,
  style,
}: DependentSelectFieldProps) {
  // Get field state from store via hook
  const {
    config: fieldConfig,
    options: rawOptions,
    value: fieldValue,
    isLoading,
    isDisabledByParent,
    onChange: handleFieldChange,
  } = useDependentField(name);

  // Format options for Ant Design Select (memoized for performance)
  const formattedOptions = useMemo(
    () => formatOptionsForSelect(rawOptions),
    [rawOptions],
  );

  // Warn in development if config not found
  if (!fieldConfig) {
    console.warn(
      `[DependentSelectField] No config found for field "${name}". ` +
        'Make sure the field name matches a config in DependentSelectProvider.',
    );
    return null;
  }

  // Determine final disabled state
  const isFieldDisabled = disabled || isDisabledByParent;

  return (
    <Select
      // Value & Change handler
      value={fieldValue}
      onChange={handleFieldChange}
      // Options
      options={formattedOptions}
      // Config-based props
      mode={fieldConfig.mode}
      placeholder={fieldConfig.placeholder}
      // State
      disabled={isFieldDisabled}
      loading={isLoading}
      // Default behaviors
      allowClear
      showSearch
      optionFilterProp="label"
      // Loading indicator
      notFoundContent={isLoading ? <Spin size="small" /> : undefined}
      // Styling
      className={className}
      style={{ minWidth: 200, ...style }}
      // Spread additional config selectProps last (allows override)
      {...fieldConfig.selectProps}
    />
  );
}