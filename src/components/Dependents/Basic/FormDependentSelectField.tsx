/**
 * FormDependentSelectField - Ant Design Form Integration
 *
 * A select component designed for use within Ant Design Form.
 * Wraps Select in Form.Item and handles bidirectional sync with store.
 *
 * Data flow:
 * 1. User selects → Store (cascade logic) → Form
 * 2. Store cascade-delete → Form update
 *
 * For standalone usage (no Form), use DependentSelectField instead.
 * For other form libraries (RHF, Formik), use DependentFieldWrapper.
 */

import type { FormItemProps, SelectProps } from 'antd';
import { Form, Spin } from 'antd';
import React, { useMemo } from 'react';

import { useDependentField } from './context';
import { SyncedSelect } from './SyncedSelect';
import type { SelectOption } from './types';
import { formatOptionsForSelect } from './utils';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Props for FormDependentSelectField component.
 */
export interface FormDependentSelectFieldProps {
  /** Field name (must match a config in DependentSelectProvider) */
  name: string;

  /** Form.Item label */
  label?: React.ReactNode;

  /** Form.Item validation rules */
  rules?: FormItemProps['rules'];

  /** Override disabled state */
  disabled?: boolean;

  /**
   * External options (overrides config.options).
   * Use this when fetching options via React Query or similar.
   */
  options?: SelectOption[];

  /**
   * External loading state (overrides store loading).
   * Use this when you control loading via React Query.
   */
  loading?: boolean;

  /** Additional Form.Item props */
  formItemProps?: Omit<FormItemProps, 'name' | 'label' | 'rules'>;

  /**
   * Additional Select props.
   * Note: value, onChange, options, mode, loading, disabled are controlled.
   */
  selectProps?: Omit<
    SelectProps,
    'value' | 'onChange' | 'options' | 'mode' | 'loading' | 'disabled'
  >;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Dependent select field for Ant Design Form.
 *
 * Features:
 * - Integrates with Form.Item (validation, layout, etc.)
 * - Bidirectional sync between Form and Store
 * - Supports external options (React Query)
 * - Auto-disables when parent has no value
 * - Handles cascade delete automatically
 *
 * @param props - Component props
 * @returns Form.Item with Select or null if no config
 *
 * @example Basic usage
 * ```tsx
 * <Form form={form}>
 *   <DependentSelectProvider configs={configs} adapter={adapter}>
 *     <FormDependentSelectField name="country" label="Country" />
 *     <FormDependentSelectField name="province" label="Province" />
 *     <FormDependentSelectField name="city" label="City" />
 *   </DependentSelectProvider>
 * </Form>
 * ```
 *
 * @example With React Query
 * ```tsx
 * function ProvinceSelect() {
 *   const { parentValue } = useDependentField('province');
 *
 *   const { data: provinces, isLoading } = useQuery({
 *     queryKey: ['provinces', parentValue],
 *     queryFn: () => fetchProvinces(parentValue),
 *     enabled: !!parentValue,
 *   });
 *
 *   return (
 *     <FormDependentSelectField
 *       name="province"
 *       label="Province"
 *       options={provinces}
 *       loading={isLoading}
 *     />
 *   );
 * }
 * ```
 *
 * @example With validation
 * ```tsx
 * <FormDependentSelectField
 *   name="country"
 *   label="Country"
 *   rules={[{ required: true, message: 'Please select a country' }]}
 * />
 * ```
 */
export function FormDependentSelectField({
  name,
  label,
  rules,
  disabled,
  options: externalOptions,
  loading: externalLoading,
  formItemProps,
  selectProps,
}: FormDependentSelectFieldProps) {
  // Get field state from store via hook
  const {
    config: fieldConfig,
    options: storeOptions,
    value: storeValue,
    isLoading: storeLoading,
    isDisabledByParent,
    onChange: handleStoreChange,
  } = useDependentField(name, { options: externalOptions });

  // Resolve loading state (external takes priority)
  const isLoading = externalLoading ?? storeLoading;

  // Format options for Ant Design Select
  const formattedOptions = useMemo(() => {
    const options = externalOptions ?? storeOptions;
    return formatOptionsForSelect(options);
  }, [externalOptions, storeOptions]);

  // Warn in development if config not found
  if (!fieldConfig) {
    console.warn(
      `[FormDependentSelectField] No config found for field "${name}". ` +
        'Make sure the field name matches a config in DependentSelectProvider.',
    );
    return null;
  }

  // Determine final disabled state
  const isFieldDisabled = disabled || isDisabledByParent;

  return (
    <Form.Item name={name} label={label} rules={rules} {...formItemProps}>
      <SyncedSelect
        // Sync props
        storeValue={storeValue}
        onStoreChange={handleStoreChange}
        fieldName={name}
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
        style={{ minWidth: 200 }}
        // Spread config selectProps
        {...fieldConfig.selectProps}
        // Spread component selectProps last (highest priority)
        {...selectProps}
      />
    </Form.Item>
  );
}